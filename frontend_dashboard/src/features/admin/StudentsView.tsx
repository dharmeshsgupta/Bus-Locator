import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { adminApi } from '../../services/api/adminApi';
import { authApi } from '../../services/api/authApi';
import { Users, Plus, ChevronLeft, ChevronRight, Trash2, X, UserPlus, Edit3 } from 'lucide-react';
import toast from 'react-hot-toast';

function AssignStudentModal({ onClose }: { onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ student_id: '', route_id: '', pickup_stop_id: '' });

  const { data: studentsData } = useQuery({ queryKey: ['auth-students-dropdown'], queryFn: () => authApi.getUsers('student') });
  const { data: routesData } = useQuery({ queryKey: ['admin-routes-dropdown'], queryFn: () => adminApi.getRoutes({ page: 1, page_size: 100 }) });
  const { data: stopsData } = useQuery({
    queryKey: ['admin-stops-for-route', form.route_id],
    queryFn: () => adminApi.getStopsByRoute(form.route_id, { page: 1, page_size: 100 }),
    enabled: !!form.route_id,
  });

  const mutation = useMutation({
    mutationFn: (data: any) => adminApi.assignStudent(data),
    onSuccess: () => { toast.success('Student assigned to route!'); queryClient.invalidateQueries({ queryKey: ['admin-students'] }); onClose(); },
    onError: (err: any) => toast.error(err?.response?.data?.detail || 'Assignment failed'),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    mutation.mutate(form);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[500px] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 transform transition-all" 
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-6 border-b border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Assign Student</h2>
            <p className="text-sm text-slate-500 mt-1">Link a student to a specific bus route and pickup stop.</p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 flex flex-col gap-5">
          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Select Student</label>
            <select required value={form.student_id} onChange={e => setForm({...form, student_id: e.target.value})}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm dark:text-white outline-none">
              <option value="">— Choose a registered student —</option>
              {studentsData?.map((s: any) => <option key={s.id} value={s.id}>{s.name} ({s.email || s.phone})</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Select Route</label>
            <select required value={form.route_id} onChange={e => setForm({...form, route_id: e.target.value, pickup_stop_id: ''})}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm dark:text-white outline-none">
              <option value="">— Choose a bus route —</option>
              {routesData?.items?.map((r: any) => <option key={r.id} value={r.id}>{r.route_name}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="block text-sm font-semibold text-slate-700 dark:text-slate-300">Select Pickup Stop</label>
            <select required value={form.pickup_stop_id} onChange={e => setForm({...form, pickup_stop_id: e.target.value})}
              disabled={!form.route_id}
              className="w-full px-4 py-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all shadow-sm dark:text-white outline-none disabled:opacity-50 disabled:bg-slate-50 dark:disabled:bg-slate-800/50 cursor-pointer disabled:cursor-not-allowed">
              <option value="">— Choose a designated stop —</option>
              {stopsData?.items?.map((s: any) => <option key={s.id} value={s.id}>{s.stop_name} (Stop #{s.sequence_number})</option>)}
            </select>
            {!form.route_id && <p className="text-xs text-amber-500 mt-1">Please select a route first to load its stops.</p>}
          </div>

          <div className="flex items-center gap-3 pt-4 mt-2 border-t border-slate-100 dark:border-slate-800">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-3 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-medium transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 font-medium disabled:opacity-70 disabled:cursor-not-allowed transition-all shadow-md shadow-indigo-500/20">
              {mutation.isPending ? 'Assigning...' : 'Confirm Assignment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function CreateStudentModal({ onClose }: { onClose: () => void }) {
  const [form, setForm] = useState({ enrollment_no: '', name: '', email: '', phone: '', password: '' });
  const mutation = useMutation({
    mutationFn: (data: any) => adminApi.createStudent(data),
    onSuccess: () => { toast.success('Student registered successfully!'); onClose(); },
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Register Student</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Enrollment No *</label>
              <input required value={form.enrollment_no} onChange={e => setForm({...form, enrollment_no: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email *</label>
            <input type="email" required value={form.email} onChange={e => setForm({...form, email: e.target.value})}
              className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone *</label>
              <input required value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Password *</label>
              <input type="password" required value={form.password} onChange={e => setForm({...form, password: e.target.value})} minLength={6}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="flex-1 px-4 py-2 border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50">Cancel</button>
            <button type="submit" disabled={mutation.isPending} className="flex-1 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50">
              {mutation.isPending ? 'Registering...' : 'Register Student'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function EditStudentModal({ onClose, student }: { onClose: () => void; student: any }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({ 
    enrollment_no: student?.student?.enrollment_no || '', 
    name: student?.name || '', 
    email: student?.email || '', 
    phone: student?.phone || '' 
  });

  const mutation = useMutation({
    mutationFn: (data: any) => authApi.updateStudent(student.id, data),
    onSuccess: () => { toast.success('Student updated!'); queryClient.invalidateQueries({ queryKey: ['admin-all-students'] }); onClose(); },
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
          <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Student</h2>
          <button onClick={onClose} className="p-1 hover:bg-slate-100 rounded-lg"><X className="w-5 h-5" /></button>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Enrollment No *</label>
              <input required value={form.enrollment_no} onChange={e => setForm({...form, enrollment_no: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Name *</label>
              <input required value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Email</label>
              <input type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 dark:text-slate-300 mb-1">Phone</label>
              <input value={form.phone} onChange={e => setForm({...form, phone: e.target.value})}
                className="w-full px-3 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none dark:bg-slate-800 dark:border-slate-700 dark:text-white" />
            </div>
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

export function StudentsView() {
  const [page, setPage] = useState(1);
  const [showAssign, setShowAssign] = useState(false);
  const [showCreate, setShowCreate] = useState(false);
  const [editingStudent, setEditingStudent] = useState<any>(null);
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authApi.deleteUser(id),
    onSuccess: () => { toast.success('Student deleted'); queryClient.invalidateQueries({ queryKey: ['admin-all-students'] }); },
    onError: () => toast.error('Failed to delete student'),
  });

  // Fetch all registered students
  const { data: students, isLoading: studentsLoading, isError: studentsError } = useQuery({
    queryKey: ['admin-all-students'],
    queryFn: () => authApi.getUsers('student'),
  });

  // Fetch all assignments
  const { data: assignments, isLoading: assignmentsLoading, isError: assignmentsError } = useQuery({
    queryKey: ['admin-students', page],
    queryFn: () => adminApi.getStudentAssignments({ page, page_size: 100 }), // Get a large page for simplicity mapping
  });

  const isLoading = studentsLoading || assignmentsLoading;
  const isError = studentsError || assignmentsError;

  const items = students || [];
  const assignmentMap = new Map();
  if (assignments) {
    assignments.forEach((a: any) => assignmentMap.set(a.student_id, a));
  }

  return (
    <div className="space-y-6 h-full flex flex-col">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white flex items-center">
            <Users className="w-6 h-6 mr-2 text-indigo-500" /> Students
          </h1>
          <p className="text-slate-500">Manage student registrations and assignments</p>
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowCreate(true)} className="flex items-center px-4 py-2 bg-white border border-slate-300 text-slate-700 rounded-lg hover:bg-slate-50 transition">
            <Plus className="w-4 h-4 mr-2" /> Register Student
          </button>
          <button onClick={() => setShowAssign(true)} className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition">
            <UserPlus className="w-4 h-4 mr-2" /> Assign Student
          </button>
        </div>
      </div>

      <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 flex-1 flex flex-col overflow-hidden">
        <div className="flex-1 overflow-auto">
          {isLoading ? (
            <div className="p-8 text-center text-slate-500">Loading students...</div>
          ) : isError ? (
            <div className="p-8 text-center text-red-500">Failed to load students.</div>
          ) : items.length === 0 ? (
            <div className="p-8 flex flex-col items-center justify-center text-center">
              <Users className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="text-lg font-semibold text-slate-700 dark:text-slate-300 mb-2">No Students Registered</h3>
              <p className="text-slate-500 max-w-[28rem]">
                No students found. Use the "Register Student" button to create a new student, and "Assign Student" to link them to a route.
              </p>
            </div>
          ) : (
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-slate-800/50 text-slate-500">
                <tr>
                  <th className="px-4 py-3 font-medium">Enrollment No</th>
                  <th className="px-4 py-3 font-medium">Name</th>
                  <th className="px-4 py-3 font-medium">Email / Phone</th>
                  <th className="px-4 py-3 font-medium">Assigned Route</th>
                  <th className="px-4 py-3 font-medium">Pickup Stop</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 dark:divide-slate-800">
                {items.map((student: any) => {
                  const assignment = assignmentMap.get(student.id);
                  return (
                    <tr key={student.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/20">
                      <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{student.student?.enrollment_no || '—'}</td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white font-medium">{student.name}</td>
                      <td className="px-4 py-3 text-slate-500">{student.email}<br/><span className="text-xs">{student.phone}</span></td>
                      <td className="px-4 py-3 text-slate-500 text-xs font-mono">
                        {assignment ? assignment.route_id : <span className="text-slate-400 italic">Unassigned</span>}
                      </td>
                      <td className="px-4 py-3 text-slate-900 dark:text-white">
                        {assignment ? (assignment.pickup_stop_name || assignment.pickup_stop_id) : '—'}
                      </td>
                      <td className="px-4 py-3">
                        {assignment ? (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700">{assignment.assignment_status}</span>
                        ) : (
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600">NONE</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <button onClick={() => setEditingStudent(student)}
                            className="p-2 text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-500/10 rounded-xl transition-colors" title="Edit Student">
                            <Edit3 className="w-4 h-4" />
                          </button>
                          <button onClick={() => { if(confirm(`Delete student ${student.name}?`)) deleteMutation.mutate(student.id) }}
                            className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-xl transition-colors" title="Delete Student">
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {showAssign && <AssignStudentModal onClose={() => setShowAssign(false)} />}
      {showCreate && <CreateStudentModal onClose={() => setShowCreate(false)} />}
      {editingStudent && <EditStudentModal onClose={() => setEditingStudent(null)} student={editingStudent} />}
    </div>
  );
}
