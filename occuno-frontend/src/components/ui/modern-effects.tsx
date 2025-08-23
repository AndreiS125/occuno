"use client";

import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { motion } from "framer-motion";

// Floating particles component
export function FloatingParticles() {
  const containerRef = useRef<HTMLDivElement>(null);

  useGSAP(() => {
    if (!containerRef.current) return;

    // Create floating particles
    const particles = Array.from({ length: 20 }, (_, i) => {
      const particle = document.createElement('div');
      particle.className = 'absolute w-1 h-1 bg-primary/20 rounded-full';
      particle.style.left = `${Math.random() * 100}%`;
      particle.style.top = `${Math.random() * 100}%`;
      containerRef.current?.appendChild(particle);
      
      // Animate each particle
      gsap.to(particle, {
        x: `+=${Math.random() * 200 - 100}`,
        y: `+=${Math.random() * 200 - 100}`,
        opacity: Math.random() * 0.8 + 0.2,
        duration: Math.random() * 10 + 5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        delay: Math.random() * 2
      });

      return particle;
    });

    return () => {
      particles.forEach(particle => particle.remove());
    };
  }, []);

  return (
    <div 
      ref={containerRef}
      className="fixed inset-0 pointer-events-none overflow-hidden z-0"
    />
  );
}

// Cursor glow effect
export function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const glow = glowRef.current;
    if (!glow) return;

    const handleMouseMove = (e: MouseEvent) => {
      gsap.to(glow, {
        x: e.clientX - 100,
        y: e.clientY - 100,
        duration: 0.3,
        ease: "power2.out"
      });
    };

    const handleMouseEnter = () => {
      gsap.to(glow, {
        opacity: 0.6,
        scale: 1,
        duration: 0.3
      });
    };

    const handleMouseLeave = () => {
      gsap.to(glow, {
        opacity: 0,
        scale: 0.5,
        duration: 0.3
      });
    };

    window.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseenter', handleMouseEnter);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseenter', handleMouseEnter);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, []);

  return (
    <div
      ref={glowRef}
      className="fixed w-48 h-48 pointer-events-none z-50 opacity-0"
      style={{
        background: 'radial-gradient(circle, rgba(34, 197, 194, 0.15) 0%, transparent 70%)',
        filter: 'blur(20px)',
        mixBlendMode: 'screen'
      }}
    />
  );
}

// Loading shimmer effect
export function LoadingShimmer({ className = "" }: { className?: string }) {
  return (
    <div className={`loading-shimmer rounded-md ${className}`}>
      <div className="h-full w-full bg-gradient-to-r from-muted via-primary/10 to-muted animate-shimmer" />
    </div>
  );
}

// Animated border component
export function AnimatedBorder({ 
  children, 
  className = "",
  speed = 3 
}: { 
  children: React.ReactNode;
  className?: string;
  speed?: number;
}) {
  return (
    <div className={`relative ${className}`}>
      <div 
        className="absolute inset-0 rounded-2xl"
        style={{
          background: `linear-gradient(45deg, 
            hsl(var(--primary)), 
            hsl(var(--secondary)), 
            hsl(var(--accent)), 
            hsl(var(--primary))
          )`,
          backgroundSize: '400% 400%',
          animation: `gradientShift ${speed}s ease infinite`,
          padding: '2px',
          mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
          maskComposite: 'subtract'
        }}
      />
      <div className="relative bg-card rounded-2xl">
        {children}
      </div>
    </div>
  );
}

// Pulsing dot indicator
export function PulsingDot({ 
  color = "primary",
  size = "sm"
}: { 
  color?: string;
  size?: "sm" | "md" | "lg";
}) {
  const sizeClasses = {
    sm: "w-2 h-2",
    md: "w-3 h-3", 
    lg: "w-4 h-4"
  };

  return (
    <div className="relative">
      <div className={`${sizeClasses[size]} bg-${color} rounded-full animate-pulse-glow`} />
      <div className={`absolute inset-0 ${sizeClasses[size]} bg-${color} rounded-full animate-ping opacity-75`} />
    </div>
  );
}

// Typing effect component
export function TypingEffect({ 
  text, 
  speed = 100,
  className = ""
}: { 
  text: string;
  speed?: number;
  className?: string;
}) {
  const [displayText, setDisplayText] = useState("");
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    if (currentIndex < text.length) {
      const timeout = setTimeout(() => {
        setDisplayText(prev => prev + text[currentIndex]);
        setCurrentIndex(prev => prev + 1);
      }, speed);

      return () => clearTimeout(timeout);
    }
  }, [currentIndex, text, speed]);

  return (
    <span className={className}>
      {displayText}
      <span className="animate-pulse">|</span>
    </span>
  );
}

// Glitch effect component
export function GlitchText({ 
  children, 
  className = "",
  trigger = "hover"
}: { 
  children: React.ReactNode;
  className?: string;
  trigger?: "hover" | "always";
}) {
  const textRef = useRef<HTMLSpanElement>(null);

  useGSAP(() => {
    if (!textRef.current) return;

    const element = textRef.current;
    
    const glitchEffect = () => {
      const tl = gsap.timeline();
      
      tl.to(element, {
        skewX: 70,
        duration: 0.1,
        ease: "power2.inOut"
      })
      .to(element, {
        skewX: 0,
        scaleX: 1.1,
        duration: 0.1,
        ease: "power2.inOut"
      })
      .to(element, {
        scaleX: 1,
        duration: 0.1,
        ease: "power2.inOut"
      });
    };

    if (trigger === "always") {
      const interval = setInterval(glitchEffect, 3000);
      return () => clearInterval(interval);
    } else {
      const handleMouseEnter = () => glitchEffect();
      element.addEventListener('mouseenter', handleMouseEnter);
      return () => element.removeEventListener('mouseenter', handleMouseEnter);
    }
  }, [trigger]);

  return (
    <span ref={textRef} className={`inline-block ${className}`}>
      {children}
    </span>
  );
}

// Matrix rain effect (subtle)
export function MatrixRain() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const characters = "01";
    const fontSize = 14;
    const columns = canvas.width / fontSize;
    const drops: number[] = Array(Math.floor(columns)).fill(1);

    const draw = () => {
      ctx.fillStyle = 'rgba(20, 25, 40, 0.05)';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      ctx.fillStyle = 'rgba(34, 197, 194, 0.1)';
      ctx.font = `${fontSize}px monospace`;

      for (let i = 0; i < drops.length; i++) {
        const text = characters[Math.floor(Math.random() * characters.length)];
        ctx.fillText(text, i * fontSize, drops[i] * fontSize);

        if (drops[i] * fontSize > canvas.height && Math.random() > 0.975) {
          drops[i] = 0;
        }
        drops[i]++;
      }
    };

    const interval = setInterval(draw, 100);

    const handleResize = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    window.addEventListener('resize', handleResize);

    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleResize);
    };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none z-0 opacity-30"
    />
  );
}

import { useState } from "react"; 