import { useEffect, useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { BusLocation } from '../../types/api/bus';
import { RouteStop } from '../../types/api/route';
import { Wifi, WifiOff } from 'lucide-react';

import iconUrl from 'leaflet/dist/images/marker-icon.png';
import iconRetinaUrl from 'leaflet/dist/images/marker-icon-2x.png';
import shadowUrl from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl,
  iconRetinaUrl,
  shadowUrl,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  tooltipAnchor: [16, -28],
  shadowSize: [41, 41]
});
L.Marker.prototype.options.icon = DefaultIcon;

interface MapViewProps {
  busLocation?: BusLocation | null;
  stops?: RouteStop[];
  routePolyline?: [number, number][];
  center?: [number, number];
  zoom?: number;
  isConnected?: boolean;
}

export function MapView({ busLocation, stops = [], routePolyline = [], center = [21.1702, 72.8311], zoom = 13, isConnected = true }: MapViewProps) {
  const [timeAgo, setTimeAgo] = useState('Just now');

  useEffect(() => {
    if (!busLocation?.timestamp) return;
    const updateTime = () => {
      const ms = new Date().getTime() - new Date(busLocation.timestamp).getTime();
      const seconds = Math.floor(ms / 1000);
      if (seconds < 5) setTimeAgo('Just now');
      else if (seconds < 60) setTimeAgo(`${seconds} seconds ago`);
      else setTimeAgo(`${Math.floor(seconds / 60)} minutes ago`);
    };
    updateTime();
    const interval = setInterval(updateTime, 5000);
    return () => clearInterval(interval);
  }, [busLocation?.timestamp]);

  const mapCenter: [number, number] = busLocation 
    ? [busLocation.latitude, busLocation.longitude] 
    : center;

  const SURAT_BOUNDS: L.LatLngBoundsExpression = [
    [20.10, 72.50], // South-West (Covers Valsad/Vapi)
    [21.90, 74.00]  // North-East (Covers Bharuch/Tapi)
  ];

  return (
    <div className="h-full w-full rounded-2xl overflow-hidden border border-slate-200 dark:border-slate-800 shadow-inner z-0 relative">
      <div className="absolute top-4 right-4 z-[400] flex flex-col gap-2 items-end">
        <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-semibold shadow-md border ${
          isConnected ? 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-900/50 dark:text-emerald-400 dark:border-emerald-800' 
                      : 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-900/50 dark:text-rose-400 dark:border-rose-800'
        }`}>
          {isConnected ? <Wifi className="w-3.5 h-3.5" /> : <WifiOff className="w-3.5 h-3.5" />}
          {isConnected ? 'Live' : 'Tracking Unavailable'}
        </div>
        {busLocation && (
          <div className="px-3 py-1.5 bg-white/90 dark:bg-slate-900/90 backdrop-blur-sm border border-slate-200 dark:border-slate-800 rounded-full text-xs text-slate-600 dark:text-slate-400 shadow-sm">
            Last updated: {timeAgo}
          </div>
        )}
      </div>

      <MapContainer center={mapCenter} zoom={zoom} maxBounds={SURAT_BOUNDS} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; Google Maps'
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
        />
        
        {routePolyline.length > 0 && (
          <Polyline positions={routePolyline} pathOptions={{ color: '#4f46e5', weight: 4, opacity: 0.8 }} />
        )}

        {stops.map((stop) => (
          <Marker key={stop.id} position={[stop.latitude, stop.longitude]}>
            <Popup>
              <div className="font-semibold text-slate-800">{stop.name}</div>
              {stop.etaMinutes && <div className="text-sm text-slate-500">ETA: {stop.etaMinutes} mins</div>}
            </Popup>
          </Marker>
        ))}

        {busLocation && (
          <Marker position={[busLocation.latitude, busLocation.longitude]}>
            <Popup>
              <div className="font-semibold text-indigo-600">Bus is here</div>
              <div className="text-sm text-slate-500">Speed: {busLocation.speed} km/h</div>
            </Popup>
          </Marker>
        )}
      </MapContainer>
    </div>
  );
}
