// Define Backend DTOs
export interface BusLocationDTO {
  bus_id: string;
  route_id: string;
  lat: number;
  lng: number;
  speed: number;
  timestamp: string;
}

// Define Frontend Models
export interface BusLocationModel {
  busId: string;
  routeId: string;
  latitude: number;
  longitude: number;
  speed: number;
  timestamp: string;
}

// Transformation
export const TrackingContract = {
  toLocationModel(dto: BusLocationDTO): BusLocationModel {
    return {
      busId: dto.bus_id,
      routeId: dto.route_id,
      latitude: dto.lat,
      longitude: dto.lng,
      speed: dto.speed,
      timestamp: dto.timestamp,
    };
  },
};
