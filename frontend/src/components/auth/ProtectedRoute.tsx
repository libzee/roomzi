import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation } from 'react-router-dom';
import { getRedirectPath } from '@/utils/auth';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ children, requireAuth = true }: ProtectedRouteProps) => {
  const { user } = useAuth();
  const location = useLocation();

  if (requireAuth && !user) {
    // Redirect to auth if not authenticated
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  if (!requireAuth && user) {
    // Redirect authenticated users away from auth pages to their appropriate dashboard
    const redirectPath = getRedirectPath(user);
    return <Navigate to={redirectPath} replace />;
  }

  return <>{children}</>;
}; 