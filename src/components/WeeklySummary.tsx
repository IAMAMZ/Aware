import { useQuery } from '@tanstack/react-query';
import { subDays, format } from 'date-fns';
import { TrendingUp, TrendingDown, Minus, ChevronRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

function Trend({ v, prev }: { v: number; prev: number }) {
  if (prev === 0 || v === prev) return <Minus className="w-3.5 h-3.5 text-text-muted" />;
  return v > prev
    ? <TrendingUp className="w-3.5 h-3.5 text-primary" />
    : <TrendingDown className="w-3.5 h-3.5 text-danger" />;
}

export default function WeeklySummary() {
  const { user } = useAppStore();
  const navigate = useNavigate();

  // Only show on Mondays, OR always show if we have data
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon

  const thisWeekStart = subDays(today, 6).toISOString();
  const prevWeekStart = subDays(today, 13).toISOString();
  const prevWeekEnd = subDays(today, 7).toISOString();

  const { data, isLoading } = useQuery({
    queryKey: ['weekly-summary', user?.id, format(today, "yyyy-'W'ww")],
    enabled: !!user?.id,
    staleTime: 30 * 60 * 1000,
    queryFn: async () => {
      const uid = user!.id;
      const [moodThis, moodPrev, sleepThis, sleepPrev, focusThis, focusPrev, rsdThis] = await Promise.all([
        supabase.from('mood_logs').select('mood_score,timestamp').eq('user_id', uid).gte('timestamp', thisWeekStart),
        supabase.from('mood_logs').select('mood_score').eq('user_id', uid).gte('timestamp', prevWeekStart).lt('timestamp', prevWeekEnd),
        supabase.from('sleep_logs').select('duration_hours,quality,date').eq('user_id', uid).gte('bedtime', thisWeekStart),
        supabase.from('sleep_logs').select('duration_hours').eq('user_id', uid).gte('bedtime', prevWeekStart).lt('bedtime', prevWeekEnd),
        supabase.from('focus_sessions').select('duration_minutes,started_at').eq('user_id', uid).gte('started_at', thisWeekStart),
        supabase.from('focus_sessions').select('duration_minutes').eq('user_id', uid).gte('started_at', prevWeekStart).lt('started_at', prevWeekEnd),
        supabase.from('mood_logs').select('id').eq('user_id', uid).eq('rsd_moment', true).gte('timestamp', thisWeekStart),
      ]);

      // This week stats
      const moods = moodThis.data?.map(m => m.mood_score) ?? [];
      const avgMood = moods.length ? moods.reduce((s, v) => s + v, 0) / moods.length : null;

      const sleepHrs = sleepThis.data?.map(s => s.duration_hours) ?? [];
      const avgSleep = sleepHrs.length ? sleepHrs.reduce((s, v) => s + v, 0) / sleepHrs.length : null;
      const nightsBelowSeven = sleepHrs.filter(h => h < 7).length;

      const totalFocus = focusThis.data?.reduce((s, f) => s + (f.duration_minutes ?? 0), 0) ?? 0;
      const avgDailyFocus = totalFocus / 7;

      // Best focus day
      const focusByDay: Record<string, number> = {};
      focusThis.data?.forEach(f => {
        const d = f.started_at.slice(0, 10);
        focusByDay[d] = (focusByDay[d] || 0) + (f.duration_minutes ?? 0);
      });
      const bestFocusDay = Object.entries(focusByDay).sort((a, b) => b[1] - a[1])[0];

      // Prev week for comparison
      const prevMoods = moodPrev.data?.map(m => m.mood_score) ?? [];
      const prevAvgMood = prevMoods.length ? prevMoods.reduce((s, v) => s + v, 0) / prevMoods.length : 0;
      const prevSleepHrs = sleepPrev.data?.map(s => s.duration_hours) ?? [];
      const prevAvgSleep = prevSleepHrs.length ? prevSleepHrs.reduce((s, v) => s + v, 0) / prevSleepHrs.length : 0;
      const prevTotalFocus = focusPrev.data?.reduce((s, f) => s + (f.duration_minutes ?? 0), 0) ?? 0;
      const prevAvgDailyFocus = prevTotalFocus / 7;

      const rsdCount = rsdThis.data?.length ?? 0;

      // Generate insight sentence
      const insights: string[] = [];
      if (avgMood !== null && avgMood >= 3.5) insights.push(`mood was solid at ${avgMood.toFixed(1)}/5`);
      else if (avgMood !== null) insights.push(`mood averaged ${avgMood.toFixed(1)}/5`);
      if (avgSleep !== null && avgSleep >= 7) insights.push(`sleep was healthy at ${avgSleep.toFixed(1)}h avg`);
      else if (avgSleep !== null && nightsBelowSeven > 3) insights.push(`${nightsBelowSeven} nights below 7h sleep`);
      if (avgDailyFocus >= 60) insights.push(`strong ${Math.round(avgDailyFocus)}m daily focus avg`);
      else if (avgDailyFocus > 0) insights.push(`${Math.round(avgDailyFocus)}m avg daily focus`);
      if (rsdCount > 0) insights.push(`${rsdCount} RSD moment${rsdCount !== 1 ? 's' : ''}`);

      return {
        avgMood, prevAvgMood, avgSleep, prevAvgSleep,
        avgDailyFocus, prevAvgDailyFocus,
        totalFocusMins: totalFocus, nightsBelowSeven,
        bestFocusDay: bestFocusDay
          ? { day: format(new Date(bestFocusDay[0]), 'EEEE'), mins: bestFocusDay[1] }
          : null,
        rsdCount,
        moodCount: moods.length,
        insights,
        hasData: moods.length + sleepHrs.length + (focusThis.data?.length ?? 0) > 0,
      };
    },
  });

  if (isLoading || !data || !data.hasData) return null;

  const weekLabel = dayOfWeek === 1 ? 'This week so far' : 'Past 7 days';

  return (
    <button
      onClick={() => navigate('/analytics')}
      className="w-full text-left rounded-2xl ring-1 ring-inset ring-black/5 bg-gradient-to-r from-indigo-500/5 to-transparent p-4 hover:from-indigo-500/10 hover:shadow-sm transition-all group"
    >
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-semibold text-text-main">{weekLabel}</p>
        <span className="text-xs text-text-muted flex items-center gap-1 group-hover:text-primary transition-colors">
          Full analysis <ChevronRight className="w-3.5 h-3.5" />
        </span>
      </div>

      <div className="grid grid-cols-3 gap-3">
        {data.avgMood !== null && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-text-main">{data.avgMood.toFixed(1)}</span>
              <Trend v={data.avgMood} prev={data.prevAvgMood} />
            </div>
            <p className="text-xs text-text-muted">Avg mood /5</p>
          </div>
        )}
        {data.avgSleep !== null && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-text-main">{data.avgSleep.toFixed(1)}h</span>
              <Trend v={data.avgSleep} prev={data.prevAvgSleep} />
            </div>
            <p className="text-xs text-text-muted">Avg sleep</p>
          </div>
        )}
        {data.avgDailyFocus > 0 && (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1.5">
              <span className="text-xl font-bold text-text-main">{Math.round(data.avgDailyFocus)}m</span>
              <Trend v={data.avgDailyFocus} prev={data.prevAvgDailyFocus} />
            </div>
            <p className="text-xs text-text-muted">Daily focus</p>
          </div>
        )}
      </div>

      {data.insights.length > 0 && (
        <p className="text-xs text-text-muted mt-3 leading-relaxed">
          {data.insights.join(' · ')}
          {data.bestFocusDay && ` · best focus day: ${data.bestFocusDay.day} (${data.bestFocusDay.mins}m)`}
        </p>
      )}
      {data.rsdCount > 0 && (
        <p className="text-xs text-warning mt-1">
          ⚠ {data.rsdCount} RSD moment{data.rsdCount !== 1 ? 's' : ''} this week — check patterns →
        </p>
      )}
    </button>
  );
}
