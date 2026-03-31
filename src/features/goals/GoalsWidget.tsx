import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Target, ChevronDown, ChevronUp } from 'lucide-react';

// Goals are stored in localStorage — low friction, no extra DB migration needed.
// Defaults are evidence-based ADHD recommendations.
interface Goals {
  sleepHours: number;      // default 7.5h
  focusMinutes: number;    // default 60min
  moodCheckins: number;    // default 2 times/day
  waterLogs: number;       // default 2 times/day
}

const DEFAULT_GOALS: Goals = {
  sleepHours: 7.5,
  focusMinutes: 60,
  moodCheckins: 2,
  waterLogs: 2,
};

const GOALS_KEY = 'aware_daily_goals';

function loadGoals(): Goals {
  try {
    const saved = localStorage.getItem(GOALS_KEY);
    return saved ? { ...DEFAULT_GOALS, ...JSON.parse(saved) } : DEFAULT_GOALS;
  } catch {
    return DEFAULT_GOALS;
  }
}

function saveGoals(goals: Goals) {
  localStorage.setItem(GOALS_KEY, JSON.stringify(goals));
}

// SVG progress ring — compact, visually clear
function Ring({ pct, size = 48, stroke = 4, color = '#169B62', label, sub }: {
  pct: number; size?: number; stroke?: number; color?: string; label: string; sub: string;
}) {
  const r = (size - stroke * 2) / 2;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - Math.min(pct, 1));
  const done = pct >= 1;

  return (
    <div className="flex flex-col items-center gap-1">
      <div className="relative" style={{ width: size, height: size }}>
        <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#1E3D28" strokeWidth={stroke} />
          <circle
            cx={size / 2} cy={size / 2} r={r} fill="none"
            stroke={done ? '#169B62' : color}
            strokeWidth={stroke}
            strokeDasharray={circ}
            strokeDashoffset={offset}
            strokeLinecap="round"
            style={{ transition: 'stroke-dashoffset 0.6s ease' }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          {done
            ? <span className="text-primary text-xs">✓</span>
            : <span className="text-[10px] font-bold text-text-main">{Math.round(pct * 100)}%</span>
          }
        </div>
      </div>
      <p className="text-xs font-medium text-text-main text-center leading-tight">{label}</p>
      <p className="text-[10px] text-text-muted text-center">{sub}</p>
    </div>
  );
}

export default function GoalsWidget() {
  const { user } = useAppStore();
  const [goals, setGoals] = useState<Goals>(loadGoals);
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState<Goals>(loadGoals);

  useEffect(() => {
    saveGoals(goals);
  }, [goals]);

  const today = new Date().toISOString().slice(0, 10);
  const todayStart = new Date(); todayStart.setHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  const { data: todayData } = useQuery({
    queryKey: ['goals-today', user?.id, today],
    enabled: !!user?.id,
    queryFn: async () => {
      const uid = user!.id;
      const [sleepRes, focusRes, moodRes, foodRes] = await Promise.all([
        supabase.from('sleep_logs').select('duration_hours').eq('user_id', uid).eq('date', today).maybeSingle(),
        supabase.from('focus_sessions').select('duration_minutes').eq('user_id', uid).gte('started_at', todayISO),
        supabase.from('mood_logs').select('id').eq('user_id', uid).gte('timestamp', todayISO),
        supabase.from('food_logs').select('meal_type').eq('user_id', uid).gte('timestamp', todayISO),
      ]);
      const sleepHrs = sleepRes.data?.duration_hours ?? 0;
      const focusMins = focusRes.data?.reduce((s: number, r: any) => s + (r.duration_minutes || 0), 0) ?? 0;
      const moodCount = moodRes.data?.length ?? 0;
      const waterCount = foodRes.data?.filter((r: any) => r.meal_type === 'water').length ?? 0;
      return { sleepHrs, focusMins, moodCount, waterCount };
    },
    staleTime: 60000,
  });

  const progress = {
    sleep: (todayData?.sleepHrs ?? 0) / goals.sleepHours,
    focus: (todayData?.focusMins ?? 0) / goals.focusMinutes,
    mood: (todayData?.moodCount ?? 0) / goals.moodCheckins,
    water: (todayData?.waterCount ?? 0) / goals.waterLogs,
  };

  const handleSave = () => {
    setGoals(draft);
    setEditing(false);
  };

  return (
    <div className="rounded-2xl ring-1 ring-inset ring-black/5 bg-card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Target className="w-4 h-4 text-primary" />
          <h3 className="text-sm font-semibold text-text-main">Today's Goals</h3>
        </div>
        <button
          onClick={() => { setEditing(e => !e); setDraft(goals); }}
          className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1"
        >
          {editing ? <><ChevronUp className="w-3 h-3" /> Done</> : <><ChevronDown className="w-3 h-3" /> Edit</>}
        </button>
      </div>

      {/* Progress rings */}
      {!editing && (
        <div className="grid grid-cols-4 gap-2">
          <Ring
            pct={progress.sleep}
            label="Sleep"
            sub={`${todayData?.sleepHrs.toFixed(1) ?? 0}/${goals.sleepHours}h`}
            color="#818cf8"
          />
          <Ring
            pct={progress.focus}
            label="Focus"
            sub={`${todayData?.focusMins ?? 0}/${goals.focusMinutes}m`}
            color="#169B62"
          />
          <Ring
            pct={progress.mood}
            label="Mood checks"
            sub={`${todayData?.moodCount ?? 0}/${goals.moodCheckins}x`}
            color="#C96A10"
          />
          <Ring
            pct={progress.water}
            label="Water logs"
            sub={`${todayData?.waterCount ?? 0}/${goals.waterLogs}x`}
            color="#0ea5e9"
          />
        </div>
      )}

      {/* Edit form */}
      {editing && (
        <div className="space-y-3">
          {([
            { key: 'sleepHours', label: 'Sleep target (hours)', min: 4, max: 12, step: 0.5 },
            { key: 'focusMinutes', label: 'Focus target (minutes)', min: 10, max: 300, step: 5 },
            { key: 'moodCheckins', label: 'Mood check-ins per day', min: 1, max: 10, step: 1 },
            { key: 'waterLogs', label: 'Water logs per day', min: 1, max: 10, step: 1 },
          ] as const).map(({ key, label, min, max, step }) => (
            <div key={key} className="flex items-center justify-between gap-4">
              <label className="text-xs text-text-muted flex-1">{label}</label>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setDraft(d => ({ ...d, [key]: Math.max(min, +(d[key] - step).toFixed(1)) }))}
                  className="w-6 h-6 rounded border border-border text-text-muted hover:text-text-main text-sm flex items-center justify-center"
                >−</button>
                <span className="text-sm font-medium text-text-main w-10 text-center">{draft[key]}</span>
                <button
                  onClick={() => setDraft(d => ({ ...d, [key]: Math.min(max, +(d[key] + step).toFixed(1)) }))}
                  className="w-6 h-6 rounded border border-border text-text-muted hover:text-text-main text-sm flex items-center justify-center"
                >+</button>
              </div>
            </div>
          ))}
          <button
            onClick={handleSave}
            className="w-full py-1.5 rounded-sm bg-primary text-white text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Save goals
          </button>
          <p className="text-[10px] text-text-muted text-center">Goals are evidence-based defaults for ADHD. Adjust to what works for you.</p>
        </div>
      )}
    </div>
  );
}
