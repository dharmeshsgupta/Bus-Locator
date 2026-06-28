import { useQuery } from '@tanstack/react-query';
import { studentApi } from '../../services/api/studentApi';
import { useAuthStore } from '../../store/authStore';

export function StudentSchedulesView() {
  const { user } = useAuthStore();
  
  const { data: assignment, isLoading } = useQuery({
    queryKey: ['studentAssignment', user?.id],
    queryFn: () => studentApi.getAssignment(),
    enabled: !!user?.id,
  });

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading schedules...</div>;
  }

  const mockAssignment = {
    route_name: 'Campus Express North',
    pickup_stop_name: 'University Library',
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
        <h2 className="text-display-sm font-bold text-on-surface">My Schedule</h2>
        <p className="text-body-lg text-on-surface-variant mt-1">Bus timings for {displayData.route_name}</p>
      </div>

      <div className="space-y-6 flex-1 overflow-y-auto pr-2">
        
        {/* Morning Schedule */}
        <div className="bg-[#fffbeb]/90 p-6 rounded-2xl border border-[#fef3c7]">
           <h3 className="text-title-lg font-bold mb-4 flex items-center gap-2 text-[#9a3412]">
             <span className="material-symbols-outlined">light_mode</span>
             Morning Commute (To Campus)
           </h3>
           <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-[#fafbfa] rounded-xl border border-[#fef3c7]">
               <p className="text-label-sm text-[#9a3412]/80 mb-1">Route Starts</p>
               <p className="text-title-md font-bold text-[#7c2d12]">07:30 AM</p>
             </div>
             <div className="p-4 bg-[#fef3c7] rounded-xl border border-[#f97316]/50">
               <p className="text-label-sm text-[#9a3412] mb-1">Est. Pickup at {displayData.pickup_stop_name}</p>
               <p className="text-title-md font-extrabold text-[#7c2d12]">07:45 AM</p>
             </div>
             <div className="p-4 bg-[#fafbfa] rounded-xl col-span-2 border border-[#fef3c7]">
               <p className="text-label-sm text-[#9a3412]/80 mb-1">Campus Arrival</p>
               <p className="text-title-md font-bold text-[#7c2d12]">08:15 AM</p>
             </div>
           </div>
        </div>

        {/* Evening Schedule */}
        <div className="bg-[#f5f3ff]/90 p-6 rounded-2xl border border-[#ddd6fe]">
           <h3 className="text-title-lg font-bold mb-4 flex items-center gap-2 text-[#6b21a8]">
             <span className="material-symbols-outlined">dark_mode</span>
             Evening Commute (From Campus)
           </h3>
           <div className="grid grid-cols-2 gap-4">
             <div className="p-4 bg-[#fafbfa] rounded-xl border border-[#ddd6fe]">
               <p className="text-label-sm text-[#6b21a8]/80 mb-1">Bus Departs Campus</p>
               <p className="text-title-md font-bold text-[#581c87]">04:30 PM</p>
             </div>
             <div className="p-4 bg-[#e9d5ff] rounded-xl border border-[#8b5cf6]/50">
               <p className="text-label-sm text-[#6b21a8] mb-1">Est. Drop-off at {displayData.pickup_stop_name}</p>
               <p className="text-title-md font-extrabold text-[#581c87]">05:00 PM</p>
             </div>
           </div>
        </div>

      </div>
    </div>
  );
}
