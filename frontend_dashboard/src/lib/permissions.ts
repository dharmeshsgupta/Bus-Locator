import { useAuthStore } from '../store/authStore';

export const permissions = {
  canCreateRoute: (role: string | null) => role === 'admin' || role === 'superadmin',
  canAssignStudent: (role: string | null) => role === 'admin' || role === 'superadmin',
  canViewAnalytics: (role: string | null) => role === 'superadmin',
  canManageAdmins: (role: string | null) => role === 'superadmin',
  canUpdateOccupancy: (role: string | null) => role === 'driver',
};

export function usePermissions() {
  const { role } = useAuthStore();
  
  return {
    canCreateRoute: permissions.canCreateRoute(role),
    canAssignStudent: permissions.canAssignStudent(role),
    canViewAnalytics: permissions.canViewAnalytics(role),
    canManageAdmins: permissions.canManageAdmins(role),
    canUpdateOccupancy: permissions.canUpdateOccupancy(role),
  };
}
