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
      const busId = payload.bus_id || payload.busId;
      if (!busId) return;
      setFleetLocations(prev => ({
        ...prev,
        [busId]: {
          lat: payload.lat ?? payload.latitude,
          lng: payload.lng ?? payload.longitude,
          speed: payload.speed || 0,
          timestamp: payload.timestamp || new Date().toISOString()
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
    <div className="flex flex-col h-full space-y-3">
      {/* Header & Filters */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-3.5 md:p-4 rounded-2xl shadow-xs border border-slate-200 gap-3">
        <div>
          <h2 className="text-base md:text-title-lg font-bold text-slate-900 tracking-tight">Global Fleet Tracker</h2>
          <p className="text-xs text-slate-500 font-medium">Real-time overview of all active buses</p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-2.5 sm:items-center w-full sm:w-auto">
          <div className="relative w-full sm:w-auto">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
            <input 
              type="text" 
              placeholder="Filter by Bus #" 
              value={filterText}
              onChange={e => setFilterText(e.target.value)}
              className="w-full sm:w-48 pl-9 pr-3 py-1.5 text-xs md:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-400"
            />
          </div>
          <div className="flex items-center justify-between sm:justify-start gap-3 text-[11px] md:text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-3 py-1.5 rounded-xl">
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-emerald-500"></div> Active</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-amber-500"></div> Delayed</div>
            <div className="flex items-center gap-1.5"><div className="w-2.5 h-2.5 rounded-full bg-rose-500"></div> Offline</div>
          </div>
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 min-h-[380px] rounded-2xl overflow-hidden shadow-xs border border-slate-200 relative">
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
