import { NavLink } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';
import { 
  LayoutDashboard, 
  Utensils, 
  Moon, 
  Smile,
  Smartphone, 
  Timer, 
  BookText, 
  CheckSquare, 
  Calendar,
  Sunrise,
  Sunset,
  BrainCircuit, 
  Settings,
  LogOut
} from 'lucide-react';
import clsx from 'clsx';

const navItems = [
  { path: '/', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/nutrition', label: 'Nutrition & GI', icon: Utensils },
  { path: '/sleep', label: 'Sleep', icon: Moon },
  { path: '/mood', label: 'Emotions & Mood', icon: Smile },
  { path: '/distraction', label: 'Distraction', icon: Smartphone },
  { path: '/productivity', label: 'Focus & Flow', icon: Timer },
  { path: '/journal', label: 'Journal', icon: BookText },
  { path: '/tasks', label: 'Tasks', icon: CheckSquare },
  { path: '/calendar', label: 'Calendar', icon: Calendar },
  { path: '/ahead', label: 'Day Ahead', icon: Sunrise },
  { path: '/review', label: 'Day Review', icon: Sunset },
  { path: '/insights', label: 'AI Counsellor', icon: BrainCircuit },
];

export default function Sidebar() {
  const { user, signOut } = useAppStore();

  return (
    <div className="flex flex-col h-full w-64 bg-card border-r border-border custom-scrollbar">
      <div className="h-16 flex items-center px-6 border-b border-border">
        <h1 className="text-xl font-bold text-primary flex items-center gap-2">
          <BrainCircuit className="w-6 h-6" />
          Aware
        </h1>
      </div>

      <div className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) =>
              clsx(
                'flex items-center gap-3 px-3 py-2 rounded-sm transition-colors duration-200 text-sm font-medium',
                isActive 
                  ? 'bg-primary/10 text-primary' 
                  : 'text-text-muted hover:bg-forest hover:text-text-main'
              )
            }
          >
            <item.icon className="w-5 h-5 flex-shrink-0" />
            {item.label}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-border space-y-1">
        <NavLink
          to="/settings"
          className={({ isActive }) =>
            clsx(
              'flex items-center gap-3 px-3 py-2 rounded-sm transition-colors duration-200 text-sm font-medium',
              isActive 
                ? 'bg-primary/10 text-primary' 
                : 'text-text-muted hover:bg-forest hover:text-text-main'
            )
          }
        >
          <Settings className="w-5 h-5 flex-shrink-0" />
          Settings
        </NavLink>
        
        <button
          onClick={() => signOut()}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-sm transition-colors duration-200 text-sm font-medium text-text-muted hover:bg-danger/10 hover:text-danger mt-2"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          Sign Out
        </button>

        {user?.email && (
          <div className="mt-4 px-3 text-xs text-text-muted truncate" title={user.email}>
            {user.email}
          </div>
        )}
      </div>
    </div>
  );
}
