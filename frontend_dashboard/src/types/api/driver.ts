import { User } from './auth';

export interface Driver extends User {
  licenseNumber: string;
  assignedBusId?: string;
  currentRouteId?: string;
  isActive: boolean;
}

export interface DriverResponse {
  data: Driver;
}

export interface DriversListResponse {
  data: Driver[];
  total: number;
}
