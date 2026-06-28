import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api/adminApi';
import { Bus, Plus, ChevronLeft, ChevronRight, Trash2, X, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

function CreateBusModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ bus_number: '', registration_number: '', capacity: '', current_route_id: '' });

  const { data: routesData } = useQuery({ queryKey: ['admin-routes-dropdown'], queryFn: () => adminApi.getRoutes({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (data: any) => adminApi.createBus(data),
    onSuccess: () => { toast.success('Bus created!'); queryClient.invalidateQueries({ queryKey: ['admin-buses'] }); onClose(); },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to create bus'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      bus_number: form.bus_number,
      registration_number: form.registration_number,
      capacity: parseInt(form.capacity),
      is_active: true,
      current_status: 'INACTIVE',
      current_route_id: form.current_route_id || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[500px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Add New Bus</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bus Number *</label>
              <input required value={form.bus_number} onChange={e => setForm({...form, bus_number: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="BUS-001" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Registration # *</label>
              <input required value={form.registration_number} onChange={e => setForm({...form, registration_number: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="GJ-05-XX-1234" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity *</label>
            <input required type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" placeholder="50" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign to Route (optional)</label>
            <select value={form.current_route_id} onChange={e => setForm({...form, current_route_id: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white">
              <option value="">— No Route —</option>
              {routesData?.items?.map((r: any) => <option key={r.id} value={r.id}>{r.route_name} ({r.route_code})</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {mutation.isPending ? 'Creating...' : 'Create Bus'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditBusModal({ onClose, bus }: { onClose: () => void; bus: any }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ 
    bus_number: bus?.bus_number || '', 
    registration_number: bus?.registration_number || '', 
    capacity: bus?.capacity || '', 
    current_route_id: bus?.current_route_id || '' 
  });

  const { data: routesData } = useQuery({ queryKey: ['admin-routes-dropdown'], queryFn: () => adminApi.getRoutes({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (data: any) => adminApi.updateBus(bus.id, data),
    onSuccess: () => { toast.success('Bus updated!'); queryClient.invalidateQueries({ queryKey: ['admin-buses'] }); onClose(); },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Failed to update bus'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate({
      bus_number: form.bus_number,
      registration_number: form.registration_number,
      capacity: parseInt(form.capacity.toString()),
      current_route_id: form.current_route_id || null,
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[500px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Bus</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bus Number *</label>
              <input required value={form.bus_number} onChange={e => setForm({...form, bus_number: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Registration # *</label>
              <input required value={form.registration_number} onChange={e => setForm({...form, registration_number: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Capacity *</label>
            <input required type="number" min="1" value={form.capacity} onChange={e => setForm({...form, capacity: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Assign to Route (optional)</label>
            <select value={form.current_route_id} onChange={e => setForm({...form, current_route_id: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white">
              <option value="">— No Route —</option>
              {routesData?.items?.map((r: any) => <option key={r.id} value={r.id}>{r.route_name} ({r.route_code})</option>)}
            </select>
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

export function BusesView() {
  const [page, setPage] = useState(1);
  const [showCreate, setShowCreate] = useState(false);
  const [editingBus, setEditingBus] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['admin-buses', page],
    queryFn: () => adminApi.getBuses({ page, page_size: 10 }),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => adminApi.deleteBus(id),
    onSuccess: () => { toast.success('Bus deleted'); queryClient.invalidateQueries({ queryKey: ['admin-buses'] }); },
    onError: () => toast.error('Failed to delete bus'),
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = data?.total_pages || 1;

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <Bus className="w-6 h-6 mr-2 text-indigo-500" /> Fleet
          </h1>
          <p className="text-slate-500">Manage buses and capacities</p>
        </div>
        <button onClick={() => setShowCreate(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
          <Plus className="w-4 h-4 mr-2" /> Add Bus
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading buses...</div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">Failed to load buses.</div>
          ) : items.length === 0 ? (
            <div className="p-8 text-center text-slate-500">No buses yet. Click "Add Bus" to create one.</div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Bus #</th>
                  <th className="px-4 py-3 font-medium">Registration</th>
                  <th className="px-4 py-3 font-medium">Capacity</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((bus: any) => (
                  <tr key={bus.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                    <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{bus.bus_number}</td>
                    <td className="px-4 py-3 text-slate-500">{bus.registration_number}</td>
                    <td className="px-4 py-3 text-slate-500">{bus.capacity}</td>
                    <td className="px-4 py-3">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        bus.current_status === 'ACTIVE' ? 'bg-green-100 text-green-700' :
                        bus.current_status === 'EN_ROUTE' ? 'bg-blue-100 text-blue-700' :
                        'bg-yellow-100 text-yellow-700'
                      }`}>{bus.current_status}</span>
                    </td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button onClick={() => setEditingBus(bus)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors" title="Edit Bus">
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button onClick={() => { if(confirm('Delete bus?')) deleteMutation.mutate(bus.id) }}
                          className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors" title="Delete Bus">
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

      {showCreate && <CreateBusModal onClose={() => setShowCreate(false)} />}
      {editingBus && <EditBusModal onClose={() => setEditingBus(null)} bus={editingBus} />}
    </div>
  );
}
