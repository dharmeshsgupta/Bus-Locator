import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { driverApi } from '../../services/api/driverApi';
import { useTrackingStore } from '../../store/trackingStore';
import toast from 'react-hot-toast';

export function DriverOccupancy() {
  const { occupancy, setOccupancy } = useTrackingStore();
  const [localOccupancy, setLocalOccupancy] = useState(occupancy);

  // Fetch Assignment to get bus ID
  const { data: assignment, isLoading } = useQuery({
    queryKey: ['driverAssignmentOccupancy'],
    queryFn: driverApi.getMyAssignment,
  });

  useEffect(() => {
    setLocalOccupancy(occupancy);
  }, [occupancy]);

  const updateOccupancy = async (change: number) => {
    if (!assignment?.bus?.id || !assignment?.route?.id) {
      toast.error('No active route assignment found.');
      return;
    }

    const newOccupancy = Math.max(0, localOccupancy + change);
    if (newOccupancy > (assignment.bus.capacity || 50)) {
        toast.error('Bus is at maximum capacity!');
        return;
    }
    
    // Optimistic update
    setLocalOccupancy(newOccupancy);

    try {
      await driverApi.updateOccupancy({
        bus_id: assignment.bus.id,
        route_id: assignment.route.id,
        occupancy_change: change
      });
      // The websocket will broadcast the exact occupancy back, which will update the store.
      // But we optimistically updated localOccupancy anyway.
      toast.success(change > 0 ? 'Passenger added' : 'Passenger removed', { id: 'occupancy', duration: 1000 });
    } catch (error) {
      console.error('Failed to update occupancy', error);
      toast.error('Failed to update occupancy');
      // Revert optimistic update
      setLocalOccupancy(occupancy);
    }
  };

  if (isLoading) {
    return <div className="flex justify-center items-center h-full">Loading...</div>;
  }

  if (!assignment?.bus) {
    return <div className="p-4 text-center">No assignment found.</div>;
  }

  const capacity = assignment.bus.capacity || 50;
  const isFull = localOccupancy >= capacity;
  const isEmpty = localOccupancy <= 0;

  return (
    <div className="flex flex-col h-full bg-surface-container-lowest p-6 rounded-3xl shadow-sm">
      <div className="text-center mb-8">
        <h2 className="text-display-sm font-bold text-on-surface">Passenger Count</h2>
        <p className="text-body-lg text-on-surface-variant mt-2">Manage bus occupancy in real-time</p>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center space-y-12">
        
        {/* Occupancy Display */}
        <div className="relative">
          <svg className="w-64 h-64 transform -rotate-90">
            <circle
              className="text-outline-variant"
              strokeWidth="12"
              stroke="currentColor"
              fill="transparent"
              r="120"
              cx="128"
              cy="128"
            />
            <circle
              className={`transition-all duration-500 ease-in-out ${isFull ? 'text-error' : 'text-primary'}`}
              strokeWidth="12"
              strokeDasharray={120 * 2 * Math.PI}
              strokeDashoffset={120 * 2 * Math.PI - (localOccupancy / capacity) * 120 * 2 * Math.PI}
              strokeLinecap="round"
              stroke="currentColor"
              fill="transparent"
              r="120"
              cx="128"
              cy="128"
            />
          </svg>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-center">
            <span className="text-display-lg font-black text-on-surface">{localOccupancy}</span>
            <span className="block text-title-md text-on-surface-variant font-medium mt-1">/ {capacity}</span>
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-12">
          <button
            onClick={() => updateOccupancy(-1)}
            disabled={isEmpty}
            className={`w-24 h-24 rounded-full flex items-center justify-center text-4xl shadow-lg transition-transform active:scale-95 ${
              isEmpty 
                ? 'bg-surface-container-high text-on-surface-variant opacity-50 cursor-not-allowed'
                : 'bg-error-container text-on-error-container hover:bg-error/20'
            }`}
            aria-label="Remove passenger"
          >
            <span className="material-symbols-outlined !text-5xl">remove</span>
          </button>

          <button
            onClick={() => updateOccupancy(1)}
            disabled={isFull}
            className={`w-32 h-32 rounded-full flex items-center justify-center text-5xl shadow-xl transition-transform active:scale-95 ${
              isFull
                ? 'bg-surface-container-high text-on-surface-variant opacity-50 cursor-not-allowed'
                : 'bg-primary text-on-primary hover:bg-primary/90'
            }`}
            aria-label="Add passenger"
          >
            <span className="material-symbols-outlined !text-7xl">add</span>
          </button>
        </div>
      </div>
      
      <div className="mt-8 text-center text-label-md text-secondary">
        Bus: {assignment.bus.bus_number} &bull; Route: {assignment.route?.route_name}
      </div>
    </div>
  );
}
