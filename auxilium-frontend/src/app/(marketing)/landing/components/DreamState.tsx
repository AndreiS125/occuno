'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CheckCircleIcon, SparklesIcon, HeartIcon, SunIcon } from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function DreamState() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);
  const benefitsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Breathing animation for peaceful elements
      gsap.to('.peaceful-element', {
        scale: 1.05,
        duration: 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.5
      });

      // Floating particles
      gsap.to('.dream-particle', {
        y: -20,
        x: (i) => Math.sin(i) * 20,
        duration: 6 + Math.random() * 4,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.8
      });

      // Benefits reveal animation
      ScrollTrigger.create({
        trigger: benefitsRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.benefit-card', {
            y: 80,
            opacity: 0,
            duration: 1.2,
            ease: "power3.out",
            stagger: 0.2
          });
        }
      });

      // Smooth color transition
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        end: "bottom 20%",
        scrub: true,
        onUpdate: (self) => {
          const progress = self.progress;
          gsap.to('.dream-bg', {
            background: `linear-gradient(to bottom, 
              hsl(${220 + progress * 40}, 50%, ${10 + progress * 20}%), 
              hsl(${200 + progress * 60}, 60%, ${15 + progress * 25}%))`,
            duration: 0.3
          });
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const dreamBenefits = [
    {
      icon: SunIcon,
      title: "Wake Up Energized",
      description: "No more Sunday scaries. Every morning starts with clarity and purpose.",
      feeling: "Confident & Ready"
    },
    {
      icon: CheckCircleIcon,
      title: "Tasks That Make Sense",
      description: "Every item on your list actually moves you toward your goals.",
      feeling: "Focused & Aligned"
    },
    {
      icon: SparklesIcon,
      title: "Effortless Flow",
      description: "Switching between tasks feels natural, not jarring.",
      feeling: "Smooth & Efficient"
    },
    {
      icon: HeartIcon,
      title: "Peace of Mind",
      description: "Know that nothing important will slip through the cracks.",
      feeling: "Calm & Secure"
    }
  ];

  return (
    <div ref={sectionRef} className="relative py-32 dream-bg overflow-hidden">
      {/* Peaceful background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-blue-950/30 via-emerald-950/20 to-blue-950/30"></div>
      
      {/* Floating particles */}
      <div ref={particlesRef} className="absolute inset-0 pointer-events-none">
        {[...Array(12)].map((_, i) => (
          <div
            key={i}
            className={`dream-particle absolute w-2 h-2 bg-gradient-to-br ${
              i % 3 === 0 ? 'from-blue-400 to-cyan-400' :
              i % 3 === 1 ? 'from-emerald-400 to-teal-400' :
              'from-purple-400 to-blue-400'
            } rounded-full opacity-60`}
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
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-6 py-2 mb-8 peaceful-element">
            <SparklesIcon className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300 font-semibold">Your Ideal Productivity Life</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white via-blue-100 to-emerald-200 bg-clip-text text-transparent">
            What If Planning Was
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Effortless?
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Imagine having a mind-reader that plans your perfect day. Every task in harmony, every goal within reach, every moment optimized for your success.
          </p>
        </div>

        {/* Dream scenario */}
        <div className="mb-20 p-12 bg-gradient-to-br from-blue-500/10 via-emerald-500/5 to-purple-500/10 border border-white/10 rounded-3xl backdrop-blur-sm peaceful-element">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-4">Picture This Monday Morning</h3>
          </div>
          
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-emerald-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">7</span>
                </div>
                <div>
                  <p className="text-white font-semibold">You wake up refreshed</p>
                  <p className="text-gray-400 text-sm">No anxiety, no dread - just clarity</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">8</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Your perfect day is already planned</p>
                  <p className="text-gray-400 text-sm">AI understood your priorities while you slept</p>
                </div>
              </div>
              
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center flex-shrink-0 mt-1">
                  <span className="text-white font-bold text-sm">9</span>
                </div>
                <div>
                  <p className="text-white font-semibold">Each task flows naturally</p>
                  <p className="text-gray-400 text-sm">No context switching, no decision fatigue</p>
                </div>
              </div>
            </div>
            
            <div className="bg-gradient-to-br from-white/5 to-transparent border border-white/10 rounded-2xl p-8 peaceful-element">
              <div className="text-center mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-emerald-400 to-blue-400 rounded-full mx-auto mb-4 flex items-center justify-center">
                  <SparklesIcon className="w-8 h-8 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white">Your AI Assistant</h4>
              </div>
              
              <div className="space-y-3 text-sm">
                <div className="bg-emerald-500/20 rounded-lg p-3">
                  <p className="text-emerald-200">"Based on your energy patterns, I've scheduled deep work for 9-11 AM"</p>
                </div>
                <div className="bg-blue-500/20 rounded-lg p-3">
                  <p className="text-blue-200">"I've researched those market trends you mentioned"</p>
                </div>
                <div className="bg-purple-500/20 rounded-lg p-3">
                  <p className="text-purple-200">"Here's a better approach to that project breakdown"</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Benefits grid */}
        <div ref={benefitsRef} className="grid md:grid-cols-2 gap-8 mb-16">
          {dreamBenefits.map((benefit, index) => (
            <div key={index} className="benefit-card group">
              <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:from-white/15 hover:to-white/10 transition-all duration-500 peaceful-element">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-400 to-blue-400 rounded-xl flex items-center justify-center flex-shrink-0">
                    <benefit.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">{benefit.title}</h4>
                    <p className="text-gray-300 mb-4 leading-relaxed">{benefit.description}</p>
                    <div className="inline-flex items-center bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2">
                      <span className="text-emerald-300 text-sm font-semibold">{benefit.feeling}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Transition to solution */}
        <div className="text-center p-12 bg-gradient-to-br from-blue-900/30 via-transparent to-emerald-900/30 border border-white/10 rounded-3xl backdrop-blur-sm peaceful-element">
          <h3 className="text-3xl font-bold text-white mb-6">This Isn't Just a Dream</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            This is exactly how thousands of professionals now start their days. The difference? They stopped fighting chaos and started partnering with AI.
          </p>
          
          <div className="inline-flex items-center gap-2 text-emerald-300 font-semibold">
            <SparklesIcon className="w-5 h-5" />
            <span>Your breakthrough is just one decision away</span>
          </div>
        </div>
      </div>
    </div>
  );
} 