import { useRef, useEffect } from 'react';
import type { CalendarEvent } from '../../types';
import {
  TIME_SLOTS,
  HOUR_HEIGHT,
  SLOT_HEIGHT,
  SLOT_MINUTES,
  GRID_HEIGHT,
  START_HOUR,
  getEventsForDay,
  formatDayHeader,
  isToday,
} from './calendarUtils';
import EventBlock from './EventBlock';

interface WeekGridProps {
  days: Date[];
  events: CalendarEvent[];
  onEventClick: (event: CalendarEvent) => void;
  onSlotClick: (day: Date, hour: number, minute: number) => void;
}

export default function WeekGrid({ days, events, onEventClick, onSlotClick }: WeekGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const nowRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to current time on mount
  useEffect(() => {
    if (nowRef.current && scrollRef.current) {
      nowRef.current.scrollIntoView({ block: 'center', behavior: 'smooth' });
    }
  }, []);

  // Current time indicator position
  const now = new Date();
  const nowHours = now.getHours() + now.getMinutes() / 60;
  const nowY = Math.max(0, (nowHours - START_HOUR) * HOUR_HEIGHT);
  const showNowLine = nowHours >= START_HOUR && nowHours <= 22;

  return (
    <div className="border border-border rounded-sm bg-white overflow-hidden">
      {/* Day headers */}
      <div
        className="grid border-b border-border sticky top-0 bg-white z-20"
        style={{ gridTemplateColumns: `56px repeat(${days.length}, 1fr)` }}
      >
        <div className="border-r border-border" /> {/* time gutter */}
        {days.map((day) => (
          <div
            key={day.toISOString()}
            className={`text-center py-2 text-sm font-medium border-r border-border last:border-r-0
              ${isToday(day) ? 'bg-primary/5' : ''}`}
          >
            <span className={isToday(day) ? 'text-primary font-bold' : 'text-text-muted'}>
              {formatDayHeader(day)}
            </span>
            {isToday(day) && (
              <span className="block text-[10px] text-primary font-semibold uppercase tracking-wider">
                Today
              </span>
            )}
          </div>
        ))}
      </div>

      {/* Scrollable time grid */}
      <div ref={scrollRef} className="overflow-y-auto" style={{ maxHeight: '70vh' }}>
        <div
          className="grid relative"
          style={{
            gridTemplateColumns: `56px repeat(${days.length}, 1fr)`,
            height: `${GRID_HEIGHT}px`,
          }}
        >
          {/* Time gutter — show labels at each hour and half-hour */}
          <div className="relative border-r border-border">
            {TIME_SLOTS.filter((s) => s.isHour || s.isHalf).map((slot) => {
              const topPx = ((slot.hour - START_HOUR) * 60 + slot.minute) / SLOT_MINUTES * SLOT_HEIGHT;
              return (
                <div
                  key={`${slot.hour}:${slot.minute}`}
                  className={`absolute right-2 -translate-y-1/2 font-medium
                    ${slot.isHour ? 'text-[11px] text-text-muted' : 'text-[10px] text-text-muted/50'}`}
                  style={{ top: `${topPx}px` }}
                >
                  {slot.label}
                </div>
              );
            })}
          </div>

          {/* Day columns */}
          {days.map((day, dayIdx) => {
            const dayEvents = getEventsForDay(events, day);
            return (
              <div
                key={day.toISOString()}
                className={`relative border-r border-border last:border-r-0
                  ${isToday(day) ? 'bg-primary/[0.02]' : ''}`}
              >
                {/* 15-minute slot lines */}
                {TIME_SLOTS.map((slot, i) => {
                  const topPx = i * SLOT_HEIGHT;
                  return (
                    <div
                      key={`${slot.hour}:${slot.minute}`}
                      className={`absolute left-0 right-0 cursor-pointer hover:bg-primary/5 transition-colors
                        ${slot.isHour
                          ? 'border-t border-border/50'
                          : slot.isHalf
                            ? 'border-t border-border/25'
                            : 'border-t border-border/10'
                        }`}
                      style={{
                        top: `${topPx}px`,
                        height: `${SLOT_HEIGHT}px`,
                      }}
                      onClick={() => onSlotClick(day, slot.hour, slot.minute)}
                    />
                  );
                })}

                {/* Events */}
                {dayEvents.map((event) => (
                  <EventBlock key={event.id} event={event} onClick={onEventClick} />
                ))}

                {/* Now indicator (only on today's column) */}
                {isToday(day) && showNowLine && (
                  <div
                    ref={dayIdx === days.findIndex((d) => isToday(d)) ? nowRef : undefined}
                    className="absolute left-0 right-0 z-30 pointer-events-none"
                    style={{ top: `${nowY}px` }}
                  >
                    <div className="flex items-center">
                      <div className="w-2.5 h-2.5 rounded-full bg-red-500 -ml-1 shadow-sm" />
                      <div className="flex-1 h-[2px] bg-red-500 shadow-sm" />
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
