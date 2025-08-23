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
                      <h3 className="text-lg font-semibold">Experience Points (XP) & Levels</h3>
                      <p className="text-sm text-muted-foreground">Level up by completing objectives and unlock mystery boxes</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <div className="space-y-3">
                      <h4 className="font-medium text-green-600">🎯 Completing Objectives</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• <strong>Main Objectives:</strong> 300 XP (3x base)</li>
                        <li>• <strong>Sub-Objectives:</strong> 150 XP (1.5x base)</li>
                        <li>• <strong>Tasks:</strong> Still give coupons (not XP)</li>
                        <li>• <strong>Complexity bonus:</strong> Up to +100% XP</li>
                        <li>• <strong>Priority bonus:</strong> Up to +100% XP</li>
                        <li>• <strong>Early completion:</strong> Up to +100% XP</li>
                      </ul>
                    </div>
                    
                    <div className="space-y-3">
                      <h4 className="font-medium text-purple-600">📈 Leveling System</h4>
                      <ul className="text-sm space-y-1 text-muted-foreground">
                        <li>• <strong>Level 1:</strong> 100 XP to reach Level 2</li>
                        <li>• <strong>Level 2:</strong> 150 XP to reach Level 3</li>
                        <li>• <strong>Level 3:</strong> 200 XP to reach Level 4</li>
                        <li>• <strong>Pattern:</strong> +50 XP requirement per level</li>
                        <li>• <strong>Mystery Box:</strong> Earned on every level-up!</li>
                        <li>• <strong>Achievement XP:</strong> +50 XP per achievement</li>
                      </ul>
                    </div>
                  </div>
                  
                  <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <span className="text-2xl">🎯</span>
                      XP Strategy Tips
                    </h4>
                    <div className="text-sm space-y-1 text-blue-700 dark:text-blue-300">
                      <p>• <strong>Focus on objectives</strong> - they give XP while tasks give coupons</p>
                      <p>• <strong>Set high complexity/priority</strong> - doubles your XP rewards</p>
                      <p>• <strong>Complete objectives early</strong> - earn massive timeliness bonuses</p>
                      <p>• <strong>Build 7+ day streaks</strong> - 5% XP multiplier per day</p>
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
                      <p className="text-sm text-muted-foreground">Magical spheres that transform into reward wheels</p>
                    </div>
                  </div>
                  
                  <div className="grid md:grid-cols-3 gap-4 mb-6">
                    <div className="bg-gradient-to-br from-green-50 to-emerald-100 dark:from-green-900/20 dark:to-emerald-800/10 p-4 rounded-lg">
                      <h4 className="font-medium text-green-700 dark:text-green-300 mb-2">📈 Level Up</h4>
                      <p className="text-sm text-green-600 dark:text-green-400">Guaranteed mystery box every time you level up!</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-800/10 p-4 rounded-lg">
                      <h4 className="font-medium text-purple-700 dark:text-purple-300 mb-2">🎯 Complete Objectives</h4>
                      <p className="text-sm text-purple-600 dark:text-purple-400">Earn XP to level up faster and get more mystery boxes</p>
                    </div>
                    
                    <div className="bg-gradient-to-br from-yellow-50 to-orange-100 dark:from-yellow-900/20 dark:to-orange-800/10 p-4 rounded-lg">
                      <h4 className="font-medium text-orange-700 dark:text-orange-300 mb-2">🏆 Unlock Achievements</h4>
                      <p className="text-sm text-orange-600 dark:text-orange-400">+50 XP bonus per achievement helps you level faster</p>
                    </div>
                  </div>

                  {/* How Mystery Spheres Work */}
                  <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <span className="text-2xl">🎯</span>
                      How Mystery Spheres Work (Updated System)
                    </h4>
                    <div className="text-sm space-y-2">
                      <p>1. <strong>Complete objectives</strong> - Earn XP based on complexity and priority</p>
                      <p>2. <strong>Level up</strong> - When you earn enough XP, you automatically level up</p>
                      <p>3. <strong>Mystery box earned</strong> - Every level-up awards exactly 1 mystery box</p>
                      <p>4. <strong>Touch the sphere</strong> - It explodes and transforms into a spinning wheel</p>
                      <p>5. <strong>Wheel spins</strong> - Color reveals reward tier, arrow points to your coupon</p>
                    </div>
                  </div>

                  {/* Reward Wheel Colors & Tiers */}
                  <div className="mb-6">
                    <h4 className="font-medium mb-4 flex items-center gap-2">
                      <span className="text-2xl">🎨</span>
                      Wheel Colors & Reward Tiers
                    </h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* LEGENDARY */}
                      <div className="p-4 rounded-lg border-2 border-yellow-300 bg-gradient-to-br from-yellow-50 to-amber-100 dark:from-yellow-900/20 dark:to-amber-900/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-yellow-400 to-amber-500"></div>
                          <span className="font-bold text-yellow-800 dark:text-yellow-200">LEGENDARY</span>
                          <span className="text-xs bg-yellow-200 dark:bg-yellow-800 text-yellow-800 dark:text-yellow-200 px-2 py-1 rounded-full">1%</span>
                        </div>
                        <p className="text-sm text-yellow-700 dark:text-yellow-300 font-medium mb-1">3+ Hour Epic Adventures</p>
                        <ul className="text-xs text-yellow-600 dark:text-yellow-400 space-y-1">
                          <li>• 🎮 Gaming Marathon (3 hours)</li>
                          <li>• 🍕 Food Festival (2 hours)</li>
                          <li>• 🎬 Movie Marathon (4 hours)</li>
                        </ul>
                      </div>

                      {/* EPIC */}
                      <div className="p-4 rounded-lg border-2 border-purple-300 bg-gradient-to-br from-purple-50 to-violet-100 dark:from-purple-900/20 dark:to-violet-900/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-400 to-violet-500"></div>
                          <span className="font-bold text-purple-800 dark:text-purple-200">EPIC</span>
                          <span className="text-xs bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 px-2 py-1 rounded-full">5%</span>
                        </div>
                        <p className="text-sm text-purple-700 dark:text-purple-300 font-medium mb-1">1-2 Hour Activities</p>
                        <ul className="text-xs text-purple-600 dark:text-purple-400 space-y-1">
                          <li>• 🎵 Music Session (90 min)</li>
                          <li>• 📱 Social Media (60 min)</li>
                          <li>• 🎨 Creative Time (2 hours)</li>
                          <li>• 🕹️ Retro Gaming (90 min)</li>
                        </ul>
                      </div>

                      {/* RARE */}
                      <div className="p-4 rounded-lg border-2 border-blue-300 bg-gradient-to-br from-blue-50 to-cyan-100 dark:from-blue-900/20 dark:to-cyan-900/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-blue-400 to-cyan-500"></div>
                          <span className="font-bold text-blue-800 dark:text-blue-200">RARE</span>
                          <span className="text-xs bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 px-2 py-1 rounded-full">20%</span>
                        </div>
                        <p className="text-sm text-blue-700 dark:text-blue-300 font-medium mb-1">30-60 Minute Breaks</p>
                        <ul className="text-xs text-blue-600 dark:text-blue-400 space-y-1">
                          <li>• 📺 YouTube (45 min)</li>
                          <li>• 📱 Instagram (30 min)</li>
                          <li>• 💬 Chat Friends (60 min)</li>
                          <li>• 🍿 Snack Break (30 min)</li>
                          <li>• 😴 Power Nap (20 min)</li>
                        </ul>
                      </div>

                      {/* COMMON */}
                      <div className="p-4 rounded-lg border-2 border-gray-300 bg-gradient-to-br from-gray-50 to-slate-100 dark:from-gray-900/20 dark:to-slate-900/20">
                        <div className="flex items-center gap-2 mb-2">
                          <div className="w-4 h-4 rounded-full bg-gradient-to-r from-gray-400 to-slate-500"></div>
                          <span className="font-bold text-gray-800 dark:text-gray-200">COMMON</span>
                          <span className="text-xs bg-gray-200 dark:bg-gray-800 text-gray-800 dark:text-gray-200 px-2 py-1 rounded-full">24%</span>
                        </div>
                        <p className="text-sm text-gray-700 dark:text-gray-300 font-medium mb-1">5-15 Minute Micro-Breaks</p>
                        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1">
                          <li>• 📖 Quick Read (15 min)</li>
                          <li>• ☕ Coffee Break (10 min)</li>
                          <li>• 🚶 Short Walk (15 min)</li>
                          <li>• 📧 Check Email (10 min)</li>
                          <li>• 🧘 Mini Meditation (5 min)</li>
                          <li>• 🎧 One Song (5 min)</li>
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Empty Box */}
                  <div className="p-4 bg-gradient-to-r from-cyan-50 to-blue-50 dark:from-cyan-900/20 dark:to-blue-900/20 rounded-lg border border-cyan-200 dark:border-cyan-700">
                    <div className="flex items-center gap-2 mb-2">
                      <span className="text-2xl">📦</span>
                      <span className="font-bold text-cyan-800 dark:text-cyan-200">NO REWARD</span>
                      <span className="text-xs bg-cyan-200 dark:bg-cyan-800 text-cyan-800 dark:text-cyan-200 px-2 py-1 rounded-full">50%</span>
                    </div>
                    <p className="text-sm text-cyan-700 dark:text-cyan-300">
                      <strong>Sometimes the box is empty!</strong> That's the thrill of the mystery. The universe is saving something special for your next attempt. Keep completing tasks to earn more chances!
                    </p>
                  </div>

                  {/* Pro Tips */}
                  <div className="mt-6 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg">
                    <h4 className="font-medium mb-3 flex items-center gap-2">
                      <span className="text-2xl">💡</span>
                      Pro Tips for Mystery Spheres
                    </h4>
                    <div className="grid md:grid-cols-2 gap-4 text-sm">
                      <ul className="space-y-2 text-green-700 dark:text-green-300">
                        <li>🎯 <strong>Variable rewards keep it exciting</strong> - You never know what you'll get!</li>
                        <li>🎨 <strong>Wheel color = reward tier</strong> - Gold wheels are jackpots!</li>
                        <li>🎪 <strong>Each wheel has different sized segments</strong> - Bigger segments = higher chance</li>
                      </ul>
                      <ul className="space-y-2 text-green-700 dark:text-green-300">
                        <li>🔮 <strong>50% chance of nothing</strong> - That's what makes wins feel amazing!</li>
                        <li>✨ <strong>Complete more tasks</strong> - More spheres = more chances!</li>
                        <li>🎉 <strong>Use your coupons</strong> - They expire, so enjoy your rewards!</li>
                      </ul>
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
                      <li>🎯 Complete objectives for XP (tasks still give coupons)</li>
                      <li>🏆 Set high complexity and priority for double XP</li>
                      <li>⚡ Finish objectives early for massive timeliness bonuses</li>
                      <li>🔥 Maintain 7+ day streaks for 5% XP multiplier per day</li>
                    </ul>
                    <ul className="space-y-2 text-sm">
                      <li>📈 Level up to earn guaranteed mystery boxes</li>
                      <li>🏅 Unlock achievements for +50 XP bonus each</li>
                      <li>🎁 Focus on main objectives for maximum XP (3x base)</li>
                      <li>🎉 Use your coupons before they expire!</li>
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