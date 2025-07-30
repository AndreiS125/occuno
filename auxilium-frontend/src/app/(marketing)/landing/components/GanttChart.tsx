'use client';

import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  ChartBarIcon, 
  ClockIcon, 
  SparklesIcon,
  BoltIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  ArrowRightIcon
} from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function GanttChart() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const ganttRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Gantt bars animation
      ScrollTrigger.create({
        trigger: ganttRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.gantt-bar', {
            width: 0,
            duration: 1.5,
            ease: "power2.out",
            stagger: 0.2
          });
        }
      });

      // Progress animations
      gsap.to('.progress-indicator', {
        x: 3,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.3
      });

      // Dependencies animation
      gsap.to('.dependency-line', {
        strokeDashoffset: 0,
        duration: 2,
        ease: "power2.out",
        stagger: 0.5,
        repeat: -1,
        repeatDelay: 3
      });

      // Features reveal
      ScrollTrigger.create({
        trigger: featuresRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.gantt-feature', {
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

  const ganttFeatures = [
    {
      icon: SparklesIcon,
      title: "AI Project Planning",
      description: "AI automatically breaks down projects into optimal task sequences with realistic timelines",
      benefits: "Smart dependency mapping, accurate estimates"
    },
    {
      icon: BoltIcon,
      title: "Real-time Adjustments",
      description: "When deadlines change, AI instantly recalculates the entire project timeline",
      benefits: "Dynamic rescheduling, conflict resolution"
    },
    {
      icon: ClockIcon,
      title: "Critical Path Detection",
      description: "AI identifies bottlenecks and suggests optimizations to keep projects on track",
      benefits: "Prevents delays, optimizes resources"
    },
    {
      icon: CheckCircleIcon,
      title: "Visual Progress Tracking",
      description: "Beautiful, interactive charts that update automatically as tasks are completed",
      benefits: "Clear visibility, stakeholder updates"
    }
  ];

  // Sample Gantt data
  const ganttTasks = [
    {
      id: 1,
      name: "Project Planning",
      duration: 5,
      start: 0,
      progress: 100,
      color: "bg-green-500",
      status: "completed",
      dependencies: []
    },
    {
      id: 2,
      name: "Design Phase",
      duration: 8,
      start: 3,
      progress: 75,
      color: "bg-blue-500",
      status: "in-progress",
      dependencies: [1]
    },
    {
      id: 3,
      name: "User Research",
      duration: 6,
      start: 5,
      progress: 60,
      color: "bg-purple-500",
      status: "in-progress",
      dependencies: [1]
    },
    {
      id: 4,
      name: "Frontend Development",
      duration: 12,
      start: 11,
      progress: 30,
      color: "bg-cyan-500",
      status: "upcoming",
      dependencies: [2]
    },
    {
      id: 5,
      name: "Backend Development",
      duration: 10,
      start: 9,
      progress: 45,
      color: "bg-orange-500",
      status: "in-progress",
      dependencies: [2]
    },
    {
      id: 6,
      name: "Testing & QA",
      duration: 4,
      start: 20,
      progress: 0,
      color: "bg-red-500",
      status: "upcoming",
      dependencies: [4, 5]
    }
  ];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed': return CheckCircleIcon;
      case 'in-progress': return ClockIcon;
      case 'upcoming': return ExclamationTriangleIcon;
      default: return ClockIcon;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'text-green-400';
      case 'in-progress': return 'text-blue-400';
      case 'upcoming': return 'text-orange-400';
      default: return 'text-gray-400';
    }
  };

  return (
    <div ref={sectionRef} className="relative py-32 bg-gradient-to-b from-slate-900 via-emerald-950 to-slate-900 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 left-1/4 w-96 h-96 bg-green-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main headline */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-full px-6 py-2 mb-8">
            <ChartBarIcon className="w-5 h-5 text-emerald-400" />
            <span className="text-emerald-300 font-semibold">Visual Project Management</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white via-emerald-100 to-green-200 bg-clip-text text-transparent">
            See Your Projects
            <br />
            <span className="bg-gradient-to-r from-emerald-400 to-green-400 bg-clip-text text-transparent">
              Come to Life
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Transform complex projects into clear, visual timelines. AI automatically optimizes schedules and keeps everything on track.
          </p>
        </div>

        {/* Interactive Gantt chart demo */}
        <div ref={ganttRef} className="mb-20">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Website Redesign Project</h3>
                <p className="text-gray-400">AI-optimized timeline with smart dependencies</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2 text-emerald-300">
                  <SparklesIcon className="w-5 h-5" />
                  <span className="text-sm">AI Optimized</span>
                </div>
                <div className="text-white text-sm">
                  <span className="text-gray-400">Progress:</span> 52%
                </div>
              </div>
            </div>

            {/* Timeline header */}
            <div className="mb-6">
              <div className="grid grid-cols-12 gap-2 text-center text-gray-400 text-sm">
                {Array.from({ length: 12 }, (_, i) => (
                  <div key={i} className="py-2">
                    Week {i + 1}
                  </div>
                ))}
              </div>
            </div>

            {/* Gantt chart tasks */}
            <div className="space-y-4 mb-8">
              {ganttTasks.map((task, index) => {
                const StatusIcon = getStatusIcon(task.status);
                
                return (
                  <div key={task.id} className="relative">
                    <div className="flex items-center gap-4 mb-2">
                      <div className="w-48 flex items-center gap-3">
                        <StatusIcon className={`w-5 h-5 ${getStatusColor(task.status)}`} />
                        <span className="text-white font-medium text-sm">{task.name}</span>
                      </div>
                      
                      {/* Gantt timeline */}
                      <div className="flex-1 relative h-8">
                        <div className="absolute inset-0 grid grid-cols-24 gap-px">
                          {Array.from({ length: 24 }, (_, i) => (
                            <div key={i} className="bg-white/5 rounded-sm"></div>
                          ))}
                        </div>
                        
                        {/* Task bar */}
                        <div
                          className={`gantt-bar absolute top-1 bottom-1 ${task.color} rounded-md shadow-lg flex items-center justify-between px-2 transition-all duration-300 hover:shadow-xl`}
                          style={{
                            left: `${(task.start / 24) * 100}%`,
                            width: `${(task.duration / 24) * 100}%`
                          }}
                        >
                          <span className="text-white text-xs font-semibold">
                            {task.progress}%
                          </span>
                          
                          {/* Progress indicator */}
                          {task.status === 'in-progress' && (
                            <div className="progress-indicator w-2 h-2 bg-white rounded-full opacity-80"></div>
                          )}
                        </div>
                      </div>
                      
                      <div className="w-16 text-gray-400 text-sm text-right">
                        {task.duration}d
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Dependencies visualization */}
            <svg className="absolute inset-0 pointer-events-none" style={{ zIndex: 1 }}>
              {ganttTasks.map((task) =>
                task.dependencies.map((depId) => {
                  const depTask = ganttTasks.find(t => t.id === depId);
                  if (!depTask) return null;
                  
                  const depEndX = ((depTask.start + depTask.duration) / 24) * 100;
                  const taskStartX = (task.start / 24) * 100;
                  const depY = (ganttTasks.findIndex(t => t.id === depId) + 1) * 60;
                  const taskY = (ganttTasks.findIndex(t => t.id === task.id) + 1) * 60;
                  
                  return (
                    <path
                      key={`${task.id}-${depId}`}
                      className="dependency-line"
                      d={`M ${depEndX}% ${depY} L ${taskStartX}% ${taskY}`}
                      stroke="#10B981"
                      strokeWidth="2"
                      strokeDasharray="5,5"
                      strokeDashoffset="10"
                      fill="none"
                      opacity="0.6"
                    />
                  );
                })
              )}
            </svg>

            {/* AI insights panel */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <h4 className="text-lg font-bold text-white mb-4">AI Insights & Recommendations</h4>
              <div className="grid md:grid-cols-2 gap-4">
                <div className="bg-emerald-500/20 border border-emerald-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-emerald-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-white font-semibold mb-1">On Track</h5>
                      <p className="text-emerald-200 text-sm">Project is 52% complete and on schedule for the December 15th deadline.</p>
                    </div>
                  </div>
                </div>

                <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <ExclamationTriangleIcon className="w-5 h-5 text-orange-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-white font-semibold mb-1">Optimization Available</h5>
                      <p className="text-orange-200 text-sm">Frontend and Backend can run in parallel for 3 days. This would save 2 weeks.</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Gantt features */}
        <div ref={featuresRef} className="grid md:grid-cols-2 gap-8 mb-16">
          {ganttFeatures.map((feature, index) => (
            <div key={index} className="gantt-feature">
              <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:from-white/15 hover:to-white/10 transition-all duration-500">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-emerald-500 to-green-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">{feature.title}</h4>
                    <p className="text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
                    <div className="inline-flex items-center bg-emerald-500/20 border border-emerald-500/30 rounded-full px-4 py-2">
                      <span className="text-emerald-300 text-sm font-semibold">{feature.benefits}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Project management promise */}
        <div className="text-center p-12 bg-gradient-to-br from-emerald-900/30 via-green-900/20 to-emerald-900/30 border border-white/10 rounded-3xl backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-white mb-6">Project Management, Simplified</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            No more complex project management tools that take weeks to learn. Our AI creates beautiful, interactive timelines that anyone can understand at a glance.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="inline-flex items-center gap-2 text-emerald-300 font-semibold">
              <ChartBarIcon className="w-5 h-5" />
              <span>Visual clarity</span>
            </div>
            <div className="inline-flex items-center gap-2 text-green-300 font-semibold">
              <SparklesIcon className="w-5 h-5" />
              <span>AI optimization</span>
            </div>
            <div className="inline-flex items-center gap-2 text-blue-300 font-semibold">
              <ArrowRightIcon className="w-5 h-5" />
              <span>Real-time updates</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 