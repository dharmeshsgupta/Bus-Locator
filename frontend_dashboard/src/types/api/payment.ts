export interface FeeStatus {
  studentId: string;
  status: 'paid' | 'pending' | 'overdue';
  amountDue: number;
  dueDate: string;
}

export interface PaymentTransaction {
  id: string;
  studentId: string;
  amount: number;
  currency: string;
  status: 'success' | 'failed' | 'pending';
  gatewayOrderId: string;
  gatewayPaymentId?: string;
  createdAt: string;
}

export interface PaymentOrderRequest {
  studentId: string;
  amount: number;
  currency?: string;
}

export interface PaymentOrderResponse {
  orderId: string;
  amount: number;
  currency: string;
  key: string;
}

export interface RazorpayOrderRequest {
  installment_number: number;
}

export interface RazorpayOrderResponse {
  razorpay_order_id: string;
  amount: number; // in paise
  currency: string;
  key_id: string;
}

export interface PaymentHistoryItem {
  id: string;
  installment_number: number;
  gateway: string;
  amount: number;
  receipt_no?: string;
  status: string;
  created_at: string;
  paid_at?: string;
}

