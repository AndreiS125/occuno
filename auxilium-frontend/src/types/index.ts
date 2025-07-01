export enum ObjectiveType {
  MAIN_OBJECTIVE = "main_objective",
  SUB_OBJECTIVE = "sub_objective",
  TASK = "task"
}

export enum ObjectiveStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  COMPLETED = "completed",
  BLOCKED = "blocked",
  CANCELLED = "cancelled"
}

export enum EnergyLevel {
  LOW = "low",
  MEDIUM = "medium",
  HIGH = "high"
}

export interface RecurringInfo {
  frequency: "daily" | "weekly" | "monthly";
  interval?: number;
  days_of_week?: number[];
  time_of_day?: string;
  next_occurrence?: string;
  weekday_of_month?: number;
  end_date?: string; // ISO date string for when recurrence ends
}

export interface Objective {
  id: string;
  title: string;
  description?: string;
  objective_type: ObjectiveType;
  parent_id?: string;
  status: ObjectiveStatus;
  completion_percentage: number;
  created_at: string;
  updated_at?: string;
  due_date?: string;
  start_date?: string;
  all_day?: boolean;  // Explicit all-day flag
  priority_score: number;
  complexity_score: number;
  energy_requirement: EnergyLevel;
  context_tags: string[];
  success_criteria: string[];
  recurring?: RecurringInfo;
}

export interface Task extends Objective {
  start_time?: string;
  end_time?: string;
  location?: string;
  estimated_duration?: number; // in minutes
  actionable_steps: string[];
}

export interface UserProfile {
  id: string;
  name?: string;
  email?: string;
  preferences: UserPreferences;
  gamification_stats: GamificationStats;
  created_at: string;
  updated_at?: string;
}

export interface UserPreferences {
  theme: "light" | "dark" | "system";
  notifications_enabled: boolean;
  daily_goal_tasks: number;
  working_hours_start: string;
  working_hours_end: string;
  timezone: string;
}

export interface GamificationStats {
  level: number;
  experience_points: number;
  total_tasks_completed: number;
  total_objectives_completed: number;
  current_streak: number;
  longest_streak: number;
  achievements: Achievement[];
  last_activity: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  earned_at?: string;
  progress?: number;
  max_progress?: number;
}

export interface ObjectiveStats {
  total: number;
  by_status: Record<ObjectiveStatus, number>;
  by_type: Record<ObjectiveType, number>;
  completion_rate: number;
  active_count: number;
  blocked_count: number;
} 