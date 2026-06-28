import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api/adminApi';
import { authApi } from '../../services/api/authApi';
import { BadgeCheck, Plus, ChevronLeft, ChevronRight, Trash2, X, UserPlus, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

function AssignDriverModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ driver_id: '', bus_id: '' });

  const { data: driversData } = useQuery({ queryKey: ['auth-drivers-dropdown'], queryFn: () => authApi.getUsers('driver') });
  const { data: busesData } = useQuery({ queryKey: ['admin-buses-dropdown'], queryFn: () => adminApi.getBuses({ page: 1, page_size: 100 }) });

  const mutation = useMutation({
    mutationFn: (data: any) => adminApi.assignDriver(data),
    onSuccess: () => { toast.success('Driver assigned to bus!'); queryClient.invalidateQueries({ queryKey: ['admin-drivers'] }); onClose(); },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Assignment failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[500px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assign Driver to Bus</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Driver *</label>
            <select required value={form.driver_id} onChange={e => setForm({...form, driver_id: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white">
              <option value="">— Select Driver —</option>
              {driversData?.map((d: any) => <option key={d.id} value={d.id}>{d.name} ({d.phone})</option>)}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Bus *</label>
            <select required value={form.bus_id} onChange={e => setForm({...form, bus_id: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white">
              <option value="">— Select Bus —</option>
              {busesData?.items?.map((b: any) => <option key={b.id} value={b.id}>{b.bus_number} ({b.registration_number})</option>)}
            </select>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {mutation.isPending ? 'Assigning...' : 'Assign Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateDriverModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: '', phone: '' });
  const mutation = useMutation({
    mutationFn: (data: any) => adminApi.createDriver(data),
    onSuccess: () => { 
      toast.success('Driver registered successfully! Now assign them to a bus.'); 
      queryClient.invalidateQueries({ queryKey: ['auth-drivers-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['auth-drivers'] });
      onClose(); 
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Registration failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[500px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Register Driver</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
            <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} placeholder="+1234567890"
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {mutation.isPending ? 'Registering...' : 'Register Driver'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditDriverModal({ onClose, driver }: { onClose: () => void; driver: any }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ name: driver?.name || '', phone: driver?.phone || '' });
  
  const mutation = useMutation({
    mutationFn: (data: any) => authApi.updateDriver(driver.id, data),
    onSuccess: () => { 
      toast.success('Driver updated!'); 
      queryClient.invalidateQueries({ queryKey: ['auth-drivers-dropdown'] });
      queryClient.invalidateQueries({ queryKey: ['auth-drivers'] });
      onClose(); 
    },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Update failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={onClose}>
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[500px] p-6" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Driver</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
            <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone Number *</label>
            <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
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

export function DriversView() {
  const [page, setPage] = useState(1);
  const [showAssign, setShowAssign] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingDriver, setEditingDriver] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'assignments' | 'all'>('assignments');
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authApi.deleteUser(id),
    onSuccess: () => { 
      toast.success('Driver deleted'); 
      queryClient.invalidateQueries({ queryKey: ['auth-drivers'] }); 
      queryClient.invalidateQueries({ queryKey: ['auth-drivers-dropdown'] }); 
    },
    onError: () => toast.error('Failed to delete driver'),
  });

  const { data: assignmentsData, isLoading: loadingAssignments, isError: isErrorAssignments } = useQuery({
    queryKey: ['admin-drivers', page],
    queryFn: () => adminApi.getDriverAssignments({ page, page_size: 10 }),
  });

  const { data: allDrivers, isLoading: loadingDrivers } = useQuery({
    queryKey: ['auth-drivers'],
    queryFn: () => authApi.getUsers('driver'),
  });

  const items = assignmentsData || [];

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <BadgeCheck className="w-6 h-6 mr-2 text-indigo-500" /> Drivers
          </h1>
          <p className="text-slate-500">Manage driver registrations and bus assignments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreate(true)} className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
            <Plus className="w-4 h-4 mr-2" /> Register Driver
          </button>
          <button onClick={() => setShowAssign(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            <UserPlus className="w-4 h-4 mr-2" /> Assign Driver
          </button>
        </div>
      </div>

      <div className="flex border-b border-slate-200 dark:border-slate-800">
        <button 
          onClick={() => setActiveTab('assignments')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'assignments' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
          Driver Assignments
        </button>
        <button 
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 font-medium text-sm ${activeTab === 'all' ? 'text-indigo-600 border-b-2 border-indigo-600' : 'text-slate-500 hover:text-slate-700'}`}>
          All Registered Drivers
        </button>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {activeTab === 'assignments' && (
            loadingAssignments ? (
              <div className="p-8 text-center text-slate-500">Loading assignments...</div>
            ) : isErrorAssignments ? (
              <div className="p-8 text-center text-red-500">Failed to load assignments.</div>
            ) : items.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <BadgeCheck className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Driver Assignments</h3>
                <p className="text-slate-500 max-w-[28rem]">
                  Drivers are registered via the Auth Service. Use the "Register Driver" button to create a new driver, and "Assign Driver" to link them to a bus.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Driver UUID</th>
                    <th className="px-4 py-3 font-medium">Bus UUID</th>
                    <th className="px-4 py-3 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {items.map((assignment: any) => (
                    <tr key={assignment.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3 text-slate-500 text-xs font-mono">{assignment.driver_id}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs font-mono">{assignment.bus_id}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{assignment.assignment_status}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}

          {activeTab === 'all' && (
            loadingDrivers ? (
              <div className="p-8 text-center text-slate-500">Loading drivers...</div>
            ) : !allDrivers || allDrivers.length === 0 ? (
              <div className="p-8 flex flex-col items-center justify-center text-center">
                <BadgeCheck className="w-12 h-12 text-slate-300 mb-4" />
                <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Drivers Found</h3>
                <p className="text-slate-500 max-w-[28rem]">
                  Click the "Register Driver" button to add a new driver to the system.
                </p>
              </div>
            ) : (
              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                  <tr>
                    <th className="px-4 py-3 font-medium">Driver Name</th>
                    <th className="px-4 py-3 font-medium">Phone Number</th>
                    <th className="px-4 py-3 font-medium">Driver ID</th>
                    <th className="px-4 py-3 font-medium text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                  {allDrivers.map((driver: any) => (
                    <tr key={driver.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3 font-medium text-slate-900 dark:text-white">{driver.name}</td>
                      <td className="px-4 py-3 text-slate-500">{driver.phone}</td>
                      <td className="px-4 py-3 text-slate-500 text-xs font-mono">{driver.id}</td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingDriver(driver)}
                            className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors" title="Edit Driver">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => { if(confirm(`Delete driver ${driver.name}?`)) deleteMutation.mutate(driver.id) }}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors" title="Delete Driver">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          )}
        </div>
      </div>

      {showAssign && <AssignDriverModal onClose={() => setShowAssign(false)} />}
      {showCreate && <CreateDriverModal onClose={() => setShowCreate(false)} />}
      {editingDriver && <EditDriverModal onClose={() => setEditingDriver(null)} driver={editingDriver} />}
    </div>
  );
}
