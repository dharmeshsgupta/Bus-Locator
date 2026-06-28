// Define Backend DTOs
export interface RouteDTO {
  id: string;
  name: string;
  start_stop_id: string | null;
  end_stop_id: string | null;
  total_distance_km: number;
}

// Define Frontend Models
export interface RouteModel {
  id: string;
  name: string;
  startStopId: string | null;
  endStopId: string | null;
  totalDistanceKm: number;
}

// Transformation
export const TransportContract = {
  toRouteModel(dto: RouteDTO): RouteModel {
    return {
      id: dto.id,
      name: dto.name,
      startStopId: dto.start_stop_id,
      endStopId: dto.end_stop_id,
      totalDistanceKm: dto.total_distance_km,
    };
  },
  
  toRouteList(dtos: RouteDTO[]): RouteModel[] {
    return dtos.map(this.toRouteModel);
  }
};
