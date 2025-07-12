"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Trophy, 
  Flame, 
  Ticket, 
  Gift, 
  Clock, 
  TrendingUp, 
  AlertTriangle,
  Sparkles,
  Timer,
  Package,
  Award,
  Zap
} from "lucide-react";
import { userApi } from "@/lib/api";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import toast from "react-hot-toast";
import { MysteryBoxRealistic } from "@/components/ui";
import { Coupon, DailyStatus, GamificationStats } from "@/types";

interface UserScoreProps {
  className?: string;
}

export default function UserScore({ className = "" }: UserScoreProps) {
  const [stats, setStats] = useState<GamificationStats | null>(null);
  const [dailyStatus, setDailyStatus] = useState<DailyStatus | null>(null);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [loading, setLoading] = useState(true);
  const [mysteryBoxAnimating, setMysteryBoxAnimating] = useState(false);
  const [showMysteryBox3D, setShowMysteryBox3D] = useState(false);

  useEffect(() => {
    fetchStats();
    // Refresh every minute to keep coupons and psychological hooks fresh
    const interval = setInterval(fetchStats, 60000);
    return () => clearInterval(interval);
  }, []);

  const fetchStats = async () => {
    try {
      const [enhancedStats, dailyStatusData, couponsData] = await Promise.all([
        userApi.getEnhancedGamificationStats(),
        userApi.getDailyStatus(),
        userApi.getAvailableCoupons()
      ]);
      setStats(enhancedStats);
      setDailyStatus(dailyStatusData);
      setCoupons(couponsData.active_coupons || []);
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
      // Show celebration for coupons earned
      if (result.coupons_earned > 0) {
        toast.success(`🎉 ${result.celebration} - ${result.coupons_earned} coupons earned!`);
      }
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

  const handleUseCoupon = async (couponId: string) => {
    try {
      const result = await userApi.useCoupon(couponId);
      if (result.success) {
        toast.success(`🎉 ${result.celebration}`);
        fetchStats();
      } else {
        toast.error(result.message || "Failed to use coupon");
      }
    } catch (error) {
      toast.error("Failed to use coupon");
    }
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

  const mysteryBoxProgress = ((stats?.mystery_box_progress || 0) / (stats?.mystery_box_needed || 100)) * 100;
  const hasUrgentActions = dailyStatus?.urgency_factors?.streak_at_risk || 
                          dailyStatus?.urgency_factors?.coupons_expiring ||
                          dailyStatus?.urgency_factors?.bonus_expiring;

  const expiringSoonCoupons = coupons.filter(c => c.hours_left < 6);

  return (
    <motion.div 
      className={`bg-gradient-to-br from-card to-card/50 border border-border rounded-lg p-4 ${className}`}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header with Coupons and Urgency */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center space-x-2">
          <Ticket className="w-5 h-5 text-purple-500" />
          <span className="font-bold text-lg">{stats?.current_coupons || 0} Coupons</span>
          {hasUrgentActions && (
            <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
          )}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Rank</p>
          <p className="font-bold text-sm">#{stats?.rank_this_week || 1}</p>
        </div>
      </div>

      {/* Coupon Stats */}
      <div className="grid grid-cols-3 gap-3 mb-3">
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Ticket className="w-4 h-4 text-green-500 mr-1" />
            <span className="text-lg font-bold">{stats?.total_coupons_earned || 0}</span>
          </div>
          <p className="text-xs text-muted-foreground">Earned</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Zap className="w-4 h-4 text-blue-500 mr-1" />
            <span className="text-lg font-bold">{stats?.total_coupons_used || 0}</span>
          </div>
          <p className="text-xs text-muted-foreground">Used</p>
        </div>
        
        <div className="text-center">
          <div className="flex items-center justify-center mb-1">
            <Flame className="w-4 h-4 text-orange-500 mr-1" />
            <span className="text-lg font-bold">{stats?.current_streak || 0}</span>
            {stats?.streak_multiplier && stats.streak_multiplier > 1 && (
              <span className="ml-1 text-xs bg-orange-100 text-orange-800 px-1 py-0.5 rounded">
                {stats.streak_multiplier}x
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground">Streak</p>
        </div>
      </div>

      {/* Mystery Box Progress */}
      <div className="mb-3">
        <div className="flex justify-between text-xs text-muted-foreground mb-1">
          <span>Mystery Box Progress</span>
          <span>{stats?.mystery_box_progress || 0} / {stats?.mystery_box_needed || 100} pts</span>
        </div>
        <div className="w-full bg-muted rounded-full h-2">
          <motion.div 
            className="bg-gradient-to-r from-purple-500 to-pink-500 h-2 rounded-full"
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(mysteryBoxProgress, 100)}%` }}
            transition={{ duration: 0.8, ease: "easeOut" }}
          />
        </div>
        <div className="text-center text-xs text-muted-foreground mt-1">
          {(stats?.mystery_box_needed || 100) - (stats?.mystery_box_progress || 0)} pts to next box
        </div>
      </div>

      {/* Available Coupons */}
      {coupons.length > 0 && (
        <div className="mb-3">
          <h4 className="text-sm font-medium mb-2 flex items-center justify-between">
            <span className="flex items-center">
              <Gift className="w-4 h-4 mr-1" />
              Available Rewards ({coupons.length})
            </span>
            {coupons.length > 0 && (
              <span className="text-xs text-purple-600">
                {expiringSoonCoupons.length > 0 && `${expiringSoonCoupons.length} expiring soon`}
              </span>
            )}
          </h4>
          <div className="space-y-1 max-h-80 overflow-y-auto">
            {coupons.map((coupon) => (
              <div key={coupon.id} className="flex items-center justify-between p-2 bg-muted/50 rounded text-xs">
                <div className="flex items-center space-x-2 flex-1">
                  <span className="font-medium truncate">{coupon.display_name}</span>
                  <Badge variant={coupon.hours_left < 6 ? "destructive" : "secondary"} className="text-xs px-1 py-0 shrink-0">
                    {coupon.hours_left < 1 ? "< 1h" : `${Math.floor(coupon.hours_left)}h`}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleUseCoupon(coupon.id)}
                  className="text-xs px-2 py-1 ml-2 shrink-0"
                >
                  Use
                </Button>
              </div>
            ))}
          </div>
          {coupons.length === 0 && (
            <p className="text-xs text-muted-foreground text-center py-2">
              🎯 Complete tasks to earn coupons!
            </p>
          )}
        </div>
      )}

      {/* Quick Actions */}
      <div className="space-y-2">
        {/* Mystery Box Quick Action */}
        {stats?.mystery_boxes_available && stats.mystery_boxes_available > 0 && (
          <Button
            onClick={handleQuickMysteryBox}
            disabled={mysteryBoxAnimating}
            size="sm"
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white"
          >
            {mysteryBoxAnimating ? (
              <div className="flex items-center">
                <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white mr-2" />
                Opening Box...
              </div>
            ) : (
              <div className="flex items-center">
                <Package className="w-3 h-3 mr-2" />
                Open Mystery Box ({stats.mystery_boxes_available})
              </div>
            )}
          </Button>
        )}

        {/* Daily Bonus Action */}
        {dailyStatus?.daily_bonus_available && (
          <Button
            onClick={async () => {
              try {
                const result = await userApi.claimDailyBonus();
                if (result.success) {
                  toast.success(`🎁 ${result.celebration}`);
                  fetchStats();
                } else {
                  toast.error(result.message || "Failed to claim bonus");
                }
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
                {dailyStatus?.urgency_factors?.streak_at_risk && (
                  <p>🔥 Streak at risk!</p>
                )}
                {dailyStatus?.urgency_factors?.coupons_expiring && (
                  <p>🎫 Coupons expiring today!</p>
                )}
                {dailyStatus?.urgency_factors?.bonus_expiring && (
                  <p>⚡ Daily bonus expiring!</p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Expiration Warning */}
        {expiringSoonCoupons.length > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-800/10 border border-yellow-200 dark:border-yellow-700 rounded-lg p-2"
          >
            <p className="text-xs font-medium text-yellow-800 dark:text-yellow-200">⏰ Use Soon!</p>
            <p className="text-xs text-yellow-700 dark:text-yellow-300">
              {expiringSoonCoupons.length} coupon{expiringSoonCoupons.length > 1 ? 's' : ''} expire{expiringSoonCoupons.length === 1 ? 's' : ''} in under 6 hours
            </p>
          </motion.div>
        )}

        {/* Encouragement Messages */}
        {stats?.current_coupons === 0 && stats?.total_coupons_earned > 0 && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-800/10 border border-blue-200 dark:border-blue-700 rounded-lg p-2"
          >
            <p className="text-xs font-medium text-blue-800 dark:text-blue-200">💪 Keep Going!</p>
            <p className="text-xs text-blue-700 dark:text-blue-300">
              You've earned {stats.total_coupons_earned} coupons so far. Complete more tasks to earn rewards!
            </p>
          </motion.div>
        )}

        {/* First-time encouragement */}
        {stats?.total_coupons_earned === 0 && (
          <div className="text-center py-2">
            <p className="text-xs text-muted-foreground">
              🎯 Complete tasks to earn your first coupons!
            </p>
          </div>
        )}
      </div>

      {/* Usage Rate Stars */}
      <div className="flex justify-center space-x-1 mt-3 pt-3 border-t border-border">
        {[...Array(5)].map((_, i) => (
          <Trophy 
            key={i}
            className={`w-3 h-3 ${i < Math.floor((stats?.coupon_usage_rate || 0) * 5) ? 'text-yellow-500 fill-current' : 'text-muted-foreground'}`} 
          />
        ))}
      </div>
      <div className="text-center text-xs text-muted-foreground mt-1">
        {Math.round((stats?.coupon_usage_rate || 0) * 100)}% coupons used
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