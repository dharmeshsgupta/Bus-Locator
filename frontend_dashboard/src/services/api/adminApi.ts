import { transportClient, authClient } from './axios';

export const adminApi = {
  // Analytics
  getAnalytics: async () => {
    const response = await transportClient.get('/api/v1/health');
    return response.data;
  },
  
  // Routes
  getRoutes: async (params?: any) => {
    const response = await transportClient.get('/api/v1/routes', { params });
    return response.data;
  },
  createRoute: async (data: any) => {
    const response = await transportClient.post('/api/v1/routes', data);
    return response.data;
  },
  createCompleteRoute: async (data: any) => {
    const response = await transportClient.post('/api/v1/routes/wizard', data);
    return response.data;
  },
  updateRoute: async (id: string, data: any) => {
    const response = await transportClient.put(`/api/v1/routes/${id}`, data);
    return response.data;
  },
  deleteRoute: async (id: string) => {
    await transportClient.delete(`/api/v1/routes/${id}`);
  },

  // Stops
  getStopsByRoute: async (routeId: string, params?: any) => {
    const response = await transportClient.get(`/api/v1/stops/route/${routeId}`, { params });
    return response.data;
  },
  createStop: async (data: any) => {
    const response = await transportClient.post('/api/v1/stops', data);
    return response.data;
  },
  updateStop: async (id: string, data: any) => {
    const response = await transportClient.put(`/api/v1/stops/${id}`, data);
    return response.data;
  },
  deleteStop: async (id: string) => {
    await transportClient.delete(`/api/v1/stops/${id}`);
  },

  // Buses
  getBuses: async (params?: any) => {
    const response = await transportClient.get('/api/v1/buses', { params });
    return response.data;
  },
  createBus: async (data: any) => {
    const response = await transportClient.post('/api/v1/buses', data);
    return response.data;
  },
  updateBus: async (id: string, data: any) => {
    const response = await transportClient.put(`/api/v1/buses/${id}`, data);
    return response.data;
  },
  deleteBus: async (id: string) => {
    await transportClient.delete(`/api/v1/buses/${id}`);
  },

  // Assignments
  getStudentAssignments: async (params?: any) => {
    const response = await transportClient.get('/api/v1/assignments/student', { params });
    return response.data;
  },
  getDriverAssignments: async (params?: any) => {
    const response = await transportClient.get('/api/v1/assignments/driver', { params });
    return response.data;
  },
  assignStudent: async (data: { student_id: string; route_id: string; pickup_stop_id: string }) => {
    const response = await transportClient.post('/api/v1/assignments/student', data);
    return response.data;
  },
  assignDriver: async (data: { driver_id: string; bus_id: string }) => {
    const response = await transportClient.post('/api/v1/assignments/driver', data);
    return response.data;
  },

  // Auth/User Creation
  createStudent: async (data: any) => {
    const response = await authClient.post('/auth/student/register', data);
    return response.data;
  },
  createDriver: async (data: any) => {
    const response = await authClient.post('/auth/driver/register', data);
    return response.data;
  },

  // Student Me endpoints (for student dashboard)
  getMyRoute: async () => {
    const response = await transportClient.get('/api/v1/me/route');
    return response.data;
  },
  getMyStop: async () => {
    const response = await transportClient.get('/api/v1/me/stop');
    return response.data;
  },
  getMyBus: async () => {
    const response = await transportClient.get('/api/v1/me/bus');
    return response.data;
  },
};
