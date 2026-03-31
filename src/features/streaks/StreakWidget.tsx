import { useStreak } from '../../hooks/useStreak';
import { Flame, Shield } from 'lucide-react';

// ADHD design principle: reward self-awareness, never shame.
// - Any log counts (mood, food, sleep, journal, distraction, urge surf)
// - Today is never "broken" until midnight — streak stays alive from yesterday
// - Language is always encouraging, no "STREAK BROKEN" message
// - "Fresh start" framing on reset, not failure language

function DotGrid({ last14 }: { last14: boolean[] }) {
  return (
    <div className="flex gap-1 items-center flex-wrap">
      {last14.map((logged, i) => {
        const isToday = i === 13;
        return (
          <div
            key={i}
            title={logged ? 'Logged' : isToday ? 'Log today!' : 'No log'}
            className={`
              rounded-sm transition-all
              ${isToday ? 'w-3.5 h-3.5' : 'w-2.5 h-2.5'}
              ${logged
                ? isToday
                  ? 'bg-primary shadow-sm shadow-primary/40'
                  : 'bg-primary/70'
                : isToday
                  ? 'bg-border border-2 border-primary/40 animate-pulse'
                  : 'bg-border'
              }
            `}
          />
        );
      })}
    </div>
  );
}

export default function StreakWidget() {
  const { data: streak, isLoading } = useStreak();

  if (isLoading || !streak) return null;

  // Pick the right message — always positive, never shaming
  const getMessage = () => {
    if (streak.current === 0 && !streak.loggedToday) {
      return { text: 'Every log is a step forward. Start today 🌱', highlight: false };
    }
    if (streak.current === 1 && streak.loggedToday) {
      return { text: "Day 1 — you showed up. That's what matters 🌱", highlight: false };
    }
    if (streak.streakAlive) {
      return { text: `${streak.current}-day streak still going — log anything today to extend it! 💫`, highlight: true };
    }
    if (streak.loggedToday && streak.current >= 7) {
      return { text: `${streak.current} days of showing up for yourself. That's real 🔥`, highlight: true };
    }
    if (streak.loggedToday) {
      return { text: `${streak.current} days logging. Self-awareness builds over time 🧠`, highlight: false };
    }
    return { text: 'Keep the momentum — log something today! 💫', highlight: true };
  };

  const msg = getMessage();
  const displayStreak = streak.current;
  const progressToMilestone = streak.nextMilestone
    ? Math.round((displayStreak / streak.nextMilestone) * 100)
    : 100;

  return (
    <div className="rounded-2xl ring-1 ring-inset ring-black/5 bg-gradient-to-r from-primary/5 to-transparent p-4">
      <div className="flex items-start justify-between gap-4">
        {/* Left: streak count */}
        <div className="flex items-center gap-3">
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center shrink-0 ${
            displayStreak >= 7 ? 'bg-primary text-white' : 'bg-primary/10 text-primary'
          }`}>
            {streak.streakAlive
              ? <Shield className="w-6 h-6" />
              : <Flame className="w-6 h-6" />
            }
          </div>
          <div>
            <div className="flex items-baseline gap-1.5">
              <span className="text-3xl font-bold text-text-main">{displayStreak}</span>
              <span className="text-sm text-text-muted font-medium">
                {displayStreak === 1 ? 'day' : 'days'}
              </span>
            </div>
            <p className="text-xs text-text-muted">self-awareness streak</p>
          </div>
        </div>

        {/* Right: best + total */}
        <div className="text-right shrink-0">
          <p className="text-xs text-text-muted">best <span className="text-text-main font-semibold">{streak.best}d</span></p>
          <p className="text-xs text-text-muted mt-0.5">
            {streak.totalLoggedDays} total days logged
          </p>
        </div>
      </div>

      {/* 14-day dot grid */}
      <div className="mt-3">
        <DotGrid last14={streak.last14} />
        <p className="text-[10px] text-text-muted mt-1">Last 14 days · any log counts</p>
      </div>

      {/* Milestone progress bar */}
      {streak.nextMilestone && (
        <div className="mt-3 space-y-1">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-muted">
              {streak.nextMilestone - displayStreak} day{streak.nextMilestone - displayStreak !== 1 ? 's' : ''} to {streak.nextMilestone}-day milestone
            </span>
            <span className="text-xs text-text-muted">{progressToMilestone}%</span>
          </div>
          <div className="h-1 bg-border rounded-full overflow-hidden">
            <div
              className="h-full bg-primary rounded-full transition-all duration-500"
              style={{ width: `${progressToMilestone}%` }}
            />
          </div>
        </div>
      )}
      {!streak.nextMilestone && (
        <div className="mt-2">
          <span className="text-xs text-primary font-medium">🏆 100-day champion!</span>
        </div>
      )}

      {/* Encouraging message */}
      <p className={`mt-3 text-xs leading-relaxed ${msg.highlight ? 'text-primary font-medium' : 'text-text-muted'}`}>
        {msg.text}
      </p>
    </div>
  );
}
