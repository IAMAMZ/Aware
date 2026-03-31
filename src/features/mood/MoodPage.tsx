import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton } from '../../components/ui/Skeleton';
import type { MoodLog } from '../../types';
import { Zap } from 'lucide-react';

const EMOTION_TAGS = ['happy', 'anxious', 'focused', 'tired', 'irritable', 'calm', 'overwhelmed', 'motivated', 'sad', 'grateful'];
const MOOD_EMOJIS = ['', '😞', '😕', '😐', '🙂', '😄'];
const MOOD_LABELS = ['', 'Terrible', 'Poor', 'OK', 'Good', 'Great'];

export default function MoodPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  const [moodScore, setMoodScore] = useState<number>(3);
  const [tags, setTags] = useState<string[]>([]);
  const [stressEvent, setStressEvent] = useState(false);
  const [rsdMoment, setRsdMoment] = useState(false);
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);
  const [quickSuccess, setQuickSuccess] = useState<number | null>(null);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['mood-logs', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_logs')
        .select('*')
        .eq('user_id', user!.id)
        .order('timestamp', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as MoodLog[];
    },
  });

  // Full detailed log mutation
  const mutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('mood_logs').insert({
        user_id: user!.id,
        timestamp: new Date().toISOString(),
        mood_score: moodScore,
        emotion_tags: tags,
        stress_event: stressEvent,
        rsd_moment: rsdMoment,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mood-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setTags([]);
      setStressEvent(false);
      setRsdMoment(false);
      setNotes('');
      setMoodScore(3);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    },
  });

  // One-tap quick log mutation
  const quickMutation = useMutation({
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
      queryClient.invalidateQueries({ queryKey: ['mood-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setQuickSuccess(score);
      setTimeout(() => setQuickSuccess(null), 2500);
    },
  });

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold text-text-main">Emotions &amp; Mood</h1>

      {/* ── Quick One-Tap Mood Log ── */}
      <Card className="border-primary/30 bg-primary/5">
        <CardContent className="py-4 px-5">
          <div className="flex items-center gap-2 mb-3">
            <Zap className="w-4 h-4 text-primary" />
            <p className="text-sm font-semibold text-primary">Quick Log</p>
            <span className="text-xs text-text-muted ml-1">— tap an emoji to log instantly</span>
          </div>
          {quickSuccess !== null ? (
            <div className="flex items-center gap-2 py-1">
              <span className="text-3xl">{MOOD_EMOJIS[quickSuccess]}</span>
              <div>
                <p className="text-sm font-semibold text-primary">✓ Mood logged — {MOOD_LABELS[quickSuccess]}!</p>
                <p className="text-xs text-text-muted">Tap again anytime to update</p>
              </div>
            </div>
          ) : (
            <div className="flex gap-5 justify-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => quickMutation.mutate(n)}
                  disabled={quickMutation.isPending}
                  title={MOOD_LABELS[n]}
                  className="text-4xl transition-all duration-150 hover:scale-125 active:scale-95 disabled:opacity-50"
                >
                  {MOOD_EMOJIS[n]}
                </button>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Log Your Mood</CardTitle></CardHeader>
        <CardContent className="space-y-6">
          {/* Score */}
          <div>
            <p className="text-sm font-medium text-text-muted mb-3">How are you feeling right now?</p>
            <div className="flex gap-4 justify-center">
              {[1, 2, 3, 4, 5].map((n) => (
                <button
                  key={n}
                  onClick={() => setMoodScore(n)}
                  className={`text-4xl transition-all duration-150 ${moodScore === n ? 'scale-125' : 'opacity-50 hover:opacity-80'}`}
                >
                  {MOOD_EMOJIS[n]}
                </button>
              ))}
            </div>
            <p className="text-center text-sm text-text-muted mt-2">Score: {moodScore}/5</p>
          </div>

          {/* Emotion Tags */}
          <div>
            <p className="text-sm font-medium text-text-muted mb-2">Emotion tags</p>
            <div className="flex flex-wrap gap-2">
              {EMOTION_TAGS.map((tag) => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full text-sm font-medium border transition-colors duration-150 ${
                    tags.includes(tag)
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-text-muted hover:border-primary'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          {/* Toggles */}
          <div className="flex gap-6">
            {[
              { label: 'Stress Event', value: stressEvent, set: setStressEvent },
              { label: 'RSD Moment', value: rsdMoment, set: setRsdMoment },
            ].map(({ label, value, set }) => (
              <label key={label} className="flex items-center gap-2 cursor-pointer select-none">
                <div
                  onClick={() => set(!value)}
                  className={`w-10 h-6 rounded-full transition-colors duration-200 flex items-center px-1 ${value ? 'bg-primary' : 'bg-border'}`}
                >
                  <div className={`w-4 h-4 rounded-full bg-white transition-transform duration-200 ${value ? 'translate-x-4' : ''}`} />
                </div>
                <span className="text-sm text-text-muted">{label}</span>
              </label>
            ))}
          </div>

          {/* Notes */}
          <textarea
            placeholder="Optional notes..."
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary resize-none"
          />

          <Button
            variant="primary"
            onClick={() => mutation.mutate()}
            disabled={mutation.isPending}
            className="w-full"
          >
            {mutation.isPending ? 'Saving...' : success ? '✓ Logged!' : 'Log Mood'}
          </Button>
          {mutation.isError && <p className="text-danger text-sm text-center">Error saving. Try again.</p>}
        </CardContent>
      </Card>

      {/* History */}
      <Card>
        <CardHeader><CardTitle>Recent Logs</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[1,2,3].map(i => (
                <div key={i} className="flex items-center gap-3 py-3 border-b border-border">
                  <Skeleton className="w-10 h-10 rounded-full shrink-0" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-3 w-24" />
                    <Skeleton className="h-2.5 w-32" />
                  </div>
                  <Skeleton className="h-3 w-12" />
                </div>
              ))}
            </div>
          ) : !logs?.length ? (
            <div className="text-center py-10 text-text-muted">
              <p className="text-sm">No mood logs yet.</p>
              <p className="text-xs mt-1">Use the quick log above to track how you're feeling.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">{MOOD_EMOJIS[log.mood_score]}</span>
                    <div>
                      <div className="text-sm font-medium text-text-main">
                        {log.mood_score}/5
                        {log.stress_event && <span className="ml-2 text-xs text-warning">⚡ stress</span>}
                        {log.rsd_moment && <span className="ml-2 text-xs text-danger">⚠ RSD</span>}
                      </div>
                      {log.emotion_tags && log.emotion_tags.length > 0 && (
                        <div className="text-xs text-text-muted mt-0.5">{log.emotion_tags.join(', ')}</div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-text-muted">
                    {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
