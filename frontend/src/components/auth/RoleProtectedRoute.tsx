import { useAuth } from '@/context/AuthContext';
import { Navigate, useLocation, Outlet } from 'react-router-dom';
import { useEffect, useState } from 'react';
import { getCurrentUserRole, getRedirectPath } from '@/utils/auth';

interface RoleProtectedRouteProps {
  children?: React.ReactNode;
  requiredRole: 'tenant' | 'landlord';
}

export const RoleProtectedRoute = ({ children, requiredRole }: RoleProtectedRouteProps) => {
  const { user, loading } = useAuth();
  const location = useLocation();
  const [roleChecked, setRoleChecked] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      setRoleChecked(true);
    }
  }, [loading, user]);

  // Show loading while checking authentication
  if (loading || !roleChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600 text-lg">Verifying access...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not authenticated
  if (!user) {
    return <Navigate to="/auth" state={{ from: location }} replace />;
  }

  // Check if user has the required role
  const userRole = getCurrentUserRole(user);
  
  if (userRole !== requiredRole) {
    // Redirect to appropriate dashboard based on actual role
    const redirectPath = getRedirectPath(user);
    return <Navigate to={redirectPath} replace />;
  }

  return children ? <>{children}</> : <Outlet />;
};
