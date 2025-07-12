"use client";

import { useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import {
  CheckCircle,
  Circle,
  Calendar,
  User,
  Trophy,
  Target,
  Clock,
  AlertTriangle,
  Star,
  Flame,
  Crown,
  Zap,
  Edit
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Objective, ObjectiveStatus, ObjectiveType } from "@/types";
import { objectivesApi } from "@/lib/api";
import toast from "react-hot-toast";
import { format } from "date-fns";
import RewardAnimation from "@/components/ui/reward-animations";
import CouponRewardAnimation from "@/components/ui/reward-animations";
import { ObjectiveModal } from "@/components/modals";

interface ObjectiveCardProps {
  objective: Objective;
  onUpdate?: () => void;
  className?: string;
}

export default function ObjectiveCard({ objective, onUpdate, className = "" }: ObjectiveCardProps) {
  const [isUpdating, setIsUpdating] = useState(false);
  const [rewardTrigger, setRewardTrigger] = useState(false);
  const [rewardType, setRewardType] = useState<'basic' | 'streak' | 'milestone' | 'jackpot' | 'legendary'>('basic');
  const [rewardCoupons, setRewardCoupons] = useState<string[]>([]);
  const [rewardMultiplier, setRewardMultiplier] = useState(1);
  const [achievementUnlocked, setAchievementUnlocked] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  // Calculate reward type based on objective properties
  const calculateRewardType = (obj: Objective) => {
    const progress = obj.completion_percentage || 0;
    const isHighPriority = obj.priority_score >= 0.8;
    const isMainObjective = obj.objective_type === ObjectiveType.MAIN_OBJECTIVE;
    const isTask = obj.objective_type === ObjectiveType.TASK;
    
    // Determine reward tier
    if (isMainObjective && progress === 100) return 'legendary';
    if (progress === 100 && isHighPriority) return 'jackpot';
    if (progress === 100) return 'milestone';
    if (isTask) return 'basic';
    return 'streak';
  };

  // Calculate expected coupon rewards based on objective properties
  const calculateExpectedCoupons = (obj: Objective) => {
    const coupons = ['Instagram', 'YouTube', 'Snack'];
    
    if (obj.objective_type === ObjectiveType.MAIN_OBJECTIVE) {
      return ['Netflix', 'Gaming', 'Nap', 'Snack'];
    } else if (obj.objective_type === ObjectiveType.SUB_OBJECTIVE) {
      return ['Instagram', 'YouTube', 'Music'];
    } else if (obj.objective_type === ObjectiveType.TASK) {
      return ['Instagram', 'Snack'];
    } else if (obj.objective_type === ObjectiveType.HABIT) {
      return ['Music'];
    }
    
    return coupons;
  };

  // Calculate multiplier (simulate psychological bonuses)
  const calculateMultiplier = () => {
    const random = Math.random();
    
    // Implement variable ratio reinforcement
    if (random < 0.01) return 10; // 1% chance for 10x jackpot
    if (random < 0.06) return 5;  // 5% chance for 5x bonus
    if (random < 0.31) return 2;  // 25% chance for 2x bonus
    return 1; // 69% normal reward
  };

  const handleStatusChange = async (newStatus: ObjectiveStatus) => {
    if (isUpdating) return;
    
    setIsUpdating(true);
    try {
      if (newStatus === ObjectiveStatus.COMPLETED) {
        // Use the complete endpoint which triggers gamification
        const result = await objectivesApi.complete(objective.id);
        
        // Extract gamification data from backend response
        const gamificationResult = result.gamification;
        const achievements = gamificationResult?.unlocked_achievements || [];
        
        if (objective.objective_type === ObjectiveType.TASK) {
          // Tasks now use XP-only system (like objectives)
          const xpEarned = gamificationResult?.xp_earned || 0;
          const totalXp = gamificationResult?.total_xp_earned || xpEarned;
          const levelInfo = gamificationResult?.level_info || {};
          const leveledUp = levelInfo.leveled_up || false;
          const mysteryBoxesEarned = gamificationResult?.mystery_boxes_earned || 0;
          
          // Determine tier based on XP and level-ups (no coupons)
          let tier: 'basic' | 'streak' | 'milestone' | 'jackpot' | 'legendary' = 'basic';
          if (leveledUp || achievements.length > 0) tier = 'jackpot';
          else if (totalXp >= 50) tier = 'milestone';
          else if (objective.priority_score >= 0.8) tier = 'streak';
          
          // Set up animations for tasks (XP-only system)
          const rewardStrings = [`+${totalXp} XP`];
          if (leveledUp) rewardStrings.push(`Level ${levelInfo.current_level}!`);
          if (mysteryBoxesEarned > 0) rewardStrings.push(`${mysteryBoxesEarned} Mystery Box${mysteryBoxesEarned > 1 ? 'es' : ''}!`);
          
          setRewardCoupons(rewardStrings);
          setRewardMultiplier(leveledUp ? 5 : (totalXp >= 50 ? 2 : 1));
          setRewardType(tier);
          setAchievementUnlocked(achievements.length > 0 || leveledUp);
          setRewardTrigger(true);
          
          // Show notifications (XP only)
          const bonusMessage = gamificationResult?.bonus_message;
          const celebrationMessage = gamificationResult?.celebration;
          
          let toastMessage = `🎯 +${totalXp} XP earned!`;
          if (celebrationMessage) toastMessage = `🎉 ${celebrationMessage}`;
          else if (bonusMessage) toastMessage = `✨ ${bonusMessage}`;
          
          toast.success(toastMessage, { duration: 4000 });
          
          // Show level-up notifications
          if (leveledUp && levelInfo.levels_gained?.length > 0) {
            setTimeout(() => {
              toast.success(`🎆 LEVEL UP! You reached level ${levelInfo.current_level}!`, { 
                duration: 6000,
                icon: '📈'
              });
            }, 1000);
            
            if (mysteryBoxesEarned > 0) {
              setTimeout(() => {
                const boxText = mysteryBoxesEarned === 1 ? 'Mystery Box' : `${mysteryBoxesEarned} Mystery Boxes`;
                toast.success(`📦 ${boxText} earned from leveling up!`, { 
                  duration: 6000,
                  icon: '📦'
                });
              }, 2000);
            }
          }
          
          // Show achievement notifications
          if (achievements.length > 0) {
            setTimeout(() => {
              toast.success(`🏆 Achievement unlocked: ${achievements[0].name}! (+50 XP)`, { 
                duration: 6000,
                icon: '🏆'
              });
            }, leveledUp ? 3000 : 1500);
          }
          
        } else {
          // Objectives use the NEW XP-only system (NO COUPONS)
          const xpEarned = gamificationResult?.xp_earned || 0;
          const totalXp = gamificationResult?.total_xp_earned || xpEarned;
          const levelInfo = gamificationResult?.level_info || {};
          const leveledUp = levelInfo.leveled_up || false;
          const mysteryBoxesEarned = gamificationResult?.mystery_boxes_earned || 0;
          
          // Determine tier based on XP and level-ups
          let tier: 'basic' | 'streak' | 'milestone' | 'jackpot' | 'legendary' = 'basic';
          if (leveledUp || achievements.length > 0) tier = 'legendary';
          else if (totalXp >= 200) tier = 'jackpot';
          else if (totalXp >= 100) tier = 'milestone';
          else if (objective.priority_score >= 0.8) tier = 'streak';
          
          // Set up animations for objectives (XP-only system - NO COUPONS)
          const rewardStrings = [`+${totalXp} XP`];
          if (leveledUp) rewardStrings.push(`Level ${levelInfo.current_level}!`);
          if (mysteryBoxesEarned > 0) rewardStrings.push(`${mysteryBoxesEarned} Mystery Box${mysteryBoxesEarned > 1 ? 'es' : ''}!`);
          
          setRewardCoupons(rewardStrings);
          setRewardMultiplier(leveledUp ? 10 : (totalXp >= 200 ? 5 : (totalXp >= 100 ? 2 : 1)));
          setRewardType(tier);
          setAchievementUnlocked(achievements.length > 0 || leveledUp);
          setRewardTrigger(true);
          
          // Show notifications
          const bonusMessage = gamificationResult?.bonus_message;
          const celebrationMessage = gamificationResult?.celebration;
          
          let toastMessage = `🎯 +${totalXp} XP earned!`;
          if (celebrationMessage) toastMessage = `🎉 ${celebrationMessage}`;
          else if (bonusMessage) toastMessage = `✨ ${bonusMessage}`;
          
          toast.success(toastMessage, { duration: 4000 });
          
          // Show level-up notifications
          if (leveledUp && levelInfo.levels_gained?.length > 0) {
            setTimeout(() => {
              toast.success(`🎆 LEVEL UP! You reached level ${levelInfo.current_level}!`, { 
                duration: 6000,
                icon: '📈'
              });
            }, 1000);
            
            // Show mystery box notifications for level-ups
            if (mysteryBoxesEarned > 0) {
              setTimeout(() => {
                const boxText = mysteryBoxesEarned === 1 ? 'Mystery Box' : `${mysteryBoxesEarned} Mystery Boxes`;
                toast.success(`📦 ${boxText} earned from leveling up!`, { 
                  duration: 6000,
                  icon: '📦'
                });
              }, 2000);
            }
          }
          
          // Show achievement notifications
          if (achievements.length > 0) {
            setTimeout(() => {
              toast.success(`🏆 Achievement unlocked: ${achievements[0].name}! (+50 XP)`, { 
                duration: 6000,
                icon: '🏆'
              });
            }, leveledUp ? 3000 : 1500);
          }
          
          // Show XP breakdown for complex rewards
          if (gamificationResult?.xp_breakdown) {
            const breakdown = gamificationResult.xp_breakdown;
            const details: string[] = [];
            if (breakdown.complexity_bonus > 0) details.push(`Complexity: +${breakdown.complexity_bonus}`);
            if (breakdown.priority_bonus > 0) details.push(`Priority: +${breakdown.priority_bonus}`);
            if (breakdown.type_bonus > 0) details.push(`Type: +${breakdown.type_bonus}`);
            if (breakdown.timeliness_bonus > 0) details.push(`Early: +${breakdown.timeliness_bonus}`);
            
            if (details.length > 0) {
              setTimeout(() => {
                toast.success(`💡 XP Breakdown: ${details.join(', ')}`, { 
                  duration: 5000,
                  icon: '📊'
                });
              }, leveledUp ? 4000 : 2500);
            }
          }
        }
      } else {
        // For other status changes, use regular update
        await objectivesApi.update(objective.id, { 
          status: newStatus,
          completion_percentage: objective.completion_percentage
        });
      }
      
      // Dispatch event for real-time updates
      if (newStatus === ObjectiveStatus.COMPLETED) {
        window.dispatchEvent(new CustomEvent('objectiveCompleted'));
      }
      
      onUpdate?.();
    } catch (error) {
      console.error("Failed to update objective:", error);
      toast.error("Failed to update objective");
    } finally {
      setIsUpdating(false);
    }
  };

  // GSAP card hover animations
  useGSAP(() => {
    const card = cardRef.current;
    if (!card) return;

    const handleMouseEnter = () => {
      gsap.to(card, {
        scale: 1.02,
        y: -2,
        duration: 0.3,
        ease: "power2.out",
        boxShadow: "0 10px 25px rgba(0,0,0,0.1)"
      });
    };

    const handleMouseLeave = () => {
      gsap.to(card, {
        scale: 1,
        y: 0,
        duration: 0.3,
        ease: "power2.out",
        boxShadow: "0 4px 6px rgba(0,0,0,0.05)"
      });
    };

    card.addEventListener('mouseenter', handleMouseEnter);
    card.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      card.removeEventListener('mouseenter', handleMouseEnter);
      card.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  const getStatusIcon = () => {
    switch (objective.status) {
      case ObjectiveStatus.COMPLETED:
        return <CheckCircle className="w-5 h-5 text-green-500" />;
      case ObjectiveStatus.IN_PROGRESS:
        return <Clock className="w-5 h-5 text-blue-500" />;
      case ObjectiveStatus.BLOCKED:
        return <AlertTriangle className="w-5 h-5 text-red-500" />;
      default:
        return <Circle className="w-5 h-5 text-gray-400" />;
    }
  };

  const getTypeIcon = () => {
    switch (objective.objective_type) {
      case ObjectiveType.MAIN_OBJECTIVE:
        return <Crown className="w-4 h-4 text-purple-500" />;
      case ObjectiveType.SUB_OBJECTIVE:
        return <Trophy className="w-4 h-4 text-yellow-500" />;
      case ObjectiveType.TASK:
        return <Target className="w-4 h-4 text-blue-500" />;
      case ObjectiveType.HABIT:
        return <Zap className="w-4 h-4 text-green-500" />;
      default:
        return <Target className="w-4 h-4 text-gray-400" />;
    }
  };

  const getPriorityColor = () => {
    const score = objective.priority_score;
    if (score >= 0.8) return 'bg-red-100 text-red-800 border-red-200';
    if (score >= 0.5) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-green-100 text-green-800 border-green-200';
  };

  const getPriorityText = () => {
    const score = objective.priority_score;
    if (score >= 0.8) return 'High';
    if (score >= 0.5) return 'Medium';
    return 'Low';
  };

  const progress = objective.completion_percentage || 0;
  
  return (
    <>
      <Card 
        ref={cardRef}
        className={`p-6 hover:shadow-lg transition-all duration-300 cursor-pointer ${className}`}
      >
        <div className="space-y-4">
          {/* Header */}
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              <div className="flex items-center space-x-2">
                {getStatusIcon()}
                {getTypeIcon()}
              </div>
              
              <div className="flex-1">
                <h3 className="font-semibold text-lg">{objective.title}</h3>
                {objective.description && (
                  <p className="text-sm text-muted-foreground mt-1">
                    {objective.description}
                  </p>
                )}
              </div>
            </div>
            
            <Badge className={getPriorityColor()}>
              {getPriorityText()}
            </Badge>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Progress</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <motion.div
                className="bg-primary h-2 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.5, ease: "easeOut" }}
              />
            </div>
          </div>

          {/* Meta Info */}
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <div className="flex items-center space-x-4">
              {objective.due_date && (
                <div className="flex items-center space-x-1">
                  <Calendar className="w-4 h-4" />
                  <span>{format(new Date(objective.due_date), 'MMM dd')}</span>
                </div>
              )}
            </div>
            
            <div className="flex items-center space-x-2">
              {objective.priority_score >= 0.8 && (
                <Flame className="w-4 h-4 text-red-500" />
              )}
              {progress === 100 && (
                <Star className="w-4 h-4 text-yellow-500" />
              )}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-between items-center pt-2">
            <div className="text-xs text-muted-foreground">
              {objective.objective_type?.replace('_', ' ').toUpperCase()} • {objective.status?.replace('_', ' ').toUpperCase()}
            </div>
            
            <div className="flex space-x-2">
              <Button
                size="sm"
                variant="outline"
                onClick={(e) => {
                  e.stopPropagation();
                  setShowEditModal(true);
                }}
                className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
              >
                <Edit className="w-4 h-4 mr-1" />
                Edit
              </Button>
              
              {objective.status !== ObjectiveStatus.COMPLETED && (
                <Button
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStatusChange(ObjectiveStatus.COMPLETED);
                  }}
                  disabled={isUpdating}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-1" />
                  Complete
                </Button>
              )}
              
              {objective.status === ObjectiveStatus.COMPLETED && (
                <Badge className="bg-green-100 text-green-800">
                  ✨ Completed
                </Badge>
              )}
            </div>
          </div>
        </div>
      </Card>
      
      {/* Edit Modal */}
      <ObjectiveModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          onUpdate?.();
        }}
        initialData={objective}
      />
      
      {/* Reward Animation */}
      <CouponRewardAnimation
        isVisible={rewardTrigger}
        tier={rewardType}
        coupons={rewardCoupons}
        bonusMultiplier={rewardMultiplier}
        achievementUnlocked={achievementUnlocked}
        priority={objective.priority_score}
        onComplete={() => setRewardTrigger(false)}
      />
    </>
  );
} 