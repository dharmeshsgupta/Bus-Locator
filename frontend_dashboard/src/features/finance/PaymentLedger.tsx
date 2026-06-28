import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../../services/api/paymentApi';
import { 
  Search, Filter, Calendar, ChevronLeft, ChevronRight, Download, 
  RefreshCw, CheckCircle2, AlertCircle, Clock, Undo2
} from 'lucide-react';
import toast from 'react-hot-toast';

export function PaymentLedger() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [refundPayment, setRefundPayment] = useState<any>(null);
  const [refundReason, setRefundReason] = useState('');
  const [isRefunding, setIsRefunding] = useState(false);

  // Fetch Ledger Transactions
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ['admin-transactions', page, search, statusFilter],
    queryFn: () => paymentApi.getAdminTransactions({
      page,
      page_size: 10,
      search: search || undefined,
      status: statusFilter || undefined,
    }),
  });

  // Refund Mutation
  const refundMutation = useMutation({
    mutationFn: paymentApi.requestRefund,
    onSuccess: (res) => {
      toast.success(res.message || 'Refund requested successfully!');
      queryClient.invalidateQueries({ queryKey: ['admin-transactions'] });
      setRefundPayment(null);
      setRefundReason('');
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.detail || 'Failed to initiate refund. Please try again.');
    },
    onSettled: () => {
      setIsRefunding(false);
    }
  });

  const handleExportCSV = async (type: string) => {
    try {
      toast.loading('Preparing export...', { id: 'csv-loader' });
      const blob = await paymentApi.exportReport(type);
      toast.dismiss('csv-loader');

      // Trigger file download
      const url = window.URL.createObjectURL(new Blob([blob]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `payment_ledger_${type}_${new Date().toISOString().split('T')[0]}.csv`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.success('Ledger exported successfully!');
    } catch (err) {
      toast.dismiss('csv-loader');
      toast.error('Failed to export CSV report.');
    }
  };

  const handleRefundSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!refundPayment || !refundReason.trim()) return;
    setIsRefunding(true);
    refundMutation.mutate({
      payment_id: refundPayment.id,
      reason: refundReason,
    });
  };

  const handleDownloadReceipt = (receipt: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Failed to open receipt. Please allow popups.');
      return;
    }
    
    const receiptHtml = `
      <html>
        <head>
          <title>Receipt - ${receipt.receipt_no || 'Payment'}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1E293B; padding: 40px; margin: 0; }
            .receipt-container { max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F1F5F9; padding-bottom: 20px; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: 800; color: #2563EB; }
            .title { font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.1em; }
            .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
            .label { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; }
            .value { font-size: 14px; font-weight: 700; color: #1E293B; margin-top: 4px; }
            .amount-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px; position: relative; overflow: hidden; }
            .amount-val { font-size: 28px; font-weight: 900; color: #1E293B; margin-top: 4px; }
            .footer { text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9; padding-top: 20px; margin-top: 28px; }
            .stamp { border: 3px double #10B981; color: #10B981; display: inline-block; padding: 8px 16px; font-size: 16px; font-weight: 900; border-radius: 8px; transform: rotate(-8deg); position: absolute; right: 20px; top: 18px; text-transform: uppercase; }
            @media print {
              body { padding: 0; }
              .receipt-container { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="logo">BusLocator</div>
              <div class="title">Official Transaction Receipt</div>
            </div>
            
            <div class="amount-box">
              <div class="label" style="color: #2563EB;">Amount Paid</div>
              <div class="amount-val">₹${(receipt.amount ?? 0).toLocaleString('en-IN')}</div>
              <div class="stamp">${receipt.status === 'SUCCESS' ? 'PAID' : receipt.status}</div>
            </div>

            <div class="details-grid">
              <div>
                <div class="label">Receipt Number</div>
                <div class="value">${receipt.receipt_no || 'N/A'}</div>
              </div>
              <div>
                <div class="label">Transaction Status</div>
                <div class="value" style="color: ${receipt.status === 'SUCCESS' ? '#10B981' : '#EF4444'};">${receipt.status}</div>
              </div>
              <div>
                <div class="label">Student Name</div>
                <div class="value">${receipt.student_name}</div>
              </div>
              <div>
                <div class="label">Enrollment No</div>
                <div class="value">${receipt.enrollment_no}</div>
              </div>
              <div>
                <div class="label">Payment Gateway</div>
                <div class="value">${receipt.gateway}</div>
              </div>
              <div>
                <div class="label">Order ID</div>
                <div class="value">${receipt.order_id}</div>
              </div>
              <div>
                <div class="label">Transaction ID</div>
                <div class="value">${receipt.payment_id || 'N/A'}</div>
              </div>
              <div>
                <div class="label">Payment Date</div>
                <div class="value">${receipt.paid_at ? new Date(receipt.paid_at).toLocaleString() : new Date(receipt.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div class="footer">
              Computer-generated document. No signature required. Thank you.
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `;
    
    printWindow.document.write(receiptHtml);
    printWindow.document.close();
  };

  const items = data?.items || [];
  const total = data?.total || 0;
  const totalPages = Math.ceil(total / 10) || 1;

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'SUCCESS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
            <CheckCircle2 className="w-3.5 h-3.5" /> SUCCESS
          </span>
        );
      case 'FAILED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/50">
            <AlertCircle className="w-3.5 h-3.5" /> FAILED
          </span>
        );
      case 'REFUNDED':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200/50">
            <Undo2 className="w-3.5 h-3.5" /> REFUNDED
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
            <Clock className="w-3.5 h-3.5" /> CREATED
          </span>
        );
    }
  };

  return (
    <div className="space-y-lg max-w-[1200px] mx-auto pb-12">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight">Transaction Ledger</h1>
          <p className="text-slate-500 mt-1">Review student fees paid online, audit transaction details, and initiate refunds.</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => handleExportCSV('all')}
            className="inline-flex items-center gap-1.5 px-4 py-2 border border-slate-255 bg-white text-slate-700 font-bold rounded-xl text-sm transition hover:bg-slate-50"
          >
            <Download className="w-4 h-4" /> Export All
          </button>
          <button
            onClick={() => handleExportCSV('collected')}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white font-bold rounded-xl text-sm transition hover:bg-emerald-700"
          >
            <Download className="w-4 h-4" /> Export Collected
          </button>
        </div>
      </div>

      {/* Table & Filters Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl shadow-xs overflow-hidden">
        {/* Controls */}
        <div className="p-lg border-b border-slate-200 flex flex-col md:flex-row justify-between gap-4">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text"
              placeholder="Search student, order ID, payment ID, or receipt..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(1); }}
              className="w-full pl-9 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary"
            />
          </div>

          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1 text-slate-500 text-sm font-semibold">
              <Filter className="w-4 h-4" /> Filter Status:
            </div>
            <select
              value={statusFilter}
              onChange={e => { setStatusFilter(e.target.value); setPage(1); }}
              className="px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-primary cursor-pointer bg-white"
            >
              <option value="">All Transactions</option>
              <option value="SUCCESS">Success Only</option>
              <option value="FAILED">Failed Only</option>
              <option value="REFUNDED">Refunded Only</option>
              <option value="CREATED">Created Only</option>
            </select>
          </div>
        </div>

        {/* Content */}
        {isLoading ? (
          <div className="p-12 space-y-4 animate-pulse">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-6 bg-slate-100 rounded-lg w-full"></div>
            ))}
          </div>
        ) : isError ? (
          <div className="flex flex-col items-center justify-center p-12 text-center">
            <AlertCircle className="w-12 h-12 text-rose-500 mb-3" />
            <h3 className="text-lg font-bold text-slate-800">Failed to Retrieve Ledger</h3>
            <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl transition font-semibold text-xs flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> Retry Fetch
            </button>
          </div>
        ) : items.length === 0 ? (
          <div className="p-12 text-center text-slate-400">
            <AlertCircle className="w-12 h-12 text-slate-300 mx-auto mb-3" />
            <p className="text-sm font-semibold">No transactions recorded.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm whitespace-nowrap">
              <thead className="bg-slate-50 text-slate-500 border-b border-slate-100 font-semibold">
                <tr>
                  <th className="px-6 py-4">Receipt No</th>
                  <th className="px-6 py-4">Student Details</th>
                  <th className="px-6 py-4">Gateway / Inst.</th>
                  <th className="px-6 py-4">Transaction ID</th>
                  <th className="px-6 py-4">Amount</th>
                  <th className="px-6 py-4">Date</th>
                  <th className="px-6 py-4">Status</th>
                  <th className="px-6 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {items.map((row: any) => (
                  <tr key={row.id} className="hover:bg-slate-50/50">
                    <td className="px-6 py-4 font-bold text-slate-900 font-mono text-xs">{row.receipt_no || '—'}</td>
                    <td className="px-6 py-4">
                      <div className="text-slate-900 font-bold">{row.student_name}</div>
                      <div className="text-slate-400 text-xs font-normal font-mono">{row.enrollment_no}</div>
                    </td>
                    <td className="px-6 py-4 text-xs font-semibold">
                      <div>{row.gateway}</div>
                      <div className="text-slate-400 font-normal">Installment 0{row.installment_number}</div>
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-500 max-w-[140px] truncate" title={row.payment_id}>
                      {row.payment_id || row.order_id || '—'}
                    </td>
                    <td className="px-6 py-4 text-slate-900 font-bold">₹{row.amount.toLocaleString('en-IN')}</td>
                    <td className="px-6 py-4 text-slate-500 font-mono text-xs">
                      {row.paid_at ? new Date(row.paid_at).toLocaleString() : new Date(row.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4">{getStatusBadge(row.status)}</td>
                    <td className="px-6 py-4 text-right flex justify-end gap-2">
                      {row.status === 'SUCCESS' && (
                        <>
                          <button
                            onClick={() => handleDownloadReceipt(row)}
                            className="px-2.5 py-1 border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 font-bold rounded-lg transition text-xs bg-slate-50"
                          >
                            Receipt
                          </button>
                          <button
                            onClick={() => setRefundPayment(row)}
                            className="px-2.5 py-1 border border-rose-200 text-rose-700 hover:bg-rose-50 font-bold rounded-lg transition text-xs"
                          >
                            Refund
                          </button>
                        </>
                      )}
                      {row.status !== 'SUCCESS' && <span className="text-slate-350 text-xs font-bold">—</span>}
                    </td>
                  </tr>
                ))}
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

      {/* Refund Review Input Dialog */}
      {refundPayment && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100">
            <form onSubmit={handleRefundSubmit} className="flex flex-col">
              <div className="bg-rose-600 px-6 py-4 flex justify-between items-center text-white">
                <h3 className="font-bold text-lg">Initiate Payment Refund</h3>
                <button type="button" onClick={() => setRefundPayment(null)} className="text-rose-100 hover:text-white transition">
                  Close
                </button>
              </div>
              
              <div className="p-6 space-y-4">
                <div className="bg-rose-50 border border-rose-200/50 rounded-xl p-4 text-sm text-rose-800">
                  <p className="font-semibold">Refund Request Surcharge Notice</p>
                  <p className="text-xs text-rose-700/80 mt-1">
                    You are initiating a full refund of <strong>₹{refundPayment.amount.toLocaleString('en-IN')}</strong> for <strong>{refundPayment.student_name}</strong>.
                  </p>
                </div>

                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-650">Reason for Refund</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Enter reason (e.g. Student cancelled route subscription, duplicate transaction...)"
                    value={refundReason}
                    onChange={e => setRefundReason(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                  />
                </div>
              </div>

              <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefundPayment(null)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 font-bold rounded-xl transition text-sm hover:bg-slate-100"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isRefunding || !refundReason.trim()}
                  className="px-5 py-2.5 bg-rose-600 hover:bg-rose-750 text-white font-bold rounded-xl transition text-sm disabled:opacity-50"
                >
                  {isRefunding ? 'Initiating...' : 'Submit Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
