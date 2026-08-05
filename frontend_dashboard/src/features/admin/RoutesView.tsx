import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api/adminApi';
import { Route, Plus, ChevronLeft, ChevronRight, Trash2, X, Edit3, Eye, Gauge, Users, Clock, Bus } from 'lucide-react';
import toast from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup, Polyline } from 'react-leaflet';
import { wsService } from '../../services/ws/websocketService';
import { useTrackingStore } from '../../store/trackingStore';
import L from 'leaflet';

import { RouteWizardModal } from './routes/RouteWizardModal';

const busIcon = new L.Icon({
  iconUrl: 'https://cdn-icons-png.flaticon.com/512/3448/3448339.png',
  iconSize: [36, 36],
  iconAnchor: [18, 18],
});

function LiveRouteModal({ route, onClose }: { route: any; onClose: () => void }) {
  const { currentLocation, eta, occupancy } = useTrackingStore();

  // Fetch stops for this specific route
  const { data: stopsData } = useQuery({
    queryKey: ['adminRouteStops', route.id],
    queryFn: () => adminApi.getStopsByRoute(route.id),
  });

  useEffect(() => {
    if (!route?.id) return;
    wsService.connect(route.id);
    return () => {
      wsService.disconnect();
    };
  }, [route?.id]);

  const stops = stopsData?.items || stopsData || route?.stops || [];
  const sortedStops = [...stops].sort((a: any, b: any) => (a.sequence_number || 0) - (b.sequence_number || 0));
  const polyline: [number, number][] = sortedStops.map((s: any) => [s.latitude, s.longitude]);
  
  const defaultCenter: [number, number] = currentLocation 
    ? [(currentLocation as any).lat ?? currentLocation.latitude, (currentLocation as any).lng ?? currentLocation.longitude]
    : polyline.length > 0 ? polyline[0] : [21.1702, 72.8311];

  const SURAT_BOUNDS: L.LatLngBoundsExpression = [
    [20.10, 72.50],
    [21.90, 74.00]
  ];

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-xs p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[800px] h-[85vh] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800" onClick={e => e.stopPropagation()}>
        {/* Header */}
        <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-800/50">
          <div>
            <h2 className="text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Bus className="w-5 h-5 text-blue-600" />
              Live Route: {route.route_name} ({route.route_code})
            </h2>
            <p className="text-xs text-slate-500">{route.start_location} → {route.end_location}</p>
          </div>
          <button onClick={onClose} className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-200/50 rounded-xl transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Metrics Bar */}
        <div className="grid grid-cols-3 gap-2 p-3 bg-slate-100/60 dark:bg-slate-800/20 border-b border-slate-200 dark:border-slate-800 text-xs">
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <Gauge className="w-4 h-4 text-blue-500" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">GPS Speed</span>
              <span className="font-bold text-slate-900 dark:text-white">{currentLocation?.speed ? `${Math.round(currentLocation.speed)} km/h` : '0 km/h'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <Clock className="w-4 h-4 text-indigo-500" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">ETA</span>
              <span className="font-bold text-slate-900 dark:text-white">{eta ? eta : 'En Route'}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-white dark:bg-slate-800 p-2.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-xs">
            <Users className="w-4 h-4 text-emerald-500" />
            <div>
              <span className="text-[10px] text-slate-400 font-bold uppercase block">Occupancy</span>
              <span className="font-bold text-slate-900 dark:text-white">{occupancy ? `${occupancy} Seats` : '0 Seats'}</span>
            </div>
          </div>
        </div>

        {/* Map */}
        <div className="flex-1 relative">
          <MapContainer center={defaultCenter} zoom={13} maxBounds={SURAT_BOUNDS} maxBoundsViscosity={1.0} style={{ height: '100%', width: '100%' }}>
            <TileLayer
              attribution='&copy; Google Maps'
              url="https://mt1.google.com/vt/lyrs=m&x={x}&y={y}&z={z}"
            />
            {polyline.length > 0 && <Polyline positions={polyline} color="#2563eb" weight={5} opacity={0.8} />}
            {sortedStops.map((s: any) => (
              <Marker key={s.id} position={[s.latitude, s.longitude]}>
                <Popup>
                  <strong>{s.stop_name}</strong><br/>
                  Stop #{s.sequence_number}
                </Popup>
              </Marker>
            ))}
            {currentLocation && (
              <Marker 
                position={[(currentLocation as any).lat ?? currentLocation.latitude, (currentLocation as any).lng ?? currentLocation.longitude]} 
                icon={busIcon}
              >
                <Popup>
                  <strong>Live Bus Location</strong><br/>
                  Speed: {Math.round(currentLocation.speed || 0)} km/h
                </Popup>
              </Marker>
            )}
          </MapContainer>
        </div>
      </div>
    </div>
  );
}

function EditRouteModal({ onClose, route }: { onClose: () => void; route: any }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ 
    route_name: route?.route_name || '', 
    route_code: route?.route_code || '', 
    start_location: route?.start_location || '', 
    end_location: route?.end_location || '',
    expected_duration_mins: route?.expected_duration_mins || ''
  });

  const mutation = useMutation({
    mutationFn: (data: any) => adminApi.updateRoute(route.id, data),
    onSuccess: () => { toast.success('Route updated!'); queryClient.invalidateQueries({ queryKey: ['admin-routes'] }); onClose(); },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to update route'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      ...form,
      expected_duration_mins: form.expected_duration_mins ? parseInt(form.expected_duration_mins.toString()) : null,
    });
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[500px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Route</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Route Name *</label>
              <input required value={form.route_name} onChange={e => setForm({...form, route_name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Route Code *</label>
              <input required value={form.route_code} onChange={e => setForm({...form, route_code: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Start Location *</label>
              <input required value={form.start_location} onChange={e => setForm({...form, start_location: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">End Location *</label>
              <input required value={form.end_location} onChange={e => setForm({...form, end_location: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Duration (mins)</label>
            <input type="number" min="1" value={form.expected_duration_mins} onChange={e => setForm({...form, expected_duration_mins: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {mutation.isPending ? 'Updating...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function RoutesView() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingRoute, setEditingRoute] = useState<any>(null);
  const [viewingLiveRoute, setViewingLiveRoute] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-routes', page],
    queryFn: () => adminApi.getRoutes({ page, page_size: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteRoute(id),
    onSuccess: () => { toast.success('Route deleted'); queryClient.invalidateQueries({ queryKey: ['admin-routes'] }); },
    onError: () => toast.error('Failed to delete route'),
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <Route className="w-6 h-6 mr-2 text-indigo-500" /> Routes
          </h1>
          <p className="text-slate-500">Manage transit routes</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4 mr-2" /> Add Route
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading routes...</div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">Failed to load routes. Is the Transport Service running?</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No routes yet. Click "Add Route" to create one.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Route Name</th>
                  <th className="px-4 py-3 font-medium">Code</th>
                  <th className="px-4 py-3 font-medium">Start → End</th>
                  <th className="px-4 py-3 font-medium">Duration</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((route: any) => (
                  <tr key={route.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{route.route_name}</td>
                    <td className="px-4 py-3 text-slate-500">{route.route_code}</td>
                    <td className="px-4 py-3 text-slate-500">{route.start_location} → {route.end_location}</td>
                    <td className="px-4 py-3 text-slate-500">{route.expected_duration_mins ? `${route.expected_duration_mins} min` : '—'}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setViewingLiveRoute(route)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-xl transition-colors flex items-center gap-1 text-xs font-semibold" title="View Live Map">
                          <Eye className="w-4 h-4" /> Live Map
                        </button>
                        <button onClick={() => setEditingRoute(route)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors" title="Edit Route">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if(confirm('Delete this route?')) deleteMutation.mutate(route.id) }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors" title="Delete Route">
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

        <div className="p-4 border-t border-slate-200 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-900/20">
          <span className="text-sm text-slate-500">Page {page} of {totalPages} ({total} total)</span>
          <div className="flex gap-2">
            <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"><ChevronLeft className="w-4 h-4" /></button>
            <button disabled={page >= totalPages} onClick={() => setPage(p => p + 1)} className="p-2 border border-slate-200 rounded-lg hover:bg-white disabled:opacity-50"><ChevronRight className="w-4 h-4" /></button>
          </div>
        </div>
      </div>

      {showCreate && <RouteWizardModal onClose={() => setShowCreate(false)} />}
      {editingRoute && <EditRouteModal onClose={() => setEditingRoute(null)} route={editingRoute} />}
      {viewingLiveRoute && <LiveRouteModal route={viewingLiveRoute} onClose={() => setViewingLiveRoute(null)} />}
    </div>
  );
}
