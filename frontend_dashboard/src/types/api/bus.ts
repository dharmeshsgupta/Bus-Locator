export interface Bus {
  id: string;
  registrationNumber: string;
  capacity: number;
  model: string;
  isActive: boolean;
  assignedDriverId?: string;
}

export interface BusLocation {
  busId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

export interface BusResponse {
  data: Bus;
}

export interface BusesListResponse {
  data: Bus[];
  total: number;
}
