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
  Award
} from "lucide-react";
import { userApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function AchievementsPage() {
  const [userStats, setUserStats] = useState<any>(null);
  const [achievementDefinitions, setAchievementDefinitions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const achievementsRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [stats, definitions] = await Promise.all([
        userApi.getGamificationStats(),
        userApi.getAchievementDefinitions()
      ]);
      
      setUserStats(stats);
      
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

  // Helper functions to map achievement IDs to UI elements
  const getIconForAchievement = (id: string) => {
    const iconMap: { [key: string]: any } = {
      first_steps: CheckCircle,
      task_master: Target,
      goal_getter: Trophy,
      streak_starter: Zap,
      week_warrior: Calendar,
      planning_pro: Star,
      early_bird: Award
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
      early_bird: "text-cyan-500"
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
      early_bird: "bg-cyan-100 dark:bg-cyan-900/20"
    };
    return bgColorMap[id] || "bg-gray-100 dark:bg-gray-900/20";
  };

  const unlockedAchievements = userStats?.achievements?.recent || [];
  const totalScore = userStats?.overall_score || 0;
  const currentStreak = userStats?.current_streak?.days || 0;

  // Check if achievement is unlocked
  const isUnlocked = (achievementId: string) => {
    return unlockedAchievements.some((a: any) => a.achievement_id === achievementId);
  };

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
      "-=0.3"
    );

    // Progress section
    tl.fromTo(progressRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" },
      "-=0.2"
    );

    // Hover animations for unlocked achievements
    const unlockedCards = document.querySelectorAll(".achievement-card.unlocked");
    unlockedCards.forEach(card => {
      card.addEventListener("mouseenter", () => {
        gsap.to(card, { scale: 1.02, duration: 0.2, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, { scale: 1, duration: 0.2, ease: "power2.out" });
      });
    });

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
      {/* Stats Overview */}
      <div ref={statsRef} className="grid md:grid-cols-3 gap-4 mb-8">
        <div className="stat-card bg-card border border-border rounded-xl p-6 text-center">
          <Award className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-bold mb-1">{totalScore}</p>
          <p className="text-muted-foreground">Total Points</p>
        </div>

        <div className="stat-card bg-card border border-border rounded-xl p-6 text-center">
          <Zap className="w-12 h-12 text-orange-500 mx-auto mb-2" />
          <p className="text-3xl font-bold mb-1">{currentStreak}</p>
          <p className="text-muted-foreground">Day Streak</p>
        </div>

        <div className="stat-card bg-card border border-border rounded-xl p-6 text-center">
          <Trophy className="w-12 h-12 text-purple-500 mx-auto mb-2" />
          <p className="text-3xl font-bold mb-1">
            {unlockedAchievements.length}/{achievementDefinitions.length}
          </p>
          <p className="text-muted-foreground">Achievements</p>
        </div>
      </div>

      {/* Achievements Grid */}
      <div ref={achievementsRef} className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievementDefinitions.map((achievement, index) => {
          const unlocked = isUnlocked(achievement.id);
          
          return (
            <div
              key={achievement.id}
              className={`
                achievement-card ${unlocked ? 'unlocked' : ''}
                relative overflow-hidden rounded-xl p-6 transition-all
                ${unlocked 
                  ? "bg-card border-2 border-primary" 
                  : "bg-muted/50 border border-border opacity-75"
                }
              `}
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
                    <span className="text-xs text-primary font-medium">
                      UNLOCKED
                    </span>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Progress Section */}
      <div
        ref={progressRef}
        className="mt-12 bg-card border border-border rounded-xl p-8 text-center"
      >
        <h2 className="text-2xl font-bold mb-4">Keep Going!</h2>
        <p className="text-muted-foreground mb-6 max-w-2xl mx-auto">
          You&apos;re making great progress! Continue completing objectives to unlock more achievements
          and increase your score. Every small step counts towards your bigger goals.
        </p>
        
        <div className="flex items-center justify-center space-x-2">
          <Star className="w-5 h-5 text-yellow-500" />
          <Star className="w-5 h-5 text-yellow-500" />
          <Star className="w-5 h-5 text-yellow-500" />
          <Star className="w-5 h-5 text-muted-foreground" />
          <Star className="w-5 h-5 text-muted-foreground" />
        </div>
      </div>
    </div>
  );
} 