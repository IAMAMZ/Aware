import { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useAppStore } from './store/useAppStore';

// Layout & Auth
import Layout from './components/layout/Layout';
import ProtectedRoute from './components/layout/ProtectedRoute';
import Login from './pages/Login';

// Pages (Stubs for now, to be expanded)
import Dashboard from './pages/Dashboard';
import Settings from './pages/Settings';

// Stubs for the rest of the pages
const Nutrition = () => <div className="p-8"><h1 className="text-3xl font-bold text-primary">Nutrition & GI</h1><p className="mt-4 text-text-muted">Coming soon...</p></div>;
const Sleep = () => <div className="p-8"><h1 className="text-3xl font-bold text-primary">Sleep Tracker</h1><p className="mt-4 text-text-muted">Coming soon...</p></div>;
const Mood = () => <div className="p-8"><h1 className="text-3xl font-bold text-primary">Emotions & Mood</h1><p className="mt-4 text-text-muted">Coming soon...</p></div>;
const Music = () => <div className="p-8"><h1 className="text-3xl font-bold text-primary">Music & Environment</h1><p className="mt-4 text-text-muted">Coming soon...</p></div>;
const Distraction = () => <div className="p-8"><h1 className="text-3xl font-bold text-primary">Digital Distraction</h1><p className="mt-4 text-text-muted">Coming soon...</p></div>;
const Productivity = () => <div className="p-8"><h1 className="text-3xl font-bold text-primary">Focus & Flow</h1><p className="mt-4 text-text-muted">Coming soon...</p></div>;
const Journal = () => <div className="p-8"><h1 className="text-3xl font-bold text-primary">Journal & Ideas</h1><p className="mt-4 text-text-muted">Coming soon...</p></div>;
const Tasks = () => <div className="p-8"><h1 className="text-3xl font-bold text-primary">Tasks & Prioritization</h1><p className="mt-4 text-text-muted">Coming soon...</p></div>;
const Calendar = () => <div className="p-8"><h1 className="text-3xl font-bold text-primary">Calendar & Energy Blocks</h1><p className="mt-4 text-text-muted">Coming soon...</p></div>;
const Insights = () => <div className="p-8"><h1 className="text-3xl font-bold text-primary">AI Counsellor & Patterns</h1><p className="mt-4 text-text-muted">Coming soon...</p></div>;

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
            <Route path="/nutrition" element={<Nutrition />} />
            <Route path="/sleep" element={<Sleep />} />
            <Route path="/mood" element={<Mood />} />
            <Route path="/music" element={<Music />} />
            <Route path="/distraction" element={<Distraction />} />
            <Route path="/productivity" element={<Productivity />} />
            <Route path="/journal" element={<Journal />} />
            <Route path="/tasks" element={<Tasks />} />
            <Route path="/calendar" element={<Calendar />} />
            <Route path="/insights" element={<Insights />} />
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
