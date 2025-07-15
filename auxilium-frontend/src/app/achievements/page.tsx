"use client";

import { useState, useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  Trophy,
  Star,
  Target,
  Zap,
  Calendar,
  CheckCircle,
  Lock,
  Award,
  Gift,
  Flame,
  TrendingUp,
  Crown,
  Sparkles,
  Timer,
  AlertTriangle,
  Users,
  Ticket
} from "lucide-react";
import { userApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";
import MysteryBoxRealistic from "@/components/ui/mystery-box-realistic";
import { GamificationExplainer } from "@/components/ui/gamification-explainer";
import { Coupon } from "@/types";

export default function AchievementsPage() {
  const [userStats, setUserStats] = useState<any>(null);
  const [dailyStatus, setDailyStatus] = useState<any>(null);
  const [achievementDefinitions, setAchievementDefinitions] = useState<any[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [mysteryBoxOpening, setMysteryBoxOpening] = useState(false);
  const [lastReward, setLastReward] = useState<any>(null);
  const [showMysteryBox3D, setShowMysteryBox3D] = useState(false);
  const [showAllCoupons, setShowAllCoupons] = useState(false);
  
  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const achievementsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
    // Set up real-time updates for gamification stats
    const interval = setInterval(fetchData, 30000); // Refresh every 30 seconds
    return () => clearInterval(interval);
  }, []);

  // Listen for objective completion events to refresh data
  useEffect(() => {
    const handleObjectiveUpdate = () => {
      fetchData();
    };
    
    // Add event listener for objective updates
    window.addEventListener('objectiveCompleted', handleObjectiveUpdate);
    return () => window.removeEventListener('objectiveCompleted', handleObjectiveUpdate);
  }, []);

  const fetchData = async () => {
    try {
      const [enhancedStats, dailyStatusData, definitions, couponsData] = await Promise.all([
        userApi.getEnhancedGamificationStats(),
        userApi.getDailyStatus(),
        userApi.getAchievementDefinitions(),
        userApi.getAvailableCoupons()
      ]);
      
      setUserStats(enhancedStats);
      setDailyStatus(dailyStatusData);
      setCoupons(couponsData.active_coupons || []);
      
      // Map backend definitions to frontend format with icons and colors
      const mappedDefinitions = definitions.map((def: any) => ({
        id: def.id,
        name: def.name,
        description: def.description,
        points: def.points_value,
        icon: getIconForAchievement(def.id),
        color: getColorForAchievement(def.id),
        bgColor: getBgColorForAchievement(def.id)
      }));
      
      setAchievementDefinitions(mappedDefinitions);
    } catch (error) {
      toast.error("Failed to load achievements");
    } finally {
      setLoading(false);
    }
  };

  const handleOpenMysteryBox = () => {
    if (mysteryBoxOpening || !userStats?.mystery_boxes_available || userStats.mystery_boxes_available <= 0) {
      return;
    }
    setShowMysteryBox3D(true);
  };

  const handle3DMysteryBoxOpen = async () => {
    const result = await userApi.openMysteryBox();
    
    if (result.success) {
      setLastReward(result);
      // Refresh data to show new stats
      setTimeout(fetchData, 1000);
      return result;
    } else {
      throw new Error(result.message || "No mystery boxes available");
    }
  };

  const handle3DMysteryBoxClose = () => {
    setShowMysteryBox3D(false);
  };

  const handleUseCoupon = async (couponId: string) => {
    try {
      const result = await userApi.useCoupon(couponId);
      if (result.success) {
        toast.success(`🎉 ${result.celebration}`);
        fetchData(); // Refresh to update coupon list
      } else {
        toast.error(result.message || "Failed to use coupon");
      }
    } catch (error) {
      toast.error("Failed to use coupon");
    }
  };

  // Helper functions to map achievement IDs to UI elements
  const getIconForAchievement = (id: string) => {
    const iconMap: { [key: string]: any } = {
      first_steps: CheckCircle,
      task_master: Target,
      goal_getter: Trophy,
      streak_starter: Zap,
      week_warrior: Calendar,
      planning_pro: Star,
      early_bird: Award,
      perfectionist: Crown,
      comeback_king: TrendingUp
    };
    return iconMap[id] || Trophy;
  };

  const getColorForAchievement = (id: string) => {
    const colorMap: { [key: string]: string } = {
      first_steps: "text-green-500",
      task_master: "text-blue-500",
      goal_getter: "text-purple-500",
      streak_starter: "text-orange-500",
      week_warrior: "text-red-500",
      planning_pro: "text-yellow-500",
      early_bird: "text-cyan-500",
      perfectionist: "text-pink-500",
      comeback_king: "text-indigo-500"
    };
    return colorMap[id] || "text-gray-500";
  };

  const getBgColorForAchievement = (id: string) => {
    const bgColorMap: { [key: string]: string } = {
      first_steps: "bg-green-100 dark:bg-green-900/20",
      task_master: "bg-blue-100 dark:bg-blue-900/20",
      goal_getter: "bg-purple-100 dark:bg-purple-900/20",
      streak_starter: "bg-orange-100 dark:bg-orange-900/20",
      week_warrior: "bg-red-100 dark:bg-red-900/20",
      planning_pro: "bg-yellow-100 dark:bg-yellow-900/20",
      early_bird: "bg-cyan-100 dark:bg-cyan-900/20",
      perfectionist: "bg-pink-100 dark:bg-pink-900/20",
      comeback_king: "bg-indigo-100 dark:bg-indigo-900/20"
    };
    return bgColorMap[id] || "bg-gray-100 dark:bg-gray-900/20";
  };

  const unlockedAchievements = userStats?.recent_achievements || [];
  const totalScore = userStats?.overall_score || 0;
  const currentStreak = userStats?.current_streak || 0;

  // Check if achievement is unlocked
  const isUnlocked = (achievementId: string) => {
    return unlockedAchievements.some((a: any) => a.achievement_id === achievementId);
  };

  // Get coupons to display
  const displayedCoupons = showAllCoupons ? coupons : coupons.slice(0, 4);
  const expiringSoonCoupons = coupons.filter(c => c.hours_left < 6);

  // GSAP animations
  useGSAP(() => {
    if (loading) return;

    const tl = gsap.timeline();
    
    // Stats cards animation with stagger
    tl.fromTo(".stat-card", 
      { opacity: 0, y: 20, scale: 0.9 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.5, 
        stagger: 0.1,
        ease: "back.out(1.2)" 
      }
    );

    // Psychological cards
    tl.fromTo(".psych-card",
      { opacity: 0, x: -20 },
      { 
        opacity: 1, 
        x: 0, 
        duration: 0.4, 
        stagger: 0.08,
        ease: "power2.out" 
      },
      "-=0.3"
    );

    // Achievement cards with stagger
    tl.fromTo(".achievement-card",
      { opacity: 0, scale: 0.9 },
      { 
        opacity: 1, 
        scale: 1, 
        duration: 0.5, 
        stagger: 0.05,
        ease: "back.out(1.2)" 
      },
      "-=0.2"
    );

    // Mystery box pulsing animation
    if (userStats?.mystery_boxes_available > 0) {
      gsap.to(".mystery-box", {
        scale: 1.05,
        duration: 1.2,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
    }

  }, { dependencies: [loading, unlockedAchievements.length] });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div ref={containerRef} className="container mx-auto px-4 py-8">
      {/* Page Header with Explainer */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">🏆 Achievements & Rewards</h1>
          <p className="text-muted-foreground">Track your progress, unlock rewards, and use your earned coupons</p>
        </div>
        <GamificationExplainer />
      </div>

      {/* Enhanced Stats Overview */}
      <div ref={statsRef} className="grid md:grid-cols-4 gap-4 mb-8">
        <div className="stat-card bg-card border border-border rounded-xl p-6 text-center">
          <Award className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-bold mb-1">{totalScore}</p>
          <p className="text-muted-foreground">Total Score</p>
          <p className="text-xs text-green-600 mt-1">Lifetime: {userStats?.lifetime_score || 0}</p>
        </div>

        <div className="stat-card bg-card border border-border rounded-xl p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <Ticket className="w-12 h-12 text-purple-500" />
          </div>
          <p className="text-3xl font-bold mb-1">{userStats?.current_coupons || 0}</p>
          <p className="text-muted-foreground">Active Coupons</p>
          <p className="text-xs text-purple-600 mt-1">Total earned: {userStats?.total_coupons_earned || 0}</p>
        </div>

        <div className="stat-card bg-card border border-border rounded-xl p-6 text-center">
          <div className="flex items-center justify-center mb-2">
            <Flame className="w-12 h-12 text-orange-500" />
            {userStats?.streak_multiplier > 1 && (
              <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-2 py-1 rounded-full">
                {userStats.streak_multiplier}x
              </span>
            )}
          </div>
          <p className="text-3xl font-bold mb-1">{currentStreak}</p>
          <p className="text-muted-foreground">Current Streak</p>
          <p className="text-xs text-blue-600 mt-1">Best: {userStats?.longest_streak || 0}</p>
        </div>

        <div className="stat-card bg-card border border-border rounded-xl p-6 text-center">
          <Trophy className="w-12 h-12 text-blue-500 mx-auto mb-2" />
          <p className="text-3xl font-bold mb-1">
            {unlockedAchievements.length}/{achievementDefinitions.length}
          </p>
          <p className="text-muted-foreground">Achievements</p>
          <p className="text-xs text-green-600 mt-1">Level {userStats?.level || 1}</p>
        </div>
      </div>

      {/* Available Coupons Section */}
      {coupons.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold flex items-center">
              <Gift className="w-6 h-6 mr-2 text-purple-500" />
              Your Active Coupons ({coupons.length})
            </h2>
            {coupons.length > 4 && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowAllCoupons(!showAllCoupons)}
              >
                {showAllCoupons ? 'Show Less' : `Show All (${coupons.length})`}
              </Button>
            )}
          </div>

          {/* Expiration Warning */}
          {expiringSoonCoupons.length > 0 && (
            <div className="mb-4 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-800/10 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4">
              <div className="flex items-center">
                <AlertTriangle className="w-5 h-5 text-yellow-600 mr-2" />
                <span className="font-medium text-yellow-800 dark:text-yellow-200">
                  ⏰ {expiringSoonCoupons.length} coupon{expiringSoonCoupons.length > 1 ? 's' : ''} expire{expiringSoonCoupons.length === 1 ? 's' : ''} in under 6 hours!
                </span>
              </div>
            </div>
          )}

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayedCoupons.map((coupon) => (
              <motion.div
                key={coupon.id}
                className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-800/10 border border-purple-200 dark:border-purple-700 rounded-lg p-4"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center">
                    <Ticket className="w-5 h-5 text-purple-600 mr-2" />
                    <h3 className="font-semibold text-purple-800 dark:text-purple-200">
                      {coupon.display_name}
                    </h3>
                  </div>
                  <Badge 
                    variant={coupon.hours_left < 6 ? "destructive" : coupon.hours_left < 12 ? "default" : "secondary"}
                    className="text-xs"
                  >
                    {coupon.hours_left < 1 ? "< 1h" : `${Math.floor(coupon.hours_left)}h left`}
                  </Badge>
                </div>

                <p className="text-sm text-purple-600 dark:text-purple-300 mb-3">
                  {coupon.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-xs text-purple-500 dark:text-purple-400">
                    {coupon.duration_minutes} min • {coupon.rarity}
                  </span>
                  <Button
                    size="sm"
                    onClick={() => handleUseCoupon(coupon.id)}
                    className="bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    Use Now
                  </Button>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Coupon Usage Stats */}
          <div className="mt-4 text-center text-sm text-muted-foreground">
            <p>
              📊 Total earned: {userStats?.total_coupons_earned || 0} • 
              Used: {userStats?.total_coupons_used || 0} • 
              Usage rate: {Math.round((userStats?.coupon_usage_rate || 0) * 100)}%
            </p>
          </div>
        </div>
      )}

      {/* Psychological Engagement Cards */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        {/* Daily Status & Urgency */}
        <div className="psych-card bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/10 border border-blue-200 dark:border-blue-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Timer className="w-8 h-8 text-blue-600" />
            {dailyStatus?.urgency_factors?.deadline_approaching && (
              <AlertTriangle className="w-6 h-6 text-red-500 animate-pulse" />
            )}
          </div>
          <h3 className="text-lg font-semibold mb-2">Daily Progress</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Tasks Today</span>
              <span className="font-medium">{dailyStatus?.daily_tasks_completed || 0}/{dailyStatus?.daily_task_goal || 3}</span>
            </div>
            <div className="w-full bg-blue-200 rounded-full h-2">
              <div 
                className="bg-blue-600 h-2 rounded-full transition-all duration-500"
                style={{ 
                  width: `${Math.min(((dailyStatus?.daily_tasks_completed || 0) / (dailyStatus?.daily_task_goal || 3)) * 100, 100)}%` 
                }}
              />
            </div>
            {dailyStatus?.daily_bonus_available && (
              <p className="text-xs text-blue-700 font-medium">🎁 Daily bonus ready!</p>
            )}
            {dailyStatus?.decay_warning && (
              <p className="text-xs text-red-600 font-medium animate-pulse">⚠️ Progress at risk!</p>
            )}
          </div>
        </div>

        {/* Mystery Sphere & Variable Rewards */}
        <div className="psych-card bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/10 border border-purple-200 dark:border-purple-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Sparkles className="w-8 h-8 text-purple-600" />
            <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
              {userStats?.mystery_boxes_available || 0} Available
            </span>
          </div>
          <h3 className="text-lg font-semibold mb-2">Mystery Spheres</h3>
          <Button
            onClick={handleOpenMysteryBox}
            disabled={mysteryBoxOpening || !userStats?.mystery_boxes_available || userStats.mystery_boxes_available <= 0}
            className={`w-full mystery-box ${userStats?.mystery_boxes_available > 0 ? 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700' : ''}`}
          >
            {mysteryBoxOpening ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Opening Sphere...
              </div>
            ) : userStats?.mystery_boxes_available > 0 ? (
              <div className="flex items-center">
                <Sparkles className="w-4 h-4 mr-2" />
                Touch Mystery Sphere
              </div>
            ) : (
              "Complete tasks to earn spheres"
            )}
          </Button>
        </div>

        {/* Social Competition */}
        <div className="psych-card bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/10 border border-green-200 dark:border-green-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-4">
            <Users className="w-8 h-8 text-green-600" />
            <div className="text-right">
              <p className="text-xs text-green-600">Season Rank</p>
              <p className="font-bold text-green-800">#{userStats?.seasonal_rank || 1}</p>
            </div>
          </div>
          <h3 className="text-lg font-semibold mb-2">Competition</h3>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>This Week</span>
              <span className="font-medium">#{userStats?.rank_this_week || 1}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Last Week</span>
              <span className={`font-medium ${(userStats?.rank_this_week || 1) < (userStats?.rank_last_week || 1) ? 'text-green-600' : 'text-red-600'}`}>
                #{userStats?.rank_last_week || 1}
                {(userStats?.rank_this_week || 1) < (userStats?.rank_last_week || 1) ? ' ↗️' : ' ↘️'}
              </span>
            </div>
            {userStats?.comeback_bonus_available && (
              <p className="text-xs text-green-700 font-medium">💪 Comeback bonus active!</p>
            )}
          </div>
        </div>
      </div>

      {/* Level Progress */}
      <div className="bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20 rounded-xl p-6 mb-8">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-xl font-bold">Level {userStats?.level || 1}</h3>
            <p className="text-muted-foreground">
              {userStats?.experience_points || 0} / {userStats?.experience_to_next_level || 100} XP
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">Progress</p>
            <p className="text-2xl font-bold text-primary">
              {Math.round(((userStats?.progress_to_next_level || 0) * 100))}%
            </p>
          </div>
        </div>
        <div className="w-full bg-muted rounded-full h-3">
          <motion.div 
            className="bg-gradient-to-r from-primary to-secondary h-3 rounded-full"
            initial={{ width: 0 }}
            animate={{ 
              width: `${Math.round(((userStats?.progress_to_next_level || 0) * 100))}%` 
            }}
            transition={{ duration: 1, ease: "easeOut" }}
          />
        </div>
        
        {/* XP Progress Details */}
        <div className="mt-4 grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <p className="text-muted-foreground">Current XP</p>
            <p className="font-bold text-primary">{userStats?.experience_points || 0}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Next Level</p>
            <p className="font-bold text-blue-600">{userStats?.experience_to_next_level || 100}</p>
          </div>
          <div className="text-center">
            <p className="text-muted-foreground">Total XP Earned</p>
            <p className="font-bold text-green-600">{userStats?.total_experience_earned || 0}</p>
          </div>
        </div>
      </div>

      {/* Near Miss & Psychological Hooks */}
      {(userStats?.near_miss_count > 0 || dailyStatus?.psychological_hooks) && (
        <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/10 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Ticket className="w-5 h-5 mr-2 text-yellow-600" />
            Motivational Boost
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {userStats?.near_miss_count > 0 && (
              <div className="bg-white/50 rounded-lg p-4">
                <p className="text-sm font-medium text-yellow-800">🎯 So Close!</p>
                <p className="text-xs text-yellow-700">
                  You almost hit {userStats.near_miss_count} major milestone{userStats.near_miss_count > 1 ? 's' : ''}! 
                  Keep pushing for those breakthrough moments.
                </p>
              </div>
            )}
            {dailyStatus?.psychological_hooks?.perfectionist_mode && (
              <div className="bg-white/50 rounded-lg p-4">
                <p className="text-sm font-medium text-orange-800">💎 Perfectionist Mode</p>
                <p className="text-xs text-orange-700">
                  All-or-nothing mindset activated. Complete your daily goal for maximum satisfaction!
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Achievements Grid */}
      <div ref={achievementsRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievementDefinitions.map((achievement, index) => {
          const unlocked = isUnlocked(achievement.id);
          
          return (
            <motion.div
              key={achievement.id}
              className={`
                achievement-card ${unlocked ? 'unlocked' : ''}
                relative overflow-hidden rounded-xl p-6 transition-all
                ${unlocked 
                  ? "bg-card border-2 border-primary shadow-lg shadow-primary/20" 
                  : "bg-muted/50 border border-border opacity-75"
                }
              `}
              whileHover={unlocked ? { scale: 1.02 } : { scale: 1.01 }}
              transition={{ duration: 0.2 }}
            >
              {/* Background Pattern */}
              {unlocked && (
                <div className="absolute inset-0 opacity-10">
                  <div className="absolute -top-12 -right-12 w-32 h-32 bg-primary rounded-full" />
                  <div className="absolute -bottom-8 -left-8 w-24 h-24 bg-primary rounded-full" />
                </div>
              )}

              <div className="relative z-10">
                <div className="flex items-start justify-between mb-4">
                  <div className={`p-3 rounded-lg ${achievement.bgColor}`}>
                    <achievement.icon className={`w-8 h-8 ${achievement.color}`} />
                  </div>
                  {!unlocked && (
                    <Lock className="w-5 h-5 text-muted-foreground" />
                  )}
                  {unlocked && (
                    <div className="text-primary animate-pulse">
                      <Sparkles className="w-5 h-5" />
                    </div>
                  )}
                </div>

                <h3 className="text-lg font-semibold mb-2">{achievement.name}</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  {achievement.description}
                </p>

                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">
                    {achievement.points} points
                  </span>
                  {unlocked && (
                    <span className="text-xs text-primary font-medium bg-primary/10 px-2 py-1 rounded-full">
                      UNLOCKED ✨
                    </span>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Progress Section */}
      <div
        ref={progressRef}
        className="mt-12 bg-card border border-border rounded-xl p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Keep Going! 🚀</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          You're making incredible progress! The psychological momentum is building. 
          Every task completed brings you closer to that next dopamine hit. Don't break the chain!
        </p>
        
        <div className="flex items-center justify-center space-x-2 mb-4">
          {[...Array(5)].map((_, i) => (
            <Star 
              key={i}
              className={`w-5 h-5 ${i < Math.floor((userStats?.progress_to_next_level || 0) * 5) ? 'text-yellow-500' : 'text-muted-foreground'}`} 
            />
          ))}
        </div>

        {/* Urgency messaging for psychological engagement */}
        {dailyStatus?.urgency_factors && (
          <div className="mt-6 p-4 bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-800/10 border border-red-200 dark:border-red-700 rounded-lg">
            <h4 className="font-semibold text-red-800 dark:text-red-200 mb-2">⏰ Don't Let This Slip Away!</h4>
            <div className="text-sm text-red-700 dark:text-red-300 space-y-1">
              {dailyStatus.urgency_factors.streak_at_risk && (
                <p>🔥 Your {currentStreak}-day streak is at risk!</p>
              )}
              {dailyStatus.urgency_factors.daily_goal_pending && (
                <p>🎯 Daily goal expires in hours!</p>
              )}
              {dailyStatus.urgency_factors.bonus_expiring && (
                <p>⚡ Active bonuses are about to expire!</p>
              )}
            </div>
          </div>
        )}
      </div>

      {/* 3D Mystery Box */}
      <MysteryBoxRealistic 
        isOpen={showMysteryBox3D}
        onOpen={handle3DMysteryBoxOpen}
        onClose={handle3DMysteryBoxClose}
      />
    </div>
  );
} 