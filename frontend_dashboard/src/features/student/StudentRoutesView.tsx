import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../../services/api/studentApi';
import { useAuthStore } from '../../store/authStore';

export function StudentRoutesView() {
  const { user } = useAuthStore();
  
  const { data: assignment, isLoading } = useQuery({
    queryKey: ['studentAssignment', user?.id],
    queryFn: () => studentApi.getAssignment(),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading routes...</div>;
  }

  const mockAssignment = {
    route_name: 'Campus Express North',
    bus_number: 'BUS-402',
    pickup_stop_name: 'University Library',
    driver_name: 'John Smith',
  };

  const displayData = assignment || mockAssignment;

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest p-6 rounded-3xl shadow-sm">
      {!assignment && (
        <div className="mb-4 p-4 bg-warning/10 text-warning border border-warning/20 rounded-xl flex items-center gap-2">
          <span className="material-symbols-outlined">info</span>
          <p className="text-body-sm font-medium">Viewing demo data. You have not been officially assigned to a bus route yet.</p>
        </div>
      )}
      <div className="mb-8">
        <h2 className="text-display-sm font-bold text-on-surface">My Route</h2>
        <p className="text-body-lg text-on-surface-variant mt-1">Details for your assigned daily route</p>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        
        {/* Route Info Card */}
        <div className="bg-primary-container text-on-primary-container p-6 rounded-2xl border border-primary/20">
          <div className="flex items-center justify-between mb-4">
             <div>
               <h3 className="text-headline-md font-bold">{displayData.route_name || 'Assigned Route'}</h3>
               <p className="text-body-md opacity-80 mt-1">Bus ID: {displayData.bus_number || 'N/A'}</p>
             </div>
             <span className="material-symbols-outlined text-5xl opacity-50">directions_bus</span>
          </div>
          <div className="pt-4 border-t border-on-primary-container/20">
             <p className="font-bold">Your Pickup Stop:</p>
             <p className="text-title-md">{displayData.pickup_stop_name || 'N/A'}</p>
          </div>
        </div>

        {/* Driver Info */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-surface-container">
           <h3 className="text-title-md font-bold mb-4 flex items-center gap-2">
             <span className="material-symbols-outlined">badge</span>
             Driver Details
           </h3>
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-secondary/10 text-secondary rounded-full flex items-center justify-center font-bold">
                DR
              </div>
              <div>
                 <p className="font-bold">{displayData.driver_name !== 'TBD' ? 'Assigned Driver' : 'TBD'}</p>
                 <p className="text-body-sm text-on-surface-variant">ID: {displayData.driver_name}</p>
              </div>
           </div>
        </div>

        {/* Placeholder for full stop list */}
        <div className="bg-surface-container-low p-6 rounded-2xl border border-surface-container">
           <h3 className="text-title-md font-bold mb-4 flex items-center gap-2">
             <span className="material-symbols-outlined">map</span>
             Route Overview
           </h3>
           <p className="text-body-md text-on-surface-variant">
             Full route timeline and all stops will be displayed here soon. For now, check the Live Map to see the route path visually!
           </p>
        </div>

      </div>
    </div>
  );
}
