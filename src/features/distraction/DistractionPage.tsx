import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { DistractionLog, DistractionCategory, TriggerTag } from '../../types';

const CATEGORIES: DistractionCategory[] = [
  'social_media', 'news', 'stocks', 'youtube', 'email',
  'productivity_procrastination', 'research_loop', 'comparison', 'notification', 'other',
];
const TRIGGERS: TriggerTag[] = ['boredom', 'avoidance', 'anxiety', 'habit', 'notification', 'glucose_crash', 'stress'];

export default function DistractionPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  const [category, setCategory] = useState<DistractionCategory>('social_media');
  const [domain, setDomain] = useState('');
  const [duration, setDuration] = useState(5);
  const [trigger, setTrigger] = useState<TriggerTag>('habit');
  const [intentional, setIntentional] = useState(false);
  const [postMood, setPostMood] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['distraction-logs', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('distraction_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return data as DistractionLog[];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('distraction_logs').insert({
        user_id: user!.id,
        timestamp: new Date().toISOString(),
        category,
        domain: domain || null,
        duration_minutes: duration,
        trigger_tag: trigger,
        intentional,
        post_mood: postMood || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['distraction-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setDomain(''); setPostMood(''); setDuration(5); setIntentional(false);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    },
  });

  const totalToday = logs?.reduce((a, l) => a + l.duration_minutes, 0) || 0;

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold text-text-main">Digital Distraction</h1>

      <Card>
        <CardHeader><CardTitle>Log a Distraction</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {/* Category */}
          <div>
            <p className="text-xs text-text-muted mb-2">What were you doing?</p>
            <div className="flex flex-wrap gap-2">
              {CATEGORIES.map((c) => (
                <button key={c} onClick={() => setCategory(c)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${
                    category === c ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'
                  }`}>
                  {c.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Domain + Duration */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Site / App (optional)</label>
              <input type="text" placeholder="e.g. twitter.com" value={domain} onChange={(e) => setDomain(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Duration: {duration} min</label>
              <input type="range" min="1" max="120" value={duration} onChange={(e) => setDuration(Number(e.target.value))}
                className="w-full accent-primary mt-3" />
            </div>
          </div>

          {/* Trigger */}
          <div>
            <p className="text-xs text-text-muted mb-2">What triggered it?</p>
            <div className="flex flex-wrap gap-2">
              {TRIGGERS.map((t) => (
                <button key={t} onClick={() => setTrigger(t)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${
                    trigger === t ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'
                  }`}>
                  {t.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Intentional toggle + post mood */}
          <div className="flex items-center gap-6">
            <label className="flex items-center gap-2 cursor-pointer select-none">
              <div onClick={() => setIntentional(!intentional)}
                className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center px-1 ${intentional ? 'bg-primary' : 'bg-border'}`}>
                <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${intentional ? 'translate-x-4' : ''}`} />
              </div>
              <span className="text-sm text-text-muted">Intentional break</span>
            </label>
            <div className="flex-1">
              <input type="text" placeholder="Mood after (optional)" value={postMood} onChange={(e) => setPostMood(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary" />
            </div>
          </div>

          <Button variant="primary" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Saving...' : success ? '✓ Logged!' : 'Log Distraction'}
          </Button>
        </CardContent>
      </Card>

      <div className="text-sm text-text-muted px-1">
        Today's total distraction: <span className={`font-bold ${totalToday > 60 ? 'text-danger' : totalToday > 30 ? 'text-warning' : 'text-primary'}`}>{totalToday} min</span>
      </div>

      <Card>
        <CardHeader><CardTitle>Today's Log</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-text-muted text-sm">Loading...</p>
          ) : !logs?.length ? (
            <p className="text-text-muted text-sm">No distractions logged today 🎉</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium text-text-main">
                      {log.category.replace(/_/g, ' ')}
                      {log.domain && <span className="ml-2 text-xs text-text-muted">({log.domain})</span>}
                    </div>
                    <div className="text-xs text-text-muted mt-0.5">trigger: {log.trigger_tag} {log.intentional && '· intentional'}</div>
                  </div>
                  <div className="text-right">
                    <div className={`text-sm font-bold ${log.duration_minutes > 30 ? 'text-danger' : log.duration_minutes > 10 ? 'text-warning' : 'text-text-main'}`}>
                      {log.duration_minutes}m
                    </div>
                    <div className="text-xs text-text-muted">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
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
