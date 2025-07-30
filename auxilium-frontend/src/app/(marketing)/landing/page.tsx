'use client';

import dynamic from 'next/dynamic';
import { useEffect } from 'react';
import Lenis from '@studio-freight/lenis';

// Dynamic imports for performance
const Hero = dynamic(() => import('./components/Hero'), { ssr: false });
const ProblemAgitation = dynamic(() => import('./components/ProblemAgitation'));
const DreamState = dynamic(() => import('./components/DreamState'));
const AISolution = dynamic(() => import('./components/AISolution'));
const AIShowcase = dynamic(() => import('./components/AIShowcase'));
const HierarchicalTasks = dynamic(() => import('./components/HierarchicalTasks'));
const Calendar = dynamic(() => import('./components/Calendar'));
const GanttChart = dynamic(() => import('./components/GanttChart'));
const Integration = dynamic(() => import('./components/Integration'));
const Gamification = dynamic(() => import('./components/Gamification'));
const Pricing = dynamic(() => import('./components/Pricing'));
const SocialProof = dynamic(() => import('./components/SocialProof'));
const FinalCTA = dynamic(() => import('./components/FinalCTA'));

export default function LandingPage() {
  useEffect(() => {
    // Initialize Lenis for smooth scrolling
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
      wheelMultiplier: 1,
      touchMultiplier: 2,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    return () => {
      lenis.destroy();
    };
  }, []);

  return (
    <div className="relative min-h-screen bg-gradient-to-b from-slate-950 via-blue-950 to-slate-900 overflow-x-hidden">
      {/* Background Elements */}
      <div className="fixed inset-0 bg-[url('/noise.png')] opacity-20 pointer-events-none"></div>
      <div className="fixed inset-0 bg-gradient-to-br from-blue-500/5 via-transparent to-purple-500/5 pointer-events-none"></div>
      
      {/* Animated Background Particles */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute top-1/2 -left-40 w-80 h-80 bg-purple-500/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute -bottom-40 right-1/2 w-80 h-80 bg-cyan-500/10 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Main Content */}
      <main className="relative z-10">
        <Hero />
        <ProblemAgitation />
        <DreamState />
        <AISolution />
        <AIShowcase />
        <HierarchicalTasks />
        <Calendar />
        <GanttChart />
        <Integration />
        <Gamification />
        <Pricing />
        <SocialProof />
        <FinalCTA />
      </main>
    </div>
  );
} 