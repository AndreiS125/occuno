"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Brain, 
  Search, 
  CheckCircle2,
  ArrowRight,
  Cpu,
  Target
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface AiShowcaseProps {
  className?: string;
}

export default function AiShowcase({ className }: AiShowcaseProps) {
  const [activeAgent, setActiveAgent] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);

  const agents = [
    {
      name: "Basic",
      tier: "Free",
      icon: Brain,
      description: "Fast planning and task breakdown",
      demo: {
        input: "Organize my home office",
        output: [
          "Declutter and remove unnecessary items",
          "Organize desk and storage solutions",
          "Set up optimal lighting and ergonomics",
          "Create filing system for documents"
        ]
      }
    },
    {
      name: "Research",
      tier: "Plus",
      icon: Search,
      description: "Planning with internet research",
      demo: {
        input: "Launch a podcast about productivity",
        output: [
          "Choose niche: AI-powered productivity for entrepreneurs",
          "Set up recording studio with Audio-Technica AT2020",
          "Create content calendar with 12 episodes",
          "Launch on Spotify, Apple Podcasts, and YouTube"
        ]
      }
    },
    {
      name: "Advanced",
      tier: "Pro",
      icon: Cpu,
      description: "Strategic planning with deep analysis",
      demo: {
        input: "Build a SaaS product from idea to launch",
        output: [
          "Phase 1: MVP with auth, billing, core features (8 weeks)",
          "Phase 2: Beta launch with 50 power users (4 weeks)", 
          "Phase 3: Product-market fit optimization (6 weeks)",
          "Phase 4: Scale to $10k MRR (12 weeks)"
        ]
      }
    }
  ];

  // Auto-cycle through agents
  useEffect(() => {
    const interval = setInterval(() => {
      setIsProcessing(true);
      setTimeout(() => {
        setActiveAgent((prev) => (prev + 1) % agents.length);
        setIsProcessing(false);
      }, 1000);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const currentAgent = agents[activeAgent];

  return (
    <section className={`py-24 px-6 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-16">
          <h2 className="text-4xl lg:text-6xl font-light leading-tight">
            <span className="text-aura-primary font-medium">
              Three Levels
            </span>
            <br />
            <span className="text-foreground">
              of AI Intelligence
            </span>
          </h2>
          
          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            From instant planning to deep research. Choose the right AI agent for your complexity level.
          </p>
        </div>

        {/* Agent Selection */}
        <div className="grid md:grid-cols-3 gap-6 mb-16">
          {agents.map((agent, index) => (
            <div 
              key={index}
              className={`bg-card border border-border rounded-lg p-6 cursor-pointer transition-all duration-200 ${
                activeAgent === index ? 'border-primary bg-primary/5' : 'hover:border-border/60'
              }`}
              onClick={() => setActiveAgent(index)}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <agent.icon className="w-6 h-6" />
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded">
                    {agent.tier}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-medium">{agent.name}</h3>
                  <p className="text-sm text-muted-foreground">{agent.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* AI Demo */}
        <div className="grid lg:grid-cols-2 gap-12 items-start">
          {/* Left: Agent Demo */}
          <div className="bg-card border border-border rounded-lg p-6 space-y-6">
            {/* Demo Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-accent rounded-full" />
                <span className="text-sm font-medium">{currentAgent.name} Agent</span>
              </div>
              <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded">
                {currentAgent.tier}
              </div>
            </div>

            {/* Input */}
            <div className="space-y-2">
              <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Input</label>
              <div className="bg-muted/50 border border-border rounded p-3 min-h-[50px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeAgent}
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -5 }}
                    className="text-sm"
                  >
                    "{currentAgent.demo.input}"
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* AI Status */}
            <div className="h-[60px] flex items-center">
              <div className="w-full bg-muted/30 border border-border rounded p-3">
                <AnimatePresence mode="wait">
                  {isProcessing ? (
                    <motion.div
                      key="processing"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center space-x-2"
                    >
                      <Brain className="w-4 h-4 text-aura-primary animate-pulse" />
                      <div>
                        <p className="text-xs font-medium">Processing...</p>
                        <p className="text-xs text-muted-foreground">
                          {activeAgent > 0 ? 'Researching and planning' : 'Analyzing and structuring'}
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
                          Plan generated in {activeAgent === 0 ? '1.2s' : activeAgent === 1 ? '3.4s' : '5.1s'}
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
                <Target className="w-3 h-3 text-aura-primary" />
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Output</label>
              </div>
              <div className="space-y-2 max-h-[250px] overflow-hidden">
                <AnimatePresence mode="wait">
                  <motion.div
                    key={activeAgent}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-2"
                  >
                    {currentAgent.demo.output.map((step, index) => (
                      <motion.div
                        key={index}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.05 }}
                        className="bg-primary/5 border border-primary/20 rounded p-2 flex items-center space-x-2"
                      >
                        <div className="w-1 h-1 bg-aura-primary rounded-full flex-shrink-0" />
                        <span className="text-xs">{step}</span>
                      </motion.div>
                    ))}
                  </motion.div>
                </AnimatePresence>
              </div>
            </div>
          </div>

          {/* Right: Benefits */}
          <div className="space-y-8">
            <div className="space-y-4">
              <h3 className="text-2xl lg:text-3xl font-medium">Why AI Planning Works</h3>
              <p className="text-lg text-muted-foreground leading-relaxed">
                Stop wrestling with planning tools. Let AI handle the complexity while you focus on execution.
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Instant Breakdown</h4>
                  <p className="text-xs text-muted-foreground">Complex goals become actionable steps in seconds</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Research Integration</h4>
                  <p className="text-xs text-muted-foreground">AI researches best practices before planning</p>
                </div>
              </div>
              <div className="flex items-start space-x-3">
                <div className="w-1.5 h-1.5 bg-accent rounded-full mt-2 flex-shrink-0" />
                <div>
                  <h4 className="font-medium text-sm">Always Reversible</h4>
                  <p className="text-xs text-muted-foreground">Every suggestion can be modified or rolled back</p>
                </div>
              </div>
            </div>

            <div className="pt-4">
              <Button 
                size="lg" 
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground group"
              >
                Try AI Planning
                <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-0.5 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
