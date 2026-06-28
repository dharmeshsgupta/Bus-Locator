import { create } from 'zustand';
import { FeeStatus, PaymentTransaction } from '../types/api/payment';

interface PaymentState {
  feeStatus: FeeStatus | null;
  paymentHistory: PaymentTransaction[];
  isLoading: boolean;
  
  setFeeStatus: (status: FeeStatus) => void;
  setPaymentHistory: (history: PaymentTransaction[]) => void;
  setLoading: (isLoading: boolean) => void;
  addTransaction: (transaction: PaymentTransaction) => void;
}

export const usePaymentStore = create<PaymentState>((set) => ({
  feeStatus: null,
  paymentHistory: [],
  isLoading: false,

  setFeeStatus: (status) => set({ feeStatus: status }),
  setPaymentHistory: (history) => set({ paymentHistory: history }),
  setLoading: (isLoading) => set({ isLoading }),
  addTransaction: (transaction) => set((state) => ({ paymentHistory: [transaction, ...state.paymentHistory] })),
}));
