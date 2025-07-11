"use client";

import React, { useState, useEffect } from 'react';
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
        {isExploding && (
          <div className="absolute inset-0 pointer-events-none">
            {/* Central Energy Burst */}
            <motion.div
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '50%',
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(34,197,194,0.9) 30%, rgba(139,92,246,0.7) 60%, transparent 100%)'
              }}
              initial={{ width: 0, height: 0, opacity: 0 }}
              animate={{
                width: [0, 300, 400, 0],
                height: [0, 300, 400, 0],
                opacity: [0, 1, 0.8, 0]
              }}
              transition={{
                duration: 1.2,
                ease: "easeOut"
              }}
            />

            {/* Explosion Particles - Large Glowing Orbs */}
            {[...Array(35)].map((_, i) => {
              const angle = (i * 10.3) * (Math.PI / 180);
              const distance = 120 + Math.random() * 80;
              const size = 4 + Math.random() * 6;
              const color = ['rgba(34,197,194,0.9)', 'rgba(139,92,246,0.9)', 'rgba(236,72,153,0.9)'][i % 3];
              
              return (
                <motion.div
                  key={`orb-${i}`}
                  className="absolute rounded-full"
                  style={{
                    width: size,
                    height: size,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    background: color,
                    boxShadow: `0 0 ${size * 4}px ${color}`
                  }}
                  initial={{ 
                    scale: 0, 
                    x: 0, 
                    y: 0, 
                    opacity: 1 
                  }}
                  animate={{
                    scale: [0, 1.2, 0.8, 0],
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: [1, 1, 0.7, 0],
                    rotate: [0, 720]
                  }}
                  transition={{
                    duration: 1.5,
                    delay: Math.random() * 0.3,
                    ease: "easeOut"
                  }}
                />
              );
            })}

            {/* Sparkle Burst - Smaller Particles */}
            {[...Array(60)].map((_, i) => {
              const angle = Math.random() * 360 * (Math.PI / 180);
              const distance = 80 + Math.random() * 140;
              const size = 1 + Math.random() * 3;
              
              return (
                <motion.div
                  key={`sparkle-${i}`}
                  className="absolute rounded-full bg-white"
                  style={{
                    width: size,
                    height: size,
                    left: '50%',
                    top: '50%',
                    transform: 'translate(-50%, -50%)',
                    boxShadow: `0 0 ${size * 6}px rgba(255,255,255,0.9)`
                  }}
                  initial={{ 
                    scale: 0, 
                    x: 0, 
                    y: 0, 
                    opacity: 1 
                  }}
                  animate={{
                    scale: [0, 1, 0],
                    x: Math.cos(angle) * distance,
                    y: Math.sin(angle) * distance,
                    opacity: [1, 1, 0]
                  }}
                  transition={{
                    duration: 1.8,
                    delay: 0.2 + Math.random() * 0.4,
                    ease: "easeOut"
                  }}
                />
              );
            })}

            {/* Energy Shockwave Rings */}
            {[...Array(4)].map((_, i) => (
              <motion.div
                key={`shockwave-${i}`}
                className="absolute rounded-full border-4"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: 'translate(-50%, -50%)',
                  borderColor: i % 2 === 0 ? 'rgba(34,197,194,0.7)' : 'rgba(139,92,246,0.7)'
                }}
                initial={{ 
                  width: 0, 
                  height: 0, 
                  opacity: 0.9,
                  borderWidth: 8
                }}
                animate={{
                  width: [0, 400],
                  height: [0, 400],
                  opacity: [0.9, 0.4, 0],
                  borderWidth: [8, 2, 0]
                }}
                transition={{
                  duration: 1.2,
                  delay: i * 0.15,
                  ease: "easeOut"
                }}
              />
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
};

// Enhanced Reward Popup
const RewardPopup: React.FC<{
  reward: { type: string; value: number; description: string };
  onClose: () => void;
}> = ({ reward, onClose }) => {
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
        className="relative bg-gradient-to-br from-cyan-500 via-purple-600 to-pink-600 p-12 rounded-3xl shadow-2xl text-center max-w-lg mx-4"
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
          ✨
        </motion.div>
        
        <motion.h2 
          className="text-4xl font-bold text-white mb-8"
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          🎉 Epic Reward! 🎉
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
            +{reward.value} XP
          </motion.div>
          <div className="text-xl text-cyan-100">{reward.description}</div>
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
          Magnificent! ⚡
        </motion.button>
      </motion.div>
    </motion.div>
  );
};

// Main Component
const MysteryBoxRealistic: React.FC<MysteryBoxRealisticProps> = ({
  onOpen,
  onClose,
  isOpen,
  reward
}) => {
  const [showReward, setShowReward] = useState(false);
  const [currentReward, setCurrentReward] = useState<any>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Reset states when modal is opened
  useEffect(() => {
    if (isOpen) {
      setShowReward(false);
      setCurrentReward(null);
      setIsProcessing(false);
    }
  }, [isOpen]);

  const handleSphereOpen = async () => {
    if (isProcessing) return;
    
    setIsProcessing(true);
    
    try {
      const result = await onOpen();
      console.log('🎁 Mystery box result:', result);
      
      // Handle different possible backend response formats
      let rewardValue = 50;
      let rewardDescription = 'Epic mystery reward unlocked!';
      
      if (result && typeof result === 'object') {
        // Backend primarily returns points_awarded, so prioritize that
        rewardValue = result.points_awarded || 
                     result.reward_value || 
                     result.reward?.points_awarded || 
                     result.gamification?.points_awarded ||
                     50; // Fallback if none found
                     
        rewardDescription = result.reward_description || 
                           result.celebration || // Backend also provides celebration field
                           result.reward?.description ||
                           result.gamification?.reward_description ||
                           result.description ||
                           'Magnificent mystery sphere reward!';
      } else if (reward) {
        rewardValue = reward.value;
        rewardDescription = reward.description;
      }
      
      console.log('🎯 Parsed reward:', { value: rewardValue, description: rewardDescription });
      
      setCurrentReward({
        type: 'XP',
        value: rewardValue,
        description: rewardDescription
      });
      
      // Show reward popup after a brief delay
      setTimeout(() => {
        setShowReward(true);
        setIsProcessing(false);
      }, 1000);
      
    } catch (error) {
      console.error('Error opening mystery box:', error);
      setIsProcessing(false);
      onClose?.();
    }
  };

  const handleRewardClose = () => {
    setShowReward(false);
    setCurrentReward(null);
    setIsProcessing(false);
    onClose?.();
  };

  const handleExplosionStart = () => {
    // Visual feedback that explosion has started
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Main Modal */}
      <AnimatePresence>
        {!showReward && (
          <motion.div 
            className="fixed inset-0 z-40 flex items-center justify-center bg-black/70 backdrop-blur-md"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 p-12 rounded-3xl shadow-2xl border-2 border-cyan-500/30 backdrop-blur-xl"
              initial={{ scale: 0.5, opacity: 0, y: 50 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.8, opacity: 0, y: -30 }}
              transition={{
                type: "spring",
                stiffness: 300,
                damping: 25
              }}
            >
              <MysticSphere 
                onOpen={handleSphereOpen} 
                isOpen={isOpen} 
                onExplode={handleExplosionStart}
              />
              
              <div className="text-center text-white mt-8">
                <motion.h2 
                  className="text-3xl font-bold mb-4 bg-gradient-to-r from-cyan-400 to-purple-400 bg-clip-text text-transparent"
                  animate={{
                    backgroundPosition: ['0% 50%', '100% 50%', '0% 50%']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: "linear"
                  }}
                >
                  Mystery Sphere
                </motion.h2>
                <p className="text-lg opacity-75">Touch the sphere to unleash your epic reward!</p>
                {isProcessing && (
                  <motion.p 
                    className="text-cyan-400 mt-4 text-sm"
                    animate={{ opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    Processing your reward...
                  </motion.p>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* Reward Popup */}
      <AnimatePresence>
        {showReward && currentReward && (
          <RewardPopup reward={currentReward} onClose={handleRewardClose} />
        )}
      </AnimatePresence>
    </>
  );
};

export default MysteryBoxRealistic; 