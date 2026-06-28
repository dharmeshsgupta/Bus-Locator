import { transportClient, trackingClient } from './axios';

export interface DriverAssignment {
  driver: { id: string };
  bus: { id: string; bus_number: string; registration_number: string; capacity: number } | null;
  route: { id: string; route_name: string; route_code: string } | null;
  stops: Array<{ id: string; stop_name: string; sequence_number: number; latitude: number; longitude: number }>;
  schedule: { expected_duration_minutes: number };
  assignment_status: string;
  route_status: string;
}

export const driverApi = {
  // Fetch current assignment
  getMyAssignment: async (): Promise<DriverAssignment> => {
    const res = await transportClient.get('/api/v1/assignments/drivers/me');
    return res.data;
  },

  // Route Lifecycle
  startRoute: async (data: { bus_id: string; route_id: string }) => {
    return trackingClient.post('/api/v1/tracking/route/start', { ...data, status: 'IN_PROGRESS' });
  },
  pauseRoute: async (data: { bus_id: string; route_id: string }) => {
    return trackingClient.post('/api/v1/tracking/route/pause', { ...data, status: 'PAUSED' });
  },
  resumeRoute: async (data: { bus_id: string; route_id: string }) => {
    return trackingClient.post('/api/v1/tracking/route/resume', { ...data, status: 'IN_PROGRESS' });
  },
  endRoute: async (data: { bus_id: string; route_id: string }) => {
    return trackingClient.post('/api/v1/tracking/route/end', { ...data, status: 'COMPLETED' });
  },

  // Location
  publishLocation: async (data: { bus_id: string; route_id: string; latitude: number; longitude: number; speed: number; accuracy: number }) => {
    return trackingClient.post('/api/v1/tracking/location', data);
  },

  // Occupancy
  updateOccupancy: async (data: { bus_id: string; route_id: string; occupancy_change: number }) => {
    return trackingClient.post('/api/v1/tracking/occupancy', data);
  },

  // Emergency
  reportEmergency: async (data: { bus_id: string; route_id: string; type: string; message: string }) => {
    return trackingClient.post('/api/v1/tracking/emergency', data);
  }
};
