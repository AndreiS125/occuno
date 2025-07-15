export enum ObjectiveType {
  MAIN_OBJECTIVE = "main_objective",
  SUB_OBJECTIVE = "sub_objective",
  TASK = "task",
  HABIT = "habit"
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

export enum CouponType {
  JERK_OFF = "jerk_off",
  SCROLL_INSTAGRAM = "scroll_instagram",
  PLAY_GAMES = "play_games",
  WATCH_YOUTUBE = "watch_youtube",
  TAKE_NAP = "take_nap",
  EAT_SNACK = "eat_snack",
  WATCH_NETFLIX = "watch_netflix",
  BROWSE_REDDIT = "browse_reddit",
  LISTEN_MUSIC = "listen_music",
  CHAT_FRIENDS = "chat_friends"
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
  location?: string;
  estimated_duration?: number; // in minutes
  actionable_steps: string[];
}

export interface CouponDefinition {
  coupon_type: CouponType;
  display_name: string;
  description: string;
  duration_minutes: number;
  rarity: string;
}

export interface Coupon {
  id: string;
  type: CouponType;
  display_name: string;
  description: string;
  duration_minutes: number;
  rarity: string;
  expires_at: string;
  hours_left: number;
}

export interface MysteryBoxReward {
  reward_type: string;
  reward_description: string;
  coupons_earned: number;
  coupon_descriptions: string[];
  celebration: string;
  wheel_result?: {
    segment: string;
    coupons: string[];
  };
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
  // Coupon System
  current_coupons: number;
  total_coupons_earned: number;
  total_coupons_used: number;
  coupon_usage_rate: number;
  
  // XP/Level System - NEW
  experience_points: number;
  level: number;
  experience_to_next_level: number;
  total_experience_earned: number;
  progress_to_next_level: number; // 0.0 to 1.0
  
  // Mystery Box System (now level-based)
  mystery_box_progress: number; // Legacy
  mystery_box_needed: number;   // Legacy
  mystery_box_progress_pct: number; // Legacy
  mystery_boxes_available: number;
  mystery_boxes_from_levelup: number;
  
  // Legacy Score System
  overall_score: number;
  
  // Streak System
  current_streak: number;
  longest_streak: number;
  streak_multiplier: number;
  streak_insurance_count: number;
  
  // Daily/Weekly Progress
  daily_tasks_completed_today: number;
  daily_task_goal: number;
  weekly_challenge_progress: number;
  weekly_challenge_target: number;
  weekly_challenge_completed: boolean;
  
  // Achievements
  achievements: Achievement[];
  total_achievements: number;
  
  // Activity Tracking
  last_activity: string;
  days_since_last_activity: number;
  
  // Psychological Metrics
  comeback_bonus_available: boolean;
  daily_bonus_available: boolean;
  consecutive_daily_bonuses: number;
  progress_decay_warning: boolean;
  
  // Social Competition
  rank_this_week: number;
  rank_last_week: number;
  seasonal_rank: number;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  points_value: number;
  earned_at?: string;
  progress?: number;
  max_progress?: number;
  coupon_earned?: boolean;
}

export interface TaskCompletionResult {
  success: boolean;
  coupons_earned: number;
  coupon_descriptions: string[];
  bonus_message?: string;
  urgency_message?: string;
  points_awarded: number;
  current_coupons: number;
  total_coupons_earned: number;
  mystery_box_progress: {
    current: number;
    needed: number;
    earned: boolean;
  };
  mystery_boxes_available: number;
  unlocked_achievements: Achievement[];
  celebration?: string;
}

export interface DailyStatus {
  current_coupons: number;
  total_coupons_earned: number;
  total_coupons_used: number;
  mystery_box_progress: number;
  mystery_box_needed: number;
  mystery_box_progress_pct: number;
  current_streak: number;
  daily_tasks_completed: number;
  daily_task_goal: number;
  weekly_rank: number;
  mystery_boxes_available: number;
  daily_bonus_available: boolean;
  daily_bonus_message: string;
  decay_warning: boolean;
  days_inactive: number;
  psychological_hooks: {
    engagement_messages: string[];
    coupon_pressure: boolean;
    mystery_box_pressure: boolean;
    streak_anxiety: boolean;
    fomo_active: boolean;
  };
  urgency_factors: {
    streak_at_risk: boolean;
    bonus_expiring: boolean;
    rank_falling: boolean;
    coupons_expiring: boolean;
    mystery_box_close: boolean;
  };
}

export interface DailyBonusResult {
  success: boolean;
  bonus_type: string;
  coupons_earned: number;
  coupon_descriptions: string[];
  consecutive_days: number;
  message: string;
  extra_rewards: string[];
  celebration: string;
}

export interface ObjectiveStats {
  total: number;
  by_status: Record<ObjectiveStatus, number>;
  by_type: Record<ObjectiveType, number>;
  completion_rate: number;
  active_count: number;
  blocked_count: number;
}

 