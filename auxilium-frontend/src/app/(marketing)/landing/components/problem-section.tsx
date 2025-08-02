"use client";

import { useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  Clock, 
  AlertTriangle, 
  Brain, 
  Zap,
  TrendingDown,
  X,
  Calendar,
  Target,
  Loader2,
  CheckCircle2,
  ArrowRight
} from "lucide-react";
import { GlassCard } from "./ui/glass-card";

interface ProblemSectionProps {
  className?: string;
}

export default function ProblemSection({ className }: ProblemSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);

  const painPoints = [
    {
      icon: Clock,
      title: "Sunday Scaries",
      problem: "3-hour planning sessions that crush your soul",
      cost: "Lost productivity every week",
      visual: "bg-destructive/10 border-destructive/20 text-destructive"
    },
    {
      icon: Brain,
      title: "Decision Paralysis", 
      problem: "47 tasks, 12 deadlines, zero clarity on what's next",
      cost: "Procrastination spiral begins",
      visual: "bg-orange-500/10 border-orange-500/20 text-orange-500"
    },
    {
      icon: Target,
      title: "Tool Fatigue",
      problem: "Switching between 8 apps just to plan your Tuesday",
      cost: "Focus destroyed before you start",
      visual: "bg-yellow-500/10 border-yellow-500/20 text-yellow-500"
    },
    {
      icon: TrendingDown,
      title: "Broken Promises",
      problem: "Another productivity system abandoned in 2 weeks",
      cost: "Self-trust eroded",
      visual: "bg-purple-500/10 border-purple-500/20 text-purple-500"
    }
  ];

  const statistics = [
    { number: "3.2hrs", label: "Weekly planning overhead", source: "avg user" },
    { number: "67%", label: "Plans never executed", source: "productivity research" },
    { number: "23", label: "Apps used for 'productivity'", source: "typical knowledge worker" },
    { number: "∞", label: "Times you've said 'I'll start Monday'", source: "your honest answer" }
  ];

  // Fixed rotation values to avoid hydration mismatches
  const toolRotations = [-2, 1, -3, 2, -1, 3, -4, 1, -2, 2];

  // Simplified GSAP Animations
  useGSAP(() => {
    // Simple entrance animations without ScrollTrigger
    gsap.set(".pain-card", { opacity: 0, y: 30 });
    gsap.set(".stat-item", { opacity: 0, scale: 0.8 });

    // One-time entrance animations
    gsap.to(".pain-card", {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      delay: 0.2
    });

    gsap.to(".stat-item", {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: "back.out(1.2)",
      delay: 0.8
    });

  }, { scope: sectionRef });

  return (
    <section ref={sectionRef} className={`relative py-24 px-6 ${className}`}>
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 bg-destructive/10 border border-destructive/20 text-destructive px-6 py-3 rounded-full text-sm font-medium"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>The Hidden Cost of Planning Chaos</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            <span className="text-destructive">The Planning Trap</span>
            <br />
            <span className="text-foreground">That's Stealing Your Life</span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            While you're drowning in planning overwhelm, <span className="text-primary font-semibold">AI-powered competitors</span> are 
            shipping products, closing deals, and building empires. Every minute spent in planning paralysis is a 
            minute they're <span className="text-secondary font-semibold">pulling ahead</span>.
          </motion.p>
        </div>

        {/* Pain Points Grid */}
        <div className="pain-cards-container grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {painPoints.map((pain, index) => (
            <GlassCard 
              key={index}
              variant="hover" 
              className={`pain-card ${pain.visual} group cursor-pointer transition-all duration-300 hover:scale-105`}
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <pain.icon className="w-8 h-8" />
                  <X className="w-5 h-5 opacity-50 group-hover:opacity-100 transition-opacity" />
                </div>
                
                <div className="space-y-2">
                  <h3 className="text-lg font-bold">{pain.title}</h3>
                  <p className="text-sm opacity-90 leading-relaxed">{pain.problem}</p>
                </div>

                <div className="pt-3 border-t border-current/20">
                  <div className="flex items-center space-x-2">
                    <TrendingDown className="w-4 h-4 animate-pulse" />
                    <span className="text-xs font-medium">{pain.cost}</span>
                  </div>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* Statistics Row */}
        <div className="statistics-container mb-20">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {statistics.map((stat, index) => (
              <motion.div 
                key={index}
                className="stat-item text-center space-y-2"
                whileHover={{ scale: 1.05 }}
              >
                <div className="text-4xl lg:text-5xl font-bold text-gradient bg-gradient-to-r from-destructive to-orange-500 bg-clip-text text-transparent">
                  {stat.number}
                </div>
                <div className="text-sm font-medium text-foreground">{stat.label}</div>
                <div className="text-xs text-muted-foreground">{stat.source}</div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Visualization: Chaos vs Order */}
        <div className="relative">
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            {/* Left: Current State (Chaos) */}
            <GlassCard variant="default" className="relative overflow-hidden bg-destructive/5 border-destructive/20">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Loader2 className="w-6 h-6 text-destructive animate-spin" />
                  <h3 className="text-xl font-bold text-destructive">Your Current Reality</h3>
                </div>

                <div className="space-y-4">
                  <div className="chaos-visual flex flex-wrap gap-2">
                    {[
                      "Google Calendar", "Notion", "Todoist", "Trello", "Slack", 
                      "Monday.com", "Asana", "Sticky Notes", "Excel", "Your Brain"
                    ].map((tool, i) => (
                      <div 
                        key={i}
                        className="bg-destructive/10 border border-destructive/30 text-destructive text-xs px-2 py-1 rounded-md opacity-80"
                        style={{
                          animationDelay: `${i * 0.1}s`,
                          transform: `rotate(${toolRotations[i]}deg)`
                        }}
                      >
                        {tool}
                      </div>
                    ))}
                  </div>

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-destructive" />
                      <span>Sunday 3PM: "I need to plan my week..."</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-destructive" />
                      <span>Sunday 6PM: Still deciding between tools</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Clock className="w-4 h-4 text-destructive" />
                      <span>Monday 8AM: Wing it, hope for the best</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chaos particles */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 right-4 w-2 h-2 bg-destructive/50 rounded-full animate-ping" />
                <div className="absolute bottom-8 left-6 w-1 h-1 bg-destructive/30 rounded-full animate-pulse" />
                <div className="absolute top-1/2 right-8 w-1.5 h-1.5 bg-destructive/40 rounded-full animate-bounce" />
              </div>
            </GlassCard>

            {/* Right: Future State (Order) */}
            <GlassCard variant="glow" className="relative overflow-hidden bg-primary/5 border-primary/20">
              <div className="space-y-6">
                <div className="flex items-center space-x-3">
                  <Zap className="w-6 h-6 text-primary" />
                  <h3 className="text-xl font-bold text-primary">With AI Planning</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-center">
                    <div className="bg-primary/10 border border-primary/30 text-primary px-6 py-3 rounded-lg text-sm font-medium">
                      🧠 AI Planning Agent
                    </div>
                  </div>

                  <div className="space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Sunday 3PM: "Plan my startup launch"</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Sunday 3:02PM: Complete breakdown ready</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle2 className="w-4 h-4 text-green-500" />
                      <span>Monday 8AM: Execute with confidence</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Success particles */}
              <div className="absolute inset-0 pointer-events-none">
                <div className="absolute top-4 right-4 w-2 h-2 bg-primary/50 rounded-full animate-pulse" />
                <div className="absolute bottom-8 left-6 w-1 h-1 bg-green-500/50 rounded-full animate-pulse delay-200" />
                <div className="absolute top-1/2 right-8 w-1.5 h-1.5 bg-primary/60 rounded-full animate-pulse delay-500" />
              </div>
            </GlassCard>
          </div>

          {/* Arrow between states */}
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 hidden lg:block">
            <div className="bg-gradient-to-r from-destructive to-primary p-3 rounded-full shadow-lg">
              <ArrowRight className="w-6 h-6 text-white" />
            </div>
          </div>
        </div>

        {/* Call to Emotion */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-6 mt-20"
        >
          <h3 className="text-2xl md:text-3xl font-bold text-foreground">
            How Long Will You Let <span className="text-destructive">Planning Paralysis</span> Hold You Back?
          </h3>
          <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
            Every week you spend in planning chaos is a week your AI-powered competitors are building their lead. 
            The gap isn't shrinking. <span className="text-primary font-semibold">It's time to fight back.</span>
          </p>
        </motion.div>
      </div>
    </section>
  );
} 