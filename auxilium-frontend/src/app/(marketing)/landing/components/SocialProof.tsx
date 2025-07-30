'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  CodeBracketIcon, 
  AcademicCapIcon, 
  BoltIcon,
  SparklesIcon,
  CheckCircleIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function SocialProof() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const timelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Timeline animation
      ScrollTrigger.create({
        trigger: timelineRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.timeline-item', {
            x: -100,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.3
          });
        }
      });

      // Code snippets animation
      gsap.to('.code-glow', {
        boxShadow: '0 0 30px rgba(34, 197, 94, 0.5)',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Stats counter animation
      gsap.to('.stat-number', {
        textContent: 0,
        duration: 2,
        ease: "power2.out",
        snap: { textContent: 1 },
        stagger: 0.2
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const developmentJourney = [
    {
      date: "Early 2024",
      title: "The Productivity Breaking Point",
      description: "After trying 15+ productivity systems and failing with each one, we realized the problem wasn't the users—it was the tools.",
      icon: LightBulbIcon,
      color: "from-yellow-500 to-orange-500"
    },
    {
      date: "March 2024",
      title: "First AI Experiments",
      description: "Started building simple AI agents to help with task breakdown. The results were immediately promising.",
      icon: SparklesIcon,
      color: "from-blue-500 to-cyan-500"
    },
    {
      date: "June 2024",
      title: "Multi-Agent Breakthrough",
      description: "Discovered that multiple specialized AI agents working together produced 10x better results than single-agent systems.",
      icon: BoltIcon,
      color: "from-purple-500 to-pink-500"
    },
    {
      date: "September 2024",
      title: "Research Integration",
      description: "Added internet research capabilities. Suddenly, AI wasn't just organizing tasks—it was making them smarter.",
      icon: AcademicCapIcon,
      color: "from-green-500 to-emerald-500"
    },
    {
      date: "November 2024",
      title: "Beta Testing Success",
      description: "Early testers reported 2-3x productivity improvements. Time to share with the world.",
      icon: CheckCircleIcon,
      color: "from-indigo-500 to-purple-500"
    }
  ];

  const techCredibility = [
    "Built with latest AI research (RAG, multi-agent systems, fine-tuning)",
    "Secure by design (SOC2 compliant, end-to-end encryption)",
    "Built for scale (handles millions of tasks, sub-second response times)",
    "Continuous learning (AI gets smarter as you use it more)"
  ];

  return (
    <div ref={sectionRef} className="relative py-32 bg-gradient-to-b from-slate-900 via-gray-950 to-slate-900 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main headline */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-green-500/10 border border-green-500/20 rounded-full px-6 py-2 mb-8">
            <CodeBracketIcon className="w-5 h-5 text-green-400" />
            <span className="text-green-300 font-semibold">Built with Cutting-Edge Technology</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white via-green-100 to-blue-200 bg-clip-text text-transparent">
            The Technology Behind
            <br />
            <span className="bg-gradient-to-r from-green-400 to-blue-400 bg-clip-text text-transparent">
              The Intelligence
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            This isn't another productivity app with basic features. It's built with state-of-the-art AI research and enterprise-grade infrastructure.
          </p>
        </div>

        {/* Development timeline */}
        <div ref={timelineRef} className="mb-20">
          <div className="text-center mb-12">
            <h3 className="text-3xl font-bold text-white mb-4">Development Milestones</h3>
            <p className="text-gray-400">How months of research led to this breakthrough</p>
          </div>
          
          <div className="space-y-12">
            {developmentJourney.map((item, index) => (
              <div key={index} className="timeline-item flex items-start gap-8">
                <div className="flex-shrink-0">
                  <div className={`w-16 h-16 bg-gradient-to-br ${item.color} rounded-2xl flex items-center justify-center`}>
                    <item.icon className="w-8 h-8 text-white" />
                  </div>
                </div>
                
                <div className="flex-1 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm">
                  <div className="flex items-center gap-4 mb-4">
                    <span className="text-sm font-semibold text-green-400 bg-green-400/20 px-3 py-1 rounded-full">
                      {item.date}
                    </span>
                    <h4 className="text-xl font-bold text-white">{item.title}</h4>
                  </div>
                  <p className="text-gray-300 leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Technical credibility */}
        <div className="mb-20">
          <div className="bg-gradient-to-br from-gray-900/50 via-green-900/20 to-blue-900/20 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <div className="text-center mb-8">
              <h3 className="text-2xl font-bold text-white mb-4">Built with Latest AI Research</h3>
              <p className="text-gray-400">Not just another CRUD app with ChatGPT slapped on top</p>
            </div>
            
            <div className="grid md:grid-cols-2 gap-8 items-center">
              {/* Technical specs */}
              <div className="space-y-4">
                {techCredibility.map((spec, index) => (
                  <div key={index} className="flex items-center gap-3">
                    <CheckCircleIcon className="w-6 h-6 text-green-400 flex-shrink-0" />
                    <span className="text-gray-300">{spec}</span>
                  </div>
                ))}
              </div>
              
              {/* Code snippet showcase */}
              <div className="bg-black/40 rounded-xl p-6 code-glow">
                <div className="text-green-400 text-sm font-mono mb-4"># AI Agent Orchestration</div>
                <div className="space-y-2 text-sm font-mono">
                  <div className="text-blue-400">class <span className="text-yellow-400">AIPlanner</span>:</div>
                  <div className="text-gray-300 ml-4">def <span className="text-purple-400">process</span>(objective):</div>
                  <div className="text-gray-300 ml-8">context = <span className="text-green-400">ContextAgent</span>.analyze()</div>
                  <div className="text-gray-300 ml-8">plan = <span className="text-green-400">PlanningAgent</span>.create()</div>
                  <div className="text-gray-300 ml-8">return <span className="text-green-400">OptimizationAgent</span>.refine()</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Development stats */}
        <div className="grid md:grid-cols-4 gap-8 mb-16">
          <div className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="text-4xl font-bold text-green-400 mb-2 stat-number">2000</div>
            <div className="text-white font-semibold mb-1">Hours of Development</div>
            <div className="text-gray-400 text-sm">Research and coding</div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="text-4xl font-bold text-blue-400 mb-2 stat-number">47</div>
            <div className="text-white font-semibold mb-1">AI Model Iterations</div>
            <div className="text-gray-400 text-sm">Until optimal performance</div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="text-4xl font-bold text-purple-400 mb-2 stat-number">15</div>
            <div className="text-white font-semibold mb-1">System Integrations</div>
            <div className="text-gray-400 text-sm">Tools and platforms</div>
          </div>
          
          <div className="text-center p-6 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur-sm">
            <div className="text-4xl font-bold text-cyan-400 mb-2 stat-number">3</div>
            <div className="text-white font-semibold mb-1">AI Research Papers</div>
            <div className="text-gray-400 text-sm">Implemented in the system</div>
          </div>
        </div>
      </div>
    </div>
  );
} 