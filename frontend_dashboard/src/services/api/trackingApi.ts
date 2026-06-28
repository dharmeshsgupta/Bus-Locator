import { trackingClient } from './axios';

export const trackingApi = {
  getBusStatus: async (busId: string) => {
    const response = await trackingClient.get(`/api/v1/tracking/bus/${busId}`);
    return response.data;
  },
  getFleetLocations: async () => {
    const response = await trackingClient.get('/api/v1/tracking/fleet');
    return response.data.data; // returns the dict of {bus_id: location}
  },
  updateLocation: async (data: { bus_id: string; route_id: string; latitude: number; longitude: number; speed: number }) => {
    const response = await trackingClient.post('/api/v1/tracking/location', data);
    return response.data;
  },
  updateOccupancy: async (data: { bus_id: string; occupied: number }) => {
    const response = await trackingClient.post('/api/v1/tracking/occupancy', data);
    return response.data;
  },
  markWaiting: async (data: { route_id: string; stop_id: string; count?: number }) => {
    const response = await trackingClient.post('/api/v1/tracking/waiting', data);
    return response.data;
  }
};
