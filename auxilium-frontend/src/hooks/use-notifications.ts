import { useEffect, useState } from "react";
import { notificationService } from "@/lib/notifications";
import { userApi } from "@/lib/api";

export function useNotifications() {
  const [enabled, setEnabled] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>("default");

  useEffect(() => {
    // Load notification preference
    const loadPreferences = async () => {
      try {
        const profile = await userApi.getProfile();
        const prefs = (profile as any).preferences || {};
        const notificationsEnabled = prefs.notifications_enabled ?? true;
        
        setEnabled(notificationsEnabled);
        
        // Check current permission status
        const status = notificationService.getPermissionStatus();
        setPermission(status);
        
        // If enabled in settings but no permission, request it
        if (notificationsEnabled && status === "default") {
          const granted = await notificationService.requestPermission();
          setPermission(granted ? "granted" : "denied");
        }
      } catch (error) {
        console.error("Failed to load notification preferences:", error);
      }
    };

    loadPreferences();
  }, []);

  const requestPermission = async () => {
    const granted = await notificationService.requestPermission();
    setPermission(granted ? "granted" : "denied");
    return granted;
  };

  const sendTestNotification = async () => {
    if (permission === "granted") {
      await notificationService.notify("Test Notification", {
        body: "Notifications are working! 🎉",
        tag: "test"
      });
      return true;
    }
    return false;
  };

  return {
    enabled,
    permission,
    canNotify: permission === "granted",
    requestPermission,
    sendTestNotification,
    notificationService
  };
} 