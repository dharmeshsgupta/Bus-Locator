import { create } from 'zustand';

interface RouteState {
  selectedRouteId: string | null;
  assignedBusId: string | null;
  assignedDriverId: string | null;
  setSelectedRoute: (routeId: string | null) => void;
  setAssignedBus: (busId: string | null) => void;
  setAssignedDriver: (driverId: string | null) => void;
}

export const useRouteStore = create<RouteState>((set) => ({
  selectedRouteId: null,
  assignedBusId: null,
  assignedDriverId: null,

  setSelectedRoute: (routeId) => set({ selectedRouteId: routeId }),
  setAssignedBus: (busId) => set({ assignedBusId: busId }),
  setAssignedDriver: (driverId) => set({ assignedDriverId: driverId }),
}));
