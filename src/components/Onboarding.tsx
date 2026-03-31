import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, ArrowRight } from 'lucide-react';
import { useStreak } from '../hooks/useStreak';

const STEPS = [
  { icon: '😊', label: 'Log your mood', path: '/mood',         key: 'mood' },
  { icon: '🌙', label: 'Log last night\'s sleep', path: '/sleep', key: 'sleep' },
  { icon: '🥗', label: 'Log a meal or snack', path: '/nutrition', key: 'food' },
  { icon: '⏱', label: 'Start a focus session', path: '/productivity', key: 'focus' },
  { icon: '📓', label: 'Write a journal entry', path: '/journal', key: 'journal' },
];

const DISMISSED_KEY = 'aware_onboarding_dismissed';

export default function Onboarding() {
  const navigate = useNavigate();
  const { data: streak } = useStreak();
  const [dismissed, setDismissed] = useState(() => !!localStorage.getItem(DISMISSED_KEY));

  // Hide if dismissed or if user already has several logged days
  if (dismissed || (streak && streak.totalLoggedDays >= 5)) return null;

  const loggedCount = streak?.totalLoggedDays ?? 0;

  const handleDismiss = () => {
    localStorage.setItem(DISMISSED_KEY, '1');
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 to-transparent p-5 space-y-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-base font-bold text-text-main flex items-center gap-2">
            <span>🧠</span> Welcome to Aware
          </h2>
          <p className="text-sm text-text-muted mt-0.5">
            Complete these 5 first logs to unlock your health patterns. Takes about 3 minutes.
          </p>
        </div>
        <button onClick={handleDismiss} className="text-text-muted hover:text-text-main transition-colors shrink-0 mt-0.5">
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Progress bar */}
      <div className="space-y-1">
        <div className="flex justify-between text-xs text-text-muted">
          <span>{loggedCount} of 5 done</span>
          <span>{Math.round((loggedCount / 5) * 100)}%</span>
        </div>
        <div className="h-1.5 bg-border rounded-full overflow-hidden">
          <div
            className="h-full bg-primary rounded-full transition-all duration-500"
            style={{ width: `${Math.min((loggedCount / 5) * 100, 100)}%` }}
          />
        </div>
      </div>

      {/* Step checklist */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2">
        {STEPS.map((step, i) => {
          const done = i < loggedCount;
          return (
            <button
              key={step.key}
              onClick={() => !done && navigate(step.path)}
              disabled={done}
              className={`flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium text-left transition-all ${
                done
                  ? 'bg-primary/10 border-primary/20 text-primary opacity-70 cursor-default'
                  : 'bg-card border-border text-text-muted hover:border-primary/40 hover:text-text-main hover:shadow-sm'
              }`}
            >
              <span className="text-base shrink-0">{done ? '✓' : step.icon}</span>
              <span className="text-xs leading-tight flex-1">{step.label}</span>
              {!done && <ArrowRight className="w-3 h-3 shrink-0 opacity-50" />}
            </button>
          );
        })}
      </div>

      <p className="text-xs text-text-muted">
        Aware tracks mood, sleep, nutrition, focus, and distractions to reveal patterns unique to your ADHD — the more you log, the sharper your insights.
      </p>
    </div>
  );
}
