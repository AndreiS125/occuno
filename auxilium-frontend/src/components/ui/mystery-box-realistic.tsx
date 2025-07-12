"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { userApi } from '@/lib/api';

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

// Coupon Wheel Component - Smooth animation system
const CouponWheel: React.FC<{
  onSpin: () => void;
  isSpinning: boolean;
  autoStart?: boolean;
  onChoiceMade?: (choice: any) => void;
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
}> = ({ onSpin, isSpinning, autoStart = false, onChoiceMade, result }) => {
  const [animationState, setAnimationState] = useState<'idle' | 'fast-spin' | 'final-spin'>('idle');
  const [finalRotation, setFinalRotation] = useState(0);
  const [currentRotation, setCurrentRotation] = useState(0);

  // Reset wheel when autoStart changes (new wheel instance) - SINGLE TRIGGER ONLY
  const wheelResetTriggered = useRef(false);
  
  useEffect(() => {
    if (autoStart && !wheelResetTriggered.current) {
      wheelResetTriggered.current = true;
      setAnimationState('idle');
      setFinalRotation(0);
      setCurrentRotation(0);
      console.log('🎯 Wheel reset for new auto-start');
    }
  }, [autoStart]);

  // Define the wheel segments - frontend decides rewards
  const segments = [
    { name: "  📺 YouTube", color: "from-red-500 to-red-600", type: "watch_youtube", rarity: "common" },
    { name: "  📱 Instagram", color: "from-pink-500 to-pink-600", type: "scroll_instagram", rarity: "common" },
    { name: "  🎵 Music", color: "from-purple-500 to-purple-600", type: "listen_music", rarity: "common" },
    { name: "  🎮 Games", color: "from-blue-500 to-blue-600", type: "play_games", rarity: "common" },
    { name: "  💬 Chat", color: "from-teal-500 to-teal-600", type: "chat_friends", rarity: "common" },
    { name: "  😴 Nap", color: "from-indigo-500 to-indigo-600", type: "take_nap", rarity: "common" },
    { name: "  🍿 Snack", color: "from-yellow-500 to-yellow-600", type: "eat_snack", rarity: "common" },
    { name: "  🤖 Reddit", color: "from-orange-500 to-orange-600", type: "browse_reddit", rarity: "common" }
  ];

  const segmentAngle = 360 / segments.length;

  // Start auto-spin sequence - use ref to prevent multiple triggers
  const autoStartTriggered = useRef(false);
  
  useEffect(() => {
    console.log('🎯 Auto-start useEffect triggered:', { autoStart, triggered: autoStartTriggered.current });
    
    if (autoStart && !autoStartTriggered.current) {
      console.log('🎯 Starting auto-spin sequence');
      autoStartTriggered.current = true;
      setAnimationState('fast-spin');
      onSpin(); // Call onSpin immediately when starting
      
      // The transition to final-spin will happen in the fast-spin onComplete callback
    }
  }, [autoStart, onSpin]);

  const handleWheelClick = () => {
    // Only allow manual clicks if not auto-spinning
    if (animationState === 'idle' && !autoStart) {
      setAnimationState('final-spin');
      onSpin();
    }
  };

  // Calculate final rotation when spinning starts - frontend decides reward
  useEffect(() => {
    if (animationState === 'final-spin' && finalRotation === 0) {
      console.log('🎯 Calculating final rotation for final spin');
      // Frontend decides the reward - pick random segment
      const targetSegmentIndex = Math.floor(Math.random() * segments.length);
      const targetSegment = segments[targetSegmentIndex];
      
      const randomFullSpins = Math.floor(3 + Math.random() * 3); // 3-5 full rotations (integer to preserve mod 360)
      
      // Calculate angle to land on target segment CENTER (accounting for arrow at 3 o'clock)
      const targetAngle = targetSegmentIndex * segmentAngle;
      const segmentCenterAngle = targetAngle + (segmentAngle / 2); // Point to segment center, not start
      
      // FIXED: Exact calculation
      // exactRotation = 90 - segmentCenterAngle to align center to 0°
      const exactRotation = 90 - segmentCenterAngle;
      const finalAngle = currentRotation + (randomFullSpins * 360) + exactRotation;
      
      setFinalRotation(finalAngle);
      
      // Store the frontend decision for the backend call
      const choice = {
        coupon_type: targetSegment.type,
        display_name: targetSegment.name.trim(),
        segment_index: targetSegmentIndex
      };
      
      if (result) {
        (result as any).frontend_choice = choice;
      }
      
      // Notify parent component about the choice
      console.log(`🎯 About to call onChoiceMade with choice:`, choice);
      console.log(`🎯 onChoiceMade function exists:`, !!onChoiceMade);
      onChoiceMade?.(choice);
      console.log(`🎯 onChoiceMade called successfully`);
      
      console.log(`🎯 Frontend chose: ${targetSegment.name} (index: ${targetSegmentIndex}, type: ${targetSegment.type})`);
      console.log(`🎯 Segment center angle: ${segmentCenterAngle}°, final wheel angle: ${finalAngle}°`);
      
      // Debug: What will the wheel actually point to?
      const wheelFinalPosition = finalAngle % 360;
      const normalizedPosition = wheelFinalPosition < 0 ? wheelFinalPosition + 360 : wheelFinalPosition;
      
      let pointedAngle = (-normalizedPosition % 360);
      if (pointedAngle < 0) pointedAngle += 360;
      pointedAngle += 90;
      const arrowPointsToSegment = Math.floor(pointedAngle / segmentAngle) % segments.length;
      console.log(`🎯 Wheel final position: ${normalizedPosition}°`);
      console.log(`🎯 Pointed angle: ${pointedAngle}°`);
      console.log(`🎯 Arrow points to segment: ${arrowPointsToSegment} (${segments[arrowPointsToSegment]?.name})`);
      console.log(`🎯 Match check: ${arrowPointsToSegment === targetSegmentIndex ? '✅ CORRECT' : '❌ WRONG - Expected ' + targetSegmentIndex + ' but got ' + arrowPointsToSegment}`);
    }
  }, [animationState, finalRotation, currentRotation, segmentAngle, result, segments]);

  // Get animation values based on state
  const getAnimationProps = () => {
    console.log('🎯 Animation state:', animationState, 'Current rotation:', currentRotation);
    
    switch (animationState) {
      case 'fast-spin':
        return {
          rotate: [currentRotation, currentRotation + 720], // 2 full rotations in 2 seconds
          transition: {
            duration: 2,
            ease: "linear",
            repeat: 0,
            onComplete: () => {
              console.log('🎯 Fast spin completed, updating rotation and transitioning to final spin');
              setCurrentRotation(prev => prev + 720);
              // Now transition to final spin since the fast spin is actually complete
              setAnimationState('final-spin');
            }
          }
        };
      case 'final-spin':
        return {
          rotate: finalRotation,
          transition: {
            duration: 6,
            ease: [0.25, 0.46, 0.45, 0.94], // Custom easing for dramatic slowdown
            onComplete: () => {
              console.log('🎯 Final spin completed');
              setCurrentRotation(finalRotation);
            }
          }
        };
      default:
        return {
          rotate: currentRotation,
          transition: { duration: 0 }
        };
    }
  };

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-[480px] h-[480px] mb-8">
        {/* Wheel pointer - proper black arrow pointing at 3 o'clock */}
        <div className="absolute top-1/2 right-4 transform -translate-y-1/2 z-20">
          <div className="relative">
            {/* Main arrow pointing left (into the wheel) */}
            <div className="w-0 h-0 border-t-[16px] border-b-[16px] border-r-[24px] border-t-transparent border-b-transparent border-r-black drop-shadow-lg"></div>
            {/* Arrow shadow for depth */}
            <div className="absolute top-1 left-1 w-0 h-0 border-t-[14px] border-b-[14px] border-r-[20px] border-t-transparent border-b-transparent border-r-gray-800"></div>
            {/* Arrow highlight */}
            <div className="absolute top-2 left-2 w-0 h-0 border-t-[12px] border-b-[12px] border-r-[16px] border-t-transparent border-b-transparent border-r-gray-700"></div>
          </div>
        </div>
        
        {/* Wheel */}
        <motion.div
          className="w-full h-full rounded-full shadow-2xl cursor-pointer overflow-hidden relative"
          style={{
            background: 'conic-gradient(from 0deg, #8B5CF6, #EC4899, #F59E0B, #10B981, #3B82F6, #8B5CF6)',
            boxShadow: '0 25px 50px rgba(0,0,0,0.3), inset 0 0 0 2px rgba(255,255,255,0.1)'
          }}
          animate={getAnimationProps()}
          onClick={handleWheelClick}
        >
          {/* Wheel segments */}
          {segments.map((segment, index) => {
            const angle = index * segmentAngle;
            const nextAngle = (index + 1) * segmentAngle;
            
            // Debug logging for first render
            if (index === 0) {
              console.log('🎨 Wheel segments rendering order:', segments.map((s, i) => `${i}: ${s.name}`));
            }
            
            return (
              <div
                key={index}
                className="absolute w-full h-full"
                style={{
                  clipPath: `polygon(50% 50%, 
                    ${50 + 50 * Math.cos((angle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((angle - 90) * Math.PI / 180)}%, 
                    ${50 + 50 * Math.cos((nextAngle - 90) * Math.PI / 180)}% ${50 + 50 * Math.sin((nextAngle - 90) * Math.PI / 180)}%)`
                }}
              >
                <div className={`w-full h-full bg-gradient-to-br ${segment.color} flex items-center justify-center relative`}>
                  {/* Fixed text positioning - much further from center and bigger */}
                  <div 
                    className="absolute inset-0 flex items-center justify-center"
                    style={{
                      transform: `rotate(${angle + segmentAngle / 2}deg)`,
                      transformOrigin: 'center',
                    }}
                  >
                    <div 
                      className="text-white font-bold text-center leading-tight"
                      style={{
                        transform: 'translateY(-190px) rotate(270deg)', // Rotated 180 degrees more (90 + 180 = 270)
                        textShadow: '0 0 12px rgba(0,0,0,0.9), 0 0 24px rgba(0,0,0,0.7), 0 2px 4px rgba(0,0,0,0.8)',
                        fontSize: '16px', // Bigger text
                        fontWeight: '900',
                        whiteSpace: 'nowrap',
                        color: 'white',
                        filter: 'drop-shadow(0 0 6px rgba(0,0,0,0.9))',
                        letterSpacing: '0.5px'
                      }}
                    >
                      {segment.name}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </motion.div>
        
        {/* Center hub - enhanced */}
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-20 h-20 bg-gradient-to-br from-white to-gray-200 rounded-full shadow-xl border-4 border-white flex items-center justify-center z-10">
          <div className="text-3xl">🎯</div>
        </div>
        
        {/* Enhanced glow effect that pulses faster when spinning */}
        <motion.div
          className="absolute inset-0 rounded-full"
          style={{
            background: 'conic-gradient(from 0deg, rgba(139, 92, 246, 0.4), rgba(236, 72, 153, 0.4), rgba(245, 158, 11, 0.4), rgba(16, 185, 129, 0.4), rgba(59, 130, 246, 0.4), rgba(139, 92, 246, 0.4))',
            filter: 'blur(20px)',
            zIndex: -1
          }}
          animate={{
            rotate: [0, 360],
            opacity: animationState === 'fast-spin' ? [0.5, 1, 0.5] : [0.3, 0.6, 0.3],
            scale: animationState === 'fast-spin' ? [1, 1.08, 1] : [1, 1.02, 1]
          }}
          transition={{
            rotate: { duration: animationState === 'fast-spin' ? 0.5 : 8, repeat: Infinity, ease: "linear" },
            opacity: { duration: animationState === 'fast-spin' ? 0.3 : 2, repeat: Infinity, ease: "easeInOut" },
            scale: { duration: animationState === 'fast-spin' ? 0.4 : 3, repeat: Infinity, ease: "easeInOut" }
          }}
        />
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

// Epic Mystery Sphere with Liquid Color Flow
const MysticSphere: React.FC<{
  onOpen: () => void;
  isOpen: boolean;
  onExplode?: () => void;
}> = ({ onOpen, isOpen, onExplode }) => {
  const [isHovered, setIsHovered] = useState(false);
  const [isExploding, setIsExploding] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleClick = async () => {
    if (isExploding || isLoading) return;
    
    setIsLoading(true);
    
    try {
      // Start explosion immediately
      setIsExploding(true);
      onExplode?.();
      
      // Trigger the actual function after a short delay for better UX
      setTimeout(async () => {
        await onOpen();
        setIsLoading(false);
      }, 600);
      
    } catch (error) {
      setIsLoading(false);
      setIsExploding(false);
    }
  };

  return (
    <div className="w-96 h-96 flex items-center justify-center relative">
      {/* Screen Flash Effect */}
      {isExploding && (
        <motion.div
          className="fixed inset-0 bg-white pointer-events-none z-50"
          initial={{ opacity: 0 }}
          animate={{ 
            opacity: [0, 0.9, 0],
          }}
          transition={{ 
            duration: 0.4,
            times: [0, 0.15, 1],
            ease: "easeOut" 
          }}
        />
      )}

      {/* Screen Shake Container */}
      <motion.div
        className="relative cursor-pointer"
        onMouseEnter={() => !isExploding && setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
        onClick={handleClick}
        animate={isExploding ? {
          x: [0, -8, 8, -5, 5, -3, 3, 0],
          y: [0, -3, 3, -2, 2, -1, 1, 0],
          transition: { duration: 0.5, ease: "easeOut" }
        } : {}}
        style={{ 
          cursor: isLoading ? 'wait' : isExploding ? 'default' : 'pointer'
        }}
      >
        {/* Main Siri Sphere - Much Bigger */}
        <motion.div
          className="relative w-40 h-40 rounded-full overflow-hidden"
          animate={isExploding ? {
            scale: [1, 1.8, 0],
            opacity: [1, 1, 0],
            rotate: [0, 360, 720],
            transition: { duration: 1.0, ease: "easeInOut" }
          } : {
            scale: isHovered ? 1.1 : 1,
            rotateY: isHovered ? 15 : 0,
            rotateX: isHovered ? 5 : 0,
          }}
          transition={!isExploding ? {
            duration: 0.4,
            ease: "easeOut"
          } : undefined}
        >
          {/* Loading Overlay */}
          {isLoading && !isExploding && (
            <motion.div
              className="absolute inset-0 bg-black/20 rounded-full flex items-center justify-center z-10"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              <motion.div
                className="w-8 h-8 border-2 border-white border-t-transparent rounded-full"
                animate={{ rotate: 360 }}
                transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              />
            </motion.div>
          )}

          {/* Liquid Flow Layer 1 - Cyan Stream */}
          <motion.div
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
            animate={{
              rotate: [0, 360],
              scale: [1, 1.05, 1]
            }}
            transition={{
              rotate: { duration: 8, repeat: Infinity, ease: "linear" },
              scale: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          />

          {/* Liquid Flow Layer 2 - Purple Stream */}
          <motion.div
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
            animate={{
              rotate: [360, 0],
              scale: [1, 0.95, 1.05, 1]
            }}
            transition={{
              rotate: { duration: 6, repeat: Infinity, ease: "linear" },
              scale: { duration: 4, repeat: Infinity, ease: "easeInOut" }
            }}
          />

          {/* Liquid Flow Layer 3 - Pink Stream */}
          <motion.div
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
            animate={{
              rotate: [0, 360],
              scale: [1, 1.1, 0.95, 1]
            }}
            transition={{
              rotate: { duration: 10, repeat: Infinity, ease: "linear" },
              scale: { duration: 5, repeat: Infinity, ease: "easeInOut" }
            }}
          />

          {/* Central Core Glow */}
          <motion.div
            className="absolute inset-4 rounded-full"
            style={{
              background: `radial-gradient(circle,
                rgba(255, 255, 255, 0.8) 0%,
                rgba(34, 197, 194, 0.6) 30%,
                rgba(139, 92, 246, 0.4) 60%,
                transparent 100%
              )`,
              mixBlendMode: 'overlay'
            }}
            animate={{
              scale: [1, 1.1, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{
              duration: 2.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          />

          {/* Prismatic Refraction Effect */}
          <motion.div
            className="absolute inset-0 rounded-full"
            style={{
              background: `linear-gradient(45deg,
                transparent 0%,
                rgba(255, 255, 255, 0.3) 25%,
                transparent 50%,
                rgba(255, 255, 255, 0.2) 75%,
                transparent 100%
              )`
            }}
            animate={{
              rotate: [0, 360],
              opacity: [0.6, 0.9, 0.6]
            }}
            transition={{
              rotate: { duration: 15, repeat: Infinity, ease: "linear" },
              opacity: { duration: 3, repeat: Infinity, ease: "easeInOut" }
            }}
          />

          {/* Outer Glow Rings */}
          <div className="absolute inset-0">
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full border border-cyan-400/30"
                style={{
                  inset: `-${(i + 1) * 8}px`,
                  borderColor: `rgba(34, 197, 194, ${0.4 - i * 0.1})`
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [0.6, 1, 0.6]
                }}
                transition={{
                  duration: 2 + i * 0.5,
                  repeat: Infinity,
                  ease: "easeInOut",
                  delay: i * 0.3
                }}
              />
            ))}
          </div>
        </motion.div>
        
        {/* Epic Explosion - More Satisfying */}
        <AnimatePresence>
          {isExploding && (
            <motion.div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
              {[...Array(30)].map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute w-2 h-2 rounded-full"
                  style={{
                    background: `hsl(${Math.random() * 360}, 70%, 60%)`,
                    left: '50%',
                    top: '50%',
                  }}
                  initial={{ scale: 0, x: 0, y: 0 }}
                  animate={{
                    scale: [0, 1, 0],
                    x: (Math.random() - 0.5) * 800,
                    y: (Math.random() - 0.5) * 800,
                    rotate: Math.random() * 360,
                  }}
                  transition={{
                    duration: 2,
                    ease: "easeOut",
                    delay: i * 0.02
                  }}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

// Enhanced Coupon Reward Popup
const CouponRewardPopup: React.FC<{
  reward: { 
    coupons_earned: number;
    coupon_descriptions: string[];
    reward_type: string;
    celebration: string;
  } | null;
  onClose: () => void;
}> = ({ reward, onClose }) => {
  
  // Safety check for null reward
  if (!reward) {
    return (
      <motion.div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="bg-red-500 text-white p-4 rounded-lg">
          Error: No reward data available
        </div>
      </motion.div>
    );
  }
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, 5000);
    return () => clearTimeout(timer);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={onClose}
    >
      <motion.div 
        className="relative bg-gradient-to-br from-purple-500 via-pink-600 to-red-600 p-12 rounded-3xl shadow-2xl text-center max-w-lg mx-4"
        initial={{ scale: 0.3, opacity: 0, y: 100 }}
        animate={{ 
          scale: 1, 
          opacity: 1, 
          y: 0,
          transition: {
            type: "spring",
            stiffness: 300,
            damping: 20,
            delay: 0.5
          }
        }}
        exit={{ 
          scale: 0.8, 
          opacity: 0, 
          y: -50,
          transition: { duration: 0.3 }
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Floating Sparkles */}
        {[...Array(15)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute w-2 h-2 bg-white rounded-full"
            style={{
              left: `${15 + Math.random() * 70}%`,
              top: `${15 + Math.random() * 70}%`,
            }}
            animate={{
              scale: [0, 1, 0],
              opacity: [0, 1, 0],
              rotate: [0, 360],
            }}
            transition={{
              duration: 2 + Math.random() * 2,
              repeat: Infinity,
              delay: i * 0.1,
              ease: "easeInOut"
            }}
          />
        ))}

        <motion.div 
          className="text-8xl mb-8"
          animate={{
            scale: [1, 1.2, 1],
            rotate: [0, 10, -10, 0]
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "easeInOut"
          }}
        >
          🎫
        </motion.div>
        
        <motion.h2 
          className="text-4xl font-bold text-white mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          {reward.celebration}
        </motion.h2>
        
        <motion.div 
          className="bg-white/20 backdrop-blur-sm rounded-2xl p-8 mb-8 border border-white/30"
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.9 }}
        >
          <motion.div 
            className="text-5xl font-bold text-white mb-3"
            animate={{
              scale: [1, 1.1, 1]
            }}
            transition={{
              duration: 1.5,
              repeat: Infinity,
              ease: "easeInOut"
            }}
          >
            {reward.coupons_earned} Coupon{reward.coupons_earned > 1 ? 's' : ''}
          </motion.div>
          <div className="text-lg text-white/90 space-y-2">
            {reward.coupon_descriptions?.map((desc, index) => (
              <div key={index} className="bg-white/10 rounded-lg p-2">
                {desc}
              </div>
            )) || <div className="bg-white/10 rounded-lg p-2">No coupon details available</div>}
          </div>
        </motion.div>
        
        <motion.button
          onClick={onClose}
          className="bg-white/20 hover:bg-white/30 text-white px-10 py-4 rounded-2xl font-bold transition-all duration-200 border border-white/30 backdrop-blur-sm text-lg"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
        >
          Awesome! 🎉
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// Main Component - COMPLETELY SEAMLESS - NO MODALS
const MysteryBoxRealistic: React.FC<MysteryBoxRealisticProps> = ({
  onOpen,
  onClose,
  isOpen,
  reward
}) => {
  const [phase, setPhase] = useState<'sphere' | 'wheel' | 'reward'>('sphere');
  const [isWheelSpinning, setIsWheelSpinning] = useState(false);
  const [currentReward, setCurrentReward] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [frontendChoice, setFrontendChoice] = useState<any>(null);
  const [choiceCapture, setChoiceCapture] = useState<((choice: any) => void) | null>(null);

  // Reset states when modal is opened
  useEffect(() => {
    if (isOpen) {
      setPhase('sphere');
      setIsWheelSpinning(false);
      setCurrentReward(null);
      setIsProcessing(false);
      setFrontendChoice(null);
    }
  }, [isOpen]);

  const handleSphereOpen = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      // Immediate transition to wheel - appears during explosion (below particles)
      setTimeout(() => {
        setPhase('wheel');
        setIsProcessing(false);
      }, 200); // Very quick - wheel appears while explosion is still happening
      
    } catch (error) {
      console.error('Error opening mystery box:', error);
      setIsProcessing(false);
      onClose?.();
    }
  };

  const handleWheelSpin = async () => {
    if (isWheelSpinning) return;
    
    console.log('🎯 handleWheelSpin called, current frontendChoice:', frontendChoice);
    setIsWheelSpinning(true);
    
    // Store the choice in a closure variable to avoid state issues
    let capturedChoice: any = null;
    
    // Set up the capture function
    const captureFunction = (choice: any) => {
      console.log('🎯 Choice captured in closure:', choice);
      capturedChoice = choice;
    };
    setChoiceCapture(() => captureFunction);
    
    try {
      // Create placeholder result for frontend wheel decision
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
          console.log('🎯 State frontendChoice for comparison:', frontendChoice);
          
          // Use the captured choice instead of state
          const choiceToUse = capturedChoice || frontendChoice;
          
          // FRONTEND CHOICE MUST EXIST - no fallbacks allowed
          if (!choiceToUse) {
            throw new Error('CRITICAL: No choice captured - wheel failed to generate choice');
          }
          
          if (!choiceToUse.coupon_type) {
            throw new Error('CRITICAL: Choice missing coupon_type - invalid choice object');
          }
          
          console.log('🎯 Sending choice to backend:', choiceToUse);
          
          // Call backend with the captured choice
          const result = await userApi.openMysteryBox(choiceToUse);
          
          if (result && result.success) {
            // Update reward with real backend data but keep frontend choice integrity
            const finalReward = {
              coupons_earned: 1, // Always 1 coupon for wheel choice
              coupon_descriptions: [`${choiceToUse.display_name} - ${choiceToUse.coupon_type.replace('_', ' ')} time!`],
              reward_type: 'wheel_choice',
              celebration: `🎉 You won ${choiceToUse.display_name}!`,
              frontend_choice: choiceToUse
            };
            
            setCurrentReward(finalReward);
          } else {
            throw new Error(`Backend rejected choice: ${result?.message || 'Unknown error'}`);
          }
          
          // Show reward popup after 1 second pause
          setTimeout(() => {
            setPhase('reward');
            setIsWheelSpinning(false);
          }, 1000);
          
        } catch (error) {
          console.error('🚨 FATAL ERROR in mystery box:', error);
          // This is a critical system failure - show the actual error
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
      }, 8000); // Wait for wheel to finish spinning
      
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

  // SINGLE SEAMLESS CONTAINER - NO CARDS OR MODALS
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md"
      onClick={(e) => {
        if (e.target === e.currentTarget && phase === 'sphere') {
          onClose?.();
        }
      }}
    >
      {/* SEAMLESS CONTENT - NO CARD BACKGROUNDS */}
      <div className="flex items-center justify-center">
        <AnimatePresence mode="wait">
          {phase === 'sphere' && (
            <motion.div
              key="sphere"
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.3, opacity: 0 }}
              transition={{ duration: 0.4, ease: "easeOut" }}
            >
              <MysticSphere
                onOpen={handleSphereOpen}
                isOpen={isOpen}
                onExplode={() => {}}
              />
            </motion.div>
          )}

          {phase === 'wheel' && (
            <motion.div
              key="wheel"
              initial={{ scale: 0.3, opacity: 0, rotateY: 180 }}
              animate={{ scale: 1, opacity: 1, rotateY: 0 }}
              exit={{ scale: 0.8, opacity: 0 }}
              transition={{ 
                duration: 0.4, 
                ease: "easeOut",
                delay: 0 // No delay - appears immediately during explosion
              }}
              style={{ zIndex: 10 }} // Lower z-index than explosion particles
            >
              <CouponWheel
                onSpin={handleWheelSpin}
                isSpinning={isWheelSpinning}
                autoStart={true} // IMMEDIATE FAST SPINNING
                onChoiceMade={(choice) => {
                  console.log('🎯 Main component received choice:', choice);
                  setFrontendChoice(choice);
                  // Also call the capture function if available
                  if (choiceCapture) {
                    choiceCapture(choice);
                  }
                  console.log('🎯 setFrontendChoice and capture called with:', choice);
                }}
                result={currentReward}
              />
            </motion.div>
          )}

          {phase === 'reward' && currentReward && (
            <motion.div
              key="reward"
              initial={{ scale: 0.3, opacity: 0, y: 100 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -50 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
            >
              <CouponRewardPopup
                reward={currentReward}
                onClose={handleRewardClose}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default MysteryBoxRealistic; 