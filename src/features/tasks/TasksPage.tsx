import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { Task, Priority, TaskSize, TaskEnergyType } from '../../types';
import { CheckSquare, Square, Trash2 } from 'lucide-react';

const PRIORITIES: { value: Priority; label: string; color: string }[] = [
  { value: 'must_today', label: '🔴 Must Today', color: 'text-danger' },
  { value: 'should_this_week', label: '🟡 This Week', color: 'text-warning' },
  { value: 'someday', label: '⚪ Someday', color: 'text-text-muted' },
];
const SIZES: TaskSize[] = ['5min', '30min', '2h_plus'];
const ENERGY_TYPES: TaskEnergyType[] = ['deep', 'admin', 'creative', 'physical'];

export default function TasksPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  const [title, setTitle] = useState('');
  const [priority, setPriority] = useState<Priority>('must_today');
  const [size, setSize] = useState<TaskSize>('30min');
  const [energyType, setEnergyType] = useState<TaskEnergyType>('admin');
  const [dueDate, setDueDate] = useState('');
  const [showForm, setShowForm] = useState(false);

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

  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold text-text-main">Tasks</h1>
        <Button variant="primary" onClick={() => setShowForm(!showForm)}>
          {showForm ? 'Cancel' : '+ Add Task'}
        </Button>
      </div>

      {showForm && (
        <Card>
          <CardHeader><CardTitle>New Task</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <input type="text" placeholder="Task title..." value={title} onChange={(e) => setTitle(e.target.value)}
              className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary" />

            <div>
              <p className="text-xs text-text-muted mb-2">Priority</p>
              <div className="flex gap-2">
                {PRIORITIES.map((p) => (
                  <button key={p.value} onClick={() => setPriority(p.value)}
                    className={`flex-1 py-2 rounded-sm text-xs border transition-colors ${priority === p.value ? 'bg-primary/10 border-primary text-text-main' : 'border-border text-text-muted hover:border-primary'}`}>
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
                      className={`flex-1 py-1 rounded-sm text-xs border transition-colors ${size === s ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'}`}>
                      {s}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs text-text-muted mb-2">Energy type</p>
                <div className="flex gap-1 flex-wrap">
                  {ENERGY_TYPES.map((e) => (
                    <button key={e} onClick={() => setEnergyType(e)}
                      className={`py-1 px-2 rounded-sm text-xs border transition-colors ${energyType === e ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'}`}>
                      {e}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className="text-xs text-text-muted mb-1 block">Due date (optional)</label>
              <input type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)}
                className="bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main focus:outline-none focus:border-primary" />
            </div>

            <Button variant="primary" onClick={() => addMutation.mutate()} disabled={addMutation.isPending} className="w-full">
              {addMutation.isPending ? 'Adding...' : 'Add Task'}
            </Button>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <p className="text-text-muted text-sm">Loading...</p>
      ) : (
        PRIORITIES.map(({ value, label, color }) =>
          grouped[value].length > 0 ? (
            <Card key={value}>
              <CardHeader><CardTitle><span className={color}>{label}</span></CardTitle></CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {grouped[value].map((task) => (
                    <div key={task.id} className={`flex items-center gap-3 py-2 border-b border-border last:border-0 ${task.completed ? 'opacity-50' : ''}`}>
                      <button onClick={() => toggleMutation.mutate({ id: task.id, completed: !task.completed })} className="flex-shrink-0 text-primary">
                        {task.completed ? <CheckSquare className="w-5 h-5" /> : <Square className="w-5 h-5 text-text-muted" />}
                      </button>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium ${task.completed ? 'line-through text-text-muted' : 'text-text-main'}`}>{task.title}</p>
                        <p className="text-xs text-text-muted">{task.size} · {task.energy_type} {task.due_date && `· due ${task.due_date}`}</p>
                      </div>
                      <button onClick={() => deleteMutation.mutate(task.id)} className="text-text-muted hover:text-danger transition-colors flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          ) : null
        )
      )}

      {!isLoading && !tasks?.length && (
        <p className="text-text-muted text-sm text-center py-8">No tasks yet. Add one above!</p>
      )}
    </div>
  );
}
