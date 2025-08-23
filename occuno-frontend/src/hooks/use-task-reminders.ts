import { useEffect, useRef } from "react";
import { useObjectives } from "@/hooks/use-objectives";
import { useNotifications } from "@/hooks/use-notifications";
import { ObjectiveType, ObjectiveStatus, Task } from "@/types";

interface TaskReminder {
  taskId: string;
  reminderTime: Date;
  timeoutId?: NodeJS.Timeout;
}

export function useTaskReminders() {
  const { objectives } = useObjectives();
  const { canNotify, notificationService } = useNotifications();
  const remindersRef = useRef<Map<string, TaskReminder>>(new Map());

  useEffect(() => {
    if (!canNotify) return;

    // Clear existing reminders
    remindersRef.current.forEach(reminder => {
      if (reminder.timeoutId) {
        clearTimeout(reminder.timeoutId);
      }
    });
    remindersRef.current.clear();

    // Schedule reminders for upcoming tasks
    const now = new Date();
    const tasks = objectives.filter(obj => 
      obj.objective_type === ObjectiveType.TASK &&
      obj.status !== ObjectiveStatus.COMPLETED &&
      obj.status !== ObjectiveStatus.CANCELLED
    ) as Task[];

    tasks.forEach(task => {
      if (!task.start_time) return;

      const taskTime = new Date(task.start_time);
      const reminderTime = new Date(taskTime.getTime() - 15 * 60 * 1000); // 15 minutes before

      // Only schedule if the reminder time is in the future
      if (reminderTime > now) {
        const timeUntilReminder = reminderTime.getTime() - now.getTime();
        
        const timeoutId = setTimeout(() => {
          notificationService.notifyTaskReminder(task);
          remindersRef.current.delete(task.id);
        }, timeUntilReminder);

        remindersRef.current.set(task.id, {
          taskId: task.id,
          reminderTime,
          timeoutId
        });

        console.log(`📅 Scheduled reminder for "${task.title}" at ${reminderTime.toLocaleTimeString()}`);
      }
    });

    // Cleanup function
    return () => {
      remindersRef.current.forEach(reminder => {
        if (reminder.timeoutId) {
          clearTimeout(reminder.timeoutId);
        }
      });
      remindersRef.current.clear();
    };
  }, [objectives, canNotify, notificationService]);

  // Function to manually trigger a reminder
  const testReminder = async (taskId: string) => {
    const task = objectives.find(obj => obj.id === taskId);
    if (task && canNotify) {
      await notificationService.notifyTaskReminder(task);
    }
  };

  return {
    scheduledReminders: Array.from(remindersRef.current.values()),
    testReminder
  };
} 