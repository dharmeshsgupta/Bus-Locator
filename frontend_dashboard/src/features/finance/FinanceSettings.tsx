import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../../services/api/paymentApi';
import { 
  Settings, Clock, Percent, Bell, ShieldCheck, RefreshCw, AlertTriangle
} from 'lucide-react';
import toast from 'react-hot-toast';

export function FinanceSettings() {
  const queryClient = useQueryClient();
  const [form, setForm] = useState({
    grace_period_days: 5,
    late_fee_percentage: 2.0,
    reminder_frequency_days: 3,
    gst_percentage: 18.0,
    receipt_prefix: 'REC',
    invoice_prefix: 'INV',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    academic_year: '2026-2027',
  });

  const [isCronRunning, setIsCronRunning] = useState(false);

  // Fetch Current Settings
  const { data: settingsData, isLoading, isError, refetch } = useQuery({
    queryKey: ['finance-settings'],
    queryFn: paymentApi.getFinanceSettings,
  });

  useEffect(() => {
    if (settingsData) {
      setForm(settingsData);
    }
  }, [settingsData]);

  // Update Settings Mutation
  const updateMutation = useMutation({
    mutationFn: paymentApi.updateFinanceSettings,
    onSuccess: () => {
      toast.success('Finance rules updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['finance-settings'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to save settings.');
    }
  });

  // Run Cron Mutation
  const cronMutation = useMutation({
    mutationFn: paymentApi.triggerLateFeesCron,
    onSuccess: (res) => {
      toast.success(`Cron Job executed! Late fees applied to ${res.late_fees_applied} records.`);
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Cron execution failed.');
    },
    onSettled: () => {
      setIsCronRunning(false);
    }
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(form);
  };

  const handleRunCron = () => {
    if (confirm('Run daily overdue late fee assessment and generate reminders? This updates student billing records.')) {
      setIsCronRunning(true);
      cronMutation.mutate();
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="h-96 bg-slate-200 rounded-xl"></div>
      </div>
    );
  }

  if (isError || !settingsData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertTriangle className="w-16 h-16 text-rose-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Failed to Load Settings</h3>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition">
          Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-lg max-w-[1000px] mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Settings className="text-primary w-8 h-8" />
          Finance Settings & Automation
        </h1>
        <p className="text-slate-500 mt-1">
          Configure financial settings, overdue schedules, tax rules, and execute daily cron jobs.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-lg">
        {/* Rules Form */}
        <form onSubmit={handleSubmit} className="bg-white border border-slate-200/80 rounded-2xl p-lg shadow-xs space-y-md md:col-span-2">
          <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2">Institutional Finance Policy</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-md">
            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-slate-400" /> Grace Period (Days)
              </label>
              <input
                type="number"
                required
                min="0"
                value={form.grace_period_days}
                onChange={e => setForm({ ...form, grace_period_days: parseInt(e.target.value) || 0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-slate-400" /> Late Fee Percentage (%)
              </label>
              <input
                type="number"
                required
                step="0.1"
                min="0"
                value={form.late_fee_percentage}
                onChange={e => setForm({ ...form, late_fee_percentage: parseFloat(e.target.value) || 0.0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 flex items-center gap-1">
                <Bell className="w-3.5 h-3.5 text-slate-400" /> Reminder Frequency (Days)
              </label>
              <input
                type="number"
                required
                min="1"
                value={form.reminder_frequency_days}
                onChange={e => setForm({ ...form, reminder_frequency_days: parseInt(e.target.value) || 3 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650 flex items-center gap-1">
                <Percent className="w-3.5 h-3.5 text-slate-400" /> GST Percentage (%)
              </label>
              <input
                type="number"
                required
                step="0.1"
                min="0"
                value={form.gst_percentage}
                onChange={e => setForm({ ...form, gst_percentage: parseFloat(e.target.value) || 0.0 })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650">Receipt Number Prefix</label>
              <input
                type="text"
                required
                value={form.receipt_prefix}
                onChange={e => setForm({ ...form, receipt_prefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650">Invoice Number Prefix</label>
              <input
                type="text"
                required
                value={form.invoice_prefix}
                onChange={e => setForm({ ...form, invoice_prefix: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650">Currency Code</label>
              <input
                type="text"
                required
                value={form.currency}
                onChange={e => setForm({ ...form, currency: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50/50"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-bold text-slate-650">Academic Year</label>
              <input
                type="text"
                required
                value={form.academic_year}
                onChange={e => setForm({ ...form, academic_year: e.target.value })}
                className="w-full px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary bg-slate-50/50"
              />
            </div>
          </div>

          <div className="flex justify-end pt-4 border-t border-slate-100">
            <button
              type="submit"
              disabled={updateMutation.isPending}
              className="px-5 py-2.5 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl transition duration-150 shadow-sm shadow-blue-500/10"
            >
              {updateMutation.isPending ? 'Saving Settings...' : 'Save Finance Policy'}
            </button>
          </div>
        </form>

        {/* Automation Actions */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-lg shadow-xs flex flex-col justify-between">
          <div className="space-y-sm">
            <h3 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-2 flex items-center gap-1">
              <ShieldCheck className="w-5 h-5 text-emerald-600" />
              Automation Scheduler
            </h3>
            <p className="text-xs text-slate-500 leading-relaxed">
              BusLocator assesses student billing schedules daily. Unpaid installments past the deadline + grace period automatically apply the surcharge fee and dispatch reminders.
            </p>
            <div className="bg-slate-50 border border-slate-200/50 rounded-xl p-3 text-xs text-slate-600 leading-relaxed">
              <strong>Assessment Cron Action:</strong> Loops through all student fee records to recalculate penalties and mark overdue states.
            </div>
          </div>

          <button
            onClick={handleRunCron}
            disabled={isCronRunning}
            className="w-full mt-4 py-3 border border-slate-200 hover:bg-slate-50 text-slate-700 hover:text-blue-600 hover:border-blue-500 font-bold rounded-xl transition text-sm flex items-center justify-center gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${isCronRunning ? 'animate-spin' : ''}`} />
            {isCronRunning ? 'Running Late Fees...' : 'Run Late Fee Assessment'}
          </button>
        </div>
      </div>
    </div>
  );
}
