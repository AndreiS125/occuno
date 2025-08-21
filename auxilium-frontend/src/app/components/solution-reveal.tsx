"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Zap,
  CheckCircle2,
  ArrowRight,
  Brain,
  Target,
  Clock
} from "lucide-react";

interface SolutionRevealProps {
  className?: string;
}

export default function SolutionReveal({ className }: SolutionRevealProps) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsRevealed(true), 500);
    return () => clearTimeout(timer);
  }, []);

  const transformations = [
    {
      from: "5 hours of planning",
      to: "2 minutes with AI",
      icon: Clock
    },
    {
      from: "Analysis paralysis", 
      to: "Clear action steps",
      icon: Target
    },
    {
      from: "Tool switching chaos",
      to: "One intelligent system",
      icon: Brain
    }
  ];

  return (
    <section className={`py-24 px-6 bg-primary/5 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        <div className="text-center space-y-8 mb-16">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
            className="space-y-6"
          >
            <div className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 text-primary px-6 py-3 rounded-full text-sm font-medium">
              <Zap className="w-4 h-4" />
              <span>The Solution</span>
            </div>

            <h2 className="text-4xl lg:text-6xl font-light leading-tight">
              <span className="text-foreground">
                AI That Actually
              </span>
              <br />
              <span className="text-primary font-medium">
                Plans For You
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Stop fighting with planning tools. Let AI handle the complexity while you focus on execution.
            </p>
          </motion.div>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {transformations.map((transform, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.2, duration: 0.6 }}
              className="text-center space-y-6"
            >
              <div className="space-y-3">
                <div className="text-sm text-muted-foreground uppercase tracking-wide">Before</div>
                <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
                  <p className="text-sm text-destructive font-medium">{transform.from}</p>
                </div>
              </div>

              <div className="flex justify-center">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-5 h-5 text-primary" />
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm text-muted-foreground uppercase tracking-wide">After</div>
                <div className="bg-accent/10 border border-accent/20 rounded-lg p-4">
                  <transform.icon className="w-5 h-5 text-accent mx-auto mb-2" />
                  <p className="text-sm text-accent font-medium">{transform.to}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <div className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
            className="space-y-6"
          >
            <h3 className="text-2xl lg:text-3xl font-medium">
              From Idea to Action in <span className="text-primary">Seconds</span>
            </h3>
            
            <div className="bg-card border border-border rounded-lg p-8 max-w-2xl mx-auto">
              <div className="space-y-4">
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  <span className="text-sm">Tell AI your goal in plain English</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  <span className="text-sm">Get a complete plan with research and timelines</span>
                </div>
                <div className="flex items-center space-x-3">
                  <CheckCircle2 className="w-5 h-5 text-accent" />
                  <span className="text-sm">Sync to your calendar and start executing</span>
                </div>
              </div>
            </div>

            <p className="text-lg text-muted-foreground">
              No more planning paralysis. No more tool switching. Just results.
            </p>
          </motion.div>
        </div>

        <div className="text-center pt-12">
          <motion.div
            animate={{ y: [0, 10, 0] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="inline-block"
          >
            <div className="text-sm text-muted-foreground mb-2">See how it works</div>
            <ArrowRight className="w-6 h-6 text-primary rotate-90" />
          </motion.div>
        </div>
      </div>
    </section>
  );
}
