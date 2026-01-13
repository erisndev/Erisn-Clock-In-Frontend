// components/ProtectedRoute.jsx
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Spinner } from '../../components/ui/spinner';

export const ProtectedRoute = ({ children, adminOnly = false }) => {
  const { isAuthenticated, isAdmin, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center">
        <div className="relative">
          {/* soft glow */}
          <div className="absolute inset-0 -z-10 blur-2xl opacity-60">
            <div className="h-16 w-16 rounded-full bg-gradient-to-tr from-indigo-500/60 via-sky-500/40 to-purple-500/60" />
          </div>

          {/* spinner + ring for a richer loading effect */}
          <div className="flex items-center justify-center">
            <div className="rounded-full border border-white/10 bg-white/5 p-5 shadow-[0_0_40px_rgba(56,189,248,0.15)] backdrop-blur">
              <div className="relative">
                <div className="absolute inset-0 rounded-full border border-white/10" />
                <Spinner className="h-8 w-8 text-white/70" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (adminOnly && !isAdmin) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};