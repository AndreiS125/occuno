"use client";

import { useTaskReminders } from "@/hooks/use-task-reminders";
import { useNotifications } from "@/hooks/use-notifications";
import { useObjectives } from "@/hooks/use-objectives";
import { useEffect, useRef } from "react";
import { ObjectiveStatus } from "@/types";

export function NotificationManager() {
  useTaskReminders(); // This hook sets up the task reminders
  const { canNotify, notificationService } = useNotifications();
  const { objectives } = useObjectives();
  const lastCompletedCountRef = useRef(0);
  const lastStreakRef = useRef(0);

  // Check for achievements and milestones
  useEffect(() => {
    if (!canNotify) return;

    // Count completed tasks today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const completedToday = objectives.filter(obj => {
      if (obj.status !== ObjectiveStatus.COMPLETED || !obj.updated_at) return false;
      const completedDate = new Date(obj.updated_at);
      completedDate.setHours(0, 0, 0, 0);
      return completedDate.getTime() === today.getTime();
    }).length;

    // Check if we've hit daily goal (assuming 5 as default)
    if (completedToday > lastCompletedCountRef.current && completedToday >= 5) {
      notificationService.notifyDailyGoal(completedToday, 5);
    }
    lastCompletedCountRef.current = completedToday;

    // You could add more achievement checks here
    // For example: streak tracking, milestone completions, etc.

  }, [objectives, canNotify, notificationService]);

  return null;
} 