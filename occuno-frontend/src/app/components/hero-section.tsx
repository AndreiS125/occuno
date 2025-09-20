"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Brain, 
  ArrowRight, 
  CheckCircle2,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface HeroSectionProps {
  className?: string;
}

export default function HeroSection({ className }: HeroSectionProps) {
  const [currentDemo, setCurrentDemo] = useState(0);
  const [currentStep, setCurrentStep] = useState(0);
  const [viewMode, setViewMode] = useState<'calendar' | 'objectives'>('calendar');
  const [calendarEvents, setCalendarEvents] = useState<any[]>([]);

  const demoScenarios = [
    {
      userMessage: "I want to launch my consulting business",
      aiResponse: "I'll create a comprehensive launch plan for you. Let me schedule the key phases:",
      objectives: [
        { 
          title: "Business Foundation", 
          description: "Legal setup and compliance",
          tasks: ["Business registration", "Legal structure", "Tax setup"],
          color: "#8B5CF6",
          day: 1,
          time: "09:00",
          duration: 2
        },
        { 
          title: "Market Research", 
          description: "Competitor and target analysis", 
          tasks: ["Market analysis", "Competitor research", "Target clients"],
          color: "#06B6D4",
          day: 2,
          time: "10:00",
          duration: 3
        },
        { 
          title: "Brand Development", 
          description: "Identity and digital presence",
          tasks: ["Brand identity", "Website", "Service packages"],
          color: "#10B981",
          day: 4,
          time: "14:00",
          duration: 4
        },
        { 
          title: "Launch Strategy", 
          description: "Go-to-market execution",
          tasks: ["Pricing strategy", "Client acquisition", "Marketing"],
          color: "#F59E0B",
          day: 6,
          time: "11:00",
          duration: 3
        }
      ]
    },
    {
      userMessage: "Help me plan my wedding in 6 months",
      aiResponse: "Congratulations! I'll organize your wedding timeline with key milestones:",
      objectives: [
        { 
          title: "Venue & Vendors", 
          description: "Core vendor selection",
          tasks: ["Venue booking", "Photographer", "Catering"],
          color: "#EC4899",
          day: 1,
          time: "10:00",
          duration: 3
        },
        { 
          title: "Invitations", 
          description: "Guest management",
          tasks: ["Design", "Printing", "RSVP tracking"],
          color: "#8B5CF6",
          day: 3,
          time: "15:00",
          duration: 2
        },
        { 
          title: "Final Details", 
          description: "Last-minute preparations",
          tasks: ["Menu tasting", "Dress fitting", "Rehearsal"],
          color: "#06B6D4",
          day: 5,
          time: "13:00",
          duration: 4
        },
        { 
          title: "Wedding Day", 
          description: "Execution and coordination",
          tasks: ["Setup", "Ceremony", "Reception"],
          color: "#10B981",
          day: 7,
          time: "08:00",
          duration: 12
        }
      ]
    }
  ];

  // Demo Animation Logic
  useEffect(() => {
    const interval = setInterval(() => {
      if (currentStep < demoScenarios[currentDemo].objectives.length) {
        setCurrentStep(prev => prev + 1);
      } else {
        setCurrentDemo((prev) => (prev + 1) % demoScenarios.length);
        setCurrentStep(0);
        setCalendarEvents([]);
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [currentDemo, currentStep]);

  // Update calendar events as objectives are added
  useEffect(() => {
    const currentObjectives = demoScenarios[currentDemo].objectives.slice(0, currentStep);
    setCalendarEvents(currentObjectives);
  }, [currentDemo, currentStep]);

  return (
    <section className={`relative min-h-screen flex items-center justify-center px-6 py-20 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Hero Content */}
          <div className="space-y-8">
            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-light leading-tight tracking-tight">
                <span className="text-aura-primary font-medium">
                  AI Planning
                </span>
                <br />
                <span className="text-foreground">
                  That Actually Works
                </span>
              </h1>
              
              <p className="text-lg text-muted-foreground max-w-lg leading-relaxed">
                Stop overthinking. Start executing. Get comprehensive project breakdowns in seconds, not hours.
              </p>
            </div>

            {/* Value Props */}
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                <span className="text-sm">Instant task decomposition</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                <span className="text-sm">Research-backed recommendations</span>
              </div>
              <div className="flex items-center space-x-3">
                <div className="w-1.5 h-1.5 bg-accent rounded-full" />
                <span className="text-sm">Adaptive timeline management</span>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-4">
              <Button 
                size="lg" 
                className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 text-base font-medium group transition-all duration-200"
              >
                Start Planning
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>

          {/* Right: Weekly Calendar + Chat Demo */}
          <div className="relative bg-card border border-border rounded-lg overflow-hidden h-[600px]">
            <div className="flex h-full">
              {/* Chat Sidebar */}
              <div className="w-80 border-r border-border flex flex-col">
                {/* Chat Header */}
                <div className="bg-muted/30 border-b border-border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div className="w-2 h-2 bg-green-500 rounded-full" />
                      <span className="text-sm font-medium">Occuno AI</span>
                    </div>
                    <button 
                      onClick={() => setViewMode(viewMode === 'calendar' ? 'objectives' : 'calendar')}
                      className="text-xs bg-accent/20 px-2 py-1 rounded hover:bg-accent/30 transition-colors"
                    >
                      {viewMode === 'calendar' ? 'Show Gantt' : 'Show Calendar'}
                    </button>
                  </div>
                </div>

                {/* Chat Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3">
                  <div className="flex justify-end">
                    <div className="bg-primary text-primary-foreground px-3 py-2 rounded-lg text-sm max-w-[85%]">
                      {demoScenarios[currentDemo].userMessage}
                    </div>
                  </div>
                  
                  <div className="flex justify-start">
                    <div className="bg-muted text-foreground px-3 py-2 rounded-lg text-sm max-w-[85%]">
                      {demoScenarios[currentDemo].aiResponse}
                    </div>
                  </div>

                  {/* Live objective creation */}
                  {calendarEvents.map((objective, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="flex justify-start"
                    >
                      <div className="bg-background border border-border rounded-lg p-3 text-sm max-w-[90%]">
                        <div className="flex items-center space-x-2 mb-2">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: objective.color }}
                          />
                          <span className="font-medium text-aura-primary">{objective.title}</span>
                        </div>
                        <p className="text-xs text-muted-foreground mb-2">{objective.description}</p>
                        <div className="text-xs text-muted-foreground">
                          📅 Day {objective.day} at {objective.time} ({objective.duration}h)
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* Chat Input */}
                <div className="border-t border-border p-3">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 bg-muted/50 border border-border rounded px-3 py-2">
                      <span className="text-xs text-muted-foreground">Ask AI to plan...</span>
                    </div>
                    <Button size="sm" disabled className="px-2">
                      <ArrowRight className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Main View Area */}
              <div className="flex-1 flex flex-col">
                {/* View Header */}
                <div className="bg-muted/20 border-b border-border px-4 py-3">
                  <div className="flex items-center justify-between">
                    <h3 className="font-medium">
                      {viewMode === 'calendar' ? 'Weekly Calendar' : 'Project Objectives'}
                    </h3>
                    <div className="text-xs text-muted-foreground">
                      {viewMode === 'calendar' ? 'Week of Jan 15-21' : 'Hierarchical View'}
                    </div>
                  </div>
                </div>

                {/* Calendar/Objectives View */}
                <div className="flex-1 p-4">
                  {viewMode === 'calendar' ? (
                    /* Weekly Calendar View */
                    <div className="h-full">
                      {/* Time Column + Days Header */}
                      <div className="grid grid-cols-8 gap-1 mb-2">
                        <div className="text-xs text-center text-muted-foreground p-2"></div>
                        {['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'].map((day, index) => (
                          <div key={day} className="text-xs text-center text-muted-foreground p-2 font-medium">
                            {day} {15 + index}
                          </div>
                        ))}
                      </div>

                      {/* Time Grid */}
                      <div className="grid grid-cols-8 gap-1 h-full">
                        {/* Time Labels */}
                        <div className="space-y-12">
                          {['9 AM', '12 PM', '3 PM', '6 PM'].map((time) => (
                            <div key={time} className="text-xs text-muted-foreground text-right pr-2">
                              {time}
                            </div>
                          ))}
                        </div>

                        {/* Calendar Days */}
                        {Array.from({ length: 7 }, (_, dayIndex) => (
                          <div key={dayIndex} className="relative border-l border-border/30 min-h-full">
                            {/* Time blocks for events */}
                            {calendarEvents
                              .filter(event => event.day === dayIndex + 1)
                              .map((event, eventIndex) => {
                                const topOffset = (parseInt(event.time.split(':')[0]) - 9) * 48;
                                const height = event.duration * 16;
                                
                                return (
                                  <motion.div
                                    key={eventIndex}
                                    initial={{ opacity: 0, scale: 0.8 }}
                                    animate={{ opacity: 1, scale: 1 }}
                                    className="absolute left-1 right-1 rounded text-white text-xs p-2 font-medium"
                                    style={{
                                      backgroundColor: event.color,
                                      top: `${topOffset}px`,
                                      height: `${height}px`,
                                      minHeight: '32px'
                                    }}
                                  >
                                    <div className="truncate">{event.title}</div>
                                    <div className="text-xs opacity-90">{event.time}</div>
                                  </motion.div>
                                );
                              })}
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    /* Hierarchical Objectives View */
                    <div className="space-y-4">
                      <div className="text-sm text-muted-foreground mb-4">
                        Project: {demoScenarios[currentDemo].userMessage}
                      </div>
                      
                      {calendarEvents.map((objective, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          className="border border-border rounded-lg p-4"
                        >
                          <div className="flex items-center justify-between mb-3">
                            <div className="flex items-center space-x-3">
                              <div 
                                className="w-4 h-4 rounded" 
                                style={{ backgroundColor: objective.color }}
                              />
                              <h4 className="font-medium text-aura-primary">{objective.title}</h4>
                            </div>
                            <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                              Day {objective.day} • {objective.duration}h
                            </div>
                          </div>
                          
                          <p className="text-sm text-muted-foreground mb-3">{objective.description}</p>
                          
                          <div className="space-y-2">
                            <div className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                              Sub-tasks
                            </div>
                            <div className="grid gap-2">
                              {objective.tasks.map((task, taskIndex) => (
                                <div key={taskIndex} className="flex items-center space-x-2 text-sm">
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  <span>{task}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 