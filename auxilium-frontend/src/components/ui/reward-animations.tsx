"use client";

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

interface RewardAnimationProps {
  isVisible: boolean;
  tier: 'basic' | 'streak' | 'milestone' | 'jackpot' | 'legendary';
  points: number;
  bonusMultiplier?: number;
  levelUp?: boolean;
  priority?: number;
  onComplete: () => void;
}

const TIER_COLORS = {
  basic: '#3B82F6',
  streak: '#F97316', 
  milestone: '#EAB308',
  jackpot: '#8B5CF6',
  legendary: '#EC4899'
};

const RewardAnimation: React.FC<RewardAnimationProps> = ({
  isVisible,
  tier,
  points,
  bonusMultiplier = 1,
  levelUp = false,
  onComplete
}) => {
  const particleContainerRef = useRef<HTMLDivElement>(null);
  
  const finalPoints = Math.round(points * bonusMultiplier);
  const color = TIER_COLORS[tier];

  useGSAP(() => {
    if (!isVisible) return;

    // Create floating particles around the trigger point
    const createParticles = () => {
      if (!particleContainerRef.current) return;

      const container = particleContainerRef.current;
      const particleCount = tier === 'legendary' ? 20 : tier === 'jackpot' ? 15 : 10;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'reward-particle';
        
        // Random position around screen center
        const x = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
        const y = window.innerHeight / 2 + (Math.random() - 0.5) * 200;
        
        particle.style.cssText = `
          position: fixed;
          width: ${4 + Math.random() * 8}px;
          height: ${4 + Math.random() * 8}px;
          background: ${color};
          border-radius: 50%;
          pointer-events: none;
          z-index: 9999;
          left: ${x}px;
          top: ${y}px;
          box-shadow: 0 0 ${10 + Math.random() * 20}px ${color};
          filter: blur(${Math.random() * 2}px);
        `;
        
        container.appendChild(particle);
        
        // Animate particle
        gsap.fromTo(particle, {
          scale: 0,
          rotation: 0,
          opacity: 1
        }, {
          scale: 1.5,
          rotation: 360 * (Math.random() > 0.5 ? 1 : -1),
          y: -100 - Math.random() * 200,
          x: (Math.random() - 0.5) * 300,
          opacity: 0,
          duration: 1 + Math.random() * 2,
          ease: "power2.out",
          onComplete: () => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          }
        });
      }
    };

    // Find progress bars and enhance them
    const enhanceProgressBars = () => {
      const progressBars = document.querySelectorAll('.progress-bar, [class*="progress"], [class*="bg-primary"]');
      
      progressBars.forEach((bar: Element) => {
        const element = bar as HTMLElement;
        
        // Add 3D glow effect
        gsap.to(element, {
          boxShadow: `0 0 20px ${color}, 0 0 40px ${color}40, 0 0 60px ${color}20`,
          filter: `brightness(1.3) saturate(1.2)`,
          duration: 0.3,
          ease: "power2.out"
        });
        
        // 3D transform effect
        gsap.to(element, {
          rotationX: 5,
          rotationY: 2,
          scale: 1.05,
          duration: 0.4,
          ease: "back.out(1.7)",
          transformStyle: "preserve-3d",
          transformOrigin: "center"
        });
        
        // Reset after animation
        gsap.to(element, {
          boxShadow: "none",
          filter: "none",
          rotationX: 0,
          rotationY: 0,
          scale: 1,
          duration: 0.5,
          delay: 1.5,
          ease: "power2.inOut"
        });
      });
    };

    // Screen flash effect
    const createScreenFlash = () => {
      const flash = document.createElement('div');
      flash.style.cssText = `
        position: fixed;
        top: 0;
        left: 0;
        width: 100vw;
        height: 100vh;
        background: radial-gradient(circle, ${color}20 0%, transparent 70%);
        pointer-events: none;
        z-index: 9998;
      `;
      
      document.body.appendChild(flash);
      
      gsap.fromTo(flash, {
        opacity: 0
      }, {
        opacity: 1,
        duration: 0.1,
        ease: "power2.out",
        yoyo: true,
        repeat: 1,
        onComplete: () => {
          document.body.removeChild(flash);
        }
      });
    };

    // Floating XP text
    const createFloatingText = () => {
      const text = document.createElement('div');
      text.innerHTML = `+${finalPoints} XP`;
      text.style.cssText = `
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        font-size: 2rem;
        font-weight: bold;
        color: ${color};
        text-shadow: 0 0 20px ${color};
        pointer-events: none;
        z-index: 9999;
        font-family: system-ui, -apple-system, sans-serif;
      `;
      
      document.body.appendChild(text);
      
      gsap.fromTo(text, {
        scale: 0.5,
        opacity: 0,
        y: 0
      }, {
        scale: 1.2,
        opacity: 1,
        y: -80,
        duration: 0.8,
        ease: "back.out(1.7)",
        onComplete: () => {
          gsap.to(text, {
            opacity: 0,
            scale: 0.8,
            duration: 0.4,
            onComplete: () => {
              if (text.parentNode) {
                document.body.removeChild(text);
              }
            }
          });
        }
      });
    };

    // Main animation sequence
    const tl = gsap.timeline({
      onComplete: () => {
        setTimeout(onComplete, 200);
      }
    });

    // 1. Screen flash
    tl.call(createScreenFlash);
    
    // 2. Enhance progress bars
    tl.call(enhanceProgressBars, [], 0.1);
    
    // 3. Create particles
    tl.call(createParticles, [], 0.2);
    
    // 4. Floating text
    tl.call(createFloatingText, [], 0.3);

    // 5. Level up bonus effect
    if (levelUp) {
      tl.call(() => {
        const levelText = document.createElement('div');
        levelText.innerHTML = '🎉 LEVEL UP! 🎉';
        levelText.style.cssText = `
          position: fixed;
          left: 50%;
          top: 60%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
          font-weight: bold;
          color: #4ade80;
          text-shadow: 0 0 15px #4ade80;
          pointer-events: none;
          z-index: 9999;
          font-family: system-ui, -apple-system, sans-serif;
        `;
        
        document.body.appendChild(levelText);
        
        gsap.fromTo(levelText, {
          scale: 0,
          opacity: 0
        }, {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: "elastic.out(1, 0.3)",
          onComplete: () => {
            gsap.to(levelText, {
              opacity: 0,
              y: -50,
              duration: 0.8,
              delay: 1,
              onComplete: () => {
                if (levelText.parentNode) {
                  document.body.removeChild(levelText);
                }
              }
            });
          }
        });
      }, [], 0.8);
    }

  }, { dependencies: [isVisible] });

  return (
    <div ref={particleContainerRef} style={{ pointerEvents: 'none' }} />
  );
};

export default RewardAnimation; 