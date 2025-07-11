"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Flame, 
  Star, 
  Gift, 
  Crown, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  Timer
} from "lucide-react";
import { userApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { MysteryBoxRealistic } from "@/components/ui";

interface UserScoreProps {
  className?: string;
}

export default function UserScore({ className = "" }: UserScoreProps) {
  const [stats, setStats] = useState<any>(null);
  const [dailyStatus, setDailyStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [mysteryBoxAnimating, setMysteryBoxAnimating] = useState(false);
  const [showMysteryBox3D, setShowMysteryBox3D] = useState(false);

  useEffect(() => {
    fetchStats();
    // Refresh every minute to keep psychological hooks fresh
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const [enhancedStats, dailyStatusData] = await Promise.all([
        userApi.getEnhancedGamificationStats(),
        userApi.getDailyStatus()
      ]);
      setStats(enhancedStats);
      setDailyStatus(dailyStatusData);
    } catch (error) {
      console.error("Failed to fetch user stats:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickMysteryBox = () => {
    if (mysteryBoxAnimating || !stats?.mystery_boxes_available || stats.mystery_boxes_available <= 0) {
      return;
    }
    setShowMysteryBox3D(true);
  };

  const handle3DMysteryBoxOpen = async () => {
    const result = await userApi.openMysteryBox();
    
    if (result.success) {
      // Immediate refresh for psychological satisfaction
      setTimeout(fetchStats, 500);
      return result;
    } else {
      throw new Error(result.message || "No mystery boxes available");
    }
  };

  const handle3DMysteryBoxClose = () => {
    setShowMysteryBox3D(false);
  };

  if (loading) {
    return (
      <div className={`bg-card border border-border rounded-lg p-4 ${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-muted rounded w-1/2" />
          <div className="h-6 bg-muted rounded w-3/4" />
        </div>
      </div>
    );
  }

  const levelProgress = ((stats?.experience_points || 0) / (stats?.experience_to_next_level || 100)) * 100;
  const hasUrgentActions = dailyStatus?.urgency_factors?.streak_at_risk || 
                          dailyStatus?.urgency_factors?.daily_goal_pending ||
                          dailyStatus?.urgency_factors?.bonus_expiring;

  return (
    <motion.div 
      className={`bg-gradient-to-br from-card to-card/50 border border-border rounded-lg p-4 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with Level and Urgency */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Crown className="w-5 h-5 text-purple-500" />
          <span className="font-bold text-lg">Level {stats?.level || 1}</span>
          {hasUrgentActions && (
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Rank</p>
          <p className="font-bold text-sm">#{stats?.rank_this_week || 1}</p>
        </div>
      </div>

      {/* Score and Streak */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Trophy className="w-4 h-4 text-yellow-500 mr-1" />
            <span className="text-lg font-bold">{stats?.overall_score || 0}</span>
          </div>
          <p className="text-xs text-muted-foreground">Score</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Star className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-lg font-bold">{stats?.experience_points || 0}</span>
          </div>
          <p className="text-xs text-muted-foreground">XP</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Flame className="w-4 h-4 text-orange-500 mr-1" />
            <span className="text-lg font-bold">{stats?.current_streak || 0}</span>
            {stats?.streak_multiplier > 1 && (
              <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded">
                {stats.streak_multiplier}x
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Streak</p>
        </div>
      </div>

      {/* Level Progress Bar */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Level {stats?.level || 1} Progress</span>
          <span>{stats?.experience_points || 0} / {(stats?.experience_points || 0) + (stats?.experience_to_next_level || 100)} XP</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <motion.div 
            className="bg-gradient-to-r from-primary to-secondary h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(levelProgress, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="text-center text-xs text-muted-foreground mt-1">
          {stats?.experience_to_next_level || 100} XP to Level {(stats?.level || 1) + 1}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="space-y-2">
        {/* Mystery Sphere Quick Action */}
        {stats?.mystery_boxes_available > 0 && (
          <Button
            onClick={handleQuickMysteryBox}
            disabled={mysteryBoxAnimating}
            size="sm"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {mysteryBoxAnimating ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                Opening Sphere...
              </div>
            ) : (
              <div className="flex items-center">
                <Sparkles className="w-3 h-3 mr-2" />
                Touch Mystery Sphere ({stats.mystery_boxes_available})
              </div>
            )}
          </Button>
        )}

        {/* Daily Bonus Action */}
        {dailyStatus?.daily_bonus_available && (
          <Button
            onClick={async () => {
              try {
                await userApi.claimDailyBonus();
                toast.success("🎁 Daily bonus claimed!");
                fetchStats();
              } catch (error) {
                toast.error("Failed to claim bonus");
              }
            }}
            size="sm"
            variant="outline"
            className="w-full"
          >
            <Sparkles className="w-3 h-3 mr-2" />
            Claim Daily Bonus
          </Button>
        )}

        {/* Urgency Messages */}
        <AnimatePresence>
          {hasUrgentActions && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-800/10 border border-red-200 dark:border-red-700 rounded-lg p-2"
            >
              <div className="flex items-center mb-1">
                <Timer className="w-3 h-3 text-red-600 mr-1" />
                <span className="text-xs font-medium text-red-800 dark:text-red-200">Urgent!</span>
              </div>
              <div className="text-xs text-red-700 dark:text-red-300 space-y-0.5">
                {dailyStatus.urgency_factors.streak_at_risk && (
                  <p>🔥 Streak at risk!</p>
                )}
                {dailyStatus.urgency_factors.daily_goal_pending && (
                  <p>🎯 Daily goal expires soon!</p>
                )}
                {dailyStatus.urgency_factors.bonus_expiring && (
                  <p>⚡ Bonuses expiring!</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Motivational Hooks */}
        {stats?.near_miss_count > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-800/10 border border-yellow-200 dark:border-yellow-700 rounded-lg p-2"
          >
            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">🎯 So Close!</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              Almost hit {stats.near_miss_count} milestone{stats.near_miss_count > 1 ? 's' : ''}!
            </p>
          </motion.div>
        )}

        {/* Weekly Challenge Tease */}
        {dailyStatus?.weekly_challenge_available && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">
              🏆 Weekly challenge ready
            </p>
          </div>
        )}
      </div>

      {/* Progress Stars */}
      <div className="flex justify-center space-x-1 mt-3 pt-3 border-t border-border">
        {[...Array(5)].map((_, i) => (
          <Star 
            key={i}
            className={`w-3 h-3 ${i < Math.floor(levelProgress / 20) ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} 
          />
        ))}
      </div>

      {/* 3D Mystery Box */}
              <MysteryBoxRealistic 
        isOpen={showMysteryBox3D}
        onOpen={handle3DMysteryBoxOpen}
        onClose={handle3DMysteryBoxClose}
        modelPath="/models/treasure-chest.glb"
      />
    </motion.div>
  );
} 