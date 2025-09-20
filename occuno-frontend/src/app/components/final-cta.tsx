"use client";

import { 
  Brain,
  ArrowRight,
  CheckCircle2,
  Shield,
  Timer
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface FinalCTAProps {
  className?: string;
}

export default function FinalCTA({ className }: FinalCTAProps) {
  return (
    <section className={`py-24 px-6 ${className}`}>
      <div className="container mx-auto max-w-4xl">
        {/* Main CTA */}
        <div className="text-center space-y-8">
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-6xl font-light leading-tight">
              <span className="text-foreground">Ready to Stop</span>
              <br />
              <span className="text-aura-primary font-medium">Planning Forever?</span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Transform your productivity with AI planning. From idea to execution in seconds.
            </p>
          </div>

          <div className="space-y-6">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-xl font-medium group"
            >
              <Brain className="w-6 h-6 mr-3" />
              Start Planning with AI
              <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
              <div className="flex items-center space-x-2">
                <Shield className="w-4 h-4 text-accent" />
                <span>Free to start</span>
              </div>
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>No credit card</span>
              </div>
              <div className="flex items-center space-x-2">
                <Timer className="w-4 h-4 text-accent" />
                <span>2-minute setup</span>
              </div>
            </div>
          </div>

          {/* Risk Reversal */}
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 space-y-4">
            <h3 className="text-lg font-medium">Try Everything Risk-Free</h3>
            <p className="text-muted-foreground">
              Full access to all AI agents, integrations, and features. Cancel anytime.
            </p>
            <div className="text-sm text-muted-foreground">
              No commitments. No surprises. Just better planning.
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
