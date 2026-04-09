import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { FoodLog, GICategory, MealType, EatingContext } from '../../types';

const GI_OPTIONS: { value: GICategory; label: string; color: string }[] = [
  { value: 'low', label: 'Low GI', color: 'text-primary' },
  { value: 'medium', label: 'Medium GI', color: 'text-warning' },
  { value: 'high', label: 'High GI', color: 'text-danger' },
  { value: 'zero', label: 'Zero / No Carbs', color: 'text-text-muted' },
];
const MEAL_TYPES: MealType[] = ['meal', 'snack', 'caffeine', 'water', 'supplement', 'alcohol'];
const EATING_CONTEXTS: EatingContext[] = ['planned', 'impulsive', 'stress', 'boredom', 'forgot', 'not_hungry', 'social'];

const GI_BADGE: Record<GICategory, string> = {
  low: 'bg-primary/20 text-primary',
  medium: 'bg-warning/20 text-warning',
  high: 'bg-danger/20 text-danger',
  zero: 'bg-border text-text-muted',
};

export default function NutritionPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  const [foodName, setFoodName] = useState('');
  const [giCategory, setGiCategory] = useState<GICategory>('low');
  const [mealType, setMealType] = useState<MealType>('meal');
  const [eatingContext, setEatingContext] = useState<EatingContext>('planned');
  const [hungerLevel, setHungerLevel] = useState(3);
  const [glValue, setGlValue] = useState('');
  const [notes, setNotes] = useState('');
  const [success, setSuccess] = useState(false);

  const { data: logs, isLoading } = useQuery({
    queryKey: ['food-logs', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const today = new Date(); today.setHours(0, 0, 0, 0);
      const { data, error } = await supabase
        .from('food_logs')
        .select('*')
        .eq('user_id', user!.id)
        .gte('timestamp', today.toISOString())
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return data as FoodLog[];
    },
  });

  const mutation = useMutation({
    mutationFn: async () => {
      if (!foodName.trim()) throw new Error('Food name required');
      const { error } = await supabase.from('food_logs').insert({
        user_id: user!.id,
        timestamp: new Date().toISOString(),
        food_name: foodName.trim(),
        gi_category: giCategory,
        gl_value: glValue ? Number(glValue) : null,
        meal_type: mealType,
        eating_context: eatingContext,
        hunger_level: hungerLevel,
        notes: notes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['food-logs'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-stats'] });
      setFoodName(''); setGlValue(''); setNotes('');
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2000);
    },
  });

  return (
    <div className="space-y-6 pb-12">
      <h1 className="text-3xl font-bold text-text-main">Nutrition & GI</h1>

      <Card>
        <CardHeader><CardTitle>Log Food</CardTitle></CardHeader>
        <CardContent className="space-y-5">
          <div>
            <label className="text-xs text-text-muted mb-1 block">Food / Drink name</label>
            <input
              type="text"
              placeholder="e.g. Oatmeal with banana"
              value={foodName}
              onChange={(e) => setFoodName(e.target.value)}
              className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary"
            />
          </div>

          {/* GI Category */}
          <div>
            <p className="text-xs text-text-muted mb-2">GI Category</p>
            <div className="grid grid-cols-2 gap-2">
              {GI_OPTIONS.map(({ value, label, color }) => (
                <button key={value} onClick={() => setGiCategory(value)}
                  className={`py-2 px-3 rounded-sm text-sm border transition-colors duration-150 text-left ${
                    giCategory === value ? 'bg-primary/10 border-primary text-text-main' : 'border-border text-text-muted hover:border-primary'
                  }`}>
                  <span className={`font-medium ${color}`}>●</span> {label}
                </button>
              ))}
            </div>
          </div>

          {/* Meal Type */}
          <div>
            <p className="text-xs text-text-muted mb-2">Meal type</p>
            <div className="flex flex-wrap gap-2">
              {MEAL_TYPES.map((t) => (
                <button key={t} onClick={() => setMealType(t)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${
                    mealType === t ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'
                  }`}>
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Eating Context */}
          <div>
            <p className="text-xs text-text-muted mb-2">Why are you eating?</p>
            <div className="flex flex-wrap gap-2">
              {EATING_CONTEXTS.map((c) => (
                <button key={c} onClick={() => setEatingContext(c)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors duration-150 ${
                    eatingContext === c ? 'bg-primary text-white border-primary' : 'border-border text-text-muted hover:border-primary'
                  }`}>
                  {c.replace(/_/g, ' ')}
                </button>
              ))}
            </div>
          </div>

          {/* Hunger */}
          <div>
            <p className="text-xs text-text-muted mb-2">Hunger level: {hungerLevel}/5</p>
            <input type="range" min="1" max="5" step="1" value={hungerLevel} onChange={(e) => setHungerLevel(Number(e.target.value))}
              className="w-full accent-primary h-2 cursor-pointer" />
            <div className="flex justify-between text-xs text-text-muted mt-1">
              <span>Not hungry</span><span>Starving</span>
            </div>
          </div>

          {/* GL Value + Notes */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs text-text-muted mb-1 block">GL Value (optional)</label>
              <input type="number" placeholder="e.g. 12" value={glValue} onChange={(e) => setGlValue(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary" />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">Notes (optional)</label>
              <input type="text" placeholder="anything else..." value={notes} onChange={(e) => setNotes(e.target.value)}
                className="w-full bg-background border border-border rounded-sm px-3 py-2 text-sm text-text-main placeholder-text-muted focus:outline-none focus:border-primary" />
            </div>
          </div>

          <Button variant="primary" onClick={() => mutation.mutate()} disabled={mutation.isPending} className="w-full">
            {mutation.isPending ? 'Saving...' : success ? '✓ Logged!' : 'Log Food'}
          </Button>
          {mutation.isError && <p className="text-danger text-sm text-center">{(mutation.error as Error).message}</p>}
        </CardContent>
      </Card>

      {/* Today's Log */}
      <Card>
        <CardHeader><CardTitle>Today's Food Log</CardTitle></CardHeader>
        <CardContent>
          {isLoading ? (
            <p className="text-text-muted text-sm">Loading...</p>
          ) : !logs?.length ? (
            <p className="text-text-muted text-sm">Nothing logged today.</p>
          ) : (
            <div className="space-y-3">
              {logs.map((log) => (
                <div key={log.id} className="flex items-center justify-between py-3 border-b border-border last:border-0">
                  <div>
                    <div className="text-sm font-medium text-text-main">{log.food_name}</div>
                    <div className="flex gap-2 mt-1">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${GI_BADGE[log.gi_category]}`}>{log.gi_category} GI</span>
                      <span className="text-xs text-text-muted">{log.meal_type}</span>
                      <span className="text-xs text-text-muted">{log.eating_context}</span>
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
