import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosError } from 'axios';

const BASE_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}> = [];

function processQueue(error: unknown, token: string | null = null) {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
}

export function createApiClient(): AxiosInstance {
  const client = axios.create({
    baseURL: `${BASE_URL}/api/v1`,
    withCredentials: true,
    headers: { 
      'Content-Type': 'application/json',
      'Accept': 'application/json',
    },
    timeout: 15000, // 15 second timeout
    // Enable HTTP compression
    decompress: true,
  });

  // Request interceptor: attach access token + workspace ID
  client.interceptors.request.use((config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('nexacrm_access_token');
      const workspaceId = localStorage.getItem('nexacrm_workspace_id');

      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      if (workspaceId) {
        config.headers['X-Workspace-ID'] = workspaceId;
      }
    }
    return config;
  });

  // Response interceptor: auto-refresh on 401
  client.interceptors.response.use(
    (response) => response,
    async (error: AxiosError) => {
      const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean };

      // Skip refresh for auth endpoints
      const url = originalRequest.url ?? '';
      const isAuthEndpoint =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/refresh');

      if (error.response?.status === 401 && !originalRequest._retry && !isAuthEndpoint) {
        if (isRefreshing) {
          return new Promise((resolve, reject) => {
            failedQueue.push({ resolve, reject });
          })
            .then((token) => {
              if (originalRequest.headers) {
                (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${token}`;
              }
              return client(originalRequest);
            })
            .catch((err) => Promise.reject(err));
        }

        originalRequest._retry = true;
        isRefreshing = true;

        try {
          const response = await client.post<{ accessToken: string }>('/auth/refresh');
          const { accessToken } = response.data;

          if (typeof window !== 'undefined') {
            localStorage.setItem('nexacrm_access_token', accessToken);
          }

          processQueue(null, accessToken);

          if (originalRequest.headers) {
            (originalRequest.headers as Record<string, string>).Authorization = `Bearer ${accessToken}`;
          }
          return client(originalRequest);
        } catch (refreshError) {
          processQueue(refreshError, null);

          // Clear auth state and redirect to login
          if (typeof window !== 'undefined') {
            localStorage.removeItem('nexacrm_access_token');
            localStorage.removeItem('nexacrm_workspace_id');
            window.location.href = '/login';
          }
          return Promise.reject(refreshError);
        } finally {
          isRefreshing = false;
        }
      }

      return Promise.reject(error);
    },
  );

  return client;
}

export const apiClient = createApiClient();
