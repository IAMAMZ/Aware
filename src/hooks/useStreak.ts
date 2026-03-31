import { useQuery } from '@tanstack/react-query';
import { subDays, format, eachDayOfInterval } from 'date-fns';
import { supabase } from '../lib/supabase';
import { useAppStore } from '../store/useAppStore';

export interface StreakData {
  current: number;           // consecutive logged days (today counts if already logged)
  best: number;              // best streak ever in last 90 days
  totalLoggedDays: number;   // total unique days with any log
  loggedToday: boolean;
  /** last 14 days, index 0 = oldest, 13 = today */
  last14: boolean[];
  nextMilestone: number | null;
  /** true if today not logged yet but streak is still alive from yesterday */
  streakAlive: boolean;
}

const MILESTONES = [3, 7, 14, 21, 30, 60, 100];

export function useStreak() {
  const { user } = useAppStore();

  return useQuery<StreakData>({
    queryKey: ['streak', user?.id],
    enabled: !!user?.id,
    staleTime: 2 * 60 * 1000, // 2 min
    queryFn: async (): Promise<StreakData> => {
      const uid = user!.id;
      const since90 = subDays(new Date(), 90).toISOString();
      const since90date = since90.slice(0, 10);

      // Query all logging tables in parallel — ANY log on a day counts as "showing up"
      const [mood, sleep, focus, food, dist, journal, urge] = await Promise.all([
        supabase.from('mood_logs').select('timestamp').eq('user_id', uid).gte('timestamp', since90),
        supabase.from('sleep_logs').select('date').eq('user_id', uid).gte('date', since90date),
        supabase.from('focus_sessions').select('started_at').eq('user_id', uid).gte('started_at', since90),
        supabase.from('food_logs').select('timestamp').eq('user_id', uid).gte('timestamp', since90),
        supabase.from('distraction_logs').select('timestamp').eq('user_id', uid).gte('timestamp', since90),
        supabase.from('journal_entries').select('date').eq('user_id', uid).gte('date', since90date),
        supabase.from('urge_surf_logs').select('timestamp').eq('user_id', uid).gte('timestamp', since90),
      ]);

      // Build a set of all dates that have at least one log of any kind
      const loggedDates = new Set<string>();
      mood.data?.forEach(r => loggedDates.add(r.timestamp.slice(0, 10)));
      sleep.data?.forEach(r => loggedDates.add(r.date));
      focus.data?.forEach(r => loggedDates.add(r.started_at.slice(0, 10)));
      food.data?.forEach(r => loggedDates.add(r.timestamp.slice(0, 10)));
      dist.data?.forEach(r => loggedDates.add(r.timestamp.slice(0, 10)));
      journal.data?.forEach(r => loggedDates.add(r.date));
      urge.data?.forEach(r => loggedDates.add(r.timestamp.slice(0, 10)));

      const today = format(new Date(), 'yyyy-MM-dd');
      const yesterday = format(subDays(new Date(), 1), 'yyyy-MM-dd');
      const loggedToday = loggedDates.has(today);

      // Current streak: count backwards from today (or yesterday if not logged today).
      // We don't show "broken" until midnight — if they logged yesterday, streak is alive.
      let current = 0;
      const startFrom = loggedToday ? today : yesterday;
      for (let i = 0; i <= 90; i++) {
        const d = format(subDays(new Date(startFrom), i), 'yyyy-MM-dd');
        if (loggedDates.has(d)) {
          current++;
        } else {
          break;
        }
      }
      // If not logged today but logged yesterday, streak is still alive
      const streakAlive = !loggedToday && loggedDates.has(yesterday) && current > 0;

      // Best streak (no grace, pure consecutive days)
      const allDays = eachDayOfInterval({ start: subDays(new Date(), 89), end: new Date() });
      let best = 0, run = 0;
      for (const day of allDays) {
        if (loggedDates.has(format(day, 'yyyy-MM-dd'))) {
          run++;
          if (run > best) best = run;
        } else {
          run = 0;
        }
      }

      // Last 14 days grid
      const last14: boolean[] = [];
      for (let i = 13; i >= 0; i--) {
        last14.push(loggedDates.has(format(subDays(new Date(), i), 'yyyy-MM-dd')));
      }

      const nextMilestone = MILESTONES.find(m => m > current) ?? null;

      return {
        current,
        best,
        totalLoggedDays: loggedDates.size,
        loggedToday,
        last14,
        nextMilestone,
        streakAlive,
      };
    },
  });
}
