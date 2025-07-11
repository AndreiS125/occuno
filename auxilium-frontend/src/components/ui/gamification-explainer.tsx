"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  HelpCircle, 
  X, 
  Gift, 
  Flame, 
  Trophy, 
  Zap, 
  Target,
  Calendar,
  Crown,
  Star,
  CheckCircle
} from 'lucide-react';
import { Button } from './button';
import { Card } from './card';

interface GamificationExplainerProps {
  trigger?: React.ReactNode;
}

export const GamificationExplainer: React.FC<GamificationExplainerProps> = ({ 
  trigger 
}) => {
  const [isOpen, setIsOpen] = useState(false);

  const defaultTrigger = (
    <Button 
      variant="outline" 
      size="sm"
      onClick={() => setIsOpen(true)}
      className="gap-2"
    >
      <HelpCircle className="w-4 h-4" />
      How it Works
    </Button>
  );

  return (
    <>
      {trigger ? (
        <div onClick={() => setIsOpen(true)}>
          {trigger}
        </div>
      ) : (
        defaultTrigger
      )}

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
            onClick={() => setIsOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: "spring", bounce: 0.25 }}
              className="bg-background border rounded-xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              {/* Header */}
              <div className="p-6 border-b bg-gradient-to-r from-primary/5 to-secondary/5">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-2xl font-bold">🎮 How the Gamification System Works</h2>
                    <p className="text-muted-foreground mt-1">
                      Understand how you earn XP, mystery spheres, and level up!
                    </p>
                  </div>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => setIsOpen(false)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>
              </div>

              {/* Content */}
              <div className="p-6 space-y-8">
                {/* XP System */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg">
                      <Star className="w-6 h-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Experience Points (XP)</h3>
                      <p className="text-sm text-muted-foreground">How you earn points and level up</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-600">✅ Completing Tasks</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Base: 25 XP per task</li>
                        <li>• Complexity bonus: Up to +25 XP</li>
                        <li>• Priority bonus: Up to +25 XP</li>
                        <li>• Early completion: Up to +100 XP</li>
                        <li>• Random bonuses: 2x, 5x, or 10x multipliers!</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-purple-600">🏆 Completing Objectives</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• Base: 100 XP per objective</li>
                        <li>• Higher bonus rates (up to 15x!)</li>
                        <li>• Complexity and completion bonuses</li>
                        <li>• Achievement unlocks</li>
                      </ul>
                    </div>
                  </div>
                </Card>

                {/* Mystery Spheres */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
                      <Gift className="w-6 h-6 text-purple-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Mystery Spheres 🔮</h3>
                      <p className="text-sm text-muted-foreground">Magical color spheres with random rewards</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/10 p-4 rounded-lg">
                      <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">📝 Task Completion</h4>
                      <p className="text-sm text-green-600 dark:text-green-400">15% chance per task</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-800/10 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">🏆 Objective Completion</h4>
                      <p className="text-sm text-purple-600 dark:text-purple-400">40% chance per objective</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/10 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2">🎁 Daily Bonus</h4>
                      <p className="text-sm text-orange-600 dark:text-orange-400">10% chance + special rewards</p>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-muted rounded-lg">
                    <h4 className="font-medium mb-2">🔮 What's Inside Mystery Spheres?</h4>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                      <div className="text-center">
                        <div className="text-lg mb-1">✨</div>
                        <div className="font-medium">Common</div>
                        <div className="text-muted-foreground">50 XP (75%)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg mb-1">🎁</div>
                        <div className="font-medium">Rare</div>
                        <div className="text-muted-foreground">200 XP (20%)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg mb-1">⭐</div>
                        <div className="font-medium">Epic</div>
                        <div className="text-muted-foreground">500 XP (5%)</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg mb-1">💎</div>
                        <div className="font-medium">Legendary</div>
                        <div className="text-muted-foreground">1000 XP (1%)</div>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Streaks */}
                <Card className="p-6">
                  <div className="flex items-center gap-3 mb-4">
                    <div className="p-2 bg-orange-100 dark:bg-orange-900/20 rounded-lg">
                      <Flame className="w-6 h-6 text-orange-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold">Streak System 🔥</h3>
                      <p className="text-sm text-muted-foreground">Build momentum with consecutive days</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="font-medium mb-3">Streak Benefits</h4>
                      <ul className="space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          +10% XP multiplier per day
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Extra +50% bonus at 7+ days
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Streak insurance at milestones
                        </li>
                        <li className="flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-green-500" />
                          Achievement unlocks
                        </li>
                      </ul>
                    </div>
                    
                    <div>
                      <h4 className="font-medium mb-3">Streak Protection</h4>
                      <div className="bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-800/10 p-4 rounded-lg">
                        <div className="flex items-center gap-2 mb-2">
                          <Crown className="w-5 h-5 text-blue-600" />
                          <span className="font-medium">Streak Insurance</span>
                        </div>
                        <p className="text-sm text-blue-600 dark:text-blue-400">
                          Earned at 7, 14, and 30-day milestones. Protects your streak if you miss a day!
                        </p>
                      </div>
                    </div>
                  </div>
                </Card>

                {/* Quick Tips */}
                <Card className="p-6 bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/10 dark:to-blue-900/10">
                  <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Zap className="w-5 h-5" />
                    Quick Tips to Maximize Rewards
                  </h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <ul className="space-y-2 text-sm">
                      <li>🎯 Complete tasks early for timeliness bonuses</li>
                      <li>🏆 Break large goals into smaller objectives</li>
                      <li>⚡ Set higher priority and complexity for bigger rewards</li>
                      <li>🔥 Maintain your daily streak for multipliers</li>
                    </ul>
                    <ul className="space-y-2 text-sm">
                      <li>🔮 Mystery spheres stack - touch them when you want surprises</li>
                      <li>🎁 Claim daily bonuses for extra rewards</li>
                      <li>🏅 Complete achievements for milestone bonuses</li>
                      <li>⏰ Stay active to avoid progress decay warnings</li>
                    </ul>
                  </div>
                </Card>
              </div>

              {/* Footer */}
              <div className="p-6 border-t bg-muted/30">
                <div className="flex items-center justify-between">
                  <p className="text-sm text-muted-foreground">
                    🎮 The system is designed to make productivity addictive and rewarding!
                  </p>
                  <Button onClick={() => setIsOpen(false)}>
                    Got it! 🚀
                  </Button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}; 