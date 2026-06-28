import { create } from 'zustand';
import { BusLocation } from '../types/api/bus';

interface TrackingState {
  currentLocation: BusLocation | null;
  occupancy: number;
  waitingStudents: number;
  eta: string | null;
  currentStop: string | null;
  nextStop: string | null;
  routeProgress: number;
  connectionStatus: 'connected' | 'reconnecting' | 'offline';
  lastUpdated: number | null;
  
  setCurrentLocation: (location: BusLocation) => void;
  setOccupancy: (seats: number) => void;
  setWaitingStudents: (count: number) => void;
  setEta: (eta: string) => void;
  setCurrentStop: (stopName: string) => void;
  setNextStop: (stopName: string) => void;
  setRouteProgress: (progress: number) => void;
  setConnectionStatus: (status: 'connected' | 'reconnecting' | 'offline') => void;
  setLastUpdated: (timestamp: number) => void;
}

export const useTrackingStore = create<TrackingState>((set) => ({
  currentLocation: null,
  occupancy: 0,
  waitingStudents: 0,
  eta: null,
  currentStop: null,
  nextStop: null,
  routeProgress: 0,
  connectionStatus: 'offline',
  lastUpdated: null,

  setCurrentLocation: (location) => set({ currentLocation: location, lastUpdated: Date.now() }),
  setOccupancy: (seats) => set({ occupancy: seats }),
  setWaitingStudents: (count) => set({ waitingStudents: count }),
  setEta: (eta) => set({ eta }),
  setCurrentStop: (stopName) => set({ currentStop: stopName }),
  setNextStop: (stopName) => set({ nextStop: stopName }),
  setRouteProgress: (progress) => set({ routeProgress: progress }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setLastUpdated: (timestamp) => set({ lastUpdated: timestamp }),
}));
