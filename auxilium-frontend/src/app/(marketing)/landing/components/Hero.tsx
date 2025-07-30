'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ChevronDownIcon, SparklesIcon } from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function Hero() {
  const heroRef = useRef<HTMLDivElement>(null);
  const cardsRef = useRef<HTMLDivElement>(null);
  const organizedRef = useRef<HTMLDivElement>(null);
  const titleRef = useRef<HTMLHeadingElement>(null);
  const subtitleRef = useRef<HTMLParagraphElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Chaotic cards animation
      const cards = cardsRef.current?.children;
      if (cards) {
        Array.from(cards).forEach((card, i) => {
          gsap.set(card, {
            x: Math.random() * 600 - 300,
            y: Math.random() * 400 - 200,
            rotation: Math.random() * 60 - 30,
            opacity: 0.8,
          });

          gsap.to(card, {
            x: Math.random() * 600 - 300,
            y: Math.random() * 400 - 200,
            rotation: Math.random() * 60 - 30,
            duration: 3 + Math.random() * 2,
            repeat: -1,
            yoyo: true,
            ease: "sine.inOut",
          });
        });

        // AI organization animation
        gsap.to(cards, {
          x: 0,
          y: (i) => i * 80 - 160,
          rotation: 0,
          opacity: 1,
          duration: 2,
          ease: "power3.out",
          delay: 3,
          stagger: 0.1,
        });
      }

      // Text animations
      gsap.fromTo(titleRef.current, 
        { y: 50, opacity: 0 },
        { y: 0, opacity: 1, duration: 1.2, ease: "power3.out", delay: 0.5 }
      );

      gsap.fromTo(subtitleRef.current,
        { y: 30, opacity: 0 },
        { y: 0, opacity: 1, duration: 1, ease: "power3.out", delay: 0.8 }
      );

      gsap.fromTo(ctaRef.current,
        { y: 20, opacity: 0 },
        { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 1.1 }
      );

      // Scroll indicator
      gsap.to(".scroll-indicator", {
        y: 10,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

    }, heroRef);

    return () => ctx.revert();
  }, []);

  const taskCards = [
    "Meeting prep",
    "Email inbox",
    "Project deadline",
    "Team standup",
    "Code review",
    "Documentation",
    "Bug fixes",
    "Research",
  ];

  return (
    <div ref={heroRef} className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-slate-900/50 to-slate-900"></div>
      
      {/* Chaotic task cards */}
      <div ref={cardsRef} className="absolute inset-0 flex items-center justify-center pointer-events-none">
        {taskCards.map((task, index) => (
          <div
            key={index}
            className="absolute bg-white/10 backdrop-blur-sm border border-white/20 rounded-lg px-4 py-2 text-sm text-white/80 shadow-lg"
          >
            {task}
          </div>
        ))}
      </div>

      {/* AI organization beam */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="w-1 h-96 bg-gradient-to-b from-transparent via-cyan-400/50 to-transparent blur-sm opacity-0 ai-beam"></div>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center max-w-5xl mx-auto px-6">
        <h1 
          ref={titleRef}
          className="text-6xl md:text-8xl font-bold mb-8 bg-gradient-to-b from-white via-blue-100 to-blue-300 bg-clip-text text-transparent leading-tight"
        >
          Stop Drowning in Your Own{' '}
          <span className="bg-gradient-to-r from-red-400 via-red-500 to-red-600 bg-clip-text text-transparent">
            To-Do Lists
          </span>
        </h1>
        
        <p 
          ref={subtitleRef}
          className="text-xl md:text-2xl text-blue-100/80 mb-12 max-w-3xl mx-auto leading-relaxed"
        >
          While you're stuck planning, others are achieving. Break free with AI that thinks faster than you procrastinate.
        </p>

        <div ref={ctaRef} className="flex flex-col sm:flex-row gap-6 justify-center items-center">
          <button className="group bg-gradient-to-r from-blue-600 via-blue-500 to-cyan-500 hover:from-blue-500 hover:via-blue-400 hover:to-cyan-400 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105 flex items-center gap-2">
            <SparklesIcon className="w-5 h-5" />
            Escape Planning Hell
            <div className="ml-2 group-hover:translate-x-1 transition-transform duration-300">→</div>
          </button>
          
          <button className="bg-white/10 backdrop-blur-sm border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105">
            Watch AI in Action
          </button>
        </div>

        {/* Pain point teaser */}
        <div className="mt-16 text-center">
          <p className="text-blue-200/60 text-sm mb-4">
            Join thousands who escaped the productivity trap
          </p>
          <div className="flex justify-center items-center gap-8 text-xs text-blue-300/40">
            <span>× Endless to-do lists</span>
            <span>× Decision paralysis</span>
            <span>× Sunday scaries</span>
            <span>× Context switching</span>
          </div>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-white/60 scroll-indicator">
        <div className="flex flex-col items-center">
          <span className="text-sm mb-2">Discover the solution</span>
          <ChevronDownIcon className="w-6 h-6" />
        </div>
      </div>

      {/* Floating elements */}
      <div className="absolute top-20 left-20 w-20 h-20 border border-white/10 rounded-full animate-pulse"></div>
      <div className="absolute top-40 right-32 w-16 h-16 border border-blue-400/20 rounded-full animate-pulse delay-1000"></div>
      <div className="absolute bottom-32 left-1/4 w-12 h-12 border border-purple-400/20 rounded-full animate-pulse delay-2000"></div>
    </div>
  );
} 