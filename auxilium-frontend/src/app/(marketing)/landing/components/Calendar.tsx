'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  CalendarIcon, 
  ClockIcon, 
  SparklesIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon
} from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function Calendar() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Calendar reveal animation
      ScrollTrigger.create({
        trigger: calendarRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.calendar-day', {
            scale: 0,
            opacity: 0,
            duration: 0.8,
            ease: "back.out(1.7)",
            stagger: 0.05
          });
        }
      });

      // Event animations
      gsap.to('.calendar-event', {
        y: -3,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.3
      });

      // AI suggestions animation
      gsap.to('.ai-suggestion', {
        x: 5,
        duration: 1.5,
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
          gsap.from('.calendar-feature', {
            y: 60,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.2
          });
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const calendarFeatures = [
    {
      icon: SparklesIcon,
      title: "AI-Powered Scheduling",
      description: "AI automatically finds the best time slots based on your energy patterns and preferences",
      benefits: "Optimal meeting times, reduced conflicts"
    },
    {
      icon: BoltIcon,
      title: "Smart Conflict Resolution",
      description: "Detects scheduling conflicts and suggests intelligent rearrangements",
      benefits: "Zero double-bookings, seamless adjustments"
    },
    {
      icon: ClockIcon,
      title: "Focus Time Protection",
      description: "Automatically blocks time for deep work and guards against meeting overload",
      benefits: "Protected productivity hours"
    },
    {
      icon: CheckCircleIcon,
      title: "Google Calendar Sync",
      description: "One-way import preserves your existing calendar while adding AI intelligence",
      benefits: "Keep your workflow, gain superpowers"
    }
  ];

  // Sample calendar data
  const calendarDays = Array.from({ length: 35 }, (_, i) => {
    const dayNum = i - 6; // Start calendar from previous month
    const isCurrentMonth = dayNum > 0 && dayNum <= 30;
    const isToday = dayNum === 15;
    
    return {
      day: dayNum > 0 ? dayNum : '',
      isCurrentMonth,
      isToday,
      events: isCurrentMonth ? Math.floor(Math.random() * 3) : 0
    };
  });

  return (
    <div ref={sectionRef} className="relative py-32 bg-gradient-to-b from-slate-900 via-cyan-950 to-slate-900 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main headline */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-cyan-500/10 border border-cyan-500/20 rounded-full px-6 py-2 mb-8">
            <CalendarIcon className="w-5 h-5 text-cyan-400" />
            <span className="text-cyan-300 font-semibold">Intelligent Calendar</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white via-cyan-100 to-blue-200 bg-clip-text text-transparent">
            Your Calendar
            <br />
            <span className="bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">
              Just Got Smarter
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            AI transforms your calendar from a passive schedule into an active planning partner that optimizes your time and protects your focus.
          </p>
        </div>

        {/* Interactive calendar demo */}
        <div ref={calendarRef} className="mb-20">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">AI-Enhanced Calendar View</h3>
              <p className="text-gray-400">See how AI optimizes your schedule in real-time</p>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Calendar grid */}
              <div className="lg:col-span-2">
                <div className="bg-white/5 rounded-2xl p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h4 className="text-xl font-bold text-white">November 2024</h4>
                    <div className="flex items-center gap-2 text-cyan-300">
                      <SparklesIcon className="w-5 h-5" />
                      <span className="text-sm">AI Optimized</span>
                    </div>
                  </div>
                  
                  {/* Calendar header */}
                  <div className="grid grid-cols-7 gap-2 mb-4">
                    {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                      <div key={day} className="text-center text-gray-400 text-sm font-semibold p-2">
                        {day}
                      </div>
                    ))}
                  </div>
                  
                  {/* Calendar days */}
                  <div className="grid grid-cols-7 gap-2">
                    {calendarDays.map((dayData, index) => (
                      <div
                        key={index}
                        className={`calendar-day aspect-square flex flex-col items-center justify-center rounded-lg text-sm relative ${
                          dayData.isCurrentMonth
                            ? dayData.isToday
                              ? 'bg-cyan-500 text-white font-bold'
                              : 'bg-white/10 text-white hover:bg-white/20 transition-colors'
                            : 'text-gray-600'
                        }`}
                      >
                        <span>{dayData.day}</span>
                        
                        {/* Event indicators */}
                        {dayData.events > 0 && (
                          <div className="absolute bottom-1 flex gap-1">
                            {Array.from({ length: dayData.events }).map((_, i) => (
                              <div
                                key={i}
                                className={`calendar-event w-1.5 h-1.5 rounded-full ${
                                  i === 0 ? 'bg-cyan-400' : i === 1 ? 'bg-green-400' : 'bg-purple-400'
                                }`}
                              />
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* AI suggestions panel */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-white mb-4">AI Suggestions</h4>
                
                <div className="ai-suggestion bg-cyan-500/20 border border-cyan-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 text-cyan-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-white font-semibold mb-1">Optimize Tuesday</h5>
                      <p className="text-cyan-200 text-sm mb-2">You have 6 meetings scheduled. I suggest moving 2 to Thursday for better focus.</p>
                      <button className="text-cyan-300 text-xs hover:text-white transition-colors">Apply optimization →</button>
                    </div>
                  </div>
                </div>

                <div className="ai-suggestion bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-white font-semibold mb-1">Focus Block Protected</h5>
                      <p className="text-green-200 text-sm mb-2">I've blocked 9-11 AM for deep work based on your productivity patterns.</p>
                      <button className="text-green-300 text-xs hover:text-white transition-colors">View details →</button>
                    </div>
                  </div>
                </div>

                <div className="ai-suggestion bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-white font-semibold mb-1">Potential Conflict</h5>
                      <p className="text-orange-200 text-sm mb-2">Your 2 PM meeting might run over into your 3 PM call. Add buffer time?</p>
                      <button className="text-orange-300 text-xs hover:text-white transition-colors">Add 15min buffer →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Calendar features */}
        <div ref={featuresRef} className="grid md:grid-cols-2 gap-8 mb-16">
          {calendarFeatures.map((feature, index) => (
            <div key={index} className="calendar-feature">
              <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:from-white/15 hover:to-white/10 transition-all duration-500">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-cyan-500 to-blue-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">{feature.title}</h4>
                    <p className="text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
                    <div className="inline-flex items-center bg-cyan-500/20 border border-cyan-500/30 rounded-full px-4 py-2">
                      <span className="text-cyan-300 text-sm font-semibold">{feature.benefits}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Calendar integration promise */}
        <div className="text-center p-12 bg-gradient-to-br from-cyan-900/30 via-blue-900/20 to-cyan-900/30 border border-white/10 rounded-3xl backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-white mb-6">Your Calendar, Supercharged</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Keep using the calendar you love, but with AI intelligence that learns your patterns and optimizes your time automatically.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="inline-flex items-center gap-2 text-cyan-300 font-semibold">
              <CalendarIcon className="w-5 h-5" />
              <span>Google Calendar compatible</span>
            </div>
            <div className="inline-flex items-center gap-2 text-blue-300 font-semibold">
              <SparklesIcon className="w-5 h-5" />
              <span>AI-powered insights</span>
            </div>
            <div className="inline-flex items-center gap-2 text-purple-300 font-semibold">
              <BoltIcon className="w-5 h-5" />
              <span>Real-time optimization</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 