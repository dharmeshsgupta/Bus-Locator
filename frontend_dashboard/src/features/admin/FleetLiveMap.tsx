import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import 'leaflet/dist/leaflet.css';
import { useQuery } from '@tanstack/react-query';
import { trackingApi } from '../../services/api/trackingApi';
import { adminApi } from '../../services/api/adminApi';
import { wsService } from '../../services/ws/websocketService';
import L from 'leaflet';
import toast from 'react-hot-toast';

// Fix for default Leaflet marker icons
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

// Helper for colored bus icons based on status
const getBusIcon = (color: string) => {
  return new L.Icon({
    iconUrl: `https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-${color}.png`,
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
  });
};

const ICONS = {
  active: getBusIcon('green'),
  delayed: getBusIcon('yellow'),
  offline: getBusIcon('red'),
  inactive: getBusIcon('grey'),
};

export function FleetLiveMap() {
  const [fleetLocations, setFleetLocations] = useState<Record<string, any>>({});
  const [filterText, setFilterText] = useState('');
  const [now, setNow] = useState(Date.now());

  // Force re-render every 10s to update "Offline" status colors based on timestamps
  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 10000);
    return () => clearInterval(interval);
  }, []);

  // Fetch initial fleet locations
  const { data: initialLocations, isLoading: locationsLoading } = useQuery({
    queryKey: ['fleetLocations'],
    queryFn: trackingApi.getFleetLocations,
  });

  // Fetch all buses for metadata (bus number, capacity, etc)
  const { data: busesData, isLoading: busesLoading } = useQuery({
    queryKey: ['adminBuses'],
    queryFn: () => adminApi.getBuses(),
  });

  useEffect(() => {
    if (initialLocations) {
      setFleetLocations(initialLocations);
    }
  }, [initialLocations]);

  // Connect to global fleet websocket
  useEffect(() => {
    wsService.connect('fleet');
    
    const handleLocationUpdate = (payload: any) => {
      setFleetLocations(prev => ({
        ...prev,
        [payload.bus_id]: {
          lat: payload.latitude,
          lng: payload.longitude,
          speed: payload.speed,
          timestamp: new Date().toISOString()
        }
      }));
    };

    const handleEmergency = (payload: any) => {
      toast.error(`EMERGENCY on Bus ${payload.bus_id}: ${payload.type}`, { duration: 10000, icon: '🚨' });
    };

    wsService.subscribe('LOCATION_UPDATE', handleLocationUpdate);
    wsService.subscribe('EMERGENCY', handleEmergency);
    
    return () => {
      wsService.unsubscribe('LOCATION_UPDATE', handleLocationUpdate);
      wsService.unsubscribe('EMERGENCY', handleEmergency);
      wsService.disconnect();
    };
  }, []);

  // Process data for map
  const buses = busesData?.items || [];
  
  const mapMarkers = useMemo(() => {
    return buses.map((bus: any) => {
      const loc = fleetLocations[bus.id];
      if (!loc) return null; // No location data for this bus

      // Calculate status based on last timestamp
      const lastUpdate = new Date(loc.timestamp).getTime();
      const diffSec = (now - lastUpdate) / 1000;
      
      let status = 'active';
      let icon = ICONS.active;
      
      if (diffSec > 120) {
        status = 'offline';
        icon = ICONS.offline;
      } else if (diffSec > 30) {
        status = 'delayed';
        icon = ICONS.delayed;
      }

      // Filter by text (bus number or registration)
      if (filterText && !bus.bus_number.toLowerCase().includes(filterText.toLowerCase()) && 
          !bus.registration_number.toLowerCase().includes(filterText.toLowerCase())) {
        return null;
      }

      return (
        <Marker key={bus.id} position={[loc.lat, loc.lng]} icon={icon}>
          <Popup>
            <div className="min-w-[150px]">
              <h3 className="font-bold text-title-md border-b pb-1 mb-1">Bus {bus.bus_number}</h3>
              <div className="text-body-sm space-y-1">
                <p><span className="font-semibold">Reg:</span> {bus.registration_number}</p>
                <p><span className="font-semibold">Speed:</span> {Math.round(loc.speed)} km/h</p>
                <p><span className="font-semibold">Status:</span> <span className={`uppercase font-bold ${status === 'active' ? 'text-green-600' : status === 'offline' ? 'text-red-600' : 'text-yellow-600'}`}>{status}</span></p>
                <p className="text-xs text-gray-500 mt-2">Last updated: {Math.round(diffSec)}s ago</p>
              </div>
            </div>
          </Popup>
        </Marker>
      );
    }).filter(Boolean);
  }, [buses, fleetLocations, now, filterText]);

  if (locationsLoading || busesLoading) {
    return <div className="flex h-full items-center justify-center">Loading Fleet Data...</div>;
  }

  const SURAT_BOUNDS: L.LatLngBoundsExpression = [
    [20.10, 72.50],
    [21.90, 74.00]
  ];

  const defaultCenter: [number, number] = [21.1702, 72.8311];

  return (
    <div className="flex flex-col h-full space-y-4">
      {/* Header & Filters */}
      <div className="flex justify-between items-center bg-surface-container-low p-4 rounded-xl shadow-sm border border-surface-container">
        <div>
          <h2 className="text-title-lg font-bold">Global Fleet Tracker</h2>
          <p className="text-body-sm text-on-surface-variant">Real-time overview of all active buses</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="relative">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant">search</span>
            <input 
              type="text" 
              placeholder="Filter by Bus #" 
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-outline-variant bg-surface focus:outline-primary"
            />
          </div>
          <div className="flex gap-2 text-label-sm font-medium">
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-green-500"></div> Active</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-yellow-500"></div> Delayed</div>
            <div className="flex items-center gap-1"><div className="w-3 h-3 rounded-full bg-red-500"></div> Offline</div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 rounded-xl overflow-hidden shadow-md border border-outline-variant relative">
        <MapContainer center={defaultCenter} zoom={13} maxBounds={SURAT_BOUNDS} maxBoundsViscosity={1.0} className="h-full w-full">
          <TileLayer
            attribution='&copy; Google Maps'
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          />
          <MarkerClusterGroup
            chunkedLoading
            maxClusterRadius={50}
          >
            {mapMarkers}
          </MarkerClusterGroup>
        </MapContainer>
      </div>
    </div>
  );
}
