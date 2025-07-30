'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  BarsArrowDownIcon, 
  ChevronRightIcon,
  ChevronDownIcon,
  SparklesIcon,
  BoltIcon,
  CheckCircleIcon,
  PlusIcon,
  ArrowsPointingOutIcon
} from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function HierarchicalTasks() {
  const [expandedNodes, setExpandedNodes] = useState<Set<string>>(new Set(['1', '1.1', '2']));
  const sectionRef = useRef<HTMLDivElement>(null);
  const treeRef = useRef<HTMLDivElement>(null);
  const featuresRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Tree reveal animation
      ScrollTrigger.create({
        trigger: treeRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.task-node', {
            x: -50,
            opacity: 0,
            duration: 0.8,
            ease: "power3.out",
            stagger: 0.1
          });
        }
      });

      // Connection lines animation
      gsap.to('.connection-line', {
        scaleX: 1,
        duration: 1,
        ease: "power2.out",
        delay: 0.5
      });

      // AI suggestions animation
      gsap.to('.ai-suggestion-pulse', {
        scale: 1.1,
        opacity: 0.8,
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Features reveal
      ScrollTrigger.create({
        trigger: featuresRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.hierarchy-feature', {
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

  const toggleNode = (nodeId: string) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    setExpandedNodes(newExpanded);
  };

  const hierarchyFeatures = [
    {
      icon: ArrowsPointingOutIcon,
      title: "Infinite Nesting",
      description: "Break down any task into subtasks, and those into sub-subtasks, with no limits",
      benefits: "Complete granular control"
    },
    {
      icon: SparklesIcon,
      title: "AI Task Breakdown",
      description: "AI automatically suggests logical task decomposition based on your objective",
      benefits: "Smart task structuring"
    },
    {
      icon: BoltIcon,
      title: "Dynamic Reorganization",
      description: "Drag and drop to restructure your hierarchy, AI adapts dependencies automatically",
      benefits: "Flexible project structure"
    },
    {
      icon: BarsArrowDownIcon,
      title: "Context Preservation",
      description: "Each level maintains context from parent tasks for intelligent sub-task creation",
      benefits: "Coherent task relationships"
    }
  ];

  // Sample hierarchical task data
  const taskHierarchy = [
    {
      id: '1',
      title: 'Launch Product Website',
      completed: false,
      hasAISuggestion: true,
      level: 0,
      children: [
        {
          id: '1.1',
          title: 'Design & Development',
          completed: false,
          hasAISuggestion: false,
          level: 1,
          children: [
            {
              id: '1.1.1',
              title: 'Create wireframes',
              completed: true,
              hasAISuggestion: false,
              level: 2,
              children: []
            },
            {
              id: '1.1.2', 
              title: 'Design mockups',
              completed: true,
              hasAISuggestion: false,
              level: 2,
              children: []
            },
            {
              id: '1.1.3',
              title: 'Frontend development',
              completed: false,
              hasAISuggestion: true,
              level: 2,
              children: [
                {
                  id: '1.1.3.1',
                  title: 'Set up React project',
                  completed: true,
                  hasAISuggestion: false,
                  level: 3,
                  children: []
                },
                {
                  id: '1.1.3.2',
                  title: 'Build landing page',
                  completed: false,
                  hasAISuggestion: false,
                  level: 3,
                  children: []
                },
                {
                  id: '1.1.3.3',
                  title: 'Add responsive design',
                  completed: false,
                  hasAISuggestion: false,
                  level: 3,
                  children: []
                }
              ]
            }
          ]
        },
        {
          id: '1.2',
          title: 'Content Creation',
          completed: false,
          hasAISuggestion: false,
          level: 1,
          children: [
            {
              id: '1.2.1',
              title: 'Write copy',
              completed: false,
              hasAISuggestion: false,
              level: 2,
              children: []
            },
            {
              id: '1.2.2',
              title: 'Create visuals',
              completed: false,
              hasAISuggestion: false,
              level: 2,
              children: []
            }
          ]
        }
      ]
    },
    {
      id: '2',
      title: 'Marketing Campaign',
      completed: false,
      hasAISuggestion: true,
      level: 0,
      children: [
        {
          id: '2.1',
          title: 'Social Media Strategy',
          completed: false,
          hasAISuggestion: false,
          level: 1,
          children: []
        },
        {
          id: '2.2',
          title: 'Email Campaign',
          completed: false,
          hasAISuggestion: false,
          level: 1,
          children: []
        }
      ]
    }
  ];

  const renderTask = (task: any) => {
    const isExpanded = expandedNodes.has(task.id);
    const hasChildren = task.children && task.children.length > 0;
    const indentLevel = task.level * 24;

    return (
      <div key={task.id} className="task-node">
        <div 
          className="flex items-center gap-3 p-3 rounded-lg hover:bg-white/5 transition-colors relative"
          style={{ marginLeft: `${indentLevel}px` }}
        >
          {/* Connection line */}
          {task.level > 0 && (
            <div 
              className="connection-line absolute bg-gray-600 h-px transform origin-left scale-x-0"
              style={{ 
                left: `${-12}px`, 
                top: '50%',
                width: '12px'
              }}
            />
          )}
          
          {/* Expand/collapse button */}
          {hasChildren ? (
            <button
              onClick={() => toggleNode(task.id)}
              className="w-5 h-5 flex items-center justify-center text-gray-400 hover:text-white transition-colors"
            >
              {isExpanded ? (
                <ChevronDownIcon className="w-4 h-4" />
              ) : (
                <ChevronRightIcon className="w-4 h-4" />
              )}
            </button>
          ) : (
            <div className="w-5 h-5" />
          )}

          {/* Task checkbox */}
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center ${
            task.completed 
              ? 'bg-green-500 border-green-500' 
              : 'border-gray-400 hover:border-white'
          } transition-colors`}>
            {task.completed && (
              <CheckCircleIcon className="w-3 h-3 text-white" />
            )}
          </div>

          {/* Task title */}
          <span className={`flex-1 ${task.completed ? 'text-gray-400 line-through' : 'text-white'}`}>
            {task.title}
          </span>

          {/* AI suggestion indicator */}
          {task.hasAISuggestion && (
            <div className="ai-suggestion-pulse w-2 h-2 bg-blue-400 rounded-full"></div>
          )}

          {/* Add subtask button */}
          <button className="w-6 h-6 flex items-center justify-center text-gray-500 hover:text-white transition-colors opacity-0 group-hover:opacity-100">
            <PlusIcon className="w-4 h-4" />
          </button>
        </div>

        {/* Render children if expanded */}
        {isExpanded && hasChildren && (
          <div className="space-y-1">
            {task.children.map((child: any) => renderTask(child))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div ref={sectionRef} className="relative py-32 bg-gradient-to-b from-slate-900 via-violet-950 to-slate-900 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-violet-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main headline */}
        <div className="text-center mb-20">
          <div className="inline-flex items-center gap-2 bg-violet-500/10 border border-violet-500/20 rounded-full px-6 py-2 mb-8">
            <BarsArrowDownIcon className="w-5 h-5 text-violet-400" />
            <span className="text-violet-300 font-semibold">Hierarchical Organization</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white via-violet-100 to-purple-200 bg-clip-text text-transparent">
            Break Down Any Goal Into
            <br />
            <span className="bg-gradient-to-r from-violet-400 to-purple-400 bg-clip-text text-transparent">
              Actionable Steps
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto leading-relaxed">
            Transform overwhelming projects into manageable hierarchies. AI helps you decompose any objective into perfectly structured, nested tasks with infinite depth.
          </p>
        </div>

        {/* Interactive task tree demo */}
        <div ref={treeRef} className="mb-20">
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl p-8 backdrop-blur-sm">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-2xl font-bold text-white mb-2">Project Task Hierarchy</h3>
                <p className="text-gray-400">Click to expand and explore infinite nesting levels</p>
              </div>
              <div className="flex items-center gap-2 text-violet-300">
                <SparklesIcon className="w-5 h-5" />
                <span className="text-sm">AI-Generated Structure</span>
              </div>
            </div>

            <div className="grid lg:grid-cols-3 gap-8">
              {/* Task tree */}
              <div className="lg:col-span-2">
                <div className="bg-white/5 rounded-2xl p-6 max-h-96 overflow-y-auto">
                  <div className="space-y-1 group">
                    {taskHierarchy.map(task => renderTask(task))}
                  </div>
                </div>
              </div>

              {/* AI breakdown panel */}
              <div className="space-y-4">
                <h4 className="text-lg font-bold text-white mb-4">AI Task Breakdown</h4>
                
                <div className="bg-violet-500/20 border border-violet-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <SparklesIcon className="w-5 h-5 text-violet-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-white font-semibold mb-1">Smart Decomposition</h5>
                      <p className="text-violet-200 text-sm mb-2">I can break down "Frontend development" into 8 more specific subtasks. Would you like me to add them?</p>
                      <button className="text-violet-300 text-xs hover:text-white transition-colors">Add AI suggestions →</button>
                    </div>
                  </div>
                </div>

                <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <BoltIcon className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-white font-semibold mb-1">Dependency Mapping</h5>
                      <p className="text-blue-200 text-sm mb-2">I notice some tasks can run in parallel. Should I reorganize the structure for better efficiency?</p>
                      <button className="text-blue-300 text-xs hover:text-white transition-colors">Optimize structure →</button>
                    </div>
                  </div>
                </div>

                <div className="bg-green-500/20 border border-green-500/30 rounded-xl p-4">
                  <div className="flex items-start gap-3">
                    <CheckCircleIcon className="w-5 h-5 text-green-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <h5 className="text-white font-semibold mb-1">Progress Tracking</h5>
                      <p className="text-green-200 text-sm mb-2">Design & Development is 67% complete. Great progress! 3 subtasks remaining.</p>
                      <button className="text-green-300 text-xs hover:text-white transition-colors">View details →</button>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Task statistics */}
            <div className="mt-8 pt-8 border-t border-white/10">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
                <div>
                  <div className="text-2xl font-bold text-violet-400 mb-1">12</div>
                  <div className="text-gray-400 text-sm">Total Tasks</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-green-400 mb-1">4</div>
                  <div className="text-gray-400 text-sm">Completed</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-blue-400 mb-1">4</div>
                  <div className="text-gray-400 text-sm">Nesting Levels</div>
                </div>
                <div>
                  <div className="text-2xl font-bold text-purple-400 mb-1">67%</div>
                  <div className="text-gray-400 text-sm">Overall Progress</div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hierarchy features */}
        <div ref={featuresRef} className="grid md:grid-cols-2 gap-8 mb-16">
          {hierarchyFeatures.map((feature, index) => (
            <div key={index} className="hierarchy-feature">
              <div className="p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur-sm hover:from-white/15 hover:to-white/10 transition-all duration-500">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-violet-500 to-purple-500 rounded-xl flex items-center justify-center flex-shrink-0">
                    <feature.icon className="w-6 h-6 text-white" />
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-xl font-bold text-white mb-2">{feature.title}</h4>
                    <p className="text-gray-300 mb-4 leading-relaxed">{feature.description}</p>
                    <div className="inline-flex items-center bg-violet-500/20 border border-violet-500/30 rounded-full px-4 py-2">
                      <span className="text-violet-300 text-sm font-semibold">{feature.benefits}</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Hierarchical thinking promise */}
        <div className="text-center p-12 bg-gradient-to-br from-violet-900/30 via-purple-900/20 to-violet-900/30 border border-white/10 rounded-3xl backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-white mb-6">Think Hierarchically, Act Systematically</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-4xl mx-auto leading-relaxed">
            The human brain naturally thinks in hierarchies. Our AI-powered task decomposition mirrors this natural thought process, making complex projects feel manageable and clear.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-6 justify-center items-center">
            <div className="inline-flex items-center gap-2 text-violet-300 font-semibold">
              <ArrowsPointingOutIcon className="w-5 h-5" />
              <span>Infinite depth</span>
            </div>
            <div className="inline-flex items-center gap-2 text-purple-300 font-semibold">
              <SparklesIcon className="w-5 h-5" />
              <span>AI-assisted breakdown</span>
            </div>
            <div className="inline-flex items-center gap-2 text-pink-300 font-semibold">
              <BarsArrowDownIcon className="w-5 h-5" />
              <span>Logical structure</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 