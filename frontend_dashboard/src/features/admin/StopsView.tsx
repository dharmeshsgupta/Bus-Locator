import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api/adminApi';
import { MapPin, Plus, Trash2, X, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, useMapEvents, CircleMarker, Tooltip } from 'react-leaflet';
import L from 'leaflet';

// Fix leaflet default icon paths
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

function LocationPicker({ position, setPosition, existingStops }: { position: [number, number]; setPosition: (p: [number, number]) => void; existingStops?: any[] }) {
  const MapEvents = () => {
    useMapEvents({
      click(e) {
        setPosition([e.latlng.lat, e.latlng.lng]);
      },
    });
    return null;
  };

  return (
    <div className="h-48 w-full rounded-xl overflow-hidden border border-slate-200 dark:border-slate-700 relative" style={{ zIndex: 1 }}>
      <MapContainer center={position} zoom={15} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
          attribution="&copy; Google Maps"
          maxZoom={20}
        />
        {existingStops?.map((s) => (
          <CircleMarker 
            key={s.id} 
            center={[s.latitude, s.longitude]} 
            radius={6} 
            pathOptions={{ color: '#4f46e5', fillColor: '#4f46e5', fillOpacity: 0.5 }}
          >
            <Tooltip permanent direction="top" offset={[0, -5]}>{s.stop_name}</Tooltip>
          </CircleMarker>
        ))}
        <Marker position={position} />
        <MapEvents />
      </MapContainer>
    </div>
  );
}

function CreateStopModal({ onClose, routeId, routeName, existingStops }: { onClose: () => void; routeId: string; routeName: string; existingStops: any[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ stop_name: '', latitude: '', longitude: '', sequence_number: '', estimated_arrival_time: '', geofence_radius_meters: '50' });

  const mutation = useMutation({
    mutationFn: (data: any) => adminApi.createStop(data),
    onSuccess: () => { toast.success('Stop created!'); queryClient.invalidateQueries({ queryKey: ['admin-stops'] }); onClose(); },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to create stop'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      route_id: routeId,
      stop_name: form.stop_name,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      sequence_number: parseInt(form.sequence_number),
      estimated_arrival_time: form.estimated_arrival_time || null,
      geofence_radius_meters: parseInt(form.geofence_radius_meters) || 50,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add Stop</h2>
            <p className="text-sm text-slate-500 mt-1">For route: {routeName}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Stop Name *</label>
            <input required value={form.stop_name} onChange={e => setForm({...form, stop_name: e.target.value})}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white" placeholder="e.g. Main Gate" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Choose on Map</label>
            <LocationPicker 
              position={[parseFloat(form.latitude) || 21.1702, parseFloat(form.longitude) || 72.8311]} 
              setPosition={([lat, lng]) => setForm({...form, latitude: lat.toFixed(6), longitude: lng.toFixed(6)})} 
              existingStops={existingStops}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Latitude *</label>
              <input required type="number" step="any" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white" placeholder="21.1702" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Longitude *</label>
              <input required type="number" step="any" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white" placeholder="72.8311" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Sequence # *</label>
              <input required type="number" min="1" value={form.sequence_number} onChange={e => setForm({...form, sequence_number: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white" placeholder="1" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Geofence (m)</label>
              <input type="number" value={form.geofence_radius_meters} onChange={e => setForm({...form, geofence_radius_meters: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white" placeholder="50" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Estimated Arrival Time</label>
            <input type="time" value={form.estimated_arrival_time} onChange={e => setForm({...form, estimated_arrival_time: e.target.value})}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white" />
          </div>
          <div className="flex items-center gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-70 transition-all shadow-md">
              {mutation.isPending ? 'Creating...' : 'Create Stop'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStopModal({ onClose, stop, existingStops }: { onClose: () => void; stop: any; existingStops: any[] }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ 
    stop_name: '', latitude: '', longitude: '', sequence_number: '', estimated_arrival_time: '', geofence_radius_meters: '50' 
  });

  useEffect(() => {
    if (stop) {
      setForm({
        stop_name: stop.stop_name || '',
        latitude: stop.latitude?.toString() || '',
        longitude: stop.longitude?.toString() || '',
        sequence_number: stop.sequence_number?.toString() || '',
        estimated_arrival_time: stop.estimated_arrival_time || '',
        geofence_radius_meters: stop.geofence_radius_meters?.toString() || '50'
      });
    }
  }, [stop]);

  const mutation = useMutation({
    mutationFn: (data: any) => adminApi.updateStop(stop.id, data),
    onSuccess: () => { toast.success('Stop updated!'); queryClient.invalidateQueries({ queryKey: ['admin-stops'] }); onClose(); },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to update stop'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      stop_name: form.stop_name,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      sequence_number: parseInt(form.sequence_number),
      estimated_arrival_time: form.estimated_arrival_time || null,
      geofence_radius_meters: parseInt(form.geofence_radius_meters) || 50,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Stop</h2>
            <p className="text-sm text-slate-500 mt-1">Update details for stop #{stop.sequence_number}</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors"><X className="w-5 h-5 text-slate-500" /></button>
        </div>
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Stop Name *</label>
            <input required value={form.stop_name} onChange={e => setForm({...form, stop_name: e.target.value})}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white" />
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Choose on Map</label>
            <LocationPicker 
              position={[parseFloat(form.latitude) || 21.1702, parseFloat(form.longitude) || 72.8311]} 
              setPosition={([lat, lng]) => setForm({...form, latitude: lat.toFixed(6), longitude: lng.toFixed(6)})} 
              existingStops={existingStops}
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Latitude *</label>
              <input required type="number" step="any" value={form.latitude} onChange={e => setForm({...form, latitude: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Longitude *</label>
              <input required type="number" step="any" value={form.longitude} onChange={e => setForm({...form, longitude: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Sequence # *</label>
              <input required type="number" min="1" value={form.sequence_number} onChange={e => setForm({...form, sequence_number: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white" />
            </div>
            <div className="space-y-1.5">
              <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Geofence (m)</label>
              <input type="number" value={form.geofence_radius_meters} onChange={e => setForm({...form, geofence_radius_meters: e.target.value})}
                className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Estimated Arrival Time</label>
            <input type="time" value={form.estimated_arrival_time} onChange={e => setForm({...form, estimated_arrival_time: e.target.value})}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none dark:text-white" />
          </div>
          <div className="flex items-center gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-70 transition-all shadow-md">
              {mutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function StopsView() {
  const [selectedRouteId, setSelectedRouteId] = useState('');
  const [selectedRouteName, setSelectedRouteName] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [editingStop, setEditingStop] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: routesData } = useQuery({
    queryKey: ['admin-routes-for-stops'],
    queryFn: () => adminApi.getRoutes({ page: 1, page_size: 100 }),
  });

  const { data: stopsData, isLoading, isError } = useQuery({
    queryKey: ['admin-stops', selectedRouteId],
    queryFn: () => adminApi.getStopsByRoute(selectedRouteId, { page: 1, page_size: 100 }),
    enabled: !!selectedRouteId,
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteStop(id),
    onSuccess: () => { toast.success('Stop deleted'); queryClient.invalidateQueries({ queryKey: ['admin-stops'] }); },
    onError: () => toast.error('Failed to delete stop'),
  });

  const items = stopsData?.items || [];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <MapPin className="w-6 h-6 mr-2 text-indigo-500" /> Stops
          </h1>
          <p className="text-slate-500">Manage stops for each route</p>
        </div>
        <button onClick={() => setShowCreate(true)} disabled={!selectedRouteId}
          className="flex items-center px-5 py-2.5 bg-indigo-600 text-white font-medium rounded-xl hover:bg-indigo-700 transition shadow-sm disabled:opacity-50 disabled:cursor-not-allowed">
          <Plus className="w-5 h-5 mr-2" /> Add Stop
        </button>
      </div>

      {/* Route Selector */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 p-5">
        <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300 mb-2">Select Route to manage stops:</label>
        <select value={selectedRouteId} onChange={e => {
          setSelectedRouteId(e.target.value);
          const route = routesData?.items?.find((r: any) => r.id === e.target.value);
          setSelectedRouteName(route?.route_name || '');
        }}
          className="w-full max-w-md px-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:text-white cursor-pointer transition-colors hover:border-slate-300 dark:hover:border-slate-600">
          <option value="">— Select a Route —</option>
          {routesData?.items?.map((r: any) => <option key={r.id} value={r.id}>{r.route_name} ({r.route_code})</option>)}
        </select>
      </div>

      {/* Stops Table */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {!selectedRouteId ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <MapPin className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">Select a Route</h3>
              <p className="text-slate-500 mt-2">Choose a route from the dropdown above to view and manage its stops.</p>
            </div>
          ) : isLoading ? (
            <div className="p-12 text-center text-slate-500">Loading stops...</div>
          ) : isError ? (
            <div className="p-12 text-center text-red-500">Failed to load stops.</div>
          ) : items.length === 0 ? (
            <div className="p-12 text-center flex flex-col items-center justify-center h-full">
              <MapPin className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300">No stops created yet</h3>
              <p className="text-slate-500 mt-2">Click the "Add Stop" button to start creating a route schedule.</p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="px-6 py-4 font-semibold">#</th>
                  <th className="px-6 py-4 font-semibold">Stop Name</th>
                  <th className="px-6 py-4 font-semibold">Lat / Lng</th>
                  <th className="px-6 py-4 font-semibold">ETA</th>
                  <th className="px-6 py-4 font-semibold text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                {items.sort((a: any, b: any) => a.sequence_number - b.sequence_number).map((stop: any) => (
                  <tr key={stop.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/30 transition-colors">
                    <td className="px-6 py-4">
                      <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-indigo-100 text-indigo-700 font-bold text-xs">
                        {stop.sequence_number}
                      </span>
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-900 dark:text-white">{stop.stop_name}</td>
                    <td className="px-6 py-4 text-slate-500 text-xs font-mono bg-slate-50 dark:bg-slate-800/50 rounded inline-block mt-2">{stop.latitude?.toFixed(4)}, {stop.longitude?.toFixed(4)}</td>
                    <td className="px-6 py-4 text-slate-500">{stop.estimated_arrival_time || '—'}</td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingStop(stop)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors" title="Edit Stop">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if(confirm(`Are you sure you want to delete "${stop.stop_name}"?`)) deleteMutation.mutate(stop.id) }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors" title="Delete Stop">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showCreate && selectedRouteId && <CreateStopModal onClose={() => setShowCreate(false)} routeId={selectedRouteId} routeName={selectedRouteName} existingStops={items} />}
      {editingStop && <EditStopModal onClose={() => setEditingStop(null)} stop={editingStop} existingStops={items.filter((s: any) => s.id !== editingStop.id)} />}
    </div>
  );
}
