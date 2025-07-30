'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ArrowRightIcon, 
  CalendarIcon, 
  DocumentTextIcon, 
  CloudArrowDownIcon,
  LinkIcon,
  CheckCircleIcon,
  ClockIcon
} from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function Integration() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const flowRef = useRef<HTMLDivElement>(null);
  const integrationsRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Data flow animation
      gsap.to('.data-flow', {
        strokeDashoffset: 0,
        duration: 3,
        ease: "power2.out",
        stagger: 0.5,
        repeat: -1,
        repeatDelay: 2
      });

      // Integration cards reveal
      ScrollTrigger.create({
        trigger: integrationsRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.integration-card', {
            y: 60,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.2
          });
        }
      });

      // Floating data elements
      gsap.to('.floating-data', {
        y: -15,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.3
      });

      // Migration progress
      ScrollTrigger.create({
        trigger: flowRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.to('.migration-progress', {
            width: '100%',
            duration: 2,
            ease: "power2.out",
            delay: 0.5
          });
        }
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const integrations = [
    {
      icon: CalendarIcon,
      name: "Google Calendar",
      type: "Migration",
      description: "One-click import of your entire calendar history",
      features: [
        "Read-only import (no sync conflicts)",
        "Preserves all event details",
        "Instant AI analysis of patterns"
      ],
      status: "Ready",
      color: "from-blue-500 to-cyan-500"
    },
    {
      icon: DocumentTextIcon,
      name: "Notion",
      type: "Live Integration",
      description: "Your existing knowledge, now AI-enhanced",
      features: [
        "Real-time bidirectional sync",
        "AI analyzes your notes for context",
        "Smart task extraction"
      ],
      status: "Active",
      color: "from-gray-600 to-gray-800"
    },
    {
      icon: LinkIcon,
      name: "More Integrations",
      type: "Coming Soon",
      description: "Connect your entire productivity ecosystem",
      features: [
        "Slack, Teams, Discord",
        "GitHub, Jira, Linear",
        "Email providers"
      ],
      status: "Planned",
      color: "from-purple-500 to-indigo-500"
    }
  ];

  return (
    <div ref={sectionRef} className="relative py-32 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main headline */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-6 py-2 mb-8">
            <CloudArrowDownIcon className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300 font-semibold">Seamless Migration & Integration</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white via-emerald-100 to-blue-200 bg-clip-text text-transparent">
            Bring Your Data,
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-blue-400 bg-clip-text text-transparent">
              Keep Your Sanity
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            No more starting from scratch. Import your calendar history and connect your existing tools in minutes, not hours.
          </p>
        </div>

        {/* Migration flow visualization */}
        <div ref={flowRef} className="mb-20">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Migration in Action</h3>
              <p className="text-gray-400">Watch your data flow seamlessly into AI-powered productivity</p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 items-center">
              {/* Source */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-blue-500 to-cyan-500 rounded-2xl mx-auto mb-4 flex items-center justify-center floating-data">
                  <CalendarIcon className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">Your Google Calendar</h4>
                <p className="text-gray-400 mb-4">5 years of meetings, events, and patterns</p>
                <div className="bg-blue-500/20 rounded-lg p-3">
                  <div className="text-blue-300 text-sm font-semibold">2,847 events</div>
                  <div className="text-blue-400 text-xs">Ready for import</div>
                </div>
              </div>

              {/* Flow arrow with progress */}
              <div className="flex flex-col items-center">
                <svg width="200" height="100" className="mb-4">
                  <path
                    className="data-flow"
                    d="M20,50 Q100,20 180,50"
                    stroke="#10B981"
                    strokeWidth="3"
                    fill="none"
                    strokeDasharray="200"
                    strokeDashoffset="200"
                  />
                  <path
                    className="data-flow"
                    d="M20,50 Q100,80 180,50"
                    stroke="#06B6D4"
                    strokeWidth="2"
                    fill="none"
                    strokeDasharray="180"
                    strokeDashoffset="180"
                  />
                </svg>
                <div className="bg-white/5 rounded-full p-2 mb-2">
                  <ArrowRightIcon className="w-6 h-6 text-emerald-400" />
                </div>
                <div className="text-center">
                  <div className="text-emerald-300 text-sm font-semibold mb-1">AI Processing</div>
                  <div className="w-32 h-2 bg-white/10 rounded-full">
                    <div className="migration-progress h-full bg-gradient-to-r from-emerald-400 to-blue-400 rounded-full w-0"></div>
                  </div>
                </div>
              </div>

              {/* Destination */}
              <div className="text-center">
                <div className="w-20 h-20 bg-gradient-to-br from-emerald-500 to-blue-500 rounded-2xl mx-auto mb-4 flex items-center justify-center floating-data">
                  <CheckCircleIcon className="w-10 h-10 text-white" />
                </div>
                <h4 className="text-xl font-bold text-white mb-2">AI-Enhanced System</h4>
                <p className="text-gray-400 mb-4">Intelligent insights and optimization</p>
                <div className="bg-emerald-500/20 rounded-lg p-3">
                  <div className="text-emerald-300 text-sm font-semibold">Patterns detected</div>
                  <div className="text-emerald-400 text-xs">Ready to optimize</div>
                </div>
              </div>
            </div>

            {/* Migration benefits */}
            <div className="mt-12 pt-8 border-t border-white/10">
              <div className="grid md:grid-cols-4 gap-6">
                <div className="text-center">
                  <ClockIcon className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  <div className="text-white font-semibold">2 minutes</div>
                  <div className="text-gray-400 text-sm">Average import time</div>
                </div>
                <div className="text-center">
                  <CheckCircleIcon className="w-8 h-8 text-blue-400 mx-auto mb-2" />
                  <div className="text-white font-semibold">100% accuracy</div>
                  <div className="text-gray-400 text-sm">No data loss</div>
                </div>
                <div className="text-center">
                  <ArrowRightIcon className="w-8 h-8 text-purple-400 mx-auto mb-2" />
                  <div className="text-white font-semibold">Instant insights</div>
                  <div className="text-gray-400 text-sm">AI analysis ready</div>
                </div>
                <div className="text-center">
                  <LinkIcon className="w-8 h-8 text-cyan-400 mx-auto mb-2" />
                  <div className="text-white font-semibold">Stay connected</div>
                  <div className="text-gray-400 text-sm">Read-only sync</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Integration cards */}
        <div ref={integrationsRef} className="grid md:grid-cols-3 gap-8 mb-16">
          {integrations.map((integration, index) => (
            <div key={index} className="integration-card">
              <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:from-white/15 hover:to-white/10 transition-all duration-500 h-full">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 bg-gradient-to-br ${integration.color} rounded-xl flex items-center justify-center`}>
                    <integration.icon className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h4 className="text-xl font-bold text-white">{integration.name}</h4>
                    <p className="text-gray-400 text-sm">{integration.type}</p>
                  </div>
                </div>
                
                <p className="text-gray-300 mb-6 leading-relaxed">{integration.description}</p>
                
                <div className="space-y-3 mb-6">
                  {integration.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0" />
                      <span className="text-gray-300 text-sm">{feature}</span>
                    </div>
                  ))}
                </div>
                
                <div className="flex items-center justify-between">
                  <div className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold ${
                    integration.status === 'Ready' ? 'bg-emerald-500/20 text-emerald-300' :
                    integration.status === 'Active' ? 'bg-blue-500/20 text-blue-300' :
                    'bg-purple-500/20 text-purple-300'
                  }`}>
                    {integration.status}
                  </div>
                  
                  {integration.status !== 'Planned' && (
                    <button className="text-white hover:text-emerald-300 transition-colors duration-200 flex items-center gap-1 text-sm">
                      Connect
                      <ArrowRightIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Integration promise */}
        <div className="text-center p-12 bg-gradient-to-br from-emerald-900/30 via-blue-900/20 to-emerald-900/30 border border-white/10 rounded-3xl backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-white mb-6">No Vendor Lock-in Promise</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            Your data stays yours. We believe in making your existing tools smarter, not replacing them. Import everything, connect anything, leave anytime.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="inline-flex items-center gap-2 text-emerald-300 font-semibold">
              <CloudArrowDownIcon className="w-5 h-5" />
              <span>Easy import</span>
            </div>
            <div className="inline-flex items-center gap-2 text-blue-300 font-semibold">
              <LinkIcon className="w-5 h-5" />
              <span>Smart connections</span>
            </div>
            <div className="inline-flex items-center gap-2 text-purple-300 font-semibold">
              <CheckCircleIcon className="w-5 h-5" />
              <span>Your control</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 