import { useState, useEffect } from 'react';
import type { CalendarEvent } from '../../types';
import { Button } from '../../components/ui/Button';
import { X, Trash2, Zap, CheckCircle2, RotateCcw } from 'lucide-react';

const ENERGY_TYPES = ['deep', 'admin', 'creative', 'physical', 'social', 'rest'];

const SIDETRACK_REASONS = [
  { key: 'phone', emoji: '📱', label: 'Phone' },
  { key: 'email', emoji: '📧', label: 'Email/Slack' },
  { key: 'rabbit_hole', emoji: '🕳️', label: 'Rabbit hole' },
  { key: 'snack', emoji: '🍿', label: 'Snack break' },
  { key: 'rest', emoji: '😴', label: 'Needed rest' },
  { key: 'other', emoji: '🤷', label: 'Other' },
] as const;

interface EventModalProps {
  event?: CalendarEvent | null;
  defaultStart?: string;
  defaultEnd?: string;
  checkinStatus?: 'on_track' | 'sidetracked' | null; // existing check-in for this event
  onSave: (data: {
    title: string;
    start_time: string;
    end_time: string;
    energy_type: string;
    is_focus_block: boolean;
    notes: string | null;
  }) => void;
  onCheckin?: (eventId: string, status: 'on_track' | 'sidetracked', reason?: string) => void;
  onDelete?: (id: string) => void;
  onClose: () => void;
  isSaving?: boolean;
}

export default function EventModal({
  event,
  defaultStart,
  defaultEnd,
  checkinStatus: existingCheckin,
  onSave,
  onCheckin,
  onDelete,
  onClose,
  isSaving,
}: EventModalProps) {
  const isEdit = !!event;
  const isPast = isEdit && new Date(event!.end_time).getTime() < Date.now();
  const isCurrent = isEdit &&
    new Date(event!.start_time).getTime() <= Date.now() &&
    new Date(event!.end_time).getTime() >= Date.now();

  // Format ISO string to datetime-local value
  const toLocal = (iso: string) => {
    const d = new Date(iso);
    const offset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - offset * 60000);
    return local.toISOString().slice(0, 16);
  };

  const [title, setTitle] = useState(event?.title || '');
  const [startTime, setStartTime] = useState(
    event?.start_time ? toLocal(event.start_time) : defaultStart || ''
  );
  const [endTime, setEndTime] = useState(
    event?.end_time ? toLocal(event.end_time) : defaultEnd || ''
  );
  const [energyType, setEnergyType] = useState(event?.energy_type || 'admin');
  const [isFocusBlock, setIsFocusBlock] = useState(event?.is_focus_block || false);
  const [notes, setNotes] = useState(event?.notes || '');

  // Check-in state
  const [localCheckin, setLocalCheckin] = useState<'on_track' | 'sidetracked' | null>(existingCheckin || null);
  const [showReasons, setShowReasons] = useState(false);

  // Close on Escape
  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  const handleSubmit = () => {
    if (!title.trim() || !startTime || !endTime) return;
    onSave({
      title: title.trim(),
      start_time: new Date(startTime).toISOString(),
      end_time: new Date(endTime).toISOString(),
      energy_type: energyType,
      is_focus_block: isFocusBlock,
      notes: notes || null,
    });
  };

  const handleCheckin = (status: 'on_track' | 'sidetracked') => {
    setLocalCheckin(status);
    if (status === 'sidetracked') {
      setShowReasons(true);
    } else {
      onCheckin?.(event!.id, status);
    }
  };

  const handleReasonSelect = (reason: string) => {
    setShowReasons(false);
    onCheckin?.(event!.id, 'sidetracked', reason);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white rounded-lg shadow-2xl border border-border w-full max-w-md animate-in max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
        style={{ animation: 'slideUp 0.2s ease-out' }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-border">
          <h2 className="text-lg font-semibold text-text-main">
            {isEdit ? 'Edit Event' : 'New Event'}
          </h2>
          <button onClick={onClose} className="text-text-muted hover:text-text-main transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Title */}
          <input
            type="text"
            placeholder="Event title..."
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            autoFocus
            className="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm text-text-main
              placeholder-text-muted focus:outline-none focus:border-primary"
          />

          {/* Start / End */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-text-muted mb-1 block">Start</label>
              <input
                type="datetime-local"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm text-text-main
                  focus:outline-none focus:border-primary"
              />
            </div>
            <div>
              <label className="text-xs text-text-muted mb-1 block">End</label>
              <input
                type="datetime-local"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm text-text-main
                  focus:outline-none focus:border-primary"
              />
            </div>
          </div>

          {/* Energy type */}
          <div>
            <p className="text-xs text-text-muted mb-2">Energy type</p>
            <div className="flex flex-wrap gap-2">
              {ENERGY_TYPES.map((e) => (
                <button
                  key={e}
                  onClick={() => setEnergyType(e)}
                  className={`px-3 py-1 rounded-full text-sm border transition-colors capitalize
                    ${energyType === e
                      ? 'bg-primary text-white border-primary'
                      : 'border-border text-text-muted hover:border-primary'
                    }`}
                >
                  {e}
                </button>
              ))}
            </div>
          </div>

          {/* Focus block toggle */}
          <label className="flex items-center gap-2 cursor-pointer select-none">
            <div
              onClick={() => setIsFocusBlock(!isFocusBlock)}
              className={`w-10 h-6 rounded-full transition-colors flex items-center px-1
                ${isFocusBlock ? 'bg-primary' : 'bg-border'}`}
            >
              <div className={`w-4 h-4 rounded-full bg-white transition-transform
                ${isFocusBlock ? 'translate-x-4' : ''}`}
              />
            </div>
            <span className="text-sm text-text-muted flex items-center gap-1">
              <Zap className="w-3.5 h-3.5" /> Focus block
            </span>
          </label>

          {/* Notes */}
          <input
            type="text"
            placeholder="Notes (optional)"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="w-full bg-white border border-border rounded-sm px-3 py-2 text-sm text-text-main
              placeholder-text-muted focus:outline-none focus:border-primary"
          />

          {/* ── Retroactive Check-in (for past / current events) ── */}
          {isEdit && (isPast || isCurrent) && onCheckin && (
            <div className="border-t border-border pt-4">
              <p className="text-xs font-semibold text-text-muted uppercase tracking-wider mb-2">
                {isPast ? '📋 How did this go?' : '🔴 Are you on track?'}
              </p>

              {localCheckin === null ? (
                <div className="flex gap-2">
                  <button
                    onClick={() => handleCheckin('on_track')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm
                      bg-emerald-50 border border-emerald-200 text-emerald-700 text-sm font-medium
                      hover:bg-emerald-100 transition-colors"
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    {isPast ? 'I did it' : "I'm on it"}
                  </button>
                  <button
                    onClick={() => handleCheckin('sidetracked')}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-sm
                      bg-amber-50 border border-amber-200 text-amber-700 text-sm font-medium
                      hover:bg-amber-100 transition-colors"
                  >
                    <RotateCcw className="w-4 h-4" />
                    {isPast ? 'I skipped it' : 'Got sidetracked'}
                  </button>
                </div>
              ) : localCheckin === 'on_track' ? (
                <div className="flex items-center gap-2 py-2 px-3 rounded-sm bg-emerald-50 border border-emerald-200">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span className="text-sm font-medium text-emerald-700">
                    {isPast ? 'Logged as completed ✓' : 'Nice! Keep going 💪'}
                  </span>
                </div>
              ) : showReasons ? (
                <div>
                  <p className="text-xs text-text-muted mb-2">What happened?</p>
                  <div className="grid grid-cols-3 gap-2">
                    {SIDETRACK_REASONS.map((r) => (
                      <button
                        key={r.key}
                        onClick={() => handleReasonSelect(r.key)}
                        className="py-2 px-2 rounded-sm border border-border text-xs text-text-muted
                          hover:border-amber-400 hover:bg-amber-50 transition-colors text-center"
                      >
                        <span className="text-lg block mb-0.5">{r.emoji}</span>
                        {r.label}
                      </button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-2 py-2 px-3 rounded-sm bg-amber-50 border border-amber-200">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span className="text-sm text-amber-700">
                    {isPast ? 'Noted — no judgment, just data 📊' : 'Noted! Get back to it when you can'}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center gap-2 px-5 py-4 border-t border-border">
          {isEdit && onDelete && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => onDelete(event!.id)}
              className="mr-auto gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" /> Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="secondary" size="sm" onClick={onClose}>
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleSubmit}
              disabled={!title.trim() || !startTime || !endTime || isSaving}
            >
              {isSaving ? 'Saving...' : isEdit ? 'Save Changes' : 'Create Event'}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
