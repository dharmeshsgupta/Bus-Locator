import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api/adminApi';
import { Route, Plus, Search, ChevronLeft, ChevronRight, Trash2, X, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

import { RouteWizardModal } from './routes/RouteWizardModal';

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
    </div>
  );
}
