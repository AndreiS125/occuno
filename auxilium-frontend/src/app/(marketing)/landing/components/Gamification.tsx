'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  TrophyIcon, 
  StarIcon, 
  FireIcon, 
  BoltIcon,
  ChartBarIcon,
  CalendarIcon,
  CheckCircleIcon,
  SparklesIcon
} from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function Gamification() {
  const [activeAchievement, setActiveAchievement] = useState(0);
  const [streak, setStreak] = useState(0);
  const sectionRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const achievementsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Level up animation
      gsap.to('.level-up', {
        scale: 1.1,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // XP bar animation
      ScrollTrigger.create({
        trigger: progressRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.to('.xp-fill', {
            width: '75%',
            duration: 2,
            ease: "power2.out",
            delay: 0.5
          });
        }
      });

      // Achievement badges animation
      ScrollTrigger.create({
        trigger: achievementsRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.achievement-badge-icon', {
            scale: 0,
            rotation: 180,
            duration: 0.8,
            ease: "back.out(1.7)",
            stagger: 0.1
          });
        }
      });

      // Floating particles for achievements
      gsap.to('.achievement-particle', {
        y: -30,
        x: (i) => Math.cos(i) * 20,
        opacity: 0,
        duration: 2,
        repeat: -1,
        ease: "power2.out",
        stagger: 0.2
      });

      // Streak counter animation
      gsap.to('.streak-flame', {
        scale: 1.2,
        rotation: 5,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Animated streak counter
  useEffect(() => {
    const timer = setInterval(() => {
      setStreak(prev => prev < 47 ? prev + 1 : 47);
    }, 100);

    return () => clearInterval(timer);
  }, []);

  const achievements = [
    {
      icon: FireIcon,
      name: "Productivity Inferno",
      description: "Complete 50 tasks in a week",
      progress: 92,
      reward: "+500 XP",
      rarity: "Epic",
      color: "from-orange-500 to-red-500"
    },
    {
      icon: BoltIcon,
      name: "Speed Demon",
      description: "Finish 10 tasks ahead of schedule",
      progress: 60,
      reward: "+300 XP",
      rarity: "Rare",
      color: "from-yellow-500 to-orange-500"
    },
    {
      icon: TrophyIcon,
      name: "Goal Crusher",
      description: "Complete a major objective",
      progress: 100,
      reward: "+1000 XP",
      rarity: "Legendary",
      color: "from-purple-500 to-pink-500"
    },
    {
      icon: StarIcon,
      name: "Consistency King",
      description: "30-day planning streak",
      progress: 80,
      reward: "+750 XP",
      rarity: "Epic",
      color: "from-blue-500 to-purple-500"
    }
  ];

  const gameMechanics = [
    {
      icon: ChartBarIcon,
      title: "Experience Points",
      description: "Earn XP for every completed task, milestone reached, and goal achieved",
      visual: "Progressive bars and level-ups"
    },
    {
      icon: TrophyIcon,
      title: "Achievement System",
      description: "Unlock badges for productivity milestones and consistent habits",
      visual: "Collectible achievement gallery"
    },
    {
      icon: FireIcon,
      title: "Streak Tracking",
      description: "Build momentum with daily, weekly, and monthly streak counters",
      visual: "Flame intensity increases with streaks"
    },
    {
      icon: StarIcon,
      title: "Leaderboards",
      description: "Compete with yourself and optionally with friends or colleagues",
      visual: "Personal and team rankings"
    }
  ];

  return (
    <div ref={sectionRef} className="relative py-32 bg-gradient-to-b from-slate-900 via-purple-950 to-slate-900 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-pink-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Achievement particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(8)].map((_, i) => (
          <div
            key={i}
            className="achievement-particle absolute w-2 h-2 bg-yellow-400 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          ></div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main headline */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-purple-500/10 border border-purple-500/20 rounded-full px-6 py-2 mb-8">
            <TrophyIcon className="w-5 h-5 text-purple-400" />
            <span className="text-purple-300 font-semibold">Make Progress Addictive</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white via-purple-100 to-pink-200 bg-clip-text text-transparent">
            Turn Your To-Dos Into
            <br />
            <span className="bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent">
              Level-Ups
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Why should games be the only thing that's addictive? Transform your productivity into a game you actually want to play.
          </p>
        </div>

        {/* Interactive progress demo */}
        <div ref={progressRef} className="mb-20">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Your Productivity Profile</h3>
              <p className="text-gray-400">Watch your progress come alive</p>
            </div>

            <div className="grid lg:grid-cols-2 gap-12 items-center">
              {/* Progress visualization */}
              <div className="space-y-8">
                {/* Level display */}
                <div className="text-center p-6 bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30 rounded-2xl">
                  <div className="level-up text-6xl font-bold bg-gradient-to-r from-purple-400 to-pink-400 bg-clip-text text-transparent mb-2">
                    Level 23
                  </div>
                  <div className="text-purple-300 text-lg font-semibold mb-4">Productivity Ninja</div>
                  
                  {/* XP Bar */}
                  <div className="w-full h-4 bg-white/10 rounded-full overflow-hidden">
                    <div className="xp-fill h-full bg-gradient-to-r from-purple-500 to-pink-500 rounded-full w-0 relative">
                      <div className="absolute inset-0 bg-white/20 animate-pulse"></div>
                    </div>
                  </div>
                  <div className="text-gray-400 text-sm mt-2">18,750 / 25,000 XP to Level 24</div>
                </div>

                {/* Streak counter */}
                <div className="flex items-center justify-center gap-4 p-6 bg-gradient-to-br from-orange-500/20 to-red-500/20 border border-orange-500/30 rounded-2xl">
                  <div className="streak-flame">
                    <FireIcon className="w-12 h-12 text-orange-400" />
                  </div>
                  <div>
                    <div className="text-3xl font-bold text-white">{streak} days</div>
                    <div className="text-orange-300 font-semibold">Planning Streak</div>
                  </div>
                </div>
              </div>

              {/* Achievement showcase */}
              <div className="space-y-4">
                <h4 className="text-xl font-bold text-white mb-4">Recent Achievements</h4>
                {achievements.slice(0, 3).map((achievement, index) => (
                  <div key={index} className="achievement-badge flex items-center gap-4 p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-all duration-300">
                    <div className={`w-12 h-12 bg-gradient-to-br ${achievement.color} rounded-full flex items-center justify-center`}>
                      <achievement.icon className="w-6 h-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-white font-semibold">{achievement.name}</span>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          achievement.rarity === 'Legendary' ? 'bg-purple-500/20 text-purple-300' :
                          achievement.rarity === 'Epic' ? 'bg-orange-500/20 text-orange-300' :
                          'bg-blue-500/20 text-blue-300'
                        }`}>
                          {achievement.rarity}
                        </span>
                      </div>
                      <p className="text-gray-400 text-sm">{achievement.description}</p>
                      
                      {/* Progress bar for incomplete achievements */}
                      {achievement.progress < 100 && (
                        <div className="mt-2">
                          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
                            <div 
                              className={`h-full bg-gradient-to-r ${achievement.color} rounded-full transition-all duration-1000`}
                              style={{ width: `${achievement.progress}%` }}
                            ></div>
                          </div>
                          <div className="text-xs text-gray-500 mt-1">{achievement.progress}% complete</div>
                        </div>
                      )}
                    </div>
                    <div className="text-green-400 font-semibold text-sm">{achievement.reward}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Game mechanics */}
        <div ref={achievementsRef} className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
          {gameMechanics.map((mechanic, index) => (
            <div key={index} className="text-center">
              <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl mx-auto mb-6 flex items-center justify-center achievement-badge-icon">
                <mechanic.icon className="w-8 h-8 text-white" />
              </div>
              <h4 className="text-xl font-bold text-white mb-3">{mechanic.title}</h4>
              <p className="text-gray-300 mb-4 leading-relaxed">{mechanic.description}</p>
              <div className="text-sm text-purple-300 font-semibold">{mechanic.visual}</div>
            </div>
          ))}
        </div>

        {/* Achievement gallery preview */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-4">Achievement Gallery</h3>
            <p className="text-gray-400">Collect badges as you build better habits</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-8 gap-4">
            {[...Array(16)].map((_, index) => (
              <div
                key={index}
                className={`aspect-square rounded-xl flex items-center justify-center achievement-badge-icon ${
                  index < 6 ? 'bg-gradient-to-br from-purple-500/20 to-pink-500/20 border border-purple-500/30' :
                  'bg-white/5 border border-white/10'
                }`}
              >
                {index < 6 ? (
                  <TrophyIcon className="w-8 h-8 text-purple-400" />
                ) : (
                  <div className="w-8 h-8 bg-white/10 rounded-full"></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Psychology of gamification */}
        <div className="text-center p-12 bg-gradient-to-br from-purple-900/30 via-pink-900/20 to-purple-900/30 border border-white/10 rounded-3xl backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-white mb-6">The Science of Motivation</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Gamification isn't just fun—it's scientifically proven to increase motivation by up to 90%. We've built the same reward systems that make games irresistible into your productivity workflow.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">90%</div>
              <div className="text-white font-semibold mb-1">Higher Motivation</div>
              <div className="text-gray-400 text-sm">With gamified systems</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-pink-400 mb-2">3x</div>
              <div className="text-white font-semibold mb-1">Task Completion</div>
              <div className="text-gray-400 text-sm">Compared to traditional tools</div>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-purple-400 mb-2">85%</div>
              <div className="text-white font-semibold mb-1">User Retention</div>
              <div className="text-gray-400 text-sm">After 30 days</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 