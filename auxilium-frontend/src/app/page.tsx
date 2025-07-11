"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  TrendingUp, 
  Calendar, 
  Target, 
  CheckCircle2, 
  Plus,
  Flame,
  Trophy,
  Gift,
  AlertTriangle,
  Crown,
  Users,
  Timer,
  Sparkles
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useObjectives } from "@/hooks/use-objectives";
import UserScore from "@/components/gamification/user-score";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { userApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function Home() {
  const { objectives, loading: objectivesLoading } = useObjectives();
  const [gamificationStats, setGamificationStats] = useState<any>(null);
  const [dailyStatus, setDailyStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [showUrgentActions, setShowUrgentActions] = useState(false);
  
  // Refs for animations
  const containerRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchGamificationData();
    // Refresh every 2 minutes to maintain psychological engagement
    const interval = setInterval(fetchGamificationData, 120000);
    return () => clearInterval(interval);
  }, []);

  const fetchGamificationData = async () => {
    try {
      const [enhancedStats, dailyStatusData] = await Promise.all([
        userApi.getEnhancedGamificationStats(),
        userApi.getDailyStatus()
      ]);
      
      setGamificationStats(enhancedStats);
      setDailyStatus(dailyStatusData);
      
      // Check for urgent psychological triggers
      const hasUrgentFactors = dailyStatusData?.urgency_factors?.streak_at_risk ||
                              dailyStatusData?.urgency_factors?.daily_goal_pending ||
                              dailyStatusData?.urgency_factors?.bonus_expiring;
      setShowUrgentActions(hasUrgentFactors);
      
    } catch (error) {
      console.error("Failed to fetch gamification data:", error);
    } finally {
      setLoading(false);
    }
  };

  // GSAP Animations
  useGSAP(() => {
    if (loading) return;

    const tl = gsap.timeline();
    
    // Hero section animation
    tl.fromTo(heroRef.current,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" }
    );

    // Stats cards stagger animation
    tl.fromTo(".stat-card",
      { opacity: 0, y: 20, scale: 0.9 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.5, 
        stagger: 0.1,
        ease: "back.out(1.2)" 
      },
      "-=0.5"
    );

    // Quick actions animation
    tl.fromTo(".quick-action-card",
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

    // Gamification elements animation
    tl.fromTo(".gamification-element",
      { opacity: 0, scale: 0.95 },
      { 
        opacity: 1, 
        scale: 1, 
        duration: 0.6, 
        stagger: 0.1,
        ease: "elastic.out(1, 0.8)" 
      },
      "-=0.4"
    );

  }, { dependencies: [loading] });

  const recentObjectives = objectives
    ?.filter(obj => obj.status !== "completed")
    ?.slice(0, 3) || [];

  const urgentActionCount = [
    dailyStatus?.urgency_factors?.streak_at_risk,
    dailyStatus?.urgency_factors?.daily_goal_pending,
    dailyStatus?.urgency_factors?.bonus_expiring,
    gamificationStats?.mystery_boxes_available > 0,
    dailyStatus?.daily_bonus_available
  ].filter(Boolean).length;

  if (loading || objectivesLoading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-32 bg-muted rounded-lg" />
          <div className="grid md:grid-cols-3 gap-4">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-24 bg-muted rounded-lg" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="container mx-auto px-4 py-8 space-y-8">
      {/* Urgent Actions Banner */}
      <AnimatePresence>
        {showUrgentActions && urgentActionCount > 0 && (
          <motion.div
            initial={{ opacity: 0, y: -20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            className="bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-lg p-4 shadow-lg"
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-6 h-6 animate-pulse" />
                <div>
                  <h3 className="font-bold text-lg">⚠️ Urgent Actions Required!</h3>
                  <p className="text-red-100">
                    {urgentActionCount} time-sensitive item{urgentActionCount > 1 ? 's' : ''} need{urgentActionCount === 1 ? 's' : ''} your immediate attention
                  </p>
                </div>
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={() => setShowUrgentActions(false)}
              >
                Got it
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section with Psychological Engagement */}
      <div ref={heroRef} className="text-center space-y-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
            Welcome Back, Champion! 🚀
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            {dailyStatus?.motivational_message || "Your productivity empire awaits. Every task completed builds momentum towards your goals."}
          </p>
          
          {/* Psychological hooks */}
          {gamificationStats?.current_streak > 0 && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="inline-flex items-center space-x-2 bg-gradient-to-r from-orange-100 to-red-100 dark:from-orange-900/20 dark:to-red-800/10 px-4 py-2 rounded-full"
            >
              <Flame className="w-5 h-5 text-orange-500" />
              <span className="font-semibold text-orange-800 dark:text-orange-200">
                {gamificationStats.current_streak}-day streak! Don't break the chain!
              </span>
            </motion.div>
          )}
        </div>
        
        {/* Quick Stats Row */}
        <div className="flex justify-center space-x-8">
          <div className="text-center">
            <p className="text-2xl font-bold text-primary">{gamificationStats?.overall_score || 0}</p>
            <p className="text-sm text-muted-foreground">Total Score</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-purple-600">#{gamificationStats?.rank_this_week || 1}</p>
            <p className="text-sm text-muted-foreground">Weekly Rank</p>
          </div>
          <div className="text-center">
            <p className="text-2xl font-bold text-yellow-600">Level {gamificationStats?.level || 1}</p>
            <p className="text-sm text-muted-foreground">Current Level</p>
          </div>
        </div>
      </div>

      {/* Gamification Dashboard Grid */}
      <div className="grid lg:grid-cols-4 gap-6">
        {/* Enhanced User Score - Takes prominent position */}
        <div className="lg:col-span-1">
          <UserScore className="gamification-element h-full" />
        </div>

        {/* Quick Psychological Actions */}
        <div className="lg:col-span-1 space-y-4">
          {/* Mystery Sphere */}
          {gamificationStats?.mystery_boxes_available > 0 && (
            <Card className="gamification-element p-4 bg-gradient-to-br from-purple-50 to-pink-100 dark:from-purple-900/20 dark:to-pink-800/10 border-purple-200 dark:border-purple-700">
              <div className="flex items-center justify-between mb-3">
                <Sparkles className="w-6 h-6 text-purple-600" />
                <span className="bg-purple-100 text-purple-800 px-2 py-1 rounded-full text-xs font-medium">
                  {gamificationStats.mystery_boxes_available} Available
                </span>
              </div>
              <h3 className="font-semibold mb-2">Mystery Spheres</h3>
              <p className="text-sm text-muted-foreground mb-3">
                Touch the sphere for magical color rewards!
              </p>
              <Button 
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
                onClick={async () => {
                  try {
                    const result = await userApi.openMysteryBox();
                    if (result.success) {
                      toast.success(`🎁 ${result.reward_description}`, { duration: 4000 });
                      fetchGamificationData();
                    }
                  } catch (error) {
                    toast.error("Failed to open mystery sphere");
                  }
                }}
              >
                Touch Mystery Sphere
              </Button>
            </Card>
          )}

          {/* Daily Challenge */}
          <Card className="gamification-element p-4 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-800/10 border-blue-200 dark:border-blue-700">
            <div className="flex items-center justify-between mb-3">
              <Timer className="w-6 h-6 text-blue-600" />
              {dailyStatus?.urgency_factors?.daily_goal_pending && (
                <AlertTriangle className="w-4 h-4 text-red-500 animate-pulse" />
              )}
            </div>
            <h3 className="font-semibold mb-2">Daily Challenge</h3>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Progress</span>
                <span>{dailyStatus?.daily_tasks_completed || 0}/{dailyStatus?.daily_task_goal || 3}</span>
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
                <p className="text-xs text-blue-700 font-medium">🎁 Bonus ready to claim!</p>
              )}
            </div>
          </Card>

          {/* Social Competition */}
          <Card className="gamification-element p-4 bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/10 border-green-200 dark:border-green-700">
            <div className="flex items-center justify-between mb-3">
              <Users className="w-6 h-6 text-green-600" />
              <Crown className="w-4 h-4 text-yellow-500" />
            </div>
            <h3 className="font-semibold mb-2">Leaderboard</h3>
            <div className="space-y-1">
              <div className="flex justify-between text-sm">
                <span>Your Rank</span>
                <span className="font-bold">#{gamificationStats?.rank_this_week || 1}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Season</span>
                <span>#{gamificationStats?.competitive_season || 1}</span>
              </div>
              {(gamificationStats?.rank_this_week || 1) < (gamificationStats?.rank_last_week || 1) && (
                <p className="text-xs text-green-700 font-medium">📈 Climbing the ranks!</p>
              )}
            </div>
          </Card>
        </div>

        {/* Main Content Area */}
        <div className="lg:col-span-2 space-y-6">
                     {/* Recent Objectives with Gamification */}
           <Card className="p-6 stat-card">
             <div className="flex items-center justify-between mb-4">
               <h2 className="text-xl font-semibold flex items-center">
                 <Target className="w-5 h-5 mr-2 text-primary" />
                 Active Objectives
               </h2>
               <Button size="sm" className="quick-action-card">
                 <Plus className="w-4 h-4 mr-2" />
                 New Objective
               </Button>
             </div>
             
             <div className="space-y-3">
               {recentObjectives.length > 0 ? (
                 recentObjectives.map((objective, index) => (
                   <motion.div
                     key={objective.id}
                     initial={{ opacity: 0, x: -20 }}
                     animate={{ opacity: 1, x: 0 }}
                     transition={{ delay: index * 0.1 }}
                     className="flex items-center justify-between p-3 bg-muted/50 rounded-lg hover:bg-muted transition-colors"
                   >
                     <div className="flex items-center space-x-3">
                       <CheckCircle2 className="w-4 h-4 text-muted-foreground" />
                       <div>
                         <p className="font-medium">{objective.title}</p>
                         <p className="text-sm text-muted-foreground">
                           {objective.objective_type} • {objective.status}
                         </p>
                       </div>
                     </div>
                     <div className="text-right">
                       <p className="text-sm text-primary font-medium">
                         +{Math.round((objective.completion_percentage || 0) * 10)} XP
                       </p>
                     </div>
                   </motion.div>
                 ))
               ) : (
                 <div className="text-center py-8">
                   <Target className="w-12 h-12 text-muted-foreground/50 mx-auto mb-4" />
                   <p className="text-muted-foreground mb-4">
                     No active objectives. Create your first one to start earning XP!
                   </p>
                   <Button>
                     <Plus className="w-4 h-4 mr-2" />
                     Create Objective
                   </Button>
                 </div>
               )}
             </div>
           </Card>

           {/* Quick Actions */}
           <div className="quick-action-card">
             <QuickActions />
           </div>
        </div>
      </div>

      {/* Psychological Motivation Section */}
      {(gamificationStats?.near_miss_count > 0 || dailyStatus?.psychological_hooks) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-800/10 border border-yellow-200 dark:border-yellow-700 rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <TrendingUp className="w-5 h-5 mr-2 text-yellow-600" />
            Momentum Building 🔥
          </h3>
          <div className="grid md:grid-cols-2 gap-4">
            {gamificationStats?.near_miss_count > 0 && (
              <div className="bg-white/50 rounded-lg p-4">
                <p className="font-medium text-yellow-800 mb-2">🎯 So Close to Breakthrough!</p>
                <p className="text-sm text-yellow-700">
                  You almost hit {gamificationStats.near_miss_count} major milestone{gamificationStats.near_miss_count > 1 ? 's' : ''}! 
                  The next task could trigger that satisfying achievement unlock.
                </p>
              </div>
            )}
            {dailyStatus?.psychological_hooks?.perfectionist_mode && (
              <div className="bg-white/50 rounded-lg p-4">
                <p className="font-medium text-orange-800 mb-2">💎 Perfectionist Mode Active</p>
                <p className="text-sm text-orange-700">
                  You're in the zone! Complete your daily goal perfectly for maximum psychological satisfaction.
                </p>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </div>
  );
} 