"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Save, 
  User,
  Bell,
  Palette, 
  Clock,
  Settings as SettingsIcon
} from "lucide-react";
import { Button } from "@/components/ui";
import { userApi } from "@/lib/api";
import toast from "react-hot-toast";
import { useTheme } from "next-themes";
import { useNotifications } from "@/hooks/use-notifications";

interface UserSettings {
  name: string;
  email: string;
  theme: "light" | "dark" | "system";
  notifications_enabled: boolean;
  daily_goal_tasks: number;
  working_hours_start: string;
  working_hours_end: string;
  timezone: string;
}

export default function SettingsPage() {
  const { theme, setTheme } = useTheme();
  const { permission, canNotify, requestPermission, sendTestNotification } = useNotifications();
  const [mounted, setMounted] = useState(false);
  const [settings, setSettings] = useState<UserSettings>({
    name: "",
    email: "",
    theme: "system",
    notifications_enabled: true,
    daily_goal_tasks: 5,
    working_hours_start: "09:00",
    working_hours_end: "17:00",
    timezone: "America/New_York"
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const data = await userApi.getProfile();
      const prefs = (data as any).preferences || {};
      setSettings({
        name: prefs.name || data.name || "",
        email: prefs.email || data.email || "",
        theme: prefs.theme || theme || "system",
        notifications_enabled: prefs.notifications_enabled ?? true,
        daily_goal_tasks: prefs.daily_goal_tasks || 5,
        working_hours_start: prefs.working_hours_start || "09:00",
        working_hours_end: prefs.working_hours_end || "17:00",
        timezone: prefs.timezone || "America/New_York"
      });
    } catch (error) {
      toast.error("Failed to load profile");
    } finally {
      setLoading(false);
    }
  };

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setSettings({ ...settings, theme: newTheme });
    setTheme(newTheme);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userApi.updatePreferences({
        name: settings.name,
        email: settings.email,
        theme: settings.theme,
        notifications_enabled: settings.notifications_enabled,
        daily_goal_tasks: settings.daily_goal_tasks,
        working_hours_start: settings.working_hours_start,
        working_hours_end: settings.working_hours_end,
        timezone: settings.timezone
      });
      
      // Update theme immediately
      if (settings.theme !== theme) {
        setTheme(settings.theme);
      }
      
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const handleNotificationToggle = async (enabled: boolean) => {
    setSettings({ ...settings, notifications_enabled: enabled });
    
    // If enabling and no permission, request it
    if (enabled && permission === "default") {
      const granted = await requestPermission();
      if (!granted) {
        toast.error("Notification permission denied");
        setSettings({ ...settings, notifications_enabled: false });
      }
    }
  };

  const handleTestNotification = async () => {
    if (canNotify) {
      await sendTestNotification();
    } else if (permission === "default") {
      const granted = await requestPermission();
      if (granted) {
        await sendTestNotification();
      } else {
        toast.error("Notification permission denied");
      }
    } else {
      toast.error("Notifications are blocked. Please enable them in your browser settings.");
    }
  };

  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-8"
      >
      {/* Header */}
        <div className="text-center">
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
            Customize your Auxilium experience
        </p>
      </div>

        {/* Profile Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <User className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Profile</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Name</label>
              <input
                type="text"
                value={settings.name}
                onChange={(e) => setSettings({ ...settings, name: e.target.value })}
                className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="Your name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">Email</label>
              <input
                type="email"
                value={settings.email}
                onChange={(e) => setSettings({ ...settings, email: e.target.value })}
                className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                placeholder="your@email.com"
              />
            </div>
          </div>
        </motion.div>

        {/* Appearance Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Palette className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Appearance</h2>
          </div>

            <div>
            <label className="block text-sm font-medium mb-2">Theme</label>
            <div className="flex gap-2">
              {(["light", "dark", "system"] as const).map((themeOption) => (
                <button
                  key={themeOption}
                  onClick={() => handleThemeChange(themeOption)}
                  className={`px-4 py-2 rounded-lg flex-1 transition-colors ${
                    settings.theme === themeOption
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted hover:bg-muted/80"
                  }`}
                >
                  {themeOption.charAt(0).toUpperCase() + themeOption.slice(1)}
                </button>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Notifications Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Bell className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Notifications</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
                <div>
                <p className="font-medium">Enable Notifications</p>
                  <p className="text-sm text-muted-foreground">
                  Receive reminders and updates
                  </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={settings.notifications_enabled}
                  onChange={(e) => handleNotificationToggle(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-muted peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary/20 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
              </label>
            </div>

            {settings.notifications_enabled && (
              <div className="pt-2">
                <p className="text-sm text-muted-foreground mb-3">
                  Status: {permission === "granted" ? "✅ Enabled" : 
                          permission === "denied" ? "❌ Blocked" : 
                          "⚠️ Permission needed"}
                </p>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleTestNotification}
                  className="w-full"
                >
                  <Bell className="w-4 h-4 mr-2" />
                  Test Notification
                </Button>
              </div>
            )}
          </div>
        </motion.div>

        {/* Work Schedule Section */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Clock className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Work Schedule</h2>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Daily Task Goal
              </label>
              <input
                type="number"
                min="1"
                max="20"
                value={settings.daily_goal_tasks}
                onChange={(e) => setSettings({ ...settings, daily_goal_tasks: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium mb-2">Start Time</label>
                <input
                  type="time"
                  value={settings.working_hours_start}
                  onChange={(e) => setSettings({ ...settings, working_hours_start: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">End Time</label>
                <input
                  type="time"
                  value={settings.working_hours_end}
                  onChange={(e) => setSettings({ ...settings, working_hours_end: e.target.value })}
                  className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">Timezone</label>
              <select
                value={settings.timezone}
                onChange={(e) => setSettings({ ...settings, timezone: e.target.value })}
                className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="America/New_York">Eastern Time</option>
                <option value="America/Chicago">Central Time</option>
                <option value="America/Denver">Mountain Time</option>
                <option value="America/Los_Angeles">Pacific Time</option>
                <option value="UTC">UTC</option>
              </select>
            </div>
          </div>
        </motion.div>

        {/* Save Button */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="flex justify-end"
        >
          <Button
            onClick={handleSave}
            disabled={saving}
            className="flex items-center space-x-2"
          >
            <Save className="w-4 h-4" />
            <span>{saving ? "Saving..." : "Save Settings"}</span>
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
} 