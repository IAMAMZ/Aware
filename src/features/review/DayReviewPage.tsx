import { useState, useMemo, useEffect, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent, CardHeader, CardTitle } from '../../components/ui/Card';
import { Button } from '../../components/ui/Button';
import type { CalendarEvent, DailyIntention } from '../../types';
import {
  formatTime,
  ENERGY_COLORS,
  DEFAULT_ENERGY_COLOR,
} from '../calendar/calendarUtils';
import {
  Moon,
  CheckCircle2,
  XCircle,
  MinusCircle,
  ChevronLeft,
  ChevronRight,
  Zap,
  Clock,
  Sparkles,
  Calendar,
  Timer,
  Target,
  Quote,
  BookText,
  Shuffle,
  Sunrise,
} from 'lucide-react';

// ─── Motivational quotes for ADHD / CS students ──────────────────────
const QUOTES = [
  { text: "You don't have to be productive every second to be successful. Rest is part of the process.", author: "James Clear" },
  { text: "The secret to getting ahead is getting started. Not getting it perfect — getting it started.", author: "Mark Twain" },
  { text: "Your worth is not measured by your productivity.", author: "Reminder" },
  { text: "Done is better than perfect. Ship it, learn from it, iterate.", author: "Sheryl Sandberg" },
  { text: "The ADHD brain isn't broken — it runs on interest, novelty, challenge, and urgency. Design your day around that.", author: "Dr. William Dodson" },
  { text: "Progress, not perfection. You showed up today. That matters.", author: "Reminder" },
  { text: "If you spent the day debugging, you DID work. Debugging is engineering.", author: "CS Truth" },
  { text: "Time blindness isn't laziness. Struggling with time management doesn't mean you're failing — it means you're navigating a harder version of the same game.", author: "ADHD Insight" },
  { text: "You aren't behind. You are on your own timeline, solving problems most people don't even know exist.", author: "Reminder" },
  { text: "The compiler doesn't care how stressed you were. The code either works or it doesn't — and tomorrow it'll work better.", author: "CS Truth" },
  { text: "Your brain has a different CPU architecture. It's not slower — it's optimized for different workloads.", author: "ADHD Analogy" },
  { text: "Every expert was once a beginner who didn't quit on a bad day.", author: "Anonymous" },
  { text: "The fact that you're tracking your day means you care. That's already ahead of most people.", author: "Self-awareness" },
  { text: "Hyperfocus is your superpower. Today, forgive yourself for the moments it wasn't there.", author: "ADHD Insight" },
  { text: "Three steps forward, one step back is still two steps forward. Count those.", author: "Reminder" },
  { text: "Sleep isn't optional — it's where your brain consolidates everything you learned today. Go rest.", author: "Neuroscience" },
  { text: "Imposter syndrome means you're growing. The people who don't feel it aren't pushing themselves.", author: "CS Truth" },
  { text: "You didn't waste the day. You ran your process. Now close the terminal and rest.", author: "Dev Wisdom" },
];

const WINDING_DOWN_TIPS = [
  "🧠 Brain dump: write down anything still on your mind so you can let it go tonight",
  "📱 Set your phone to Do Not Disturb — your notifications will survive until morning",
  "🫗 Hydrate — your brain needs water to process what it learned today",
  "📘 If you can't sleep, read something boring (textbook works perfectly)",
  "🎧 Try brown noise or rain sounds — many ADHD brains find them calming",
  "✅ Set out tomorrow's clothes/bag now — reduce morning decision fatigue",
  "🌙 You did what you could with the energy you had. That's enough.",
];

const JOURNAL_PROMPTS = [
  'What drained your energy today?',
  'What are you proud of today?',
  'What pattern did you notice in yourself?',
  'What would you do differently?',
  'What are you grateful for right now?',
  'What is your mind trying to avoid?',
];

const MOOD_EMOJIS = ['', '😞', '😕', '😐', '🙂', '😄'];

type CheckinMap = Record<string, { status: string; reason?: string | null }>;

export default function DayReviewPage() {
  const { user } = useAppStore();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  // ── Date navigation ──
  const [reviewDate, setReviewDate] = useState(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  });

  const isToday = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    return reviewDate.getTime() === now.getTime();
  }, [reviewDate]);

  const dateLabel = useMemo(() => {
    return reviewDate.toLocaleDateString('en-US', {
      weekday: 'long', month: 'long', day: 'numeric', year: 'numeric',
    });
  }, [reviewDate]);

  const goPrev = () => setReviewDate((d) => { const p = new Date(d); p.setDate(p.getDate() - 1); return p; });
  const goNext = () => setReviewDate((d) => { const n = new Date(d); n.setDate(n.getDate() + 1); return n; });
  const goToday = () => { const d = new Date(); d.setHours(0, 0, 0, 0); setReviewDate(d); };

  const dayStart = reviewDate.toISOString();
  const dayEnd = new Date(reviewDate.getTime() + 86400000).toISOString();

  // ── Rotating quotes ──
  const [quoteIndex, setQuoteIndex] = useState(() => {
    const h = reviewDate.getDate() + reviewDate.getMonth() * 31;
    return h % QUOTES.length;
  });
  const [quoteTransition, setQuoteTransition] = useState(false);

  // Auto-rotate every 12 seconds
  useEffect(() => {
    const id = setInterval(() => {
      setQuoteTransition(true);
      setTimeout(() => {
        setQuoteIndex((i) => (i + 1) % QUOTES.length);
        setQuoteTransition(false);
      }, 300);
    }, 12_000);
    return () => clearInterval(id);
  }, []);

  const nextQuote = useCallback(() => {
    setQuoteTransition(true);
    setTimeout(() => {
      setQuoteIndex((i) => (i + 1) % QUOTES.length);
      setQuoteTransition(false);
    }, 300);
  }, []);

  const prevQuote = useCallback(() => {
    setQuoteTransition(true);
    setTimeout(() => {
      setQuoteIndex((i) => (i - 1 + QUOTES.length) % QUOTES.length);
      setQuoteTransition(false);
    }, 300);
  }, []);

  // ── Fetch events ──
  const { data: events = [], isLoading: eventsLoading } = useQuery({
    queryKey: ['review-events', user?.id, dayStart],
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

  // ── Fetch check-ins ──
  const { data: rawCheckins = [] } = useQuery({
    queryKey: ['review-checkins', user?.id, dayStart],
    enabled: !!user?.id && events.length > 0,
    queryFn: async () => {
      const eventIds = events.map((e) => e.id);
      const { data, error } = await supabase
        .from('calendar_checkins').select('*')
        .eq('user_id', user!.id).in('event_id', eventIds)
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const checkinMap: CheckinMap = useMemo(() => {
    const map: CheckinMap = {};
    rawCheckins.forEach((c: any) => {
      if (!map[c.event_id]) map[c.event_id] = { status: c.status, reason: c.sidetrack_reason };
    });
    return map;
  }, [rawCheckins]);

  // ── Fetch focus sessions ──
  const { data: focusSessions = [] } = useQuery({
    queryKey: ['review-focus', user?.id, dayStart],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('focus_sessions').select('*')
        .eq('user_id', user!.id)
        .gte('started_at', dayStart).lt('started_at', dayEnd);
      if (error) throw error;
      return data;
    },
  });

  // ── Fetch mood logs ──
  const { data: moodLogs = [] } = useQuery({
    queryKey: ['review-moods', user?.id, dayStart],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('mood_logs').select('*')
        .eq('user_id', user!.id)
        .gte('timestamp', dayStart).lt('timestamp', dayEnd)
        .order('timestamp', { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  // ── Fetch today's journal entries ──
  const reviewDateStr = reviewDate.toISOString().split('T')[0];
  const { data: journalEntries = [] } = useQuery({
    queryKey: ['review-journal', user?.id, reviewDateStr],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('journal_entries').select('*')
        .eq('user_id', user!.id).eq('date', reviewDateStr)
        .order('timestamp', { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  // ── Check-in mutation ──
  const checkinMutation = useMutation({
    mutationFn: async ({ eventId, status, reason }: { eventId: string; status: string; reason?: string }) => {
      const { error } = await supabase.from('calendar_checkins').insert({
        user_id: user!.id, event_id: eventId, status, sidetrack_reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['review-checkins'] }),
  });

  // ── Fetch morning intention ──
  const { data: morningIntention } = useQuery({
    queryKey: ['review-intention', user?.id, reviewDateStr],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('daily_intentions').select('*')
        .eq('user_id', user!.id).eq('date', reviewDateStr)
        .maybeSingle();
      if (error) throw error;
      return data as DailyIntention | null;
    },
  });

  // ── Intention met mutation ──
  const intentionMetMutation = useMutation({
    mutationFn: async (met: boolean) => {
      if (!morningIntention) return;
      const { error } = await supabase
        .from('daily_intentions').update({ intention_met: met })
        .eq('id', morningIntention.id);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['review-intention'] }),
  });

  // ── Journal inline form state ──
  const [journalBody, setJournalBody] = useState('');
  const [journalTags, setJournalTags] = useState('');
  const [journalMood, setJournalMood] = useState<number | null>(null);
  const [journalPrompt, setJournalPrompt] = useState<string | null>(null);
  const [promptIdx, setPromptIdx] = useState(0);
  const [journalSuccess, setJournalSuccess] = useState(false);

  const journalMutation = useMutation({
    mutationFn: async () => {
      if (!journalBody.trim()) throw new Error('Journal entry cannot be empty');
      const tagArray = journalTags ? journalTags.split(',').map((t) => t.trim()).filter(Boolean) : [];
      const { error } = await supabase.from('journal_entries').insert({
        user_id: user!.id,
        date: reviewDateStr,
        timestamp: new Date().toISOString(),
        body: journalBody.trim(),
        tags: tagArray.length ? tagArray : null,
        mood_at_writing: journalMood,
        prompt_used: journalPrompt,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['review-journal'] });
      queryClient.invalidateQueries({ queryKey: ['journal-entries'] });
      setJournalBody(''); setJournalTags(''); setJournalMood(null); setJournalPrompt(null);
      setJournalSuccess(true);
      setTimeout(() => setJournalSuccess(false), 2500);
    },
  });

  const shufflePrompt = () => setPromptIdx((i) => (i + 1) % JOURNAL_PROMPTS.length);
  const usePrompt = () => {
    const p = JOURNAL_PROMPTS[promptIdx];
    setJournalPrompt(p);
    setJournalBody(p + '\n\n');
  };

  // ── Computed stats ──
  const totalEvents = events.length;
  const checkedIn = Object.keys(checkinMap).length;
  const onTrack = Object.values(checkinMap).filter((c) => c.status === 'on_track').length;
  const sidetracked = Object.values(checkinMap).filter((c) => c.status === 'sidetracked').length;
  const unchecked = totalEvents - checkedIn;
  const adherenceRate = totalEvents > 0 ? Math.round((onTrack / totalEvents) * 100) : 0;
  const totalFocusMinutes = focusSessions.reduce((sum: number, s: any) => sum + (s.duration_minutes || 0), 0);
  const avgMood = moodLogs.length > 0
    ? (moodLogs.reduce((sum: number, m: any) => sum + m.mood_score, 0) / moodLogs.length).toFixed(1)
    : null;

  const dayHash = reviewDate.getDate() + reviewDate.getMonth() * 31;
  const dailyTip = WINDING_DOWN_TIPS[dayHash % WINDING_DOWN_TIPS.length];
  const secondTip = WINDING_DOWN_TIPS[(dayHash + 3) % WINDING_DOWN_TIPS.length];

  return (
    <div className="space-y-6 pb-12 max-w-3xl mx-auto">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Moon className="w-7 h-7 text-primary" />
          <h1 className="text-2xl font-bold text-text-main">My Day in Review</h1>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={goPrev} className="p-1.5 rounded-sm hover:bg-forest transition-colors text-text-muted hover:text-text-main">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={goNext} className="p-1.5 rounded-sm hover:bg-forest transition-colors text-text-muted hover:text-text-main">
            <ChevronRight className="w-5 h-5" />
          </button>
          {!isToday && <Button variant="secondary" size="sm" onClick={goToday}>Today</Button>}
        </div>
      </div>

      <p className="text-sm text-text-muted">{dateLabel}</p>

      {eventsLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
        </div>
      ) : (
        <>
          {/* ── Stats Cards ── */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <Target className="w-6 h-6 text-primary" />
                <div className="text-2xl font-bold text-text-main">{adherenceRate}%</div>
                <div className="text-xs text-text-muted">Adherence</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <Calendar className="w-6 h-6 text-primary" />
                <div className="text-2xl font-bold text-text-main">{totalEvents}</div>
                <div className="text-xs text-text-muted">Events</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <Timer className="w-6 h-6 text-primary" />
                <div className="text-2xl font-bold text-text-main">{totalFocusMinutes}m</div>
                <div className="text-xs text-text-muted">Focus Time</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4 flex flex-col items-center text-center gap-1">
                <Sparkles className="w-6 h-6 text-warning" />
                <div className="text-2xl font-bold text-text-main">{avgMood || '—'}</div>
                <div className="text-xs text-text-muted">Avg Mood</div>
              </CardContent>
            </Card>
          </div>

          {/* ── Adherence summary ── */}
          {totalEvents > 0 && (
            <div className="flex items-center gap-4 text-sm">
              <span className="flex items-center gap-1 text-emerald-600 font-medium">
                <CheckCircle2 className="w-4 h-4" /> {onTrack} on track
              </span>
              <span className="flex items-center gap-1 text-amber-600 font-medium">
                <XCircle className="w-4 h-4" /> {sidetracked} sidetracked
              </span>
              {unchecked > 0 && (
                <span className="flex items-center gap-1 text-text-muted">
                  <MinusCircle className="w-4 h-4" /> {unchecked} unchecked
                </span>
              )}
            </div>
          )}

          {/* ── Morning Intention vs Reality ── */}
          {morningIntention && (
            <Card className="border-amber-200/50 bg-gradient-to-br from-amber-50/50 to-transparent">
              <CardContent className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sunrise className="w-5 h-5 text-amber-500" />
                  <h3 className="text-sm font-semibold text-text-main">Morning Intention vs Reality</h3>
                </div>

                {/* Intention */}
                {morningIntention.intention && (
                  <div className="mb-3">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">You intended to...</p>
                    <p className="text-sm text-text-main font-medium italic">"{morningIntention.intention}"</p>
                  </div>
                )}

                {/* Priorities */}
                {morningIntention.top_priorities && morningIntention.top_priorities.length > 0 && (
                  <div className="mb-3">
                    <p className="text-xs text-text-muted uppercase tracking-wider mb-1">Top priorities</p>
                    <div className="space-y-1">
                      {morningIntention.top_priorities.map((p, i) => (
                        <div key={i} className="flex items-center gap-2 text-sm">
                          <span className="w-5 h-5 rounded-full bg-amber-100 text-amber-700 text-xs flex items-center justify-center font-bold flex-shrink-0">
                            {i + 1}
                          </span>
                          <span className="text-text-main">{p}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Did you achieve it? */}
                <div className="border-t border-amber-200/50 pt-3 mt-3">
                  <p className="text-xs text-text-muted mb-2">Did you achieve your intention?</p>
                  {morningIntention.intention_met === null || morningIntention.intention_met === undefined ? (
                    <div className="flex gap-2">
                      <button
                        onClick={() => intentionMetMutation.mutate(true)}
                        className="flex-1 py-2 rounded-sm text-sm font-medium bg-emerald-50 border border-emerald-200 text-emerald-700 hover:bg-emerald-100 transition-colors"
                      >
                        ✓ Yes, nailed it
                      </button>
                      <button
                        onClick={() => intentionMetMutation.mutate(false)}
                        className="flex-1 py-2 rounded-sm text-sm font-medium bg-amber-50 border border-amber-200 text-amber-700 hover:bg-amber-100 transition-colors"
                      >
                        Not quite
                      </button>
                    </div>
                  ) : morningIntention.intention_met ? (
                    <div className="flex items-center gap-2 py-2 px-3 rounded-sm bg-emerald-50 border border-emerald-200">
                      <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                      <span className="text-sm font-medium text-emerald-700">You did it! 🎉</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 py-2 px-3 rounded-sm bg-amber-50 border border-amber-200">
                      <XCircle className="w-4 h-4 text-amber-600" />
                      <span className="text-sm text-amber-700">Not today — and that's okay. Tomorrow's a new shot.</span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* ── Event Timeline ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" /> Schedule Review
              </CardTitle>
            </CardHeader>
            <CardContent>
              {events.length === 0 ? (
                <div className="text-center py-8 text-text-muted">
                  <Calendar className="w-10 h-10 mx-auto mb-3 opacity-30" />
                  <p className="text-sm">No events scheduled for this day.</p>
                  <button onClick={() => navigate('/calendar')} className="text-primary text-sm mt-2 hover:underline">
                    Go to Calendar →
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  {events.map((event) => {
                    const colors = ENERGY_COLORS[event.energy_type || ''] || DEFAULT_ENERGY_COLOR;
                    const checkin = checkinMap[event.id];
                    const eventPast = new Date(event.end_time).getTime() < Date.now();
                    return (
                      <div
                        key={event.id}
                        className={`flex items-start gap-3 py-3 px-4 rounded-sm border-l-[3px]
                          ${checkin?.status === 'on_track' ? 'bg-emerald-50/50 border-emerald-400'
                            : checkin?.status === 'sidetracked' ? 'bg-amber-50/50 border-amber-400'
                              : `bg-white ${colors.border}`}`}
                      >
                        <div className="flex-shrink-0 mt-0.5">
                          {checkin?.status === 'on_track' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                            : checkin?.status === 'sidetracked' ? <XCircle className="w-5 h-5 text-amber-500" />
                              : <MinusCircle className="w-5 h-5 text-border" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            {event.is_focus_block && <Zap className="w-3.5 h-3.5 text-amber-500" />}
                            <span className="text-sm font-semibold text-text-main">{event.title}</span>
                          </div>
                          <div className="flex items-center gap-3 text-xs text-text-muted mt-0.5">
                            <span>{formatTime(event.start_time)} – {formatTime(event.end_time)}</span>
                            {event.energy_type && <span className={`capitalize ${colors.text}`}>{event.energy_type}</span>}
                          </div>
                          {checkin?.status === 'sidetracked' && checkin.reason && (
                            <span className="inline-block text-xs text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full mt-1.5">
                              {checkin.reason.replace(/_/g, ' ')}
                            </span>
                          )}
                        </div>
                        {!checkin && eventPast && (
                          <div className="flex gap-1 flex-shrink-0">
                            <button
                              onClick={() => checkinMutation.mutate({ eventId: event.id, status: 'on_track' })}
                              className="p-1.5 rounded-sm bg-emerald-50 border border-emerald-200 text-emerald-600 hover:bg-emerald-100 transition-colors"
                              title="I did it"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => checkinMutation.mutate({ eventId: event.id, status: 'sidetracked' })}
                              className="p-1.5 rounded-sm bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-colors"
                              title="I skipped it"
                            >
                              <XCircle className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Rotating Quotes ── */}
          <Card className="bg-gradient-to-br from-primary/5 to-primary/[0.02] border-primary/20">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <button onClick={prevQuote} className="p-1 rounded-full hover:bg-primary/10 transition-colors text-primary/40 hover:text-primary flex-shrink-0">
                  <ChevronLeft className="w-4 h-4" />
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-start gap-3">
                    <Quote className="w-5 h-5 text-primary/40 flex-shrink-0 mt-0.5" />
                    <div
                      className="transition-all duration-300 ease-in-out"
                      style={{ opacity: quoteTransition ? 0 : 1, transform: quoteTransition ? 'translateY(8px)' : 'translateY(0)' }}
                    >
                      <p className="text-sm text-text-main italic leading-relaxed">
                        "{QUOTES[quoteIndex].text}"
                      </p>
                      <p className="text-xs text-text-muted mt-1.5 font-medium">— {QUOTES[quoteIndex].author}</p>
                    </div>
                  </div>
                </div>

                <button onClick={nextQuote} className="p-1 rounded-full hover:bg-primary/10 transition-colors text-primary/40 hover:text-primary flex-shrink-0">
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>

              {/* Dots */}
              <div className="flex justify-center gap-1 mt-3">
                {QUOTES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => { setQuoteTransition(true); setTimeout(() => { setQuoteIndex(i); setQuoteTransition(false); }, 300); }}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-200 ${i === quoteIndex ? 'bg-primary w-4' : 'bg-primary/20 hover:bg-primary/40'}`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          {/* ── Inline Journal ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <BookText className="w-5 h-5 text-primary" />
                Journal — Close The Day
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Prompt */}
              <div className="rounded-sm border border-border bg-forest/30 p-3">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-medium text-text-muted uppercase tracking-wider">Prompt (optional)</p>
                  <button onClick={shufflePrompt} className="flex items-center gap-1 text-xs text-text-muted hover:text-primary transition-colors">
                    <Shuffle className="w-3.5 h-3.5" /> Shuffle
                  </button>
                </div>
                <p className="text-sm text-text-main italic mb-2">"{JOURNAL_PROMPTS[promptIdx]}"</p>
                <button
                  onClick={usePrompt}
                  className={`text-xs px-3 py-1 rounded-full border transition-colors ${
                    journalPrompt === JOURNAL_PROMPTS[promptIdx]
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-text-muted hover:border-primary hover:text-primary'
                  }`}
                >
                  {journalPrompt === JOURNAL_PROMPTS[promptIdx] ? '✓ Using' : 'Use this'}
                </button>
              </div>

              {/* Text area */}
              <textarea
                placeholder="How was your day? Write freely..."
                value={journalBody}
                onChange={(e) => setJournalBody(e.target.value)}
                rows={6}
                className="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm text-text-main
                  placeholder-text-muted focus:outline-none focus:border-primary resize-none"
              />

              {/* Tags + Mood */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs text-text-muted mb-1 block">Tags (comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. reflection, adhd, win"
                    value={journalTags}
                    onChange={(e) => setJournalTags(e.target.value)}
                    className="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm text-text-main
                      placeholder-text-muted focus:outline-none focus:border-primary"
                  />
                </div>
                <div>
                  <p className="text-xs text-text-muted mb-2">Mood right now</p>
                  <div className="flex gap-2">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setJournalMood(journalMood === n ? null : n)}
                        className={`text-xl transition-all ${journalMood === n ? 'scale-125' : 'opacity-50 hover:opacity-80'}`}
                      >
                        {MOOD_EMOJIS[n]}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Save */}
              <Button
                variant="primary"
                onClick={() => journalMutation.mutate()}
                disabled={journalMutation.isPending || !journalBody.trim()}
                className="w-full"
              >
                {journalMutation.isPending ? 'Saving...' : journalSuccess ? '✓ Saved!' : 'Save Journal Entry'}
              </Button>
              {journalMutation.isError && (
                <p className="text-danger text-sm">{(journalMutation.error as Error).message}</p>
              )}

              {/* Today's journal entries */}
              {journalEntries.length > 0 && (
                <div className="border-t border-border pt-3 mt-2">
                  <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                    Entries from this day
                  </p>
                  <div className="space-y-2">
                    {journalEntries.map((entry: any) => (
                      <div key={entry.id} className="py-2 border-b border-border/50 last:border-0">
                        <div className="flex items-start justify-between">
                          <p className="text-sm text-text-main whitespace-pre-wrap line-clamp-3">{entry.body}</p>
                          {entry.mood_at_writing && (
                            <span className="text-base ml-2 flex-shrink-0">{MOOD_EMOJIS[entry.mood_at_writing]}</span>
                          )}
                        </div>
                        {entry.tags && (
                          <div className="flex gap-1 mt-1">
                            {entry.tags.map((t: string) => (
                              <span key={t} className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">{t}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* ── Winding Down Tips ── */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Moon className="w-5 h-5 text-primary-light" /> Winding Down
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <p className="text-sm text-text-muted">{dailyTip}</p>
              <p className="text-sm text-text-muted">{secondTip}</p>

              <div className="border-t border-border/50 pt-3 mt-3">
                <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">Quick reflection</p>
                <div className="space-y-2 text-sm text-text-muted">
                  <p>🏆 <strong className="text-text-main">Win of the day:</strong> What's one thing you did well?</p>
                  <p>📚 <strong className="text-text-main">Learned:</strong> What's something you know now that you didn't this morning?</p>
                  <p>🔄 <strong className="text-text-main">Tomorrow:</strong> What's the ONE thing you want to start with?</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* ── Good Night ── */}
          <div className="text-center py-6">
            <p className="text-2xl mb-2">🌙</p>
            <p className="text-sm text-text-muted">
              {isToday
                ? "You showed up today. That's what matters. Get some rest."
                : "Looking back helps you look forward. Keep going."}
            </p>
          </div>
        </>
      )}
    </div>
  );
}
