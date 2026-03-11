import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { CalendarEvent, Task, DailyIntention } from '../../types';
import {
  formatTime,
  ENERGY_COLORS,
  DEFAULT_ENERGY_COLOR,
} from '../calendar/calendarUtils';
import {
  Sunrise,
  Zap,
  Clock,
  Calendar,
  Target,
  CheckSquare,
  ChevronRight,
  ChevronLeft,
  Sparkles,
  Save,
  Edit3,
} from 'lucide-react';

// ─── Morning quotes (energizing / forward-looking) ──────────────────
const MORNING_QUOTES = [
  { text: "Today is a page you haven't written yet. The plot is yours to decide.", author: "Reminder" },
  { text: "You don't need to do everything. You need to do the RIGHT thing, once.", author: "Gary Keller" },
  { text: "The best time to plant a tree was 20 years ago. The second best time is right now.", author: "Chinese Proverb" },
  { text: "Your ADHD brain is designed for sprints, not marathons. Plan short wins today.", author: "ADHD Strategy" },
  { text: "Start before you're ready. Perfection is the enemy of done.", author: "Steven Pressfield" },
  { text: "What you do today is the foundation for tomorrow. Even small bricks count.", author: "Reminder" },
  { text: "Code isn't written in one commit. It's built one function, one test, one bug fix at a time.", author: "Dev Wisdom" },
  { text: "The morning is the most important line of code you'll write today. Don't skip it.", author: "Dev Wisdom" },
  { text: "Energy management > time management. Match tasks to how you feel, not the clock.", author: "ADHD Strategy" },
  { text: "Today you don't need motivation. You need a system. That's why you're here.", author: "Reminder" },
];

const ENERGY_LABELS = ['', '🪫 Running on empty', '😮‍💨 Low but trying', '⚡ Decent', '🔥 Good energy', '🚀 Let\'s go'];

export default function DayAheadPage() {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);
  const todayStr = today.toISOString().split('T')[0];
  const dayStart = today.toISOString();
  const dayEnd = new Date(today.getTime() + 86400000).toISOString();

  // ── Quote rotation ──
  const [quoteIdx, setQuoteIdx] = useState(() => new Date().getDate() % MORNING_QUOTES.length);
  const [quoteFade, setQuoteFade] = useState(false);

  useEffect(() => {
    const id = setInterval(() => {
      setQuoteFade(true);
      setTimeout(() => { setQuoteIdx((i) => (i + 1) % MORNING_QUOTES.length); setQuoteFade(false); }, 300);
    }, 10_000);
    return () => clearInterval(id);
  }, []);

  const nextQuote = () => {
    setQuoteFade(true);
    setTimeout(() => { setQuoteIdx((i) => (i + 1) % MORNING_QUOTES.length); setQuoteFade(false); }, 300);
  };
  const prevQuote = () => {
    setQuoteFade(true);
    setTimeout(() => { setQuoteIdx((i) => (i - 1 + MORNING_QUOTES.length) % MORNING_QUOTES.length); setQuoteFade(false); }, 300);
  };

  // ── Fetch today's events ──
  const { data: events = [] } = useQuery({
    queryKey: ['ahead-events', user?.id, dayStart],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events').select('*')
        .eq('user_id', user!.id)
        .gte('start_time', dayStart).lt('start_time', dayEnd)
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });

  // ── Fetch must_today tasks ──
  const { data: urgentTasks = [] } = useQuery({
    queryKey: ['ahead-tasks', user?.id],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('tasks').select('*')
        .eq('user_id', user!.id)
        .eq('completed', false)
        .in('priority', ['must_today', 'should_this_week'])
        .order('priority', { ascending: true })
        .limit(10);
      if (error) throw error;
      return data as Task[];
    },
  });

  // ── Fetch existing intention for today ──
  const { data: existingIntention } = useQuery({
    queryKey: ['daily-intention', user?.id, todayStr],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_intentions').select('*')
        .eq('user_id', user!.id).eq('date', todayStr)
        .maybeSingle();
      if (error) throw error;
      return data as DailyIntention | null;
    },
  });

  // ── Form state ──
  const [intention, setIntention] = useState('');
  const [morningEnergy, setMorningEnergy] = useState<number | null>(null);
  const [selectedPriorities, setSelectedPriorities] = useState<string[]>([]);
  const [saved, setSaved] = useState(false);
  const [isEditing, setIsEditing] = useState(false);

  // Populate from existing intention
  useEffect(() => {
    if (existingIntention) {
      setIntention(existingIntention.intention || '');
      setMorningEnergy(existingIntention.morning_energy);
      setSelectedPriorities(existingIntention.top_priorities || []);
    }
  }, [existingIntention]);

  const alreadySaved = !!existingIntention && !isEditing;

  const togglePriority = (title: string) => {
    setSelectedPriorities((prev) =>
      prev.includes(title)
        ? prev.filter((t) => t !== title)
        : prev.length < 3
          ? [...prev, title]
          : prev
    );
  };

  // ── Save / Update mutation ──
  const saveMutation = useMutation({
    mutationFn: async () => {
      const payload = {
        user_id: user!.id,
        date: todayStr,
        intention: intention.trim() || null,
        top_priorities: selectedPriorities.length ? selectedPriorities : null,
        morning_energy: morningEnergy,
      };

      if (existingIntention) {
        const { error } = await supabase
          .from('daily_intentions').update(payload)
          .eq('id', existingIntention.id);
        if (error) throw error;
      } else {
        const { error } = await supabase.from('daily_intentions').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['daily-intention'] });
      setSaved(true);
      setIsEditing(false);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  // ── Computed ──
  const totalMinutes = events.reduce((sum, e) => {
    const dur = (new Date(e.end_time).getTime() - new Date(e.start_time).getTime()) / 60_000;
    return sum + dur;
  }, 0);
  const focusBlocks = events.filter((e) => e.is_focus_block).length;
  const freeMinutes = Math.max(0, (16 * 60) - totalMinutes); // 16 waking hours

  const now = new Date();
  const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="flex items-center gap-3">
        <Sunrise className="w-7 h-7 text-amber-500" />
        <div>
          <h1 className="text-2xl font-bold text-text-main">{greeting}, {user?.email?.split('@')[0]}</h1>
          <p className="text-sm text-text-muted">
            {today.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
      </div>

      {/* ── Morning Quote ── */}
      <Card className="bg-gradient-to-br from-amber-50 to-amber-50/30 border-amber-200/50">
        <CardContent className="p-5">
          <div className="flex items-center gap-2">
            <button onClick={prevQuote} className="p-1 rounded-full hover:bg-amber-100 transition-colors text-amber-400 hover:text-amber-600 flex-shrink-0">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div
              className="flex-1 transition-all duration-300"
              style={{ opacity: quoteFade ? 0 : 1, transform: quoteFade ? 'translateY(6px)' : 'translateY(0)' }}
            >
              <p className="text-sm text-amber-900 italic leading-relaxed">
                "{MORNING_QUOTES[quoteIdx].text}"
              </p>
              <p className="text-xs text-amber-600 mt-1 font-medium">— {MORNING_QUOTES[quoteIdx].author}</p>
            </div>
            <button onClick={nextQuote} className="p-1 rounded-full hover:bg-amber-100 transition-colors text-amber-400 hover:text-amber-600 flex-shrink-0">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </CardContent>
      </Card>

      {/* ── Today's Schedule Overview ── */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Calendar className="w-5 h-5 text-primary" /> Today's Schedule
            </CardTitle>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-0.5"
            >
              Edit <ChevronRight className="w-3 h-3" />
            </button>
          </div>
        </CardHeader>
        <CardContent>
          {events.length === 0 ? (
            <div className="text-center py-6 text-text-muted">
              <Calendar className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">No events today.</p>
              <button onClick={() => navigate('/calendar')} className="text-primary text-sm mt-1 hover:underline">
                Add some →
              </button>
            </div>
          ) : (
            <>
              {/* Quick stats */}
              <div className="flex gap-4 text-xs text-text-muted mb-3 pb-3 border-b border-border/50">
                <span>{events.length} events</span>
                <span>{Math.round(totalMinutes / 60)}h scheduled</span>
                {focusBlocks > 0 && <span className="text-amber-600">⚡ {focusBlocks} focus blocks</span>}
                <span className="text-primary">{Math.round(freeMinutes / 60)}h free</span>
              </div>

              <div className="space-y-2">
                {events.map((event) => {
                  const colors = ENERGY_COLORS[event.energy_type || ''] || DEFAULT_ENERGY_COLOR;
                  const isPast = new Date(event.end_time).getTime() < Date.now();
                  return (
                    <div
                      key={event.id}
                      className={`flex items-center gap-3 py-2 px-3 rounded-sm border-l-[3px] ${colors.border}
                        ${isPast ? 'opacity-50' : ''} ${colors.bg}`}
                    >
                      {event.is_focus_block && <Zap className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />}
                      <div className="flex-1 min-w-0">
                        <span className="text-sm font-medium text-text-main">{event.title}</span>
                      </div>
                      <span className="text-xs text-text-muted flex items-center gap-1 flex-shrink-0">
                        <Clock className="w-3 h-3" />
                        {formatTime(event.start_time)} – {formatTime(event.end_time)}
                      </span>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Set Your Intention ── */}
      <Card className={alreadySaved ? 'border-primary/30 bg-primary/[0.02]' : ''}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2 text-base">
              <Target className="w-5 h-5 text-primary" /> Today's Intention
            </CardTitle>
            {alreadySaved && (
              <button
                onClick={() => setIsEditing(true)}
                className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-1"
              >
                <Edit3 className="w-3 h-3" /> Edit
              </button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {alreadySaved ? (
            /* ── Saved state ── */
            <div className="space-y-3">
              {existingIntention?.intention && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Intention</p>
                  <p className="text-sm text-text-main font-medium">{existingIntention.intention}</p>
                </div>
              )}
              {existingIntention?.morning_energy && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Morning energy</p>
                  <p className="text-sm">{ENERGY_LABELS[existingIntention.morning_energy]}</p>
                </div>
              )}
              {existingIntention?.top_priorities && existingIntention.top_priorities.length > 0 && (
                <div>
                  <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Top priorities</p>
                  <div className="space-y-1">
                    {existingIntention.top_priorities.map((p, i) => (
                      <div key={i} className="flex items-center gap-2 text-sm text-text-main">
                        <span className="w-5 h-5 rounded-full bg-primary/10 text-primary text-xs flex items-center justify-center font-bold flex-shrink-0">
                          {i + 1}
                        </span>
                        {p}
                      </div>
                    ))}
                  </div>
                </div>
              )}
              <div className="flex items-center gap-2 text-xs text-primary font-medium pt-1">
                <Sparkles className="w-3.5 h-3.5" /> Day planned — you're set! Check in tonight on Day Review.
              </div>
            </div>
          ) : (
            /* ── Edit state ── */
            <>
              {/* Intention text */}
              <div>
                <label className="text-xs text-text-muted mb-1 block">
                  What's your ONE intention today? (keep it focused)
                </label>
                <input
                  type="text"
                  placeholder="e.g. Finish the auth module, stay off Twitter until 5pm..."
                  value={intention}
                  onChange={(e) => setIntention(e.target.value)}
                  className="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm text-text-main
                    placeholder-text-muted focus:outline-none focus:border-primary"
                />
              </div>

              {/* Morning energy */}
              <div>
                <p className="text-xs text-text-muted mb-2">How's your energy this morning?</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((n) => (
                    <button
                      key={n}
                      onClick={() => setMorningEnergy(morningEnergy === n ? null : n)}
                      className={`flex-1 py-2 rounded-sm text-xs border transition-all text-center
                        ${morningEnergy === n
                          ? 'bg-primary text-white border-primary scale-105'
                          : 'border-border text-text-muted hover:border-primary'
                        }`}
                    >
                      {ENERGY_LABELS[n].split(' ')[0]}<br />
                      <span className="text-[10px] opacity-80">{ENERGY_LABELS[n].split(' ').slice(1).join(' ')}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Top 3 priorities */}
              <div>
                <p className="text-xs text-text-muted mb-2">
                  Pick up to 3 priorities <span className="text-text-muted/60">(from your tasks)</span>
                </p>
                {urgentTasks.length === 0 ? (
                  <p className="text-xs text-text-muted italic">No open tasks. <button onClick={() => navigate('/tasks')} className="text-primary hover:underline">Add some →</button></p>
                ) : (
                  <div className="space-y-1.5">
                    {urgentTasks.map((task) => {
                      const selected = selectedPriorities.includes(task.title);
                      const idx = selectedPriorities.indexOf(task.title);
                      return (
                        <button
                          key={task.id}
                          onClick={() => togglePriority(task.title)}
                          className={`w-full flex items-center gap-2 py-2 px-3 rounded-sm border text-left text-sm transition-all
                            ${selected
                              ? 'border-primary bg-primary/5 text-text-main'
                              : selectedPriorities.length >= 3
                                ? 'border-border text-text-muted/50 cursor-not-allowed'
                                : 'border-border text-text-muted hover:border-primary hover:text-text-main'
                            }`}
                          disabled={!selected && selectedPriorities.length >= 3}
                        >
                          {selected ? (
                            <span className="w-5 h-5 rounded-full bg-primary text-white text-xs flex items-center justify-center font-bold flex-shrink-0">
                              {idx + 1}
                            </span>
                          ) : (
                            <CheckSquare className="w-4 h-4 flex-shrink-0 opacity-30" />
                          )}
                          <span className="flex-1">{task.title}</span>
                          <span className="text-xs opacity-50">{task.size} · {task.energy_type}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>

              {/* Save */}
              <Button
                variant="primary"
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="w-full gap-2"
              >
                <Save className="w-4 h-4" />
                {saveMutation.isPending ? 'Saving...' : saved ? '✓ Saved!' : existingIntention ? 'Update Intention' : 'Lock In My Day'}
              </Button>
              {saveMutation.isError && (
                <p className="text-danger text-sm">{(saveMutation.error as Error).message}</p>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* ── Quick Links ── */}
      <div className="grid grid-cols-2 gap-3">
        <button
          onClick={() => navigate('/calendar')}
          className="p-4 rounded-sm border border-border bg-white hover:border-primary hover:bg-primary/5
            transition-colors text-left group"
        >
          <Calendar className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm font-medium text-text-main group-hover:text-primary transition-colors">Edit Calendar</p>
          <p className="text-xs text-text-muted">Add or move events</p>
        </button>
        <button
          onClick={() => navigate('/tasks')}
          className="p-4 rounded-sm border border-border bg-white hover:border-primary hover:bg-primary/5
            transition-colors text-left group"
        >
          <CheckSquare className="w-5 h-5 text-primary mb-2" />
          <p className="text-sm font-medium text-text-main group-hover:text-primary transition-colors">Manage Tasks</p>
          <p className="text-xs text-text-muted">Update priorities</p>
        </button>
      </div>

      {/* ── Footer ── */}
      <div className="text-center py-4">
        <p className="text-2xl mb-2">☀️</p>
        <p className="text-sm text-text-muted">
          You've planned. Now go do. Check in tonight on{' '}
          <button onClick={() => navigate('/review')} className="text-primary hover:underline">
            Day Review
          </button>.
        </p>
      </div>
    </div>
  );
}
