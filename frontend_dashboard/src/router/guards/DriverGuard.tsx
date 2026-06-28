import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function DriverGuard() {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth/driver" replace />;
  }

  if (role !== 'driver') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
