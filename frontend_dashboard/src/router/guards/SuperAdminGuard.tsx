import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function SuperAdminGuard() {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth/superadmin" replace />;
  }

  if (role !== 'superadmin') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
