"use client";

import { useState, useEffect } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { 
  Clock, 
  Brain, 
  Target,
  TrendingDown,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Zap,
  X
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProblemSectionProps {
  className?: string;
}

export default function ProblemSection({ className }: ProblemSectionProps) {
  const [activeScenario, setActiveScenario] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const scenarios = [
    {
      title: "Startup Launch",
      before: {
        time: "Sunday 3PM",
        action: "Start planning business launch",
        problems: ["Research competitors", "Choose business model", "Plan marketing strategy", "Set up legal structure"]
      },
      after: {
        time: "Sunday 3:02PM", 
        action: "Complete launch plan ready",
        result: "6-month roadmap with 47 actionable tasks"
      }
    },
    {
      title: "Product Development",
      before: {
        time: "Monday 9AM",
        action: "Plan new feature development", 
        problems: ["Define requirements", "Estimate timeline", "Assign resources", "Risk assessment"]
      },
      after: {
        time: "Monday 9:03AM",
        action: "Development plan generated",
        result: "Sprint breakdown with dependencies mapped"
      }
    },
    {
      title: "Career Transition",
      before: {
        time: "Evening",
        action: "Plan career change to tech",
        problems: ["Skill gap analysis", "Learning roadmap", "Network building", "Portfolio projects"]
      },
      after: {
        time: "3 minutes later",
        action: "Transition plan complete", 
        result: "12-month pathway with skill milestones"
      }
    }
  ];

  const painPoints = [
    {
      icon: Clock,
      title: "Planning Paralysis",
      description: "Hours spent planning, minutes spent doing",
      impact: "Lost 5+ hours weekly"
    },
    {
      icon: Brain,
      title: "Decision Fatigue", 
      description: "Too many options, zero clarity on next steps",
      impact: "Delayed by weeks"
    },
    {
      icon: Target,
      title: "Tool Overload",
      description: "Switching between apps destroys focus",
      impact: "40% productivity loss"
    },
    {
      icon: TrendingDown,
      title: "Broken Systems",
      description: "Another productivity method abandoned",
      impact: "Back to square one"
    }
  ];

  // Auto-cycle through scenarios
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setActiveScenario((prev) => (prev + 1) % scenarios.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, scenarios.length]);

  return (
    <section className={`py-24 px-6 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl lg:text-6xl font-light leading-tight">
            <span className="text-foreground">
              Stop Planning.
            </span>
            <br />
            <span className="text-primary font-medium">
              Start Executing.
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            While you're stuck in planning paralysis, AI users are shipping products and closing deals.
          </p>
        </div>

        {/* The Problem: Interactive Pain Points */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl lg:text-3xl font-medium mb-4">
              <span className="text-destructive">The Planning Trap</span> That's Stealing Your Success
            </h3>
            <p className="text-lg text-muted-foreground">
              Every successful person faces these same planning challenges
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {painPoints.map((problem, index) => (
              <motion.div 
                key={index} 
                className="bg-destructive/5 border border-destructive/20 rounded-lg p-6 space-y-4 hover:bg-destructive/10 transition-colors cursor-pointer"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <div className="flex items-center space-x-3">
                  <problem.icon className="w-6 h-6 text-destructive" />
                  <AlertTriangle className="w-4 h-4 text-destructive/60" />
                </div>
                <div className="space-y-2">
                  <h4 className="text-lg font-medium text-destructive">{problem.title}</h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {problem.description}
                  </p>
                  <div className="text-xs font-medium text-destructive bg-destructive/10 px-2 py-1 rounded">
                    {problem.impact}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* The Solution: Interactive Before vs After */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-2xl lg:text-3xl font-medium mb-4">
              <span className="text-primary">AI Planning</span> Changes Everything
            </h3>
            <p className="text-lg text-muted-foreground">
              Watch how AI transforms planning from hours to seconds
            </p>
          </div>

          {/* Scenario Selector */}
          <div className="flex justify-center mb-8">
            <div className="bg-card border border-border rounded-lg p-2 flex space-x-2">
              {scenarios.map((scenario, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setActiveScenario(index);
                    setIsPlaying(false);
                    setTimeout(() => setIsPlaying(true), 2000);
                  }}
                  className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
                    activeScenario === index 
                      ? 'bg-primary text-primary-foreground' 
                      : 'text-muted-foreground hover:text-foreground'
                  }`}
                >
                  {scenario.title}
                </button>
              ))}
            </div>
          </div>

          {/* Interactive Comparison */}
          <div className="grid lg:grid-cols-2 gap-8 items-start">
            {/* Before: The Old Way */}
            <div className="bg-card border border-border rounded-lg p-8 space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <X className="w-6 h-6 text-destructive" />
                <h4 className="text-xl font-medium text-muted-foreground">The Old Way</h4>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScenario}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <Clock className="w-5 h-5 text-destructive" />
                      <span className="font-medium text-destructive">
                        {scenarios[activeScenario].before.time}
                      </span>
                    </div>
                    <p className="text-sm mb-4">{scenarios[activeScenario].before.action}</p>
                    
                    <div className="space-y-2">
                      {scenarios[activeScenario].before.problems.map((problem, idx) => (
                        <motion.div 
                          key={idx}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.2 }}
                          className="flex items-center space-x-2 text-xs text-muted-foreground"
                        >
                          <div className="w-1 h-1 bg-destructive rounded-full" />
                          <span>{problem}...</span>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                  
                  <div className="text-center py-4">
                    <div className="text-sm text-destructive font-medium">3-5 hours later...</div>
                    <div className="text-xs text-muted-foreground">Still planning, not executing</div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>

            {/* After: The AI Way */}
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 space-y-6">
              <div className="flex items-center space-x-3 mb-6">
                <Zap className="w-6 h-6 text-primary" />
                <h4 className="text-xl font-medium text-primary">With AI Planning</h4>
              </div>
              
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeScenario}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                    <div className="flex items-center space-x-3 mb-3">
                      <CheckCircle2 className="w-5 h-5 text-accent" />
                      <span className="font-medium text-accent">
                        {scenarios[activeScenario].after.time}
                      </span>
                    </div>
                    <p className="text-sm mb-4">{scenarios[activeScenario].after.action}</p>
                    
                    <div className="bg-accent/5 border border-accent/20 rounded p-3">
                      <div className="text-xs font-medium text-accent mb-1">Result:</div>
                      <div className="text-sm">{scenarios[activeScenario].after.result}</div>
                    </div>
                  </div>
                  
                  <div className="text-center py-4">
                    <div className="text-sm text-accent font-medium">Ready to execute immediately</div>
                    <div className="text-xs text-muted-foreground">From idea to action in seconds</div>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-6">
          <h3 className="text-2xl lg:text-3xl font-medium">
            How long will planning paralysis hold you back?
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Every week in planning chaos is a week your competitors pull ahead. It's time to fight back.
          </p>
          
          <div className="pt-4">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg font-medium group"
            >
              <Brain className="w-5 h-5 mr-3" />
              Break Free From Planning Hell
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
