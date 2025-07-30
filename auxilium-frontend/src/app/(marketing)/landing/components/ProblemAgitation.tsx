'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { ExclamationTriangleIcon, ClockIcon, BoltSlashIcon } from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function ProblemAgitation() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const painPointsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Stress pulse animation
      gsap.to('.stress-pulse', {
        scale: 1.1,
        opacity: 0.8,
        duration: 1.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Stats counter animation
      ScrollTrigger.create({
        trigger: statsRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.stat-number', {
            textContent: 0,
            duration: 2,
            ease: "power2.out",
            snap: { textContent: 1 },
            stagger: 0.2
          });
        }
      });

      // Pain points stagger animation
      ScrollTrigger.create({
        trigger: painPointsRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.pain-point', {
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.15
          });
        }
      });

      // Background stress visualization
      gsap.to('.stress-bg', {
        backgroundPosition: '100% 100%',
        duration: 20,
        repeat: -1,
        ease: "none"
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const painPoints = [
    {
      icon: ClockIcon,
      title: "Sunday Scaries Are Real",
      description: "That sick feeling when you realize you've planned nothing for Monday",
      impact: "67% report weekend anxiety from unfinished tasks"
    },
    {
      icon: BoltSlashIcon,
      title: "Decision Paralysis",
      description: "Spending more time deciding what to do than actually doing it",
      impact: "Average 2.5 hours daily lost to decision-making"
    },
    {
      icon: ExclamationTriangleIcon,
      title: "System Hopping",
      description: "Tried Notion, Todoist, Asana, Monday... still drowning",
      impact: "91% have abandoned at least 3 productivity systems"
    }
  ];

  return (
    <div ref={sectionRef} className="relative py-32 bg-gradient-to-b from-slate-900 via-red-950/20 to-slate-900 overflow-hidden">
      {/* Stress background pattern */}
      <div 
        className="absolute inset-0 opacity-10 stress-bg"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ef4444' fill-opacity='0.4'%3E%3Cpath d='M30 30l15-15v15h-15zM15 15l15 15H15V15z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px'
        }}
      ></div>

      <div className="max-w-7xl mx-auto px-6">
        {/* Main headline */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-red-500/10 border border-red-500/20 rounded-full px-6 py-2 mb-8">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            <span className="text-red-300 font-semibold">The Hidden Cost of Planning Paralysis</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white to-red-200 bg-clip-text text-transparent">
            You're Bleeding Time
            <br />
            <span className="text-red-400">Every Single Day</span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto">
            While you're stuck in planning purgatory, your goals are slipping away. Here's what productivity chaos is actually costing you.
          </p>
        </div>

        {/* Shocking statistics */}
        <div ref={statsRef} className="grid md:grid-cols-3 gap-8 mb-20">
          <div className="text-center p-8 bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl backdrop-blur-sm">
            <div className="text-5xl font-bold text-red-400 mb-2 stat-number">2.5</div>
            <div className="text-red-300 font-semibold mb-2">Hours Daily</div>
            <div className="text-gray-400 text-sm">Wasted on deciding what to do</div>
          </div>
          
          <div className="text-center p-8 bg-gradient-to-b from-orange-500/10 to-transparent border border-orange-500/20 rounded-2xl backdrop-blur-sm">
            <div className="text-5xl font-bold text-orange-400 mb-2 stat-number">67</div>
            <div className="text-orange-300 font-semibold mb-2">%</div>
            <div className="text-gray-400 text-sm">Experience Sunday anxiety about upcoming week</div>
          </div>
          
          <div className="text-center p-8 bg-gradient-to-b from-red-500/10 to-transparent border border-red-500/20 rounded-2xl backdrop-blur-sm">
            <div className="text-5xl font-bold text-red-400 mb-2 stat-number">91</div>
            <div className="text-red-300 font-semibold mb-2">%</div>
            <div className="text-gray-400 text-sm">Have abandoned multiple productivity systems</div>
          </div>
        </div>

        {/* Pain points deep dive */}
        <div ref={painPointsRef} className="space-y-8">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">Sound Familiar?</h3>
            <p className="text-gray-400">These are the productivity killers destroying your potential</p>
          </div>

          {painPoints.map((point, index) => (
            <div key={index} className="pain-point flex items-start gap-6 p-8 bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl hover:bg-white/10 transition-all duration-300">
              <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                <point.icon className="w-6 h-6 text-white" />
              </div>
              
              <div className="flex-1">
                <h4 className="text-2xl font-bold text-white mb-2">{point.title}</h4>
                <p className="text-gray-300 text-lg mb-3">{point.description}</p>
                <div className="inline-flex items-center bg-red-500/20 border border-red-500/30 rounded-full px-4 py-1">
                  <span className="text-red-300 text-sm font-semibold">{point.impact}</span>
                </div>
              </div>

              {/* Stress pulse indicator */}
              <div className="flex-shrink-0 w-4 h-4 bg-red-500 rounded-full stress-pulse"></div>
            </div>
          ))}
        </div>

        {/* The painful truth */}
        <div className="mt-20 text-center p-12 bg-gradient-to-br from-red-900/20 via-red-800/10 to-transparent border border-red-500/20 rounded-3xl backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-white mb-6">The Brutal Truth</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Every day you stay trapped in this cycle, you're not just losing time—you're losing opportunities, momentum, and pieces of your sanity. Your competitors aren't stuck planning. They're executing while you're still organizing your to-do list for the third time this week.
          </p>
          
          <div className="inline-flex items-center gap-2 text-red-300 font-semibold">
            <ClockIcon className="w-5 h-5" />
            <span>Time lost is potential never realized</span>
          </div>
        </div>
      </div>
    </div>
  );
} 