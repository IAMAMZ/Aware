import { useState, useEffect, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Card, CardContent } from '../../components/ui/Card';
import type { CalendarEvent } from '../../types';
import {
  getCurrentEvent,
  getUpcomingEvent,
  formatTime,
  ENERGY_COLORS,
  DEFAULT_ENERGY_COLOR,
} from './calendarUtils';
import {
  Calendar,
  CheckCircle2,
  RotateCcw,
  Clock,
  ChevronRight,
  Zap,
  Coffee,
} from 'lucide-react';

const SIDETRACK_REASONS = [
  { key: 'phone', label: '📱 Phone', emoji: '📱' },
  { key: 'email', label: '📧 Email/Slack', emoji: '📧' },
  { key: 'rabbit_hole', label: '🕳️ Rabbit hole', emoji: '🕳️' },
  { key: 'snack', label: '🍿 Snack break', emoji: '🍿' },
  { key: 'rest', label: '😴 Needed rest', emoji: '😴' },
  { key: 'other', label: '🤷 Other', emoji: '🤷' },
] as const;

export default function RightNowWidget() {
  const { user } = useAppStore();
  const navigate = useNavigate();

  // Re-render every 30 seconds to keep "right now" fresh
  const [tick, setTick] = useState(0);
  useEffect(() => {
    const id = setInterval(() => setTick((t) => t + 1), 30_000);
    return () => clearInterval(id);
  }, []);

  // Fetch today's events
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  const { data: todayEvents = [] } = useQuery({
    queryKey: ['calendar-today', user?.id, today.toDateString()],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user!.id)
        .gte('start_time', today.toISOString())
        .lt('start_time', tomorrow.toISOString())
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data as CalendarEvent[];
    },
    refetchInterval: 60_000, // refresh every minute
  });

  // Determine state
  const currentEvent = useMemo(() => getCurrentEvent(todayEvents), [todayEvents, tick]);
  const upcomingEvent = useMemo(() => getUpcomingEvent(todayEvents), [todayEvents, tick]);

  // Check-in state (local for now)
  const [checkinStatus, setCheckinStatus] = useState<'on_track' | 'sidetracked' | null>(null);
  const [showReasons, setShowReasons] = useState(false);
  const [_selectedReason, setSelectedReason] = useState<string | null>(null);

  // Reset check-in when the current event changes
  useEffect(() => {
    setCheckinStatus(null);
    setShowReasons(false);
    setSelectedReason(null);
  }, [currentEvent?.id]);

  // Progress bar calc
  const getProgress = () => {
    if (!currentEvent) return 0;
    const now = Date.now();
    const start = new Date(currentEvent.start_time).getTime();
    const end = new Date(currentEvent.end_time).getTime();
    return Math.min(100, Math.max(0, ((now - start) / (end - start)) * 100));
  };

  const getTimeRemaining = () => {
    if (!currentEvent) return '';
    const now = Date.now();
    const end = new Date(currentEvent.end_time).getTime();
    const remaining = Math.max(0, end - now);
    const mins = Math.ceil(remaining / 60_000);
    if (mins < 60) return `${mins}m left`;
    return `${Math.floor(mins / 60)}h ${mins % 60}m left`;
  };

  const getTimeUntil = (event: CalendarEvent) => {
    const now = Date.now();
    const start = new Date(event.start_time).getTime();
    const mins = Math.ceil((start - now) / 60_000);
    if (mins <= 0) return 'now';
    if (mins < 60) return `in ${mins}m`;
    return `in ${Math.floor(mins / 60)}h ${mins % 60}m`;
  };

  const handleCheckin = (status: 'on_track' | 'sidetracked') => {
    setCheckinStatus(status);
    if (status === 'sidetracked') {
      setShowReasons(true);
    }
    // TODO: persist to calendar_checkins table
  };

  const handleReasonSelect = (reason: string) => {
    setSelectedReason(reason);
    setShowReasons(false);
    // TODO: persist reason to calendar_checkins table
  };

  const progress = getProgress();

  // ─── Active event state ────────────────────────────────────────────
  if (currentEvent) {
    const colors = ENERGY_COLORS[currentEvent.energy_type || ''] || DEFAULT_ENERGY_COLOR;

    return (
      <Card className={`border-l-4 ${colors.border} overflow-hidden`}>
        <CardContent className="p-4">
          {/* Header */}
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center gap-2">
              <div className={`w-2 h-2 rounded-full bg-red-500 animate-pulse`} />
              <span className="text-xs font-semibold text-red-600 uppercase tracking-wider">
                Right Now
              </span>
            </div>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-0.5"
            >
              Calendar <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          {/* Event info */}
          <div className="flex items-center gap-2 mb-2">
            {currentEvent.is_focus_block && <Zap className="w-4 h-4 text-amber-500" />}
            <h3 className="text-lg font-bold text-text-main">{currentEvent.title}</h3>
          </div>

          <div className="flex items-center gap-3 text-xs text-text-muted mb-3">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(currentEvent.start_time)} – {formatTime(currentEvent.end_time)}
            </span>
            {currentEvent.energy_type && (
              <span className={`capitalize ${colors.text} font-medium`}>
                {currentEvent.energy_type}
              </span>
            )}
            <span className="font-medium text-text-main">{getTimeRemaining()}</span>
          </div>

          {/* Progress bar */}
          <div className="h-2 bg-border/50 rounded-full overflow-hidden mb-4">
            <div
              className="h-full bg-primary rounded-full transition-all duration-1000 ease-linear"
              style={{ width: `${progress}%` }}
            />
          </div>

          {/* Check-in buttons */}
          {checkinStatus === null ? (
            <div className="flex gap-2">
              <button
                onClick={() => handleCheckin('on_track')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm
                  bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium
                  hover:bg-emerald-100 transition-colors"
              >
                <CheckCircle2 className="w-4 h-4" />
                I'm on it
              </button>
              <button
                onClick={() => handleCheckin('sidetracked')}
                className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm
                  bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium
                  hover:bg-amber-100 transition-colors"
              >
                <RotateCcw className="w-4 h-4" />
                Got sidetracked
              </button>
            </div>
          ) : checkinStatus === 'on_track' ? (
            <div className="flex items-center gap-2 py-2 px-3 rounded-sm bg-emerald-50 border border-emerald-200">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span className="text-sm font-medium text-emerald-700">Nice! Keep going 💪</span>
            </div>
          ) : showReasons ? (
            <div>
              <p className="text-xs text-text-muted mb-2">What pulled you away?</p>
              <div className="grid grid-cols-3 gap-2">
                {SIDETRACK_REASONS.map((r) => (
                  <button
                    key={r.key}
                    onClick={() => handleReasonSelect(r.key)}
                    className="py-2 px-2 rounded-sm border border-border text-xs text-text-muted
                      hover:border-amber-400 hover:bg-amber-50 transition-colors text-center"
                  >
                    <span className="text-lg block mb-0.5">{r.emoji}</span>
                    {r.label.split(' ').slice(1).join(' ')}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="flex items-center gap-2 py-2 px-3 rounded-sm bg-amber-50 border border-amber-200">
              <RotateCcw className="w-4 h-4 text-amber-600" />
              <span className="text-sm text-amber-700">
                Noted! No judgment — get back to <strong>{currentEvent.title}</strong> when you can
              </span>
            </div>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Upcoming event state ──────────────────────────────────────────
  if (upcomingEvent) {
    const colors = ENERGY_COLORS[upcomingEvent.energy_type || ''] || DEFAULT_ENERGY_COLOR;
    const timeUntil = getTimeUntil(upcomingEvent);

    return (
      <Card className="border-l-4 border-amber-400">
        <CardContent className="p-4">
          <div className="flex items-start justify-between mb-2">
            <div className="flex items-center gap-2">
              <Coffee className="w-4 h-4 text-amber-500" />
              <span className="text-xs font-semibold text-amber-600 uppercase tracking-wider">
                Coming Up {timeUntil}
              </span>
            </div>
            <button
              onClick={() => navigate('/calendar')}
              className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-0.5"
            >
              Calendar <ChevronRight className="w-3 h-3" />
            </button>
          </div>

          <div className="flex items-center gap-2">
            {upcomingEvent.is_focus_block && <Zap className="w-4 h-4 text-amber-500" />}
            <h3 className="text-base font-semibold text-text-main">{upcomingEvent.title}</h3>
          </div>
          <div className="flex items-center gap-3 text-xs text-text-muted mt-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(upcomingEvent.start_time)} – {formatTime(upcomingEvent.end_time)}
            </span>
            {upcomingEvent.energy_type && (
              <span className={`capitalize ${colors.text} font-medium`}>
                {upcomingEvent.energy_type}
              </span>
            )}
          </div>

          {upcomingEvent.is_focus_block && (
            <p className="text-xs text-amber-600 mt-2 font-medium">
              ⚡ Focus block — prep your workspace and silence notifications
            </p>
          )}
        </CardContent>
      </Card>
    );
  }

  // ─── Free time state ───────────────────────────────────────────────
  const remainingEvents = todayEvents.filter(
    (e) => new Date(e.start_time).getTime() > Date.now()
  );

  return (
    <Card className="border-l-4 border-primary/40">
      <CardContent className="p-4">
        <div className="flex items-start justify-between">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Calendar className="w-4 h-4 text-primary" />
              <span className="text-xs font-semibold text-primary uppercase tracking-wider">
                Free Time
              </span>
            </div>
            <p className="text-sm text-text-main">
              {remainingEvents.length > 0
                ? `Nothing right now — next up is "${remainingEvents[0].title}" at ${formatTime(remainingEvents[0].start_time)}`
                : "You're free for the rest of the day ✨"}
            </p>
          </div>
          <button
            onClick={() => navigate('/calendar')}
            className="text-xs text-text-muted hover:text-primary transition-colors flex items-center gap-0.5 flex-shrink-0"
          >
            Calendar <ChevronRight className="w-3 h-3" />
          </button>
        </div>
      </CardContent>
    </Card>
  );
}
