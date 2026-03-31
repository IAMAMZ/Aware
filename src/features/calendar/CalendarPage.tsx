import { useState, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../../lib/supabase';
import { useAppStore } from '../../store/useAppStore';
import { Button } from '../../components/ui/Button';
import type { CalendarEvent } from '../../types';
import {
  getWeekDays,
  getNextWeek,
  getPrevWeek,
  formatWeekRange,
  format,
} from './calendarUtils';
import WeekGrid from './WeekGrid';
import EventModal from './EventModal';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';

type ViewMode = 'week' | 'day';

export default function CalendarPage() {
  const { user } = useAppStore();
  const queryClient = useQueryClient();

  // Navigation state
  const [currentDate, setCurrentDate] = useState(new Date());
  const [viewMode, setViewMode] = useState<ViewMode>('week');

  // Modal state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [defaultStart, setDefaultStart] = useState('');
  const [defaultEnd, setDefaultEnd] = useState('');

  // Compute visible days
  const visibleDays = viewMode === 'week'
    ? getWeekDays(currentDate)
    : [currentDate];

  // Date range for query
  const rangeStart = visibleDays[0];
  const rangeEnd = new Date(visibleDays[visibleDays.length - 1]);
  rangeEnd.setHours(23, 59, 59, 999);

  // ── Query events ──
  const { data: events = [], isLoading } = useQuery({
    queryKey: ['calendar-events', user?.id, rangeStart.toISOString(), rangeEnd.toISOString()],
    enabled: !!user?.id,
    queryFn: async () => {
      const { data, error } = await supabase
        .from('calendar_events')
        .select('*')
        .eq('user_id', user!.id)
        .gte('start_time', rangeStart.toISOString())
        .lte('start_time', rangeEnd.toISOString())
        .order('start_time', { ascending: true });
      if (error) throw error;
      return data as CalendarEvent[];
    },
  });

  // ── Mutations ──
  const addMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      start_time: string;
      end_time: string;
      energy_type: string;
      is_focus_block: boolean;
      notes: string | null;
    }) => {
      const { error } = await supabase.from('calendar_events').insert({
        user_id: user!.id,
        ...data,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      closeModal();
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: {
      id: string;
      title: string;
      start_time: string;
      end_time: string;
      energy_type: string;
      is_focus_block: boolean;
      notes: string | null;
    }) => {
      const { id, ...rest } = data;
      const { error } = await supabase.from('calendar_events').update(rest).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      closeModal();
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('calendar_events').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-events'] });
      closeModal();
    },
  });

  const checkinMutation = useMutation({
    mutationFn: async ({ eventId, status, reason }: { eventId: string; status: string; reason?: string }) => {
      const { error } = await supabase.from('calendar_checkins').insert({
        user_id: user!.id,
        event_id: eventId,
        status,
        sidetrack_reason: reason || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar-checkins'] });
    },
  });

  const handleCheckin = useCallback(
    (eventId: string, status: 'on_track' | 'sidetracked', reason?: string) => {
      checkinMutation.mutate({ eventId, status, reason });
    },
    [checkinMutation]
  );

  // ── Modal handlers ──
  const closeModal = useCallback(() => {
    setModalOpen(false);
    setEditingEvent(null);
    setDefaultStart('');
    setDefaultEnd('');
  }, []);

  const handleEventClick = useCallback((event: CalendarEvent) => {
    setEditingEvent(event);
    setModalOpen(true);
  }, []);

  const handleSlotClick = useCallback((day: Date, hour: number, minute: number = 0) => {
    const start = new Date(day);
    start.setHours(hour, minute, 0, 0);
    const end = new Date(day);
    // Default to 30 minutes for new events from slot click
    const endMinute = minute + 30;
    end.setHours(hour + Math.floor(endMinute / 60), endMinute % 60, 0, 0);

    // Format for datetime-local input
    const pad = (n: number) => String(n).padStart(2, '0');
    const toLocal = (d: Date) =>
      `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;

    setDefaultStart(toLocal(start));
    setDefaultEnd(toLocal(end));
    setEditingEvent(null);
    setModalOpen(true);
  }, []);

  const handleSave = useCallback(
    (data: {
      title: string;
      start_time: string;
      end_time: string;
      energy_type: string;
      is_focus_block: boolean;
      notes: string | null;
    }) => {
      if (editingEvent) {
        updateMutation.mutate({ id: editingEvent.id, ...data });
      } else {
        addMutation.mutate(data);
      }
    },
    [editingEvent, addMutation, updateMutation]
  );

  const handleDelete = useCallback(
    (id: string) => { deleteMutation.mutate(id); },
    [deleteMutation]
  );

  const handleEventDrop = useCallback(
    (event: CalendarEvent, newStart: Date, newEnd: Date) => {
      updateMutation.mutate({
        id: event.id,
        title: event.title,
        start_time: newStart.toISOString(),
        end_time: newEnd.toISOString(),
        energy_type: event.energy_type || 'admin',
        is_focus_block: event.is_focus_block,
        notes: event.notes,
      });
    },
    [updateMutation]
  );

  // ── Navigation ──
  const goToday = () => setCurrentDate(new Date());
  const goPrev = () => {
    if (viewMode === 'week') {
      setCurrentDate((d) => getPrevWeek(d));
    } else {
      setCurrentDate((d) => {
        const prev = new Date(d);
        prev.setDate(prev.getDate() - 1);
        return prev;
      });
    }
  };
  const goNext = () => {
    if (viewMode === 'week') {
      setCurrentDate((d) => getNextWeek(d));
    } else {
      setCurrentDate((d) => {
        const next = new Date(d);
        next.setDate(next.getDate() + 1);
        return next;
      });
    }
  };

  const headerText = viewMode === 'week'
    ? formatWeekRange(currentDate)
    : format(currentDate, 'EEEE, MMMM d, yyyy');

  return (
    <div className="space-y-4 pb-12">
      {/* ── Header ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <h1 className="text-2xl font-bold text-text-main">Calendar</h1>
          <Button variant="secondary" size="sm" onClick={goToday}>
            Today
          </Button>
        </div>

        <div className="flex items-center gap-2">
          {/* View mode toggle */}
          <div className="flex border border-border rounded-sm overflow-hidden">
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors
                ${viewMode === 'day' ? 'bg-primary text-white' : 'bg-white text-text-muted hover:bg-forest'}`}
              onClick={() => setViewMode('day')}
            >
              Day
            </button>
            <button
              className={`px-3 py-1.5 text-xs font-medium transition-colors
                ${viewMode === 'week' ? 'bg-primary text-white' : 'bg-white text-text-muted hover:bg-forest'}`}
              onClick={() => setViewMode('week')}
            >
              Week
            </button>
          </div>

          <Button variant="primary" size="sm" onClick={() => { setEditingEvent(null); setModalOpen(true); }} className="gap-1">
            <Plus className="w-4 h-4" /> Event
          </Button>
        </div>
      </div>

      {/* ── Date navigation ── */}
      <div className="flex items-center gap-3">
        <button
          onClick={goPrev}
          className="p-1.5 rounded-sm hover:bg-forest transition-colors text-text-muted hover:text-text-main"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <button
          onClick={goNext}
          className="p-1.5 rounded-sm hover:bg-forest transition-colors text-text-muted hover:text-text-main"
        >
          <ChevronRight className="w-5 h-5" />
        </button>
        <h2 className="text-lg font-semibold text-text-main">{headerText}</h2>
      </div>

      {/* ── Grid ── */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="text-text-muted flex flex-col items-center gap-3">
            <div className="animate-spin h-6 w-6 border-2 border-primary border-t-transparent rounded-full" />
            <span className="text-sm">Loading events...</span>
          </div>
        </div>
      ) : (
        <WeekGrid
          days={visibleDays}
          events={events}
          onEventClick={handleEventClick}
          onSlotClick={handleSlotClick}
          onEventDrop={handleEventDrop}
        />
      )}

      {/* ── Energy type legend ── */}
      <div className="flex flex-wrap items-center gap-3 text-xs text-text-muted">
        <span className="font-medium">Energy types:</span>
        {[
          { type: 'deep', color: 'bg-indigo-400' },
          { type: 'admin', color: 'bg-slate-400' },
          { type: 'creative', color: 'bg-amber-400' },
          { type: 'physical', color: 'bg-emerald-400' },
          { type: 'social', color: 'bg-pink-400' },
          { type: 'rest', color: 'bg-sky-400' },
        ].map(({ type, color }) => (
          <span key={type} className="flex items-center gap-1 capitalize">
            <span className={`w-2.5 h-2.5 rounded-full ${color}`} />
            {type}
          </span>
        ))}
      </div>

      {/* ── Modal ── */}
      {modalOpen && (
        <EventModal
          event={editingEvent}
          defaultStart={defaultStart}
          defaultEnd={defaultEnd}
          onSave={handleSave}
          onCheckin={handleCheckin}
          onDelete={editingEvent ? handleDelete : undefined}
          onClose={closeModal}
          isSaving={addMutation.isPending || updateMutation.isPending}
        />
      )}
    </div>
  );
}
