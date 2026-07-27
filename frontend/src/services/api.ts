import axios from "axios";
import {
  HostedZone,
  DNSRecord,
  DashboardData,
  PaginatedResponse,
  ZoneType,
  DNSRecordType,
} from "../types";

const API_URL =
  "https://route53-clone-production-8f28.up.railway.app";

const api = axios.create({
  baseURL: API_URL,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 15000,
});

export const getErrorMessage = (
  error: unknown,
  defaultMessage: string
): string => {
  if (axios.isAxiosError(error)) {
    if (!error.response) {
      return `Unable to connect to backend.\nBackend URL: ${API_URL}`;
    }

    const detail = error.response.data?.detail;

    if (typeof detail === "string") return detail;

    return defaultMessage;
  }

  if (error instanceof Error) return error.message;

  return defaultMessage;
};

// Add JWT token automatically
api.interceptors.request.use((config) => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("route53_token");

    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
  }

  return config;
});

// Redirect on unauthorized
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (
      typeof window !== "undefined" &&
      error.response?.status === 401
    ) {
      localStorage.removeItem("route53_token");
      localStorage.removeItem("route53_email");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export const authService = {
  login: async (email: string, password: string) => {
    const response = await api.post("/login", {
      email,
      password,
    });

    return response.data;
  },
};

export const dashboardService = {
  getStats: async (): Promise<DashboardData> => {
    const response = await api.get("/dashboard/stats");
    return response.data;
  },
};

export const zoneService = {
  getZones: async (
    skip = 0,
    limit = 10,
    search = "",
    zoneType = "All"
  ): Promise<PaginatedResponse<HostedZone>> => {
    const params: Record<string, any> = {
      skip,
      limit,
    };

    if (search) params.search = search;
    if (zoneType !== "All") params.zone_type = zoneType;

    const response = await api.get("/zones", { params });

    return response.data;
  },

  getZone: async (id: number): Promise<HostedZone> => {
    const response = await api.get(`/zones/${id}`);
    return response.data;
  },

  createZone: async (
    domain_name: string,
    description: string | null,
    zone_type: ZoneType
  ) => {
    const response = await api.post("/zones", {
      domain_name,
      description,
      zone_type,
    });

    return response.data;
  },

  updateZone: async (
    id: number,
    description: string | null,
    zone_type: ZoneType
  ) => {
    const response = await api.put(`/zones/${id}`, {
      description,
      zone_type,
    });

    return response.data;
  },

  deleteZone: async (id: number) => {
    const response = await api.delete(`/zones/${id}`);
    return response.data;
  },
};

export const recordService = {
  getRecords: async (
    zoneId: number,
    skip = 0,
    limit = 10,
    search = "",
    recordType = "All"
  ): Promise<PaginatedResponse<DNSRecord>> => {
    const params: Record<string, any> = {
      skip,
      limit,
    };

    if (search) params.search = search;
    if (recordType !== "All") params.record_type = recordType;

    const response = await api.get(`/zones/${zoneId}/records`, {
      params,
    });

    return response.data;
  },

  getRecord: async (id: number) => {
    const response = await api.get(`/records/${id}`);
    return response.data;
  },

  createRecord: async (
    zone_id: number,
    name: string,
    type: DNSRecordType,
    value: string,
    ttl: number
  ) => {
    const response = await api.post("/records", {
      zone_id,
      name,
      type,
      value,
      ttl,
    });

    return response.data;
  },

  updateRecord: async (
    id: number,
    name: string,
    type: DNSRecordType,
    value: string,
    ttl: number
  ) => {
    const response = await api.put(`/records/${id}`, {
      name,
      type,
      value,
      ttl,
    });

    return response.data;
  },

  deleteRecord: async (id: number) => {
    const response = await api.delete(`/records/${id}`);
    return response.data;
  },

  importBindFile: async (zoneId: number, file: File) => {
    const formData = new FormData();
    formData.append("file", file);

    const response = await api.post(
      `/zones/${zoneId}/import-bind`,
      formData
    );

    return response.data;
  },

  exportBindFile: async (zoneId: number) => {
    const response = await api.get(`/zones/${zoneId}/export-bind`);
    return response.data;
  },

  exportJsonFile: async (zoneId: number) => {
    const response = await api.get(`/zones/${zoneId}/export-json`);
    return response.data;
  },
};

export default api;