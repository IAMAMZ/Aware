import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppStore } from '../../store/useAppStore';

const ProtectedRoute = () => {
  const { user, isLoading } = useAppStore();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen bg-forest flex items-center justify-center">
        <div className="text-primary-light flex flex-col items-center">
          <div className="animate-spin h-8 w-8 border-4 border-current border-t-transparent rounded-full mb-4"></div>
          <p>Loading your operating system...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Outlet />;
};

export default ProtectedRoute;
