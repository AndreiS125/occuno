import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";
import { format, formatDistanceToNow, isToday, isTomorrow, isYesterday } from "date-fns";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatDate(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  
  if (isToday(d)) return "Today";
  if (isTomorrow(d)) return "Tomorrow";
  if (isYesterday(d)) return "Yesterday";
  
  return format(d, "MMM d, yyyy");
}

export function formatDateTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return format(d, "MMM d, yyyy 'at' h:mm a");
}

export function formatRelativeTime(date: string | Date) {
  const d = typeof date === "string" ? new Date(date) : date;
  return formatDistanceToNow(d, { addSuffix: true });
}

export function getStatusColor(status: string) {
  switch (status) {
    case "NOT_STARTED":
      return "text-gray-500";
    case "IN_PROGRESS":
      return "text-blue-500";
    case "BLOCKED":
      return "text-red-500";
    case "COMPLETED":
      return "text-green-500";
    case "CANCELLED":
      return "text-gray-400";
    default:
      return "text-gray-500";
  }
}

export function getStatusBadgeColor(status: string) {
  switch (status) {
    case "NOT_STARTED":
      return "bg-gray-100 text-gray-700";
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700";
    case "BLOCKED":
      return "bg-red-100 text-red-700";
    case "COMPLETED":
      return "bg-green-100 text-green-700";
    case "CANCELLED":
      return "bg-gray-100 text-gray-500";
    default:
      return "bg-gray-100 text-gray-700";
  }
}

export function getEnergyLevelColor(level: string) {
  switch (level) {
    case "LOW":
      return "text-green-500";
    case "MEDIUM":
      return "text-yellow-500";
    case "HIGH":
      return "text-red-500";
    default:
      return "text-gray-500";
  }
}

export function getPriorityColor(score: number) {
  if (score >= 0.8) return "text-red-500";
  if (score >= 0.5) return "text-yellow-500";
  return "text-green-500";
}

export function formatObjectiveType(type: string) {
  switch (type) {
    case "ROOT":
      return "Root Goal";
    case "SUB_OBJECTIVE":
      return "Objective";
    case "TASK":
      return "Task";
    case "HABIT":
      return "Habit";
    default:
      return type;
  }
}

export function calculateProgress(objectives: any[]) {
  if (objectives.length === 0) return 0;
  const totalProgress = objectives.reduce((sum, obj) => sum + (obj.completion_percentage || 0), 0);
  return Math.round(totalProgress / objectives.length);
} 