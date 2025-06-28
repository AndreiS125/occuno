// Browser notification service

export interface NotificationOptions {
  body?: string;
  icon?: string;
  badge?: string;
  tag?: string;
  requireInteraction?: boolean;
  data?: any;
}

export class NotificationService {
  private static instance: NotificationService | null = null;
  private permission: NotificationPermission = "default";

  private constructor() {
    // Don't check permission in constructor - will be done lazily
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  private checkPermission() {
    if (typeof window !== "undefined" && "Notification" in window) {
      this.permission = Notification.permission;
    }
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return false;
    }

    try {
      const permission = await Notification.requestPermission();
      this.permission = permission;
      return permission === "granted";
    } catch (error) {
      console.error("Error requesting notification permission:", error);
      return false;
    }
  }

  async notify(title: string, options?: NotificationOptions): Promise<Notification | null> {
    if (typeof window === "undefined" || !("Notification" in window)) {
      console.warn("This browser does not support notifications");
      return null;
    }

    // Check permission lazily
    this.checkPermission();

    if (this.permission !== "granted") {
      console.warn("Notification permission not granted");
      return null;
    }

    try {
      const notification = new Notification(title, {
        ...options,
        icon: options?.icon || "/icon-192x192.png",
        badge: options?.badge || "/icon-192x192.png",
      });

      notification.onclick = () => {
        window.focus();
        notification.close();
      };

      return notification;
    } catch (error) {
      console.error("Error showing notification:", error);
      return null;
    }
  }

  canNotify(): boolean {
    if (typeof window === "undefined") return false;
    this.checkPermission();
    return "Notification" in window && this.permission === "granted";
  }

  getPermissionStatus(): NotificationPermission {
    this.checkPermission();
    return this.permission;
  }

  // Task reminder notification
  async notifyTaskReminder(task: any) {
    const now = new Date();
    const taskTime = new Date(task.start_time);
    const timeDiff = Math.round((taskTime.getTime() - now.getTime()) / 60000); // minutes

    await this.notify(`Task Reminder: ${task.title}`, {
      body: `Starting in ${timeDiff} minutes`,
      tag: `task-${task.id}`,
      requireInteraction: true,
      data: { taskId: task.id }
    });
  }

  // Achievement unlocked notification
  async notifyAchievement(achievement: any) {
    await this.notify("Achievement Unlocked! 🎉", {
      body: achievement.title,
      tag: `achievement-${achievement.id}`,
      icon: "/achievement-icon.png"
    });
  }

  // Daily goal completed notification
  async notifyDailyGoal(completedTasks: number, goal: number) {
    await this.notify("Daily Goal Achieved! 🎯", {
      body: `You've completed ${completedTasks}/${goal} tasks today!`,
      tag: "daily-goal"
    });
  }

  // Streak update notification
  async notifyStreak(days: number) {
    await this.notify(`${days} Day Streak! 🔥`, {
      body: `Keep up the great work!`,
      tag: "streak"
    });
  }
}

// Only create instance on client side
let notificationService: NotificationService;

if (typeof window !== "undefined") {
  notificationService = NotificationService.getInstance();
} else {
  // Create a dummy instance for SSR that won't do anything
  notificationService = {
    requestPermission: async () => false,
    notify: async () => null,
    canNotify: () => false,
    getPermissionStatus: () => "default" as NotificationPermission,
    notifyTaskReminder: async () => {},
    notifyAchievement: async () => {},
    notifyDailyGoal: async () => {},
    notifyStreak: async () => {},
  } as any as NotificationService;
}

export { notificationService }; 