import axios from "axios";
import {
  Objective,
  Task,
  UserProfile,
  ObjectiveStats,
  GamificationStats,
  ObjectiveStatus,
  ObjectiveType,
  EnergyLevel,
} from "@/types";

// Normalize API base URL so we don't double-append "/api/v1"
const RAW_API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const API_BASE_URL = (() => {
  const trimmed = RAW_API_URL.replace(/\/+$/, "");
  return trimmed.endsWith("/api/v1") ? trimmed : `${trimmed}/api/v1`;
})();

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

// Automatically refresh access token on 401 and retry once
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: any) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error);
    } else {
      resolve(token);
    }
  });
  
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    
    if (error.response?.status === 401 && !originalRequest._retry) {
      if (isRefreshing) {
        // If we're already refreshing, queue this request
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        }).then(() => {
          return api(originalRequest);
        }).catch(err => {
          return Promise.reject(err);
        });
      }

      originalRequest._retry = true;
      isRefreshing = true;

      try {
        // No refresh endpoint. Probe current session via users/me.
        const refreshResponse = await api.get('/users/me');
        
        if (refreshResponse.status === 200) {
          // Auth is still valid, process queued requests
          processQueue(null);
          
          // Retry the original request
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, clear auth and redirect to login
        processQueue(refreshError, null);
        
        // Clear any stored auth data and redirect to login
        document.cookie = 'access_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        document.cookie = 'refresh_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;';
        
        // Broadcast logout so the app can clear state and redirect
        if (typeof window !== "undefined") {
          window.dispatchEvent(new Event("auth:logout"));
        }
        
        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

// Objectives API
export const objectivesApi = {
  getAll: async (status?: ObjectiveStatus, parentId?: string) => {
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (parentId) params.append('parent_id', parentId);
    
    const { data } = await api.get<Objective[]>(`/objectives${params.toString() ? `?${params}` : ''}`);
    return data;
  },

  list: async (params?: any) => {
    const queryParams = new URLSearchParams();
    if (params?.objective_type) queryParams.append('objective_type', params.objective_type);
    if (params?.status) queryParams.append('status', params.status);
    if (params?.parent_id) queryParams.append('parent_id', params.parent_id);
    
    return api.get<Objective[]>(`/objectives${queryParams.toString() ? `?${queryParams}` : ''}`);
  },

  getById: async (id: string) => {
    const { data } = await api.get<Objective>(`/objectives/${id}`);
    return data;
  },

  getRoot: async () => {
    const { data } = await api.get<Objective[]>("/objectives/root");
    return data;
  },

  getChildren: async (id: string) => {
    const { data } = await api.get<Objective[]>(`/objectives/${id}/children`);
    return data;
  },

  getUpcoming: async (days: number = 7) => {
    const { data } = await api.get<Task[]>(`/objectives/upcoming?days=${days}`);
    return data;
  },

  create: async (objective: Partial<Objective>) => {
    const { data } = await api.post<Objective>("/objectives", objective);
    return data;
  },

  createTask: async (task: Partial<Task>) => {
    const { data } = await api.post<Task>("/objectives/task", task);
    return data;
  },

  update: async (id: string, updates: Partial<Objective>) => {
    const { data } = await api.put<Objective>(`/objectives/${id}`, updates);
    return data;
  },

  complete: async (id: string) => {
    // Use generic update with include_gamification to trigger backend gamification on status transition
    const { data } = await api.put<{
      objective: Objective;
      gamification: any;
    }>(`/objectives/${id}?include_gamification=true`, {
      status: 'completed',
      completion_percentage: 100,
    });
    return data;
  },

  delete: async (id: string) => {
    const { data } = await api.delete(`/objectives/${id}`);
    return data;
  },

  search: async (query: string) => {
    const { data } = await api.get<Objective[]>(`/objectives/search?query=${query}`);
    return data;
  },

  getStats: async () => {
    const { data } = await api.get<ObjectiveStats>("/objectives/stats");
    return data;
  },
};

// User API
export const userApi = {
  getProfile: async (): Promise<UserProfile> => {
    const response = await api.get("/user/profile");
    return response.data;
  },

  updatePreferences: async (preferences: any) => {
    const response = await api.put("/user/preferences", preferences);
    return response.data;
  },

  getGamificationStats: async (): Promise<GamificationStats> => {
    const response = await api.get("/user/gamification/stats");
    return response.data;
  },

  // New psychological engagement endpoints
  getEnhancedGamificationStats: async () => {
    const response = await api.get("/user/gamification/stats");
    return response.data;
  },

  getDailyStatus: async () => {
    const response = await api.get("/user/gamification/daily-status");
    return response.data;
  },

  openMysteryBox: async (frontendChoice?: any) => {
    const response = await api.post("/user/gamification/mystery-box", {
      frontend_choice: frontendChoice
    });
    return response.data;
  },

  getWeeklyChallenge: async () => {
    const response = await api.get("/user/gamification/weekly-challenge");
    return response.data;
  },

  claimDailyBonus: async () => {
    const response = await api.post("/user/gamification/daily-bonus");
    return response.data;
  },

  getAchievementDefinitions: async () => {
    const { data } = await api.get("/user/gamification/achievements");
    return data;
  },

  checkStreak: async () => {
    const { data } = await api.post("/user/gamification/check-streak");
    return data;
  },

  // Coupon system endpoints
  getAvailableCoupons: async () => {
    const response = await api.get("/user/coupons");
    const data = response.data;
    // Normalize shape: backend may return a bare array of coupons; wrap into { active_coupons }
    return Array.isArray(data) ? { active_coupons: data } : data;
  },

  useCoupon: async (couponId: string) => {
    const response = await api.post(`/user/coupons/${couponId}/use`);
    return response.data;
  },

  getCouponDefinitions: async () => {
    const response = await api.get("/user/coupons/definitions");
    return response.data;
  },

  // Reward Configuration API
  getRewardConfig: async () => {
    const response = await api.get("/user/reward-config");
    return response.data;
  },

  saveRewardConfig: async (config: any) => {
    const response = await api.post("/user/reward-config", config);
    return response.data;
  },

  deleteRewardConfig: async () => {
    const response = await api.delete("/user/reward-config");
    return response.data;
  },

  toggleRewardConfig: async (useCustom: boolean) => {
    const response = await api.post("/user/reward-config/toggle", {
      use_custom_rewards: useCustom
    });
    return response.data;
  },

  // Luck Status API
  getLuckStatus: async () => {
    const response = await api.get("/user/luck-status");
    return response.data;
  },

  updateLuckFactor: async (luckFactor: number) => {
    const response = await api.post("/user/luck-factor", {
      luck_factor: luckFactor
    });
    return response.data;
  },
};



// Auth API
export const authApi = {
  register: async (data: {
    email: string;
    password: string;
    full_name?: string;
  }) => {
    const response = await api.post("/auth/register", data);
    return response.data;
  },

  login: async (data: {
    username: string;
    password: string;
  }) => {
    // FastAPI-Users expects form data for login
    const formData = new FormData();
    formData.append('username', data.username);
    formData.append('password', data.password);
    
    const response = await api.post("/auth/jwt/login", formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  logout: async () => {
    const response = await api.post("/auth/jwt/logout");
    return response.data;
  },

  getCurrentUser: async () => {
    const response = await api.get("/users/me");
    return response.data;
  },
};

export default api; 