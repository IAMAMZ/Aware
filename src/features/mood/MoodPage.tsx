import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { MoodLog } from '../../types';

const EMOTION_TAGS = ['happy', 'anxious', 'focused', 'tired', 'irritable', 'calm', 'overwhelmed', 'motivated', 'sad', 'grateful'];
const MOOD_EMOJIS = ['', '😞', '😕', '😐', '🙂', '😄'];

export default function MoodPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  const [moodScore, setMoodScore] = useState<number>(3);
  const [tags, setTags] = useState<string[]>([]);
  const [stressEvent, setStressEvent] = useState(false);
  const [rsdMoment, setRsdMoment] = useState(false);
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

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

  const toggleTag = (tag: string) =>
    setTags((prev) => (prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]));

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold text-text-main">Emotions & Mood</h1>

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
            <p className="text-text-muted text-sm">Loading...</p>
          ) : !logs?.length ? (
            <p className="text-text-muted text-sm">No mood logs yet.</p>
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
