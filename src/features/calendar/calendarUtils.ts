import {
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  addWeeks,
  subWeeks,
  format,
  isSameDay,
  isToday,
} from 'date-fns';
import type { CalendarEvent } from '../../types';

// ─── Constants ────────────────────────────────────────────────────────
export const START_HOUR = 0;   // 12 AM
export const END_HOUR = 24;    // 12 AM (Next Day)
export const SLOT_MINUTES = 15; // 15-minute increments
export const SLOT_HEIGHT = 16;  // px per 15-min slot
export const HOUR_HEIGHT = SLOT_HEIGHT * (60 / SLOT_MINUTES); // 64px per hour
export const TOTAL_HOURS = END_HOUR - START_HOUR;
export const TOTAL_SLOTS = TOTAL_HOURS * (60 / SLOT_MINUTES);
export const GRID_HEIGHT = TOTAL_SLOTS * SLOT_HEIGHT;

// Generate time slots every 15 minutes
export const TIME_SLOTS = Array.from({ length: TOTAL_SLOTS + 1 }, (_, i) => {
  const totalMinutes = START_HOUR * 60 + i * SLOT_MINUTES;
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  const suffix = h < 12 ? 'am' : 'pm';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  const isHour = m === 0;
  const isHalf = m === 30;
  return { hour: h, minute: m, label: isHour ? `${display}${suffix}` : isHalf ? `${display}:30` : '', isHour, isHalf };
});

// Hour labels only (for the gutter)
export const HOURS = Array.from({ length: TOTAL_HOURS + 1 }, (_, i) => {
  const h = START_HOUR + i;
  const suffix = h < 12 ? 'am' : 'pm';
  const display = h === 0 ? 12 : h > 12 ? h - 12 : h;
  return { hour: h, label: `${display}${suffix}` };
});

// ─── Energy-type color mapping ────────────────────────────────────────
export const ENERGY_COLORS: Record<string, { bg: string; border: string; text: string }> = {
  deep:     { bg: 'bg-indigo-100',  border: 'border-indigo-400',  text: 'text-indigo-700' },
  admin:    { bg: 'bg-slate-100',   border: 'border-slate-400',   text: 'text-slate-700' },
  creative: { bg: 'bg-amber-100',   border: 'border-amber-400',   text: 'text-amber-700' },
  physical: { bg: 'bg-emerald-100', border: 'border-emerald-400', text: 'text-emerald-700' },
  social:   { bg: 'bg-pink-100',    border: 'border-pink-400',    text: 'text-pink-700' },
  rest:     { bg: 'bg-sky-100',     border: 'border-sky-400',     text: 'text-sky-700' },
};

export const DEFAULT_ENERGY_COLOR = { bg: 'bg-primary/10', border: 'border-primary/40', text: 'text-primary' };

// ─── Week helpers ─────────────────────────────────────────────────────
export function getWeekDays(date: Date): Date[] {
  return eachDayOfInterval({
    start: startOfWeek(date, { weekStartsOn: 0 }),
    end: endOfWeek(date, { weekStartsOn: 0 }),
  });
}

export function getNextWeek(date: Date): Date { return addWeeks(date, 1); }
export function getPrevWeek(date: Date): Date { return subWeeks(date, 1); }

// ─── Positioning ──────────────────────────────────────────────────────
export function timeToY(dateStr: string): number {
  const d = new Date(dateStr);
  const hours = d.getHours() + d.getMinutes() / 60;
  return Math.max(0, (hours - START_HOUR) * HOUR_HEIGHT);
}

export function eventToPosition(event: CalendarEvent): { top: number; height: number } {
  const top = timeToY(event.start_time);
  const endY = timeToY(event.end_time);
  const height = Math.max(endY - top, 20); // minimum 20px
  return { top, height };
}

// ─── Filtering ────────────────────────────────────────────────────────
export function getEventsForDay(events: CalendarEvent[], day: Date): CalendarEvent[] {
  return events.filter((e) => isSameDay(new Date(e.start_time), day));
}

export function getCurrentEvent(events: CalendarEvent[]): CalendarEvent | null {
  const now = Date.now();
  return events.find((e) => {
    const start = new Date(e.start_time).getTime();
    const end = new Date(e.end_time).getTime();
    return now >= start && now <= end;
  }) || null;
}

export function getUpcomingEvent(events: CalendarEvent[], withinMinutes = 30): CalendarEvent | null {
  const now = Date.now();
  const cutoff = now + withinMinutes * 60_000;
  return events
    .filter((e) => {
      const start = new Date(e.start_time).getTime();
      return start > now && start <= cutoff;
    })
    .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime())[0] || null;
}

// ─── Formatting ───────────────────────────────────────────────────────
export function formatTime(dateStr: string): string {
  return format(new Date(dateStr), 'h:mm a');
}

export function formatDayHeader(date: Date): string {
  return format(date, 'EEE d');
}

export function formatWeekRange(date: Date): string {
  const days = getWeekDays(date);
  return `${format(days[0], 'MMM d')} – ${format(days[6], 'MMM d, yyyy')}`;
}

export { isSameDay, isToday, format };
