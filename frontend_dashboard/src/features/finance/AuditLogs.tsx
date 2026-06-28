import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { paymentApi } from '../../services/api/paymentApi';
import { 
  Search, ChevronLeft, ChevronRight, AlertCircle, RefreshCw, History, Eye, EyeOff
} from 'lucide-react';

export function AuditLogs() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  // Fetch Audit Logs
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-audit-logs', page, search],
    queryFn: () => paymentApi.getAuditLogs({
      page,
      page_size: 15,
      search: search || undefined,
    }),
  });

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 15) || 1;

  const toggleExpand = (id: string) => {
    setExpandedLogId(prev => (prev === id ? null : id));
  };

  return (
    <div className="space-y-lg max-w-[1200px] mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <History className="text-primary w-8 h-8" />
          Financial Audit Trail
        </h1>
        <p className="text-slate-500 mt-1">
          Read-only history logs of administrative configurations, custom fee overrides, payment creations, and gateway updates.
        </p>
      </div>

      {/* Audit Table Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-lg border-b border-slate-200 flex flex-col md:flex-row justify-between gap-4 bg-slate-50/50">
          <div className="relative flex-1 max-w-md bg-white rounded-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search by action, email, or reason..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-100 rounded-lg w-full"></div>
            <div className="h-6 bg-slate-100 rounded-lg w-5/6"></div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Failed to Retrieve Audit Log</h3>
            <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-semibold text-xs flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Retry Fetch
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">No audit logs found matching criteria.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-4">Timestamp</th>
                  <th className="px-6 py-4">Actor</th>
                  <th className="px-6 py-4">Action</th>
                  <th className="px-6 py-4">IP / Browser</th>
                  <th className="px-6 py-4">Reason / Notes</th>
                  <th className="px-6 py-4 text-right">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {items.map((row: any) => {
                  const isExpanded = expandedLogId === row.id;
                  return (
                    <>
                      <tr key={row.id} className="hover:bg-slate-50/50">
                        <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                          {new Date(row.created_at).toLocaleString()}
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-slate-900 font-bold">{row.user_email || 'System / Cron'}</div>
                          <div className="text-slate-400 text-xs font-semibold uppercase">{row.role || 'Service'}</div>
                        </td>
                        <td className="px-6 py-4 font-mono text-xs font-bold text-slate-800">{row.action}</td>
                        <td className="px-6 py-4 text-xs font-mono text-slate-500" title={row.user_agent}>
                          <div>{row.ip_address || '—'}</div>
                          <div className="truncate max-w-[120px] text-slate-400">{row.user_agent || 'Internal'}</div>
                        </td>
                        <td className="px-6 py-4 text-slate-500 text-xs max-w-[180px] truncate" title={row.reason}>
                          {row.reason || '—'}
                        </td>
                        <td className="px-6 py-4 text-right">
                          {(row.old_values || row.new_values) ? (
                            <button
                              onClick={() => toggleExpand(row.id)}
                              className="px-2.5 py-1 border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 font-bold rounded-lg transition text-xs bg-slate-50 inline-flex items-center gap-1"
                            >
                              {isExpanded ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                              Inspect
                            </button>
                          ) : (
                            <span className="text-slate-400 text-xs">—</span>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr className="bg-slate-50/40">
                          <td colSpan={6} className="px-6 py-4 border-b border-slate-100">
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs font-mono">
                              <div>
                                <p className="font-bold text-slate-450 uppercase mb-1">Previous Parameters</p>
                                <pre className="bg-slate-100 border border-slate-200/50 rounded-xl p-3 max-h-48 overflow-y-auto text-slate-700 leading-relaxed shadow-inner">
                                  {row.old_values ? JSON.stringify(row.old_values, null, 2) : 'null'}
                                </pre>
                              </div>
                              <div>
                                <p className="font-bold text-slate-450 uppercase mb-1">New Parameters</p>
                                <pre className="bg-slate-100 border border-slate-200/50 rounded-xl p-3 max-h-48 overflow-y-auto text-slate-700 leading-relaxed shadow-inner">
                                  {row.new_values ? JSON.stringify(row.new_values, null, 2) : 'null'}
                                </pre>
                              </div>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="p-md bg-slate-50/50 border-t border-slate-100 flex items-center justify-between">
            <span className="text-xs text-slate-500">
              Showing page <span className="font-semibold">{page}</span> of <span className="font-semibold">{totalPages}</span> ({total} entries)
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(p - 1, 1))}
                disabled={page === 1}
                className="p-1.5 border border-slate-250 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage(p => Math.min(p + 1, totalPages))}
                disabled={page === totalPages}
                className="p-1.5 border border-slate-250 text-slate-700 rounded-lg hover:bg-slate-50 transition disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
