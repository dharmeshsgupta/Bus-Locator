import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';

export function StudentGuard() {
  const { isAuthenticated, role } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/auth/student" replace />;
  }

  if (role !== 'student') {
    return <Navigate to="/unauthorized" replace />;
  }

  return <Outlet />;
}
