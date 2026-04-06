import { useState, useEffect, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { FocusSession, EnergyTag, CompletionStatus, EnvironmentType } from '../../types';
import { Play, Square, Timer, Activity, Pause, RotateCcw, Users } from 'lucide-react';
import UrgeSurfModal from '../nutrition/UrgeSurfModal';
import { useBodyDoubling } from '../../hooks/useBodyDoubling';

const ENERGY_TAGS: EnergyTag[] = ['deep', 'medium', 'low', 'autopilot'];
const ENERGY_COLORS: Record<EnergyTag, string> = {
  deep: 'text-primary',
  medium: 'text-warning',
  low: 'text-text-muted',
  autopilot: 'text-danger',
};
const COMPLETION_OPTIONS: CompletionStatus[] = ['completed', 'partial', 'abandoned'];
const ENVIRONMENT_OPTIONS: { value: EnvironmentType; emoji: string }[] = [
  { value: 'silence',     emoji: '🔇' },
  { value: 'lo-fi',       emoji: '🎵' },
  { value: 'music',       emoji: '🎧' },
  { value: 'white noise', emoji: '🌊' },
  { value: 'café',        emoji: '☕' },
  { value: 'office',      emoji: '🏢' },
];

const POMO_PRESETS = [
  { focus: 25, break: 5,  label: '25/5' },
  { focus: 45, break: 10, label: '45/10' },
  { focus: 15, break: 3,  label: '15/3' },
  { focus: 52, break: 17, label: '52/17' },
];

// ── Upward-counting free timer ─────────────────────────────────────────
function useTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed * 1000;
      const id = setInterval(() => {
        setElapsed(Math.floor((Date.now() - startRef.current!) / 1000));
      }, 1000);
      return () => clearInterval(id);
    }
  }, [running]);

  const reset = () => { setElapsed(0); startRef.current = null; };
  const fmt = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  return { elapsed, fmt, reset };
}

// ── Pomodoro countdown timer ───────────────────────────────────────────
function usePomoTimer(running: boolean, totalSeconds: number, onComplete: () => void) {
  const [remaining, setRemaining] = useState(totalSeconds);
  const endRef = useRef<number | null>(null);
  // Keep onComplete ref fresh so the interval never has a stale closure
  const onCompleteRef = useRef(onComplete);
  useEffect(() => { onCompleteRef.current = onComplete; });

  // Restart the countdown whenever running flips on OR totalSeconds changes (phase switch)
  useEffect(() => {
    if (!running) { endRef.current = null; return; }
    endRef.current = Date.now() + totalSeconds * 1000;
    setRemaining(totalSeconds);
    const id = setInterval(() => {
      const left = Math.max(0, Math.round((endRef.current! - Date.now()) / 1000));
      setRemaining(left);
      if (left === 0) {
        clearInterval(id);
        onCompleteRef.current();
      }
    }, 500);
    return () => clearInterval(id);
  }, [running, totalSeconds]);

  const reset = (secs: number) => { setRemaining(secs); endRef.current = null; };
  const fmt = `${String(Math.floor(remaining / 60)).padStart(2, '0')}:${String(remaining % 60).padStart(2, '0')}`;
  const pct = totalSeconds > 0 ? 1 - remaining / totalSeconds : 0;
  return { remaining, fmt, pct, reset };
}

// ── Completion sound (Web Audio API) ──────────────────────────────────
function playCompletionSound() {
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return;
    const ctx = new Ctx();
    [[880, 0], [1100, 0.18]].forEach(([freq, delay]) => {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.frequency.value = freq;
      gain.gain.setValueAtTime(0.25, ctx.currentTime + delay);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + delay + 0.35);
      osc.start(ctx.currentTime + delay);
      osc.stop(ctx.currentTime + delay + 0.35);
    });
  } catch { /* AudioContext unavailable */ }
}

// ── SVG ring ──────────────────────────────────────────────────────────
function ProgressRing({ pct, size = 200, strokeWidth = 8, color = '#169B62', children }: {
  pct: number; size?: number; strokeWidth?: number; color?: string; children?: React.ReactNode;
}) {
  const r = (size - strokeWidth * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#1E3D28" strokeWidth={strokeWidth} />
        <circle
          cx={size/2} cy={size/2} r={r} fill="none"
          stroke={color} strokeWidth={strokeWidth}
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 0.5s linear' }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {children}
      </div>
    </div>
  );
}

function requestNotificationPermission() {
  if ('Notification' in window && Notification.permission === 'default') {
    Notification.requestPermission();
  }
}

function sendNotification(title: string, body: string) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification(title, { body, icon: '/favicon.ico' });
  }
}

export default function ProductivityPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  // ── Mode: 'free' = upward timer, 'pomo' = countdown ──────────────────
  const [mode, setMode] = useState<'free' | 'pomo'>('free');
  const [pomoPreset, setPomoPreset] = useState(POMO_PRESETS[0]);
  const [pomoPhase, setPomoPhase] = useState<'focus' | 'break'>('focus');
  const [pomoCount, setPomoCount] = useState(0); // completed pomodoros
  const [autoBreak, setAutoBreak] = useState(false);

  // ── Shared session state ──────────────────────────────────────────────
  const [running, setRunning] = useState(false);
  const [paused, setPaused] = useState(false);
  const [pauseCount, setPauseCount] = useState(0);
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [taskLabel, setTaskLabel] = useState('');
  const [energyTag, setEnergyTag] = useState<EnergyTag>('deep');
  const [environment, setEnvironment] = useState<EnvironmentType>('silence');
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>('completed');
  const [notes, setNotes] = useState('');
  const [interruptions, setInterruptions] = useState(0);
  const [showUrgeSurf, setShowUrgeSurf] = useState<{ show: boolean; source: 'productivity_button' | 'focus_nudge' }>({ show: false, source: 'productivity_button' });
  const [showPauseUrgeSurf, setShowPauseUrgeSurf] = useState(false);

  const isActive = running && !paused;

  // Free timer (always tracking elapsed regardless of mode — used for save)
  const { elapsed, fmt: freeFmt, reset: freeReset } = useTimer(isActive && mode === 'free');

  // Track elapsed for pomo mode separately
  const pomoCycleSecs = pomoPhase === 'focus'
    ? pomoPreset.focus * 60
    : pomoPreset.break * 60;

  // Track total focus-only elapsed for pomo sessions (break time excluded)
  const pomoElapsedRef = useRef(0);
  const [pomoClock, setPomoClock] = useState(0);
  const pomoClockRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Only count time during focus phase, not break
  useEffect(() => {
    if (isActive && mode === 'pomo' && pomoPhase === 'focus') {
      pomoClockRef.current = setInterval(() => {
        pomoElapsedRef.current += 1;
        setPomoClock(c => c + 1);
      }, 1000);
      return () => { if (pomoClockRef.current) clearInterval(pomoClockRef.current); };
    }
  }, [isActive, mode, pomoPhase]);

  // Ref so handlePomoComplete always reads latest session metadata without extra deps
  const sessionDataRef = useRef({ sessionStart, taskLabel, environment, energyTag, pauseCount });
  useEffect(() => { sessionDataRef.current = { sessionStart, taskLabel, environment, energyTag, pauseCount }; });
  const userRef = useRef(user);
  useEffect(() => { userRef.current = user; });

  const handlePomoComplete = useCallback(() => {
    if (pomoPhase === 'focus') {
      setPomoCount(c => c + 1);
      playCompletionSound();
      sendNotification('Pomodoro complete! 🍅', `Take a ${pomoPreset.break}-min break. Well done!`);
      // Auto-save this focus block to focus hours
      const { sessionStart: start, taskLabel: label, environment: env, energyTag: energy, pauseCount: pauses } = sessionDataRef.current;
      if (start && userRef.current?.id) {
        supabase.from('focus_sessions').insert({
          user_id: userRef.current.id,
          started_at: start,
          ended_at: new Date().toISOString(),
          duration_minutes: pomoPreset.focus,
          task_label: label || null,
          music_type: env,
          energy_tag: energy,
          completion_status: 'completed',
          interruption_count: pauses,
          notes: null,
        }).then(() => {
          queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
          queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
          queryClient.invalidateQueries({ queryKey: ['streak'] });
        });
      }
      // Reset focus elapsed so next block starts fresh
      pomoElapsedRef.current = 0;
      setPomoClock(0);
      setPomoPhase('break');
      setAutoBreak(true);
    } else {
      playCompletionSound();
      sendNotification('Break over!', `Ready for the next ${pomoPreset.focus}-min focus block?`);
      setPomoPhase('focus');
      setAutoBreak(false);
      setRunning(false); // stop after break — let user start next intentionally
    }
  }, [pomoPhase, pomoPreset, queryClient]);

  const { fmt: pomoFmt, pct: pomoPct, reset: pomoReset } = usePomoTimer(
    isActive && mode === 'pomo',
    pomoCycleSecs,
    handlePomoComplete
  );

  // Update document title
  const displayFmt = mode === 'free' ? freeFmt : pomoFmt;
  useEffect(() => {
    if (running) {
      const prefix = paused ? '⏸ ' : mode === 'pomo' ? (pomoPhase === 'focus' ? '🍅 ' : '☕ ') : '⏱ ';
      document.title = `${prefix}${displayFmt} — Aware`;
    } else {
      document.title = 'Aware';
    }
    return () => { document.title = 'Aware'; };
  }, [running, paused, displayFmt, mode, pomoPhase]);

  const { data: sessions, isLoading } = useQuery({
    queryKey: ['focus-sessions', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('focus_sessions')
        .select('*')
        .eq('user_id', user!.id)
        .gte('started_at', today.toISOString())
        .order('started_at', { ascending: false });
      if (error) throw error;
      return data as FocusSession[];
    },
  });

  const actualElapsed = mode === 'free' ? elapsed : pomoClock;

  const saveMutation = useMutation({
    mutationFn: async () => {
      const mins = Math.round(actualElapsed / 60);
      const { error } = await supabase.from('focus_sessions').insert({
        user_id: user!.id,
        started_at: sessionStart,
        ended_at: new Date().toISOString(),
        duration_minutes: mins,
        task_label: taskLabel || null,
        music_type: environment,
        energy_tag: energyTag,
        completion_status: completionStatus,
        interruption_count: interruptions + pauseCount,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      setRunning(false); setPaused(false); setPauseCount(0);
      freeReset(); pomoElapsedRef.current = 0; setPomoClock(0);
      setSessionStart(null); setTaskLabel(''); setInterruptions(0); setNotes('');
      setPomoPhase('focus'); setPomoCount(0); setAutoBreak(false);
    },
  });

  const handleStart = () => {
    requestNotificationPermission();
    setSessionStart(new Date().toISOString());
    setRunning(true); setPaused(false); setPauseCount(0);
    pomoElapsedRef.current = 0; setPomoClock(0);
    pomoReset(pomoCycleSecs);
  };

  const handlePause = () => {
    setPaused(true); setPauseCount(c => c + 1);
    setShowPauseUrgeSurf(true);
  };

  const handleResume = () => { setPaused(false); setShowPauseUrgeSurf(false); };

  const handleStop = () => {
    const mins = Math.round(actualElapsed / 60);
    if (mins < 1) {
      // Nothing new to save (pomo block was already auto-saved, or session too short)
      setRunning(false); setPaused(false); setPauseCount(0);
      freeReset(); pomoElapsedRef.current = 0; setPomoClock(0);
      setSessionStart(null); setTaskLabel(''); setInterruptions(0); setNotes('');
      setPomoPhase('focus'); setPomoCount(0); setAutoBreak(false);
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
      return;
    }
    sendNotification('Focus session complete!', `You focused for ${mins} minutes. Great work!`);
    setRunning(false); setPaused(false);
    saveMutation.mutate();
  };

  const totalToday = sessions?.reduce((a, s) => a + (s.duration_minutes || 0), 0) || 0;
  const { focuserCount } = useBodyDoubling(isActive);
  const pomoRingColor = pomoPhase === 'focus' ? '#169B62' : '#818cf8';

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold text-text-main">Focus & Flow</h1>

      {/* ── Mode selector ── */}
      <div className="flex items-center gap-3">
        <div className="flex border border-border rounded-sm overflow-hidden">
          <button
            onClick={() => { if (!running) setMode('free'); }}
            disabled={running}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === 'free' ? 'bg-primary text-white' : 'bg-card text-text-muted hover:bg-forest'
            } disabled:opacity-50`}
          >
            ⏱ Free Timer
          </button>
          <button
            onClick={() => { if (!running) setMode('pomo'); }}
            disabled={running}
            className={`px-4 py-1.5 text-sm font-medium transition-colors ${
              mode === 'pomo' ? 'bg-primary text-white' : 'bg-card text-text-muted hover:bg-forest'
            } disabled:opacity-50`}
          >
            🍅 Pomodoro
          </button>
        </div>

        {mode === 'pomo' && !running && (
          <div className="flex gap-1">
            {POMO_PRESETS.map(p => (
              <button
                key={p.label}
                onClick={() => { setPomoPreset(p); setPomoPhase('focus'); pomoReset(p.focus * 60); }}
                className={`px-2.5 py-1 rounded-sm text-xs font-medium border transition-colors ${
                  pomoPreset.label === p.label
                    ? 'bg-primary/10 border-primary text-primary'
                    : 'border-border text-text-muted hover:border-primary/40'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Timer Card ── */}
      <Card>
        <CardHeader>
          <CardTitle>
            {mode === 'pomo'
              ? pomoPhase === 'focus' ? `Focus Block · ${pomoPreset.focus} min` : `Break · ${pomoPreset.break} min`
              : 'Focus Session'
            }
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">

          {/* ── Pomodoro ring ── */}
          {mode === 'pomo' ? (
            <div className="flex flex-col items-center gap-4 py-4">
              <ProgressRing pct={pomoPct} size={200} strokeWidth={10} color={pomoRingColor}>
                <div className={`text-5xl font-mono font-bold tabular-nums transition-colors ${
                  isActive ? (pomoPhase === 'focus' ? 'text-primary' : 'text-indigo-400')
                  : paused ? 'text-warning' : 'text-text-muted'
                }`}>
                  {pomoFmt}
                </div>
                <div className="text-xs text-text-muted mt-1">
                  {isActive
                    ? pomoPhase === 'focus' ? 'Stay focused 🎯' : 'Rest & recharge ☕'
                    : paused ? 'Paused' : 'Ready'}
                </div>
              </ProgressRing>

              {/* Tomato counter */}
              <div className="flex items-center gap-2">
                <div className="flex gap-1">
                  {Array.from({ length: Math.max(pomoCount, 4) }).map((_, i) => (
                    <span key={i} className={`text-xl transition-all ${i < pomoCount ? 'opacity-100 scale-100' : 'opacity-20 scale-90'}`}>
                      🍅
                    </span>
                  ))}
                </div>
                {pomoCount > 0 && (
                  <span className="text-xs text-text-muted">{pomoCount} pomodoro{pomoCount !== 1 ? 's' : ''} done</span>
                )}
              </div>

              {autoBreak && (
                <div className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500/10 border border-indigo-500/20">
                  <span className="text-indigo-400 text-sm font-medium">☕ Break time — step away from the screen</span>
                </div>
              )}
            </div>
          ) : (
            /* ── Free timer display ── */
            <div className="text-center py-6">
              <div className={`text-7xl font-mono font-bold tabular-nums transition-colors ${
                isActive ? 'text-primary' : paused ? 'text-warning' : 'text-text-muted'
              }`}>
                {freeFmt}
              </div>
              {isActive && <p className="text-sm text-text-muted mt-2 animate-pulse">Session in progress...</p>}
              {paused && <p className="text-sm text-warning mt-2">Paused — {pauseCount} pause{pauseCount !== 1 ? 's' : ''} this session</p>}
            </div>
          )}

          {/* ── Pre-session config (only when not running) ── */}
          {!running && (
            <div className="space-y-4">
              <div>
                <label className="text-xs text-text-muted mb-1 block">What are you working on?</label>
                <input
                  type="text"
                  placeholder="e.g. Write project proposal"
                  value={taskLabel}
                  onChange={(e) => setTaskLabel(e.target.value)}
                  className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary"
                />
              </div>
              <div>
                <p className="text-xs text-text-muted mb-2">Energy level going in</p>
                <div className="flex gap-2">
                  {ENERGY_TAGS.map((t) => (
                    <button key={t} onClick={() => setEnergyTag(t)}
                      className={`flex-1 py-2 rounded-sm text-sm border transition-colors duration-150 ${
                        energyTag === t ? 'bg-primary/10 border-primary text-text-main' : 'border-border text-text-muted hover:border-primary'
                      }`}>
                      <span className={ENERGY_COLORS[t]}>●</span> {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-2">Environment</p>
                <div className="flex gap-2 flex-wrap">
                  {ENVIRONMENT_OPTIONS.map(({ value, emoji }) => (
                    <button key={value} onClick={() => setEnvironment(value)}
                      className={`px-3 py-1.5 rounded-full text-sm border transition-colors duration-150 ${
                        environment === value ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'
                      }`}>
                      {emoji} {value}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ── Running session extras ── */}
          {running && (
            <div className="space-y-4">
              {showPauseUrgeSurf && (
                <div className="p-3 rounded-sm border border-warning/30 bg-warning/5 flex items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-text-main">Feeling an urge? 🧘</p>
                    <p className="text-xs text-text-muted">Take 2 min to urge surf before acting on it</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button
                      onClick={() => { setShowPauseUrgeSurf(false); setShowUrgeSurf({ show: true, source: 'focus_nudge' }); }}
                      className="px-3 py-1.5 text-xs rounded-sm border border-primary text-primary hover:bg-primary/10 transition-colors"
                    >
                      Urge Surf
                    </button>
                    <button
                      onClick={() => setShowPauseUrgeSurf(false)}
                      className="px-3 py-1.5 text-xs rounded-sm border border-border text-text-muted hover:bg-forest transition-colors"
                    >
                      Skip
                    </button>
                  </div>
                </div>
              )}

              <button
                onClick={() => setShowUrgeSurf({ show: true, source: 'productivity_button' })}
                className="w-full p-3 rounded-sm border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors text-left flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <Activity className="w-5 h-5 text-primary" />
                  <div>
                    <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">
                      Urge Surf Check-in 🧘
                    </p>
                    <p className="text-xs text-text-muted">Feeling the urge to snack or get distracted? Take a 2-min pause first →</p>
                  </div>
                </div>
              </button>

              <div>
                <p className="text-xs text-text-muted mb-2">How did it go?</p>
                <div className="flex gap-2">
                  {COMPLETION_OPTIONS.map((s) => (
                    <button key={s} onClick={() => setCompletionStatus(s)}
                      className={`flex-1 py-2 rounded-sm text-sm border transition-colors duration-150 ${
                        completionStatus === s ? 'bg-primary/10 border-primary text-text-main' : 'border-border text-text-muted hover:border-primary'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex-1">
                  <label className="text-xs text-text-muted mb-1 block">Interruptions: {interruptions}</label>
                  <input type="range" min="0" max="20" value={interruptions}
                    onChange={(e) => setInterruptions(Number(e.target.value))}
                    className="w-full accent-primary" />
                </div>
              </div>
              <textarea placeholder="Notes..." value={notes} onChange={(e) => setNotes(e.target.value)} rows={2}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary resize-none" />
            </div>
          )}

          {/* ── Controls ── */}
          <div className="flex gap-3">
            {!running ? (
              <Button variant="primary" onClick={handleStart} className="flex-1 gap-2">
                <Play className="w-4 h-4 fill-white" />
                {mode === 'pomo' ? `Start ${pomoPhase === 'focus' ? 'Focus' : 'Break'}` : 'Start Session'}
              </Button>
            ) : paused ? (
              <>
                <Button variant="primary" onClick={handleResume} className="flex-1 gap-2">
                  <Play className="w-4 h-4 fill-white" /> Resume
                </Button>
                <Button variant="secondary" onClick={handleStop} disabled={saveMutation.isPending}
                  className="gap-2 border-danger text-danger hover:bg-danger/10">
                  <Square className="w-4 h-4 fill-current" /> {saveMutation.isPending ? 'Saving...' : 'Stop'}
                </Button>
              </>
            ) : (
              <>
                <Button variant="secondary" onClick={handlePause} className="gap-2 border-warning text-warning hover:bg-warning/10">
                  <Pause className="w-4 h-4" /> Pause
                </Button>
                <Button variant="secondary" onClick={handleStop} disabled={saveMutation.isPending}
                  className="flex-1 gap-2 border-danger text-danger hover:bg-danger/10">
                  <Square className="w-4 h-4 fill-current" /> {saveMutation.isPending ? 'Saving...' : 'Stop & Save'}
                </Button>
              </>
            )}
            {mode === 'pomo' && !running && pomoCount > 0 && (
              <Button variant="secondary" onClick={() => { setPomoCount(0); setPomoPhase('focus'); pomoReset(pomoPreset.focus * 60); }}
                className="gap-1 border-border text-text-muted" title="Reset pomodoro count">
                <RotateCcw className="w-4 h-4" />
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* ── Today summary ── */}
      <div className="flex items-center gap-4 px-1 flex-wrap">
        <div className="flex items-center gap-2">
          <Timer className="w-5 h-5 text-primary" />
          <span className="text-text-muted text-sm">Total focus today:</span>
          <span className="text-text-main font-bold">{totalToday} min</span>
          {mode === 'pomo' && pomoCount > 0 && (
            <span className="text-text-muted text-sm">· {pomoCount} 🍅</span>
          )}
        </div>

        {/* Body doubling indicator */}
        {isActive && (
          <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 border border-primary/20">
            <Users className="w-3.5 h-3.5 text-primary" />
            <span className="text-xs font-medium text-primary">
              {focuserCount > 0
                ? `${focuserCount} other${focuserCount !== 1 ? 's' : ''} focusing with you`
                : 'You\'re the only one focusing right now'
              }
            </span>
          </div>
        )}
      </div>

      {/* ── Session history ── */}
      <Card>
        <CardHeader><CardTitle>Today's Sessions</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-text-muted text-sm">Loading...</p>
          ) : !sessions?.length ? (
            <p className="text-text-muted text-sm">No sessions today. Start one above!</p>
          ) : (
            <div className="space-y-3">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium text-text-main">
                      {s.task_label || 'Untitled session'}
                      <span className={`ml-2 text-xs font-normal ${ENERGY_COLORS[s.energy_tag]}`}>● {s.energy_tag}</span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">
                      {s.completion_status} · {s.interruption_count} interruptions
                      {s.environment && (
                        <span className="ml-2">
                          {ENVIRONMENT_OPTIONS.find(e => e.value === s.environment)?.emoji} {s.environment}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-bold text-text-main">{s.duration_minutes}m</div>
                    <div className="text-xs text-text-muted">
                      {new Date(s.started_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {showUrgeSurf.show && (
        <UrgeSurfModal
          triggerSource={showUrgeSurf.source}
          onClose={() => setShowUrgeSurf({ show: false, source: 'productivity_button' })}
        />
      )}
    </div>
  );
}
