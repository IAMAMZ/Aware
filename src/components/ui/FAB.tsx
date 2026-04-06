import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, X, Smile, Utensils, Timer, BookText, Moon } from 'lucide-react';

const ACTIONS = [
  { icon: Smile,    label: 'Mood',    path: '/mood',         color: 'bg-warning text-white' },
  { icon: Utensils, label: 'Food',    path: '/nutrition',    color: 'bg-primary text-white' },
  { icon: Timer,    label: 'Focus',   path: '/productivity', color: 'bg-primary-light text-white' },
  { icon: BookText, label: 'Journal', path: '/journal',      color: 'bg-danger text-white' },
  { icon: Moon,     label: 'Sleep',   path: '/sleep',        color: 'bg-indigo-600 text-white' },
];

export default function FAB() {
  const [open, setOpen] = useState(false);
  const navigate = useNavigate();

  const handleAction = (path: string) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Action buttons — animate in/out */}
      {open && (
        <div className="flex flex-col items-end gap-2">
          {ACTIONS.map(({ icon: Icon, label, path, color }) => (
            <button
              key={path}
              onClick={() => handleAction(path)}
              className={`flex items-center gap-2 px-3 py-2 rounded-full shadow-lg text-sm font-medium transition-all duration-150 hover:scale-105 active:scale-95 ${color}`}
            >
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Main toggle button */}
      <button
        onClick={() => setOpen((o) => !o)}
        className={`w-14 h-14 rounded-full shadow-xl flex items-center justify-center transition-all duration-200 hover:scale-110 active:scale-95 ${
          open
            ? 'bg-danger text-white rotate-45'
            : 'bg-primary text-white'
        }`}
        style={{ transform: open ? 'rotate(45deg)' : 'rotate(0deg)' }}
        aria-label={open ? 'Close quick log' : 'Quick log'}
      >
        {open ? <X className="w-6 h-6" /> : <Plus className="w-6 h-6" />}
      </button>
    </div>
  );
}
