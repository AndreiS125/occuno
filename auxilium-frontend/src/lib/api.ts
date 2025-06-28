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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000/api/v1";

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    "Content-Type": "application/json",
  },
});

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
    const { data } = await api.post<{
      objective: Objective;
      gamification: any;
    }>(`/objectives/${id}/complete`);
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
  getProfile: async () => {
    const { data } = await api.get<UserProfile>("/user/profile");
    return data;
  },

  updatePreferences: async (preferences: any) => {
    const { data } = await api.put("/user/preferences", preferences);
    return data;
  },

  getGamificationStats: async () => {
    const { data } = await api.get<GamificationStats>("/user/gamification/stats");
    return data;
  },

  checkStreak: async () => {
    const { data } = await api.post("/user/gamification/check-streak");
    return data;
  },
};

export default api; 