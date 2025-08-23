"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  Check,
  X,
  Zap,
  Crown,
  Rocket,
  Brain,
  Search,
  Cpu,
  ArrowRight,
  Sparkles,
  TrendingUp,
  Shield,
  Clock,
  Users,
  Star,
  ChevronRight,
  Infinity,
  Calculator
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "./ui/glass-card";

interface PricingSectionProps {
  className?: string;
}

export default function PricingSection({ className }: PricingSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);

  const plans = [
    {
      name: "Free",
      agent: "Simple Agent",
      agentIcon: Brain,
      description: "Perfect for getting started with AI planning",
      monthlyPrice: 0,
      yearlyPrice: 0,
      color: "primary",
      popular: false,
      features: [
        "Simple AI planning agent",
        "Instant task breakdown",
        "Basic time estimation",
        "Up to 10 objectives",
        "Google Calendar import",
        "Mobile app access"
      ],
      limitations: [
        "No internet research",
        "Limited AI capabilities",
        "Basic analytics only"
      ],
      cta: "Get Started Free",
      gradient: "from-primary/20 to-primary/5"
    },
    {
      name: "Plus",
      agent: "Research Agent",
      agentIcon: Search,
      description: "For professionals who need research-powered planning",
      monthlyPrice: 19,
      yearlyPrice: 15,
      color: "secondary",
      popular: true,
      features: [
        "Multi-agent AI with research",
        "Internet research integration",
        "Market analysis & trends",
        "Unlimited objectives",
        "Advanced analytics",
        "Notion integration",
        "Gantt chart view",
        "Team collaboration (5 users)",
        "Priority support"
      ],
      limitations: [
        "Limited to GPT-4 class models"
      ],
      cta: "Start Plus Trial",
      gradient: "from-secondary/20 to-secondary/5"
    },
    {
      name: "Pro",
      agent: "Max Agent", 
      agentIcon: Cpu,
      description: "Maximum AI power for serious achievers",
      monthlyPrice: 49,
      yearlyPrice: 39,
      color: "accent",
      popular: false,
      features: [
        "Max AI agent with top LLMs",
        "Advanced reasoning & strategy",
        "Deep research synthesis",
        "Risk assessment & planning",
        "Unlimited everything",
        "Advanced integrations",
        "Custom workflows",
        "Team collaboration (25 users)",
        "White-glove onboarding",
        "24/7 priority support"
      ],
      limitations: [],
      cta: "Go Pro",
      gradient: "from-accent/20 to-accent/5"
    }
  ];

  const faqs = [
    {
      question: "Can I change plans anytime?",
      answer: "Yes! Upgrade or downgrade instantly. Pro-rated billing applies."
    },
    {
      question: "What happens to my data if I downgrade?",
      answer: "Your data is preserved. You'll just have limited access to premium features."
    },
    {
      question: "Is there any risk trying the paid plans?",
      answer: "Start with our generous 14-day free trial. No credit card required for Free plan. Cancel anytime before billing."
    },
    {
      question: "How does the AI research work?",
      answer: "Research agents browse the internet in real-time to gather relevant information for your objectives."
    }
  ];

  // Simplified GSAP Animations
  useGSAP(() => {
    // Simple entrance animations without ScrollTrigger
    gsap.set(".pricing-card", { opacity: 0, y: 30 });
    gsap.set(".faq-item", { opacity: 0, x: -20 });

    // One-time entrance animations
    gsap.to(".pricing-card", {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.15,
      ease: "power2.out",
      delay: 0.2
    });

    gsap.to(".faq-item", {
      opacity: 1,
      x: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      delay: 0.8
    });

  }, { scope: sectionRef });

  const getPrice = (plan: typeof plans[0]) => {
    return billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return 0;
    return Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice * 12) / (plan.monthlyPrice * 12)) * 100);
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
            className="inline-flex items-center space-x-2 bg-accent/10 border border-accent/20 text-accent px-6 py-3 rounded-full text-sm font-medium"
          >
            <Crown className="w-4 h-4" />
            <span>Choose Your AI Advantage</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            <span className="text-foreground">Stop Competing With</span>
            <br />
            <span className="text-gradient bg-gradient-to-r from-accent via-secondary to-primary bg-clip-text text-transparent">
              AI-Powered Teams
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            Start free, upgrade when you need more AI power. Every tier gives you superhuman planning abilities. 
            <span className="text-primary font-semibold">Join them instead.</span>
          </motion.p>

          {/* Billing Toggle */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.4 }}
            className="flex items-center justify-center space-x-4"
          >
            <span className={`text-sm ${billingCycle === 'monthly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Monthly
            </span>
            <button
              onClick={() => setBillingCycle(billingCycle === 'monthly' ? 'yearly' : 'monthly')}
              className="relative w-16 h-8 bg-muted rounded-full transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-opacity-50"
            >
              <div className={`absolute top-1 left-1 w-6 h-6 bg-white rounded-full transition-transform duration-200 ${
                billingCycle === 'yearly' ? 'translate-x-8' : 'translate-x-0'
              }`} />
            </button>
            <span className={`text-sm ${billingCycle === 'yearly' ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
              Yearly
            </span>
            {billingCycle === 'yearly' && (
              <span className="bg-green-500/10 text-green-500 text-xs px-2 py-1 rounded-full">
                Save up to 25%
              </span>
            )}
          </motion.div>
        </div>

        {/* Pricing Cards */}
        <div className="pricing-container grid lg:grid-cols-3 gap-8 mb-20">
          {plans.map((plan, index) => (
            <GlassCard 
              key={index}
              variant={plan.popular ? "glow" : "hover"}
              className={`pricing-card relative transition-all duration-300 ${
                hoveredPlan === index ? 'scale-105' : ''
              } ${plan.popular ? 'ring-2 ring-secondary/30' : ''}`}
              onMouseEnter={() => setHoveredPlan(index)}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="popular-badge absolute -top-4 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-secondary to-accent text-white px-6 py-2 rounded-full text-sm font-medium">
                  <Sparkles className="w-4 h-4 inline mr-1" />
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                {/* Plan Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-2xl font-bold">{plan.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <plan.agentIcon className="w-4 h-4" />
                        <span>{plan.agent}</span>
                      </div>
                    </div>
                    <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${plan.gradient} flex items-center justify-center`}>
                      <plan.agentIcon className="w-6 h-6" />
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-4xl font-bold">
                      ${getPrice(plan)}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-muted-foreground">
                        /{billingCycle === 'monthly' ? 'month' : 'month'}
                      </span>
                    )}
                  </div>
                  
                  {billingCycle === 'yearly' && getSavings(plan) > 0 && (
                    <div className="text-sm text-green-500 font-medium">
                      Save {getSavings(plan)}% annually
                    </div>
                  )}

                  {billingCycle === 'yearly' && plan.monthlyPrice > 0 && (
                    <div className="text-xs text-muted-foreground">
                      Billed annually at ${plan.yearlyPrice * 12}
                    </div>
                  )}
                </div>

                {/* Features */}
                <div className="space-y-3">
                  <h4 className="font-semibold text-sm">Everything in {plan.name}:</h4>
                  <div className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="pt-3 border-t border-border/30">
                      <div className="space-y-2">
                        {plan.limitations.map((limitation, i) => (
                          <div key={i} className="flex items-start space-x-3">
                            <X className="w-4 h-4 text-muted-foreground flex-shrink-0 mt-0.5" />
                            <span className="text-xs text-muted-foreground">{limitation}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* CTA Button */}
                <Button 
                  size="lg" 
                  className={`w-full group ${
                    plan.popular 
                      ? 'btn-glow bg-gradient-to-r from-secondary to-accent text-white' 
                      : plan.name === 'Free'
                        ? 'variant-outline border-primary/30 text-primary hover:bg-primary/10'
                        : 'variant-outline border-accent/30 text-accent hover:bg-accent/10'
                  }`}
                >
                  {plan.name === 'Free' ? (
                    <>
                      <Rocket className="w-5 h-5 mr-2" />
                      {plan.cta}
                    </>
                  ) : (
                    <>
                      <Zap className="w-5 h-5 mr-2" />
                      {plan.cta}
                      <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </Button>

                {/* Additional Info */}
                <div className="text-center space-y-2">
                  {plan.name === 'Free' && (
                    <p className="text-xs text-muted-foreground">
                      No credit card required
                    </p>
                  )}
                  {plan.name !== 'Free' && (
                    <p className="text-xs text-muted-foreground">
                      14-day free trial • Cancel anytime
                    </p>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {/* ROI Calculator */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-20"
        >
          <GlassCard variant="default" size="lg">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl font-bold text-foreground">Calculate Your ROI</h3>
                  <p className="text-muted-foreground leading-relaxed">
                    If AI saves you just 2 hours per week of planning time, Plus pays for itself.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg">
                    <span className="text-sm">Time saved per week:</span>
                    <span className="font-bold">3.2 hours</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg">
                    <span className="text-sm">Value per hour (conservative):</span>
                    <span className="font-bold">$50</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <span className="text-sm font-medium">Monthly value created:</span>
                    <span className="font-bold text-primary text-lg">$640</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="text-6xl font-bold text-gradient bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
                    34x
                  </div>
                  <div className="text-lg font-medium">ROI on Plus plan</div>
                  <p className="text-sm text-muted-foreground">
                    Based on conservative estimates. Most users see 5-10x more value.
                  </p>
                </div>

                <Button size="lg" className="w-full btn-glow bg-gradient-to-r from-primary to-secondary text-white group">
                  <Calculator className="w-5 h-5 mr-2" />
                  See Your Personal ROI
                  <TrendingUp className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* FAQs */}
        <div className="faqs-container space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-3xl font-bold text-foreground">Frequently Asked Questions</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Everything you need to know about our AI planning platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <GlassCard key={index} variant="hover" className="faq-item group">
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                      {faq.question}
                    </h4>
                    <ChevronRight className="w-5 h-5 text-muted-foreground group-hover:text-primary transition-colors flex-shrink-0" />
                  </div>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-8 mt-20"
        >
          <div className="space-y-4">
            <h3 className="text-3xl font-bold text-foreground">
              Ready to <span className="text-primary">10x Your Planning?</span>
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Join thousands who've already made the switch to AI-powered productivity.
              Start free, upgrade when you're ready.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="btn-glow bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 text-lg group"
            >
              <Brain className="w-5 h-5 mr-2" />
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="border-primary/30 text-primary hover:bg-primary/10 px-8 py-4 text-lg"
            >
              <Users className="w-5 h-5 mr-2" />
              Talk to Sales
            </Button>
          </div>

          <div className="flex items-center justify-center space-x-8 text-sm text-muted-foreground">
            <div className="flex items-center space-x-2">
              <Shield className="w-4 h-4" />
              <span>14-day free trial</span>
            </div>
            <div className="flex items-center space-x-2">
              <Clock className="w-4 h-4" />
              <span>Cancel anytime</span>
            </div>
            <div className="flex items-center space-x-2">
              <Star className="w-4 h-4" />
              <span>No setup fees</span>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 