import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { JournalEntry } from '../../types';
import { Shuffle } from 'lucide-react';

const PROMPTS = [
  'What drained your energy today?',
  'What are you proud of today?',
  'What pattern did you notice in yourself?',
  'What would you do differently?',
  'What are you grateful for right now?',
  'What is your mind trying to avoid?',
];

const MOOD_EMOJIS = ['', '😞', '😕', '😐', '🙂', '😄'];

export default function JournalPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  const [body, setBody] = useState('');
  const [tags, setTags] = useState('');
  const [moodAtWriting, setMoodAtWriting] = useState<number | null>(null);
  const [promptUsed, setPromptUsed] = useState<string | null>(null);
  const [promptIndex, setPromptIndex] = useState(0);
  const [success, setSuccess] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: entries, isLoading } = useQuery({
    queryKey: ['journal-entries', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries')
        .select('*')
        .eq('user_id', user!.id)
        .order('timestamp', { ascending: false })
        .limit(20);
      if (error) throw error;
      return data as JournalEntry[];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!body.trim()) throw new Error('Journal entry cannot be empty');
      const today = new Date().toISOString().split('T')[0];
      const tagArray = tags ? tags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const { error } = await supabase.from('journal_entries').insert({
        user_id: user!.id,
        date: today,
        timestamp: new Date().toISOString(),
        body: body.trim(),
        tags: tagArray.length ? tagArray : null,
        mood_at_writing: moodAtWriting,
        prompt_used: promptUsed,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setBody(''); setTags(''); setMoodAtWriting(null); setPromptUsed(null);
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    },
  });

  const shuffle = () => {
    setPromptIndex((i) => (i + 1) % PROMPTS.length);
  };

  const usePrompt = () => {
    const p = PROMPTS[promptIndex];
    setPromptUsed(p);
    setBody(p + '\n\n');
  };

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold text-text-main">Journal & Ideas</h1>

      <Card>
        <CardHeader><CardTitle>New Entry</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          {/* Single prompt card */}
          <div className="rounded-sm border border-border bg-background p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Prompt (optional)</p>
              <button
                onClick={shuffle}
                className="flex items-center gap-1.5 text-xs text-text-muted hover:text-primary transition-colors duration-150"
              >
                <Shuffle className="w-3.5 h-3.5" />
                Shuffle
              </button>
            </div>
            <p className="text-sm text-text-main italic mb-3">
              "{PROMPTS[promptIndex]}"
            </p>
            <button
              onClick={usePrompt}
              className={`text-xs px-3 py-1 rounded-full border transition-colors duration-150 ${
                promptUsed === PROMPTS[promptIndex]
                  ? 'bg-primary text-white border-primary'
                  : 'border-border text-text-muted hover:border-primary hover:text-primary'
              }`}
            >
              {promptUsed === PROMPTS[promptIndex] ? '✓ Using this prompt' : 'Use this prompt'}
            </button>
          </div>

          <textarea
            placeholder="Write freely..."
            value={body}
            onChange={(e) => setBody(e.target.value)}
            rows={8}
            className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary resize-none"
          />

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Tags (comma-separated)</label>
              <input type="text" placeholder="e.g. reflection, adhd, work" value={tags} onChange={(e) => setTags(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary" />
            </div>
            <div>
              <p className="text-xs text-text-muted mb-2">Mood while writing</p>
              <div className="flex gap-2">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setMoodAtWriting(moodAtWriting === n ? null : n)}
                    className={`text-xl transition-all ${moodAtWriting === n ? 'scale-125' : 'opacity-50 hover:opacity-80'}`}>
                    {MOOD_EMOJIS[n]}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <Button variant="primary" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Saving...' : success ? '✓ Saved!' : 'Save Entry'}
          </Button>
          {mutation.isError && <p className="text-danger text-sm">{(mutation.error as Error).message}</p>}
        </CardContent>
      </Card>

      {/* Past entries */}
      <Card>
        <CardHeader><CardTitle>Past Entries</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-text-muted text-sm">Loading...</p>
          ) : !entries?.length ? (
            <p className="text-text-muted text-sm">No entries yet. Write your first one above.</p>
          ) : (
            <div className="space-y-3">
              {entries.map((e) => (
                <div key={e.id} className="py-3 border-b border-border last:border-0">
                  <div className="flex items-center justify-between cursor-pointer" onClick={() => setExpandedId(expandedId === e.id ? null : e.id)}>
                    <div>
                      <p className="text-sm text-text-main line-clamp-1">{e.body}</p>
                      {e.tags && <div className="flex gap-1 mt-1">{e.tags.map((t) => <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t}</span>)}</div>}
                    </div>
                    <div className="text-right ml-4 flex-shrink-0">
                      {e.mood_at_writing && <div className="text-base">{MOOD_EMOJIS[e.mood_at_writing]}</div>}
                      <div className="text-xs text-text-muted">{e.date}</div>
                    </div>
                  </div>
                  {expandedId === e.id && (
                    <p className="mt-3 text-sm text-text-muted whitespace-pre-wrap border-t border-border pt-3">{e.body}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
