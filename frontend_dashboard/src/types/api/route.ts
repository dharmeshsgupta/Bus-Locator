export interface RouteStop {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  order: number;
  etaMinutes?: number;
}

export interface Route {
  id: string;
  name: string;
  startPoint: string;
  endPoint: string;
  stops: RouteStop[];
  isActive: boolean;
  assignedBusId?: string;
  polyline?: string; // Encoded polyline or coordinate array for map
}

export interface RouteResponse {
  data: Route;
}

export interface RoutesListResponse {
  data: Route[];
  total: number;
}
