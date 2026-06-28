import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../../services/api/paymentApi';
import { 
  Search, 
  Filter, 
  Calendar, 
  ChevronLeft, 
  ChevronRight, 
  Edit3, 
  AlertCircle, 
  CheckCircle, 
  Clock, 
  CreditCard, 
  Globe, 
  X, 
  RefreshCw 
} from 'lucide-react';
import toast from 'react-hot-toast';

interface StudentFeeRow {
  student_id: string;
  user_id: string;
  enrollment_no: string;
  name: string;
  email: string | null;
  phone: string | null;
  route_id: string | null;
  installment_1_amount: number;
  installment_1_deadline: string | null;
  installment_1_status: string;
  installment_1_payment_date: string | null;
  installment_1_gateway: string | null;
  installment_1_transaction_id: string | null;
  installment_1_paid_at: string | null;
  installment_2_amount: number;
  installment_2_deadline: string | null;
  installment_2_status: string;
  installment_2_payment_date: string | null;
  installment_2_gateway: string | null;
  installment_2_transaction_id: string | null;
  installment_2_paid_at: string | null;
  total_paid: number;
  remaining_amount: number;
}

function EditFeeModal({ student, onClose }: { student: StudentFeeRow; onClose: () => void }) {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    installment_1_amount: student.installment_1_amount,
    installment_1_deadline: student.installment_1_deadline || '',
    installment_1_status: student.installment_1_status === 'overdue' ? 'pending' : student.installment_1_status,
    installment_1_payment_date: student.installment_1_payment_date || '',
    
    installment_2_amount: student.installment_2_amount,
    installment_2_deadline: student.installment_2_deadline || '',
    installment_2_status: student.installment_2_status === 'overdue' ? 'pending' : student.installment_2_status,
    installment_2_payment_date: student.installment_2_payment_date || '',
  });

  const hasSuccessPayment1 = student.installment_1_gateway !== null && student.installment_1_transaction_id !== null;
  const hasSuccessPayment2 = student.installment_2_gateway !== null && student.installment_2_transaction_id !== null;

  const mutation = useMutation({
    mutationFn: (data: any) => paymentApi.updateStudentFee(student.student_id, data),
    onSuccess: () => {
      toast.success('Student fee record updated successfully');
      queryClient.invalidateQueries({ queryKey: ['admin-fees'] });
      onClose();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to update student fee');
    }
  });

  const handleStatusChange = (installmentNum: 1 | 2, status: string) => {
    const today = new Date().toISOString().split('T')[0];
    if (installmentNum === 1) {
      setForm(prev => ({
        ...prev,
        installment_1_status: status,
        installment_1_payment_date: status === 'paid' ? (prev.installment_1_payment_date || today) : '',
      }));
    } else {
      setForm(prev => ({
        ...prev,
        installment_2_status: status,
        installment_2_payment_date: status === 'paid' ? (prev.installment_2_payment_date || today) : '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clean up empty strings to null for deadlines and payment dates
    const payload = {
      installment_1_amount: Number(form.installment_1_amount),
      installment_1_deadline: form.installment_1_deadline || null,
      installment_1_status: form.installment_1_status,
      installment_1_payment_date: form.installment_1_status === 'paid' ? (form.installment_1_payment_date || null) : null,
      
      installment_2_amount: Number(form.installment_2_amount),
      installment_2_deadline: form.installment_2_deadline || null,
      installment_2_status: form.installment_2_status,
      installment_2_payment_date: form.installment_2_status === 'paid' ? (form.installment_2_payment_date || null) : null,
    };
    
    mutation.mutate(payload);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4" onClick={onClose}>
      <div 
        className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-[650px] flex flex-col overflow-hidden border border-slate-200 dark:border-slate-800 transform transition-all"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="flex justify-between items-center p-6 border-b border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/30">
          <div>
            <h2 className="text-xl font-bold text-slate-900 dark:text-white">Edit Fee Record</h2>
            <p className="text-xs text-slate-500 mt-1">
              Modifying fee structure for <span className="font-semibold text-slate-800 dark:text-slate-200">{student.name}</span> ({student.enrollment_no})
            </p>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-500 dark:text-slate-400">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto max-h-[75vh] flex flex-col gap-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Installment 1 Details */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Installment 01
              </h3>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Amount (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  disabled={hasSuccessPayment1}
                  value={form.installment_1_amount}
                  onChange={e => setForm(prev => ({ ...prev, installment_1_amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Due Date
                </label>
                <input 
                  type="date"
                  value={form.installment_1_deadline}
                  onChange={e => setForm(prev => ({ ...prev, installment_1_deadline: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status</label>
                <select
                  disabled={hasSuccessPayment1}
                  value={form.installment_1_status}
                  onChange={e => handleStatusChange(1, e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {form.installment_1_status === 'paid' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Payment Date</label>
                  <input 
                    type="date"
                    required
                    disabled={hasSuccessPayment1}
                    value={form.installment_1_payment_date}
                    onChange={e => setForm(prev => ({ ...prev, installment_1_payment_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              {hasSuccessPayment1 && (
                <div className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg p-2 font-semibold font-mono leading-relaxed break-all">
                  Locked: Paid online via {student.installment_1_gateway} ({student.installment_1_transaction_id})
                </div>
              )}
            </div>

            {/* Installment 2 Details */}
            <div className="p-4 bg-slate-50 dark:bg-slate-800/30 rounded-xl border border-slate-100 dark:border-slate-800 space-y-4">
              <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5 border-b border-slate-200 dark:border-slate-800 pb-2">
                <CreditCard className="w-4 h-4 text-primary" />
                Installment 02
              </h3>
              
              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Amount (₹)</label>
                <input 
                  type="number" 
                  min="0"
                  required
                  disabled={hasSuccessPayment2}
                  value={form.installment_2_amount}
                  onChange={e => setForm(prev => ({ ...prev, installment_2_amount: parseFloat(e.target.value) || 0 }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5" /> Due Date
                </label>
                <input 
                  type="date"
                  value={form.installment_2_deadline}
                  onChange={e => setForm(prev => ({ ...prev, installment_2_deadline: e.target.value }))}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none"
                />
              </div>

              <div className="space-y-1">
                <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Status</label>
                <select
                  disabled={hasSuccessPayment2}
                  value={form.installment_2_status}
                  onChange={e => handleStatusChange(2, e.target.value)}
                  className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                >
                  <option value="pending">Pending</option>
                  <option value="paid">Paid</option>
                </select>
              </div>

              {form.installment_2_status === 'paid' && (
                <div className="space-y-1">
                  <label className="text-xs font-semibold text-slate-600 dark:text-slate-400">Payment Date</label>
                  <input 
                    type="date"
                    required
                    disabled={hasSuccessPayment2}
                    value={form.installment_2_payment_date}
                    onChange={e => setForm(prev => ({ ...prev, installment_2_payment_date: e.target.value }))}
                    className="w-full px-3 py-2 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg text-sm text-slate-800 dark:text-white focus:ring-2 focus:ring-primary focus:border-primary focus:outline-none disabled:bg-slate-100 dark:disabled:bg-slate-800 disabled:cursor-not-allowed"
                  />
                </div>
              )}

              {hasSuccessPayment2 && (
                <div className="text-[10px] text-emerald-600 bg-emerald-50 dark:bg-emerald-950/20 border border-emerald-100 dark:border-emerald-900/50 rounded-lg p-2 font-semibold font-mono leading-relaxed break-all">
                  Locked: Paid online via {student.installment_2_gateway} ({student.installment_2_transaction_id})
                </div>
              )}
            </div>

          </div>

          {/* Form Actions */}
          <div className="flex gap-3 pt-4 border-t border-slate-200 dark:border-slate-800">
            <button 
              type="button" 
              onClick={onClose} 
              className="flex-1 px-4 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 font-semibold text-sm transition"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={mutation.isPending} 
              className="flex-1 px-4 py-2.5 bg-primary hover:bg-blue-700 text-white rounded-xl font-semibold text-sm disabled:opacity-50 transition"
            >
              {mutation.isPending ? 'Saving overrides...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export function AdminFeePanel() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [editingStudent, setEditingStudent] = useState<StudentFeeRow | null>(null);

  // Global Config Form States
  const [globalForm, setGlobalForm] = useState({
    installment_1_amount: 1200,
    installment_1_deadline: new Date(new Date().setMonth(new Date().getMonth() + 1)).toISOString().split('T')[0], // 1 month out
    installment_2_amount: 1200,
    installment_2_deadline: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0], // 3 months out
  });

  // Query Student Fee lists
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-fees', page, search, statusFilter],
    queryFn: () => paymentApi.getAdminFees({
      page,
      page_size: 10,
      search: search || undefined,
      status: statusFilter || undefined,
    }),
  });

  // Mutations
  const globalMutation = useMutation({
    mutationFn: paymentApi.updateGlobalFees,
    onSuccess: () => {
      toast.success('Global fee structure applied to unpaid records!');
      queryClient.invalidateQueries({ queryKey: ['admin-fees'] });
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.detail || 'Failed to apply global config');
    }
  });

  const handleApplyGlobal = (e: React.FormEvent) => {
    e.preventDefault();
    if (confirm('Apply this installment structure as defaults to all students without customized paid/overdue structures?')) {
      globalMutation.mutate({
        installment_1_amount: Number(globalForm.installment_1_amount),
        installment_1_deadline: globalForm.installment_1_deadline,
        installment_2_amount: Number(globalForm.installment_2_amount),
        installment_2_deadline: globalForm.installment_2_deadline,
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
            <CheckCircle className="w-3 h-3" />
            Paid
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/50">
            <AlertCircle className="w-3 h-3" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
    }
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10) || 1;

  return (
    <div className="space-y-lg max-w-[1200px] mx-auto pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 dark:text-white tracking-tight flex items-center gap-2">
          <Globe className="text-primary w-8 h-8" />
          Student Fee Administration
        </h1>
        <p className="text-slate-500 mt-1">
          Configure default installment values and deadlines globally, or override individual student balances.
        </p>
      </div>

      {/* Global Configuration Workspace */}
      <form onSubmit={handleApplyGlobal} className="bg-white border border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 rounded-2xl p-lg shadow-xs space-y-md">
        <div>
          <h2 className="text-lg font-bold text-slate-800 dark:text-slate-100 flex items-center gap-2">
            <CreditCard className="w-5 h-5 text-primary" />
            Global Fee Defaults Setup
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Define transport charges and deadlines. These default installments will be applied to all students who do not already have custom fee records setup.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-md">
          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Installment 01 Amount (₹)</label>
            <input 
              type="number"
              min="0"
              required
              value={globalForm.installment_1_amount}
              onChange={e => setFormState('installment_1_amount', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Installment 01 Due Date</label>
            <input 
              type="date"
              required
              value={globalForm.installment_1_deadline}
              onChange={e => setFormState('installment_1_deadline', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Installment 02 Amount (₹)</label>
            <input 
              type="number"
              min="0"
              required
              value={globalForm.installment_2_amount}
              onChange={e => setFormState('installment_2_amount', parseFloat(e.target.value) || 0)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="space-y-1">
            <label className="text-xs font-bold text-slate-600 dark:text-slate-400">Installment 02 Due Date</label>
            <input 
              type="date"
              required
              value={globalForm.installment_2_deadline}
              onChange={e => setFormState('installment_2_deadline', e.target.value)}
              className="w-full px-3 py-2 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            type="submit"
            disabled={globalMutation.isPending}
            className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl transition duration-150 shadow-sm shadow-blue-500/10 flex items-center gap-2"
          >
            {globalMutation.isPending ? 'Applying defaults...' : 'Apply Defaults Globally'}
          </button>
        </div>
      </form>

      {/* Main Student Ledger Card */}
      <div className="bg-white border border-slate-200/80 dark:border-slate-800 dark:bg-slate-900 rounded-2xl shadow-xs overflow-hidden">
        {/* Filter Controls Header */}
        <div className="p-lg border-b border-slate-200 dark:border-slate-800 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search student name or enrollment number..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-850 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-500 dark:text-slate-400 text-sm font-semibold">
              <Filter className="w-4 h-4" /> Filter:
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 dark:border-slate-700 dark:bg-slate-850 rounded-xl text-sm dark:text-white focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer"
            >
              <option value="">All Statuses</option>
              <option value="paid">Both Paid</option>
              <option value="pending">Pending Installments</option>
              <option value="overdue">Overdue Fees</option>
            </select>
          </div>
        </div>

        {/* Loading and Error States */}
        {isLoading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-100 dark:bg-slate-850 rounded-lg w-full"></div>
            <div className="h-6 bg-slate-100 dark:bg-slate-850 rounded-lg w-5/6"></div>
            <div className="h-6 bg-slate-100 dark:bg-slate-850 rounded-lg w-full"></div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3 animate-bounce" />
            <h3 className="text-lg font-bold text-slate-800 dark:text-slate-200">Failed to Retrieve Ledger</h3>
            <p className="text-slate-400 text-xs mt-1">We experienced issues querying database details. Please retry.</p>
            <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-350 rounded-xl transition font-semibold text-xs flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Retry Fetch
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400 border-t border-slate-100 dark:border-slate-800">
            <AlertCircle className="w-12 h-12 text-slate-300 dark:text-slate-600 mx-auto mb-3" />
            <p className="text-sm font-semibold">No student fee records found matching criteria.</p>
            <p className="text-xs text-slate-400/80 mt-1">Try relaxing filters or search terms.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 dark:bg-slate-800/40 text-slate-500 dark:text-slate-450 border-b border-slate-100 dark:border-slate-800 font-semibold">
                <tr>
                  <th className="px-6 py-4">Student Details</th>
                  <th className="px-6 py-4">Enrollment No</th>
                  <th className="px-6 py-4">Route ID</th>
                  <th className="px-6 py-4">Installment 01</th>
                  <th className="px-6 py-4">Installment 02</th>
                  <th className="px-6 py-4">Total Paid</th>
                  <th className="px-6 py-4">Remaining</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 font-medium">
                {items.map((row: StudentFeeRow) => {
                  return (
                    <tr key={row.student_id} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/10">
                      <td className="px-6 py-4">
                        <div className="text-slate-900 dark:text-white font-bold">{row.name}</div>
                        <div className="text-slate-400 text-xs font-normal mt-0.5">{row.email || row.phone}</div>
                      </td>
                      <td className="px-6 py-4 text-slate-600 dark:text-slate-350 font-mono">{row.enrollment_no}</td>
                      <td className="px-6 py-4">
                        {row.route_id ? (
                          <span className="px-2 py-1 rounded bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-350 text-xs font-semibold font-mono">
                            {row.route_id}
                          </span>
                        ) : (
                          <span className="text-slate-400 text-xs italic">Unassigned</span>
                        )}
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="block text-slate-800 dark:text-slate-200 font-bold">₹{(row.installment_1_amount ?? 0).toLocaleString('en-IN')}</span>
                          {getStatusBadge(row.installment_1_status)}
                          {row.installment_1_status === 'paid' && (
                            <div className="text-[10px] text-slate-400 font-mono mt-1 space-y-0.5 max-w-[150px]">
                              {row.installment_1_gateway && <div className="font-semibold text-slate-500">{row.installment_1_gateway}</div>}
                              {row.installment_1_transaction_id && <div className="truncate text-[9px]" title={row.installment_1_transaction_id}>{row.installment_1_transaction_id}</div>}
                              {row.installment_1_payment_date && <div>{row.installment_1_payment_date}</div>}
                            </div>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="space-y-1">
                          <span className="block text-slate-800 dark:text-slate-200 font-bold">₹{(row.installment_2_amount ?? 0).toLocaleString('en-IN')}</span>
                          {getStatusBadge(row.installment_2_status)}
                          {row.installment_2_status === 'paid' && (
                            <div className="text-[10px] text-slate-400 font-mono mt-1 space-y-0.5 max-w-[150px]">
                              {row.installment_2_gateway && <div className="font-semibold text-slate-500">{row.installment_2_gateway}</div>}
                              {row.installment_2_transaction_id && <div className="truncate text-[9px]" title={row.installment_2_transaction_id}>{row.installment_2_transaction_id}</div>}
                              {row.installment_2_payment_date && <div>{row.installment_2_payment_date}</div>}
                            </div>
                          )}
                        </div>
                      </td>

                      <td className="px-6 py-4 text-emerald-600 font-bold">₹{(row.total_paid ?? 0).toLocaleString('en-IN')}</td>
                      <td className={`px-6 py-4 font-bold ${row.remaining_amount > 0 ? 'text-primary' : 'text-slate-400 dark:text-slate-500'}`}>
                        ₹{(row.remaining_amount ?? 0).toLocaleString('en-IN')}
                      </td>
                      <td className="px-6 py-4 text-right">
                        <button 
                          onClick={() => setEditingStudent(row)}
                          className="px-3.5 py-1.5 bg-slate-100 hover:bg-slate-250 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 rounded-lg transition font-semibold text-xs flex items-center gap-1 ml-auto"
                        >
                          <Edit3 className="w-3.5 h-3.5" /> Edit
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination Bar */}
        {totalPages > 1 && (
          <div className="p-md bg-slate-50/50 dark:bg-slate-800/10 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span> ({total} entries)
            </span>
            
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-250 dark:border-slate-750 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-250 dark:border-slate-750 text-slate-700 dark:text-slate-300 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Editing Modal Wrapper */}
      {editingStudent && (
        <EditFeeModal 
          student={editingStudent} 
          onClose={() => setEditingStudent(null)} 
        />
      )}
    </div>
  );

  function setFormState(field: keyof typeof globalForm, value: string | number) {
    setGlobalForm(prev => ({
      ...prev,
      [field]: value
    }));
  }
}
