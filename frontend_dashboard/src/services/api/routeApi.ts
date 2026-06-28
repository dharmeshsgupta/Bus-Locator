import { transportClient } from './axios';

export const routeApi = {
  getRoutes: async (page = 1, pageSize = 20) => {
    const response = await transportClient.get('/api/v1/routes', { params: { page, page_size: pageSize } });
    return response.data;
  },
  getRouteDetails: async (routeId: string) => {
    const response = await transportClient.get(`/api/v1/routes/${routeId}`);
    return response.data;
  },
  getStops: async () => {
    const response = await transportClient.get('/api/v1/stops');
    return response.data;
  }
};
