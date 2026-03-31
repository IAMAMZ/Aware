import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell, AreaChart, Area,
} from 'recharts';
import { subDays, format, eachDayOfInterval, startOfWeek } from 'date-fns';
import {
  Brain, Moon, Smile, Timer, Smartphone, TrendingUp,
  Zap, Activity, AlertTriangle, Target,
} from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { chartColors } from '../../components/charts/Charts';

// ── Helpers ────────────────────────────────────────────────────────────

function pearsonR(xs: number[], ys: number[]): number {
  const n = Math.min(xs.length, ys.length);
  if (n < 3) return 0;
  const meanX = xs.slice(0, n).reduce((a, b) => a + b, 0) / n;
  const meanY = ys.slice(0, n).reduce((a, b) => a + b, 0) / n;
  let num = 0, denX = 0, denY = 0;
  for (let i = 0; i < n; i++) {
    const dx = xs[i] - meanX, dy = ys[i] - meanY;
    num += dx * dy; denX += dx * dx; denY += dy * dy;
  }
  return Math.sqrt(denX * denY) === 0 ? 0 : num / Math.sqrt(denX * denY);
}

function corrLabel(r: number): { label: string; color: string } {
  const abs = Math.abs(r);
  if (abs >= 0.6) return { label: r > 0 ? 'Strong positive ↑' : 'Strong negative ↓', color: r > 0 ? 'text-primary' : 'text-danger' };
  if (abs >= 0.3) return { label: r > 0 ? 'Moderate positive' : 'Moderate negative', color: r > 0 ? 'text-primary/80' : 'text-warning' };
  return { label: 'Weak / no link', color: 'text-text-muted' };
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-card border border-border p-3 rounded-lg shadow-xl text-xs">
      <p className="text-text-main font-semibold mb-1.5">{label}</p>
      {payload.map((e: any, i: number) => (
        <p key={i} style={{ color: e.color }} className="mb-0.5">
          {e.name}: <span className="font-medium">{typeof e.value === 'number' ? e.value.toFixed(1) : e.value}</span>
        </p>
      ))}
    </div>
  );
};

// ── Sub-components ─────────────────────────────────────────────────────

function StatCard({ icon, label, value, sub, color }: {
  icon: React.ReactNode; label: string; value: string; sub?: string; color: string;
}) {
  return (
    <Card>
      <CardContent className="p-5 flex items-start gap-4">
        <div className={`p-2 rounded-lg bg-current/10 ${color} shrink-0`}>{icon}</div>
        <div className="min-w-0">
          <div className="text-2xl font-bold text-text-main">{value}</div>
          <div className="text-xs font-medium text-text-muted uppercase tracking-wider mt-0.5">{label}</div>
          {sub && <div className="text-xs text-text-muted mt-1">{sub}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

function CorrCard({ title, description, r, n, emoji }: {
  title: string; description: string; r: number; n: number; emoji: string;
}) {
  const { label, color } = corrLabel(r);
  return (
    <Card className="flex flex-col">
      <CardContent className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex items-start justify-between gap-2">
          <span className="text-3xl leading-none">{emoji}</span>
          <span className="text-[10px] text-text-muted font-medium">n={n} days</span>
        </div>
        <p className="text-sm font-semibold text-text-main leading-tight">{title}</p>
        <p className="text-xs text-text-muted leading-relaxed">{description}</p>
        <div className="mt-auto space-y-1.5">
          <div className="flex justify-between items-center">
            <span className={`text-xs font-semibold ${color}`}>{label}</span>
            <span className="text-xs font-mono text-text-muted">r={r.toFixed(2)}</span>
          </div>
          <div className="h-1.5 bg-forest rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full ${r >= 0 ? 'bg-primary' : 'bg-danger'}`}
              style={{ width: `${Math.abs(r) * 100}%` }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileMetric({ label, value, sub, status }: {
  label: string; value: string; sub: string; status: 'good' | 'warn' | 'neutral';
}) {
  const statusColor = status === 'good' ? 'text-primary' : status === 'warn' ? 'text-warning' : 'text-text-muted';
  return (
    <div className="flex items-center justify-between py-2 border-b border-border last:border-0">
      <div>
        <p className="text-sm font-medium text-text-main">{label}</p>
        <p className="text-xs text-text-muted">{sub}</p>
      </div>
      <span className={`text-sm font-bold ${statusColor}`}>{value}</span>
    </div>
  );
}

function EmptyChart({ text }: { text: string }) {
  return (
    <div className="flex flex-col items-center justify-center h-40 text-text-muted gap-2">
      <AlertTriangle className="w-8 h-8 opacity-20" />
      <p className="text-sm">{text}</p>
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────

const PERIOD_OPTIONS = [
  { label: '7 days', value: 7 },
  { label: '30 days', value: 30 },
  { label: '90 days', value: 90 },
] as const;

export default function AnalyticsPage() {
  const { user } = useAppStore();
  const [days, setDays] = useState<7 | 30 | 90>(30);

  const since = useMemo(() => subDays(new Date(), days).toISOString(), [days]);
  const sinceDate = useMemo(() => since.slice(0, 10), [since]);

  const { data, isLoading } = useQuery({
    queryKey: ['analytics-v2', user?.id, days],
    enabled: !!user?.id,
    queryFn: async () => {
      const uid = user!.id;
      const [moodRes, sleepRes, focusRes, foodRes, distRes, medRes, urgeRes] = await Promise.all([
        supabase.from('mood_logs').select('*').eq('user_id', uid).gte('timestamp', since).order('timestamp'),
        supabase.from('sleep_logs').select('*').eq('user_id', uid).gte('bedtime', since).order('bedtime'),
        supabase.from('focus_sessions').select('*').eq('user_id', uid).gte('started_at', since).order('started_at'),
        supabase.from('food_logs').select('*').eq('user_id', uid).gte('timestamp', since).order('timestamp'),
        supabase.from('distraction_logs').select('*').eq('user_id', uid).gte('timestamp', since).order('timestamp'),
        supabase.from('medication_logs').select('*').eq('user_id', uid).gte('date', sinceDate).order('date'),
        supabase.from('urge_surf_logs').select('*').eq('user_id', uid).gte('timestamp', since).order('timestamp'),
      ]);
      return {
        mood: moodRes.data || [],
        sleep: sleepRes.data || [],
        focus: focusRes.data || [],
        food: foodRes.data || [],
        distraction: distRes.data || [],
        medication: medRes.data || [],
        urgeSurf: urgeRes.data || [],
      };
    },
  });

  // ── Daily timeline ──────────────────────────────────────────────────
  const dailyTimeline = useMemo(() => {
    if (!data) return [];
    const end = new Date();
    const start = subDays(end, days - 1);
    const allDays = eachDayOfInterval({ start, end });

    if (days === 90) {
      // Aggregate by week for readability
      const weeks: Record<string, { moods: number[]; sleepHrs: number[]; focusMins: number }> = {};
      allDays.forEach(day => {
        const wk = format(startOfWeek(day, { weekStartsOn: 1 }), 'MMM d');
        if (!weeks[wk]) weeks[wk] = { moods: [], sleepHrs: [], focusMins: 0 };
        const ds = format(day, 'yyyy-MM-dd');
        data.mood.filter(m => m.timestamp.startsWith(ds)).forEach(m => weeks[wk].moods.push(m.mood_score));
        const sl = data.sleep.find(s => s.date === ds || s.bedtime?.startsWith(ds));
        if (sl) weeks[wk].sleepHrs.push(sl.duration_hours);
        weeks[wk].focusMins += data.focus.filter(f => f.started_at.startsWith(ds)).reduce((s, f) => s + (f.duration_minutes || 0), 0);
      });
      return Object.entries(weeks).map(([date, v]) => ({
        date,
        mood: v.moods.length ? +(v.moods.reduce((s, x) => s + x, 0) / v.moods.length).toFixed(1) : null,
        sleepHrs: v.sleepHrs.length ? +(v.sleepHrs.reduce((s, x) => s + x, 0) / v.sleepHrs.length).toFixed(1) : null,
        focusMins: v.focusMins || null,
      }));
    }

    return allDays.map(day => {
      const ds = format(day, 'yyyy-MM-dd');
      const label = days <= 7 ? format(day, 'EEE') : format(day, 'MMM d');
      const dayMoods = data.mood.filter(m => m.timestamp.startsWith(ds));
      const sl = data.sleep.find(s => s.date === ds || s.bedtime?.startsWith(ds));
      const focusMins = data.focus.filter(f => f.started_at.startsWith(ds)).reduce((s, f) => s + (f.duration_minutes || 0), 0);
      const distMins = data.distraction.filter(d => d.timestamp.startsWith(ds)).reduce((s, d) => s + (d.duration_minutes || 0), 0);
      const med = data.medication.find(m => m.date === ds);
      return {
        date: label,
        mood: dayMoods.length ? +(dayMoods.reduce((s, m) => s + m.mood_score, 0) / dayMoods.length).toFixed(1) : null,
        sleepHrs: sl?.duration_hours ?? null,
        focusMins: focusMins || null,
        distMins: distMins || null,
        medTaken: med?.taken ?? null,
      };
    });
  }, [data, days]);

  // ── Summary stats ───────────────────────────────────────────────────
  const stats = useMemo(() => {
    if (!data) return null;
    const moods = data.mood.map(m => m.mood_score);
    const avgMood = moods.length ? moods.reduce((s, v) => s + v, 0) / moods.length : null;
    const sleepHrsArr = data.sleep.map(s => s.duration_hours).filter(Boolean);
    const avgSleepHrs = sleepHrsArr.length ? sleepHrsArr.reduce((s, v) => s + v, 0) / sleepHrsArr.length : null;
    const totalFocus = data.focus.reduce((s, f) => s + (f.duration_minutes || 0), 0);
    const totalDist = data.distraction.reduce((s, d) => s + (d.duration_minutes || 0), 0);
    const rsdCount = data.mood.filter(m => m.rsd_moment).length;
    const stressCount = data.mood.filter(m => m.stress_event).length;
    const medTaken = data.medication.filter(m => m.taken).length;
    const medTotal = data.medication.length;
    const urgeSurfed = data.urgeSurf.filter(u => u.outcome === 'redirected').length;
    const urgeTotal = data.urgeSurf.length;
    const focusCompleted = data.focus.filter(f => f.completion_status === 'completed').length;
    const focusTotal = data.focus.length;
    return {
      avgMood, avgSleepHrs,
      avgDailyFocus: totalFocus / days,
      totalFocus, totalDist,
      rsdCount, stressCount,
      medTaken, medTotal,
      urgeSurfed, urgeTotal,
      focusEfficiency: focusTotal > 0 ? focusCompleted / focusTotal * 100 : null,
    };
  }, [data, days]);

  // ── Correlations ────────────────────────────────────────────────────
  const correlations = useMemo(() => {
    if (!data) return null;
    const moodByDay: Record<string, number[]> = {};
    const sleepByDay: Record<string, { q: number; h: number }> = {};
    const focusByDay: Record<string, number> = {};
    const distByDay: Record<string, number> = {};
    const medByDay: Record<string, boolean> = {};

    data.mood.forEach(m => { const d = m.timestamp.slice(0, 10); (moodByDay[d] = moodByDay[d] || []).push(m.mood_score); });
    data.sleep.forEach(s => { const d = s.date || s.bedtime?.slice(0, 10); if (d) sleepByDay[d] = { q: s.quality, h: s.duration_hours }; });
    data.focus.forEach(f => { const d = f.started_at.slice(0, 10); focusByDay[d] = (focusByDay[d] || 0) + (f.duration_minutes || 0); });
    data.distraction.forEach(d => { const day = d.timestamp.slice(0, 10); distByDay[day] = (distByDay[day] || 0) + (d.duration_minutes || 0); });
    data.medication.forEach(m => { medByDay[m.date] = m.taken; });

    const sleepDays = Object.keys(sleepByDay).sort();

    // Sleep quality → next-day mood
    const sq: number[] = [], nm: number[] = [];
    sleepDays.forEach(d => {
      const tom = format(new Date(new Date(d).getTime() + 86400000), 'yyyy-MM-dd');
      if (moodByDay[tom]?.length) { sq.push(sleepByDay[d].q); nm.push(moodByDay[tom].reduce((s, v) => s + v, 0) / moodByDay[tom].length); }
    });

    // Sleep hours → next-day focus
    const sh: number[] = [], nf: number[] = [];
    sleepDays.forEach(d => {
      const tom = format(new Date(new Date(d).getTime() + 86400000), 'yyyy-MM-dd');
      if (focusByDay[tom] !== undefined) { sh.push(sleepByDay[d].h); nf.push(focusByDay[tom]); }
    });

    // Medication → same-day focus
    const mk: number[] = [], mf: number[] = [];
    Object.keys(medByDay).forEach(d => { if (focusByDay[d] !== undefined) { mk.push(medByDay[d] ? 1 : 0); mf.push(focusByDay[d]); } });

    // Higher mood → less distraction
    const ma: number[] = [], da: number[] = [];
    Object.keys(moodByDay).forEach(d => {
      if (distByDay[d] !== undefined) {
        ma.push(moodByDay[d].reduce((s, v) => s + v, 0) / moodByDay[d].length);
        da.push(distByDay[d]);
      }
    });

    // High GI food → distraction within 3 hours
    const highGiToDistArr: number[] = [];
    data.food.filter(f => f.gi_category === 'high').forEach(f => {
      const ts = new Date(f.timestamp).getTime();
      const distInWindow = data.distraction.filter(d => {
        const dt = new Date(d.timestamp).getTime();
        return dt > ts && dt < ts + 3 * 3600000;
      }).reduce((s, d) => s + (d.duration_minutes || 0), 0);
      highGiToDistArr.push(distInWindow);
    });
    const lowGiToDistArr: number[] = [];
    data.food.filter(f => f.gi_category === 'low' || f.gi_category === 'zero').forEach(f => {
      const ts = new Date(f.timestamp).getTime();
      const distInWindow = data.distraction.filter(d => {
        const dt = new Date(d.timestamp).getTime();
        return dt > ts && dt < ts + 3 * 3600000;
      }).reduce((s, d) => s + (d.duration_minutes || 0), 0);
      lowGiToDistArr.push(distInWindow);
    });

    const avgHighGiDist = highGiToDistArr.length ? highGiToDistArr.reduce((s, v) => s + v, 0) / highGiToDistArr.length : null;
    const avgLowGiDist = lowGiToDistArr.length ? lowGiToDistArr.reduce((s, v) => s + v, 0) / lowGiToDistArr.length : null;

    // Medication effect comparison
    const medOnDays = Object.keys(medByDay).filter(d => medByDay[d]);
    const medOffDays = Object.keys(medByDay).filter(d => !medByDay[d]);
    const avgMedOnFocus = medOnDays.length ? medOnDays.reduce((s, d) => s + (focusByDay[d] || 0), 0) / medOnDays.length : null;
    const avgMedOffFocus = medOffDays.length ? medOffDays.reduce((s, d) => s + (focusByDay[d] || 0), 0) / medOffDays.length : null;

    // Best sleep nights for next-day performance
    const goodSleepDays = sleepDays.filter(d => sleepByDay[d].h >= 7);
    const poorSleepDays = sleepDays.filter(d => sleepByDay[d].h < 6);
    const avgFocusAfterGoodSleep = goodSleepDays.length
      ? goodSleepDays.reduce((s, d) => {
          const tom = format(new Date(new Date(d).getTime() + 86400000), 'yyyy-MM-dd');
          return s + (focusByDay[tom] || 0);
        }, 0) / goodSleepDays.length
      : null;
    const avgFocusAfterPoorSleep = poorSleepDays.length
      ? poorSleepDays.reduce((s, d) => {
          const tom = format(new Date(new Date(d).getTime() + 86400000), 'yyyy-MM-dd');
          return s + (focusByDay[tom] || 0);
        }, 0) / poorSleepDays.length
      : null;

    return {
      sleepMood: { r: pearsonR(sq, nm), n: sq.length },
      sleepFocus: { r: pearsonR(sh, nf), n: sh.length },
      medFocus: { r: pearsonR(mk, mf), n: mk.length },
      moodDistraction: { r: pearsonR(ma, da), n: ma.length },
      avgHighGiDist, avgLowGiDist,
      avgMedOnFocus, avgMedOffFocus,
      avgFocusAfterGoodSleep, avgFocusAfterPoorSleep,
    };
  }, [data]);

  // ── Focus by hour ───────────────────────────────────────────────────
  const focusByHour = useMemo(() => {
    if (!data) return [];
    const buckets: Record<number, number> = {};
    for (let h = 6; h <= 22; h++) buckets[h] = 0;
    data.focus.forEach(f => {
      const h = new Date(f.started_at).getHours();
      if (h >= 6 && h <= 22) buckets[h] += f.duration_minutes || 0;
    });
    const maxMins = Math.max(...Object.values(buckets), 1);
    return Object.entries(buckets).map(([h, mins]) => ({
      hour: `${parseInt(h) % 12 || 12}${parseInt(h) < 12 ? 'am' : 'pm'}`,
      mins,
      intensity: mins / maxMins,
    }));
  }, [data]);

  // ── Distraction triggers ────────────────────────────────────────────
  const distractionTriggers = useMemo(() => {
    if (!data) return [];
    const triggers: Record<string, number> = {};
    data.distraction.forEach(d => {
      const t = (d.trigger_tag || 'other').replace(/_/g, ' ');
      triggers[t] = (triggers[t] || 0) + 1;
    });
    return Object.entries(triggers).sort((a, b) => b[1] - a[1]).map(([name, count]) => ({ name, count }));
  }, [data]);

  // ── Mood by day of week ─────────────────────────────────────────────
  const moodByDow = useMemo(() => {
    if (!data) return [];
    const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
    const buckets: Record<number, number[]> = { 1: [], 2: [], 3: [], 4: [], 5: [], 6: [], 0: [] };
    data.mood.forEach(m => { const dow = new Date(m.timestamp).getDay(); buckets[dow].push(m.mood_score); });
    // Monday-first order
    return [1, 2, 3, 4, 5, 6, 0].map((i, idx) => ({
      day: DAYS[idx],
      avgMood: buckets[i].length ? +(buckets[i].reduce((s, v) => s + v, 0) / buckets[i].length).toFixed(1) : 0,
      count: buckets[i].length,
    }));
  }, [data]);

  // ── GI impact bar chart data ────────────────────────────────────────
  const giImpactData = useMemo(() => {
    if (!correlations) return [];
    return [
      { name: 'Low / Zero GI', distMins: correlations.avgLowGiDist ?? 0 },
      { name: 'High GI', distMins: correlations.avgHighGiDist ?? 0 },
    ];
  }, [correlations]);

  // ── Sleep impact comparison ─────────────────────────────────────────
  const sleepImpactData = useMemo(() => {
    if (!correlations) return [];
    return [
      { name: '≥7h sleep', focusMins: correlations.avgFocusAfterGoodSleep ?? 0 },
      { name: '<6h sleep', focusMins: correlations.avgFocusAfterPoorSleep ?? 0 },
    ];
  }, [correlations]);

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-text-muted">
        <div className="animate-spin h-8 w-8 border-2 border-primary border-t-transparent rounded-full" />
        <p className="text-sm">Crunching your health data…</p>
      </div>
    );
  }

  const hasData = (data?.mood.length || 0) + (data?.sleep.length || 0) + (data?.focus.length || 0) > 0;
  if (!hasData) {
    return (
      <div className="flex flex-col items-center justify-center py-32 gap-4 text-text-muted">
        <Brain className="w-16 h-16 opacity-20" />
        <p className="text-lg font-medium">No data in this period yet</p>
        <p className="text-sm">Start logging mood, sleep, and focus sessions to see your patterns.</p>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-16">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-text-main flex items-center gap-3">
            <Brain className="w-8 h-8 text-primary" />
            Health Patterns
          </h1>
          <p className="text-sm text-text-muted mt-1">
            ADHD data correlations · trends · insights
          </p>
        </div>
        <div className="flex gap-2 shrink-0">
          {PERIOD_OPTIONS.map(opt => (
            <button
              key={opt.value}
              onClick={() => setDays(opt.value as 7 | 30 | 90)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium transition-all ${
                days === opt.value
                  ? 'bg-primary text-white shadow-sm'
                  : 'bg-card border border-border text-text-muted hover:border-primary/40 hover:text-text-main'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Summary Stats ── */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            icon={<Smile className="w-5 h-5" />}
            label="Avg Mood"
            value={stats.avgMood ? `${stats.avgMood.toFixed(1)} / 5` : '—'}
            sub={`${data?.mood.length || 0} check-ins`}
            color="text-warning"
          />
          <StatCard
            icon={<Moon className="w-5 h-5" />}
            label="Avg Sleep"
            value={stats.avgSleepHrs ? `${stats.avgSleepHrs.toFixed(1)}h` : '—'}
            sub={`${data?.sleep.length || 0} nights logged`}
            color="text-indigo-400"
          />
          <StatCard
            icon={<Timer className="w-5 h-5" />}
            label="Daily Focus"
            value={stats.avgDailyFocus ? `${Math.round(stats.avgDailyFocus)}m` : '—'}
            sub={`${Math.round(stats.totalFocus / 60)}h total`}
            color="text-primary"
          />
          <StatCard
            icon={<Smartphone className="w-5 h-5" />}
            label="Distraction"
            value={stats.totalDist ? `${Math.round(stats.totalDist / 60)}h total` : '—'}
            sub={`${data?.distraction.length || 0} logged events`}
            color="text-danger"
          />
        </div>
      )}

      {/* ── Daily Trends ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smile className="w-4 h-4 text-warning" /> Mood Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.mood.length > 0 ? (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTimeline} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.warning} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chartColors.warning} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
                    <XAxis dataKey="date" stroke={chartColors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis domain={[1, 5]} stroke={chartColors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="mood" name="Mood" stroke={chartColors.warning} strokeWidth={2} fill="url(#moodGrad)" dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart text="No mood logs in this period" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Timer className="w-4 h-4 text-primary" /> Focus Minutes Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.focus.length > 0 ? (
              <div style={{ height: 200 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={dailyTimeline} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                    <defs>
                      <linearGradient id="focusGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={chartColors.primary} stopOpacity={0.3} />
                        <stop offset="95%" stopColor={chartColors.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
                    <XAxis dataKey="date" stroke={chartColors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis stroke={chartColors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="focusMins" name="Focus (min)" stroke={chartColors.primary} strokeWidth={2} fill="url(#focusGrad)" dot={false} connectNulls />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart text="No focus sessions in this period" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Sleep Trend ── */}
      {data && data.sleep.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Moon className="w-4 h-4 text-indigo-400" /> Sleep Duration Over Time
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div style={{ height: 180 }}>
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dailyTimeline} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                  <defs>
                    <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
                  <XAxis dataKey="date" stroke={chartColors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 12]} stroke={chartColors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="sleepHrs" name="Sleep (hrs)" stroke="#818cf8" strokeWidth={2} fill="url(#sleepGrad)" dot={false} connectNulls />
                </AreaChart>
              </ResponsiveContainer>
            </div>
            <p className="text-xs text-text-muted mt-2">
              Target: 7–9 hours. ADHD is associated with sleep dysregulation — tracking this helps.
            </p>
          </CardContent>
        </Card>
      )}

      {/* ── Correlation Insights ── */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Zap className="w-5 h-5 text-primary" />
          <h2 className="text-xl font-bold text-text-main">Correlation Insights</h2>
          <span className="text-xs text-text-muted ml-auto">Pearson r coefficient — how strongly two variables move together</span>
        </div>

        {!correlations || (correlations.sleepMood.n < 3 && correlations.sleepFocus.n < 3) ? (
          <Card>
            <CardContent className="flex flex-col items-center py-10 gap-3 text-text-muted">
              <AlertTriangle className="w-10 h-10 opacity-20" />
              <p className="text-sm">Need at least 3 days of overlapping data for correlations.</p>
              <p className="text-xs">Keep logging mood, sleep, and focus sessions daily.</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <CorrCard
              emoji="🌙→😊"
              title="Sleep Quality → Next-Day Mood"
              description="Does sleeping better predict you'll feel better the next day?"
              r={correlations.sleepMood.r}
              n={correlations.sleepMood.n}
            />
            <CorrCard
              emoji="💤→⚡"
              title="Sleep Hours → Next-Day Focus"
              description="Does more sleep lead to longer, more productive focus sessions?"
              r={correlations.sleepFocus.r}
              n={correlations.sleepFocus.n}
            />
            <CorrCard
              emoji="💊→🎯"
              title="Medication → Focus Time"
              description="Do medication days correlate with more focus minutes?"
              r={correlations.medFocus.r}
              n={correlations.medFocus.n}
            />
            <CorrCard
              emoji="😊→📵"
              title="Better Mood → Less Distraction"
              description="On higher-mood days, do you spend less time distracted?"
              r={-correlations.moodDistraction.r}
              n={correlations.moodDistraction.n}
            />
          </div>
        )}
      </div>

      {/* ── Impact Comparison Cards ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* GI Impact */}
        {correlations && correlations.avgHighGiDist !== null && correlations.avgLowGiDist !== null && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                🥗 GI Food → Distraction (3h window)
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={giImpactData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
                    <XAxis dataKey="name" stroke={chartColors.textMuted} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={chartColors.textMuted} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="distMins" name="Avg distraction (min)" radius={[4, 4, 0, 0]}>
                      <Cell fill={chartColors.primary} />
                      <Cell fill={chartColors.danger} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-text-muted mt-2">
                Average distraction minutes in the 3 hours following each food type. High GI spikes can impair focus via glucose crash.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Sleep → Focus impact */}
        {correlations && correlations.avgFocusAfterGoodSleep !== null && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                💤 Sleep Duration → Next-Day Focus
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div style={{ height: 180 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sleepImpactData} margin={{ top: 5, right: 10, left: -15, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
                    <XAxis dataKey="name" stroke={chartColors.textMuted} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={chartColors.textMuted} fontSize={11} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="focusMins" name="Avg focus (min)" radius={[4, 4, 0, 0]}>
                      <Cell fill={chartColors.primary} />
                      <Cell fill={chartColors.danger} />
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <p className="text-xs text-text-muted mt-2">
                Average focus minutes the day after sleeping ≥7h vs &lt;6h.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* ── Medication Effect ── */}
      {user?.medication_tracking && correlations?.avgMedOnFocus !== null && correlations?.avgMedOffFocus !== null && (
        <Card className="border-violet-500/20 bg-violet-500/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <span>💊</span> Medication Effect on Focus
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-6 mb-4">
              <div className="text-center p-4 rounded-lg bg-violet-500/10">
                <div className="text-4xl font-bold text-violet-400">{Math.round(correlations.avgMedOnFocus!)}m</div>
                <div className="text-sm text-text-muted mt-1">On medication days</div>
              </div>
              <div className="text-center p-4 rounded-lg bg-forest">
                <div className="text-4xl font-bold text-text-muted">{Math.round(correlations.avgMedOffFocus!)}m</div>
                <div className="text-sm text-text-muted mt-1">Off medication days</div>
              </div>
            </div>
            {correlations.avgMedOnFocus! > correlations.avgMedOffFocus! ? (
              <p className="text-sm text-violet-400 text-center font-medium">
                You focus <strong>{Math.round(correlations.avgMedOnFocus! - correlations.avgMedOffFocus!)} more minutes</strong> on medication days ↑
              </p>
            ) : correlations.avgMedOnFocus! < correlations.avgMedOffFocus! ? (
              <p className="text-sm text-text-muted text-center">
                Focus is slightly higher off medication in this period — consider timing or dosage with your provider.
              </p>
            ) : (
              <p className="text-sm text-text-muted text-center">Focus time is similar on and off medication days.</p>
            )}
          </CardContent>
        </Card>
      )}

      {/* ── Focus Peaks + Mood by DoW ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-4 h-4 text-primary" /> Your Focus Peak Hours
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.focus.length > 0 ? (
              <>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={focusByHour} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
                      <XAxis dataKey="hour" stroke={chartColors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                      <YAxis stroke={chartColors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="mins" name="Focus (min)" radius={[3, 3, 0, 0]}>
                        {focusByHour.map((entry, i) => (
                          <Cell
                            key={i}
                            fill={entry.intensity > 0.6 ? chartColors.primary : entry.intensity > 0.2 ? chartColors.primaryLight : chartColors.border}
                          />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {focusByHour.length > 0 && (() => {
                  const peak = focusByHour.reduce((best, cur) => cur.mins > best.mins ? cur : best, focusByHour[0]);
                  return peak.mins > 0 ? (
                    <p className="text-xs text-text-muted mt-2">
                      Your peak focus time: <strong className="text-primary">{peak.hour}</strong> — protect this slot in your calendar.
                    </p>
                  ) : null;
                })()}
              </>
            ) : (
              <EmptyChart text="No focus sessions logged yet" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smile className="w-4 h-4 text-warning" /> Mood by Day of Week
            </CardTitle>
          </CardHeader>
          <CardContent>
            {data && data.mood.length > 0 ? (
              <>
                <div style={{ height: 200 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={moodByDow} margin={{ top: 5, right: 5, left: -25, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} vertical={false} />
                      <XAxis dataKey="day" stroke={chartColors.textMuted} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis domain={[0, 5]} stroke={chartColors.textMuted} fontSize={11} tickLine={false} axisLine={false} />
                      <Tooltip content={<CustomTooltip />} />
                      <Bar dataKey="avgMood" name="Avg mood" radius={[3, 3, 0, 0]}>
                        {moodByDow.map((entry, i) => (
                          <Cell key={i} fill={entry.avgMood >= 4 ? chartColors.primary : entry.avgMood >= 3 ? chartColors.warning : chartColors.danger} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                {(() => {
                  const best = moodByDow.filter(d => d.count > 0).reduce((b, c) => c.avgMood > b.avgMood ? c : b, moodByDow[0]);
                  const worst = moodByDow.filter(d => d.count > 0).reduce((b, c) => c.avgMood < b.avgMood ? c : b, moodByDow[0]);
                  return best && worst && best.day !== worst.day ? (
                    <p className="text-xs text-text-muted mt-2">
                      Best day: <strong className="text-primary">{best.day}</strong> · Hardest day: <strong className="text-warning">{worst.day}</strong>
                    </p>
                  ) : null;
                })()}
              </>
            ) : (
              <EmptyChart text="No mood data yet" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Distraction Triggers + ADHD Profile ── */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Smartphone className="w-4 h-4 text-danger" /> Top Distraction Triggers
            </CardTitle>
          </CardHeader>
          <CardContent>
            {distractionTriggers.length > 0 ? (
              <div style={{ height: 220 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={distractionTriggers} layout="vertical" margin={{ top: 0, right: 10, left: 5, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke={chartColors.border} horizontal={false} />
                    <XAxis type="number" stroke={chartColors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                    <YAxis dataKey="name" type="category" width={115} stroke={chartColors.textMuted} fontSize={10} tickLine={false} axisLine={false} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Occurrences" fill={chartColors.danger} radius={[0, 3, 3, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyChart text="No distraction logs yet" />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Activity className="w-4 h-4 text-primary" /> ADHD Health Profile
            </CardTitle>
          </CardHeader>
          <CardContent className="divide-y divide-border">
            {stats && (
              <>
                <ProfileMetric
                  label="Urge Surf Success"
                  value={stats.urgeTotal > 0 ? `${Math.round(stats.urgeSurfed / stats.urgeTotal * 100)}%` : '—'}
                  sub={`${stats.urgeSurfed} of ${stats.urgeTotal} redirected`}
                  status={stats.urgeTotal === 0 ? 'neutral' : stats.urgeSurfed / stats.urgeTotal >= 0.5 ? 'good' : 'warn'}
                />
                <ProfileMetric
                  label="RSD Moments"
                  value={`${stats.rsdCount}`}
                  sub={`${(stats.rsdCount / days * 7).toFixed(1)} per week average`}
                  status={stats.rsdCount === 0 ? 'good' : stats.rsdCount / days < 0.3 ? 'neutral' : 'warn'}
                />
                <ProfileMetric
                  label="Stress Events"
                  value={`${stats.stressCount}`}
                  sub={`in ${days} days`}
                  status={stats.stressCount === 0 ? 'good' : 'neutral'}
                />
                <ProfileMetric
                  label="Focus Completion Rate"
                  value={stats.focusEfficiency !== null ? `${Math.round(stats.focusEfficiency)}%` : '—'}
                  sub={`${data?.focus.length || 0} total sessions`}
                  status={stats.focusEfficiency === null ? 'neutral' : stats.focusEfficiency >= 70 ? 'good' : 'warn'}
                />
                {user?.medication_tracking && (
                  <ProfileMetric
                    label="Medication Adherence"
                    value={stats.medTotal > 0 ? `${Math.round(stats.medTaken / stats.medTotal * 100)}%` : '—'}
                    sub={`${stats.medTaken} of ${stats.medTotal} logged days`}
                    status={stats.medTotal === 0 ? 'neutral' : stats.medTaken / stats.medTotal >= 0.8 ? 'good' : 'warn'}
                  />
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      {/* ── Science footer ── */}
      <div className="rounded-2xl bg-primary/5 border border-primary/10 p-5 flex gap-4 items-start">
        <TrendingUp className="w-5 h-5 text-primary shrink-0 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-text-main">How these patterns are calculated</p>
          <p className="text-xs text-text-muted mt-1 leading-relaxed">
            Correlations use the Pearson r coefficient on your logged daily data. A value near +1 means both variables rise together; near −1 means they move opposite; near 0 means no clear link.
            The more days you log across mood, sleep, food, and focus — the more reliable and personalised these patterns become.
          </p>
        </div>
      </div>
    </div>
  );
}
