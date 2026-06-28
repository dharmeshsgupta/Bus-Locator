import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../../services/api/paymentApi';
import { CheckCircle, XCircle, AlertCircle, RefreshCw, Clock, Reply } from 'lucide-react';
import toast from 'react-hot-toast';

export function RefundManagement() {
  const queryClient = useQueryClient();

  // Fetch Refunds
  const { data: refunds, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-refunds'],
    queryFn: paymentApi.getRefunds,
  });

  // Review Refund Mutation
  const reviewMutation = useMutation({
    mutationFn: paymentApi.processRefund,
    onSuccess: (res) => {
      toast.success(res.message || 'Refund request updated successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-refunds'] });
      queryClient.invalidateQueries({ queryKey: ['finance-stats'] });
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to process refund.');
    }
  });

  const handleReview = (refundId: string, action: 'APPROVE' | 'REJECT') => {
    const actionLabel = action === 'APPROVE' ? 'approve and process refund via Gateway' : 'reject this refund request';
    if (confirm(`Are you sure you want to ${actionLabel}?`)) {
      reviewMutation.mutate({ refund_id: refundId, action });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
            <CheckCircle className="w-3.5 h-3.5" /> SUCCESS
          </span>
        );
      case 'REJECTED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/50">
            <XCircle className="w-3.5 h-3.5" /> REJECTED
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/50">
            <AlertCircle className="w-3.5 h-3.5" /> FAILED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
            <Clock className="w-3.5 h-3.5" /> PENDING
          </span>
        );
    }
  };

  return (
    <div className="space-y-lg max-w-[1200px] mx-auto pb-12">
      {/* Header */}
      <div>
        <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
          <Reply className="text-primary w-8 h-8" />
          Refund Administration
        </h1>
        <p className="text-slate-500 mt-1">
          Review, approve, or reject student payment refund requests. Completed refunds automatically reverse installment statuses.
        </p>
      </div>

      {/* Main Refunds List */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 space-y-4 animate-pulse">
            <div className="h-6 bg-slate-100 rounded-lg w-full"></div>
            <div className="h-6 bg-slate-100 rounded-lg w-5/6"></div>
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Failed to Retrieve Refunds</h3>
            <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-semibold text-xs flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Retry Fetch
            </button>
          </div>
        ) : !refunds || refunds.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">No refund logs or requests found.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-4">Refund ID</th>
                  <th className="px-6 py-4">Student Details</th>
                  <th className="px-6 py-4">Refund Reason</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date Requested</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Review Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {refunds.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-mono text-xs text-slate-500">{row.id.slice(0, 18)}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-bold">{row.student_name}</div>
                      <div className="text-slate-400 text-xs font-normal font-mono">{row.enrollment_no}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600 text-xs max-w-[200px] truncate" title={row.reason}>
                      {row.reason}
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-bold">₹{row.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(row.status)}</td>
                    <td className="px-6 py-4 text-right">
                      {row.status === 'PENDING' ? (
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => handleReview(row.id, 'APPROVE')}
                            className="px-3 py-1 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-lg transition text-xs flex items-center gap-1 shadow-sm"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleReview(row.id, 'REJECT')}
                            className="px-3 py-1 border border-slate-200 text-slate-700 hover:bg-slate-100 font-bold rounded-lg transition text-xs"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-slate-400 text-xs font-semibold">Reviewed</span>
                      )}
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
