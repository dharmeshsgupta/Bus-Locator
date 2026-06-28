import { transportClient, trackingClient } from './axios';

export const studentApi = {
  getAssignment: async () => {
    const response = await transportClient.get('/api/v1/assignments/students/me');
    return response.data;
  },
  markWaiting: async (routeId: string, stopId: string, count: number = 1) => {
    // Waiting updates go to Tracking Service
    const response = await trackingClient.post('/api/v1/waiting/update', { route_id: routeId, stop_id: stopId, count });
    return response.data;
  },
  getStopsByRoute: async (routeId: string) => {
    const response = await transportClient.get(`/api/v1/stops/route/${routeId}`);
    return response.data;
  }
};
