import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import FAB from '../ui/FAB';

export default function Layout() {
  return (
    <div className="flex h-screen w-full overflow-hidden bg-background font-sans text-text-main selection:bg-primary/30">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex flex-shrink-0">
        <Sidebar />
      </div>

      {/* Main Content Area */}
      <div className="flex flex-col flex-1 w-0 overflow-hidden">
        {/* Mobile Header (Placeholder if needed later) */}
        <div className="md:hidden pt-4 px-4 pb-2 flex items-center justify-between border-b border-border bg-card">
          <h1 className="text-xl font-bold text-primary">Aware</h1>
          {/* Mobile menu button would go here */}
        </div>
        
        <main className="flex-1 relative overflow-y-auto focus:outline-none scroll-smooth">
          <div className="py-6 px-4 sm:px-6 md:px-8">
            <Outlet />
          </div>
          <FAB />
        </main>
      </div>
    </div>
  );
}
