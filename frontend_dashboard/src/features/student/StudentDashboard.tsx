import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { useTrackingStore } from '../../store/trackingStore';
import { wsService } from '../../services/ws/websocketService';
import { studentApi } from '../../services/api/studentApi';
import { trackingApi } from '../../services/api/trackingApi';
import toast from 'react-hot-toast';

export function StudentDashboard() {
  const navigate = useNavigate();
  const { 
    currentLocation, eta, occupancy, connectionStatus, routeProgress,
    currentStop, nextStop, setOccupancy, setEta, setCurrentStop, setNextStop
  } = useTrackingStore();

  const [isWaitingLoading, setIsWaitingLoading] = useState(false);

  // Fetch Assignment
  const { data: assignment, isLoading: assignmentLoading, error: assignmentError } = useQuery({
    queryKey: ['studentAssignment'],
    queryFn: studentApi.getAssignment,
    retry: 1
  });

  // Fetch initial bus status if assigned
  const { data: busData } = useQuery({
    queryKey: ['busStatus', assignment?.bus_id],
    queryFn: () => trackingApi.getBusStatus(assignment.bus_id),
    enabled: !!assignment?.bus_id,
  });

  useEffect(() => {
    if (busData) {
      if (busData.current_occupancy !== undefined) setOccupancy(busData.current_occupancy);
      if (busData.eta) setEta(busData.eta);
      if (busData.current_stop) setCurrentStop(busData.current_stop);
      if (busData.next_stop) setNextStop(busData.next_stop);
    }
  }, [busData, setOccupancy, setEta, setCurrentStop, setNextStop]);

  useEffect(() => {
    if (!assignment?.route_id) return;
    
    wsService.connect(assignment.route_id);
    
    return () => {
      wsService.disconnect();
    };
  }, [assignment?.route_id]);

  const handleImWaiting = async () => {
    if (!assignment) return;
    setIsWaitingLoading(true);
    try {
      await trackingApi.markWaiting({ 
        route_id: assignment.route_id, 
        stop_id: assignment.pickup_stop_id || 'unknown' 
      });
      toast.success("Driver notified you are waiting!");
    } catch (error) {
      toast.error("Failed to notify driver.");
    } finally {
      setIsWaitingLoading(false);
    }
  };

  if (assignmentLoading) {
    return <div className="flex h-full items-center justify-center"><p>Loading assignment...</p></div>;
  }

  if (assignmentError || !assignment) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-4 text-center">
        <span className="material-symbols-outlined text-[64px] text-outline">directions_bus</span>
        <h2 className="text-headline-md font-bold text-on-surface">No Route Assigned</h2>
        <p className="text-body-lg text-secondary max-w-md">
          You currently don't have an active bus route assignment. Please contact transport administration if you believe this is an error.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col md:flex-row gap-lg h-full">
      {/* Left Column — Primary Status */}
      <div className="flex-1 flex flex-col gap-md">
        {/* ETA Hero Card (Premium Dark Slate Card) */}
        <div className="bg-slate-900 text-white border border-slate-950 rounded-2xl p-lg flex flex-col justify-between overflow-hidden relative shadow-md hover:shadow-lg transition-all duration-300">
          
          <div className="flex justify-between items-start mb-md relative z-10">
            <div>
              <span className="text-[10px] font-extrabold uppercase tracking-widest bg-slate-800 text-slate-300 px-2.5 py-1 rounded-md border border-slate-700/60 shadow-sm">
                Next Shuttle
              </span>
              <h2 className="text-headline-md md:text-headline-lg font-bold text-white tracking-tight mt-sm">
                {assignment.route_name || 'Campus Express'}
              </h2>
              
              {/* Giant countdown timer */}
              <div className="flex items-baseline gap-xs mt-sm mb-xs">
                <span className="text-5xl md:text-7xl font-black text-blue-500 tracking-tighter leading-none animate-pulse-slow">
                  {eta ? eta.split(' ')[0] : 'Calculating'}
                </span>
                {eta && (
                  <span className="text-lg md:text-2xl font-bold text-blue-500/85 uppercase tracking-wide ml-1">
                    {eta.split(' ')[1] || 'mins'}
                  </span>
                )}
              </div>

              <p className="text-body-sm text-slate-300 font-medium flex items-center gap-xs">
                <span className="material-symbols-outlined text-[16px] text-slate-400">pin_drop</span>
                Pickup Stop: {assignment.pickup_stop_name || 'Library'}
              </p>
            </div>
            
            <div className="flex flex-col gap-sm items-end">
              <button 
                onClick={handleImWaiting}
                disabled={isWaitingLoading}
                className="bg-primary hover:bg-blue-700 text-white border border-blue-700 px-4 py-2.5 rounded-xl font-bold text-body-sm flex items-center gap-2 transition-all shadow-md active:scale-95 disabled:opacity-70 disabled:pointer-events-none hover:-translate-y-[0.5px]"
              >
                <span className="material-symbols-outlined text-[18px]">waving_hand</span>
                {isWaitingLoading ? 'Notifying...' : "I'm Waiting"}
              </button>

              <div className="text-[12px] text-slate-300 flex items-center gap-xs font-semibold bg-slate-800/85 border border-slate-700/40 rounded-lg px-2.5 py-1 shadow-xs backdrop-blur-xs">
                <span className="flex items-center gap-xs">
                  <span className="relative flex h-2 w-2">
                    <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${
                      connectionStatus === 'connected' ? 'bg-[#16a34a]' : connectionStatus === 'reconnecting' ? 'bg-[#d97706]' : 'bg-[#dc2626]'
                    }`}></span>
                    <span className={`relative inline-flex rounded-full h-2 w-2 ${
                      connectionStatus === 'connected' ? 'bg-[#15803d]' : connectionStatus === 'reconnecting' ? 'bg-[#d97706]' : 'bg-[#dc2626]'
                    }`}></span>
                  </span>
                  {connectionStatus === 'connected' ? 'GPS Live' : connectionStatus === 'reconnecting' ? 'Reconnecting' : 'Offline'}
                </span>
              </div>
            </div>
          </div>
 
          {/* Progress Bar (Sleek dark-slate track, solid blue progress) */}
          <div className="w-full bg-slate-800 rounded-full h-2.5 mt-md overflow-hidden relative z-10 border border-slate-700/30 p-[1px]">
            <div className="bg-primary h-full rounded-full transition-all duration-1000 relative" style={{ width: `${Math.max(5, routeProgress)}%` }}>
              <div className="absolute right-0 top-0 bottom-0 w-1.5 bg-white/40 rounded-full animate-pulse" />
            </div>
          </div>
          <div className="flex justify-between mt-2.5 text-label-md text-slate-400 relative z-10">
            <span className="font-semibold text-slate-300 flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px] text-slate-400">play_circle</span>
              {currentStop || 'Starting...'}
            </span>
            <span className="text-blue-400 font-bold flex items-center gap-xs">
              <span className="material-symbols-outlined text-[14px] filled text-blue-400">tour</span>
              {nextStop || 'En route'}
            </span>
          </div>
        </div>
 
        {/* Bento Grid Info Cards */}
        <div className="grid grid-cols-2 gap-md">
          {/* Route Card (Clean White Surface) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-md flex flex-col justify-center shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-[0.5px]">
            <div className="flex items-center justify-between mb-sm">
              <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100 shadow-xs">
                <span className="material-symbols-outlined">route</span>
              </div>
              <span className="text-[10px] uppercase tracking-widest font-extrabold text-slate-400">Route Details</span>
            </div>
            <div className="text-headline-md font-bold text-slate-900 tracking-tight">{assignment.route_name || 'Route'}</div>
            <div className="text-body-sm text-slate-600 mt-1.5 flex items-center gap-xs font-medium">
              <span className="material-symbols-outlined text-[16px] text-slate-400">local_shipping</span>
              Bus ID: {assignment.bus_number || 'TBD'}
            </div>
            <div className="text-body-sm text-slate-500 flex items-center gap-1 mt-1 font-medium">
              <span className="material-symbols-outlined text-[14px] text-slate-400">person</span>
              {assignment.driver_name || 'Driver TBD'}
            </div>
          </div>
          
          {/* Occupancy Card (Clean White Surface) */}
          <div className="bg-white border border-slate-200 rounded-2xl p-md flex flex-col justify-between shadow-xs hover:shadow-md hover:border-slate-300 transition-all duration-300 hover:-translate-y-[0.5px]">
            <div className="flex items-center justify-between mb-sm">
              <div className="w-10 h-10 rounded-lg bg-slate-50 text-slate-500 flex items-center justify-center border border-slate-100 shadow-xs">
                <span className="material-symbols-outlined">groups</span>
              </div>
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-widest">{occupancy} Seats Filled</span>
            </div>
            <div className="text-headline-md font-bold text-slate-900 tracking-tight">
              {occupancy < 20 ? 'Low Occupancy' : occupancy < 40 ? 'Moderate Capacity' : 'High Occupancy'}
            </div>
            <div className="w-full rounded-full h-1.5 mt-3 overflow-hidden bg-slate-100 border border-slate-200/50 p-[0.5px]">
              <div 
                className={`h-full rounded-full transition-all duration-500 ${
                  occupancy < 40 ? 'bg-success' : occupancy < 55 ? 'bg-warning' : 'bg-error'
                }`} 
                style={{ width: `${Math.min(100, (occupancy / 60) * 100)}%` }} 
              />
            </div>
          </div>
        </div>
 
        {/* Track My Bus Button */}
        <button 
          onClick={() => navigate('/student/map')}
          className="mt-auto bg-slate-900 hover:bg-slate-800 text-white border border-slate-950 h-11 px-5 rounded-xl font-bold text-body-sm flex items-center gap-sm transition-all shadow-sm active:scale-95 self-start hover:-translate-y-[0.5px]"
        >
          <span className="material-symbols-outlined text-[20px] text-slate-300">map</span>
          <span>Open Live Map</span>
        </button>
      </div>
 
      {/* Right Column — Updates Feed (Clean White Panel) */}
      <div className="w-full md:w-[360px] flex-shrink-0 flex flex-col">
        <div className="bg-white rounded-2xl shadow-xs border border-slate-200 h-full flex flex-col overflow-hidden">
          <div className="p-md border-b border-slate-200 flex justify-between items-center bg-slate-50/50">
            <h3 className="text-headline-md font-bold text-slate-900 flex items-center gap-xs tracking-tight">
              <span className="material-symbols-outlined text-[22px] text-slate-500">notifications</span>
              Live Updates
            </h3>
            <span className="text-[10px] bg-emerald-50 border border-emerald-200/50 text-emerald-700 px-2.5 py-0.5 rounded-full font-bold uppercase tracking-widest">Active</span>
          </div>
          <div className="flex-1 overflow-y-auto p-md space-y-md bg-transparent">
            {/* Alert 1 */}
            <div className="bg-white p-md rounded-xl border border-slate-100 shadow-xs hover:border-slate-200 hover:shadow-sm transition-all duration-200 hover:-translate-y-[0.5px]">
              <div className="flex justify-between items-start mb-xs">
                <span className="text-[9px] font-extrabold bg-rose-50 text-rose-700 px-2 py-0.5 rounded border border-rose-200/50 uppercase tracking-widest">Delay</span>
                <span className="text-[11px] text-slate-400 font-bold">10m ago</span>
              </div>
              <p className="text-body-sm font-bold text-slate-900 mb-1">Campus Express North Delay</p>
              <p className="text-[13px] text-slate-600 leading-relaxed">Running 5 minutes behind schedule due to heavy traffic near the University Gate.</p>
            </div>
 
            {/* Alert 2 */}
            <div className="bg-white p-md rounded-xl border border-slate-100 shadow-xs hover:border-slate-200 hover:shadow-sm transition-all duration-200 hover:-translate-y-[0.5px]">
              <div className="flex justify-between items-start mb-xs">
                <span className="text-[9px] font-extrabold bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200/50 uppercase tracking-widest">Dispatch</span>
                <span className="text-[11px] text-slate-400 font-bold">25m ago</span>
              </div>
              <p className="text-body-sm font-bold text-slate-900 mb-1">Bus BUS-402 Departed</p>
              <p className="text-[13px] text-slate-600 leading-relaxed">Your assigned bus has successfully departed from the Main Terminal and is en route.</p>
            </div>
 
            {/* Alert 3 */}
            <div className="bg-white p-md rounded-xl border border-slate-100 shadow-xs hover:border-slate-200 hover:shadow-sm transition-all duration-200 hover:-translate-y-[0.5px]">
              <div className="flex justify-between items-start mb-xs">
                <span className="text-[9px] font-extrabold bg-slate-50 text-slate-700 px-2 py-0.5 rounded border border-slate-200 uppercase tracking-widest">System</span>
                <span className="text-[11px] text-slate-400 font-bold">1h ago</span>
              </div>
              <p className="text-body-sm font-bold text-slate-900 mb-1">GPS Tracking Active</p>
              <p className="text-[13px] text-slate-600 leading-relaxed">Real-time tracking and occupancy metrics are fully functional for all campus routes today.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
