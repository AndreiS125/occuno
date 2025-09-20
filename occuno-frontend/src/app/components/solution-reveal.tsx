"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Zap,
  CheckCircle2,
  ArrowRight,
  Brain,
  Target,
  Clock,
  Sparkles,
  Play,
  Pause
} from "lucide-react";

interface SolutionRevealProps {
  className?: string;
}

export default function SolutionReveal({ className }: SolutionRevealProps) {
  const [activeDemo, setActiveDemo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);

  const demoScenarios = [
    {
      input: "Launch my consulting business",
      steps: [
        { text: "Business registration & legal setup", time: "Week 1", progress: 100 },
        { text: "Market research & competitor analysis", time: "Week 2", progress: 75 },
        { text: "Brand identity & website development", time: "Week 3-4", progress: 45 },
        { text: "Service packages & pricing strategy", time: "Week 5", progress: 0 },
        { text: "Client acquisition & marketing launch", time: "Week 6", progress: 0 }
      ]
    },
    {
      input: "Plan my wedding in 6 months",
      steps: [
        { text: "Venue booking & vendor selection", time: "Month 1", progress: 100 },
        { text: "Invitations & guest management", time: "Month 2-3", progress: 80 },
        { text: "Catering & menu finalization", time: "Month 4", progress: 60 },
        { text: "Final details & rehearsal planning", time: "Month 5", progress: 20 },
        { text: "Day-of coordination & execution", time: "Month 6", progress: 0 }
      ]
    },
    {
      input: "Learn machine learning",
      steps: [
        { text: "Python & statistics fundamentals", time: "Month 1", progress: 100 },
        { text: "Core ML algorithms & concepts", time: "Month 2", progress: 70 },
        { text: "Deep learning frameworks (TensorFlow)", time: "Month 3", progress: 40 },
        { text: "Real-world project portfolio", time: "Month 4", progress: 10 },
        { text: "Industry specialization & job search", time: "Month 5", progress: 0 }
      ]
    }
  ];

  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % demoScenarios.length);
    }, 4000);

    return () => clearInterval(interval);
  }, [isPlaying]);

  const currentScenario = demoScenarios[activeDemo];

  return (
    <section className={`py-32 px-6 relative overflow-hidden ${className}`}>
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container mx-auto max-w-7xl relative">
        {/* Header */}
        <div className="text-center space-y-8 mb-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <div className="inline-flex items-center space-x-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 text-aura-accent px-8 py-4 rounded-full text-sm font-medium backdrop-blur-sm">
              <Sparkles className="w-4 h-4" />
              <span>The AI Revolution</span>
            </div>

            <h2 className="text-5xl lg:text-7xl font-light leading-tight">
              <span className="text-foreground">
                AI That Actually
              </span>
              <br />
              <span className="text-aura-primary font-medium">
                Plans For You
              </span>
            </h2>
            
            <p className="text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
              Watch AI transform any goal into a complete, actionable plan in real-time
            </p>
          </motion.div>
        </div>

        {/* Interactive Demo */}
        <div className="grid lg:grid-cols-2 gap-16 items-start mb-20">
          {/* Left: Demo Interface */}
          <motion.div
            initial={{ opacity: 0, x: -50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            {/* Demo Controls */}
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-xl font-medium">Live AI Planning Demo</h3>
              <button
                onClick={() => setIsPlaying(!isPlaying)}
                className="flex items-center space-x-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                {isPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{isPlaying ? 'Pause' : 'Play'}</span>
              </button>
            </div>

            {/* Input */}
            <div className="space-y-3">
              <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Your Goal</label>
              <div className="glass border border-border/50 rounded-xl p-6 min-h-[80px] flex items-center">
                <AnimatePresence mode="wait">
                  <motion.p
                    key={activeDemo}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="text-lg font-medium"
                  >
                    "{currentScenario.input}"
                  </motion.p>
                </AnimatePresence>
              </div>
            </div>

            {/* AI Processing */}
            <div className="flex items-center space-x-3 py-4">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-aura-primary rounded-full opacity-60" />
                <div className="w-2 h-2 bg-aura-primary rounded-full opacity-80" />
                <div className="w-2 h-2 bg-aura-primary rounded-full" />
              </div>
              <span className="text-sm text-aura-primary font-medium">AI analyzing and planning...</span>
            </div>

            {/* Output */}
            <div className="space-y-3">
              <div className="flex items-center space-x-2">
                <Target className="w-4 h-4 text-aura-primary" />
                <label className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Complete Action Plan</label>
              </div>
              
              <div className="glass border border-border/50 rounded-xl p-6 space-y-4">
                <div className="space-y-4">
                  {currentScenario.steps.map((step, index) => (
                    <div
                      key={`${activeDemo}-${index}`}
                      className="flex items-center space-x-4 p-3 rounded-lg bg-background/50 border border-border/30"
                    >
                      <div className="flex-shrink-0">
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                          step.progress === 100 ? 'bg-green-500/20 text-green-500' :
                          step.progress > 0 ? 'bg-blue-500/20 text-blue-500' :
                          'bg-muted text-muted-foreground'
                        }`}>
                          {step.progress === 100 ? (
                            <CheckCircle2 className="w-4 h-4" />
                          ) : (
                            <span className="text-xs font-medium">{index + 1}</span>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between mb-1">
                          <p className="text-sm font-medium truncate">{step.text}</p>
                          <span className="text-xs text-muted-foreground ml-2">{step.time}</span>
                        </div>
                        <div className="w-full bg-muted/50 rounded-full h-1.5">
                          <div
                            className="h-1.5 rounded-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
                            style={{ width: `${step.progress}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>

          {/* Right: Benefits */}
          <motion.div
            initial={{ opacity: 0, x: 50 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="space-y-8"
          >
            <div className="space-y-6">
              <h3 className="text-3xl lg:text-4xl font-medium">
                From <span className="text-aura-warm">Hours</span> to <span className="text-aura-primary">Seconds</span>
              </h3>
              
              <div className="grid gap-6">
                {[
                  {
                    icon: Clock,
                    title: "Instant Breakdown",
                    description: "Complex goals become actionable steps in under 30 seconds",
                    metric: "150x faster"
                  },
                  {
                    icon: Brain,
                    title: "Research-Powered",
                    description: "AI researches best practices and industry standards automatically",
                    metric: "99% accuracy"
                  },
                  {
                    icon: Target,
                    title: "Timeline Optimization",
                    description: "Smart scheduling that adapts to your constraints and priorities",
                    metric: "40% more efficient"
                  }
                ].map((benefit, index) => (
                  <div
                    key={index}
                    className="glass border border-border/50 rounded-xl p-6 hover:border-primary/30 transition-colors"
                  >
                    <div className="flex items-start space-x-4">
                      <div className="flex-shrink-0 w-12 h-12 bg-primary/10 rounded-xl flex items-center justify-center">
                        <benefit.icon className="w-6 h-6 text-aura-primary" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium">{benefit.title}</h4>
                          <span className="text-xs font-medium text-aura-accent bg-accent/10 px-2 py-1 rounded-full">
                            {benefit.metric}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {benefit.description}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>
        </div>

        {/* Demo Selector */}
        <div className="flex justify-center space-x-4 mb-12">
          {demoScenarios.map((_, index) => (
            <button
              key={index}
              onClick={() => setActiveDemo(index)}
              className={`w-3 h-3 rounded-full transition-colors ${
                activeDemo === index ? 'bg-primary' : 'bg-muted hover:bg-muted-foreground'
              }`}
            />
          ))}
        </div>

        {/* Bottom CTA */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center"
        >
          <div className="inline-flex items-center space-x-2 text-sm text-muted-foreground">
            <ArrowRight className="w-4 h-4 text-aura-primary" />
            <span>Ready to experience AI planning?</span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
