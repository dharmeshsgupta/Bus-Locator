import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../../services/api/paymentApi';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, BarChart, Bar, Legend
} from 'recharts';
import { 
  TrendingUp, IndianRupee, CreditCard, CheckCircle2, AlertCircle, HelpCircle, 
  ArrowUpRight, Users, ShieldAlert, BadgeCent
} from 'lucide-react';

const COLORS = ['#2563EB', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6'];

export function FinanceDashboard() {
  // Query Stats
  const { data: statsData, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ['finance-stats'],
    queryFn: paymentApi.getFinanceStats,
  });

  // Query Charts
  const { data: chartsData, isLoading: chartsLoading, isError: chartsError } = useQuery({
    queryKey: ['finance-charts'],
    queryFn: paymentApi.getFinanceCharts,
  });

  if (statsLoading || chartsLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-32 bg-slate-200 rounded-xl"></div>
          ))}
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-96 bg-slate-200 rounded-xl"></div>
          <div className="h-96 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (statsError || chartsError || !statsData || !chartsData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <ShieldAlert className="w-16 h-16 text-rose-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Failed to Load Finance Dashboard</h3>
        <p className="text-slate-500 mt-2 max-w-sm">We had trouble loading the university collections statistics. Please reload.</p>
      </div>
    );
  }

  const { metrics, breakdowns, recent_transactions } = statsData;
  const { monthly_revenue, installment_collection, daily_collection } = chartsData;

  const cards = [
    {
      title: 'Total Revenue',
      value: `₹${(metrics.total_revenue ?? 0).toLocaleString('en-IN')}`,
      desc: 'All online collections',
      icon: <IndianRupee className="w-6 h-6 text-blue-600" />,
      bg: 'bg-blue-50/50 border-blue-100',
    },
    {
      title: 'Collected Monthly',
      value: `₹${(metrics.monthly_collection ?? 0).toLocaleString('en-IN')}`,
      desc: 'Current academic month',
      icon: <TrendingUp className="w-6 h-6 text-emerald-600" />,
      bg: 'bg-emerald-50/50 border-emerald-100',
    },
    {
      title: 'Pending Fees',
      value: `₹${(metrics.pending_fees ?? 0).toLocaleString('en-IN')}`,
      desc: 'Unpaid dues statement',
      icon: <AlertCircle className="w-6 h-6 text-amber-600" />,
      bg: 'bg-amber-50/50 border-amber-100',
    },
    {
      title: 'Success Rate',
      value: `${(metrics.success_rate ?? 100).toFixed(1)}%`,
      desc: `${metrics.failed_payments} failed attempts`,
      icon: <CheckCircle2 className="w-6 h-6 text-purple-600" />,
      bg: 'bg-purple-50/50 border-purple-100',
    },
  ];

  return (
    <div className="space-y-lg max-w-[1200px] mx-auto pb-12">
      {/* Title Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <BadgeCent className="text-primary w-8 h-8" />
          Finance Overview & Analytics
        </h1>
        <p className="text-slate-500 mt-1">
          Monitor campus transport revenues, department collections, payment behaviors, and refund statistics.
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-md">
        {cards.map((c, idx) => (
          <div key={idx} className={`bg-white border rounded-2xl p-lg shadow-xs flex items-center justify-between hover:scale-[1.01] transition-transform ${c.bg}`}>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{c.title}</p>
              <p className="text-2xl font-black text-slate-900 mt-1">{c.value}</p>
              <p className="text-xs text-slate-500 mt-1">{c.desc}</p>
            </div>
            <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center border border-slate-100 shadow-2xs">
              {c.icon}
            </div>
          </div>
        ))}
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-lg">
        {/* Monthly Collection Line Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-lg shadow-xs">
          <h3 className="font-bold text-slate-800 text-base mb-md">Monthly Revenue Trend</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthly_revenue} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="month" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                <Line type="monotone" dataKey="amount" stroke="#2563EB" strokeWidth={3} dot={{ r: 4 }} activeDot={{ r: 6 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Daily Collection Bar Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-lg shadow-xs">
          <h3 className="font-bold text-slate-800 text-base mb-md">Daily Collection (Past 7 Days)</h3>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={daily_collection} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey="day" stroke="#94A3B8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94A3B8" fontSize={11} tickLine={false} />
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                <Bar dataKey="amount" fill="#10B981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Pie Chart and Breakdown Lists Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-lg">
        {/* Installment Pie Chart */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-lg shadow-xs flex flex-col justify-between">
          <h3 className="font-bold text-slate-800 text-base mb-md">Installment Ratios</h3>
          <div className="h-56 w-full flex items-center justify-center">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={installment_collection}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {installment_collection.map((entry: any, idx: number) => (
                    <Cell key={`cell-${idx}`} fill={COLORS[idx % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => `₹${Number(value).toLocaleString('en-IN')}`} />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Collection Breakdown by Department */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-lg shadow-xs flex flex-col">
          <h3 className="font-bold text-slate-800 text-base mb-md">Department Breakdown</h3>
          <div className="space-y-sm flex-1 overflow-y-auto max-h-[220px]">
            {Object.keys(breakdowns.by_department).length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">No collections recorded.</p>
            ) : (
              Object.entries(breakdowns.by_department).map(([dept, amount]: any, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 text-body-sm">
                  <span className="text-slate-600 font-semibold">{dept}</span>
                  <span className="font-bold text-slate-800">₹{amount.toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Collection Breakdown by Route */}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-lg shadow-xs flex flex-col">
          <h3 className="font-bold text-slate-800 text-base mb-md">Route Breakdown</h3>
          <div className="space-y-sm flex-1 overflow-y-auto max-h-[220px]">
            {Object.keys(breakdowns.by_route).length === 0 ? (
              <p className="text-slate-400 text-xs text-center py-8">No collections recorded.</p>
            ) : (
              Object.entries(breakdowns.by_route).map(([route, amount]: any, idx) => (
                <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 text-body-sm">
                  <span className="text-slate-600 font-semibold font-mono">{route}</span>
                  <span className="font-bold text-slate-800 font-mono">₹{amount.toLocaleString('en-IN')}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Recent Activity and Transaction Log list */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-lg shadow-xs">
        <div className="flex justify-between items-center mb-lg">
          <h3 className="text-lg font-bold text-slate-900">Recent Online Collections</h3>
        </div>

        {recent_transactions.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-100 rounded-xl">
            <p className="text-body-sm font-semibold">No payments captured yet.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Student Details</th>
                  <th className="px-4 py-3">Enrollment No</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {recent_transactions.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3 font-bold text-slate-900">{tx.student_name}</td>
                    <td className="px-4 py-3 font-mono text-xs">{tx.enrollment_no}</td>
                    <td className="px-4 py-3 text-slate-900 font-semibold">₹{(tx.amount ?? 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs">
                      {new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                        tx.status === 'SUCCESS' ? 'text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full' :
                        tx.status === 'FAILED' ? 'text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full' :
                        'text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full'
                      }`}>
                        {tx.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
