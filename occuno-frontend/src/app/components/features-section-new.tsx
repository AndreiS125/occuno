"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar,
  BarChart3,
  GitBranch,
  Database,
  Layers,
  ArrowRight,
  Play,
  CheckCircle2,
  Clock,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FeaturesSectionProps {
  className?: string;
}

export default function FeaturesSection({ className }: FeaturesSectionProps) {
  const [activeFeature, setActiveFeature] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  const features = [
    {
      icon: Calendar,
      title: "Calendar Integration",
      description: "Import from Google Calendar and sync seamlessly",
      demo: {
        title: "Smart Calendar Sync",
        steps: [
          "Import existing calendar events",
          "AI identifies available time slots", 
          "Auto-schedule planned tasks",
          "Send calendar invites for meetings"
        ],
        result: "Your week is perfectly planned in 30 seconds"
      }
    },
    {
      icon: Database,
      title: "AI Research",
      description: "Research market trends and best practices automatically",
      demo: {
        title: "Intelligent Research",
        steps: [
          "Analyze your goal context",
          "Research industry best practices",
          "Find relevant case studies", 
          "Incorporate latest trends"
        ],
        result: "Research that would take hours, done in minutes"
      }
    },
    {
      icon: GitBranch,
      title: "Infinite Breakdown",
      description: "Break down complex goals into manageable tasks",
      demo: {
        title: "Smart Task Breakdown",
        steps: [
          "Analyze complex objective",
          "Identify key milestones",
          "Break into actionable tasks",
          "Estimate time and dependencies"
        ],
        result: "From overwhelming goal to clear action plan"
      }
    },
    {
      icon: BarChart3,
      title: "Progress Analytics",
      description: "Track progress with intelligent insights",
      demo: {
        title: "AI-Powered Insights",
        steps: [
          "Track completion rates",
          "Identify bottlenecks",
          "Predict timeline adjustments",
          "Suggest optimizations"
        ],
        result: "Stay on track with intelligent course corrections"
      }
    },
    {
      icon: Layers,
      title: "Notion Integration",
      description: "Sync with your existing Notion workspace",
      demo: {
        title: "Seamless Notion Sync",
        steps: [
          "Connect to your Notion workspace",
          "Sync tasks and projects",
          "Maintain formatting and structure",
          "Two-way real-time updates"
        ],
        result: "All your planning in one place, perfectly synced"
      }
    }
  ];

  // Auto-cycle through features
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % features.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying, features.length]);

  return (
    <section className={`py-24 px-6 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl lg:text-6xl font-light leading-tight">
            <span className="text-foreground">
              Everything You Need
            </span>
            <br />
            <span className="text-aura-primary font-medium">
              In One Place
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            AI planning is just the beginning. Get calendar views, analytics, integrations, and more.
          </p>
        </div>

        {/* Interactive Feature Demo */}
        <div className="mb-16">
          <div className="grid lg:grid-cols-2 gap-12 items-start">
            {/* Left: Feature Selection */}
            <div className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-2xl lg:text-3xl font-medium">See It In Action</h3>
                <p className="text-lg text-muted-foreground leading-relaxed">
                  Click any feature to see how AI transforms your workflow
                </p>
              </div>
              
              <div className="space-y-3">
                {features.map((feature, index) => (
                  <motion.div 
                    key={`feature-${index}-${feature.title}`}
                    className={`p-4 rounded-lg border cursor-pointer transition-all duration-200 ${
                      activeFeature === index 
                        ? 'bg-primary/5 border-primary/20' 
                        : 'bg-card border-border hover:border-border/60'
                    }`}
                    onClick={() => {
                      setActiveFeature(index);
                      setIsPlaying(false);
                      setTimeout(() => setIsPlaying(true), 3000);
                    }}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex items-center space-x-4">
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                        activeFeature === index ? 'bg-primary/20' : 'bg-primary/10'
                      }`}>
                        <feature.icon className={`w-5 h-5 ${
                          activeFeature === index ? 'text-primary' : 'text-primary/70'
                        }`} />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{feature.title}</h4>
                        <p className="text-xs text-muted-foreground">{feature.description}</p>
                      </div>
                      {activeFeature === index && (
                        <Play className="w-4 h-4 text-primary" />
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>

            {/* Right: Live Demo */}
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-sm font-medium">Live Demo</span>
                </div>
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Interactive
                </div>
              </div>

              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <h4 className="text-lg font-medium">{features[activeFeature].demo.title}</h4>
                    <p className="text-sm text-muted-foreground">
                      Watch how AI handles this automatically
                    </p>
                  </div>

                  <div className="space-y-3">
                    {features[activeFeature].demo.steps.map((step, index) => (
                      <motion.div
                        key={`step-${activeFeature}-${index}`}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.2 }}
                        className="flex items-center space-x-3 p-3 bg-accent/5 border border-accent/20 rounded"
                      >
                        <CheckCircle2 className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="text-sm">{step}</span>
                      </motion.div>
                    ))}
                  </div>

                  <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                    <div className="flex items-center space-x-2 mb-2">
                      <TrendingUp className="w-4 h-4 text-primary" />
                      <span className="text-sm font-medium text-primary">Result</span>
                    </div>
                    <p className="text-sm">{features[activeFeature].demo.result}</p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>Completed in {mounted ? `${Math.floor(Math.random() * 3) + 2}.${Math.floor(Math.random() * 9)}s` : '2.5s'}</span>
                    </div>
                    <span>✨ AI-powered</span>
                  </div>
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="text-center space-y-6">
          <h3 className="text-2xl lg:text-4xl font-medium">
            Stop juggling tools. Start achieving goals.
          </h3>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            Everything you need in one AI-powered platform. No more app switching, no more planning paralysis.
          </p>
          
          <Button 
            size="lg" 
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-8 py-3 group"
          >
            Start Planning for Free
            <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
          </Button>
        </div>
      </div>
    </section>
  );
}
