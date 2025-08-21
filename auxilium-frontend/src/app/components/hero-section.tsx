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
  const [aiThinking, setAiThinking] = useState(false);

  const demoSteps = [
    {
      input: "Launch my consulting business",
      thinking: "Analyzing market requirements, competitor landscape, legal framework...",
      output: [
        "Business Registration & Legal Setup",
        "Market Research & Target Analysis", 
        "Brand Identity & Website Development",
        "Service Package Design",
        "Client Acquisition Strategy"
      ]
    },
    {
      input: "Plan my wedding in 6 months",
      thinking: "Processing timeline constraints, vendor requirements, budget allocation...",
      output: [
        "Venue Booking (Month 1)",
        "Vendor Coordination (Month 2-3)",
        "Invitations & RSVP (Month 3-4)",
        "Final Details & Rehearsal (Month 5-6)",
        "Day-of Coordination"
      ]
    },
    {
      input: "Learn machine learning",
      thinking: "Evaluating skill prerequisites, optimal learning path, time allocation...",
      output: [
        "Python & Statistics Foundation",
        "Core ML Algorithms",
        "Deep Learning Frameworks", 
        "Real-world Project Portfolio",
        "Industry Specialization"
      ]
    }
  ];

  // AI Demo Animation
  useEffect(() => {
    const interval = setInterval(() => {
      setAiThinking(true);
      
      setTimeout(() => {
        setCurrentDemo((prev) => (prev + 1) % demoSteps.length);
        setAiThinking(false);
      }, 1500);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  return (
    <section className={`relative min-h-screen flex items-center justify-center px-6 py-20 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        <div className="grid lg:grid-cols-2 gap-16 items-center">
          {/* Left: Hero Content */}
          <div className="space-y-8">
            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="text-5xl lg:text-6xl font-light leading-tight tracking-tight">
                <span className="text-primary font-medium">
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

          {/* Right: AI Demo */}
          <div className="relative">
            <div className="bg-card border border-border rounded-lg p-6 space-y-6">
              {/* Demo Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-accent rounded-full" />
                  <span className="text-sm font-medium">AI Agent</span>
                </div>
                <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                  Live Demo
                </div>
              </div>

              {/* Input */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Input</label>
                <div className="bg-muted/50 border border-border rounded p-3 min-h-[50px] flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={currentDemo}
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="text-sm"
                    >
                      "{demoSteps[currentDemo].input}"
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {/* AI Status */}
              <div className="h-[60px] flex items-center">
                <div className="w-full bg-muted/30 border border-border rounded p-3">
                  <AnimatePresence mode="wait">
                    {aiThinking ? (
                      <motion.div
                        key="thinking"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center space-x-2"
                      >
                        <Brain className="w-4 h-4 text-primary animate-pulse" />
                        <div>
                          <p className="text-xs font-medium">Processing...</p>
                          <p className="text-xs text-muted-foreground">
                            {demoSteps[currentDemo].thinking}
                          </p>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="ready"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="flex items-center space-x-2"
                      >
                        <CheckCircle2 className="w-4 h-4 text-accent" />
                        <div>
                          <p className="text-xs font-medium">Complete</p>
                          <p className="text-xs text-muted-foreground">
                            Plan generated successfully
                          </p>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Output */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <Target className="w-3 h-3 text-primary" />
                  <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Output</label>
                </div>
                <div className="space-y-2 max-h-[200px] overflow-hidden">
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={currentDemo}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="space-y-2"
                    >
                      {demoSteps[currentDemo].output.map((step, index) => (
                        <motion.div
                          key={index}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="bg-primary/5 border border-primary/20 rounded p-2 flex items-center space-x-2"
                        >
                          <div className="w-1 h-1 bg-primary rounded-full flex-shrink-0" />
                          <span className="text-xs">{step}</span>
                        </motion.div>
                      ))}
                    </motion.div>
                  </AnimatePresence>
                </div>
              </div>

              {/* Demo Footer */}
              <div className="pt-3 border-t border-border/50">
                <div className="text-xs text-muted-foreground">
                  Generated in 1.2s • Ready for calendar sync
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
} 