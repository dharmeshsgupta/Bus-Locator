import { useEffect, useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
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

function MapController({ center }: { center: [number, number] }) {
  const map = useMap();
  useEffect(() => {
    map.flyTo(center, 15, { duration: 1.2 });
  }, [center, map]);
  return null;
}

export function FleetLiveMap() {
  const [fleetLocations, setFleetLocations] = useState<Record<string, any>>({});
  const [filterText, setFilterText] = useState('');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([21.1702, 72.8311]);
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

  const matchingBuses = useMemo(() => {
    if (!filterText.trim()) return [];
    return buses.filter((bus: any) => 
      bus.bus_number?.toLowerCase().includes(filterText.toLowerCase()) ||
      bus.registration_number?.toLowerCase().includes(filterText.toLowerCase())
    );
  }, [buses, filterText]);

  const handleSelectBus = (bus: any) => {
    setFilterText(bus.bus_number);
    setShowSuggestions(false);
    const loc = fleetLocations[bus.id];
    if (loc && loc.lat && loc.lng) {
      setMapCenter([loc.lat, loc.lng]);
      toast.success(`Centered map on Bus ${bus.bus_number}`, { icon: '🚌' });
    } else {
      toast.error(`Bus ${bus.bus_number} has no active GPS signal yet`);
    }
  };
  
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

  return (
    <div className="flex flex-col h-full space-y-3">
      {/* Header & Filters */}
      <div className="bg-white p-3.5 md:p-4 rounded-2xl shadow-xs border border-slate-200 flex flex-col gap-3">
        <div className="flex justify-between items-center w-full">
          <div>
            <h2 className="text-base md:text-title-lg font-bold text-slate-900 tracking-tight whitespace-nowrap">Global Fleet Tracker</h2>
            <p className="text-[11px] md:text-body-sm text-slate-500 font-medium">Real-time overview of active buses</p>
          </div>

          <div className="flex items-center gap-2 text-[10px] md:text-xs font-semibold text-slate-600 bg-slate-50 border border-slate-200 px-2.5 py-1 rounded-xl">
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-emerald-500"></div> Active</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-amber-500"></div> Delayed</div>
            <div className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-rose-500"></div> Offline</div>
          </div>
        </div>

        {/* Search input with live suggestion dropdown */}
        <div className="relative w-full">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-[18px]">search</span>
          <input 
            type="text" 
            placeholder="Search bus # or reg (e.g. Bus-004)..." 
            value={filterText}
            onChange={e => {
              setFilterText(e.target.value);
              setShowSuggestions(true);
            }}
            onFocus={() => setShowSuggestions(true)}
            className="w-full pl-9 pr-8 py-2 text-xs md:text-sm rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:border-blue-600 outline-none transition-all placeholder:text-slate-400 font-medium"
          />
          {filterText && (
            <button 
              onClick={() => { setFilterText(''); setShowSuggestions(false); }}
              className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-[16px] material-symbols-outlined"
            >
              close
            </button>
          )}

          {/* Autocomplete Dropdown List */}
          {showSuggestions && filterText.trim().length > 0 && matchingBuses.length > 0 && (
            <div className="absolute top-full left-0 right-0 mt-1 bg-white border border-slate-200 rounded-xl shadow-lg z-[2000] overflow-hidden max-h-56 overflow-y-auto">
              {matchingBuses.map((bus: any) => {
                const loc = fleetLocations[bus.id];
                return (
                  <div
                    key={bus.id}
                    onClick={() => handleSelectBus(bus)}
                    className="p-2.5 border-b border-slate-100 last:border-0 hover:bg-blue-50/60 cursor-pointer flex items-center justify-between transition-colors"
                  >
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-100 flex items-center justify-center text-blue-600">
                        <span className="material-symbols-outlined text-[18px]">directions_bus</span>
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-900">Bus {bus.bus_number}</p>
                        <p className="text-[10px] text-slate-500 font-medium">Reg: {bus.registration_number}</p>
                      </div>
                    </div>
                    <span className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full ${
                      loc ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-500'
                    }`}>
                      {loc ? 'LIVE' : 'NO SIGNAL'}
                    </span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Map */}
      <div className="flex-1 min-h-[380px] rounded-2xl overflow-hidden shadow-xs border border-slate-200 relative">
        <MapContainer center={mapCenter} zoom={13} maxBounds={SURAT_BOUNDS} maxBoundsViscosity={1.0} className="h-full w-full">
          <MapController center={mapCenter} />
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
