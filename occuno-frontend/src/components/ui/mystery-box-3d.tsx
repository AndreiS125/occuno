"use client";

import React, { useState, useRef, useEffect } from 'react';
import { gsap } from 'gsap';
import { Sparkles, Gift, Star, Crown, Zap } from 'lucide-react';

interface MysteryBox3DProps {
  isVisible: boolean;
  onOpen: () => Promise<any>;
  onClose: () => void;
}

const MysteryBox3D: React.FC<MysteryBox3DProps> = ({ isVisible, onOpen, onClose }) => {
  const [isOpening, setIsOpening] = useState(false);
  const [isOpened, setIsOpened] = useState(false);
  const [reward, setReward] = useState<any>(null);
  
  const overlayRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const boxRef = useRef<HTMLDivElement>(null);
  const rewardRef = useRef<HTMLDivElement>(null);
  const instructionRef = useRef<HTMLDivElement>(null);
  const sparklesContainerRef = useRef<HTMLDivElement>(null);

  // Entry/exit animations
  useEffect(() => {
    if (!overlayRef.current || !containerRef.current) return;

    if (isVisible) {
      // Entry animations
      gsap.set(overlayRef.current, { opacity: 0 });
      gsap.set(containerRef.current, { y: -200, scale: 0.5, rotationY: 0 });
      
      gsap.to(overlayRef.current, {
        opacity: 1,
        duration: 0.3,
        ease: "power2.out"
      });
      
      gsap.to(containerRef.current, {
        y: 0,
        scale: 1,
        rotationY: 360,
        duration: 1.2,
        ease: "back.out(1.7)",
        delay: 0.1
      });

      // Start sparkles animation
      if (sparklesContainerRef.current && !isOpened) {
        const sparkles = sparklesContainerRef.current.children;
        Array.from(sparkles).forEach((sparkle, i) => {
          const tl = gsap.timeline({ repeat: -1, delay: i * 0.3 });
          tl.set(sparkle, { y: -5, opacity: 0.4, scale: 0.8 })
            .to(sparkle, { y: 5, opacity: 1, scale: 1.2, duration: 1, ease: "power2.inOut" })
            .to(sparkle, { y: -5, opacity: 0.4, scale: 0.8, duration: 1, ease: "power2.inOut" });
        });
      }

      // Instruction animation
      if (instructionRef.current && !isOpening && !isOpened) {
        gsap.fromTo(instructionRef.current,
          { opacity: 0, y: 20 },
          { 
            opacity: 1, 
            y: 0, 
            duration: 0.5,
            delay: 1,
            ease: "power2.out"
          }
        );

        // Pointing hand animation
        const pointingHand = instructionRef.current.querySelector('.pointing-hand');
        if (pointingHand) {
          gsap.to(pointingHand, {
            y: -5,
            duration: 0.5,
            yoyo: true,
            repeat: -1,
            ease: "power2.inOut"
          });
        }
      }
    } else {
      // Exit animation
      gsap.to(overlayRef.current, {
        opacity: 0,
        duration: 0.3,
        ease: "power2.out"
      });
    }
  }, [isVisible, isOpening, isOpened]);

  const handleBoxClick = async () => {
    if (isOpening || isOpened) return;

    setIsOpening(true);

    try {
      // Open the box animation
      if (boxRef.current) {
        gsap.to(boxRef.current.querySelector('.box-lid'), {
          rotationX: -120,
          y: -50,
          duration: 0.8,
          ease: "back.out(1.7)",
          transformOrigin: "bottom center"
        });

        gsap.to(boxRef.current.querySelector('.box-base'), {
          scale: 1.1,
          duration: 0.3,
          ease: "power2.out"
        });
      }

      // Get reward from backend
      const result = await onOpen();
      setReward(result);
      setIsOpened(true);

      // Animate reward popping out
      setTimeout(() => {
        if (rewardRef.current) {
          gsap.fromTo(rewardRef.current, {
            scale: 0,
            y: 100,
            rotation: 0,
            opacity: 0
          }, {
            scale: 1,
            y: -150,
            rotation: 360,
            opacity: 1,
            duration: 1.2,
            ease: "elastic.out(1, 0.3)"
          });

          // Sparkle particles
          const createSparkles = () => {
            for (let i = 0; i < 15; i++) {
              const sparkle = document.createElement('div');
              sparkle.innerHTML = '✨';
              sparkle.style.cssText = `
                position: absolute;
                font-size: ${12 + Math.random() * 8}px;
                pointer-events: none;
                z-index: 10001;
                left: 50%;
                top: 50%;
                transform: translate(-50%, -50%);
              `;
              rewardRef.current?.appendChild(sparkle);

              gsap.to(sparkle, {
                x: (Math.random() - 0.5) * 400,
                y: -200 - Math.random() * 200,
                rotation: 360 * (Math.random() > 0.5 ? 1 : -1),
                opacity: 0,
                duration: 1 + Math.random(),
                ease: "power2.out",
                onComplete: () => sparkle.remove()
              });
            }
          };

          createSparkles();
        }
      }, 500);

      // Auto close after 3 seconds
      setTimeout(() => {
        handleClose();
      }, 3000);

    } catch (error) {
      console.error('Failed to open mystery box:', error);
      setIsOpening(false);
    }
  };

  const handleClose = () => {
    setIsOpening(false);
    setIsOpened(false);
    setReward(null);
    onClose();
  };

  const getRewardIcon = (type: string) => {
    switch (type) {
      case 'jackpot': return <Crown className="w-8 h-8 text-purple-400" />;
      case 'bonus_multiplier': return <Zap className="w-8 h-8 text-yellow-400" />;
      case 'rare': return <Star className="w-8 h-8 text-blue-400" />;
      default: return <Gift className="w-8 h-8 text-green-400" />;
    }
  };

  const getRewardColor = (type: string) => {
    switch (type) {
      case 'jackpot': return 'text-purple-400';
      case 'bonus_multiplier': return 'text-yellow-400'; 
      case 'rare': return 'text-blue-400';
      default: return 'text-green-400';
    }
  };

  if (!isVisible) return null;

  return (
    <div
      ref={overlayRef}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-10000 flex items-center justify-center overflow-visible"
      onClick={handleClose}
    >
      <div
        ref={containerRef}
        className="relative perspective-1000 overflow-visible"
        onClick={(e) => e.stopPropagation()}
      >
        {/* 3D Mystery Box */}
        <div
          ref={boxRef}
          className="relative w-32 h-32 cursor-pointer transform-gpu"
          style={{ 
            transformStyle: 'preserve-3d',
            perspective: '1000px'
          }}
          onClick={handleBoxClick}
        >
          {/* Box Base */}
          <div 
            className="box-base absolute inset-0 transform-gpu"
            style={{
              background: 'linear-gradient(135deg, #8B5CF6 0%, #A855F7 50%, #9333EA 100%)',
              borderRadius: '8px',
              boxShadow: `
                0 0 20px rgba(139, 92, 246, 0.5),
                inset 0 2px 4px rgba(255, 255, 255, 0.2),
                inset 0 -2px 4px rgba(0, 0, 0, 0.2)
              `,
              border: '2px solid rgba(255, 255, 255, 0.3)'
            }}
          >
            {/* Decorative ribbons */}
            <div className="absolute inset-x-0 top-1/2 h-4 bg-gradient-to-r from-yellow-400 to-yellow-500 transform -translate-y-2 shadow-lg" />
            <div className="absolute inset-y-0 left-1/2 w-4 bg-gradient-to-b from-yellow-400 to-yellow-500 transform -translate-x-2 shadow-lg" />
            
            {/* Center gem */}
            <div className="absolute top-1/2 left-1/2 w-6 h-6 bg-gradient-radial from-white to-yellow-300 rounded-full transform -translate-x-3 -translate-y-3 shadow-lg animate-pulse" />
          </div>

          {/* Box Lid */}
          <div 
            className="box-lid absolute inset-0 transform-gpu"
            style={{
              background: 'linear-gradient(135deg, #A855F7 0%, #C084FC 50%, #8B5CF6 100%)',
              borderRadius: '8px 8px 4px 4px',
              transformOrigin: 'bottom center',
              boxShadow: `
                0 -2px 8px rgba(0, 0, 0, 0.3),
                inset 0 2px 4px rgba(255, 255, 255, 0.3),
                0 0 15px rgba(139, 92, 246, 0.4)
              `,
              border: '2px solid rgba(255, 255, 255, 0.4)'
            }}
          >
            {/* Lid ribbons */}
            <div className="absolute inset-x-0 top-1/2 h-4 bg-gradient-to-r from-yellow-400 to-yellow-500 transform -translate-y-2 shadow-md" />
            <div className="absolute inset-y-0 left-1/2 w-4 bg-gradient-to-b from-yellow-400 to-yellow-500 transform -translate-x-2 shadow-md" />
            
            {/* Bow on top */}
            <div className="absolute -top-2 left-1/2 transform -translate-x-1/2">
              <div className="w-8 h-6 bg-gradient-to-r from-red-400 to-red-500 rounded-full shadow-lg" />
              <div className="absolute top-1 left-1/2 w-6 h-4 bg-gradient-to-r from-red-500 to-red-600 rounded-full transform -translate-x-1/2" />
            </div>
          </div>

          {/* Hover glow effect */}
          {!isOpening && !isOpened && (
            <div className="absolute inset-0 bg-gradient-radial from-purple-400/20 to-transparent rounded-lg animate-pulse pointer-events-none" />
          )}

          {/* Floating sparkles around box */}
          {!isOpened && (
            <div ref={sparklesContainerRef} className="absolute inset-0 pointer-events-none overflow-visible">
              {[...Array(6)].map((_, i) => (
                <div
                  key={i}
                  className="absolute text-yellow-300"
                  style={{
                    top: `${20 + Math.sin(i * 60) * 40}%`,
                    left: `${50 + Math.cos(i * 60) * 60}%`,
                  }}
                >
                  <Sparkles className="w-4 h-4" />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Reward popup */}
        {isOpened && reward && (
          <div
            ref={rewardRef}
            className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-visible"
          >
            <div className="flex flex-col items-center space-y-2">
              <div className={`p-4 rounded-full bg-gradient-radial from-white to-gray-100 shadow-2xl ${getRewardColor(reward.reward_type)}`}>
                {getRewardIcon(reward.reward_type)}
              </div>
              <div className="text-center bg-white/90 backdrop-blur-sm rounded-lg p-3 shadow-xl">
                <p className={`font-bold text-lg ${getRewardColor(reward.reward_type)}`}>
                  {reward.reward_type === 'jackpot' ? '🎰 JACKPOT!' : '🎁 Reward!'}
                </p>
                <p className="text-sm text-gray-700 font-medium">
                  {reward.reward_description}
                </p>
                {reward.points_awarded && (
                  <p className="text-xs text-purple-600 font-bold">
                    +{reward.points_awarded} points!
                  </p>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Instruction text */}
        {!isOpening && !isOpened && (
          <div
            ref={instructionRef}
            className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 text-center"
          >
            <p className="text-white text-sm font-medium">Click to open!</p>
            <div className="flex justify-center mt-1">
              <div className="pointing-hand text-white">
                👆
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MysteryBox3D; 