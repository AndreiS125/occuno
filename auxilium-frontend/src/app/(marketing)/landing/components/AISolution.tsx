'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { CpuChipIcon, LightBulbIcon, BoltIcon } from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function AISolution() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const neuralRef = useRef<SVGSVGElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Neural network animation
      gsap.to('.neural-connection', {
        strokeDashoffset: 0,
        duration: 2,
        ease: "power2.inOut",
        stagger: 0.2,
        repeat: -1,
        repeatDelay: 3
      });

      // AI thinking dots
      gsap.to('.thinking-dot', {
        scale: 1.5,
        opacity: 0.6,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2
      });

      // Features reveal
      ScrollTrigger.create({
        trigger: featuresRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.ai-feature', {
            y: 60,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.15
          });
        }
      });

      // Glowing AI elements
      gsap.to('.ai-glow', {
        boxShadow: '0 0 40px rgba(59, 130, 246, 0.6)',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Data flow animation
      gsap.to('.data-stream', {
        x: '100vw',
        duration: 8,
        repeat: -1,
        ease: "none",
        stagger: 2
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const aiCapabilities = [
    {
      icon: CpuChipIcon,
      title: "Contextual Intelligence",
      description: "Understands your goals, deadlines, and working patterns to make intelligent decisions",
      power: "Learns from every interaction"
    },
    {
      icon: LightBulbIcon,
      title: "Predictive Planning",
      description: "Anticipates bottlenecks and suggests optimal task sequences before problems arise",
      power: "Prevents issues before they happen"
    },
    {
      icon: BoltIcon,
      title: "Instant Adaptation",
      description: "Automatically adjusts your entire schedule when priorities change or interruptions occur",
      power: "Responds faster than you can think"
    },
    {
      icon: CpuChipIcon,
      title: "Research Integration",
      description: "Gathers context and insights from the internet to inform your planning decisions",
      power: "Knows what you need to know"
    }
  ];

  return (
    <div ref={sectionRef} className="relative py-32 bg-gradient-to-b from-slate-900 via-blue-950 to-slate-900 overflow-hidden">
      {/* AI Background Effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-20 left-20 w-64 h-64 bg-blue-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-20 right-20 w-64 h-64 bg-cyan-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      {/* Data streams */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {[...Array(6)].map((_, i) => (
          <div
            key={i}
            className="data-stream absolute w-2 h-2 bg-blue-400 rounded-full opacity-60"
            style={{
              top: `${20 + i * 15}%`,
              left: '-10px',
            }}
          ></div>
        ))}
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main headline */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-6 py-2 mb-8">
            <CpuChipIcon className="w-5 h-5 text-blue-400" />
            <span className="text-blue-300 font-semibold">The Breakthrough Solution</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white via-blue-100 to-cyan-200 bg-clip-text text-transparent">
            Meet Your AI
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Planning Partner
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Not another tool to manage, but intelligence that manages for you. AI that thinks like your best self and plans like a pro.
          </p>
        </div>

        {/* AI Brain Visualization */}
        <div className="mb-20 flex justify-center">
          <div className="relative">
            {/* Neural network SVG */}
            <svg ref={neuralRef} width="400" height="300" className="ai-glow">
              {/* Neural connections */}
              <path
                className="neural-connection"
                d="M50,150 Q200,50 350,150"
                stroke="#3B82F6"
                strokeWidth="2"
                fill="none"
                strokeDasharray="300"
                strokeDashoffset="300"
              />
              <path
                className="neural-connection"
                d="M50,150 Q200,250 350,150"
                stroke="#06B6D4"
                strokeWidth="2"
                fill="none"
                strokeDasharray="300"
                strokeDashoffset="300"
              />
              <path
                className="neural-connection"
                d="M50,100 Q200,150 350,200"
                stroke="#8B5CF6"
                strokeWidth="2"
                fill="none"
                strokeDasharray="280"
                strokeDashoffset="280"
              />
              
              {/* Neural nodes */}
              <circle cx="50" cy="150" r="8" fill="#3B82F6" className="thinking-dot" />
              <circle cx="50" cy="100" r="6" fill="#06B6D4" className="thinking-dot" />
              <circle cx="50" cy="200" r="6" fill="#8B5CF6" className="thinking-dot" />
              <circle cx="200" cy="150" r="10" fill="#10B981" className="thinking-dot" />
              <circle cx="350" cy="150" r="8" fill="#F59E0B" className="thinking-dot" />
              <circle cx="350" cy="100" r="6" fill="#EF4444" className="thinking-dot" />
              <circle cx="350" cy="200" r="6" fill="#EC4899" className="thinking-dot" />
            </svg>
            
            {/* AI thinking indicator */}
            <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
              <div className="bg-gradient-to-br from-blue-500 to-cyan-500 rounded-full p-6 ai-glow">
                <CpuChipIcon className="w-8 h-8 text-white" />
              </div>
            </div>
          </div>
        </div>

        {/* AI thinking process */}
        <div className="mb-20 p-8 bg-gradient-to-br from-blue-500/10 via-cyan-500/5 to-purple-500/10 border border-white/10 rounded-3xl backdrop-blur-sm">
          <div className="text-center mb-8">
            <h3 className="text-2xl font-bold text-white mb-4">How AI Thinks About Your Day</h3>
            <p className="text-gray-400">Watch intelligent planning in action</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-6">
            <div className="text-center p-6 bg-white/5 rounded-2xl">
              <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">1</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Analyzes Context</h4>
              <p className="text-gray-400 text-sm">Considers your goals, energy patterns, deadlines, and priorities</p>
            </div>
            
            <div className="text-center p-6 bg-white/5 rounded-2xl">
              <div className="w-12 h-12 bg-cyan-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">2</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Researches & Plans</h4>
              <p className="text-gray-400 text-sm">Gathers insights and creates optimal task sequences</p>
            </div>
            
            <div className="text-center p-6 bg-white/5 rounded-2xl">
              <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <span className="text-white font-bold">3</span>
              </div>
              <h4 className="text-white font-semibold mb-2">Proposes Solutions</h4>
              <p className="text-gray-400 text-sm">Suggests improvements while keeping you in control</p>
            </div>
          </div>
        </div>

        {/* AI Capabilities */}
        <div ref={featuresRef} className="grid md:grid-cols-2 gap-8 mb-16">
          {aiCapabilities.map((capability, index) => (
            <div key={index} className="ai-feature group">
              <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:from-white/15 hover:to-white/10 transition-all duration-500">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-xl flex items-center justify-center flex-shrink-0 ai-glow">
                    <capability.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">{capability.title}</h4>
                    <p className="text-gray-300 mb-4 leading-relaxed">{capability.description}</p>
                    <div className="inline-flex items-center bg-blue-500/20 border border-blue-500/30 rounded-full px-4 py-2">
                      <span className="text-blue-300 text-sm font-semibold">{capability.power}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* The AI Advantage */}
        <div className="text-center p-12 bg-gradient-to-br from-blue-900/30 via-cyan-900/20 to-purple-900/30 border border-white/10 rounded-3xl backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-white mb-6">Why AI Changes Everything</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Traditional productivity tools make you think harder. AI makes you think smarter. It's the difference between having another item on your to-do list and having a genius-level assistant who never sleeps.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="inline-flex items-center gap-2 text-green-300 font-semibold">
              <BoltIcon className="w-5 h-5" />
              <span>10x faster planning</span>
            </div>
            <div className="inline-flex items-center gap-2 text-blue-300 font-semibold">
              <CpuChipIcon className="w-5 h-5" />
              <span>Zero decision fatigue</span>
            </div>
            <div className="inline-flex items-center gap-2 text-purple-300 font-semibold">
              <LightBulbIcon className="w-5 h-5" />
              <span>Proactive insights</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 