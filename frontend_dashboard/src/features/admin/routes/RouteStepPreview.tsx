import React, { useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Polyline, Circle } from 'react-leaflet';
import { RouteStop } from './hooks/useRouteWizard';
import { AlertTriangle, MapPin, Navigation, Clock } from 'lucide-react';

// Haversine distance in meters
function getDistance(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3;
  const p1 = lat1 * Math.PI/180;
  const p2 = lat2 * Math.PI/180;
  const dp = (lat2-lat1) * Math.PI/180;
  const dl = (lon2-lon1) * Math.PI/180;
  const a = Math.sin(dp/2) * Math.sin(dp/2) + Math.cos(p1) * Math.cos(p2) * Math.sin(dl/2) * Math.sin(dl/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

export function RouteStepPreview({ routeInfo, stops }: { routeInfo: any, stops: RouteStop[] }) {
  const warnings = useMemo(() => {
    const w: string[] = [];
    const names = new Set();
    
    stops.forEach((stop, idx) => {
      // Check duplicates
      if (names.has(stop.stop_name)) {
        w.push(`Duplicate stop name: "${stop.stop_name}"`);
      }
      names.add(stop.stop_name);
      
      // Check distance and geofence overlap
      if (idx > 0) {
        const prev = stops[idx - 1];
        const dist = getDistance(prev.latitude, prev.longitude, stop.latitude, stop.longitude);
        const overlapThreshold = prev.geofence_radius_meters + stop.geofence_radius_meters;
        
        if (dist < overlapThreshold) {
          w.push(`Geofence overlap: "${prev.stop_name}" and "${stop.stop_name}" are ${Math.round(dist)}m apart but combined radii are ${overlapThreshold}m.`);
        } else if (dist < 30) {
          w.push(`Stops "${prev.stop_name}" and "${stop.stop_name}" are very close (${Math.round(dist)}m apart)`);
        }
      }
    });
    
    if (stops.length < 2) w.push("Route must have at least 2 stops.");
    return w;
  }, [stops]);

  const totalDistance = useMemo(() => {
    let d = 0;
    for (let i = 1; i < stops.length; i++) {
      d += getDistance(stops[i-1].latitude, stops[i-1].longitude, stops[i].latitude, stops[i].longitude);
    }
    return (d / 1000).toFixed(2);
  }, [stops]);

  const positions: [number, number][] = stops.map(s => [s.latitude, s.longitude]);
  const center = positions.length > 0 ? positions[0] : [21.1702, 72.8311] as [number, number];

  const SURAT_BOUNDS: L.LatLngBoundsExpression = [
    [20.10, 72.50], // South-West (Covers Valsad/Vapi)
    [21.90, 74.00]  // North-East (Covers Bharuch/Tapi)
  ];

  return (
    <div className="space-y-6">
      {warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <div className="flex items-center text-amber-800 font-medium mb-2">
            <AlertTriangle className="w-5 h-5 mr-2" />
            Validation Warnings
          </div>
          <ul className="list-disc pl-5 text-amber-700 text-sm space-y-1">
            {warnings.map((w, i) => <li key={i}>{w}</li>)}
          </ul>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <MapPin className="w-6 h-6 text-indigo-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{stops.length}</div>
          <div className="text-sm text-slate-500">Total Stops</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <Navigation className="w-6 h-6 text-green-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{totalDistance} km</div>
          <div className="text-sm text-slate-500">Est. Distance</div>
        </div>
        <div className="bg-slate-50 dark:bg-slate-800/50 p-4 rounded-xl border border-slate-200 dark:border-slate-700 text-center">
          <Clock className="w-6 h-6 text-blue-500 mx-auto mb-2" />
          <div className="text-2xl font-bold text-slate-900 dark:text-white">{routeInfo.expected_duration_mins} min</div>
          <div className="text-sm text-slate-500">Expected Duration</div>
        </div>
      </div>

      <div className="h-[300px] rounded-xl overflow-hidden border border-slate-300 dark:border-slate-700">
        <MapContainer center={center} zoom={13} maxBounds={SURAT_BOUNDS} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%' }}>
          <TileLayer 
            url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}" 
            attribution="&copy; Google Maps"
          />
          {stops.map(s => (
            <React.Fragment key={s.id}>
              <Marker position={[s.latitude, s.longitude]} />
              <Circle 
                center={[s.latitude, s.longitude]} 
                radius={s.geofence_radius_meters}
                pathOptions={{ color: 'indigo', fillColor: 'indigo', fillOpacity: 0.2, weight: 1 }}
              />
            </React.Fragment>
          ))}
          {positions.length > 1 && <Polyline positions={positions} color="indigo" weight={4} />}
        </MapContainer>
      </div>
    </div>
  );
}
