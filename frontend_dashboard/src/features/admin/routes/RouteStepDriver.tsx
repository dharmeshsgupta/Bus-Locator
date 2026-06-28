import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { authApi } from '../../../services/api/authApi';
import { adminApi } from '../../../services/api/adminApi';
import { UserCircle, CheckCircle2, AlertCircle } from 'lucide-react';

export function RouteStepDriver({ driverId, setDriverId, busId }: { driverId: string, setDriverId: (id: string) => void, busId: string }) {
  // Fetch all drivers
  const { data: driversData, isLoading: isLoadingDrivers } = useQuery({
    queryKey: ['auth-drivers'],
    queryFn: () => authApi.getUsers('driver'),
  });

  // Fetch driver assignments to filter out those who are active
  const { data: assignmentsData, isLoading: isLoadingAssignments } = useQuery({
    queryKey: ['admin-driver-assignments'],
    queryFn: () => adminApi.getDriverAssignments({ page: 1, page_size: 100 }),
  });

  const isLoading = isLoadingDrivers || isLoadingAssignments;

  // Filter logic: drivers who are active, verified, and do NOT have an active assignment
  const activeAssignmentDriverIds = new Set(
    assignmentsData?.items?.filter((a: any) => a.assignment_status === 'ACTIVE').map((a: any) => a.driver_id) || []
  );

  const availableDrivers = driversData?.filter((d: any) => 
    d.is_active && 
    d.is_verified && 
    !activeAssignmentDriverIds.has(d.id)
  ) || [];

  if (!busId) {
    return (
      <div className="flex flex-col items-center justify-center h-[400px] text-center border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-xl p-8">
        <AlertCircle className="w-12 h-12 text-amber-500 mb-4" />
        <h3 className="text-lg font-bold text-slate-900 dark:text-white mb-2">Bus Required</h3>
        <p className="text-slate-500 max-w-sm">
          You must select a bus in the previous step before assigning a driver. Drivers are assigned to buses, not directly to routes.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Assign a Driver (Optional)</h3>
        {driverId && (
          <button onClick={() => setDriverId('')} className="text-sm text-red-500 hover:text-red-600 font-medium">
            Clear Selection
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading available drivers...</div>
        ) : availableDrivers.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
            No active, unassigned drivers available.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {availableDrivers.map((driver: any) => (
              <div 
                key={driver.id} 
                onClick={() => setDriverId(driver.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  driverId === driver.id 
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-full ${driverId === driver.id ? 'bg-indigo-200 dark:bg-indigo-800' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      <UserCircle className={`w-8 h-8 ${driverId === driver.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{driver.name}</div>
                      <div className="text-xs text-slate-500 font-mono">{driver.phone}</div>
                    </div>
                  </div>
                  {driverId === driver.id && <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
