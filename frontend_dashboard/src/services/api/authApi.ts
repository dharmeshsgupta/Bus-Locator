import { authClient } from './axios';
import { LoginResponse } from '../../types/api/auth';

export const authApi = {
  studentLogin: async (data: any): Promise<LoginResponse> => {
    const response = await authClient.post('/auth/student/login', data);
    return response.data;
  },
  driverLogin: async (data: any): Promise<LoginResponse> => {
    const response = await authClient.post('/auth/driver/login', data);
    return response.data;
  },
  adminLogin: async (data: any): Promise<LoginResponse> => {
    const response = await authClient.post('/auth/admin/login', data);
    return response.data;
  },
  getMe: async (): Promise<any> => {
    const response = await authClient.get('/auth/me');
    return response.data;
  },
  getUsers: async (role: 'student' | 'driver' | 'admin') => {
    const res = await authClient.get(`/auth/users?role=${role}`);
    return res.data;
  },
  sendOTP: async (data: { phone: string }) => {
    const response = await authClient.post('/auth/send-otp', data);
    return response.data;
  },

  async updateStudent(id: string, data: { name?: string; email?: string; phone?: string; enrollment_no?: string }) {
    const res = await authClient.put(`/auth/users/${id}/student`, data);
    return res.data;
  },

  async updateDriver(id: string, data: { name?: string; phone?: string; license_number?: string }) {
    const res = await authClient.put(`/auth/users/${id}/driver`, data);
    return res.data;
  },

  async deleteUser(id: string) {
    const res = await authClient.delete(`/auth/users/${id}`);
    return res.data;
  }
};
