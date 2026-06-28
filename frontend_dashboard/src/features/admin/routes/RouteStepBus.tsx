import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminApi } from '../../../services/api/adminApi';
import { Bus, CheckCircle2 } from 'lucide-react';

export function RouteStepBus({ busId, setBusId }: { busId: string, setBusId: (id: string) => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ['admin-buses-unassigned'],
    queryFn: () => adminApi.getBuses({ page: 1, page_size: 100 }),
  });

  const buses = data?.items?.filter((b: any) => b.is_active && !b.current_route_id && b.current_status !== 'maintenance') || [];

  return (
    <div className="space-y-4 h-[400px] flex flex-col">
      <div className="flex justify-between items-center mb-2">
        <h3 className="text-lg font-medium text-slate-900 dark:text-white">Assign a Bus (Optional)</h3>
        {busId && (
          <button onClick={() => setBusId('')} className="text-sm text-red-500 hover:text-red-600 font-medium">
            Clear Selection
          </button>
        )}
      </div>

      <div className="flex-1 overflow-y-auto">
        {isLoading ? (
          <div className="p-8 text-center text-slate-500">Loading available buses...</div>
        ) : buses.length === 0 ? (
          <div className="p-8 text-center text-slate-500 border border-dashed border-slate-300 dark:border-slate-700 rounded-xl">
            No active, unassigned buses available. You can assign one later.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {buses.map((bus: any) => (
              <div 
                key={bus.id} 
                onClick={() => setBusId(bus.id)}
                className={`p-4 rounded-xl border-2 cursor-pointer transition-all ${
                  busId === bus.id 
                    ? 'border-indigo-600 bg-indigo-50 dark:bg-indigo-900/20' 
                    : 'border-slate-200 dark:border-slate-700 hover:border-indigo-300 dark:hover:border-indigo-700 bg-white dark:bg-slate-800'
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${busId === bus.id ? 'bg-indigo-200 dark:bg-indigo-800' : 'bg-slate-100 dark:bg-slate-700'}`}>
                      <Bus className={`w-6 h-6 ${busId === bus.id ? 'text-indigo-700 dark:text-indigo-300' : 'text-slate-500 dark:text-slate-400'}`} />
                    </div>
                    <div>
                      <div className="font-bold text-slate-900 dark:text-white">{bus.bus_number}</div>
                      <div className="text-xs text-slate-500 font-mono">{bus.registration_number}</div>
                    </div>
                  </div>
                  {busId === bus.id && <CheckCircle2 className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />}
                </div>
                <div className="mt-4 flex gap-2">
                  <span className="px-2 py-1 bg-slate-100 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-xs rounded-md">
                    Capacity: {bus.capacity}
                  </span>
                  <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-md">
                    {bus.current_status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
