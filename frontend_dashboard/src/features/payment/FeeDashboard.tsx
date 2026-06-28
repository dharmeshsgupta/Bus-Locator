import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { paymentApi } from '../../services/api/paymentApi';
import { CreditCard, CheckCircle, AlertCircle, Calendar, ShieldCheck, Clock, Download, X, HelpCircle, FileText, ArrowRight } from 'lucide-react';
import toast from 'react-hot-toast';
import { authClient } from '../../services/api/axios';

// Helper to dynamically load script
const loadRazorpayScript = () => {
  return new Promise((resolve) => {
    if ((window as any).Razorpay) {
      resolve(true);
      return;
    }
    const script = document.createElement('script');
    script.src = 'https://checkout.razorpay.com/v1/checkout.js';
    script.async = true;
    script.onload = () => resolve(true);
    script.onerror = () => resolve(false);
    document.body.appendChild(script);
  });
};

export function FeeDashboard() {
  const queryClient = useQueryClient();
  const [sandboxOrder, setSandboxOrder] = useState<any>(null);
  const [showSandboxModal, setShowSandboxModal] = useState(false);
  const [successDetails, setSuccessDetails] = useState<any>(null);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [isSimulating, setIsSimulating] = useState(false);

  // Fetch Student Fees
  const { data: feeData, isLoading, isError, refetch } = useQuery({
    queryKey: ['student-fees'],
    queryFn: paymentApi.getStudentFees,
  });

  // Fetch Payment History
  const { data: historyData, isLoading: historyLoading } = useQuery({
    queryKey: ['student-payment-history'],
    queryFn: paymentApi.getHistory,
  });

  if (isLoading || historyLoading) {
    return (
      <div className="space-y-6 animate-pulse p-4">
        <div className="h-8 bg-slate-200 rounded w-1/4"></div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
          <div className="h-32 bg-slate-200 rounded-xl"></div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="h-64 bg-slate-200 rounded-xl"></div>
          <div className="h-64 bg-slate-200 rounded-xl"></div>
        </div>
      </div>
    );
  }

  if (isError || !feeData) {
    return (
      <div className="flex flex-col items-center justify-center p-12 text-center">
        <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
        <h3 className="text-xl font-bold text-slate-800">Failed to Load Fee Details</h3>
        <p className="text-slate-500 mt-2 max-w-sm">We couldn't retrieve your transport fee statement. Please try again.</p>
        <button onClick={() => refetch()} className="mt-4 px-4 py-2 bg-primary text-white rounded-xl hover:bg-blue-700 transition">
          Retry
        </button>
      </div>
    );
  }

  const {
    student_name,
    enrollment_no,
    total_fee,
    total_paid,
    remaining_amount,
    installment_1,
    installment_2,
  } = feeData;

  const handlePay = async (installmentNumber: number) => {
    try {
      toast.loading('Initializing secure payment gateway...', { id: 'payment-loader' });
      
      const orderData = await paymentApi.createOrder({ installment_number: installmentNumber });
      toast.dismiss('payment-loader');

      // Check if sandbox placeholder is used
      if (orderData.key_id === 'rzp_test_placeholder') {
        // Open the custom sandbox modal for test simulation
        setSandboxOrder({
          order_id: orderData.razorpay_order_id,
          installment: installmentNumber,
          amount: orderData.amount / 100,
        });
        setShowSandboxModal(true);
        return;
      }

      // Load Razorpay Script for real checkout
      const isLoaded = await loadRazorpayScript();
      if (!isLoaded) {
        toast.error('Failed to load Razorpay SDK. Please check your internet connection.');
        return;
      }

      // Configure Razorpay Options
      const options = {
        key: orderData.key_id,
        amount: orderData.amount,
        currency: orderData.currency,
        name: 'BusLocator Campus Transport',
        description: `Installment ${installmentNumber} Transport Fee`,
        order_id: orderData.razorpay_order_id,
        handler: async function (response: any) {
          toast.success('Payment authorized. Webhook updates pending...');
          
          setSuccessDetails({
            orderId: orderData.razorpay_order_id,
            paymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
            installment: installmentNumber,
            amount: orderData.amount / 100,
          });
          setShowSuccessModal(true);
          
          // Invalidate cache
          queryClient.invalidateQueries({ queryKey: ['student-fees'] });
          queryClient.invalidateQueries({ queryKey: ['student-payment-history'] });
        },
        prefill: {
          name: student_name || '',
        },
        theme: {
          color: '#2563EB',
        },
        modal: {
          ondismiss: function () {
            toast.error('Payment checkout dismissed.');
          }
        }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      toast.dismiss('payment-loader');
      console.error(err);
      toast.error(err.response?.data?.detail || 'Failed to initialize payment. Please try again.');
    }
  };

  const handleSimulateWebhookSuccess = async () => {
    if (!sandboxOrder || isSimulating) return;
    setIsSimulating(true);
    toast.loading('Simulating server-to-server webhook callback...', { id: 'webhook-loader' });
    
    try {
      const mockPaymentId = `pay_mock_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
      // Call the webhook endpoint on auth service (port 8000)
      await authClient.post('/payment/webhook', {
        event: 'order.paid',
        payload: {
          payment: {
            entity: {
              id: mockPaymentId,
              order_id: sandboxOrder.order_id,
              amount: sandboxOrder.amount * 100,
              currency: 'INR',
              status: 'captured',
            }
          },
          order: {
            entity: {
              id: sandboxOrder.order_id,
              status: 'paid',
            }
          }
        }
      });
      
      toast.dismiss('webhook-loader');
      toast.success('Webhook processed successfully! Database updated.');
      
      // Update success details & show modal
      setSuccessDetails({
        orderId: sandboxOrder.order_id,
        paymentId: mockPaymentId,
        signature: 'sandbox_mock_signature',
        installment: sandboxOrder.installment,
        amount: sandboxOrder.amount,
      });
      setShowSandboxModal(false);
      setShowSuccessModal(true);
      
      // Invalidate react-query cache immediately
      queryClient.invalidateQueries({ queryKey: ['student-fees'] });
      queryClient.invalidateQueries({ queryKey: ['student-payment-history'] });
    } catch (err: any) {
      toast.dismiss('webhook-loader');
      console.error(err);
      toast.error(err.response?.data?.detail || 'Webhook simulation failed. Ensure backend server is running.');
    } finally {
      setIsSimulating(false);
    }
  };

  const handleDownloadReceipt = (receipt: any) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) {
      toast.error('Failed to open invoice popup. Please allow popups.');
      return;
    }
    
    const receiptHtml = `
      <html>
        <head>
          <title>Receipt - ${receipt.receipt_no || 'Payment'}</title>
          <style>
            body { font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; color: #1E293B; padding: 40px; margin: 0; }
            .receipt-container { max-width: 600px; margin: 0 auto; border: 1px solid #E2E8F0; border-radius: 16px; padding: 32px; box-shadow: 0 4px 12px rgba(0,0,0,0.05); position: relative; }
            .header { display: flex; justify-content: space-between; align-items: center; border-bottom: 2px solid #F1F5F9; padding-bottom: 20px; margin-bottom: 24px; }
            .logo { font-size: 24px; font-weight: 800; color: #2563EB; }
            .title { font-size: 12px; font-weight: 700; color: #64748B; text-transform: uppercase; letter-spacing: 0.1em; }
            .details-grid { display: grid; grid-template-cols: 1fr 1fr; gap: 20px; margin-bottom: 28px; }
            .label { font-size: 11px; font-weight: 600; color: #94A3B8; text-transform: uppercase; letter-spacing: 0.05em; }
            .value { font-size: 14px; font-weight: 700; color: #1E293B; margin-top: 4px; }
            .amount-box { background: #F8FAFC; border: 1px solid #E2E8F0; border-radius: 12px; padding: 20px; text-align: center; margin-bottom: 28px; position: relative; overflow: hidden; }
            .amount-val { font-size: 28px; font-weight: 900; color: #1E293B; margin-top: 4px; }
            .footer { text-align: center; font-size: 12px; color: #94A3B8; border-top: 1px solid #F1F5F9; padding-top: 20px; margin-top: 28px; line-height: 1.5; }
            .stamp { border: 3px double #10B981; color: #10B981; display: inline-block; padding: 8px 16px; font-size: 16px; font-weight: 900; border-radius: 8px; transform: rotate(-8deg); position: absolute; right: 20px; top: 18px; text-transform: uppercase; letter-spacing: 0.15em; }
            @media print {
              body { padding: 0; background: none; }
              .receipt-container { border: none; box-shadow: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="receipt-container">
            <div class="header">
              <div class="logo">BusLocator</div>
              <div class="title">E-RECEIPT FOR TRANSPORT</div>
            </div>
            
            <div class="amount-box">
              <div class="label" style="color: #2563EB;">Amount Paid (INR)</div>
              <div class="amount-val">₹${(receipt.amount ?? 0).toLocaleString('en-IN')}</div>
              <div class="stamp">PAID</div>
            </div>

            <div class="details-grid">
              <div>
                <div class="label">Receipt Number</div>
                <div class="value">${receipt.receipt_no || 'N/A'}</div>
              </div>
              <div>
                <div class="label">Transaction Status</div>
                <div class="value" style="color: #10B981;">${receipt.status}</div>
              </div>
              <div>
                <div class="label">Student Name</div>
                <div class="value">${student_name}</div>
              </div>
              <div>
                <div class="label">Enrollment No</div>
                <div class="value">${enrollment_no}</div>
              </div>
              <div>
                <div class="label">Payment Gateway</div>
                <div class="value">${receipt.gateway}</div>
              </div>
              <div>
                <div class="label">Transaction ID</div>
                <div class="value">${receipt.id}</div>
              </div>
              <div>
                <div class="label">Installment No</div>
                <div class="value">Installment 0${receipt.installment_number}</div>
              </div>
              <div>
                <div class="label">Payment Date</div>
                <div class="value">${receipt.paid_at ? new Date(receipt.paid_at).toLocaleString() : new Date(receipt.created_at).toLocaleString()}</div>
              </div>
            </div>

            <div class="footer">
              Thank you for using BusLocator online payment portal.<br>
              This is a computer-generated transaction document, hence requires no signature.
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

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'paid':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/50">
            <CheckCircle className="w-3.5 h-3.5" />
            Paid
          </span>
        );
      case 'overdue':
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200/50 animate-pulse">
            <AlertCircle className="w-3.5 h-3.5" />
            Overdue
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-blue-50 text-blue-700 border border-blue-200/50">
            <Clock className="w-3.5 h-3.5" />
            Pending
          </span>
        );
    }
  };

  return (
    <div className="space-y-lg max-w-[1200px] mx-auto pb-12">
      {/* Title Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <ShieldCheck className="text-primary w-8 h-8" />
            Campus Transport Portal
          </h1>
          <p className="text-slate-500 mt-1">
            Review transport fee statement and pay secure online installments using Razorpay gateway.
          </p>
        </div>
      </div>

      {/* Student Metadata Card */}
      <div className="bg-white border border-slate-200/80 rounded-2xl p-md flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 shadow-xs">
        <div>
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Student Profile</p>
          <h2 className="text-lg font-bold text-slate-800 mt-0.5">{student_name}</h2>
        </div>
        <div className="sm:text-right">
          <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">Enrollment No</p>
          <p className="text-body-md font-bold text-slate-700 font-mono mt-0.5">{enrollment_no}</p>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-md">
        <div className="bg-white border border-slate-200/85 rounded-2xl p-lg shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Transport Fee</p>
            <p className="text-headline-lg font-black text-slate-900 mt-1">₹{(total_fee ?? 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center text-slate-500">
            <CreditCard className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/85 rounded-2xl p-lg shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Total Amount Paid</p>
            <p className="text-headline-lg font-black text-emerald-600 mt-1">₹{(total_paid ?? 0).toLocaleString('en-IN')}</p>
          </div>
          <div className="w-12 h-12 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center justify-center text-emerald-500">
            <CheckCircle className="w-6 h-6" />
          </div>
        </div>

        <div className="bg-white border border-slate-200/85 rounded-2xl p-lg shadow-xs flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold text-slate-400 uppercase tracking-wider">Remaining Balance</p>
            <p className={`text-headline-lg font-black mt-1 ${remaining_amount > 0 ? 'text-primary' : 'text-slate-500'}`}>
              ₹{(remaining_amount ?? 0).toLocaleString('en-IN')}
            </p>
          </div>
          <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${remaining_amount > 0 ? 'bg-blue-50 border border-blue-100 text-primary' : 'bg-slate-50 border border-slate-100 text-slate-400'}`}>
            <AlertCircle className="w-6 h-6" />
          </div>
        </div>
      </div>

      {/* Installment Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-lg mt-sm">
        {/* Installment 1 */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-lg shadow-xs flex flex-col justify-between hover:border-slate-300 transition duration-200">
          <div>
            <div className="flex justify-between items-center mb-md">
              <h3 className="text-headline-md font-bold text-slate-900">Installment 01</h3>
              {getStatusBadge(installment_1.status)}
            </div>
            
            <div className="space-y-sm mb-lg">
              <div className="flex justify-between py-1 border-b border-slate-50 text-body-sm">
                <span className="text-slate-400 font-semibold">Amount</span>
                <span className="font-bold text-slate-800">₹{(installment_1.amount ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-body-sm">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due Date
                </span>
                <span className="font-bold text-slate-800 font-mono">{installment_1.deadline || '—'}</span>
              </div>
              {installment_1.status === 'paid' && (
                <div className="flex justify-between py-1 border-b border-slate-50 text-body-sm">
                  <span className="text-slate-400 font-semibold">Payment Date</span>
                  <span className="font-bold text-emerald-600 font-mono">{installment_1.payment_date || '—'}</span>
                </div>
              )}
            </div>
          </div>

          {installment_1.status !== 'paid' && (
            <button
              onClick={() => handlePay(1)}
              className="w-full py-3 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl transition duration-200 shadow-sm shadow-blue-500/10 active:scale-[0.98]"
            >
              Pay Installment 01
            </button>
          )}
        </div>

        {/* Installment 2 */}
        <div className="bg-white border border-slate-200/85 rounded-2xl p-lg shadow-xs flex flex-col justify-between hover:border-slate-300 transition duration-200">
          <div>
            <div className="flex justify-between items-center mb-md">
              <h3 className="text-headline-md font-bold text-slate-900">Installment 02</h3>
              {getStatusBadge(installment_2.status)}
            </div>
            
            <div className="space-y-sm mb-lg">
              <div className="flex justify-between py-1 border-b border-slate-50 text-body-sm">
                <span className="text-slate-400 font-semibold">Amount</span>
                <span className="font-bold text-slate-800">₹{(installment_2.amount ?? 0).toLocaleString('en-IN')}</span>
              </div>
              <div className="flex justify-between py-1 border-b border-slate-50 text-body-sm">
                <span className="text-slate-400 font-semibold flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-slate-400" /> Due Date
                </span>
                <span className="font-bold text-slate-800 font-mono">{installment_2.deadline || '—'}</span>
              </div>
              {installment_2.status === 'paid' && (
                <div className="flex justify-between py-1 border-b border-slate-50 text-body-sm">
                  <span className="text-slate-400 font-semibold">Payment Date</span>
                  <span className="font-bold text-emerald-600 font-mono">{installment_2.payment_date || '—'}</span>
                </div>
              )}
            </div>
          </div>

          {installment_2.status !== 'paid' && (
            <button
              onClick={() => handlePay(2)}
              className="w-full py-3 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl transition duration-200 shadow-sm shadow-blue-500/10 active:scale-[0.98]"
            >
              Pay Installment 02
            </button>
          )}
        </div>
      </div>

      {/* Payment History List */}
      <div className="bg-white border border-slate-200/85 rounded-2xl p-lg shadow-xs mt-lg">
        <h3 className="text-lg font-bold text-slate-900 mb-lg">Payment Transaction Logs</h3>
        
        {!historyData || historyData.length === 0 ? (
          <div className="p-8 text-center text-slate-400 border border-dashed border-slate-100 rounded-xl">
            <p className="text-body-sm font-semibold">No transactions recorded yet.</p>
            <p className="text-xs text-slate-400/80 mt-1">Real-time gateway payments will generate downloadable receipts here.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 font-semibold">
                <tr>
                  <th className="px-4 py-3 rounded-l-lg">Installment</th>
                  <th className="px-4 py-3">Amount</th>
                  <th className="px-4 py-3">Gateway</th>
                  <th className="px-4 py-3">Transaction ID</th>
                  <th className="px-4 py-3">Payment Date</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 rounded-r-lg text-right">Receipt</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                {historyData.map((tx: any) => (
                  <tr key={tx.id} className="hover:bg-slate-50/50">
                    <td className="px-4 py-3.5 font-bold">Installment 0{tx.installment_number}</td>
                    <td className="px-4 py-3.5 text-slate-900 font-semibold">₹{(tx.amount ?? 0).toLocaleString('en-IN')}</td>
                    <td className="px-4 py-3.5 font-mono text-xs">{tx.gateway}</td>
                    <td className="px-4 py-3.5 font-mono text-xs text-slate-500 truncate max-w-[140px]" title={tx.id}>
                      {tx.receipt_no || tx.id.slice(0, 18)}
                    </td>
                    <td className="px-4 py-3.5 text-slate-500 font-mono text-xs">
                      {tx.paid_at ? new Date(tx.paid_at).toLocaleString() : new Date(tx.created_at).toLocaleString()}
                    </td>
                    <td className="px-4 py-3.5">
                      <span className={`inline-flex items-center gap-1 text-xs font-bold ${
                        tx.status === 'SUCCESS' ? 'text-emerald-600 bg-emerald-50 border border-emerald-200/50 px-2 py-0.5 rounded-full' :
                        tx.status === 'FAILED' ? 'text-rose-600 bg-rose-50 border border-rose-200/50 px-2 py-0.5 rounded-full' :
                        'text-blue-600 bg-blue-50 border border-blue-200/50 px-2 py-0.5 rounded-full'
                      }`}>
                        {tx.status === 'SUCCESS' && <CheckCircle className="w-3 h-3" />}
                        {tx.status === 'FAILED' && <AlertCircle className="w-3 h-3" />}
                        {tx.status === 'CREATED' && <Clock className="w-3 h-3" />}
                        {tx.status}
                      </span>
                    </td>
                    <td className="px-4 py-3.5 text-right">
                      {tx.status === 'SUCCESS' ? (
                        <button
                          onClick={() => handleDownloadReceipt(tx)}
                          className="inline-flex items-center gap-1.5 px-3 py-1 border border-slate-200 text-slate-700 hover:border-blue-500 hover:text-blue-600 font-bold rounded-lg transition text-xs bg-slate-50"
                        >
                          <Download className="w-3 h-3" />
                          Receipt
                        </button>
                      ) : (
                        <span className="text-slate-400 text-xs">—</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Razorpay Sandbox Simulation Modal */}
      {showSandboxModal && sandboxOrder && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col" style={{ minWidth: '380px', maxWidth: '485px' }}>
            <div className="bg-blue-600 px-6 py-4 flex justify-between items-center text-white">
              <div className="flex items-center gap-2">
                <HelpCircle className="w-5 h-5 animate-pulse" />
                <h3 className="font-bold text-lg">Razorpay Sandbox Simulator</h3>
              </div>
              <button onClick={() => setShowSandboxModal(false)} className="text-blue-100 hover:text-white transition">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4 flex-1">
              <div className="bg-blue-50 border border-blue-200/50 rounded-xl p-4 text-sm text-blue-800">
                <p className="font-semibold">Local Sandbox Mode Active</p>
                <p className="text-xs text-blue-700/80 mt-1">
                  You are seeing this simulator because <strong>RAZORPAY_KEY_ID</strong> in your <code>.env</code> file is set to the default placeholder.
                </p>
              </div>
              <div className="space-y-2 border-y border-slate-100 py-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Gateway Order ID</span>
                  <span className="font-mono font-bold text-slate-800 text-xs">{sandboxOrder.order_id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Installment</span>
                  <span className="font-bold text-slate-800">Installment 0{sandboxOrder.installment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Amount to Pay</span>
                  <span className="font-bold text-slate-900 font-mono">₹{sandboxOrder.amount.toLocaleString('en-IN')}</span>
                </div>
              </div>
              <p className="text-xs text-slate-500 leading-relaxed">
                Clicking "Simulate Payment Success" will trigger a server-to-server webhook callback to your local backend API (<code>POST /payment/webhook</code>). This tests the entire signature bypass (sandbox), db updates, and UI invalidation.
              </p>
            </div>
            <div className="bg-slate-50 px-6 py-4 flex gap-3 justify-end border-t border-slate-100">
              <button
                onClick={() => setShowSandboxModal(false)}
                disabled={isSimulating}
                className="px-4 py-2 border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-xl transition text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleSimulateWebhookSuccess}
                disabled={isSimulating}
                className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl transition text-sm flex items-center gap-1.5 shadow-sm shadow-emerald-500/10 disabled:opacity-50"
              >
                {isSimulating ? 'Simulating...' : 'Simulate Payment Success'}
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Gorgeous Payment Success Modal */}
      {showSuccessModal && successDetails && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl overflow-hidden border border-slate-100 flex flex-col text-center" style={{ minWidth: '380px', maxWidth: '485px' }}>
            <div className="p-8 space-y-6">
              <div className="mx-auto w-16 h-16 bg-emerald-50 rounded-full flex items-center justify-center text-emerald-600 border border-emerald-100">
                <CheckCircle className="w-10 h-10 animate-bounce" />
              </div>
              <div>
                <h3 className="text-2xl font-black text-slate-900">Payment Successful!</h3>
                <p className="text-slate-500 text-sm mt-1.5">
                  Your transport installment fee has been securely processed.
                </p>
              </div>
              
              <div className="bg-slate-50 rounded-xl p-4 text-left text-sm space-y-2 border border-slate-100">
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Installment Paid</span>
                  <span className="font-bold text-slate-800">Installment 0{successDetails.installment}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Amount Paid</span>
                  <span className="font-bold text-slate-900 font-mono">₹{successDetails.amount.toLocaleString('en-IN')}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400 font-semibold">Transaction ID</span>
                  <span className="font-mono text-xs text-slate-600 select-all truncate max-w-[180px]">{successDetails.paymentId}</span>
                </div>
              </div>

              <div className="flex flex-col gap-2">
                <button
                  onClick={() => {
                    setShowSuccessModal(false);
                    // Find the newly added item from cache to print receipt
                    const newTx = historyData?.find((h: any) => h.razorpay_order_id === successDetails.orderId) || {
                      id: successDetails.paymentId,
                      installment_number: successDetails.installment,
                      gateway: 'RAZORPAY',
                      amount: successDetails.amount,
                      status: 'SUCCESS',
                      created_at: new Date().toISOString(),
                      paid_at: new Date().toISOString(),
                    };
                    handleDownloadReceipt(newTx);
                  }}
                  className="w-full py-3 bg-primary hover:bg-blue-700 text-white font-bold rounded-xl transition duration-200 shadow-sm flex items-center justify-center gap-1.5"
                >
                  <FileText className="w-4 h-4" />
                  Print Official Receipt
                </button>
                <button
                  onClick={() => setShowSuccessModal(false)}
                  className="w-full py-3 text-slate-600 hover:text-slate-900 font-bold text-sm transition"
                >
                  Return to Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
