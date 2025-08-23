"use client";

import React, { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { useGSAP } from '@gsap/react';

interface CouponRewardAnimationProps {
  isVisible: boolean;
  tier: 'basic' | 'streak' | 'milestone' | 'jackpot' | 'legendary';
  coupons: string[];
  bonusMultiplier?: number;
  achievementUnlocked?: boolean;
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

const COUPON_EMOJIS = {
  'jerk off': '🍆',
  'instagram': '📱',
  'gaming': '🎮',
  'youtube': '📺',
  'nap': '😴',
  'snack': '🍿',
  'netflix': '📺',
  'reddit': '🔍',
  'music': '🎵',
  'chat': '💬',
  'scroll': '📱',
  'browse': '🔍',
  'watch': '📺',
  'play': '🎮',
  'listen': '🎵',
  'eat': '🍿',
  'take': '😴'
};

const CouponRewardAnimation: React.FC<CouponRewardAnimationProps> = ({
  isVisible,
  tier,
  coupons,
  bonusMultiplier = 1,
  achievementUnlocked = false,
  onComplete
}) => {
  const particleContainerRef = useRef<HTMLDivElement>(null);
  
  const color = TIER_COLORS[tier];
  const couponCount = coupons.length;

  const getCouponEmoji = (couponName: string) => {
    const lowerName = couponName.toLowerCase();
    for (const [key, emoji] of Object.entries(COUPON_EMOJIS)) {
      if (lowerName.includes(key)) {
        return emoji;
      }
    }
    return '🎫'; // Default coupon emoji
  };

  useGSAP(() => {
    if (!isVisible) return;

    // Create floating coupon particles
    const createCouponParticles = () => {
      if (!particleContainerRef.current) return;

      const container = particleContainerRef.current;
      const particleCount = tier === 'legendary' ? 25 : tier === 'jackpot' ? 20 : 15;
      
      for (let i = 0; i < particleCount; i++) {
        const particle = document.createElement('div');
        particle.className = 'coupon-particle';
        
        // Random coupon emoji
        const emoji = i < coupons.length ? getCouponEmoji(coupons[i]) : '🎫';
        particle.innerHTML = emoji;
        
        // Random position around screen center
        const x = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
        const y = window.innerHeight / 2 + (Math.random() - 0.5) * 200;
        
        particle.style.cssText = `
          position: fixed;
          font-size: ${16 + Math.random() * 12}px;
          pointer-events: none;
          z-index: 9999;
          left: ${x}px;
          top: ${y}px;
          text-shadow: 0 0 10px ${color};
          filter: drop-shadow(0 0 5px ${color});
        `;
        
        container.appendChild(particle);
        
        // Animate particle
        gsap.fromTo(particle, {
          scale: 0,
          rotation: 0,
          opacity: 1
        }, {
          scale: 1.2,
          rotation: 360 * (Math.random() > 0.5 ? 1 : -1),
          y: -100 - Math.random() * 200,
          x: (Math.random() - 0.5) * 300,
          opacity: 0,
          duration: 1.5 + Math.random() * 2,
          ease: "power2.out",
          onComplete: () => {
            if (particle.parentNode) {
              particle.parentNode.removeChild(particle);
            }
          }
        });
      }
    };

    // Enhance progress bars for coupon system
    const enhanceProgressBars = () => {
      const progressBars = document.querySelectorAll('.progress-bar, [class*="progress"], [class*="bg-primary"], [class*="bg-purple"]');
      
      progressBars.forEach((bar: Element) => {
        const element = bar as HTMLElement;
        
        // Add coupon-themed glow effect
        gsap.to(element, {
          boxShadow: `0 0 20px ${color}, 0 0 40px ${color}40, 0 0 60px ${color}20`,
          filter: `brightness(1.3) saturate(1.2) hue-rotate(${tier === 'legendary' ? '45deg' : '0deg'})`,
          duration: 0.3,
          ease: "power2.out"
        });
        
        // Coupon-themed transform effect
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

    // Floating coupon text
    const createFloatingCouponText = () => {
      const text = document.createElement('div');
      const primaryCoupon = coupons[0] || 'Coupon';
      const couponEmoji = getCouponEmoji(primaryCoupon);
      
      text.innerHTML = couponCount > 1 
        ? `🎫 ${couponCount} Coupons Earned!`
        : `${couponEmoji} ${primaryCoupon.replace(/^\w/, c => c.toUpperCase())}`;
      
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
        background: linear-gradient(135deg, ${color}20, transparent);
        padding: 1rem 2rem;
        border-radius: 1rem;
        backdrop-filter: blur(10px);
        border: 2px solid ${color}40;
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

    // Coupon list animation
    const createCouponList = () => {
      if (coupons.length <= 1) return;
      
      const listContainer = document.createElement('div');
      listContainer.style.cssText = `
        position: fixed;
        left: 50%;
        top: 65%;
        transform: translate(-50%, -50%);
        pointer-events: none;
        z-index: 9999;
        display: flex;
        flex-direction: column;
        gap: 0.5rem;
      `;
      
      coupons.forEach((coupon, index) => {
        const couponItem = document.createElement('div');
        const emoji = getCouponEmoji(coupon);
        couponItem.innerHTML = `${emoji} ${coupon.replace(/^\w/, c => c.toUpperCase())}`;
        couponItem.style.cssText = `
          font-size: 1rem;
          font-weight: 600;
          color: white;
          background: ${color}60;
          padding: 0.5rem 1rem;
          border-radius: 0.5rem;
          backdrop-filter: blur(5px);
          border: 1px solid ${color}80;
          text-shadow: 0 0 10px ${color};
          opacity: 0;
          transform: translateX(${index % 2 === 0 ? '-100px' : '100px'});
        `;
        
        listContainer.appendChild(couponItem);
        
        // Animate each coupon item
        gsap.to(couponItem, {
          opacity: 1,
          x: 0,
          duration: 0.5,
          delay: 0.5 + index * 0.1,
          ease: "back.out(1.7)",
          onComplete: () => {
            gsap.to(couponItem, {
              opacity: 0,
              x: index % 2 === 0 ? '-50px' : '50px',
              duration: 0.3,
              delay: 1.5,
            });
          }
        });
      });
      
      document.body.appendChild(listContainer);
      
      // Clean up container
      setTimeout(() => {
        if (listContainer.parentNode) {
          document.body.removeChild(listContainer);
        }
      }, 3000);
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
    
    // 3. Create coupon particles
    tl.call(createCouponParticles, [], 0.2);
    
    // 4. Floating coupon text
    tl.call(createFloatingCouponText, [], 0.3);

    // 5. Coupon list animation
    tl.call(createCouponList, [], 0.6);

    // 6. Achievement bonus effect
    if (achievementUnlocked) {
      tl.call(() => {
        const achievementText = document.createElement('div');
        achievementText.innerHTML = '🏆 ACHIEVEMENT UNLOCKED! 🏆';
        achievementText.style.cssText = `
          position: fixed;
          left: 50%;
          top: 75%;
          transform: translate(-50%, -50%);
          font-size: 1.5rem;
          font-weight: bold;
          color: #4ade80;
          text-shadow: 0 0 15px #4ade80;
          pointer-events: none;
          z-index: 9999;
          font-family: system-ui, -apple-system, sans-serif;
          background: linear-gradient(135deg, #4ade8020, transparent);
          padding: 1rem 2rem;
          border-radius: 1rem;
          backdrop-filter: blur(10px);
          border: 2px solid #4ade8040;
        `;
        
        document.body.appendChild(achievementText);
        
        gsap.fromTo(achievementText, {
          scale: 0,
          opacity: 0
        }, {
          scale: 1,
          opacity: 1,
          duration: 0.6,
          ease: "elastic.out(1, 0.3)",
          onComplete: () => {
            gsap.to(achievementText, {
              opacity: 0,
              y: -50,
              duration: 0.8,
              delay: 1,
              onComplete: () => {
                if (achievementText.parentNode) {
                  document.body.removeChild(achievementText);
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

export default CouponRewardAnimation; 