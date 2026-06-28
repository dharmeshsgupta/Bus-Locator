import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { useTrackingStore } from '../../store/trackingStore';
import { wsService } from '../../services/ws/websocketService';
import { studentApi } from '../../services/api/studentApi';
import L from 'leaflet';

// Fix for default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [40, 40],
  iconAnchor: [20, 20],
  className: 'transition-all duration-1000' // Smooth marker movement
});

export function LiveMap() {
  const { currentLocation, eta, occupancy, connectionStatus, currentStop, nextStop } = useTrackingStore();
  const [routePolyline, setRoutePolyline] = useState<[number, number][]>([]);
  const [stops, setStops] = useState<any[]>([]);

  // Fetch Assignment
  const { data: assignment, isLoading } = useQuery({
    queryKey: ['studentAssignment'],
    queryFn: studentApi.getAssignment,
  });

  // Fetch stops for the assigned route
  const { data: stopsData } = useQuery({
    queryKey: ['studentRouteStops', assignment?.route_id],
    queryFn: () => studentApi.getStopsByRoute(assignment.route_id),
    enabled: !!assignment?.route_id,
  });

  useEffect(() => {
    if (!assignment?.route_id) return;
    wsService.connect(assignment.route_id);
    
    return () => {
      wsService.disconnect();
    };
  }, [assignment?.route_id]);

  useEffect(() => {
    if (!stopsData?.items) return;
    const sortedStops = [...stopsData.items].sort((a: any, b: any) => a.sequence_number - b.sequence_number);
    setStops(sortedStops);
    
    const poly = sortedStops.map((s: any) => [s.latitude, s.longitude] as [number, number]);
    setRoutePolyline(poly);
  }, [stopsData]);

  if (isLoading) return <div className="flex justify-center items-center h-full">Loading Map...</div>;
  if (!assignment) return <div className="p-4 text-center">No assignment found. Cannot display map.</div>;

  const firstStop = stops[0];
  const position: [number, number] = currentLocation 
    ? [currentLocation.latitude, currentLocation.longitude] 
    : firstStop 
      ? [firstStop.latitude, firstStop.longitude] 
      : [21.1702, 72.8311]; // Default fallback to Surat center

  const SURAT_BOUNDS: L.LatLngBoundsExpression = [
    [20.10, 72.50], // South-West (Covers Valsad/Vapi)
    [21.90, 74.00]  // North-East (Covers Bharuch/Tapi)
  ];

  return (
    <div className="relative h-full w-full rounded-xl overflow-hidden shadow-md border border-outline-variant/30 flex flex-col">
      {/* Overlay Status Bar */}
      <div className="absolute top-4 left-4 right-4 z-[1000] flex justify-between items-start pointer-events-none">
        <div className="bg-surface/90 backdrop-blur-md rounded-lg shadow-lg p-3 border border-outline-variant/50 pointer-events-auto">
          <div className="flex items-center gap-2 mb-1">
            <span className={`w-3 h-3 rounded-full ${connectionStatus === 'connected' ? 'bg-success animate-pulse' : 'bg-error'}`} />
            <h3 className="font-bold text-on-surface">Bus {assignment.bus_number}</h3>
          </div>
          <p className="text-body-sm text-secondary">Route: {assignment.route_name}</p>
          <div className="flex gap-4 mt-2 text-label-md">
            <div><span className="text-primary font-bold">ETA:</span> {eta || '--'}</div>
            <div><span className="text-primary font-bold">Seats:</span> {occupancy || '--'}</div>
          </div>
        </div>

        <div className="bg-surface/90 backdrop-blur-md rounded-lg shadow-lg p-3 border border-outline-variant/50 pointer-events-auto text-right">
          <p className="text-label-md text-secondary">Current: <span className="font-bold text-on-surface">{currentStop || '--'}</span></p>
          <p className="text-label-md text-secondary mt-1">Next: <span className="font-bold text-primary">{nextStop || '--'}</span></p>
        </div>
      </div>

      <MapContainer center={position} zoom={15} maxBounds={SURAT_BOUNDS} maxBoundsViscosity={1.0} className="flex-1 w-full z-0" zoomControl={false}>
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />
        
        {routePolyline.length > 0 && (
          <Polyline positions={routePolyline} color="#4F46E5" weight={5} opacity={0.7} />
        )}

        {stops.map((stop) => (
          <Marker key={stop.id} position={[stop.latitude, stop.longitude]}>
            <Popup>
              <strong>{stop.stop_name}</strong><br/>
              Stop #{stop.sequence_number}
            </Popup>
          </Marker>
        ))}

        {currentLocation && (
          <Marker position={position} icon={busIcon}>
            <Popup>
              <strong>Bus {assignment.bus_number}</strong><br/>
              Speed: {currentLocation.speed} mph
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
