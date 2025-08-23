"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  Save, 
  User,
  Bell,
  Palette, 
  Clock,
  Settings as SettingsIcon,
  Zap,
  Gift,
  Trophy,
  Star,
  Sparkles,
  Dice6,
  Plus,
  Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
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

interface RewardConfig {
  has_custom_config: boolean;
  config: any;
  is_active: boolean;
  default_config: {
    tiers: Array<{
      tier_name: string;
      probability: number;
      description: string;
    }>;
  };
}

interface LuckStatus {
  base_luck: number;
  total_luck: number;
  luck_breakdown: {
    base_luck: number;
    streak_bonus: number;
    level_bonus: number;
    activity_bonus: number;
    comeback_bonus: number;
  };
  luck_explanation: {
    base_luck: string;
    streak_bonus: string;
    level_bonus: string;
    activity_bonus: string;
    comeback_bonus: string;
  };
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
  
  // Reward configuration state
  const [rewardConfig, setRewardConfig] = useState<RewardConfig | null>(null);
  const [luckStatus, setLuckStatus] = useState<LuckStatus | null>(null);
  const [customTiers, setCustomTiers] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<'profile' | 'rewards' | 'luck'>('profile');
  
  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const appearanceRef = useRef<HTMLDivElement>(null);
  const notificationsRef = useRef<HTMLDivElement>(null);
  const scheduleRef = useRef<HTMLDivElement>(null);
  const saveRef = useRef<HTMLDivElement>(null);
  
  // Prevent hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  // Helper functions for default reward configuration
  const getDefaultColors = (tierName: string) => {
    const colorMap: { [key: string]: any[] } = {
      "LEGENDARY": [{ start: "#22c5c2", end: "#14b8a6" }, { start: "#f472b6", end: "#ec4899" }],
      "EPIC": [{ start: "#8b5cf6", end: "#7c3aed" }, { start: "#3b82f6", end: "#2563eb" }],
      "RARE": [{ start: "#3b82f6", end: "#2563eb" }, { start: "#22c5c2", end: "#0891b2" }],
      "COMMON": [{ start: "#22c55e", end: "#15803d" }, { start: "#06b6d4", end: "#0e7490" }],
      "NO_REWARD": [{ start: "#64748b", end: "#475569" }]
    };
    return colorMap[tierName] || colorMap["COMMON"];
  };

  const getDefaultGlowColor = (tierName: string) => {
    const glowMap: { [key: string]: string } = {
      "LEGENDARY": "rgba(34, 197, 194, 0.8)",
      "EPIC": "rgba(139, 92, 246, 0.7)",
      "RARE": "rgba(59, 130, 246, 0.6)",
      "COMMON": "rgba(34, 197, 194, 0.5)",
      "NO_REWARD": "rgba(100, 116, 139, 0.3)"
    };
    return glowMap[tierName] || glowMap["COMMON"];
  };

  const getDefaultSegments = (tierName: string) => {
    const segmentMap: { [key: string]: any[] } = {
      "LEGENDARY": [
        { name: "🎮 Gaming Marathon", weight: 1, type: "game_marathon", duration: 180 },
        { name: "🍕 Food Festival", weight: 1, type: "food_festival", duration: 120 }
      ],
      "EPIC": [
        { name: "🎵 Music Session", weight: 2, type: "music_session", duration: 90 },
        { name: "📱 Social Media", weight: 2, type: "social_media", duration: 60 }
      ],
      "RARE": [
        { name: "📺 YouTube", weight: 3, type: "watch_youtube", duration: 45 },
        { name: "📱 Instagram", weight: 3, type: "scroll_instagram", duration: 30 }
      ],
      "COMMON": [
        { name: "☕ Coffee Break", weight: 3, type: "coffee_break", duration: 15 },
        { name: "📖 Quick Read", weight: 2, type: "quick_read", duration: 20 }
      ],
      "NO_REWARD": [
        { name: "📦 Empty Box", weight: 1, type: "no_reward", duration: 0 }
      ]
    };
    return segmentMap[tierName] || segmentMap["COMMON"];
  };

  // Load user settings
  useEffect(() => {
    const loadSettings = async () => {
      try {
        const [userProfile, configData, luckData] = await Promise.all([
          userApi.getProfile(),
          userApi.getRewardConfig(),
          userApi.getLuckStatus()
        ]);
        
        // Map profile data to settings format (using defaults for now)
        setSettings({
          name: (userProfile as any).username || "",
          email: (userProfile as any).email || "",
          theme: (userProfile as any).theme || "system",
          notifications_enabled: (userProfile as any).notifications_enabled !== false,
          daily_goal_tasks: (userProfile as any).daily_task_goal || 5,
          working_hours_start: (userProfile as any).working_hours_start || "09:00",
          working_hours_end: (userProfile as any).working_hours_end || "17:00",
          timezone: (userProfile as any).timezone || "America/New_York"
        });
        
        setRewardConfig(configData);
        setLuckStatus(luckData);
        
        if (configData.has_custom_config) {
          setCustomTiers(configData.config.reward_tiers || []);
        } else {
          setCustomTiers(configData.default_config.tiers.map((tier: any) => ({
            tier_name: tier.tier_name,
            probability: tier.probability,
            colors: getDefaultColors(tier.tier_name),
            glow_color: getDefaultGlowColor(tier.tier_name),
            segments: getDefaultSegments(tier.tier_name)
          })));
        }
      } catch (error) {
        console.error("Failed to load settings:", error);
        toast.error("Failed to load settings");
      } finally {
        setLoading(false);
      }
    };
    
    loadSettings();
  }, []);

  const handleThemeChange = (newTheme: "light" | "dark" | "system") => {
    setSettings({ ...settings, theme: newTheme });
    setTheme(newTheme);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await userApi.updatePreferences(settings);
      toast.success("Settings saved successfully!");
    } catch (error) {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  // Reward configuration handlers
  const handleToggleCustomRewards = async (useCustom: boolean) => {
    try {
      setSaving(true);
      
      // If enabling custom rewards but no config exists, create a default one first
      if (useCustom && !rewardConfig?.has_custom_config) {
        await userApi.saveRewardConfig({
          config: {
            name: "My Custom Wheel",
            tiers: customTiers
          },
          use_custom_rewards: true
        });
        toast.success("Custom reward configuration created and enabled!");
      } else {
        const result = await userApi.toggleRewardConfig(useCustom);
        toast.success(result.message);
      }
      
      // Reload data
      const [configData, luckData] = await Promise.all([
        userApi.getRewardConfig(),
        userApi.getLuckStatus()
      ]);
      
      setRewardConfig(configData);
      setLuckStatus(luckData);
    } catch (error) {
      toast.error("Failed to toggle reward configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCustomRewardConfig = async () => {
    try {
      setSaving(true);
      
      // Validate probabilities sum to 1.0
      const totalProb = customTiers.reduce((sum, tier) => sum + tier.probability, 0);
      if (Math.abs(totalProb - 1.0) > 0.01) {
        toast.error(`Probabilities must sum to 1.0 (currently ${totalProb.toFixed(3)})`);
        return;
      }

      const result = await userApi.saveRewardConfig({
        config: {
          name: "My Custom Wheel",
          tiers: customTiers
        },
        use_custom_rewards: true
      });
      
      toast.success(result.message);
      
      // Reload data
      const configData = await userApi.getRewardConfig();
      setRewardConfig(configData);
    } catch (error) {
      toast.error("Failed to save custom configuration");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteCustomRewardConfig = async () => {
    try {
      setSaving(true);
      const result = await userApi.deleteRewardConfig();
      toast.success(result.message);
      
      // Reload data
      const configData = await userApi.getRewardConfig();
      setRewardConfig(configData);
    } catch (error) {
      toast.error("Failed to delete custom configuration");
    } finally {
      setSaving(false);
    }
  };

  const updateTierProbability = (index: number, probability: number) => {
    const newTiers = [...customTiers];
    newTiers[index].probability = probability;
    setCustomTiers(newTiers);
  };

  const updateTierDuration = (index: number, segmentIndex: number, duration: number) => {
    const newTiers = [...customTiers];
    if (newTiers[index].segments && newTiers[index].segments[segmentIndex]) {
      newTiers[index].segments[segmentIndex].duration = duration;
      setCustomTiers(newTiers);
    }
  };

  const updateSegmentName = (tierIndex: number, segmentIndex: number, name: string) => {
    const newTiers = [...customTiers];
    if (newTiers[tierIndex].segments && newTiers[tierIndex].segments[segmentIndex]) {
      newTiers[tierIndex].segments[segmentIndex].name = name;
      setCustomTiers(newTiers);
    }
  };

  const updateSegmentWeight = (tierIndex: number, segmentIndex: number, weight: number) => {
    const newTiers = [...customTiers];
    if (newTiers[tierIndex].segments && newTiers[tierIndex].segments[segmentIndex]) {
      newTiers[tierIndex].segments[segmentIndex].weight = weight;
      setCustomTiers(newTiers);
    }
  };

  const addNewSegment = (tierIndex: number) => {
    const newTiers = [...customTiers];
    if (!newTiers[tierIndex].segments) {
      newTiers[tierIndex].segments = [];
    }
    
    const newSegment = {
      name: "🎯 New Reward",
      weight: 1,
      type: "custom_reward",
      duration: 15
    };
    
    newTiers[tierIndex].segments.push(newSegment);
    setCustomTiers(newTiers);
  };

  const deleteSegment = (tierIndex: number, segmentIndex: number) => {
    const newTiers = [...customTiers];
    if (newTiers[tierIndex].segments && newTiers[tierIndex].segments.length > 1) {
      newTiers[tierIndex].segments.splice(segmentIndex, 1);
      setCustomTiers(newTiers);
    }
  };

  const getTierIcon = (tierName: string) => {
    const iconMap: { [key: string]: any } = {
      "LEGENDARY": Trophy,
      "EPIC": Star,
      "RARE": Gift,
      "COMMON": Sparkles,
      "NO_REWARD": Dice6
    };
    return iconMap[tierName] || Sparkles;
  };

  const getTierColor = (tierName: string) => {
    const colorMap: { [key: string]: string } = {
      "LEGENDARY": "text-yellow-500",
      "EPIC": "text-purple-500",
      "RARE": "text-blue-500",
      "COMMON": "text-green-500",
      "NO_REWARD": "text-gray-500"
    };
    return colorMap[tierName] || "text-green-500";
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

  // GSAP animations
  useGSAP(() => {
    if (loading || !mounted) return;

    const tl = gsap.timeline();
    
    // Header animation
    tl.fromTo(headerRef.current, 
      { opacity: 0, y: 20 }, 
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    // Staggered section animations
    tl.fromTo(profileRef.current, 
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
      "-=0.3"
    );

    tl.fromTo(appearanceRef.current, 
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    );

    tl.fromTo(notificationsRef.current, 
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    );

    tl.fromTo(scheduleRef.current, 
      { opacity: 0, x: -20 },
      { opacity: 1, x: 0, duration: 0.6, ease: "power2.out" },
      "-=0.4"
    );

    tl.fromTo(saveRef.current, 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      "-=0.3"
    );

  }, { dependencies: [loading, mounted] });

  if (loading || !mounted) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div
        ref={headerRef}
        className="text-center"
      >
        <h1 className="text-3xl font-bold mb-2">Settings</h1>
        <p className="text-muted-foreground">
          Manage your preferences, rewards, and luck settings
        </p>
      </div>

      {/* Tab Navigation */}
      <div className="border-b">
        <div className="flex space-x-8">
          <button
            onClick={() => setActiveTab('profile')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'profile'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <User className="w-4 h-4 inline mr-2" />
            Profile
          </button>
          <button
            onClick={() => setActiveTab('rewards')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'rewards'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Gift className="w-4 h-4 inline mr-2" />
            Rewards
          </button>
          <button
            onClick={() => setActiveTab('luck')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              activeTab === 'luck'
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            }`}
          >
            <Zap className="w-4 h-4 inline mr-2" />
            Luck
          </button>
        </div>
      </div>

      {activeTab === 'profile' && (
        <div className="space-y-6">
          {/* Profile Information */}
          <div
            ref={profileRef}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <User className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Profile Information</h2>
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
          </div>

          {/* Theme Settings */}
          <div
            ref={appearanceRef}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Palette className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Appearance</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-3">Theme</label>
                <div className="grid grid-cols-3 gap-3">
                  <button
                    onClick={() => handleThemeChange("light")}
                    className={`p-3 rounded-lg border transition-all ${
                      settings.theme === "light"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-white border-2 border-gray-300"></div>
                      <span className="text-sm">Light</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleThemeChange("dark")}
                    className={`p-3 rounded-lg border transition-all ${
                      settings.theme === "dark"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-gray-800 border-2 border-gray-600"></div>
                      <span className="text-sm">Dark</span>
                    </div>
                  </button>
                  <button
                    onClick={() => handleThemeChange("system")}
                    className={`p-3 rounded-lg border transition-all ${
                      settings.theme === "system"
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    <div className="flex flex-col items-center space-y-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-r from-white to-gray-800 border-2 border-gray-400"></div>
                      <span className="text-sm">System</span>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Notifications */}
          <div
            ref={notificationsRef}
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
                    Receive notifications for task reminders and achievements
                  </p>
                </div>
                <Switch
                  id="notifications"
                  checked={settings.notifications_enabled}
                  onCheckedChange={handleNotificationToggle}
                />
              </div>

              {settings.notifications_enabled && (
                <div className="pt-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleTestNotification}
                    className="w-full sm:w-auto"
                  >
                    <Bell className="w-4 h-4 mr-2" />
                    Test Notification
                  </Button>
                  <p className="text-xs text-muted-foreground mt-2">
                    Permission status: {permission}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Work Schedule */}
          <div
            ref={scheduleRef}
            className="bg-card border border-border rounded-xl p-6"
          >
            <div className="flex items-center space-x-3 mb-6">
              <Clock className="w-5 h-5 text-muted-foreground" />
              <h2 className="text-lg font-semibold">Work Schedule</h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-2">Daily Task Goal</label>
                <input
                  type="number"
                  value={settings.daily_goal_tasks}
                  onChange={(e) => setSettings({ ...settings, daily_goal_tasks: parseInt(e.target.value) || 1 })}
                  className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  min="1"
                  max="50"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Number of tasks you aim to complete daily
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Working Hours Start</label>
                  <input
                    type="time"
                    value={settings.working_hours_start}
                    onChange={(e) => setSettings({ ...settings, working_hours_start: e.target.value })}
                    className="w-full px-3 py-2 bg-muted rounded-lg focus:outline-none focus:ring-2 focus:ring-primary"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Working Hours End</label>
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
                  <option value="America/New_York">Eastern Time (ET)</option>
                  <option value="America/Chicago">Central Time (CT)</option>
                  <option value="America/Denver">Mountain Time (MT)</option>
                  <option value="America/Los_Angeles">Pacific Time (PT)</option>
                  <option value="Europe/London">London (GMT)</option>
                  <option value="Europe/Paris">Paris (CET)</option>
                  <option value="Europe/Berlin">Berlin (CET)</option>
                  <option value="Asia/Tokyo">Tokyo (JST)</option>
                  <option value="Asia/Shanghai">Shanghai (CST)</option>
                  <option value="Australia/Sydney">Sydney (AEST)</option>
                </select>
              </div>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'rewards' && (
        <div
          ref={profileRef}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Gift className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Reward Configuration</h2>
          </div>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Enable Custom Rewards</p>
                <p className="text-sm text-muted-foreground">
                  Use a custom reward wheel instead of the default configuration
                </p>
              </div>
              <Switch
                id="custom-rewards"
                checked={rewardConfig?.is_active || false}
                onCheckedChange={handleToggleCustomRewards}
                disabled={saving}
              />
            </div>

            {rewardConfig && (
              <div className="space-y-4">
                <div className="p-4 bg-muted/50 rounded-lg">
                  <h3 className="font-medium mb-2">Current Configuration</h3>
                  <p className="text-sm text-muted-foreground">
                    {rewardConfig.is_active ? 'Using custom configuration' : 'Using default configuration'}
                  </p>
                  {rewardConfig.has_custom_config && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleDeleteCustomRewardConfig}
                      disabled={saving}
                      className="mt-2"
                    >
                      Delete Custom Configuration
                    </Button>
                  )}
                </div>

                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Reward Tiers</h3>
                  <div className="grid grid-cols-1 gap-4">
                    {customTiers.map((tier, index) => {
                      const TierIcon = getTierIcon(tier.tier_name);
                      return (
                        <div key={index} className="border border-border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-3">
                              <TierIcon className={`w-5 h-5 ${getTierColor(tier.tier_name)}`} />
                              <h4 className="font-medium">{tier.tier_name}</h4>
                            </div>
                            <Badge variant="secondary">
                              {(tier.probability * 100).toFixed(1)}%
                            </Badge>
                          </div>

                          <div className="space-y-3">
                            {/* Probability Control */}
                            <div>
                              <Label htmlFor={`probability-${index}`} className="text-sm font-medium">
                                Probability ({(tier.probability * 100).toFixed(1)}%)
                              </Label>
                              <input
                                type="range"
                                id={`probability-${index}`}
                                min="0"
                                max="1"
                                step="0.01"
                                value={tier.probability}
                                onChange={(e) => updateTierProbability(index, parseFloat(e.target.value))}
                                className="w-full slider-full-range mt-1"
                                disabled={saving}
                              />
                            </div>

                            {/* Color Controls */}
                            <div className="grid grid-cols-2 gap-3">
                              <div>
                                <Label className="text-sm font-medium">Start Color</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <input
                                    type="color"
                                    value={tier.colors?.[0]?.start || '#22c55e'}
                                    onChange={(e) => {
                                      const newTiers = [...customTiers];
                                      if (!newTiers[index].colors) newTiers[index].colors = [{ start: '#22c55e', end: '#15803d' }];
                                      newTiers[index].colors[0].start = e.target.value;
                                      setCustomTiers(newTiers);
                                    }}
                                    className="w-8 h-8 rounded border border-border"
                                    disabled={saving}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {tier.colors?.[0]?.start || '#22c55e'}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <Label className="text-sm font-medium">End Color</Label>
                                <div className="flex items-center space-x-2 mt-1">
                                  <input
                                    type="color"
                                    value={tier.colors?.[0]?.end || '#15803d'}
                                    onChange={(e) => {
                                      const newTiers = [...customTiers];
                                      if (!newTiers[index].colors) newTiers[index].colors = [{ start: '#22c55e', end: '#15803d' }];
                                      newTiers[index].colors[0].end = e.target.value;
                                      setCustomTiers(newTiers);
                                    }}
                                    className="w-8 h-8 rounded border border-border"
                                    disabled={saving}
                                  />
                                  <span className="text-xs text-muted-foreground">
                                    {tier.colors?.[0]?.end || '#15803d'}
                                  </span>
                                </div>
                              </div>
                            </div>

                            {/* Glow Color */}
                            <div>
                              <Label className="text-sm font-medium">Glow Color</Label>
                              <div className="flex items-center space-x-2 mt-1">
                                <input
                                  type="color"
                                  value={tier.glow_color || 'rgba(34, 197, 194, 0.5)'}
                                  onChange={(e) => {
                                    const newTiers = [...customTiers];
                                    newTiers[index].glow_color = e.target.value;
                                    setCustomTiers(newTiers);
                                  }}
                                  className="w-8 h-8 rounded border border-border"
                                  disabled={saving}
                                />
                                <span className="text-xs text-muted-foreground">
                                  {tier.glow_color || 'rgba(34, 197, 194, 0.5)'}
                                </span>
                              </div>
                            </div>

                            {/* Segments */}
                            {tier.segments && tier.segments.length > 0 ? (
                              <div>
                                <div className="flex items-center justify-between mb-2">
                                  <Label className="text-sm font-medium">Reward Segments</Label>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addNewSegment(index)}
                                    disabled={saving}
                                    className="h-8 px-3"
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add Segment
                                  </Button>
                                </div>
                                <div className="mt-2 space-y-3">
                                  {tier.segments.map((segment: any, segmentIndex: number) => (
                                    <div key={segmentIndex} className="p-3 bg-muted/30 rounded-lg border border-border">
                                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                        {/* Segment Name */}
                                        <div>
                                          <Label className="text-xs font-medium text-muted-foreground">Reward Name</Label>
                                          <Input
                                            value={segment.name}
                                            onChange={(e) => updateSegmentName(index, segmentIndex, e.target.value)}
                                            className="mt-1 h-8 text-sm"
                                            disabled={saving}
                                            placeholder="🎯 Reward Name"
                                          />
                                        </div>

                                        {/* Duration */}
                                        <div>
                                          <Label className="text-xs font-medium text-muted-foreground">Duration (minutes)</Label>
                                          <Input
                                            type="number"
                                            value={segment.duration}
                                            onChange={(e) => updateTierDuration(index, segmentIndex, parseInt(e.target.value))}
                                            className="mt-1 h-8 text-sm"
                                            min="0"
                                            max="300"
                                            disabled={saving}
                                          />
                                        </div>

                                        {/* Weight */}
                                        <div>
                                          <Label className="text-xs font-medium text-muted-foreground">Weight</Label>
                                          <Input
                                            type="number"
                                            value={segment.weight}
                                            onChange={(e) => updateSegmentWeight(index, segmentIndex, parseInt(e.target.value))}
                                            className="mt-1 h-8 text-sm"
                                            min="1"
                                            max="10"
                                            disabled={saving}
                                          />
                                          <p className="text-xs text-muted-foreground mt-1">
                                            Higher weight = more likely to be selected
                                          </p>
                                        </div>

                                        {/* Delete Button */}
                                        <div className="flex items-end">
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => deleteSegment(index, segmentIndex)}
                                            disabled={saving || tier.segments.length <= 1}
                                            className="h-8 px-3 text-destructive hover:text-destructive"
                                          >
                                            <Trash2 className="w-4 h-4 mr-1" />
                                            Delete
                                          </Button>
                                        </div>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              </div>
                            ) : (
                              <div>
                                <Label className="text-sm font-medium">Reward Segments</Label>
                                <div className="mt-2 p-4 bg-muted/30 rounded-lg border border-dashed border-border text-center">
                                  <p className="text-sm text-muted-foreground mb-3">
                                    No reward segments configured for this tier
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => addNewSegment(index)}
                                    disabled={saving}
                                  >
                                    <Plus className="w-4 h-4 mr-1" />
                                    Add First Segment
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Probability Validation */}
                  <div className="p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Total Probability:</span>
                      <Badge 
                        variant={Math.abs(customTiers.reduce((sum, tier) => sum + tier.probability, 0) - 1.0) < 0.01 ? "default" : "destructive"}
                      >
                        {(customTiers.reduce((sum, tier) => sum + tier.probability, 0) * 100).toFixed(1)}%
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground mt-1">
                      Probabilities must sum to 100% for the wheel to work correctly
                    </p>
                  </div>

                  {/* Save Button */}
                  <Button
                    onClick={handleSaveCustomRewardConfig}
                    disabled={saving || Math.abs(customTiers.reduce((sum, tier) => sum + tier.probability, 0) - 1.0) > 0.01}
                    className="w-full"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {saving ? "Saving..." : "Save Custom Configuration"}
                  </Button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {activeTab === 'luck' && (
        <div
          ref={profileRef}
          className="bg-card border border-border rounded-xl p-6"
        >
          <div className="flex items-center space-x-3 mb-6">
            <Zap className="w-5 h-5 text-muted-foreground" />
            <h2 className="text-lg font-semibold">Luck Settings</h2>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Luck Status</p>
                <p className="text-sm text-muted-foreground">
                  View your current luck factors and bonuses
                </p>
              </div>
              <Badge variant="secondary">
                {luckStatus ? `${luckStatus.total_luck.toFixed(2)}x` : 'Loading...'}
              </Badge>
            </div>

            {luckStatus && (
              <div className="pt-4">
                <h3 className="text-lg font-semibold mb-3">Luck Status</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Base Luck</p>
                    <p className="text-2xl font-bold text-primary">{luckStatus.base_luck.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Total Luck</p>
                    <p className="text-2xl font-bold text-primary">{luckStatus.total_luck.toFixed(2)}</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mt-6 mb-3">Luck Breakdown</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Base Luck</p>
                    <p className="text-2xl font-bold text-primary">{luckStatus.luck_breakdown.base_luck.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Streak Bonus</p>
                    <p className="text-2xl font-bold text-primary">{luckStatus.luck_breakdown.streak_bonus.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Level Bonus</p>
                    <p className="text-2xl font-bold text-primary">{luckStatus.luck_breakdown.level_bonus.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Activity Bonus</p>
                    <p className="text-2xl font-bold text-primary">{luckStatus.luck_breakdown.activity_bonus.toFixed(2)}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Comeback Bonus</p>
                    <p className="text-2xl font-bold text-primary">{luckStatus.luck_breakdown.comeback_bonus.toFixed(2)}</p>
                  </div>
                </div>

                <h3 className="text-lg font-semibold mt-6 mb-3">Luck Explanation</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Base Luck</p>
                    <p className="text-sm text-muted-foreground">{luckStatus.luck_explanation.base_luck}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Streak Bonus</p>
                    <p className="text-sm text-muted-foreground">{luckStatus.luck_explanation.streak_bonus}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Level Bonus</p>
                    <p className="text-sm text-muted-foreground">{luckStatus.luck_explanation.level_bonus}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Activity Bonus</p>
                    <p className="text-sm text-muted-foreground">{luckStatus.luck_explanation.activity_bonus}</p>
                  </div>
                  <div className="bg-muted p-4 rounded-lg">
                    <p className="font-medium">Comeback Bonus</p>
                    <p className="text-sm text-muted-foreground">{luckStatus.luck_explanation.comeback_bonus}</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Save Button */}
      <div
        ref={saveRef}
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
      </div>
    </div>
  );
} 