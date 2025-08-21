"use client";

import { 
  Brain,
  ArrowRight,
  CheckCircle2,
  Shield,
  Timer,
  Star,
  Target,
  Clock,
  TrendingUp
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface CTASectionProps {
  className?: string;
}

export default function CTASection({ className }: CTASectionProps) {
  const socialProof = [
    { metric: "10,000+", label: "AI-powered plans created", icon: Target },
    { metric: "2.3M", label: "Hours saved", icon: Clock },
    { metric: "94%", label: "Increased productivity", icon: TrendingUp },
    { metric: "4.9/5", label: "User rating", icon: Star }
  ];

  const testimonials = [
    {
      quote: "AI planning saved me 5 hours every week. I went from Sunday planning anxiety to Monday morning confidence.",
      author: "Sarah Chen",
      role: "Startup Founder"
    },
    {
      quote: "The AI research feature is incredible. It finds insights I would never have discovered on my own.",
      author: "Marcus Rodriguez", 
      role: "Product Manager"
    },
    {
      quote: "Finally, a productivity tool that actually makes me more productive instead of just organized.",
      author: "Emily Davis",
      role: "Consultant"
    }
  ];

  return (
    <section className={`py-24 px-6 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        {/* Main CTA */}
        <div className="text-center space-y-8 mb-20">
          <div className="space-y-6">
            <h2 className="text-4xl lg:text-6xl font-light leading-tight">
              <span className="text-foreground">Stop Letting</span>
              <br />
              <span className="text-primary font-medium">Planning Paralysis</span>
              <br />
              <span className="text-foreground">Steal Your Dreams</span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              Every week you spend in planning chaos is a week your AI-powered competitors are building their empire.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-lg font-medium group"
            >
              <Brain className="w-5 h-5 mr-3" />
              Get AI Planning Now
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="border-border text-foreground hover:bg-accent px-8 py-6 text-lg"
            >
              Try Free for 14 Days
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4 text-accent" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-accent" />
              <span>No credit card required</span>
            </div>
            <div className="flex items-center space-x-2">
              <Timer className="w-4 h-4 text-accent" />
              <span>Setup in 2 minutes</span>
            </div>
          </div>
        </div>

        {/* Social Proof */}
        <div className="mb-20">
          <div className="text-center space-y-8">
            <h3 className="text-2xl font-medium">Join Thousands Already Winning</h3>
            
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {socialProof.map((metric, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-6 text-center">
                  <metric.icon className="w-6 h-6 mx-auto text-primary mb-3" />
                  <div className="text-2xl font-bold text-primary mb-1">
                    {metric.metric}
                  </div>
                  <div className="text-sm text-muted-foreground">{metric.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Testimonials */}
        <div className="mb-20">
          <div className="text-center space-y-8">
            <h3 className="text-2xl font-medium">What Users Are Saying</h3>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-6">
                  <blockquote className="text-muted-foreground leading-relaxed mb-4">
                    "{testimonial.quote}"
                  </blockquote>
                  <div className="space-y-1">
                    <div className="font-medium text-foreground">{testimonial.author}</div>
                    <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center space-y-8">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-8 space-y-6">
            <h3 className="text-2xl font-medium">Start Risk-Free Today</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Experience the power of AI planning with our comprehensive 14-day free trial. 
              No credit card required. No commitments.
            </p>

            <div className="grid md:grid-cols-3 gap-6 text-center mb-8">
              <div className="space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <CheckCircle2 className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-medium">Full Feature Access</h4>
                <p className="text-sm text-muted-foreground">Try everything - AI agents, research, integrations</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Shield className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-medium">No Commitment</h4>
                <p className="text-sm text-muted-foreground">Cancel anytime. No questions asked</p>
              </div>
              <div className="space-y-2">
                <div className="w-12 h-12 bg-accent/10 rounded-full flex items-center justify-center mx-auto">
                  <Timer className="w-6 h-6 text-accent" />
                </div>
                <h4 className="font-medium">Instant Setup</h4>
                <p className="text-sm text-muted-foreground">Start planning in under 60 seconds</p>
              </div>
            </div>

            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-12 py-6 text-lg font-medium group"
            >
              <Brain className="w-5 h-5 mr-3" />
              Start Your AI Journey
              <ArrowRight className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" />
            </Button>

            <div className="text-sm text-muted-foreground">
              Join thousands of professionals already transforming their productivity with AI
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
