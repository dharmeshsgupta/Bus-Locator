import { authClient } from './axios';
import { RazorpayOrderRequest, RazorpayOrderResponse, PaymentHistoryItem } from '../../types/api/payment';

export const paymentApi = {
  createOrder: async (data: RazorpayOrderRequest): Promise<RazorpayOrderResponse> => {
    const response = await authClient.post('/payment/create-order', data);
    return response.data;
  },
  getHistory: async (): Promise<PaymentHistoryItem[]> => {
    const response = await authClient.get('/payment/student/history');
    return response.data;
  },

  
  // --- Admin Fee Panel ---
  getAdminFees: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
  }): Promise<{ items: any[]; total: number; page: number; page_size: number }> => {
    const response = await authClient.get('/payment/admin/fees', { params });
    return response.data;
  },
  updateGlobalFees: async (data: {
    installment_1_amount: number;
    installment_1_deadline: string;
    installment_2_amount: number;
    installment_2_deadline: string;
  }) => {
    const response = await authClient.post('/payment/admin/fees/global', data);
    return response.data;
  },
  updateStudentFee: async (studentId: string, data: any) => {
    const response = await authClient.put(`/payment/admin/fees/student/${studentId}`, data);
    return response.data;
  },

  // --- Student Fee View ---
  getStudentFees: async () => {
    const response = await authClient.get('/payment/student/fees');
    return response.data;
  },
  payInstallment: async (installment: number) => {
    const response = await authClient.post('/payment/student/pay', { installment });
    return response.data;
  },

  // --- Enterprise Finance & Analytics ---
  getFinanceStats: async () => {
    const response = await authClient.get('/payment/admin/dashboard');
    return response.data;
  },
  getFinanceCharts: async () => {
    const response = await authClient.get('/payment/admin/charts');
    return response.data;
  },
  getAdminTransactions: async (params?: {
    page?: number;
    page_size?: number;
    search?: string;
    status?: string;
  }) => {
    const response = await authClient.get('/payment/admin/payments', { params });
    return response.data;
  },
  getPaymentById: async (id: string) => {
    const response = await authClient.get(`/payment/admin/payment/${id}`);
    return response.data;
  },
  requestRefund: async (data: { payment_id: string; reason: string }) => {
    const response = await authClient.post('/payment/admin/refund', data);
    return response.data;
  },
  processRefund: async (data: { refund_id: string; action: 'APPROVE' | 'REJECT' }) => {
    const response = await authClient.post('/payment/admin/refund/review', data);
    return response.data;
  },
  getRefunds: async () => {
    const response = await authClient.get('/payment/admin/refunds');
    return response.data;
  },
  getStudentRefunds: async () => {
    const response = await authClient.get('/payment/student/refunds');
    return response.data;
  },
  getFinanceSettings: async () => {
    const response = await authClient.get('/payment/admin/settings');
    return response.data;
  },
  updateFinanceSettings: async (data: any) => {
    const response = await authClient.put('/payment/admin/settings', data);
    return response.data;
  },
  getAuditLogs: async (params?: { page?: number; page_size?: number; search?: string }) => {
    const response = await authClient.get('/payment/admin/audit', { params });
    return response.data;
  },
  exportReport: async (reportType: string) => {
    const response = await authClient.get('/payment/admin/report', {
      params: { report_type: reportType },
      responseType: 'blob'
    });
    return response.data;
  },
  triggerLateFeesCron: async () => {
    const response = await authClient.post('/payment/cron/late-fees');
    return response.data;
  }
};
