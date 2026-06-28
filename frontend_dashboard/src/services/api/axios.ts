import axios, { AxiosInstance, AxiosError, InternalAxiosRequestConfig } from 'axios';
import { useAuthStore } from '../../store/authStore';

const authURL = import.meta.env.VITE_AUTH_API_URL || 'http://localhost:8000';
const transportURL = import.meta.env.VITE_TRANSPORT_API_URL || 'http://localhost:8001';
const trackingURL = import.meta.env.VITE_TRACKING_API_URL || 'http://localhost:8002';

export const authClient = axios.create({ baseURL: authURL, headers: { 'Content-Type': 'application/json' } });
export const transportClient = axios.create({ baseURL: transportURL, headers: { 'Content-Type': 'application/json' } });
export const trackingClient = axios.create({ baseURL: trackingURL, headers: { 'Content-Type': 'application/json' } });

let isRefreshing = false;
let failedQueue: Array<{ resolve: (value?: unknown) => void; reject: (reason?: any) => void }> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

const setupInterceptors = (client: AxiosInstance) => {
  client.interceptors.request.use(
    (config: InternalAxiosRequestConfig) => {
      const token = useAuthStore.getState().token;
      if (token && config.headers) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as InternalAxiosRequestConfig & { _retry?: boolean };
      
      if (error.response?.status === 401 && originalRequest && !originalRequest._retry && originalRequest.url !== '/auth/refresh-token') {
        if (isRefreshing) {
          return new Promise(function (resolve, reject) {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              originalRequest.headers['Authorization'] = 'Bearer ' + token;
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        const refreshToken = useAuthStore.getState().refreshToken;
        if (!refreshToken) {
          useAuthStore.getState().setLogout();
          return Promise.reject(error);
        }

        try {
          // Explicitly use basic axios so we don't loop
          const { data } = await axios.post(`${authURL}/auth/refresh-token`, { refresh_token: refreshToken });
          useAuthStore.getState().updateToken(data.access_token, data.refresh_token);
          
          processQueue(null, data.access_token);
          originalRequest.headers['Authorization'] = 'Bearer ' + data.access_token;
          return client(originalRequest);
        } catch (err) {
          processQueue(err, null);
          useAuthStore.getState().setLogout();
          return Promise.reject(err);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    }
  );
};

setupInterceptors(authClient);
setupInterceptors(transportClient);
setupInterceptors(trackingClient);

// Default export for generic non-microservice specific stuff if any, mapping to auth by default
export default authClient;
