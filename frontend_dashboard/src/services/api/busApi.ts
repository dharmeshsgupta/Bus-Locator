import { transportClient, trackingClient } from './axios';

export const busApi = {
  getBuses: async (page = 1, pageSize = 20) => {
    const response = await transportClient.get('/api/v1/buses', { params: { page, page_size: pageSize } });
    return response.data;
  },
  getBusLocation: async (busId: string) => {
    const response = await trackingClient.get(`/api/v1/tracking/bus/${busId}`);
    return response.data;
  }
};
