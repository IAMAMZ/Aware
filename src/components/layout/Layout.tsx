import { NavLink, Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import FAB from '../ui/FAB';
import {
  LayoutDashboard,
  Smile,
  Timer,
  Calendar,
  BarChart2,
} from 'lucide-react';
import clsx from 'clsx';

// Five most-used pages for mobile bottom nav — covers the daily ADHD workflow
const BOTTOM_NAV = [
  { path: '/',           label: 'Home',     icon: LayoutDashboard },
  { path: '/mood',       label: 'Mood',     icon: Smile },
  { path: '/productivity', label: 'Focus',  icon: Timer },
  { path: '/calendar',   label: 'Calendar', icon: Calendar },
  { path: '/analytics',  label: 'Patterns', icon: BarChart2 },
];

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-text-main selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Mobile header */}
        <div className="md:hidden pt-4 px-4 pb-2 flex items-center justify-between border-b border-border bg-card shrink-0">
          <h1 className="text-xl font-bold text-primary flex items-center gap-1.5">
            <span className="text-lg">🧠</span> Aware
          </h1>
        </div>

        {/* Scrollable page content — bottom padding clears the mobile nav */}
        <main className="flex-1 relative overflow-y-auto focus:outline-none scroll-smooth">
          <div className="py-6 px-4 sm:px-6 md:px-8 pb-24 md:pb-8">
            <Outlet />
          </div>
          {/* FAB only on desktop — mobile uses bottom nav */}
          <div className="hidden md:block">
            <FAB />
          </div>
        </main>
      </div>

      {/* ── Mobile bottom navigation bar ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border">
        <div className="flex items-stretch h-16">
          {BOTTOM_NAV.map(({ path, label, icon: Icon }) => (
            <NavLink
              key={path}
              to={path}
              end={path === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex-1 flex flex-col items-center justify-center gap-0.5 text-[10px] font-medium transition-colors duration-150',
                  isActive
                    ? 'text-primary'
                    : 'text-text-muted hover:text-text-main'
                )
              }
            >
              {({ isActive }) => (
                <>
                  <div className={clsx(
                    'p-1.5 rounded-lg transition-colors',
                    isActive ? 'bg-primary/10' : ''
                  )}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <span>{label}</span>
                </>
              )}
            </NavLink>
          ))}
        </div>
        {/* iOS safe area */}
        <div className="h-safe-area-inset-bottom bg-card" />
      </nav>
    </div>
  );
}
