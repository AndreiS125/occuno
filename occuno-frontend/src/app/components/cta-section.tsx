"use client";

import { useRef, useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  Brain,
  Zap,
  ArrowRight,
  Clock,
  TrendingUp,
  Shield,
  CheckCircle2,
  AlertTriangle,
  Rocket,
  Sparkles,
  Timer,
  Target,
  Crown,
  Users,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "./ui/glass-card";

interface CTASectionProps {
  className?: string;
}

export default function CTASection({ className }: CTASectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [urgencyTimer, setUrgencyTimer] = useState(120); // 2 minutes
  const [showUrgency, setShowUrgency] = useState(false);

  const socialProof = [
    { metric: "10,000+", label: "AI-powered plans created", icon: Target },
    { metric: "2.3M", label: "Hours of planning time saved", icon: Clock },
    { metric: "94%", label: "Report increased productivity", icon: TrendingUp },
    { metric: "4.9/5", label: "Average user rating", icon: Star }
  ];

  const testimonials = [
    {
      quote: "AI planning saved me 5 hours every week. I went from Sunday planning anxiety to Monday morning confidence.",
      author: "Sarah Chen",
      role: "Startup Founder",
      avatar: "👩‍💼"
    },
    {
      quote: "The AI research feature is incredible. It finds insights I would never have discovered on my own.",
      author: "Marcus Rodriguez",
      role: "Product Manager",
      avatar: "👨‍💻"
    },
    {
      quote: "Finally, a productivity tool that actually makes me more productive instead of just organized.",
      author: "Emily Davis",
      role: "Consultant",
      avatar: "👩‍🏫"
    }
  ];

  const painPoints = [
    "Another Sunday evening lost to planning chaos",
    "Watching AI-powered competitors pull ahead",
    "Decision fatigue paralyzing your progress",
    "Tool fatigue destroying your focus",
    "Planning perfectionism preventing action"
  ];

  // Urgency timer effect
  useEffect(() => {
    const timer = setInterval(() => {
      setUrgencyTimer((prev) => {
        if (prev <= 1) {
          setShowUrgency(true);
          return 120; // Reset
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // GSAP Animations
  useGSAP(() => {
    // Hero CTA animation
    gsap.fromTo(".cta-hero", 
      { 
        opacity: 0, 
        y: 60,
        scale: 0.95
      },
      { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: 1,
        ease: "power3.out",
        scrollTrigger: {
          trigger: ".cta-container",
          start: "top 80%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Social proof metrics animation
    gsap.fromTo(".metric-card",
      {
        opacity: 0,
        y: 40,
        scale: 0.8
      },
      {
        opacity: 1,
        y: 0,
        scale: 1,
        duration: 0.6,
        stagger: 0.1,
        ease: "back.out(1.2)",
        scrollTrigger: {
          trigger: ".metrics-container",
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Testimonials scroll animation
    gsap.fromTo(".testimonial-card",
      {
        opacity: 0,
        x: -50
      },
      {
        opacity: 1,
        x: 0,
        duration: 0.8,
        stagger: 0.2,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".testimonials-container",
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Pain points animation
    gsap.fromTo(".pain-point",
      {
        opacity: 0,
        x: -30,
        scale: 0.9
      },
      {
        opacity: 1,
        x: 0,
        scale: 1,
        duration: 0.5,
        stagger: 0.1,
        ease: "power2.out",
        scrollTrigger: {
          trigger: ".pain-points-container",
          start: "top 85%",
          toggleActions: "play none none reverse"
        }
      }
    );

    // Pulsing CTA
    gsap.to(".pulse-cta", {
      scale: 1.05,
      duration: 2,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

    // Urgency timer pulse
    gsap.to(".urgency-timer", {
      scale: 1.1,
      duration: 1,
      repeat: -1,
      yoyo: true,
      ease: "sine.inOut"
    });

  }, { scope: sectionRef });

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <section ref={sectionRef} className={`relative py-24 px-6 ${className}`}>
      <div className="container mx-auto max-w-7xl">
        {/* Urgency Banner */}
        <AnimatePresence>
          {showUrgency && (
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              className="mb-12"
            >
              <GlassCard variant="glow" className="bg-destructive/10 border-destructive/30">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    <AlertTriangle className="w-8 h-8 text-aura-warm animate-pulse" />
                    <div>
                      <h3 className="text-lg font-bold text-aura-warm">Limited Time: Beta Access</h3>
                      <p className="text-sm text-muted-foreground">
                        Early access pricing expires soon. Lock in your rate now.
                      </p>
                    </div>
                  </div>
                  <div className="urgency-timer text-center">
                    <div className="text-2xl font-bold text-aura-warm">{formatTime(urgencyTimer)}</div>
                    <div className="text-xs text-muted-foreground">until price increase</div>
                  </div>
                </div>
              </GlassCard>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="cta-container space-y-20">
          {/* Main CTA Hero */}
          <div className="cta-hero text-center space-y-8">
            <motion.div 
              initial={{ opacity: 0, scale: 0.8 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="inline-flex items-center space-x-2 bg-primary/10 border border-primary/20 text-aura-accent px-6 py-3 rounded-full text-sm font-medium"
            >
              <Rocket className="w-4 h-4" />
              <span>Your New Life Starts With One Click</span>
            </motion.div>

            <div className="space-y-6">
              <h2 className="text-4xl md:text-7xl font-bold leading-tight">
                <span className="text-foreground">Stop Letting</span>
                <br />
                <span className="text-aura-warm">
                  Planning Paralysis
                </span>
                <br />
                <span className="text-foreground">Steal Your Dreams</span>
              </h2>
              
              <p className="text-xl md:text-2xl text-muted-foreground max-w-4xl mx-auto leading-relaxed">
                Every week you spend in planning chaos is a week your <span className="text-aura-primary font-semibold">AI-powered competitors</span> are 
                building their empire. The gap isn't shrinking. <span className="text-aura-accent font-semibold">It's time to fight back.</span>
              </p>
            </div>

            {/* Risk Reversal */}
            <div className="flex flex-col items-center space-y-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <Button 
                  size="lg" 
                  className="pulse-cta btn-glow bg-gradient-to-r from-primary via-secondary to-accent text-white px-12 py-6 text-xl font-bold group shadow-2xl"
                >
                  <Brain className="w-6 h-6 mr-3" />
                  Get AI Planning Now
                  <ArrowRight className="w-6 h-6 ml-3 group-hover:translate-x-2 transition-transform" />
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg" 
                  className="border-primary/30 text-aura-primary hover:bg-primary/10 px-8 py-6 text-lg"
                >
                  <Crown className="w-5 h-5 mr-2" />
                  Try Pro Free
                </Button>
              </div>

              <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
                <div className="flex items-center space-x-2">
                  <Shield className="w-4 h-4 text-green-500" />
                  <span>14-day free trial</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                  <span>No credit card required</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Timer className="w-4 h-4 text-green-500" />
                  <span>Setup in 2 minutes</span>
                </div>
              </div>
            </div>
          </div>

          {/* Social Proof Metrics */}
          <div className="metrics-container">
            <div className="text-center space-y-8">
              <h3 className="text-2xl font-bold text-foreground">Join Thousands Already Winning</h3>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                {socialProof.map((metric, index) => (
                  <GlassCard 
                    key={index}
                    variant="hover"
                    className="metric-card text-center group"
                  >
                    <div className="space-y-3">
                      <metric.icon className="w-8 h-8 mx-auto text-aura-primary group-hover:scale-110 transition-transform" />
                      <div className="text-3xl font-bold text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                        {metric.metric}
                      </div>
                      <div className="text-sm text-muted-foreground">{metric.label}</div>
                    </div>
                  </GlassCard>
                ))}
              </div>
            </div>
          </div>

          {/* Testimonials */}
          <div className="testimonials-container space-y-8">
            <div className="text-center space-y-4">
              <h3 className="text-3xl font-bold text-foreground">What Early Users Are Saying</h3>
              <p className="text-muted-foreground">Real results from real people</p>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {testimonials.map((testimonial, index) => (
                <GlassCard 
                  key={index}
                  variant="hover"
                  className="testimonial-card group"
                >
                  <div className="space-y-4">
                    <div className="text-lg">{testimonial.avatar}</div>
                    <blockquote className="text-muted-foreground leading-relaxed">
                      "{testimonial.quote}"
                    </blockquote>
                    <div className="space-y-1">
                      <div className="font-semibold text-foreground">{testimonial.author}</div>
                      <div className="text-sm text-muted-foreground">{testimonial.role}</div>
                    </div>
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Cost of Inaction */}
          <div className="pain-points-container">
            <GlassCard variant="default" size="lg" className="bg-destructive/5 border-destructive/20">
              <div className="grid lg:grid-cols-2 gap-12 items-center">
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-3xl font-bold text-aura-warm">The Cost of Waiting</h3>
                    <p className="text-muted-foreground leading-relaxed">
                      Every day you delay is another day of lost productivity, missed opportunities, 
                      and watching others succeed with AI while you struggle alone.
                    </p>
                  </div>

                  <div className="space-y-3">
                    {painPoints.map((point, index) => (
                      <motion.div 
                        key={index}
                        className="pain-point flex items-center space-x-3 p-3 bg-destructive/10 rounded-lg"
                        whileHover={{ x: 5 }}
                      >
                        <AlertTriangle className="w-5 h-5 text-aura-warm flex-shrink-0" />
                        <span className="text-sm text-muted-foreground">{point}</span>
                      </motion.div>
                    ))}
                  </div>
                </div>

                <div className="space-y-6">
                  <div className="text-center space-y-4">
                    <div className="text-6xl font-bold text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                      TODAY
                    </div>
                    <div className="text-xl font-medium text-foreground">Is The Day You Take Control</div>
                    <p className="text-muted-foreground">
                      Stop being a victim of planning chaos. Join the AI revolution and 
                      start achieving your goals at superhuman speed.
                    </p>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full btn-glow bg-gradient-to-r from-primary to-secondary text-white group text-lg py-6"
                  >
                    <Zap className="w-5 h-5 mr-2" />
                    Break Free From Planning Hell
                    <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                  </Button>
                </div>
              </div>
            </GlassCard>
          </div>

          {/* Zero-Risk Promise */}
          <div className="text-center space-y-8">
            <GlassCard variant="glow" size="lg" className="bg-primary/5 border-primary/20">
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="text-4xl">🚀</div>
                  <h3 className="text-2xl font-bold text-foreground">Start Risk-Free Today</h3>
                  <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
                    Experience the power of AI planning with our comprehensive 14-day free trial. 
                    No credit card required. No commitments. Just pure productivity transformation.
                  </p>
                </div>

                <div className="grid md:grid-cols-3 gap-6 text-center">
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-green-500/10 rounded-full flex items-center justify-center mx-auto">
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    </div>
                    <h4 className="font-semibold">Full Feature Access</h4>
                    <p className="text-sm text-muted-foreground">Try everything - AI agents, research, integrations</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-blue-500/10 rounded-full flex items-center justify-center mx-auto">
                      <Shield className="w-6 h-6 text-blue-500" />
                    </div>
                    <h4 className="font-semibold">No Commitment</h4>
                    <p className="text-sm text-muted-foreground">Cancel anytime. No questions asked</p>
                  </div>
                  <div className="space-y-2">
                    <div className="w-12 h-12 bg-purple-500/10 rounded-full flex items-center justify-center mx-auto">
                      <Zap className="w-6 h-6 text-purple-500" />
                    </div>
                    <h4 className="font-semibold">Instant Setup</h4>
                    <p className="text-sm text-muted-foreground">Start planning in under 60 seconds</p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button 
                    size="lg" 
                    className="btn-glow bg-gradient-to-r from-primary to-secondary text-white px-10 py-5 text-lg font-semibold group"
                  >
                    <Brain className="w-6 h-6 mr-3" />
                    Start Your AI Journey
                    <Sparkles className="w-6 h-6 ml-3 group-hover:rotate-12 transition-transform" />
                  </Button>
                  
                  <Button 
                    variant="outline" 
                    size="lg" 
                    className="border-primary/30 text-aura-primary hover:bg-primary/10 px-8 py-5 text-lg"
                  >
                    <Users className="w-5 h-5 mr-2" />
                    Talk to an Expert
                  </Button>
                </div>

                <div className="text-xs text-muted-foreground">
                  Join thousands of professionals already transforming their productivity with AI
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </div>

      {/* Background Elements */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/4 -left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl animate-pulse" />
        <div className="absolute bottom-1/4 -right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-3xl animate-pulse delay-1000" />
        <div className="absolute top-3/4 left-1/3 w-64 h-64 bg-accent/5 rounded-full blur-2xl animate-pulse delay-2000" />
      </div>
    </section>
  );
} 