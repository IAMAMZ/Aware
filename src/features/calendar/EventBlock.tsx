import type { CalendarEvent } from '../../types';
import { eventToPosition, formatTime, ENERGY_COLORS, DEFAULT_ENERGY_COLOR } from './calendarUtils';
import { Zap } from 'lucide-react';

interface EventBlockProps {
  event: CalendarEvent;
  onClick: (event: CalendarEvent) => void;
}

export default function EventBlock({ event, onClick }: EventBlockProps) {
  const { top, height } = eventToPosition(event);
  const colors = ENERGY_COLORS[event.energy_type || ''] || DEFAULT_ENERGY_COLOR;
  const isCompact = height < 40;

  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(event); }}
      className={`absolute left-1 right-1 rounded-[4px] border-l-[3px] px-2 py-1 overflow-hidden cursor-pointer
        transition-all duration-150 hover:shadow-md hover:brightness-95 active:scale-[0.98]
        ${colors.bg} ${colors.border} ${colors.text}`}
      style={{ top: `${top}px`, height: `${height}px`, zIndex: 10 }}
      title={`${event.title}\n${formatTime(event.start_time)} – ${formatTime(event.end_time)}`}
    >
      {isCompact ? (
        <div className="flex items-center gap-1 truncate">
          {event.is_focus_block && <Zap className="w-3 h-3 flex-shrink-0" />}
          <span className="text-[11px] font-medium truncate">{event.title}</span>
        </div>
      ) : (
        <>
          <div className="flex items-center gap-1">
            {event.is_focus_block && <Zap className="w-3 h-3 flex-shrink-0" />}
            <span className="text-xs font-semibold truncate">{event.title}</span>
          </div>
          <div className="text-[10px] opacity-75 mt-0.5">
            {formatTime(event.start_time)} – {formatTime(event.end_time)}
          </div>
          {height > 60 && event.energy_type && (
            <div className="text-[10px] opacity-60 mt-0.5 capitalize">{event.energy_type}</div>
          )}
        </>
      )}
    </button>
  );
}
