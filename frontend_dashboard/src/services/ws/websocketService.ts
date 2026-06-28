import { useAuthStore } from '../../store/authStore';
import { useTrackingStore } from '../../store/trackingStore';

type MessageHandler = (payload: any) => void;

interface WSEvent {
  version: number;
  type: string;
  payload: any;
  eventId?: string;
  sequence?: number;
}

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string;
  private reconnectInterval: number = 2000;
  private maxReconnectAttempts: number = 10;
  private reconnectAttempts: number = 0;
  private listeners: Map<string, Set<MessageHandler>> = new Map();
  private currentRouteId: string | null = null;
  
  private heartbeatIntervalId: any = null;
  private processedEvents: Set<string> = new Set();
  private lastSequence: number = -1;

  constructor() {
    let baseUrl = import.meta.env.VITE_TRACKING_WS_URL || 'ws://localhost:8002';
    if (!baseUrl.endsWith('/ws/route')) {
      baseUrl = baseUrl.endsWith('/') ? baseUrl + 'ws/route' : baseUrl + '/ws/route';
    }
    this.url = baseUrl;
  }

  public connect(routeId: string) {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) && this.currentRouteId === routeId) {
      return;
    }

    if (this.ws) {
      this.disconnect();
    }

    this.currentRouteId = routeId;
    const token = useAuthStore.getState().token;
    
    if (!token) {
      console.error("Cannot connect to WebSocket without authentication token.");
      return;
    }

    useTrackingStore.getState().setConnectionStatus('reconnecting');
    const wsUrl = `${this.url}/${routeId}?token=${token}`;
    this.ws = new WebSocket(wsUrl);

    this.ws.onopen = () => {
      console.log(`WebSocket connected to route ${routeId}`);
      this.reconnectAttempts = 0;
      this.reconnectInterval = 2000; // Reset backoff
      useTrackingStore.getState().setConnectionStatus('connected');
      this.startHeartbeat();
    };

    this.ws.onmessage = (event) => {
      try {
        const data: WSEvent = JSON.parse(event.data);
        
        // Handle PONG
        if (data.type === 'PONG') return;

        // Deduplication
        if (data.eventId) {
          if (this.processedEvents.has(data.eventId)) return;
          this.processedEvents.add(data.eventId);
          if (this.processedEvents.size > 1000) {
            const iterator = this.processedEvents.values();
            this.processedEvents.delete(iterator.next().value!);
          }
        }

        // Sequencing (only discard older if we have a strict sequence system, ignore if equal to allow parallel different events)
        if (data.sequence !== undefined) {
          if (data.sequence < this.lastSequence) return; // Out of order, discard
          this.lastSequence = Math.max(this.lastSequence, data.sequence);
        }

        if (data.version !== 1) {
          console.warn('Unknown WebSocket message version', data.version);
        }

        // Auto-update global tracking store based on event type
        this.processTrackingUpdates(data);

        if (data.type) {
          this.emit(data.type, data.payload);
        }
      } catch (error) {
        console.error('Error parsing WebSocket message:', error);
      }
    };

    this.ws.onclose = () => {
      console.log('WebSocket disconnected');
      useTrackingStore.getState().setConnectionStatus('offline');
      this.stopHeartbeat();
      this.attemptReconnect(routeId);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
      this.ws?.close();
    };
  }

  private processTrackingUpdates(data: WSEvent) {
    const store = useTrackingStore.getState();
    switch (data.type) {
      case 'LOCATION_UPDATE':
        store.setCurrentLocation(data.payload);
        break;
      case 'ETA_UPDATE':
        store.setEta(data.payload.eta);
        break;
      case 'OCCUPANCY_UPDATE':
        store.setOccupancy(data.payload.occupied);
        break;
      case 'WAITING_STUDENTS_UPDATE':
        store.setWaitingStudents(data.payload.count);
        break;
      case 'STOP_REACHED':
        if (data.payload.currentStop) store.setCurrentStop(data.payload.currentStop);
        if (data.payload.nextStop) store.setNextStop(data.payload.nextStop);
        if (data.payload.progress) store.setRouteProgress(data.payload.progress);
        break;
      case 'ROUTE_COMPLETED':
        this.disconnect();
        break;
    }
  }

  private startHeartbeat() {
    this.heartbeatIntervalId = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'PING' }));
      }
    }, 30000);
  }

  private stopHeartbeat() {
    if (this.heartbeatIntervalId) {
      clearInterval(this.heartbeatIntervalId);
      this.heartbeatIntervalId = null;
    }
  }

  private attemptReconnect(routeId: string) {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      useTrackingStore.getState().setConnectionStatus('reconnecting');
      console.log(`WebSocket reconnecting in ${this.reconnectInterval}ms... (Attempt ${this.reconnectAttempts})`);
      setTimeout(() => this.connect(routeId), this.reconnectInterval);
      this.reconnectInterval = Math.min(this.reconnectInterval * 1.5, 30000); // Exponential backoff up to 30s
    } else {
      console.error('WebSocket reached maximum reconnect attempts.');
      useTrackingStore.getState().setConnectionStatus('offline');
    }
  }

  public subscribe(eventType: string, handler: MessageHandler) {
    if (!this.listeners.has(eventType)) {
      this.listeners.set(eventType, new Set());
    }
    this.listeners.get(eventType)?.add(handler);
  }

  public unsubscribe(eventType: string, handler: MessageHandler) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.delete(handler);
      if (handlers.size === 0) {
        this.listeners.delete(eventType);
      }
    }
  }

  private emit(eventType: string, payload: any) {
    const handlers = this.listeners.get(eventType);
    if (handlers) {
      handlers.forEach((handler) => handler(payload));
    }
  }

  public disconnect() {
    if (this.ws) {
      this.ws.onclose = null;
      this.ws.close();
      this.ws = null;
      this.currentRouteId = null;
      this.stopHeartbeat();
      useTrackingStore.getState().setConnectionStatus('offline');
    }
  }
}

export const wsService = new WebSocketService();
