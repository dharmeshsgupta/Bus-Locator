import { useEffect, useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { driverApi, DriverAssignment } from '../../services/api/driverApi';
import { offlineDB } from '../../services/offline/indexedDBService';
import toast from 'react-hot-toast';

export function DriverDashboard() {
  const queryClient = useQueryClient();
  const [speed, setSpeed] = useState(0);
  const [accuracy, setAccuracy] = useState(0);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isSafetyMode, setIsSafetyMode] = useState(false);
  const watchId = useRef<number | null>(null);

  // Fetch Assignment
  const { data: assignment, isLoading, error } = useQuery<DriverAssignment>({
    queryKey: ['driver-assignment'],
    queryFn: () => driverApi.getMyAssignment(),
    refetchInterval: 60000, // refresh every minute just in case
  });

  const busId = assignment?.bus?.id;
  const routeId = assignment?.route?.id;
  const [localRouteStatus, setLocalRouteStatus] = useState<string | null>(null);
  const routeStatus = localRouteStatus || assignment?.route_status || 'NOT_STARTED';

  // State Transition Mutations
  const mutateState = useMutation({
    mutationFn: async (action: 'startRoute' | 'pauseRoute' | 'resumeRoute' | 'endRoute') => {
      if (!busId || !routeId) throw new Error('No bus/route assigned');
      return await driverApi[action]({ bus_id: busId, route_id: routeId });
    },
    onSuccess: (data, variables) => {
      const stateMap: Record<string, string> = {
        'startRoute': 'IN_PROGRESS',
        'pauseRoute': 'PAUSED',
        'resumeRoute': 'IN_PROGRESS',
        'endRoute': 'COMPLETED'
      };
      setLocalRouteStatus(stateMap[variables]);
      queryClient.invalidateQueries({ queryKey: ['driver-assignment'] });
    }
  });

  // Emergency Reporting
  const reportEmergency = async (type: string) => {
    if (!busId || !routeId) return;
    try {
      if (isOnline) {
        await driverApi.reportEmergency({ bus_id: busId, route_id: routeId, type, message: `Emergency triggered: ${type}` });
      } else {
        await offlineDB.enqueue('emergency', { bus_id: busId, route_id: routeId, type, message: `Emergency triggered: ${type}` });
      }
      toast.error(`${type} Reported Successfully!`);
    } catch (e) {
      toast.error('Failed to report emergency');
    }
  };

  // Occupancy Update
  const updateOccupancy = async (change: number) => {
    if (!busId || !routeId) return;
    try {
      if (isOnline) {
        await driverApi.updateOccupancy({ bus_id: busId, route_id: routeId, occupancy_change: change });
      } else {
        await offlineDB.enqueue('occupancy', { bus_id: busId, route_id: routeId, occupancy_change: change });
      }
      toast.success(change > 0 ? 'Passenger Boarded' : 'Passenger Alighted');
    } catch (e) {
      toast.error('Occupancy update failed');
    }
  };

  // Connectivity Sync
  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true);
      const queue = await offlineDB.dequeueAll();
      if (queue.length > 0) {
        toast.loading(`Syncing ${queue.length} offline events...`);
        // Basic sync replay logic
        for (const item of queue) {
          try {
            if (item.type === 'location') await driverApi.publishLocation(item.data);
            if (item.type === 'emergency') await driverApi.reportEmergency(item.data);
            if (item.type === 'occupancy') await driverApi.updateOccupancy(item.data);
          } catch (e) {
             console.warn('Sync failed for item', item);
          }
        }
        await offlineDB.clearQueue();
        toast.dismiss();
        toast.success('Offline data synced!');
      }
    };
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // GPS Tracking
  useEffect(() => {
    if (routeStatus === 'IN_PROGRESS' && busId && routeId) {
      // Background logic is OS dependent, but standard watchPosition is here
      watchId.current = navigator.geolocation.watchPosition(
        async (position) => {
          const lat = position.coords.latitude;
          const lng = position.coords.longitude;
          const spd_ms = position.coords.speed || 0;
          const spd_kmh = spd_ms * 3.6;
          const acc = position.coords.accuracy;

          setSpeed(spd_kmh);
          setAccuracy(acc);

          // Safety Mode Toggle
          if (spd_kmh > 8) {
             setIsSafetyMode(true);
          } else {
             setIsSafetyMode(false);
          }

          // Publish
          const payload = { bus_id: busId, route_id: routeId, latitude: lat, longitude: lng, speed: spd_kmh, accuracy: acc };
          try {
            if (isOnline) {
               await driverApi.publishLocation(payload);
            } else {
               await offlineDB.enqueue('location', payload);
            }
          } catch (err) {
             // Silently handle if request drops to avoid spamming UI
          }
        },
        (error) => {
          console.error("GPS Error", error);
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
      );
    } else {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
        watchId.current = null;
        setSpeed(0);
        setIsSafetyMode(false);
      }
    }

    return () => {
      if (watchId.current !== null) {
        navigator.geolocation.clearWatch(watchId.current);
      }
    };
  }, [routeStatus, busId, routeId, isOnline]);

  if (isLoading) return <div className="p-8 text-center">Loading assignment...</div>;
  if (error || !assignment) return <div className="p-8 text-center text-error">Failed to load assignment. Contact Admin.</div>;

  const isTracking = routeStatus === 'IN_PROGRESS';

  return (
    <div className={`flex flex-col h-full bg-transparent ${isSafetyMode ? 'border-4 border-rose-500/50' : ''}`}>
      {/* Header (Clean White Card Layout) */}
      <div className="p-4 border border-slate-200 flex justify-between items-center bg-white shadow-xs rounded-2xl mb-md">
        <div>
          <h1 className="text-headline-md font-bold text-slate-900 tracking-tight">Driver Terminal</h1>
          <p className="text-body-sm text-slate-500 font-semibold">Bus: {assignment.bus?.bus_number || 'N/A'}</p>
        </div>
        <div className="flex items-center gap-2 bg-slate-50 border border-slate-200 px-3 py-1 rounded-full shadow-xs">
          <div className={`w-2 h-2 rounded-full ${isOnline ? 'bg-emerald-500' : 'bg-rose-500'} animate-pulse`}></div>
          <span className="text-[11px] font-bold text-slate-600 tracking-wider">{isOnline ? 'ONLINE' : 'OFFLINE'}</span>
        </div>
      </div>

      {isSafetyMode && (
        <div className="bg-rose-600 text-white p-3 text-center font-bold text-label-lg shadow-md z-10 sticky top-0 rounded-xl mb-md animate-pulse">
          ⚠️ SAFETY MODE ACTIVE - VEHICLE IN MOTION
        </div>
      )}

      {/* Main Content */}
      <div className={`flex-1 overflow-y-auto space-y-md ${isSafetyMode ? 'opacity-50 pointer-events-none' : ''}`}>
        
        {/* Route Card (Clean White Surface) */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 hover:border-slate-300 transition-all">
          <div className="flex justify-between items-center mb-sm">
            <h3 className="text-label-md uppercase tracking-widest font-bold text-slate-400">Current Route</h3>
            <span className="px-2.5 py-0.5 bg-slate-50 text-slate-600 text-[10px] font-bold rounded-full border border-slate-200">
              {routeStatus}
            </span>
          </div>
          <p className="text-headline-md font-bold text-slate-900 tracking-tight">{assignment.route?.route_name || 'No Route Assigned'}</p>
          <p className="text-body-sm text-slate-500 font-medium mt-1">Expected Duration: {assignment.schedule?.expected_duration_minutes || 0} mins</p>
        </div>

        {/* Bus Details Card (Clean White Surface) */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 hover:border-slate-300 transition-all">
           <h3 className="text-label-md uppercase tracking-widest font-bold text-slate-400 mb-sm">Bus Details</h3>
           <div className="grid grid-cols-2 gap-sm">
              <div className="bg-slate-50 border border-slate-100 p-sm rounded-xl text-center shadow-xs">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Registration</p>
                 <p className="text-body-md font-bold text-slate-800">{assignment.bus?.registration_number || 'N/A'}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-sm rounded-xl text-center shadow-xs">
                 <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Capacity</p>
                 <p className="text-body-md font-bold text-slate-800">{assignment.bus?.capacity || '0'} Seats</p>
              </div>
           </div>
        </div>

        {/* Diagnostics Card (Clean White Surface) */}
        <div className="bg-white p-5 rounded-2xl shadow-xs border border-slate-200 hover:border-slate-300 transition-all">
           <h3 className="text-label-md uppercase tracking-widest font-bold text-slate-400 mb-sm">Diagnostics</h3>
           <div className="grid grid-cols-2 gap-3 text-body-sm">
              <div className="bg-slate-50 border border-slate-100 p-sm rounded-xl shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">GPS Speed</p>
                <p className="text-body-md font-bold font-mono text-primary">{speed.toFixed(1)} km/h</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-sm rounded-xl shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Accuracy</p>
                <p className="text-body-md font-bold font-mono text-primary">±{accuracy.toFixed(1)} m</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-sm rounded-xl shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Network</p>
                <p className="text-body-md font-bold text-slate-800">{isOnline ? 'Online' : 'Offline'}</p>
              </div>
              <div className="bg-slate-50 border border-slate-100 p-sm rounded-xl shadow-xs">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Tracking</p>
                <p className={`text-body-md font-bold ${isTracking ? 'text-emerald-600' : 'text-slate-400'}`}>
                  {isTracking ? 'ACTIVE' : 'IDLE'}
                </p>
              </div>
           </div>
        </div>

      </div>

      {/* Emergency Buttons - ALWAYS ACTIVE */}
      <div className="p-4 grid grid-cols-4 gap-2 bg-white border border-slate-200 rounded-2xl mt-md shadow-sm">
        <button onClick={() => reportEmergency('BREAKDOWN')} className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-rose-50/50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 transition-all rounded-xl shadow-xs active:scale-95">
           <span className="material-symbols-outlined mb-1 text-[22px]">build</span>
           <span className="text-[9px] font-bold uppercase tracking-wider">Breakdown</span>
        </button>
        <button onClick={() => reportEmergency('ACCIDENT')} className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-rose-50/50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 transition-all rounded-xl shadow-xs active:scale-95">
           <span className="material-symbols-outlined mb-1 text-[22px]">car_crash</span>
           <span className="text-[9px] font-bold uppercase tracking-wider">Accident</span>
        </button>
        <button onClick={() => reportEmergency('MEDICAL')} className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-rose-50/50 border border-slate-200 hover:border-rose-200 text-slate-600 hover:text-rose-700 transition-all rounded-xl shadow-xs active:scale-95">
           <span className="material-symbols-outlined mb-1 text-[22px]">medical_services</span>
           <span className="text-[9px] font-bold uppercase tracking-wider">Medical</span>
        </button>
        <button onClick={() => reportEmergency('TRAFFIC')} className="flex flex-col items-center justify-center p-2.5 bg-white hover:bg-amber-50/50 border border-slate-200 hover:border-amber-200 text-slate-600 hover:text-amber-800 transition-all rounded-xl shadow-xs active:scale-95">
           <span className="material-symbols-outlined mb-1 text-[22px]">traffic</span>
           <span className="text-[9px] font-bold uppercase tracking-wider">Traffic</span>
        </button>
      </div>

      {/* Occupancy Buttons - ALWAYS ACTIVE IF STARTED */}
      {isTracking && (
        <div className="mt-md flex gap-sm bg-white border border-slate-200 p-md rounded-2xl shadow-sm">
           <button onClick={() => updateOccupancy(-1)} className="flex-1 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl font-bold text-headline-md active:bg-slate-100 transition-all shadow-xs">- 1</button>
           <div className="flex flex-col justify-center items-center font-bold px-md text-slate-500">
             <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-0.5">Occupancy</span>
             <span className="material-symbols-outlined text-slate-400">groups</span>
           </div>
           <button onClick={() => updateOccupancy(1)} className="flex-1 py-3.5 bg-white hover:bg-slate-50 border border-slate-200 hover:border-slate-300 text-slate-800 rounded-xl font-bold text-headline-md active:bg-slate-100 transition-all shadow-xs">+ 1</button>
        </div>
      )}

      {/* Sticky Bottom Action Bar */}
      <div className="pt-md pb-xs bg-transparent">
        {routeStatus === 'NOT_STARTED' && (
          <button onClick={() => mutateState.mutate('startRoute')} disabled={mutateState.isPending || !busId}
            className="w-full py-4 bg-primary hover:bg-blue-700 text-white border border-blue-700 font-bold text-title-md rounded-2xl shadow-sm hover:-translate-y-[0.5px] transition-all active:scale-[0.98] disabled:opacity-50">
            START ROUTE
          </button>
        )}
        {routeStatus === 'IN_PROGRESS' && (
          <button onClick={() => mutateState.mutate('endRoute')} disabled={mutateState.isPending}
            className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white border border-rose-700 font-bold text-title-md rounded-2xl shadow-sm hover:-translate-y-[0.5px] transition-all active:scale-[0.98] disabled:opacity-50">
            END ROUTE
          </button>
        )}
        {routeStatus === 'COMPLETED' && (
          <div className="w-full py-4 bg-slate-50 text-slate-700 border border-slate-200 text-center font-bold text-title-md rounded-2xl shadow-xs">
            ROUTE COMPLETED
          </div>
        )}
      </div>
    </div>
  );
}
