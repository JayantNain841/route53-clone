import axios from 'axios';
import { 
  HostedZone, 
  DNSRecord, 
  DashboardData, 
  PaginatedResponse,
  ZoneType,
  DNSRecordType
} from '../types';

const DEFAULT_API_URL = 'http://127.0.0.1:8080';
const API_URL = process.env.NEXT_PUBLIC_API_URL?.replace(/\/+$|\s+/g, '') || DEFAULT_API_URL;

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (axios.isAxiosError(error)) {
    const response = error.response;
    const requestUrl = error.config?.baseURL ? `${error.config.baseURL}${error.config.url}` : error.config?.url;

    if (response?.status === 404) {
      return `Backend route not found (${requestUrl ?? 'unknown URL'}). Ensure the backend is running and the API URL is correct.`;
    }

    if ([0, 502, 503].includes(response?.status ?? 0)) {
      return `Unable to reach the backend at ${API_URL}. Start the backend server and try again.`;
    }

    const data = response?.data;
    const detail = data?.detail ?? data;
    if (typeof detail === 'string') {
      return detail;
    }
    if (Array.isArray(detail)) {
      return detail
        .map((item) => {
          if (typeof item === 'string') {
            return item;
          }
          if (item && typeof item === 'object') {
            return 'msg' in item ? (item as any).msg : JSON.stringify(item);
          }
          return String(item);
        })
        .join(' | ');
    }
    if (detail != null) {
      return String(detail);
    }
  }
  if (error instanceof Error) {
    return error.message;
  }
  return defaultMessage;
};

// Request interceptor to add authorization token
api.interceptors.request.use(
  (config) => {
    if (typeof window !== 'undefined') {
      const token = localStorage.getItem('route53_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle unauthorized access (redirect to login)
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      if (typeof window !== 'undefined') {
        localStorage.removeItem('route53_token');
        localStorage.removeItem('route53_email');
        if (!window.location.pathname.endsWith('/login')) {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

const FALLBACK_API_URLS = ['http://127.0.0.1:8080', 'http://localhost:8080'];

export const authService = {
  login: async (email: string, password: string) => {
    const payload = {
      email: email.trim(),
      password: password.trim(),
    };
    try {
      const response = await api.post('/login', payload);
      return response.data;
    } catch (error) {
      if (axios.isAxiosError(error) && error.response?.status === 404) {
        const fallbackUrl = FALLBACK_API_URLS.find((url) => url !== API_URL);
        if (fallbackUrl) {
          const fallbackClient = axios.create({
            baseURL: fallbackUrl,
            headers: {
              'Content-Type': 'application/json',
            },
          });
          const response = await fallbackClient.post('/login', payload);
          return response.data;
        }
      }
      throw error;
    }
  },
};

export const zoneService = {
  getZones: async (skip = 0, limit = 10, search = '', zoneType = 'All'): Promise<PaginatedResponse<HostedZone>> => {
    const params: Record<string, string | number> = { skip, limit };
    if (search) params.search = search;
    if (zoneType && zoneType !== 'All') params.zone_type = zoneType;
    
    const response = await api.get('/zones', { params });
    return response.data;
  },

  getZone: async (id: number): Promise<HostedZone> => {
    const response = await api.get(`/zones/${id}`);
    return response.data;
  },

  createZone: async (domain_name: string, description: string | null, zone_type: ZoneType): Promise<HostedZone> => {
    const response = await api.post('/zones', { domain_name, description, zone_type });
    return response.data;
  },

  updateZone: async (id: number, description: string | null, zone_type: ZoneType): Promise<HostedZone> => {
    const response = await api.put(`/zones/${id}`, { description, zone_type });
    return response.data;
  },

  deleteZone: async (id: number): Promise<HostedZone> => {
    const response = await api.delete(`/zones/${id}`);
    return response.data;
  },
};

export const recordService = {
  getRecords: async (zoneId: number, skip = 0, limit = 10, search = '', recordType = 'All'): Promise<PaginatedResponse<DNSRecord>> => {
    const params: Record<string, string | number> = { skip, limit };
    if (search) params.search = search;
    if (recordType && recordType !== 'All') params.record_type = recordType;
    
    const response = await api.get(`/zones/${zoneId}/records`, { params });
    return response.data;
  },

  getRecord: async (id: number): Promise<DNSRecord> => {
    const response = await api.get(`/records/${id}`);
    return response.data;
  },

  createRecord: async (zone_id: number, name: string, type: DNSRecordType, value: string, ttl: number): Promise<DNSRecord> => {
    const response = await api.post('/records', { zone_id, name, type, value, ttl });
    return response.data;
  },

  updateRecord: async (id: number, name: string, type: DNSRecordType, value: string, ttl: number): Promise<DNSRecord> => {
    const response = await api.put(`/records/${id}`, { name, type, value, ttl });
    return response.data;
  },

  deleteRecord: async (id: number): Promise<DNSRecord> => {
    const response = await api.delete(`/records/${id}`);
    return response.data;
  },

  importBindFile: async (zoneId: number, file: File): Promise<{ success: boolean; imported_records: number; errors: string[] }> => {
    const formData = new FormData();
    formData.append('file', file);
    
    const response = await api.post(`/zones/${zoneId}/import-bind`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  exportBindFile: async (zoneId: number): Promise<{ filename: string; content: string }> => {
    const response = await api.get(`/zones/${zoneId}/export-bind`);
    return response.data;
  },

  exportJsonFile: async (zoneId: number): Promise<DNSRecord[]> => {
    const response = await api.get(`/zones/${zoneId}/export-json`);
    return response.data;
  },
};

export const dashboardService = {
  getStats: async (): Promise<DashboardData> => {
    const response = await api.get('/dashboard/stats');
    return response.data;
  },
};

export default api;
