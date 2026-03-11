import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';

// Layout & Auth
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';

// Pages
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

// Feature pages
import MoodPage from './features/mood/MoodPage';
import SleepPage from './features/sleep/SleepPage';
import NutritionPage from './features/nutrition/NutritionPage';
import ProductivityPage from './features/productivity/ProductivityPage';
import DistractionPage from './features/distraction/DistractionPage';
import JournalPage from './features/journal/JournalPage';
import TasksPage from './features/tasks/TasksPage';
import CalendarPage from './features/calendar/CalendarPage';
import InsightsPage from './features/insights/InsightsPage';

// Music page stub (no table in DB yet)
const Music = () => <div className="p-8"><h1 className="text-3xl font-bold text-primary">Music & Environment</h1><p className="mt-4 text-text-muted">Coming soon...</p></div>;

function App() {
  const { initializeUser, isLoading } = useAppStore();

  useEffect(() => {
    initializeUser();
  }, [initializeUser]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-forest flex items-center justify-center">
        <div className="text-primary-light flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full mb-4"></div>
          <p>Initializing...</p>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <Routes>
        <Route path="/login" element={<Login />} />
        
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Dashboard />} />
            <Route path="/nutrition" element={<NutritionPage />} />
            <Route path="/sleep" element={<SleepPage />} />
            <Route path="/mood" element={<MoodPage />} />
            <Route path="/music" element={<Music />} />
            <Route path="/distraction" element={<DistractionPage />} />
            <Route path="/productivity" element={<ProductivityPage />} />
            <Route path="/journal" element={<JournalPage />} />
            <Route path="/tasks" element={<TasksPage />} />
            <Route path="/calendar" element={<CalendarPage />} />
            <Route path="/insights" element={<InsightsPage />} />
            <Route path="/settings" element={<Settings />} />
          </Route>
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
