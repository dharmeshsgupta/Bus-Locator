import { useQuery } from '@tanstack/react-query';
import { useTrackingStore } from '../../store/trackingStore';
import { transportClient } from '../../services/api/axios';

export function RouteTimeline({ routeId }: { routeId: string }) {
  const { currentStop, nextStop } = useTrackingStore();

  const { data: route, isLoading } = useQuery({
    queryKey: ['routeDetails', routeId],
    queryFn: async () => {
      const res = await transportClient.get(`/api/v1/routes/${routeId}`);
      return res.data;
    },
    enabled: !!routeId
  });

  if (isLoading) return <div className="p-4 text-secondary text-sm">Loading route progress...</div>;
  if (!route || !route.stops) return <div className="p-4 text-secondary text-sm">Route details unavailable.</div>;

  const stops = route.stops; // Array of stop objects
  
  // Find index of current stop to determine completed/upcoming
  let currentIndex = stops.findIndex((s: any) => s.name === currentStop);
  if (currentIndex === -1) {
    // Fallback if currentStop is not exactly matching
    currentIndex = stops.findIndex((s: any) => s.name === nextStop) - 1;
  }
  if (currentIndex === -2) currentIndex = 0; // Default if nothing matches

  return (
    <div className="flex flex-col gap-0 relative pl-4 mt-4 border-l-2 border-surface-container-high ml-4">
      {stops.map((stop: any, index: number) => {
        const isCompleted = index < currentIndex;
        const isCurrent = index === currentIndex;
        const isUpcoming = index > currentIndex;

        return (
          <div key={stop.id} className="relative pb-6 pl-4">
            {/* Status Dot */}
            <div 
              className={`absolute -left-[23px] w-4 h-4 rounded-full border-2 bg-surface
                ${isCompleted ? 'border-primary bg-primary' : ''}
                ${isCurrent ? 'border-primary ring-4 ring-primary/20 bg-surface' : ''}
                ${isUpcoming ? 'border-outline-variant' : ''}
              `} 
            />
            {/* Connecting Line overrides */}
            {isCompleted && index < stops.length - 1 && (
              <div className="absolute -left-[17px] top-4 w-[2px] h-full bg-primary" />
            )}

            <div className="flex flex-col -mt-1">
              <span className={`text-label-lg font-medium 
                ${isCompleted ? 'text-secondary line-through opacity-70' : ''}
                ${isCurrent ? 'text-primary font-bold' : ''}
                ${isUpcoming ? 'text-on-surface' : ''}
              `}>
                {stop.name}
              </span>
              {isCurrent && <span className="text-body-sm text-primary">Bus is currently here</span>}
              {isUpcoming && stop.name === nextStop && <span className="text-body-sm text-secondary">Next stop</span>}
            </div>
          </div>
        );
      })}
    </div>
  );
}
