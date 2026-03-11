import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { FocusSession, EnergyTag, CompletionStatus } from '../../types';
import { Play, Square, Timer } from 'lucide-react';

const ENERGY_TAGS: EnergyTag[] = ['deep', 'medium', 'low', 'autopilot'];
const ENERGY_COLORS: Record<EnergyTag, string> = {
  deep: 'text-primary',
  medium: 'text-warning',
  low: 'text-text-muted',
  autopilot: 'text-danger',
};
const COMPLETION_OPTIONS: CompletionStatus[] = ['completed', 'partial', 'abandoned'];

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

export default function ProductivityPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  const [running, setRunning] = useState(false);
  const [sessionStart, setSessionStart] = useState<string | null>(null);
  const [taskLabel, setTaskLabel] = useState('');
  const [energyTag, setEnergyTag] = useState<EnergyTag>('deep');
  const [completionStatus, setCompletionStatus] = useState<CompletionStatus>('completed');
  const [notes, setNotes] = useState('');
  const [interruptions, setInterruptions] = useState(0);

  const { elapsed, fmt, reset } = useTimer(running);

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

  const saveMutation = useMutation({
    mutationFn: async () => {
      const mins = Math.round(elapsed / 60);
      const { error } = await supabase.from('focus_sessions').insert({
        user_id: user!.id,
        started_at: sessionStart,
        ended_at: new Date().toISOString(),
        duration_minutes: mins,
        task_label: taskLabel || null,
        energy_tag: energyTag,
        completion_status: completionStatus,
        interruption_count: interruptions,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['focus-sessions'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setRunning(false);
      reset();
      setSessionStart(null);
      setTaskLabel('');
      setInterruptions(0);
      setNotes('');
    },
  });

  const handleStart = () => {
    setSessionStart(new Date().toISOString());
    setRunning(true);
  };

  const handleStop = () => {
    setRunning(false);
    saveMutation.mutate();
  };

  const totalToday = sessions?.reduce((a, s) => a + (s.duration_minutes || 0), 0) || 0;

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold text-text-main">Focus & Flow</h1>

      {/* Timer Card */}
      <Card>
        <CardHeader><CardTitle>Focus Session</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {/* Big Timer */}
          <div className="text-center py-6">
            <div className={`text-7xl font-mono font-bold tabular-nums transition-colors ${running ? 'text-primary' : 'text-text-muted'}`}>
              {fmt}
            </div>
            {running && (
              <p className="text-sm text-text-muted mt-2 animate-pulse">Session in progress...</p>
            )}
          </div>

          {/* Config (only when not running) */}
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
            </div>
          )}

          {/* Stop config */}
          {running && (
            <div className="space-y-4">
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

          <div className="flex gap-3">
            {!running ? (
              <Button variant="primary" onClick={handleStart} className="flex-1 gap-2">
                <Play className="w-4 h-4 fill-white" /> Start Session
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleStop} disabled={saveMutation.isPending} className="flex-1 gap-2 border-danger text-danger hover:bg-danger/10">
                <Square className="w-4 h-4 fill-current" /> {saveMutation.isPending ? 'Saving...' : 'Stop & Save'}
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Today Summary */}
      <div className="flex items-center gap-3 px-1">
        <Timer className="w-5 h-5 text-primary" />
        <span className="text-text-muted text-sm">Total focus today:</span>
        <span className="text-text-main font-bold">{totalToday} min</span>
      </div>

      {/* History */}
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
                      {s.completion_status} • {s.interruption_count} interruptions
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
    </div>
  );
}
