import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import type { SleepLog } from '../../types';

const SLEEP_TYPES = ['deep', 'light', 'restless', 'nap'];
const PRE_SLEEP_CONTEXTS = ['screen_time', 'alcohol', 'late_meal', 'exercise', 'meditation', 'reading', 'anxiety', 'caffeine'];
const QUALITY_LABELS = ['', '😫 Terrible', '😕 Poor', '😐 OK', '🙂 Good', '😄 Great'];

function calcDuration(bedtime: string, wakeTime: string): number {
  if (!bedtime || !wakeTime) return 0;
  const [bh, bm] = bedtime.split(':').map(Number);
  const [wh, wm] = wakeTime.split(':').map(Number);
  let mins = (wh * 60 + wm) - (bh * 60 + bm);
  if (mins < 0) mins += 24 * 60;
  return Math.round((mins / 60) * 10) / 10;
}

export default function SleepPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  const today = new Date().toISOString().split('T')[0];
  const [date, setDate] = useState(today);
  const [bedtime, setBedtime] = useState('23:00');
  const [wakeTime, setWakeTime] = useState('07:00');
  const [quality, setQuality] = useState(3);
  const [sleepType, setSleepType] = useState('deep');
  const [preContext, setPreContext] = useState<string[]>([]);
  const [success, setSuccess] = useState(false);

  const duration = calcDuration(bedtime, wakeTime);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['sleep-logs', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('sleep_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('date', { ascending: false })
        .limit(14);
      if (error) throw error;
      return data as SleepLog[];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const bedtimeFull = new Date(`${date}T${bedtime}:00`).toISOString();
      // Wake time on next day if before bedtime hour
      const wakeDate = wakeTime < bedtime ? new Date(new Date(`${date}`).getTime() + 86400000).toISOString().split('T')[0] : date;
      const wakeTimeFull = new Date(`${wakeDate}T${wakeTime}:00`).toISOString();

      const { error } = await supabase.from('sleep_logs').insert({
        user_id: user!.id,
        date,
        bedtime: bedtimeFull,
        wake_time: wakeTimeFull,
        duration_hours: duration,
        quality,
        sleep_type: sleepType,
        pre_sleep_context: preContext,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sleep-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    },
  });

  const toggleCtx = (c: string) =>
    setPreContext((prev) => (prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]));

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold text-text-main">Sleep Tracker</h1>

      <Card>
        <CardHeader><CardTitle>Log Last Night's Sleep</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Date</label>
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" />
            </div>
            <div className="flex items-end">
              <div className={`text-2xl font-bold ${duration >= 7 ? 'text-primary' : duration >= 5 ? 'text-warning' : 'text-danger'}`}>
                {duration}h
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Bedtime</label>
              <input type="time" value={bedtime} onChange={(e) => setBedtime(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Wake Time</label>
              <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" />
            </div>
          </div>

          {/* Quality */}
          <div>
            <p className="text-xs text-text-muted mb-2">Sleep quality</p>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((n) => (
                <button key={n} onClick={() => setQuality(n)}
                  className={`flex-1 py-2 rounded-sm text-sm font-medium border transition-colors duration-150 ${
                    quality === n ? 'bg-primary border-primary text-white' : 'border-border text-text-muted hover:border-primary'
                  }`}>
                  {n}
                </button>
              ))}
            </div>
            <p className="text-xs text-text-muted mt-1 text-center">{QUALITY_LABELS[quality]}</p>
          </div>

          {/* Sleep Type */}
          <div>
            <p className="text-xs text-text-muted mb-2">Sleep type</p>
            <div className="flex gap-2 flex-wrap">
              {SLEEP_TYPES.map((t) => (
                <button key={t} onClick={() => setSleepType(t)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${
                    sleepType === t ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Pre-sleep context */}
          <div>
            <p className="text-xs text-text-muted mb-2">What happened before bed?</p>
            <div className="flex flex-wrap gap-2">
              {PRE_SLEEP_CONTEXTS.map((c) => (
                <button key={c} onClick={() => toggleCtx(c)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${
                    preContext.includes(c) ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'
                  }`}>
                  {c.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          <Button variant="primary" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Saving...' : success ? '✓ Logged!' : 'Log Sleep'}
          </Button>
          {mutation.isError && <p className="text-danger text-sm text-center">Error saving. Try again.</p>}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader><CardTitle>Recent Sleep</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center justify-between py-3 border-b border-border">
                  <div className="space-y-2">
                    <Skeleton className="h-4 w-20" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                  <Skeleton className="h-3 w-20" />
                </div>
              ))}
            </div>
          ) : !logs?.length ? (
            <div className="text-center py-10 text-text-muted">
              <p className="text-sm">No sleep logs yet.</p>
              <p className="text-xs mt-1">Log last night's sleep using the form above.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium text-text-main">
                      <span className={`font-bold ${log.duration_hours >= 7 ? 'text-primary' : log.duration_hours >= 5 ? 'text-warning' : 'text-danger'}`}>
                        {log.duration_hours}h
                      </span>
                      <span className="ml-2 text-text-muted">quality {log.quality}/5</span>
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">{log.sleep_type}</div>
                  </div>
                  <span className="text-xs text-text-muted">{log.date}</span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
