"use client";

import React, { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { userApi } from '@/lib/api';
import { motion, AnimatePresence } from 'framer-motion';

interface MysteryBoxRealisticProps {
  onOpen: () => void | Promise<any>;
  onClose?: () => void;
  isOpen: boolean;
  reward?: {
    type: string;
    value: number;
    description: string;
  };
  modelPath?: string;
}

// Define reward rarities and their configurations with website color palette
const REWARD_CONFIGS = {
  LEGENDARY: {
    name: "LEGENDARY",
    probability: 0.01, // 1%
    colors: [
      { start: "#22c5c2", end: "#14b8a6" }, // cyber-blue to teal
      { start: "#f472b6", end: "#ec4899" }, // neon-pink to pink
      { start: "#fbbf24", end: "#f59e0b" }, // amber to yellow
    ],
    glowColor: "rgba(34, 197, 194, 0.8)",
    segments: [
      { name: "🎮 Gaming Marathon", weight: 1, type: "game_marathon", duration: 180 },
      { name: "🍕 Food Festival", weight: 1, type: "food_festival", duration: 120 },
      { name: "🎬 Movie Marathon", weight: 1, type: "movie_marathon", duration: 240 },
    ]
  },
  EPIC: {
    name: "EPIC", 
    probability: 0.05, // 5%
    colors: [
      { start: "#8b5cf6", end: "#7c3aed" }, // electric-purple
      { start: "#3b82f6", end: "#2563eb" }, // blue
      { start: "#f472b6", end: "#ec4899" }, // neon-pink
      { start: "#22c5c2", end: "#14b8a6" }, // cyber-blue
    ],
    glowColor: "rgba(139, 92, 246, 0.7)",
    segments: [
      { name: "🎵 Music Session", weight: 2, type: "music_session", duration: 90 },
      { name: "📱 Social Media", weight: 2, type: "social_media", duration: 60 },
      { name: "🎨 Creative Time", weight: 1, type: "creative_time", duration: 120 },
      { name: "🕹️ Retro Gaming", weight: 1, type: "retro_gaming", duration: 90 },
    ]
  },
  RARE: {
    name: "RARE",
    probability: 0.20, // 20%
    colors: [
      { start: "#3b82f6", end: "#2563eb" }, // blue
      { start: "#22c5c2", end: "#0891b2" }, // cyber-blue to sky
      { start: "#8b5cf6", end: "#7c3aed" }, // electric-purple
      { start: "#06b6d4", end: "#0284c7" }, // cyan
      { start: "#22c55e", end: "#16a34a" }, // matrix-green
    ],
    glowColor: "rgba(59, 130, 246, 0.6)",
    segments: [
      { name: "📺 YouTube", weight: 3, type: "watch_youtube", duration: 45 },
      { name: "📱 Instagram", weight: 3, type: "scroll_instagram", duration: 30 },
      { name: "💬 Chat Friends", weight: 2, type: "chat_friends", duration: 60 },
      { name: "🍿 Snack Break", weight: 2, type: "snack_break", duration: 30 },
      { name: "😴 Power Nap", weight: 1, type: "power_nap", duration: 20 },
    ]
  },
  COMMON: {
    name: "COMMON",
    probability: 0.30, // 30%
    colors: [
      { start: "#22c55e", end: "#15803d" }, // matrix-green
      { start: "#06b6d4", end: "#0e7490" }, // cyan
      { start: "#3b82f6", end: "#1d4ed8" }, // blue
      { start: "#8b5cf6", end: "#6d28d9" }, // electric-purple
      { start: "#22c5c2", end: "#0f766e" }, // cyber-blue
    ],
    glowColor: "rgba(34, 197, 194, 0.5)",
    segments: [
      { name: "☕ Coffee Break", weight: 3, type: "coffee_break", duration: 15 },
      { name: "📖 Quick Read", weight: 2, type: "quick_read", duration: 20 },
      { name: "🚶 Short Walk", weight: 2, type: "short_walk", duration: 15 },
      { name: "🧘 Mini Meditation", weight: 2, type: "mini_meditation", duration: 10 },
      { name: "📧 Check Email", weight: 1, type: "check_email", duration: 10 },
    ]
  },
  NO_REWARD: {
    name: "NO_REWARD",
    probability: 0.44, // 44% 
    colors: [
      { start: "#64748b", end: "#475569" }, // slate (keep subtle for empty)
    ],
    glowColor: "rgba(100, 116, 139, 0.3)",
    segments: [
      { name: "📦 Empty Box", weight: 1, type: "no_reward", duration: 0 },
    ]
  }
};

// Determine reward tier based on probabilities - sometimes returns null (no reward)
const determineRewardTier = (): string | null => {
  const roll = Math.random();
  
  // 50% chance of NO REWARD - mystery box just pops with nothing
  if (roll < 0.50) {
    console.log('🎯 No reward this time!', roll);
    return null;
  }
  
  // Adjust probabilities for when there IS a reward (remaining 50%)
  const rewardRoll = Math.random();
  
  if (rewardRoll < 0.02) { // 1% of total (2% of reward cases)
    console.log('🎯 LEGENDARY reward!', rewardRoll);
    return 'LEGENDARY';
  } else if (rewardRoll < 0.10) { // 4% of total (8% of reward cases) 
    console.log('🎯 EPIC reward!', rewardRoll);
    return 'EPIC';
  } else if (rewardRoll < 0.40) { // 15% of total (30% of reward cases)
    console.log('🎯 RARE reward!', rewardRoll);
    return 'RARE';
  } else { // 30% of total (60% of reward cases)
    console.log('🎯 COMMON reward!', rewardRoll);
    return 'COMMON';
  }
};

// Add CSS animations for text effects
if (typeof document !== 'undefined' && !document.querySelector('#wheel-text-animations')) {
  const style = document.createElement('style');
  style.id = 'wheel-text-animations';
  style.textContent = `
    @keyframes gradientShift {
      0% { background-position: 0% 50%; }
      50% { background-position: 100% 50%; }
      100% { background-position: 0% 50%; }
    }
    
    @keyframes textPulse {
      0%, 100% { transform: perspective(100px) rotateX(5deg) scale(1); }
      50% { transform: perspective(100px) rotateX(5deg) scale(1.05); }
    }
    
    @keyframes rarityGlow {
      0%, 100% { filter: brightness(1.2) contrast(1.1); }
      50% { filter: brightness(1.4) contrast(1.2); }
    }
    
    @keyframes glassShift {
      0% { 
        background-position: 0% 50%;
        filter: drop-shadow(0 2px 8px rgba(34, 211, 238, 0.4)) brightness(1.1) contrast(1.05) saturate(1.1);
      }
      25% { 
        background-position: 100% 25%;
        filter: drop-shadow(0 3px 12px rgba(59, 130, 246, 0.5)) brightness(1.15) contrast(1.1) saturate(1.2);
      }
      50% { 
        background-position: 100% 50%;
        filter: drop-shadow(0 4px 16px rgba(139, 92, 246, 0.4)) brightness(1.2) contrast(1.1) saturate(1.1);
      }
      75% { 
        background-position: 0% 75%;
        filter: drop-shadow(0 3px 12px rgba(34, 211, 238, 0.5)) brightness(1.15) contrast(1.1) saturate(1.2);
      }
      100% { 
        background-position: 0% 50%;
        filter: drop-shadow(0 2px 8px rgba(34, 211, 238, 0.4)) brightness(1.1) contrast(1.05) saturate(1.1);
      }
    }
    
    @keyframes glassGlow {
      0% { 
        text-shadow: 
          0 0 12px rgba(34, 211, 238, 0.6),
          0 0 24px rgba(34, 211, 238, 0.3),
          0 1px 3px rgba(0, 0, 0, 0.3);
      }
      50% { 
        text-shadow: 
          0 0 16px rgba(34, 211, 238, 0.8),
          0 0 32px rgba(34, 211, 238, 0.4),
          0 1px 3px rgba(0, 0, 0, 0.3),
          0 0 8px rgba(255, 255, 255, 0.2);
      }
      100% { 
        text-shadow: 
          0 0 12px rgba(34, 211, 238, 0.6),
          0 0 24px rgba(34, 211, 238, 0.3),
          0 1px 3px rgba(0, 0, 0, 0.3);
      }
    }
    
    @keyframes pulsatingAura {
      0%, 100% { 
        transform: scale(1);
        opacity: 0.6;
      }
      50% { 
        transform: scale(1.1);
        opacity: 0.9;
      }
    }
    
    @keyframes rarityBadgePulse {
      0%, 100% { 
        transform: scale(1);
        filter: brightness(1.2) contrast(1.1);
      }
      50% { 
        transform: scale(1.05);
        filter: brightness(1.4) contrast(1.2);
      }
    }
  `;
  document.head.appendChild(style);
}

// Coupon Wheel Component - Variable Rewards with Rarities
const CouponWheel: React.FC<{
  onSpin: () => void;
  isSpinning: boolean;
  autoStart?: boolean;
  onChoiceMade?: (choice: any) => void;
  rewardTier?: string;
  result?: {
    coupons_earned: number;
    coupon_descriptions: string[];
    reward_type: string;
    celebration: string;
    wheel_result?: {
      primary_coupon_type: string;
      all_coupon_types: string[];
    };
  };
}> = ({ onSpin, isSpinning, autoStart = false, onChoiceMade, rewardTier, result }) => {
  const [animationState, setAnimationState] = useState<'idle' | 'fast-spin' | 'final-spin'>('idle');
  const [finalRotation, setFinalRotation] = useState(0);
  const [currentRotation, setCurrentRotation] = useState(0);

  const wheelRef = useRef<HTMLDivElement>(null);
  const glowRef = useRef<HTMLDivElement>(null);
  const wheelResetTriggered = useRef(false);
  const autoStartTriggered = useRef(false);

  // Get reward configuration based on tier
  const rewardConfig = REWARD_CONFIGS[rewardTier as keyof typeof REWARD_CONFIGS] || REWARD_CONFIGS.COMMON;
  
  // Calculate total weight for proportional segments
  const totalWeight = rewardConfig.segments.reduce((sum, seg) => sum + seg.weight, 0);
  
  // Create segments with variable sizes based on weights
  const segments = rewardConfig.segments.map((segment, index) => ({
    ...segment,
    color: rewardConfig.colors[index % rewardConfig.colors.length].start,
    rarity: rewardConfig.name.toLowerCase(),
    angleSize: (segment.weight / totalWeight) * 360, // Proportional angle based on weight
    startAngle: 0 // Will be calculated below
  }));

  // Calculate start angles for each segment
  let currentAngle = 0;
  segments.forEach(segment => {
    segment.startAngle = currentAngle;
    currentAngle += segment.angleSize;
  });

  // Reset wheel when autoStart changes
  useEffect(() => {
    if (autoStart && !wheelResetTriggered.current) {
      wheelResetTriggered.current = true;
      setAnimationState('idle');
      setFinalRotation(0);
      setCurrentRotation(0);
      if (wheelRef.current) {
        gsap.set(wheelRef.current, { rotation: 0 });
      }
      console.log('🎯 Wheel reset for new auto-start');
    }
  }, [autoStart]);

  // Start auto-spin sequence
  useEffect(() => {
    console.log('🎯 Auto-start useEffect triggered:', { autoStart, triggered: autoStartTriggered.current });
    
    if (autoStart && !autoStartTriggered.current && wheelRef.current) {
      console.log('🎯 Starting auto-spin sequence');
      autoStartTriggered.current = true;
      setAnimationState('fast-spin');
      onSpin();
      
      // REVERSE EXPLOSION ENTRANCE: Start large and spinning, come to center
      gsap.set(wheelRef.current, { 
        rotation: 0,
        scale: 4, // Match the motion.div initial scale
        opacity: 0.3, // Start partially visible
        force3D: true
      });
      
      // DRAMATIC ENTRANCE: Shrink to center while spinning wildly
      const entranceTimeline = gsap.timeline();
      
      // Phase 1: Reverse explosion entrance (0-1.2s)
      entranceTimeline.to(wheelRef.current, {
        scale: 1, // Shrink to normal size
        opacity: 1, // Fully visible
        duration: 1.2, // Match Framer Motion duration
        ease: "power2.out",
        force3D: true
      });
      
      // Phase 2: Wild spinning during entrance (concurrent)
      entranceTimeline.to(wheelRef.current, {
        rotation: "+=4320", // 12 full rotations during entrance
        duration: 1.2,
        ease: "none", // Constant spinning speed
        force3D: true
      }, 0); // Start immediately with entrance
      
      // Phase 3: Continue fast spinning after entrance
      entranceTimeline.to(wheelRef.current, {
        rotation: "+=3600", // 10 more rotations
        duration: 2,
        ease: "none",
        force3D: true,
        onComplete: () => {
          console.log('🎯 Reverse explosion entrance completed, transitioning to final spin');
          setCurrentRotation(prev => prev + 4320 + 3600);
          setAnimationState('final-spin');
        }
      });
    }
  }, [autoStart, onSpin, currentRotation]);

  // Handle wheel click
  const handleWheelClick = () => {
    if (animationState === 'idle' && !autoStart && wheelRef.current) {
      setAnimationState('final-spin');
      onSpin();
    }
  };

  // Calculate final rotation when spinning starts
  useEffect(() => {
    if (animationState === 'final-spin' && finalRotation === 0 && wheelRef.current) {
      console.log('🎯 Calculating final rotation for final spin');
      
      // Frontend decides the reward - pick random segment weighted by their sizes
      const randomValue = Math.random();
      let cumulativeWeight = 0;
      let targetSegmentIndex = 0;
      
      for (let i = 0; i < segments.length; i++) {
        cumulativeWeight += segments[i].weight / totalWeight;
        if (randomValue <= cumulativeWeight) {
          targetSegmentIndex = i;
          break;
        }
      }
      
      const targetSegment = segments[targetSegmentIndex];
      
      // IMPROVED RANDOMNESS: Add much more variance to final position
      const randomFullSpins = Math.floor(4 + Math.random() * 6); // 4-9 spins instead of 3-5
      const targetAngle = targetSegment.startAngle;
      
      // Add random offset within the segment (not just center)
      const randomOffset = (Math.random() - 0.5) * (targetSegment.angleSize * 0.7); // 70% of segment width
      const segmentAngle_WithOffset = targetAngle + (targetSegment.angleSize / 2) + randomOffset;
      
      // Point arrow correctly (3 o'clock = 0 degrees, pointing left into wheel)
      const exactRotation = 90 - segmentAngle_WithOffset;
      
      // Add extra micro-randomness to prevent "middle bias"
      const microRandomness = (Math.random() - 0.5) * 15; // ±7.5 degrees
      
      const finalAngle = currentRotation + (randomFullSpins * 360) + exactRotation + microRandomness;
      
      setFinalRotation(finalAngle);
      
      // Store the frontend decision for the backend call
      const choice = {
        coupon_type: targetSegment.type,
        display_name: targetSegment.name.trim(),
        segment_index: targetSegmentIndex,
        final_angle: finalAngle,
        random_offset: randomOffset
      };
      
      if (result) {
        (result as any).frontend_choice = choice;
      }
      
      onChoiceMade?.(choice);
      console.log(`🎯 Frontend chose: ${targetSegment.name} (index: ${targetSegmentIndex}, angle: ${finalAngle.toFixed(1)}°, offset: ${randomOffset.toFixed(1)}°)`);
      
      // Animate to final position with improved easing
      gsap.to(wheelRef.current, {
        rotation: finalAngle,
        duration: 5, // Slightly faster for better UX
        ease: "power3.out", // Smoother deceleration
        force3D: true, // Hardware acceleration
        onComplete: () => {
          console.log('🎯 Final spin completed');
          setCurrentRotation(finalAngle);
        }
      });
    }
  }, [animationState, finalRotation, currentRotation, result, segments, onChoiceMade, totalWeight]);

  // Glow animation - PERFORMANCE OPTIMIZED
  useEffect(() => {
    if (glowRef.current) {
      // Clear any existing animations
      gsap.killTweensOf(glowRef.current);
      
      if (animationState === 'fast-spin') {
        // SIMPLIFIED GLOW FOR PERFORMANCE: Remove complex animations during fast spin
        gsap.set(glowRef.current, { 
          opacity: 0.8, 
          scale: 1.2,
          force3D: true,
          willChange: 'transform'
        });

        // Single rotation animation for performance
        gsap.to(glowRef.current, {
          rotation: 360,
          duration: 0.5, // Fast rotation
          ease: "none",
          repeat: -1,
          force3D: true
        });
      } else if (animationState === 'final-spin') {
        // SIMPLE GLOW DURING FINAL SPIN
        gsap.to(glowRef.current, {
          opacity: 0.9,
          scale: 1.1,
          duration: 0.3,
          ease: "power2.out",
          force3D: true
        });
      } else {
        // Standard glow for idle state
        const tl = gsap.timeline({ repeat: -1 });
        tl.to(glowRef.current, {
          rotation: 360,
          duration: 8, // Slower for idle
          ease: "none",
          force3D: true
        }).to(glowRef.current, {
          opacity: 0.7,
          scale: 1.05,
          duration: 3,
          yoyo: true,
          repeat: 1,
          ease: "power2.inOut",
          force3D: true
        }, 0);
      }
    }
  }, [animationState]);

  return (
    <div className="flex flex-col items-center overflow-visible">
      {/* Rarity Label */}
      <div className="mb-4 text-center">
        <div 
          className="inline-block px-6 py-2 rounded-full text-sm font-bold tracking-widest border-2"
          style={{
            background: `linear-gradient(135deg, ${rewardConfig.colors[0].start}, ${rewardConfig.colors[0].end})`,
            borderColor: rewardConfig.glowColor,
            color: 'white',
            textShadow: `0 0 12px ${rewardConfig.glowColor}`,
            boxShadow: `
              0 0 20px ${rewardConfig.glowColor},
              inset 0 0 20px rgba(255, 255, 255, 0.1)
            `,
            animation: animationState === 'fast-spin' || animationState === 'final-spin' ? 'rarityBadgePulse 0.8s ease-in-out infinite' : 'none'
          }}
        >
          {rewardConfig.name === 'NO_REWARD' ? 'MYSTERY' : rewardConfig.name} WHEEL
        </div>
      </div>
      
      <div className="relative w-[480px] h-[480px] mb-8 overflow-visible">
        {/* Modern High-Tech Pointer */}
        <div className="absolute top-1/2 right-2 transform -translate-y-1/2 z-20">
          <div className="relative">
            {/* Futuristic pointer base */}
            <div className="w-8 h-1 bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full shadow-lg shadow-cyan-500/50"></div>
            <div className="absolute right-0 top-1/2 transform -translate-y-1/2">
              {/* Main pointer triangle */}
              <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[20px] border-t-transparent border-b-transparent border-l-cyan-400 drop-shadow-lg filter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)]"></div>
              {/* Inner glow */}
              <div className="absolute right-0 top-1/2 transform -translate-y-1/2 w-0 h-0 border-t-[6px] border-b-[6px] border-l-[16px] border-t-transparent border-b-transparent border-l-white/80"></div>
            </div>
            {/* Glowing dot */}
            <div className="absolute right-6 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-cyan-400 rounded-full animate-pulse shadow-lg shadow-cyan-500/70"></div>
          </div>
        </div>
        
        {/* Modern High-Tech Wheel - OPTIMIZED FOR PERFORMANCE */}
        <div
          ref={wheelRef}
          className="w-full h-full rounded-full cursor-pointer overflow-hidden relative border-4 border-cyan-400/20"
          style={{
            background: 'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
            boxShadow: `
              0 0 50px rgba(34, 211, 238, 0.3),
              0 0 100px rgba(34, 211, 238, 0.1),
              inset 0 0 50px rgba(34, 211, 238, 0.05),
              inset 0 0 0 1px rgba(34, 211, 238, 0.2)
            `,
            // PERFORMANCE OPTIMIZATIONS
            willChange: 'transform',
            transform: 'translateZ(0)', // Force GPU layer
            backfaceVisibility: 'hidden',
            perspective: '1000px'
          }}
          onClick={handleWheelClick}
        >
          {/* Single conic gradient wheel with all segments - PERFORMANCE OPTIMIZED */}
          <div 
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, ${segments.map((segment, index) => {
                const startPercent = (segment.startAngle / 360) * 100;
                const endPercent = ((segment.startAngle + segment.angleSize) / 360) * 100;
                
                // Use the new website color palette from REWARD_CONFIGS
                const colorIndex = index % rewardConfig.colors.length;
                const startColor = rewardConfig.colors[colorIndex].start;
                const endColor = rewardConfig.colors[colorIndex].end;
                
                return `${startColor} ${startPercent}%, ${endColor} ${endPercent}%`;
              }).join(', ')})`,
              // PERFORMANCE OPTIMIZATIONS
              willChange: animationState === 'idle' ? 'auto' : 'transform',
              transform: 'translateZ(0)', // Force GPU layer
              backfaceVisibility: 'hidden'
            }}
          >
            {/* Text labels positioned absolutely - PERFORMANCE OPTIMIZED */}
            {segments.map((segment, index) => {
              const midAngle = segment.startAngle + (segment.angleSize / 2);
              const radius = 150; // Distance from center for text
              const x = 50 + (radius / 240) * 50 * Math.cos((midAngle - 90) * Math.PI / 180);
              const y = 50 + (radius / 240) * 50 * Math.sin((midAngle - 90) * Math.PI / 180);
              
              // PERFORMANCE: Skip expensive effects during spinning
              const isSpinning = animationState === 'fast-spin' || animationState === 'final-spin';
              
              return (
                <div
                  key={index}
                  className="absolute pointer-events-none"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: `translate(-50%, -50%) rotate(${midAngle + 90 + 180}deg)`,
                    // PERFORMANCE OPTIMIZATIONS
                    willChange: isSpinning ? 'auto' : 'transform',
                    backfaceVisibility: 'hidden'
                  }}
                >
                  <div className="relative">
                    {/* Sophisticated sparkle effects - DISABLED DURING SPINNING FOR PERFORMANCE */}
                    {!isSpinning && rewardConfig.name !== 'COMMON' && (
                      <>
                        <div className="absolute -top-2 -left-2 text-xs animate-ping" style={{ 
                          animationDelay: '0s',
                          color: 'rgba(34, 211, 238, 0.9)',
                          filter: 'drop-shadow(0 0 4px rgba(34, 211, 238, 0.6))',
                        }}>✨</div>
                        <div className="absolute -bottom-2 -right-2 text-xs animate-ping" style={{ 
                          animationDelay: '1s',
                          color: 'rgba(59, 130, 246, 0.9)',
                          filter: 'drop-shadow(0 0 4px rgba(59, 130, 246, 0.6))',
                        }}>✨</div>
                        <div className="absolute -top-1 -right-1 text-xs animate-ping" style={{ 
                          animationDelay: '0.5s',
                          color: 'rgba(139, 92, 246, 0.9)',
                          filter: 'drop-shadow(0 0 4px rgba(139, 92, 246, 0.6))',
                        }}>💫</div>
                      </>
                    )}
                    
                    <div
                      className="text-center leading-tight font-bold relative z-10"
                      style={{
                        // PERFORMANCE: Simplified text during spinning
                        ...(isSpinning ? {
                          // Simple text during spinning for performance
                          color: 'white',
                          fontSize: '15px',
                          fontWeight: '700',
                          textShadow: '0 0 8px rgba(0,0,0,0.8)',
                          whiteSpace: 'nowrap'
                        } : {
                          // Sophisticated glass-like text with website's color palette (idle only)
                          background: `linear-gradient(135deg, 
                            rgba(34, 211, 238, 0.95) 0%,
                            rgba(59, 130, 246, 0.9) 25%, 
                            rgba(139, 92, 246, 0.85) 50%,
                            rgba(34, 211, 238, 0.9) 75%,
                            rgba(14, 165, 233, 0.95) 100%
                          )`,
                          backgroundSize: '200% 200%',
                          backgroundClip: 'text',
                          WebkitBackgroundClip: 'text',
                          color: 'transparent',
                          
                          // Refined glass-like effects
                          WebkitTextStroke: '0.5px rgba(34, 211, 238, 0.8)',
                          
                          // Sophisticated typography
                          fontSize: '15px',
                          fontWeight: '700',
                          letterSpacing: '0.8px',
                          fontFamily: '"Inter", "SF Pro Display", system-ui, -apple-system, sans-serif',
                          
                          // Clean glass-like shadows
                          textShadow: `
                            0 0 12px rgba(34, 211, 238, 0.6),
                            0 0 24px rgba(34, 211, 238, 0.3),
                            0 1px 3px rgba(0, 0, 0, 0.3),
                            inset 0 1px 0 rgba(255, 255, 255, 0.2)
                          `,
                          
                          // Subtle 3D glass effect
                          transformStyle: 'preserve-3d',
                          transform: 'perspective(200px) rotateX(2deg)',
                          
                          // Modern filter effects
                          filter: `
                            drop-shadow(0 2px 8px rgba(34, 211, 238, 0.4))
                            brightness(1.1)
                            contrast(1.05)
                            saturate(1.1)
                          `,
                          
                          // Smooth animations (only when not spinning)
                          animation: `
                            glassShift 4s ease-in-out infinite,
                            glassGlow 3s ease-in-out infinite alternate
                          `,
                          
                          // Advanced glass properties
                          backdropFilter: 'blur(0.5px)',
                          WebkitBackdropFilter: 'blur(0.5px)',
                          
                          whiteSpace: 'nowrap'
                        })
                      }}
                    >
                      {segment.name}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Tech grid overlay */}
          <div className="absolute inset-0 rounded-full opacity-20 pointer-events-none"
            style={{
              backgroundImage: `
                linear-gradient(90deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px),
                linear-gradient(0deg, rgba(34, 211, 238, 0.1) 1px, transparent 1px)
              `,
              backgroundSize: '20px 20px'
            }}
          />
        </div>
        
        {/* High-Tech Center Hub */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-24 h-24 rounded-full flex items-center justify-center z-10"
          style={{
            background: `
              radial-gradient(circle at center, 
                rgba(14, 165, 233, 0.8) 0%,
                rgba(8, 145, 178, 0.6) 30%,
                rgba(15, 23, 42, 0.9) 70%,
                rgba(0, 0, 0, 0.95) 100%
              )
            `,
            boxShadow: `
              0 0 30px rgba(34, 211, 238, 0.6),
              0 0 60px rgba(34, 211, 238, 0.3),
              inset 0 0 30px rgba(34, 211, 238, 0.2),
              inset 0 0 0 2px rgba(34, 211, 238, 0.5)
            `,
            border: '2px solid rgba(34, 211, 238, 0.3)'
          }}
        >
          {/* Inner tech circle */}
          <div className="w-16 h-16 rounded-full flex items-center justify-center"
            style={{
              background: 'radial-gradient(circle, rgba(34, 211, 238, 0.3) 0%, transparent 70%)',
              border: '1px solid rgba(34, 211, 238, 0.4)'
            }}
          >
            <div className="text-2xl filter drop-shadow-[0_0_8px_rgba(34,211,238,0.8)] animate-pulse">🎯</div>
          </div>
        </div>
        
        {/* High-Tech Glow Effect with Pulsing Aura */}
        <div
          ref={glowRef}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `
              conic-gradient(from 0deg, 
                rgba(34, 211, 238, 0.4) 0%,
                rgba(59, 130, 246, 0.3) 25%,
                rgba(139, 92, 246, 0.4) 50%,
                rgba(236, 72, 153, 0.3) 75%,
                rgba(34, 211, 238, 0.4) 100%
              )
            `,
            filter: 'blur(25px)',
            zIndex: -1,
            opacity: 0.6,
            animation: (animationState === 'fast-spin' || animationState === 'final-spin') ? 'pulsatingAura 0.6s ease-in-out infinite' : 'none'
          }}
        />
        
        {/* Additional pulsing aura rings during spinning */}
        {(animationState === 'fast-spin' || animationState === 'final-spin') && (
          <>
            <div className="absolute inset-[-20px] rounded-full pointer-events-none opacity-40" style={{ 
              zIndex: -3,
              background: `radial-gradient(circle, transparent 70%, ${rewardConfig.glowColor} 100%)`,
              animation: 'pulsatingAura 1.2s ease-in-out infinite'
            }}></div>
            <div className="absolute inset-[-40px] rounded-full pointer-events-none opacity-20" style={{ 
              zIndex: -4,
              background: `radial-gradient(circle, transparent 80%, ${rewardConfig.glowColor} 100%)`,
              animation: 'pulsatingAura 1.8s ease-in-out infinite reverse'
            }}></div>
          </>
        )}
        
        {/* Additional tech glow rings */}
        <div className="absolute inset-0 rounded-full pointer-events-none opacity-30" style={{ zIndex: -2 }}>
          <div className="absolute inset-4 rounded-full border border-cyan-400/20 animate-pulse"></div>
          <div className="absolute inset-8 rounded-full border border-blue-400/15 animate-pulse" style={{ animationDelay: '0.5s' }}></div>
          <div className="absolute inset-12 rounded-full border border-purple-400/10 animate-pulse" style={{ animationDelay: '1s' }}></div>
        </div>
      </div>
      
      <div className="text-center text-white">
        <h3 className="text-2xl font-bold mb-2">Coupon Wheel</h3>
        <p className="text-lg opacity-75">
          {animationState === 'final-spin' ? "Finding your perfect reward..." : 
           animationState === 'fast-spin' ? "Wheel is spinning! Get ready..." : 
           autoStart ? "Loading wheel..." : 
           "Click the wheel to spin for coupons!"}
        </p>
      </div>
    </div>
  );
};

// Epic Mystery Sphere with Liquid Color Flow - GSAP version
const MysticSphere: React.FC<{
  onOpen: () => void;
  isOpen: boolean;
  onExplode?: () => void;
  onPhaseChange?: (phase: 'sphere' | 'wheel' | 'reward') => void;
  onProcessingChange?: (processing: boolean) => void;
}> = ({ onOpen, isOpen, onExplode, onPhaseChange, onProcessingChange }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const containerRef = useRef<HTMLDivElement>(null);
  const sphereRef = useRef<HTMLDivElement>(null);
  const layer1Ref = useRef<HTMLDivElement>(null);
  const layer2Ref = useRef<HTMLDivElement>(null);
  const layer3Ref = useRef<HTMLDivElement>(null);
  const coreRef = useRef<HTMLDivElement>(null);
  const refractionRef = useRef<HTMLDivElement>(null);
  const ringsRef = useRef<HTMLDivElement>(null);
  const explosionRef = useRef<HTMLDivElement>(null);

  // Initialize GSAP animations
  useEffect(() => {
    if (!sphereRef.current) return;

    // Liquid flow layer animations
    if (layer1Ref.current) {
      gsap.to(layer1Ref.current, {
        rotation: 360,
        duration: 8,
        ease: "none",
        repeat: -1
      });
      gsap.to(layer1Ref.current, {
        scale: 1.05,
        duration: 3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
    }

    if (layer2Ref.current) {
      gsap.to(layer2Ref.current, {
        rotation: -360,
        duration: 6,
        ease: "none",
        repeat: -1
      });
      gsap.to(layer2Ref.current, {
        scale: 0.95,
        duration: 4,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
    }

    if (layer3Ref.current) {
      gsap.to(layer3Ref.current, {
        rotation: 360,
        duration: 10,
        ease: "none",
        repeat: -1
      });
      gsap.to(layer3Ref.current, {
        scale: 1.1,
        duration: 5,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
    }

    // Central core glow animation
    if (coreRef.current) {
      gsap.to(coreRef.current, {
        scale: 1.1,
        opacity: 1,
        duration: 2.5,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
    }

    // Prismatic refraction effect
    if (refractionRef.current) {
      gsap.to(refractionRef.current, {
        rotation: 360,
        duration: 15,
        ease: "none",
        repeat: -1
      });
      gsap.to(refractionRef.current, {
        opacity: 0.9,
        duration: 3,
        ease: "power2.inOut",
        yoyo: true,
        repeat: -1
      });
    }

    // Outer glow rings
    const rings = ringsRef.current?.children;
    if (rings) {
      Array.from(rings).forEach((ring, i) => {
        gsap.to(ring, {
          scale: 1.05,
          opacity: 1,
          duration: 2 + i * 0.5,
          ease: "power2.inOut",
          yoyo: true,
          repeat: -1,
          delay: i * 0.3
        });
      });
    }
  }, []);

  // Hover animations
  useEffect(() => {
    if (!sphereRef.current || isExploding) return; // Don't animate when exploding

    if (isHovered) {
      gsap.to(sphereRef.current, {
        scale: 1.1,
        rotationY: 15,
        rotationX: 5,
        duration: 0.4,
        ease: "power2.out"
      });
    } else {
      gsap.to(sphereRef.current, {
        scale: 1,
        rotationY: 0,
        rotationX: 0,
        duration: 0.4,
        ease: "power2.out"
      });
    }
  }, [isHovered, isExploding]);

  const handleClick = async () => {
    if (isExploding || isLoading) return;
    
    setIsLoading(true);
    setIsExploding(true);
    onExplode?.();
    
    // IMMEDIATELY capture current visual state to prevent snapping
    if (sphereRef.current) {
      // Get the actual current transform matrix
      const computedStyle = window.getComputedStyle(sphereRef.current);
      const matrix = new DOMMatrix(computedStyle.transform);
      const currentScale = Math.sqrt(matrix.a * matrix.a + matrix.b * matrix.b);
      const currentRotation = Math.atan2(matrix.b, matrix.a) * (180 / Math.PI);
      
      // Kill ALL animations immediately
      gsap.killTweensOf(sphereRef.current);
      gsap.killTweensOf(layer1Ref.current);
      gsap.killTweensOf(layer2Ref.current);
      gsap.killTweensOf(layer3Ref.current);
      gsap.killTweensOf(coreRef.current);
      gsap.killTweensOf(refractionRef.current);
      
      // FREEZE at current visual state immediately
      gsap.set(sphereRef.current, {
        scale: currentScale,
        rotation: currentRotation,
        opacity: 1,
        force3D: true
      });
      
      // Start explosion from frozen state with accelerating spin
      const timeline = gsap.timeline({
        onStart: () => {
          // Trigger wheel phase timing
          setTimeout(() => {
            onPhaseChange?.('wheel');
            onProcessingChange?.(false);
          }, 2500);
          
          // Create explosion particles immediately with smooth timing
          if (explosionRef.current) {
            gsap.set(explosionRef.current, { 
              display: 'block',
              force3D: true,
              overflow: 'visible'
            });
            
            // Create smooth explosive particles
            for (let i = 0; i < 16; i++) {
              const particle = document.createElement('div');
              particle.className = 'absolute rounded-full';
              
              // Beautiful sphere-colored particles
              const colors = [
                'linear-gradient(45deg, rgba(34, 197, 194, 0.9), rgba(139, 92, 246, 0.9))',
                'linear-gradient(45deg, rgba(236, 72, 153, 0.9), rgba(245, 158, 11, 0.9))',
                'linear-gradient(45deg, rgba(139, 92, 246, 0.9), rgba(16, 185, 129, 0.9))'
              ];
              
              particle.style.background = colors[i % 3];
              particle.style.width = '10px';
              particle.style.height = '10px';
              particle.style.left = '50%';
              particle.style.top = '50%';
              particle.style.transform = 'translate(-50%, -50%)';
              particle.style.willChange = 'transform, opacity';
              particle.style.boxShadow = '0 0 20px rgba(255, 255, 255, 0.8)';
              particle.style.borderRadius = '50%';
              
              explosionRef.current.appendChild(particle);

              // Smooth particle explosion with beautiful easing
              const angle = (i / 16) * Math.PI;
              const distance = 220 + Math.random() * 120; // Larger distance
              
              gsap.fromTo(particle, 
                { 
                  scale: 0.2, 
                  x: 0, 
                  y: 0,
                  rotation: 0,
                  opacity: 1
                },
                {
                  scale: 1.5,
                  x: Math.cos(angle) * distance,
                  y: Math.sin(angle) * distance,
                  rotation: 540, // 1.5 rotations for smoothness
                  opacity: 0,
                  duration: 2.8, // Longer than sphere
                  ease: "power2.out", // Beautiful easing
                  delay: i * 0.04, // Smooth stagger
                  force3D: true,
                  onComplete: () => {
                    if (particle.parentNode) {
                      particle.parentNode.removeChild(particle);
                    }
                  }
                }
              );
            }
            
            // Add some magical sparkles for extra beauty
            for (let i = 0; i < 8; i++) {
              const sparkle = document.createElement('div');
              sparkle.className = 'absolute w-2 h-2 rounded-full bg-white';
              sparkle.style.boxShadow = '0 0 12px rgba(255, 255, 255, 1)';
              sparkle.style.left = '50%';
              sparkle.style.top = '50%';
              sparkle.style.transform = 'translate(-50%, -50%)';
              sparkle.style.willChange = 'transform, opacity';
              explosionRef.current.appendChild(sparkle);

              const sparkleAngle = Math.random() * Math.PI * 2;
              const sparkleDistance = 180 + Math.random() * 100;
              
              gsap.fromTo(sparkle,
                { 
                  scale: 0, 
                  x: 0, 
                  y: 0,
                  opacity: 1
                },
                {
                  scale: Math.random() * 0.8 + 0.4,
                  x: Math.cos(sparkleAngle) * sparkleDistance,
                  y: Math.sin(sparkleAngle) * sparkleDistance,
                  opacity: 0,
                  duration: 2.2,
                  ease: "power2.out",
                  delay: Math.random() * 0.5,
                  force3D: true,
                  onComplete: () => {
                    if (sparkle.parentNode) {
                      sparkle.parentNode.removeChild(sparkle);
                    }
                  }
                }
              );
            }
          }
        }
      });
      
      // Add the actual animations to the timeline
      // Scale and fade
      timeline.to(sphereRef.current, {
        scale: 6, // Large explosion scale
        opacity: 0, // Fade to invisible
        duration: 2.5, // Smooth transition
        ease: "power2.out", // Smooth easing
        force3D: true
      });
      
      // Immediate and accelerating spin - visible from start, speeds up dramatically
      timeline.to(sphereRef.current, {
        rotation: currentRotation + 4320, // 12 full rotations for more dramatic effect
        duration: 2.5,
        ease: "power2.in", // Starts immediately but still accelerates
        force3D: true
      }, 0); // Start at same time as scale/opacity
    }

    // Cleanup explosion container
    setTimeout(() => {
      if (explosionRef.current) {
        gsap.set(explosionRef.current, { display: 'none' });
        explosionRef.current.innerHTML = '';
      }
    }, 4500); // Longer cleanup for extended particle trails

    try {
      // Start the backend call
      setTimeout(async () => {
        await onOpen();
        setIsLoading(false);
      }, 50);
    } catch (error) {
      setIsLoading(false);
      setIsExploding(false);
    }
  };

  return (
    <div className="w-96 h-96 flex items-center justify-center relative overflow-visible">
      {/* Explosion Particles Container - Positioned to allow overflow */}
      <div
        ref={explosionRef}
        className="absolute inset-0 pointer-events-none overflow-visible"
        style={{ 
          display: 'none',
          width: '200%',
          height: '200%',
          left: '-50%',
          top: '-50%',
          zIndex: 20
        }}
      />

      {/* Screen Shake Container */}
      <div
        ref={containerRef}
        className="relative cursor-pointer overflow-visible"
        onMouseEnter={() => !isExploding && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        style={{ 
          cursor: isLoading ? 'wait' : isExploding ? 'default' : 'pointer'
        }}
      >
        {/* Main Siri Sphere - Much Bigger */}
        <div
          ref={sphereRef}
          className="relative w-40 h-40 rounded-full overflow-visible"
          style={{
            transformStyle: 'preserve-3d'
          }}
        >
          {/* Loading Overlay */}
          {isLoading && !isExploding && (
            <div className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center z-10">
              <div className="w-8 h-8 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}

          {/* Liquid Flow Layer 1 - Cyan Stream */}
          <div
            ref={layer1Ref}
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 0deg, 
                rgba(34, 197, 194, 0.9) 0deg,
                rgba(34, 197, 194, 0.4) 60deg,
                transparent 120deg,
                rgba(34, 197, 194, 0.6) 180deg,
                rgba(34, 197, 194, 0.9) 240deg,
                transparent 300deg,
                rgba(34, 197, 194, 0.8) 360deg
              )`,
              mixBlendMode: 'screen'
            }}
          />

          {/* Liquid Flow Layer 2 - Purple Stream */}
          <div
            ref={layer2Ref}
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 120deg, 
                rgba(139, 92, 246, 0.8) 0deg,
                transparent 80deg,
                rgba(139, 92, 246, 0.9) 160deg,
                rgba(139, 92, 246, 0.5) 220deg,
                transparent 280deg,
                rgba(139, 92, 246, 0.7) 360deg
              )`,
              mixBlendMode: 'screen'
            }}
          />

          {/* Liquid Flow Layer 3 - Pink Stream */}
          <div
            ref={layer3Ref}
            className="absolute inset-0 rounded-full"
            style={{
              background: `conic-gradient(from 240deg, 
                transparent 0deg,
                rgba(236, 72, 153, 0.7) 60deg,
                rgba(236, 72, 153, 0.9) 120deg,
                transparent 180deg,
                rgba(236, 72, 153, 0.6) 240deg,
                rgba(236, 72, 153, 0.8) 300deg,
                transparent 360deg
              )`,
              mixBlendMode: 'screen'
            }}
          />

          {/* Central Core Glow */}
          <div
            ref={coreRef}
            className="absolute inset-4 rounded-full"
            style={{
              background: `radial-gradient(circle,
                rgba(255, 255, 255, 0.8) 0%,
                rgba(34, 197, 194, 0.6) 30%,
                rgba(139, 92, 246, 0.4) 60%,
                transparent 100%
              )`,
              mixBlendMode: 'overlay',
              opacity: 0.8
            }}
          />

          {/* Prismatic Refraction Effect */}
          <div
            ref={refractionRef}
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(45deg,
                transparent 0%,
                rgba(255, 255, 255, 0.3) 25%,
                transparent 50%,
                rgba(255, 255, 255, 0.2) 75%,
                transparent 100%
              )`,
              opacity: 0.6
            }}
          />

          {/* Outer Glow Rings */}
          <div ref={ringsRef} className="absolute inset-0 overflow-visible">
            {[...Array(4)].map((_, i) => (
              <div
                key={i}
                className="absolute rounded-full border border-cyan-400/30"
                style={{
                  inset: `-${(i + 1) * 8}px`,
                  borderColor: `rgba(34, 197, 194, ${0.4 - i * 0.1})`,
                  opacity: 0.6
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

// Enhanced Coupon Reward Popup - GSAP version
const CouponRewardPopup: React.FC<{
  reward: { 
    coupons_earned: number;
    coupon_descriptions: string[];
    reward_type: string;
    celebration: string;
  } | null;
  onClose: () => void;
}> = ({ reward, onClose }) => {
  const popupRef = useRef<HTMLDivElement>(null);
  const sparklesRef = useRef<HTMLDivElement>(null);
  
  // Safety check for null reward
  if (!reward) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-red-500 text-white p-4 rounded-lg">
          Error: No reward data available
        </div>
      </div>
    );
  }

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  // GSAP animations
  useEffect(() => {
    if (popupRef.current) {
      gsap.fromTo(popupRef.current, 
        { scale: 0.5, opacity: 0, y: 50 },
        { 
          scale: 1, 
          opacity: 1, 
          y: 0,
          duration: 0.3,
          ease: "power2.out",
          delay: 0 // Remove delay to prevent black flash
        }
      );
    }

    // Sparkles animation
    if (sparklesRef.current) {
      const sparkles = sparklesRef.current.children;
      Array.from(sparkles).forEach((sparkle, i) => {
        gsap.to(sparkle, {
          scale: 1,
          opacity: 1,
          rotation: 360,
          duration: 2 + Math.random() * 2,
          ease: "power2.inOut",
          repeat: -1,
          delay: i * 0.1
        });
      });
    }
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div 
        ref={popupRef}
        className="relative bg-gradient-to-br from-purple-500 via-pink-600 to-red-600 p-12 rounded-3xl shadow-2xl text-center max-w-lg mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Sparkles */}
        <div ref={sparklesRef} className="absolute inset-0 pointer-events-none">
          {[...Array(15)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-white rounded-full"
              style={{
                left: `${15 + Math.random() * 70}%`,
                top: `${15 + Math.random() * 70}%`,
                scale: 0,
                opacity: 0
              }}
            />
          ))}
        </div>

        <div className="text-8xl mb-8">🎫</div>
        
        <h2 className="text-4xl font-bold text-white mb-8">
          {reward.celebration}
        </h2>
        
        <div className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/30">
          <div className="text-5xl font-bold text-white mb-3">
            {reward.coupons_earned} Coupon{reward.coupons_earned > 1 ? 's' : ''}
          </div>
          <div className="text-lg text-white/90 space-y-2">
            {reward.coupon_descriptions?.map((desc, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-2">
                {desc}
              </div>
            )) || <div className="bg-white/10 rounded-lg p-2">No coupon details available</div>}
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="bg-white/20 hover:bg-white/30 text-white px-10 py-4 rounded-2xl font-bold transition-all duration-200 border border-white/30 backdrop-blur-sm text-lg"
        >
          Awesome! 🎉
        </button>
      </div>
    </div>
  );
};

// Empty Reward Display - When mystery box gives nothing - Website Color Themed
const EmptyRewardDisplay: React.FC<{
  onClose: () => void;
}> = ({ onClose }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cloudsRef = useRef<HTMLDivElement>(null);
  const sparklesRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onClose]);

  useEffect(() => {
    if (containerRef.current) {
      gsap.fromTo(containerRef.current,
        { scale: 0.3, opacity: 0, y: 100 },
        { 
          scale: 1, 
          opacity: 1, 
          y: 0,
          duration: 0.4,
          ease: "back.out(1.7)"
        }
      );
    }

    // Floating clouds animation with website colors
    if (cloudsRef.current) {
      const clouds = cloudsRef.current.children;
      Array.from(clouds).forEach((cloud, i) => {
        gsap.to(cloud, {
          x: `+=${50 + Math.random() * 100}`,
          y: `+=${20 + Math.random() * 40}`,
          rotation: Math.random() * 20 - 10,
          duration: 3 + Math.random() * 2,
          ease: "sine.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.2
        });
      });
    }

    // Sparkles animation for extra dopamine
    if (sparklesRef.current) {
      const sparkles = sparklesRef.current.children;
      Array.from(sparkles).forEach((sparkle, i) => {
        gsap.to(sparkle, {
          scale: 1.2,
          opacity: 1,
          rotation: 360,
          duration: 2 + Math.random() * 2,
          ease: "power2.inOut",
          repeat: -1,
          yoyo: true,
          delay: i * 0.15
        });
      });
    }
  }, []);

  return (
    <div className="flex items-center justify-center">
      <div 
        ref={containerRef}
        className="relative p-16 rounded-3xl shadow-2xl text-center max-w-md mx-4 border border-cyan-400/30"
        style={{
          background: `
            radial-gradient(circle at 30% 40%, rgba(34, 211, 238, 0.2) 0%, transparent 50%),
            radial-gradient(circle at 70% 60%, rgba(59, 130, 246, 0.15) 0%, transparent 50%),
            radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.1) 0%, transparent 50%),
            linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 50%, rgba(51, 65, 85, 0.85) 100%)
          `,
          boxShadow: `
            0 0 50px rgba(34, 211, 238, 0.3),
            0 0 100px rgba(34, 211, 238, 0.1),
            inset 0 0 50px rgba(34, 211, 238, 0.05),
            inset 0 0 0 1px rgba(34, 211, 238, 0.2)
          `
        }}
      >
        {/* Floating sparkles for dopamine */}
        <div ref={sparklesRef} className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(12)].map((_, i) => (
            <div
              key={i}
              className="absolute text-sm"
              style={{
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
                color: i % 3 === 0 ? 'rgba(34, 211, 238, 0.8)' : 
                       i % 3 === 1 ? 'rgba(59, 130, 246, 0.8)' : 
                       'rgba(139, 92, 246, 0.8)',
                filter: `drop-shadow(0 0 8px ${
                  i % 3 === 0 ? 'rgba(34, 211, 238, 0.6)' : 
                  i % 3 === 1 ? 'rgba(59, 130, 246, 0.6)' : 
                  'rgba(139, 92, 246, 0.6)'
                })`,
                scale: 0,
                opacity: 0
              }}
            >
              {i % 4 === 0 ? '✨' : i % 4 === 1 ? '💫' : i % 4 === 2 ? '⭐' : '🌟'}
            </div>
          ))}
        </div>

        {/* Floating clouds with website colors */}
        <div ref={cloudsRef} className="absolute inset-0 pointer-events-none overflow-hidden">
          {[...Array(6)].map((_, i) => (
            <div
              key={i}
              className="absolute text-lg"
              style={{
                left: `${Math.random() * 80 + 10}%`,
                top: `${Math.random() * 80 + 10}%`,
                color: i % 2 === 0 ? 'rgba(34, 211, 238, 0.4)' : 'rgba(59, 130, 246, 0.4)',
                filter: `drop-shadow(0 0 12px ${
                  i % 2 === 0 ? 'rgba(34, 211, 238, 0.3)' : 'rgba(59, 130, 246, 0.3)'
                })`
              }}
            >
              ☁️
            </div>
          ))}
        </div>

        <div className="text-8xl mb-6 relative">
          <div 
            className="inline-block"
            style={{
              filter: 'drop-shadow(0 0 20px rgba(34, 211, 238, 0.6))'
            }}
          >
            📦
          </div>
        </div>
        
        <h2 className="text-4xl font-bold mb-6"
          style={{
            background: `linear-gradient(135deg, 
              rgba(34, 211, 238, 0.95) 0%,
              rgba(59, 130, 246, 0.9) 50%, 
              rgba(139, 92, 246, 0.85) 100%
            )`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            color: 'transparent',
            textShadow: '0 0 20px rgba(34, 211, 238, 0.5)'
          }}
        >
          Mystery Continues! 
        </h2>
        
        <div className="bg-cyan-400/10 backdrop-blur-sm rounded-2xl p-6 mb-6 border border-cyan-400/20"
          style={{
            boxShadow: 'inset 0 0 20px rgba(34, 211, 238, 0.1)'
          }}
        >
          <div className="text-2xl font-bold mb-2"
            style={{
              background: `linear-gradient(135deg, 
                rgba(34, 211, 238, 0.9) 0%,
                rgba(59, 130, 246, 0.8) 100%
              )`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              color: 'transparent',
              textShadow: '0 0 12px rgba(34, 211, 238, 0.4)'
            }}
          >
            The universe is saving something special...
          </div>
          <div className="text-base text-cyan-300/80"
            style={{
              textShadow: '0 0 8px rgba(34, 211, 238, 0.3)'
            }}
          >
            Your next mystery box might hold incredible rewards! Keep completing tasks to unlock more chances.
          </div>
        </div>
        
        <button
          onClick={onClose}
          className="px-8 py-3 rounded-2xl font-bold transition-all duration-200 border text-lg"
          style={{
            background: `linear-gradient(135deg, 
              rgba(34, 211, 238, 0.2) 0%,
              rgba(59, 130, 246, 0.2) 100%
            )`,
            borderColor: 'rgba(34, 211, 238, 0.4)',
            color: 'rgba(34, 211, 238, 0.9)',
            boxShadow: `
              0 0 20px rgba(34, 211, 238, 0.3),
              inset 0 0 20px rgba(34, 211, 238, 0.1)
            `,
            textShadow: '0 0 8px rgba(34, 211, 238, 0.5)'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, 
              rgba(34, 211, 238, 0.3) 0%,
              rgba(59, 130, 246, 0.3) 100%
            )`;
            e.currentTarget.style.boxShadow = `
              0 0 30px rgba(34, 211, 238, 0.4),
              inset 0 0 30px rgba(34, 211, 238, 0.15)
            `;
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.background = `linear-gradient(135deg, 
              rgba(34, 211, 238, 0.2) 0%,
              rgba(59, 130, 246, 0.2) 100%
            )`;
            e.currentTarget.style.boxShadow = `
              0 0 20px rgba(34, 211, 238, 0.3),
              inset 0 0 20px rgba(34, 211, 238, 0.1)
            `;
          }}
        >
          Keep Going! ✨
        </button>
      </div>
    </div>
  );
};

// Main Component - COMPLETELY SEAMLESS - NO MODALS
const MysteryBoxRealistic: React.FC<MysteryBoxRealisticProps> = ({
  onOpen,
  onClose,
  isOpen,
  reward
}) => {
  const [phase, setPhase] = useState<'sphere' | 'wheel' | 'reward' | 'empty'>('sphere');
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [currentReward, setCurrentReward] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [frontendChoice, setFrontendChoice] = useState<any>(null);
  const [choiceCapture, setChoiceCapture] = useState<((choice: any) => void) | null>(null);
  const [rewardTier, setRewardTier] = useState<string | null>(null);

  const containerRef = useRef<HTMLDivElement>(null);

  // Reset states when modal is opened
  useEffect(() => {
    if (isOpen) {
      setPhase('sphere');
      setIsWheelSpinning(false);
      setCurrentReward(null);
      setIsProcessing(false);
      setFrontendChoice(null);
      setRewardTier(null);
    }
  }, [isOpen]);

  // Phase transition animations
  useEffect(() => {
    if (!containerRef.current) return;

    if (isOpen) {
      gsap.fromTo(containerRef.current,
        { opacity: 0 },
        { opacity: 1, duration: 0.4, ease: "power2.out" }
      );
    }
  }, [isOpen]);

  const handleSphereOpen = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    // Determine reward tier immediately when sphere is clicked
    const tier = determineRewardTier();
    setRewardTier(tier);
    
    console.log('🎯 Reward tier determined:', tier);
    
    if (tier === null) {
      // NO REWARD - Sphere explodes but shows empty result
      setTimeout(() => {
        setPhase('empty');
        setIsProcessing(false);
      }, 2500); // Match the explosion timeline
      
      // Still call backend with no reward choice
      try {
        setTimeout(async () => {
          const emptyChoice = {
            coupon_type: 'no_reward',
            display_name: 'No Reward',
            segment_index: -1,
            final_angle: 0,
            random_offset: 0
          };
          
          await onOpen(); // Call backend anyway for analytics
        }, 100);
      } catch (error) {
        console.error('Error with empty reward:', error);
      }
    } else {
      // HAS REWARD - Show wheel after explosion
      setTimeout(() => {
        setPhase('wheel');
        setIsProcessing(false);
      }, 2500); // Match the explosion timeline
    }
  };

  const handleWheelSpin = async () => {
    if (isWheelSpinning) return;
    
    console.log('🎯 handleWheelSpin called, current frontendChoice:', frontendChoice);
    setIsWheelSpinning(true);
    
    let capturedChoice: any = null;
    
    const captureFunction = (choice: any) => {
      console.log('🎯 Choice captured in closure:', choice);
      capturedChoice = choice;
    };
    setChoiceCapture(() => captureFunction);
    
    try {
      const placeholderResult = {
        coupons_earned: 1,
        coupon_descriptions: ['Spinning...'],
        reward_type: 'common',
        celebration: '🎉 Congratulations!'
      };
      
      setCurrentReward(placeholderResult);
      
      // Wait for wheel to finish spinning (8 seconds), then call backend with captured choice
      setTimeout(async () => {
        try {
          console.log('🎯 8 seconds later - Using captured choice:', capturedChoice);
          
          const choiceToUse = capturedChoice || frontendChoice;
          
          if (!choiceToUse) {
            throw new Error('CRITICAL: No choice captured - wheel failed to generate choice');
          }
          
          if (!choiceToUse.coupon_type) {
            throw new Error('CRITICAL: Choice missing coupon_type - invalid choice object');
          }
          
          console.log('🎯 Sending choice to backend:', choiceToUse);
          
          const result = await userApi.openMysteryBox(choiceToUse);
          
          if (result && result.success) {
            const finalReward = {
              coupons_earned: 1,
              coupon_descriptions: [`${choiceToUse.display_name} - ${choiceToUse.coupon_type.replace('_', ' ')} time!`],
              reward_type: 'wheel_choice',
              celebration: `🎉 You won ${choiceToUse.display_name}!`,
              frontend_choice: choiceToUse
            };
            
            setCurrentReward(finalReward);
          } else {
            throw new Error(`Backend rejected choice: ${result?.message || 'Unknown error'}`);
          }
          
          setTimeout(() => {
            setPhase('reward');
            setIsWheelSpinning(false);
          }, 1000);
          
        } catch (error) {
          console.error('🚨 FATAL ERROR in mystery box:', error);
          const errorMessage = error instanceof Error ? error.message : 'Unknown system error';
          const errorReward = {
            coupons_earned: 0,
            coupon_descriptions: [errorMessage],
            reward_type: 'system_error',
            celebration: '🚨 System Error - Check Console',
          };
          setCurrentReward(errorReward);
          
          setTimeout(() => {
            setPhase('reward');
            setIsWheelSpinning(false);
          }, 1000);
        }
      }, 8000);
      
    } catch (error) {
      console.error('Error spinning wheel:', error);
      setIsWheelSpinning(false);
      onClose?.();
    }
  };

  const handleRewardClose = () => {
    setPhase('sphere');
    setCurrentReward(null);
    onClose?.();
  };

  if (!isOpen) return null;

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md overflow-hidden"
      onClick={(e) => {
        if (e.target === e.currentTarget && phase === 'sphere') {
          onClose?.();
        }
      }}
    >
      {/* FIXED: Proper container to prevent rectangle glitches */}
      <div className="relative flex items-center justify-center w-[600px] h-[600px] overflow-visible">
        <AnimatePresence mode="wait" initial={false}>
          {phase === 'sphere' && (
            <motion.div
              key="sphere"
              initial={{ opacity: 1, scale: 1 }}
              exit={{ 
                opacity: 0, 
                scale: 4, // Scale up instead of down for morphing effect
                transition: { duration: 0.2, ease: "easeInOut" }
              }}
              className="absolute inset-0 flex items-center justify-center overflow-visible"
            >
              <MysticSphere
                onOpen={handleSphereOpen}
                isOpen={isOpen}
                onExplode={() => {}}
                onPhaseChange={setPhase}
                onProcessingChange={setIsProcessing}
              />
            </motion.div>
          )}

          {phase === 'wheel' && (
            <motion.div
              key="wheel"
              initial={{ 
                opacity: 0.3, 
                scale: 4, // Start very large (outside screen)
                rotate: 0
              }}
              animate={{ 
                opacity: 1, 
                scale: 1, // Come to normal size
                rotate: 0,
                transition: { 
                  duration: 1.2, // Longer for dramatic entrance
                  ease: "easeOut", // Smooth deceleration
                  scale: {
                    type: "spring",
                    stiffness: 100,
                    damping: 20
                  }
                }
              }}
              className="absolute inset-0 flex items-center justify-center overflow-visible"
              style={{ 
                zIndex: 10,
                transformOrigin: 'center center'
              }}
            >
              <CouponWheel
                onSpin={handleWheelSpin}
                isSpinning={isWheelSpinning}
                autoStart={true}
                onChoiceMade={(choice) => {
                  console.log('🎯 Main component received choice:', choice);
                  setFrontendChoice(choice);
                  if (choiceCapture) {
                    choiceCapture(choice);
                  }
                }}
                result={currentReward}
                rewardTier={rewardTier || undefined}
              />
            </motion.div>
          )}

          {phase === 'reward' && currentReward && (
            <motion.div
              key="reward"
              initial={{ 
                opacity: 0, 
                scale: 0.8,
                y: 20
              }}
              animate={{ 
                opacity: 1, 
                scale: 1,
                y: 0,
                transition: { 
                  duration: 0.25, 
                  ease: "easeOut",
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }
              }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <CouponRewardPopup
                reward={currentReward}
                onClose={handleRewardClose}
              />
            </motion.div>
          )}

          {phase === 'empty' && (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="absolute inset-0 flex items-center justify-center"
            >
              <EmptyRewardDisplay onClose={handleRewardClose} />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MysteryBoxRealistic;