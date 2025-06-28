"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
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

// Mock achievement definitions - in a real app, these would come from the backend
const achievementDefinitions = [
  {
    id: "first_steps",
    name: "First Steps",
    description: "Complete your first objective",
    icon: CheckCircle,
    points: 10,
    color: "text-green-500",
    bgColor: "bg-green-100 dark:bg-green-900/20"
  },
  {
    id: "task_master",
    name: "Task Master",
    description: "Complete 10 tasks",
    icon: Target,
    points: 50,
    color: "text-blue-500",
    bgColor: "bg-blue-100 dark:bg-blue-900/20"
  },
  {
    id: "week_warrior",
    name: "Week Warrior",
    description: "Complete objectives 7 days in a row",
    icon: Calendar,
    points: 100,
    color: "text-purple-500",
    bgColor: "bg-purple-100 dark:bg-purple-900/20"
  },
  {
    id: "high_scorer",
    name: "High Scorer",
    description: "Reach 500 total points",
    icon: Star,
    points: 200,
    color: "text-yellow-500",
    bgColor: "bg-yellow-100 dark:bg-yellow-900/20"
  },
  {
    id: "streak_master",
    name: "Streak Master",
    description: "Maintain a 30-day streak",
    icon: Zap,
    points: 300,
    color: "text-orange-500",
    bgColor: "bg-orange-100 dark:bg-orange-900/20"
  },
  {
    id: "champion",
    name: "Champion",
    description: "Complete 100 objectives",
    icon: Trophy,
    points: 500,
    color: "text-red-500",
    bgColor: "bg-red-100 dark:bg-red-900/20"
  }
];

export default function AchievementsPage() {
  const [userStats, setUserStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUserStats();
  }, []);

  const fetchUserStats = async () => {
    try {
      const stats = await userApi.getGamificationStats();
      setUserStats(stats);
    } catch (error) {
      toast.error("Failed to load achievements");
    } finally {
      setLoading(false);
    }
  };

  const unlockedAchievements = userStats?.achievements?.recent || [];
  const totalScore = userStats?.overall_score || 0;
  const currentStreak = userStats?.current_streak?.days || 0;

  // Check if achievement is unlocked
  const isUnlocked = (achievementId: string) => {
    return unlockedAchievements.some((a: any) => a.achievement_id === achievementId);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Stats Overview */}
      <div className="grid md:grid-cols-3 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border border-border rounded-xl p-6 text-center"
        >
          <Award className="w-12 h-12 text-yellow-500 mx-auto mb-2" />
          <p className="text-3xl font-bold mb-1">{totalScore}</p>
          <p className="text-muted-foreground">Total Points</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border border-border rounded-xl p-6 text-center"
        >
          <Zap className="w-12 h-12 text-orange-500 mx-auto mb-2" />
          <p className="text-3xl font-bold mb-1">{currentStreak}</p>
          <p className="text-muted-foreground">Day Streak</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-xl p-6 text-center"
        >
          <Trophy className="w-12 h-12 text-purple-500 mx-auto mb-2" />
          <p className="text-3xl font-bold mb-1">
            {unlockedAchievements.length}/{achievementDefinitions.length}
          </p>
          <p className="text-muted-foreground">Achievements</p>
        </motion.div>
      </div>

      {/* Achievements Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
        {achievementDefinitions.map((achievement, index) => {
          const unlocked = isUnlocked(achievement.id);
          
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.05 }}
              whileHover={unlocked ? { scale: 1.02 } : {}}
              className={`
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
            </motion.div>
          );
        })}
      </div>

      {/* Progress Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
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
      </motion.div>
    </div>
  );
} 