import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { TrendChart, CategoryBarChart } from '../components/charts/Charts';
import { evaluateGIRisk } from '../utils/gi';
import { getHoursBetween } from '../utils/dateHelpers';
import {
  Smile,
  Moon,
  Timer,
  Smartphone,
  Play,
  Square,
  BookText,
  Utensils,
  X,
  ChevronDown,
} from 'lucide-react';
import RightNowWidget from '../features/calendar/RightNowWidget';

// ─── Types ────────────────────────────────────────────────────────────
type ActivePanel = 'mood' | 'food' | 'focus' | null;

const MOOD_EMOJIS  = ['', '😞', '😕', '😐', '🙂', '😄'];
const MOOD_LABELS  = ['', 'Terrible', 'Poor', 'OK', 'Good', 'Great'];
const MEAL_TYPES   = ['meal', 'snack', 'caffeine', 'water', 'supplement', 'alcohol'] as const;
const GI_OPTIONS   = [
  { value: 'low',    label: 'Low GI',        color: 'text-primary'   },
  { value: 'medium', label: 'Medium GI',     color: 'text-warning'   },
  { value: 'high',   label: 'High GI',       color: 'text-danger'    },
  { value: 'zero',   label: 'No Carbs / Zero', color: 'text-text-muted' },
] as const;
type GIValue = typeof GI_OPTIONS[number]['value'];
type MealType = typeof MEAL_TYPES[number];

// ─── Focus timer hook ─────────────────────────────────────────────────
function useTimer(running: boolean) {
  const [elapsed, setElapsed] = useState(0);
  const startRef = useRef<number | null>(null);
  useEffect(() => {
    if (running) {
      startRef.current = Date.now() - elapsed * 1000;
      const id = setInterval(() => setElapsed(Math.floor((Date.now() - startRef.current!) / 1000)), 1000);
      return () => clearInterval(id);
    }
  }, [running]);
  const reset = () => { setElapsed(0); startRef.current = null; };
  const fmt = `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}`;
  return { elapsed, fmt, reset };
}

// ─── InlinePanel wrapper ──────────────────────────────────────────────
function InlinePanel({ onClose, children }: { onClose: () => void; children: React.ReactNode }) {
  return (
    <Card className="border-primary/40 bg-primary/5 relative">
      <button
        onClick={onClose}
        className="absolute top-3 right-3 text-text-muted hover:text-text-main transition-colors"
        aria-label="Close"
      >
        <X className="w-4 h-4" />
      </button>
      <CardContent className="pt-4 pb-5 px-5 space-y-4">
        {children}
      </CardContent>
    </Card>
  );
}

export default function Dashboard() {
  const { user } = useAppStore();
  const navigate  = useNavigate();
  const qc        = useQueryClient();

  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const toggle = (panel: ActivePanel) =>
    setActivePanel((prev) => (prev === panel ? null : panel));

  // ── Mood quick-log state ──
  const [quickMoodSuccess, setQuickMoodSuccess] = useState<number | null>(null);
  const moodMutation = useMutation({
    mutationFn: async (score: number) => {
      const { error } = await supabase.from('mood_logs').insert({
        user_id: user!.id,
        timestamp: new Date().toISOString(),
        mood_score: score,
        emotion_tags: [],
        stress_event: false,
        rsd_moment: false,
        notes: null,
      });
      if (error) throw error;
      return score;
    },
    onSuccess: (score) => {
      qc.invalidateQueries({ queryKey: ['mood-logs'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setQuickMoodSuccess(score);
      setTimeout(() => { setQuickMoodSuccess(null); setActivePanel(null); }, 2000);
    },
  });

  // ── Food quick-log state ──
  const [foodName, setFoodName]   = useState('');
  const [giCat, setGiCat]         = useState<GIValue>('low');
  const [mealType, setMealType]   = useState<MealType>('meal');
  const [foodSuccess, setFoodSuccess] = useState(false);
  const foodMutation = useMutation({
    mutationFn: async () => {
      if (!foodName.trim()) throw new Error('Food name required');
      const { error } = await supabase.from('food_logs').insert({
        user_id: user!.id,
        timestamp: new Date().toISOString(),
        food_name: foodName.trim(),
        gi_category: giCat,
        meal_type: mealType,
        eating_context: 'planned',
        hunger_level: 3,
        notes: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['food-logs'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setFoodName(''); setFoodSuccess(true);
      setTimeout(() => { setFoodSuccess(false); setActivePanel(null); }, 1800);
    },
  });

  // ── Focus session state ──
  const [focusRunning, setFocusRunning]     = useState(false);
  const [sessionStart, setSessionStart]     = useState<string | null>(null);
  const [taskLabel, setTaskLabel]           = useState('');
  const { elapsed, fmt, reset }             = useTimer(focusRunning);
  const focusMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('focus_sessions').insert({
        user_id: user!.id,
        started_at: sessionStart,
        ended_at: new Date().toISOString(),
        duration_minutes: Math.round(elapsed / 60),
        task_label: taskLabel || null,
        energy_tag: 'deep',
        completion_status: 'completed',
        interruption_count: 0,
        notes: null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['focus-sessions'] });
      qc.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setFocusRunning(false); reset(); setSessionStart(null); setTaskLabel('');
      setActivePanel(null);
    },
  });

  const handleStartFocus = () => {
    setSessionStart(new Date().toISOString());
    setFocusRunning(true);
  };
  const handleStopFocus = () => {
    setFocusRunning(false);
    focusMutation.mutate();
  };

  // ── Dashboard stats query ──
  const { data: todayStats, isLoading } = useQuery({
    queryKey: ['dashboard-stats', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const todayStr = today.toISOString();

      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString();

      const { data: moodData } = await supabase
        .from('mood_logs').select('mood_score')
        .eq('user_id', user!.id).gte('timestamp', todayStr)
        .order('timestamp', { ascending: false }).limit(1);

      const { data: sleepData } = await supabase
        .from('sleep_logs').select('duration_hours, quality')
        .eq('user_id', user!.id).gte('bedtime', yesterdayStr)
        .order('bedtime', { ascending: false }).limit(1);

      const { data: focusData } = await supabase
        .from('focus_sessions').select('duration_minutes, started_at')
        .eq('user_id', user!.id).gte('started_at', todayStr);

      const totalFocus = focusData?.reduce((a: number, c: any) => a + (c.duration_minutes || 0), 0) || 0;

      const focusBuckets: Record<string, number> = {
        '6am': 0, '8am': 0, '10am': 0, '12pm': 0,
        '2pm': 0, '4pm': 0, '6pm': 0, '8pm': 0,
      };
      focusData?.forEach((s: any) => {
        const hr = new Date(s.started_at).getHours();
        const label =
          hr < 7 ? '6am' : hr < 9 ? '8am' : hr < 11 ? '10am' :
          hr < 13 ? '12pm' : hr < 15 ? '2pm' : hr < 17 ? '4pm' :
          hr < 19 ? '6pm' : '8pm';
        focusBuckets[label] += s.duration_minutes || 0;
      });
      const focusTimeline = Object.entries(focusBuckets).map(([name, value]) => ({ name, value }));

      const { data: distData } = await supabase
        .from('distraction_logs').select('duration_minutes, category')
        .eq('user_id', user!.id).gte('timestamp', todayStr);

      const totalDist = distData?.reduce((a: number, c: any) => a + (c.duration_minutes || 0), 0) || 0;
      const distCats: Record<string, number> = {};
      distData?.forEach((d: any) => {
        const label = d.category?.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) || 'Other';
        distCats[label] = (distCats[label] || 0) + (d.duration_minutes || 0);
      });
      const distractionBreakdown = Object.entries(distCats).map(([name, value]) => ({ name, value }));

      const { data: foodData } = await supabase
        .from('food_logs').select('gi_category, timestamp')
        .eq('user_id', user!.id).order('timestamp', { ascending: false }).limit(1);

      let giRisk = 'safe';
      if (foodData && foodData.length > 0) {
        const hoursSince = getHoursBetween(foodData[0].timestamp, new Date().toISOString());
        giRisk = evaluateGIRisk(foodData[0].gi_category as any, hoursSince);
      }

      return {
        mood: moodData?.[0]?.mood_score || null,
        sleep: sleepData?.[0] || null,
        focusMins: totalFocus,
        distractMins: totalDist,
        giRisk: giRisk as 'safe' | 'warning' | 'danger',
        focusTimeline,
        distractionBreakdown,
      };
    },
  });

  const focusTimelineData = todayStats?.focusTimeline || [];
  const distractionData   = todayStats?.distractionBreakdown || [];

  return (
    <div className="space-y-6 pb-12">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold text-text-main">
          Hello, {user?.email?.split('@')[0]}
        </h1>
        <div className="text-sm text-text-muted">
          {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
        </div>
      </div>

      {/* ── Morning Day Ahead Prompt (before noon) ── */}
      {new Date().getHours() < 12 && (
        <button
          onClick={() => navigate('/ahead')}
          className="w-full p-4 rounded-sm border border-amber-200/50 bg-gradient-to-r from-amber-50 to-transparent
            hover:from-amber-100 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">☀️</span>
            <div>
              <p className="text-sm font-semibold text-text-main group-hover:text-amber-700 transition-colors">
                Start your day
              </p>
              <p className="text-xs text-text-muted">Review your schedule, set an intention, and pick your top priorities →</p>
            </div>
          </div>
        </button>
      )}

      {/* ── Right Now — ADHD Schedule Accountability ── */}
      <RightNowWidget />

      {/* ── Quick Action Buttons ── */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {/* Log Food */}
        <button
          onClick={() => toggle('food')}
          className={`flex flex-col items-center gap-2 py-3 px-2 rounded-sm border text-sm font-medium transition-colors duration-150 ${
            activePanel === 'food'
              ? 'bg-primary text-white border-primary'
              : 'bg-card border-border text-text-muted hover:border-primary hover:text-primary'
          }`}
        >
          <Utensils className="w-5 h-5" />
          <span>Log Food</span>
          {activePanel === 'food' ? <ChevronDown className="w-3 h-3 rotate-180" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Focus Session */}
        <button
          onClick={() => toggle('focus')}
          className={`flex flex-col items-center gap-2 py-3 px-2 rounded-sm border text-sm font-medium transition-colors duration-150 ${
            activePanel === 'focus' || focusRunning
              ? 'bg-primary text-white border-primary'
              : 'bg-card border-border text-text-muted hover:border-primary hover:text-primary'
          }`}
        >
          {focusRunning ? <Square className="w-5 h-5" /> : <Play className="w-5 h-5" />}
          <span>{focusRunning ? fmt : 'Start Focus'}</span>
          {focusRunning && <span className="text-xs opacity-80 animate-pulse">running</span>}
        </button>

        {/* Mood Check */}
        <button
          onClick={() => toggle('mood')}
          className={`flex flex-col items-center gap-2 py-3 px-2 rounded-sm border text-sm font-medium transition-colors duration-150 ${
            activePanel === 'mood'
              ? 'bg-warning text-white border-warning'
              : 'bg-card border-border text-text-muted hover:border-warning hover:text-warning'
          }`}
        >
          <Smile className="w-5 h-5" />
          <span>Mood Check</span>
          {activePanel === 'mood' ? <ChevronDown className="w-3 h-3 rotate-180" /> : <ChevronDown className="w-3 h-3" />}
        </button>

        {/* Journal — still navigates, needs full page */}
        <button
          onClick={() => navigate('/journal')}
          className="flex flex-col items-center gap-2 py-3 px-2 rounded-sm border border-border bg-card text-text-muted text-sm font-medium hover:border-primary hover:text-primary transition-colors duration-150"
        >
          <BookText className="w-5 h-5" />
          <span>Journal Entry</span>
          <span className="text-xs opacity-60">→ opens page</span>
        </button>
      </div>

      {/* ── Inline Panel: Mood ── */}
      {activePanel === 'mood' && (
        <InlinePanel onClose={() => setActivePanel(null)}>
          <p className="text-sm font-semibold text-text-main">How are you feeling right now?</p>
          {quickMoodSuccess !== null ? (
            <div className="flex items-center gap-3 py-2">
              <span className="text-4xl">{MOOD_EMOJIS[quickMoodSuccess]}</span>
              <div>
                <p className="text-sm font-semibold text-primary">✓ Logged — {MOOD_LABELS[quickMoodSuccess]}!</p>
                <p className="text-xs text-text-muted">Closing in a moment…</p>
              </div>
            </div>
          ) : (
            <>
              <div className="flex gap-4 justify-center py-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    onClick={() => moodMutation.mutate(n)}
                    disabled={moodMutation.isPending}
                    title={MOOD_LABELS[n]}
                    className="text-4xl transition-all duration-150 hover:scale-125 active:scale-95 disabled:opacity-50"
                  >
                    {MOOD_EMOJIS[n]}
                  </button>
                ))}
              </div>
              <p className="text-xs text-text-muted text-center">Tap an emoji to log instantly · <button onClick={() => navigate('/mood')} className="text-primary underline-offset-2 hover:underline">Add more detail →</button></p>
            </>
          )}
        </InlinePanel>
      )}

      {/* ── Inline Panel: Food ── */}
      {activePanel === 'food' && (
        <InlinePanel onClose={() => setActivePanel(null)}>
          <p className="text-sm font-semibold text-text-main">What did you eat?</p>
          {foodSuccess ? (
            <p className="text-sm font-semibold text-primary py-2">✓ Food logged!</p>
          ) : (
            <>
              <input
                type="text"
                placeholder="e.g. Oatmeal with banana"
                value={foodName}
                onChange={(e) => setFoodName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && foodName.trim() && foodMutation.mutate()}
                autoFocus
                className="w-full bg-card border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary"
              />
              <div>
                <p className="text-xs text-text-muted mb-1.5">GI Category</p>
                <div className="flex gap-2 flex-wrap">
                  {GI_OPTIONS.map(({ value, label, color }) => (
                    <button key={value} onClick={() => setGiCat(value)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        giCat === value ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'
                      }`}>
                      <span className={color}>● </span>{label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-1.5">Meal type</p>
                <div className="flex gap-2 flex-wrap">
                  {MEAL_TYPES.map((t) => (
                    <button key={t} onClick={() => setMealType(t)}
                      className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                        mealType === t ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'
                      }`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => foodMutation.mutate()} disabled={!foodName.trim() || foodMutation.isPending} className="flex-1">
                  {foodMutation.isPending ? 'Saving…' : 'Log Food'}
                </Button>
                <Button variant="secondary" onClick={() => navigate('/nutrition')} className="text-xs border-border">
                  Full form →
                </Button>
              </div>
              {foodMutation.isError && <p className="text-danger text-xs">{(foodMutation.error as Error).message}</p>}
            </>
          )}
        </InlinePanel>
      )}

      {/* ── Inline Panel: Focus ── */}
      {activePanel === 'focus' && (
        <InlinePanel onClose={() => { if (!focusRunning) setActivePanel(null); }}>
          <p className="text-sm font-semibold text-text-main">Focus Session</p>
          <div className={`text-5xl font-mono font-bold text-center py-2 tabular-nums transition-colors ${focusRunning ? 'text-primary' : 'text-text-muted'}`}>
            {fmt}
          </div>
          {!focusRunning && (
            <input
              type="text"
              placeholder="What are you working on? (optional)"
              value={taskLabel}
              onChange={(e) => setTaskLabel(e.target.value)}
              autoFocus
              className="w-full bg-card border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary"
            />
          )}
          {focusRunning && (
            <p className="text-xs text-text-muted text-center animate-pulse">Session in progress — stop when you're done</p>
          )}
          <div className="flex gap-2">
            {!focusRunning ? (
              <Button variant="primary" onClick={handleStartFocus} className="flex-1 gap-2">
                <Play className="w-4 h-4 fill-white" /> Start
              </Button>
            ) : (
              <Button variant="secondary" onClick={handleStopFocus} disabled={focusMutation.isPending} className="flex-1 gap-2 border-danger text-danger hover:bg-danger/10">
                <Square className="w-4 h-4 fill-current" /> {focusMutation.isPending ? 'Saving…' : 'Stop & Save'}
              </Button>
            )}
            <Button variant="secondary" onClick={() => navigate('/productivity')} className="text-xs border-border">
              Full page →
            </Button>
          </div>
        </InlinePanel>
      )}

      {/* ── Status Row ── */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <Smile className="w-8 h-8 text-warning" />
            <div className="text-2xl font-bold text-text-main">
              {isLoading ? '-' : todayStats?.mood ? `${todayStats.mood}/5` : 'None'}
            </div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Today's Mood</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <Moon className="w-8 h-8 text-primary-light" />
            <div className="text-2xl font-bold text-text-main">
              {isLoading ? '-' : todayStats?.sleep ? `${todayStats.sleep.duration_hours}h` : 'No log'}
            </div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Last Night</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <Timer className="w-8 h-8 text-primary" />
            <div className="text-2xl font-bold text-text-main">
              {isLoading ? '-' : `${todayStats?.focusMins || 0}m`}
            </div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Focus Time</div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <Smartphone className="w-8 h-8 text-danger" />
            <div className="text-2xl font-bold text-text-main">
              {isLoading ? '-' : `${todayStats?.distractMins || 0}m`}
            </div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">Distraction</div>
          </CardContent>
        </Card>

        <Card className={
          todayStats?.giRisk === 'danger' ? 'border-danger/50 bg-danger/5' :
          todayStats?.giRisk === 'warning' ? 'border-warning/50 bg-warning/5' : ''
        }>
          <CardContent className="p-4 flex flex-col items-center text-center gap-2">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              todayStats?.giRisk === 'danger' ? 'bg-danger/20 text-danger' :
              todayStats?.giRisk === 'warning' ? 'bg-warning/20 text-warning' :
              'bg-primary/20 text-primary'
            }`}>
              <Utensils className="w-4 h-4" />
            </div>
            <div className={`text-xl font-bold ${
              todayStats?.giRisk === 'danger' ? 'text-danger' :
              todayStats?.giRisk === 'warning' ? 'text-warning' :
              'text-primary'
            }`}>
              {isLoading ? '-' : todayStats?.giRisk === 'safe' ? 'Stable' : todayStats?.giRisk === 'warning' ? 'Moderate' : 'High Risk'}
            </div>
            <div className="text-xs text-text-muted font-medium uppercase tracking-wider">GI Alert Level</div>
          </CardContent>
        </Card>
      </div>

      {/* ── Charts ── */}
      <h2 className="text-xl font-bold text-text-main mt-8 mb-4">Today at a Glance</h2>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader><CardTitle>Focus Timeline</CardTitle></CardHeader>
          <CardContent>
            <TrendChart data={focusTimelineData} height={250} dataKey="value" lineName="Focus Minutes" />
          </CardContent>
        </Card>
        <Card className="h-full">
          <CardHeader><CardTitle>Distraction Breakdown</CardTitle></CardHeader>
          <CardContent>
            <CategoryBarChart data={distractionData} height={250} />
          </CardContent>
        </Card>
      </div>

      {/* ── Evening Wind-Down Prompt (after 7 PM) ── */}
      {new Date().getHours() >= 19 && (
        <button
          onClick={() => navigate('/review')}
          className="w-full mt-6 p-4 rounded-sm border border-primary/20 bg-gradient-to-r from-primary/5 to-transparent
            hover:from-primary/10 transition-colors text-left group"
        >
          <div className="flex items-center gap-3">
            <span className="text-2xl">🌙</span>
            <div>
              <p className="text-sm font-semibold text-text-main group-hover:text-primary transition-colors">
                Ready to close the day?
              </p>
              <p className="text-xs text-text-muted">Review what you did, check in on your schedule, and wind down →</p>
            </div>
          </div>
        </button>
      )}
    </div>
  );
}
