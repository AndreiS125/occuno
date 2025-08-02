"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  Brain, 
  Zap, 
  Target, 
  ArrowRight, 
  Sparkles, 
  TrendingUp,
  CheckCircle2,
  Clock,
  Calendar
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "./ui/glass-card";

interface HeroSectionProps {
  className?: string;
}

export default function HeroSection({ className }: HeroSectionProps) {
  const heroRef = useRef<HTMLDivElement>(null);
  const demoRef = useRef<HTMLDivElement>(null);
  const [currentDemo, setCurrentDemo] = useState(0);
  const [aiThinking, setAiThinking] = useState(false);

  const demoSteps = [
    {
      input: "Launch my consulting business",
      thinking: "Analyzing market requirements, competitor landscape, legal framework...",
      output: [
        "1. Business Registration & Legal Setup",
        "2. Market Research & Target Analysis", 
        "3. Brand Identity & Website Development",
        "4. Service Package Design",
        "5. Client Acquisition Strategy"
      ]
    },
    {
      input: "Plan my wedding in 6 months",
      thinking: "Processing timeline constraints, vendor requirements, budget allocation...",
      output: [
        "1. Venue Booking (Month 1)",
        "2. Vendor Coordination (Month 2-3)",
        "3. Invitations & RSVP (Month 3-4)",
        "4. Final Details & Rehearsal (Month 5-6)",
        "5. Day-of Coordination"
      ]
    },
    {
      input: "Learn machine learning",
      thinking: "Evaluating skill prerequisites, optimal learning path, time allocation...",
      output: [
        "1. Python & Statistics Foundation",
        "2. Core ML Algorithms",
        "3. Deep Learning Frameworks", 
        "4. Real-world Project Portfolio",
        "5. Industry Specialization"
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
      }, 2000);
    }, 6000);

    return () => clearInterval(interval);
  }, []);

  // GSAP Animations
  useGSAP(() => {
    const tl = gsap.timeline();

    // Hero title animation
    tl.fromTo(".hero-title", 
      { opacity: 0, y: 50, scale: 0.9 },
      { opacity: 1, y: 0, scale: 1, duration: 1, ease: "power3.out" }
    );

    // Subtitle stagger
    tl.fromTo(".hero-subtitle",
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: "power2.out" },
      "-=0.5"
    );

    // Demo cards float animation
    tl.fromTo(".demo-card",
      { opacity: 0, y: 40, rotateX: 15 },
      { 
        opacity: 1, 
        y: 0, 
        rotateX: 0,
        duration: 0.8, 
        stagger: 0.1,
        ease: "back.out(1.2)" 
      },
      "-=0.3"
    );

    // CTA button glow
    tl.fromTo(".hero-cta",
      { opacity: 0, scale: 0.8 },
      { 
        opacity: 1, 
        scale: 1, 
        duration: 0.6,
        ease: "elastic.out(1, 0.5)"
      },
      "-=0.2"
    );

    // Simple floating particles without ScrollTrigger
    gsap.to(".particle", {
      y: -15,
      x: 8,
      rotation: 180,
      duration: 4,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut",
      stagger: 0.3
    });

  }, { scope: heroRef });

  return (
    <section ref={heroRef} className={`relative min-h-screen flex items-center justify-center px-6 py-20 overflow-hidden ${className}`}>
      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="particle absolute top-20 left-20 w-4 h-4 bg-primary/30 rounded-full blur-sm" />
        <div className="particle absolute top-40 right-32 w-3 h-3 bg-secondary/40 rounded-full blur-sm" />
        <div className="particle absolute bottom-32 left-1/4 w-5 h-5 bg-accent/20 rounded-full blur-sm" />
        <div className="particle absolute bottom-20 right-20 w-2 h-2 bg-primary/50 rounded-full blur-sm" />
      </div>

      <div className="container mx-auto max-w-7xl">
        <div className="grid lg:grid-cols-2 gap-12 items-center">
          {/* Left: Hero Content */}
          <div className="space-y-8">
            {/* Pain Point Hook */}
            <motion.div 
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              className="inline-flex items-center space-x-2 bg-destructive/10 border border-destructive/20 text-destructive px-4 py-2 rounded-full text-sm font-medium"
            >
              <Clock className="w-4 h-4" />
              <span>Sunday planning anxiety killing your momentum?</span>
            </motion.div>

            {/* Main Headline */}
            <div className="space-y-6">
              <h1 className="hero-title text-5xl lg:text-7xl font-bold leading-tight">
                <span className="text-gradient bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                  Stop Planning.
                </span>
                <br />
                <span className="text-foreground">
                  Start Achieving.
                </span>
              </h1>
              
              <p className="hero-subtitle text-xl lg:text-2xl text-muted-foreground max-w-2xl leading-relaxed">
                While you're stuck in <span className="text-destructive font-semibold">planning paralysis</span>, 
                AI users are finishing projects. Get an AI that thinks <span className="text-primary font-semibold">10 steps ahead</span> so you don't have to.
              </p>
            </div>

            {/* Value Props */}
            <div className="hero-subtitle grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>No more decision fatigue</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>AI research before planning</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Infinite task breakdown</span>
              </div>
              <div className="flex items-center space-x-3">
                <CheckCircle2 className="w-5 h-5 text-green-500 flex-shrink-0" />
                <span>Propose, not impose</span>
              </div>
            </div>

            {/* CTA */}
            <div className="flex flex-col sm:flex-row gap-4">
              <Button 
                size="lg" 
                className="hero-cta btn-glow bg-gradient-to-r from-primary to-secondary hover:from-primary/90 hover:to-secondary/90 text-white px-8 py-4 text-lg font-semibold group"
              >
                <Brain className="w-5 h-5 mr-2" />
                Get AI Planning Now
                <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
              </Button>
              
              <Button 
                variant="outline" 
                size="lg" 
                className="hero-cta border-primary/30 text-primary hover:bg-primary/10 px-8 py-4 text-lg"
              >
                See AI Demo
                <Sparkles className="w-5 h-5 ml-2" />
              </Button>
            </div>

            {/* Social Proof Alternative */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.5 }}
              className="text-sm text-muted-foreground"
            >
              🚀 Built by planning perfectionists, powered by cutting-edge AI
            </motion.div>
          </div>

          {/* Right: AI Demo */}
          <div ref={demoRef} className="relative">
            <GlassCard variant="glow" size="lg" className="demo-card h-[600px]">
              <div className="space-y-6 h-full flex flex-col">
                {/* Demo Header */}
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-sm font-medium text-muted-foreground">AI Planning Agent</span>
                  </div>
                  <div className="text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                    Live Demo
                  </div>
                </div>

                {/* Input */}
                <div className="space-y-3">
                  <label className="text-sm font-medium text-muted-foreground">Your Goal:</label>
                  <div className="bg-muted/30 border border-border/50 rounded-lg p-4 h-[60px] flex items-center">
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={currentDemo}
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="text-foreground font-medium"
                      >
                        "{demoSteps[currentDemo].input}"
                      </motion.p>
                    </AnimatePresence>
                  </div>
                </div>

                {/* AI Thinking - Fixed Height */}
                <div className="h-[100px] flex items-center">
                  <div className="w-full bg-secondary/10 border border-secondary/20 rounded-lg p-4">
                    <AnimatePresence mode="wait">
                      {aiThinking ? (
                        <motion.div
                          key="thinking"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="flex items-center space-x-3"
                        >
                          <Brain className="w-5 h-5 text-secondary animate-pulse" />
                          <div className="flex-1">
                            <p className="text-sm text-secondary font-medium">AI is thinking...</p>
                            <p className="text-xs text-muted-foreground mt-1">
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
                          className="flex items-center space-x-3"
                        >
                          <CheckCircle2 className="w-5 h-5 text-green-500" />
                          <div className="flex-1">
                            <p className="text-sm text-green-500 font-medium">AI Ready</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              Planning completed successfully
                            </p>
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
                    <label className="text-sm font-medium">AI Breakdown:</label>
                  </div>
                  <div className="h-[280px] overflow-hidden">
                    <div className="space-y-2">
                      <AnimatePresence mode="wait">
                        <motion.div
                          key={currentDemo}
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.3 }}
                          className="space-y-2"
                        >
                          {demoSteps[currentDemo].output.map((step, index) => (
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

                {/* Demo Footer */}
                <div className="flex items-center justify-between pt-4 border-t border-border/30">
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <TrendingUp className="w-3 h-3" />
                    <span>Generated in 2.3s</span>
                  </div>
                  <div className="flex items-center space-x-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    <span>Ready to sync</span>
                  </div>
                </div>
              </div>
            </GlassCard>

            {/* Floating elements around demo */}
            <div className="absolute -top-6 -left-6 w-12 h-12 bg-primary/20 rounded-full blur-xl animate-pulse" />
            <div className="absolute -bottom-4 -right-4 w-8 h-8 bg-secondary/30 rounded-full blur-lg animate-pulse delay-500" />
          </div>
        </div>
      </div>
    </section>
  );
} 