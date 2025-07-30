'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ClockIcon, 
  ExclamationTriangleIcon,
  SparklesIcon,
  BoltIcon,
  FireIcon,
  RocketLaunchIcon,
  CheckCircleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function FinalCTA() {
  const [timeLeft, setTimeLeft] = useState({
    days: 0,
    hours: 0,
    minutes: 0,
    seconds: 0
  });
  
  const sectionRef = useRef<HTMLDivElement>(null);
  const urgencyRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Set countdown to 7 days from now (for demo purposes)
    const countdownDate = new Date().getTime() + (7 * 24 * 60 * 60 * 1000);
    
    const timer = setInterval(() => {
      const now = new Date().getTime();
      const distance = countdownDate - now;
      
      setTimeLeft({
        days: Math.floor(distance / (1000 * 60 * 60 * 24)),
        hours: Math.floor((distance % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
        minutes: Math.floor((distance % (1000 * 60 * 60)) / (1000 * 60)),
        seconds: Math.floor((distance % (1000 * 60)) / 1000)
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Pulsing urgency elements
      gsap.to('.urgency-pulse', {
        scale: 1.05,
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Countdown numbers animation
      gsap.to('.countdown-number', {
        textShadow: '0 0 20px rgba(239, 68, 68, 0.8)',
        duration: 1,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.1
      });

      // CTA button glow
      gsap.to('.final-cta-button', {
        boxShadow: '0 0 50px rgba(59, 130, 246, 0.8)',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Scrolling reveal
      ScrollTrigger.create({
        trigger: sectionRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.final-element', {
            y: 100,
            opacity: 0,
            duration: 1.5,
            ease: "power3.out",
            stagger: 0.2
          });
        }
      });

      // Background effects
      gsap.to('.chaos-particle', {
        x: (i) => Math.sin(i) * 100,
        y: (i) => Math.cos(i) * 100,
        rotation: 360,
        duration: 10,
        repeat: -1,
        ease: "none",
        stagger: 0.2
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const painPoints = [
    "Another week of planning chaos",
    "More Sunday scaries", 
    "Continued decision paralysis",
    "Missing important deadlines",
    "Watching competitors pull ahead"
  ];

  const benefits = [
    "AI plans your perfect day",
    "No more decision fatigue",
    "Effortless productivity",
    "Goals actually achieved",
    "Stress-free execution"
  ];

  return (
    <div ref={sectionRef} className="relative py-32 bg-gradient-to-b from-slate-900 via-red-950 to-slate-900 overflow-hidden">
      {/* Chaotic background particles */}
      <div className="absolute inset-0 pointer-events-none">
        {[...Array(20)].map((_, i) => (
          <div
            key={i}
            className="chaos-particle absolute w-2 h-2 bg-red-400/30 rounded-full"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
            }}
          ></div>
        ))}
      </div>

      {/* Dark gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-red-900/20 to-black/50"></div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Urgency headline */}
        <div className="text-center mb-16 final-element">
          <div className="inline-flex items-center gap-2 bg-red-500/20 border border-red-500/40 rounded-full px-6 py-2 mb-8 urgency-pulse">
            <ExclamationTriangleIcon className="w-5 h-5 text-red-400" />
            <span className="text-red-300 font-semibold">Your Future Self is Waiting</span>
          </div>
          
          <h2 className="text-4xl md:text-7xl font-bold mb-6 bg-gradient-to-b from-white via-red-100 to-red-300 bg-clip-text text-transparent leading-tight">
            Every Day You Wait is Another Day of
            <br />
            <span className="bg-gradient-to-r from-red-400 to-orange-400 bg-clip-text text-transparent">
              Planning Chaos
            </span>
          </h2>
          
          <p className="text-xl md:text-2xl text-gray-300 max-w-4xl mx-auto leading-relaxed">
            While you're reading this, successful people are using AI to plan their perfect days. The gap between you and them grows wider every moment you hesitate.
          </p>
        </div>

        {/* Time countdown */}
        <div className="mb-16 final-element">
          <div className="bg-gradient-to-br from-red-900/30 via-orange-900/20 to-red-900/30 border border-red-500/30 rounded-3xl p-8 backdrop-blur-sm urgency-pulse">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Time is Running Out</h3>
              <p className="text-red-300">Start your transformation now, before another week slips away</p>
            </div>
            
            <div className="grid grid-cols-4 gap-4 max-w-md mx-auto">
              <div className="text-center p-4 bg-black/40 rounded-xl">
                <div className="countdown-number text-3xl font-bold text-red-400 mb-1">{String(timeLeft.days).padStart(2, '0')}</div>
                <div className="text-red-300 text-sm">Days</div>
              </div>
              <div className="text-center p-4 bg-black/40 rounded-xl">
                <div className="countdown-number text-3xl font-bold text-red-400 mb-1">{String(timeLeft.hours).padStart(2, '0')}</div>
                <div className="text-red-300 text-sm">Hours</div>
              </div>
              <div className="text-center p-4 bg-black/40 rounded-xl">
                <div className="countdown-number text-3xl font-bold text-red-400 mb-1">{String(timeLeft.minutes).padStart(2, '0')}</div>
                <div className="text-red-300 text-sm">Minutes</div>
              </div>
              <div className="text-center p-4 bg-black/40 rounded-xl">
                <div className="countdown-number text-3xl font-bold text-red-400 mb-1">{String(timeLeft.seconds).padStart(2, '0')}</div>
                <div className="text-red-300 text-sm">Seconds</div>
              </div>
            </div>
          </div>
        </div>

        {/* Pain vs Transformation */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Without AI (Pain) */}
          <div className="final-element">
            <div className="p-8 bg-gradient-to-br from-red-900/20 via-red-800/10 to-transparent border border-red-500/20 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <ExclamationTriangleIcon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-red-400">If You Don't Act Now</h4>
              </div>
              
              <div className="space-y-4">
                {painPoints.map((pain, index) => (
                  <div key={index} className="flex items-center gap-3 text-red-300">
                    <div className="w-2 h-2 bg-red-500 rounded-full flex-shrink-0"></div>
                    <span>{pain}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-300 text-center font-semibold">
                  Another year of productivity chaos awaits
                </p>
              </div>
            </div>
          </div>

          {/* With AI (Transformation) */}
          <div className="final-element">
            <div className="p-8 bg-gradient-to-br from-blue-900/20 via-blue-800/10 to-transparent border border-blue-500/20 rounded-2xl backdrop-blur-sm">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <SparklesIcon className="w-6 h-6 text-white" />
                </div>
                <h4 className="text-2xl font-bold text-blue-400">If You Start Today</h4>
              </div>
              
              <div className="space-y-4">
                {benefits.map((benefit, index) => (
                  <div key={index} className="flex items-center gap-3 text-blue-300">
                    <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0" />
                    <span>{benefit}</span>
                  </div>
                ))}
              </div>
              
              <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-xl">
                <p className="text-blue-300 text-center font-semibold">
                  Your most productive year starts now
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Final transformation message */}
        <div className="text-center mb-16 final-element">
          <h3 className="text-3xl md:text-5xl font-bold text-white mb-8">
            You're One Decision Away From
            <br />
            <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
              Everything Changing
            </span>
          </h3>
          
          <p className="text-xl text-gray-300 max-w-4xl mx-auto mb-8 leading-relaxed">
            Imagine waking up tomorrow with an AI assistant that already knows your priorities, has researched your projects, and planned your perfect day. That's not a fantasy—that's next Monday if you start today.
          </p>
        </div>

        {/* Ultimate CTA */}
        <div className="text-center final-element">
          <div className="inline-block p-1 bg-gradient-to-r from-blue-500 via-purple-500 to-cyan-500 rounded-2xl mb-8">
            <button className="final-cta-button group bg-slate-900 hover:bg-slate-800 text-white px-12 py-6 rounded-xl text-2xl font-bold transition-all duration-300 flex items-center gap-4 mx-auto">
              <RocketLaunchIcon className="w-8 h-8" />
              Transform My Productivity Now
              <ArrowRightIcon className="w-6 h-6 group-hover:translate-x-2 transition-transform duration-300" />
            </button>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
            <div className="flex items-center gap-2 text-green-300">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Free to start</span>
            </div>
            <div className="flex items-center gap-2 text-green-300">
              <CheckCircleIcon className="w-5 h-5" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center gap-2 text-green-300">
              <CheckCircleIcon className="w-5 h-5" />
              <span>30-day guarantee</span>
            </div>
          </div>
          
          <p className="text-gray-400 text-sm">
            Join thousands who chose intelligence over chaos
          </p>
        </div>

        {/* Final urgency reminder */}
        <div className="mt-16 text-center final-element">
          <div className="inline-flex items-center gap-2 bg-orange-500/20 border border-orange-500/40 rounded-full px-6 py-2 urgency-pulse">
            <ClockIcon className="w-5 h-5 text-orange-400" />
            <span className="text-orange-300 font-semibold">
              Your future self will thank you for starting today
            </span>
          </div>
        </div>
      </div>
    </div>
  );
} 