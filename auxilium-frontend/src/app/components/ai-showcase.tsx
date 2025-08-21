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

  const features = [
    {
      icon: RotateCcw,
      title: "Propose, Not Impose",
      description: "Every suggestion can be rolled back. You stay in control.",
      visual: "text-green-500"
    },
    {
      icon: Target,
      title: "Infinite Nesting",
      description: "Break down tasks to any level of detail automatically.",
      visual: "text-blue-500"
    },
    {
      icon: Globe,
      title: "Real-time Research",
      description: "AI researches the internet before planning your objectives.",
      visual: "text-purple-500"
    },
    {
      icon: Shield,
      title: "Your Way",
      description: "Integrates with Notion, syncs with Google Calendar.",
      visual: "text-orange-500"
    }
  ];

  // Auto-cycle through agents
  useEffect(() => {
    const interval = setInterval(() => {
      setActiveAgent((prev) => (prev + 1) % agents.length);
    }, 8000);

    return () => clearInterval(interval);
  }, []);

  // Research animation effect
  useEffect(() => {
    if (activeAgent > 0) { // Research agents
      const researchInterval = setInterval(() => {
        setIsResearching(true);
        setTimeout(() => setIsResearching(false), 3000);
      }, 6000);

      return () => clearInterval(researchInterval);
    }
  }, [activeAgent]);

  // Simplified animations without ScrollTrigger
  useGSAP(() => {
    // Simple entrance animations only
    gsap.set(".agent-card", { opacity: 0, y: 30 });
    gsap.set(".feature-card", { opacity: 0, x: -20 });

    // One-time entrance animations
    gsap.to(".agent-card", {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      delay: 0.2
    });

    gsap.to(".feature-card", {
      opacity: 1,
      x: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      delay: 0.8
    });

  }, { scope: sectionRef });

  const currentAgent = agents[activeAgent];
  const colorClasses = {
    primary: "border-primary/30 bg-primary/10 text-primary",
    secondary: "border-secondary/30 bg-secondary/10 text-secondary", 
    accent: "border-accent/30 bg-accent/10 text-accent"
  };

  return (
    <section ref={sectionRef} className={`relative py-24 px-6 ${className}`}>
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary px-6 py-3 rounded-full text-sm font-medium"
          >
            <Brain className="w-4 h-4" />
            <span>AI-Powered Planning Revolution</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            <span className="text-gradient bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              Meet Your AI
            </span>
            <br />
            <span className="text-foreground">Planning Partner</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Three levels of AI intelligence. From instant planning to deep research. 
            Choose your superpower and <span className="text-primary font-semibold">think 10 steps ahead</span>.
          </motion.p>
        </div>

        {/* Agent Selection */}
        <div className="agents-container grid md:grid-cols-3 gap-6 mb-12">
          {agents.map((agent, index) => (
            <GlassCard 
              key={index}
              variant={activeAgent === index ? "glow" : "hover"}
              className={`agent-card cursor-pointer transition-all duration-300 ${
                activeAgent === index ? colorClasses[agent.color as keyof typeof colorClasses] : ''
              }`}
              onClick={() => setActiveAgent(index)}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <agent.icon className="w-8 h-8" />
                  <span className="text-xs font-medium px-2 py-1 bg-current/10 rounded-full">
                    {agent.tier}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">{agent.name}</h3>
                  <p className="text-sm opacity-90">{agent.description}</p>
                </div>

                <div className="space-y-1">
                  {agent.capabilities.slice(0, 2).map((capability, i) => (
                    <div key={i} className="flex items-center space-x-2 text-xs">
                      <CheckCircle2 className="w-3 h-3 opacity-60" />
                      <span className="opacity-75">{capability}</span>
                    </div>
                  ))}
                  {agent.capabilities.length > 2 && (
                    <div className="text-xs opacity-60">
                      +{agent.capabilities.length - 2} more features
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* AI Demo */}
        <div className="grid lg:grid-cols-2 gap-12 items-start mb-20">
          {/* Left: Agent Demo */}
          <GlassCard variant="glow" size="lg" className="h-[700px]">
            <div className="space-y-6 h-full flex flex-col">
              {/* Demo Header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <div className="ai-pulse w-3 h-3 bg-green-500 rounded-full" />
                  <span className="text-sm font-medium">{currentAgent.name} Active</span>
                </div>
                <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                  {currentAgent.tier} Tier
                </div>
              </div>

              {/* Input */}
              <div className="space-y-3">
                <label className="text-sm font-medium text-muted-foreground">Your Goal:</label>
                <div className="bg-muted/30 border border-border/50 rounded-lg p-4 h-[60px] flex items-center">
                  <AnimatePresence mode="wait">
                    <motion.p
                      key={activeAgent}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="text-foreground font-medium"
                    >
                      "{currentAgent.demo.input}"
                    </motion.p>
                  </AnimatePresence>
                </div>
              </div>

              {/* Research Phase - Fixed Height */}
              <div className="h-[120px]">
                <div className="bg-secondary/10 border border-secondary/20 rounded-lg p-4 h-full">
                  <AnimatePresence mode="wait">
                    {activeAgent > 0 && isResearching && 'research' in currentAgent.demo ? (
                      <motion.div
                        key="researching"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full overflow-hidden"
                      >
                        <div className="space-y-3">
                          <div className="flex items-center space-x-3">
                            <Search className="w-5 h-5 text-secondary animate-pulse" />
                            <span className="text-sm text-secondary font-medium">AI Research in Progress...</span>
                          </div>
                          <div className="space-y-1 text-xs text-muted-foreground">
                            {(currentAgent.demo as any).research?.slice(0, 3).map((item: string, index: number) => (
                              <motion.div
                                key={index}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: index * 0.3 }}
                              >
                                {item}
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="ready"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        className="h-full flex items-center"
                      >
                        <div className="flex items-center space-x-3">
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <div className="flex-1">
                            <p className="text-sm text-green-500 font-medium">AI Ready</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {activeAgent > 0 ? 'Research completed' : 'Planning mode active'}
                            </p>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Output - Fixed Height */}
              <div className="space-y-3 flex-1">
                <div className="flex items-center space-x-2">
                  <Target className="w-4 h-4 text-primary" />
                  <label className="text-sm font-medium">AI Plan:</label>
                </div>
                <div className="h-[320px] overflow-hidden">
                  <div className="space-y-2">
                    <AnimatePresence mode="wait">
                      <motion.div
                        key={activeAgent}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="space-y-2"
                      >
                        {currentAgent.demo.output.map((step, index) => (
                          <motion.div
                            key={index}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: index * 0.1 }}
                            className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-center space-x-3"
                          >
                            <CheckCircle2 className="w-4 h-4 text-primary flex-shrink-0" />
                            <span className="text-sm">{step}</span>
                          </motion.div>
                        ))}
                      </motion.div>
                    </AnimatePresence>
                  </div>
                </div>
              </div>

              {/* Demo Actions - Fixed at bottom */}
              <div className="flex items-center justify-between pt-4 border-t border-border/30">
                <div className="flex items-center space-x-4 text-xs text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <TrendingUp className="w-3 h-3" />
                    <span>Generated in {activeAgent === 0 ? '1.2s' : activeAgent === 1 ? '3.4s' : '5.1s'}</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <RotateCcw className="w-3 h-3" />
                    <span>Rollback anytime</span>
                  </div>
                </div>
                <Button size="sm" variant="outline" className="text-xs">
                  <Sparkles className="w-3 h-3 mr-1" />
                  Refine Plan
                </Button>
              </div>
            </div>
          </GlassCard>

          {/* Right: Key Features */}
          <div className="features-container space-y-6">
            <div className="space-y-4">
              <h3 className="text-2xl font-bold text-foreground">Why AI Changes Everything</h3>
              <p className="text-muted-foreground">
                Stop wrestling with planning tools. Let AI handle the thinking while you focus on achieving.
              </p>
            </div>

            <div className="space-y-4">
              {features.map((feature, index) => (
                <motion.div 
                  key={index}
                  className="feature-card flex items-start space-x-4 p-4 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors"
                  whileHover={{ x: 5 }}
                >
                  <feature.icon className={`w-6 h-6 ${feature.visual} flex-shrink-0 mt-1`} />
                  <div className="space-y-1">
                    <h4 className="font-semibold text-foreground">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            <div className="pt-6">
              <Button 
                size="lg" 
                className="w-full btn-glow bg-gradient-to-r from-primary to-secondary text-white group"
              >
                <Brain className="w-5 h-5 mr-2" />
                Try AI Planning Free
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>

        {/* Capability Comparison */}
        <GlassCard variant="default" size="lg">
          <div className="space-y-6">
            <h3 className="text-xl font-bold text-center">Choose Your AI Power Level</h3>
            
            <div className="grid md:grid-cols-3 gap-6">
              {agents.map((agent, index) => (
                <div key={index} className="space-y-4">
                  <div className="text-center space-y-2">
                    <agent.icon className="w-8 h-8 mx-auto text-muted-foreground" />
                    <h4 className="font-semibold">{agent.name}</h4>
                    <span className="text-sm text-muted-foreground">{agent.tier}</span>
                  </div>
                  
                  <div className="space-y-2">
                    {agent.capabilities.map((capability, i) => (
                      <div key={i} className="flex items-center space-x-2 text-sm">
                        <CheckCircle2 className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{capability}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
} 