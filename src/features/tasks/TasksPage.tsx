import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import { Skeleton, SkeletonCard } from '../../components/ui/Skeleton';
import type { Task, Priority, TaskSize, TaskEnergyType } from '../../types';
import { CheckSquare, Square, Trash2, Zap, Info } from 'lucide-react';

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'must_today',       label: '🔴 Must Today', color: 'text-danger' },
  { value: 'should_this_week', label: '🟡 This Week',  color: 'text-warning' },
  { value: 'someday',          label: '⚪ Someday',    color: 'text-text-muted' },
];
const SIZES: TaskSize[] = ['5min', '30min', '2h_plus'];
const ENERGY_TYPES: TaskEnergyType[] = ['deep', 'admin', 'creative', 'physical'];

// ── Energy × mood matching (ADHD cognitive-load theory) ───────────────
// Maps mood score bands to suitable task energy types, from highest to lowest suitability
const ENERGY_MATCH: Record<number, { best: TaskEnergyType[]; label: string; emoji: string; tip: string }> = {
  1: { best: ['admin'],                       emoji: '🪫', label: 'Running on empty',  tip: 'Low demand tasks only — your brain needs easy wins right now.' },
  2: { best: ['admin', 'physical'],           emoji: '😮‍💨', label: 'Low energy',        tip: 'Stick to admin or physical tasks — avoid anything cognitively heavy.' },
  3: { best: ['admin', 'creative', 'physical'], emoji: '⚡', label: 'Moderate energy', tip: 'Admin and creative tasks are a good fit. Save deep work for a better window.' },
  4: { best: ['creative', 'deep', 'admin'],   emoji: '🔥', label: 'Good energy',       tip: 'Great time for creative or deep work.' },
  5: { best: ['deep', 'creative'],            emoji: '🚀', label: 'Peak energy',       tip: 'This is your window for deep, high-stakes work. Protect it.' },
};

function getEnergyMatch(moodScore: number) {
  const clamped = Math.max(1, Math.min(5, Math.round(moodScore)));
  return ENERGY_MATCH[clamped];
}

const ENERGY_COLORS: Record<TaskEnergyType, string> = {
  deep:     'text-primary',
  admin:    'text-text-muted',
  creative: 'text-amber-400',
  physical: 'text-emerald-400',
};

export default function TasksPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('must_today');
  const [size, setSize] = useState<TaskSize>('30min');
  const [energyType, setEnergyType] = useState<TaskEnergyType>('admin');
  const [dueDate, setDueDate] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showMatchInfo, setShowMatchInfo] = useState(false);

  // ── Latest mood for energy matching ──────────────────────────────────
  const { data: latestMood } = useQuery({
    queryKey: ['latest-mood-for-tasks', user?.id],
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const { data } = await supabase
        .from('mood_logs')
        .select('mood_score, timestamp')
        .eq('user_id', user!.id)
        .order('timestamp', { ascending: false })
        .limit(1)
        .maybeSingle();
      return data;
    },
  });

  const { data: tasks, isLoading } = useQuery({
    queryKey: ['tasks', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user!.id)
        .order('completed', { ascending: true })
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Task[];
    },
  });

  const addMutation = useMutation({
    mutationFn: async () => {
      if (!title.trim()) throw new Error('Title required');
      const { error } = await supabase.from('tasks').insert({
        user_id: user!.id,
        title: title.trim(),
        priority,
        size,
        energy_type: energyType,
        due_date: dueDate || null,
        completed: false,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
      queryClient.invalidateQueries({ queryKey: ['streak'] });
      setTitle(''); setDueDate(''); setShowForm(false);
    },
  });

  const toggleMutation = useMutation({
    mutationFn: async ({ id, completed }: { id: string; completed: boolean }) => {
      const { error } = await supabase.from('tasks').update({ completed }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('tasks').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });

  const grouped = PRIORITIES.reduce((acc, p) => {
    acc[p.value] = tasks?.filter((t) => t.priority === p.value) || [];
    return acc;
  }, {} as Record<Priority, Task[]>);

  // Energy match logic
  const energyMatch = latestMood ? getEnergyMatch(latestMood.mood_score) : null;
  const moodAgeMinutes = latestMood
    ? Math.round((Date.now() - new Date(latestMood.timestamp).getTime()) / 60000)
    : null;
  const moodRecent = moodAgeMinutes !== null && moodAgeMinutes < 180; // only show if logged within 3h

  const isMatchedTask = (task: Task) =>
    energyMatch && moodRecent && energyMatch.best.includes(task.energy_type);

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-main">Tasks</h1>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Task'}
        </Button>
      </div>

      {/* ── Energy match banner ── */}
      {energyMatch && moodRecent && latestMood && (
        <div className={`rounded-2xl p-4 ring-1 ring-inset ring-black/5 ${
          latestMood.mood_score >= 4 ? 'bg-primary/5' : latestMood.mood_score <= 2 ? 'bg-warning/5' : 'bg-card'
        }`}>
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3">
              <span className="text-2xl">{energyMatch.emoji}</span>
              <div>
                <p className="text-sm font-semibold text-text-main">
                  {energyMatch.label} — {moodAgeMinutes! < 60 ? `${moodAgeMinutes}m ago` : `${Math.round(moodAgeMinutes! / 60)}h ago`}
                </p>
                <p className="text-xs text-text-muted mt-0.5">{energyMatch.tip}</p>
              </div>
            </div>
            <button
              onClick={() => setShowMatchInfo(v => !v)}
              className="text-text-muted hover:text-text-main transition-colors shrink-0"
              title="How does energy matching work?"
            >
              <Info className="w-4 h-4" />
            </button>
          </div>
          {showMatchInfo && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-text-muted leading-relaxed">
                <strong className="text-text-main">Energy matching</strong> suggests tasks based on your latest mood log.
                ADHD executive function varies significantly with emotional state — doing the right task at the right
                energy level reduces cognitive friction and improves completion rates.
                Tasks highlighted with <Zap className="w-3 h-3 inline text-primary" /> match your current state.
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Add task form ── */}
      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Task</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <input
              type="text"
              placeholder="Task title..."
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && title.trim() && addMutation.mutate()}
              autoFocus
              className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary"
            />

            <div>
              <p className="text-xs text-text-muted mb-2">Priority</p>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button key={p.value} onClick={() => setPriority(p.value)}
                    className={`flex-1 py-2 rounded-lg text-xs border transition-colors ${
                      priority === p.value ? 'bg-primary/10 border-primary text-text-main' : 'border-border text-text-muted hover:border-primary'
                    }`}>
                    {p.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-xs text-text-muted mb-2">Size</p>
                <div className="flex gap-1">
                  {SIZES.map((s) => (
                    <button key={s} onClick={() => setSize(s)}
                      className={`flex-1 py-1 rounded-lg text-xs border transition-colors ${
                        size === s ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'
                      }`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-2">
                  Energy type
                  {energyMatch && moodRecent && (
                    <span className="ml-1 text-primary">· {energyMatch.best[0]} recommended</span>
                  )}
                </p>
                <div className="flex gap-1 flex-wrap">
                  {ENERGY_TYPES.map((e) => (
                    <button key={e} onClick={() => setEnergyType(e)}
                      className={`py-1 px-2 rounded-lg text-xs border transition-colors ${
                        energyType === e ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'
                      }`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted mb-1 block">Due date (optional)</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" />
            </div>

            <Button variant="primary" onClick={() => addMutation.mutate()} disabled={addMutation.isPending || !title.trim()} className="w-full">
              {addMutation.isPending ? 'Adding...' : 'Add Task'}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* ── Task list ── */}
      {isLoading ? (
        <div className="space-y-4">
          <SkeletonCard />
          <SkeletonCard rows={2} />
        </div>
      ) : (
        PRIORITIES.map(({ value, label, color }) =>
          grouped[value].length > 0 ? (
            <Card key={value}>
              <CardHeader>
                <CardTitle><span className={color}>{label}</span></CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {grouped[value].map((task) => {
                    const matched = isMatchedTask(task);
                    return (
                      <div
                        key={task.id}
                        className={`flex items-center gap-3 py-2.5 px-2 rounded-xl border transition-all ${
                          task.completed
                            ? 'opacity-40 border-transparent'
                            : matched
                              ? 'border-primary/20 bg-primary/5'
                              : 'border-transparent hover:bg-forest'
                        }`}
                      >
                        <button
                          onClick={() => toggleMutation.mutate({ id: task.id, completed: !task.completed })}
                          className="shrink-0 text-primary"
                        >
                          {task.completed
                            ? <CheckSquare className="w-5 h-5" />
                            : <Square className="w-5 h-5 text-text-muted" />
                          }
                        </button>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            {matched && !task.completed && (
                              <Zap className="w-3.5 h-3.5 text-primary shrink-0" title="Matches your current energy" />
                            )}
                            <p className={`text-sm font-medium ${task.completed ? 'line-through text-text-muted' : 'text-text-main'}`}>
                              {task.title}
                            </p>
                          </div>
                          <p className="text-xs text-text-muted mt-0.5">
                            <span className={ENERGY_COLORS[task.energy_type]}>●</span>{' '}
                            {task.energy_type} · {task.size}
                            {task.due_date && ` · due ${task.due_date}`}
                          </p>
                        </div>
                        <button
                          onClick={() => deleteMutation.mutate(task.id)}
                          className="text-text-muted hover:text-danger transition-colors shrink-0 p-1"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          ) : null
        )
      )}

      {!isLoading && !tasks?.length && (
        <div className="text-center py-12 text-text-muted">
          <CheckSquare className="w-12 h-12 mx-auto mb-3 opacity-20" />
          <p className="text-sm">No tasks yet.</p>
          <p className="text-xs mt-1">Add a task above — tag it with energy type so Aware can match it to your mood.</p>
        </div>
      )}
    </div>
  );
}
