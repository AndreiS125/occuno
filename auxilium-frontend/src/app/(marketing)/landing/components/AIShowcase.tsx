'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  SparklesIcon,
  UserIcon,
  ArrowPathIcon,
  CheckCircleIcon,
  BoltIcon,
  MagnifyingGlassIcon,
  ChartBarIcon,
  ExclamationTriangleIcon,
  XMarkIcon
} from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function AIShowcase() {
  const [currentMessageIndex, setCurrentMessageIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [rollbackedMessages, setRollbackedMessages] = useState<Set<number>>(new Set());
  const sectionRef = useRef<HTMLDivElement>(null);
  const chatRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Chat messages reveal animation
      ScrollTrigger.create({
        trigger: chatRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.chat-message', {
            y: 50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.3
          });
        }
      });

      // AI thinking animation
      gsap.to('.ai-thinking-dot', {
        scale: 1.2,
        opacity: 0.4,
        duration: 0.8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.2
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  // Auto-advance messages
  useEffect(() => {
    if (!isPlaying) return;
    
    const timer = setInterval(() => {
      setCurrentMessageIndex(prev => {
        if (prev < aiMessages.length - 1) {
          return prev + 1;
        }
        return prev;
      });
    }, 3000);

    return () => clearInterval(timer);
  }, [isPlaying, currentMessageIndex]);

  const handleRollback = (messageIndex: number) => {
    const newRollbacked = new Set(rollbackedMessages);
    if (newRollbacked.has(messageIndex)) {
      newRollbacked.delete(messageIndex);
    } else {
      newRollbacked.add(messageIndex);
    }
    setRollbackedMessages(newRollbacked);

    // Animate rollback
    gsap.to(`.message-${messageIndex}`, {
      x: -20,
      opacity: 0.6,
      duration: 0.3,
      ease: "power2.out",
      yoyo: true,
      repeat: 1
    });
  };

  const aiMessages = [
    {
      id: 1,
      type: 'user',
      content: "I need to launch a new marketing campaign for our product. Can you help me plan this?",
      timestamp: "2:34 PM"
    },
    {
      id: 2,
      type: 'ai-action',
      action: 'research',
      title: "Researching market trends",
      content: "I'm analyzing current marketing trends in your industry and gathering competitive intelligence.",
      details: "Found 3 recent reports on digital marketing effectiveness in your sector. Current trends show 40% higher engagement with video content.",
      impact: "Informed strategy with latest market data",
      timestamp: "2:34 PM",
      icon: MagnifyingGlassIcon,
      color: "from-purple-500 to-pink-500"
    },
    {
      id: 3,
      type: 'ai-action',
      action: 'planning',
      title: "Creating campaign structure",
      content: "Based on my research, I'm breaking down your campaign into phases with optimal timing and resource allocation.",
      details: "Organized into 4 phases: Research & Positioning (Week 1), Content Creation (Weeks 2-3), Launch & Promotion (Week 4), Analysis & Optimization (Week 5).",
      impact: "Clear roadmap with realistic timelines",
      timestamp: "2:35 PM",
      icon: ChartBarIcon,
      color: "from-blue-500 to-cyan-500"
    },
    {
      id: 4,
      type: 'ai-action',
      action: 'optimization',
      title: "Optimizing for your team",
      content: "I've adjusted the timeline based on your team's capacity and previous project performance patterns.",
      details: "Moved creative work to mornings when your team is most productive. Added buffer time for approvals based on your historical data.",
      impact: "30% more realistic timeline, reduced bottlenecks",
      timestamp: "2:36 PM",
      icon: BoltIcon,
      color: "from-green-500 to-emerald-500"
    },
    {
      id: 5,
      type: 'ai-suggestion',
      action: 'suggestion',
      title: "Budget optimization opportunity",
      content: "I noticed you could save 25% on ad spend by shifting budget from low-performing channels to video platforms.",
      details: "Your previous campaigns show video content performs 3x better than static ads. Reallocating $5K from display to video could increase ROI by 40%.",
      impact: "Potential $2K savings + 40% ROI increase",
      timestamp: "2:37 PM",
      icon: ExclamationTriangleIcon,
      color: "from-orange-500 to-red-500"
    }
  ];

  const getMessageIcon = (type: string) => {
    switch (type) {
      case 'research': return MagnifyingGlassIcon;
      case 'planning': return ChartBarIcon;
      case 'optimization': return BoltIcon;
      case 'suggestion': return ExclamationTriangleIcon;
      default: return SparklesIcon;
    }
  };

  return (
    <div ref={sectionRef} className="relative py-32 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-30">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-6xl mx-auto px-6 relative z-10">
        {/* Main headline */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-6 py-2 mb-8">
            <SparklesIcon className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-300 font-semibold">AI in Action</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
            Watch AI
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              Think and Act
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            See how AI analyzes, plans, and optimizes in real-time. Every action is transparent and can be rolled back with one click.
          </p>
        </div>

        {/* Chat Interface Demo */}
        <div ref={chatRef} className="mb-20">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl backdrop-blur-sm overflow-hidden">
            {/* Chat header */}
            <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                  <SparklesIcon className="w-5 h-5 text-white" />
                </div>
                <div>
                  <h3 className="text-white font-semibold">AI Planning Assistant</h3>
                  <div className="flex items-center gap-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full ai-thinking-dot"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full ai-thinking-dot"></div>
                    <div className="w-2 h-2 bg-green-400 rounded-full ai-thinking-dot"></div>
                    <span className="text-green-300 text-sm ml-1">AI Active</span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <button 
                  onClick={() => setIsPlaying(!isPlaying)}
                  className="text-indigo-300 hover:text-white text-sm transition-colors"
                >
                  {isPlaying ? 'Pause' : 'Play'} Demo
                </button>
                <div className="text-indigo-300 text-sm">
                  {currentMessageIndex}/{aiMessages.length - 1} messages
                </div>
              </div>
            </div>

            {/* Chat messages */}
            <div className="p-6 space-y-6 max-h-96 overflow-y-auto">
              {aiMessages.slice(0, currentMessageIndex + 1).map((message, index) => (
                <div key={message.id} className={`chat-message message-${index}`}>
                  {message.type === 'user' ? (
                    /* User message */
                    <div className="flex justify-end">
                      <div className="max-w-[70%] bg-blue-500 text-white rounded-2xl rounded-br-md px-4 py-3 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <UserIcon className="w-4 h-4" />
                          <span className="text-sm font-medium opacity-90">You</span>
                          <span className="text-xs opacity-70 ml-auto">{message.timestamp}</span>
                        </div>
                        <p className="text-sm leading-relaxed">{message.content}</p>
                      </div>
                    </div>
                  ) : (
                    /* AI action message */
                    <div className="flex justify-start">
                      <div className={`max-w-[85%] border rounded-2xl rounded-bl-md shadow-sm transition-all duration-300 ${
                        rollbackedMessages.has(index) 
                          ? 'bg-red-50 border-red-200 opacity-75' 
                          : 'bg-white/10 border-white/20'
                      }`}>
                        {/* AI message header */}
                        <div className="flex items-center gap-3 px-4 py-3 border-b border-white/10 bg-white/5 rounded-t-2xl">
                          <div className={`w-8 h-8 bg-gradient-to-br ${message.color} rounded-full flex items-center justify-center flex-shrink-0`}>
                            {(() => {
                              const IconComponent = message.icon || SparklesIcon;
                              return <IconComponent className="w-4 h-4 text-white" />;
                            })()}
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-white font-medium text-sm">{message.title}</span>
                              <div className="px-2 py-1 bg-indigo-500/20 border border-indigo-500/30 rounded-full">
                                <span className="text-indigo-300 text-xs font-semibold capitalize">{message.action}</span>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 mt-1">
                              <div className="flex items-center gap-1">
                                <CheckCircleIcon className="w-3 h-3 text-green-400" />
                                <span className="text-xs text-green-300">Completed</span>
                              </div>
                              <span className="text-xs text-gray-400">{message.timestamp}</span>
                            </div>
                          </div>
                        </div>

                        {/* AI message content */}
                        <div className="p-4">
                          <p className="text-gray-300 text-sm mb-3 leading-relaxed">{message.content}</p>
                          
                          {/* Details box */}
                          <div className="bg-black/20 rounded-lg p-3 mb-4">
                            <p className="text-gray-300 text-xs italic">"{message.details}"</p>
                          </div>

                          {/* Impact and actions */}
                          <div className="flex items-center justify-between">
                            <div className="text-green-300 text-sm font-semibold">
                              💡 {message.impact}
                            </div>
                            
                            <div className="flex gap-2">
                              <button 
                                onClick={() => handleRollback(index)}
                                className={`flex items-center gap-1 px-3 py-1 rounded-lg text-sm transition-colors ${
                                  rollbackedMessages.has(index)
                                    ? 'bg-green-500/20 border border-green-500/30 text-green-300 hover:bg-green-500/30'
                                    : 'bg-red-500/20 border border-red-500/30 text-red-300 hover:bg-red-500/30'
                                }`}
                              >
                                {rollbackedMessages.has(index) ? (
                                  <>
                                    <CheckCircleIcon className="w-4 h-4" />
                                    Restore
                                  </>
                                ) : (
                                  <>
                                    <ArrowPathIcon className="w-4 h-4" />
                                    Rollback
                                  </>
                                )}
                              </button>
                              <button className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors text-sm">
                                Apply
                              </button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))}

              {/* Typing indicator when playing */}
              {isPlaying && currentMessageIndex < aiMessages.length - 1 && (
                <div className="flex justify-start">
                  <div className="bg-white/10 border border-white/20 rounded-2xl rounded-bl-md px-4 py-3 shadow-sm">
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center">
                        <SparklesIcon className="w-3 h-3 text-white" />
                      </div>
                      <div className="flex gap-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full ai-thinking-dot"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full ai-thinking-dot"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full ai-thinking-dot"></div>
                      </div>
                      <span className="text-gray-400 text-sm">AI is thinking...</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Key benefits */}
        <div className="text-center p-12 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-indigo-900/30 border border-white/10 rounded-3xl backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-white mb-6">Complete Transparency & Control</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Every AI decision is shown in real-time. See the reasoning, understand the impact, and rollback anything you don't like.
          </p>
          
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="w-12 h-12 bg-indigo-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <SparklesIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-white font-semibold mb-2">Real-time Actions</h4>
              <p className="text-gray-400 text-sm">Watch AI work step-by-step with live updates</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-purple-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <CheckCircleIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-white font-semibold mb-2">Full Explanations</h4>
              <p className="text-gray-400 text-sm">Understand why AI made each decision</p>
            </div>
            
            <div className="text-center">
              <div className="w-12 h-12 bg-blue-500 rounded-full mx-auto mb-4 flex items-center justify-center">
                <ArrowPathIcon className="w-6 h-6 text-white" />
              </div>
              <h4 className="text-white font-semibold mb-2">One-Click Rollback</h4>
              <p className="text-gray-400 text-sm">Undo any change instantly, no questions asked</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 