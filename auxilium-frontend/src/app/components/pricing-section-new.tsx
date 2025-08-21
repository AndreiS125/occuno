"use client";

import { useState } from "react";
import { 
  Check,
  X,
  Brain,
  Search,
  Cpu,
  ArrowRight,
  Crown,
  Calculator,
  TrendingUp,
  Shield,
  Clock,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";

interface PricingSectionProps {
  className?: string;
}

export default function PricingSection({ className }: PricingSectionProps) {
  const [billingCycle, setBillingCycle] = useState<"monthly" | "yearly">("monthly");

  const plans = [
    {
      name: "Free",
      agent: "Simple Agent",
      agentIcon: Brain,
      description: "Perfect for getting started with AI planning",
      monthlyPrice: 0,
      yearlyPrice: 0,
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
      cta: "Get Started Free"
    },
    {
      name: "Plus",
      agent: "Research Agent",
      agentIcon: Search,
      description: "For professionals who need research-powered planning",
      monthlyPrice: 19,
      yearlyPrice: 15,
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
      cta: "Start Plus Trial"
    },
    {
      name: "Pro",
      agent: "Max Agent", 
      agentIcon: Cpu,
      description: "Maximum AI power for serious achievers",
      monthlyPrice: 49,
      yearlyPrice: 39,
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
      cta: "Go Pro"
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

  const getPrice = (plan: typeof plans[0]) => {
    return billingCycle === "monthly" ? plan.monthlyPrice : plan.yearlyPrice;
  };

  const getSavings = (plan: typeof plans[0]) => {
    if (plan.monthlyPrice === 0) return 0;
    return Math.round(((plan.monthlyPrice * 12 - plan.yearlyPrice * 12) / (plan.monthlyPrice * 12)) * 100);
  };

  return (
    <section className={`py-24 px-6 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-16">
          <div className="inline-flex items-center space-x-2 bg-accent/10 border border-accent/20 text-accent px-6 py-3 rounded-full text-sm font-medium">
            <Crown className="w-4 h-4" />
            <span>Choose Your AI Advantage</span>
          </div>

          <h2 className="text-4xl lg:text-6xl font-light leading-tight">
            <span className="text-foreground">Stop Competing With</span>
            <br />
            <span className="text-primary font-medium">AI-Powered Teams</span>
          </h2>

          <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
            Start free, upgrade when you need more AI power. Every tier gives you superhuman planning abilities.
          </p>

          {/* Billing Toggle */}
          <div className="flex items-center justify-center space-x-4">
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
              <span className="bg-accent/10 text-accent text-xs px-2 py-1 rounded-full">
                Save up to 25%
              </span>
            )}
          </div>
        </div>

        {/* Pricing Cards */}
        <div className="grid lg:grid-cols-3 gap-8 mb-16">
          {plans.map((plan, index) => (
            <div 
              key={index}
              className={`bg-card border rounded-lg p-6 relative ${
                plan.popular ? 'border-primary ring-2 ring-primary/20' : 'border-border'
              }`}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 bg-primary text-primary-foreground px-4 py-1 rounded-full text-sm font-medium">
                  Most Popular
                </div>
              )}

              <div className="space-y-6">
                {/* Plan Header */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <h3 className="text-xl font-semibold">{plan.name}</h3>
                      <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                        <plan.agentIcon className="w-4 h-4" />
                        <span>{plan.agent}</span>
                      </div>
                    </div>
                    <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                      <plan.agentIcon className="w-5 h-5 text-primary" />
                    </div>
                  </div>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {plan.description}
                  </p>
                </div>

                {/* Pricing */}
                <div className="space-y-2">
                  <div className="flex items-baseline space-x-2">
                    <span className="text-3xl font-bold">
                      ${getPrice(plan)}
                    </span>
                    {plan.monthlyPrice > 0 && (
                      <span className="text-muted-foreground">
                        /month
                      </span>
                    )}
                  </div>
                  
                  {billingCycle === 'yearly' && getSavings(plan) > 0 && (
                    <div className="text-sm text-accent font-medium">
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
                  <h4 className="font-medium text-sm">Everything in {plan.name}:</h4>
                  <div className="space-y-2">
                    {plan.features.map((feature, i) => (
                      <div key={i} className="flex items-start space-x-3">
                        <Check className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                        <span className="text-sm text-muted-foreground">{feature}</span>
                      </div>
                    ))}
                  </div>

                  {/* Limitations */}
                  {plan.limitations.length > 0 && (
                    <div className="pt-3 border-t border-border">
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
                      ? 'bg-primary hover:bg-primary/90 text-white' 
                      : 'variant-outline border-border text-foreground hover:bg-accent'
                  }`}
                >
                  {plan.cta}
                  {plan.name !== 'Free' && (
                    <ArrowRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                  )}
                </Button>

                {/* Additional Info */}
                <div className="text-center">
                  {plan.name === 'Free' ? (
                    <p className="text-xs text-muted-foreground">
                      No credit card required
                    </p>
                  ) : (
                    <p className="text-xs text-muted-foreground">
                      14-day free trial • Cancel anytime
                    </p>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* ROI Calculator */}
        <div className="mb-16">
          <div className="bg-card border border-border rounded-lg p-8">
            <div className="grid lg:grid-cols-2 gap-8 items-center">
              <div className="space-y-6">
                <div className="space-y-4">
                  <h3 className="text-2xl lg:text-3xl font-semibold">Calculate Your ROI</h3>
                  <p className="text-lg text-muted-foreground leading-relaxed">
                    If AI saves you just 2 hours per week of planning time, Plus pays for itself.
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg">
                    <span className="text-sm">Time saved per week:</span>
                    <span className="font-semibold">3.2 hours</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-muted/20 rounded-lg">
                    <span className="text-sm">Value per hour (conservative):</span>
                    <span className="font-semibold">$50</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-primary/10 border border-primary/20 rounded-lg">
                    <span className="text-sm font-medium">Monthly value created:</span>
                    <span className="font-bold text-primary text-lg">$640</span>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div className="text-center space-y-4">
                  <div className="text-5xl font-bold text-primary">
                    34x
                  </div>
                  <div className="text-lg font-medium">ROI on Plus plan</div>
                  <p className="text-sm text-muted-foreground">
                    Based on conservative estimates. Most users see 5-10x more value.
                  </p>
                </div>

                <Button size="lg" className="w-full bg-primary hover:bg-primary/90 text-white group">
                  <Calculator className="w-5 h-5 mr-2" />
                  See Your Personal ROI
                  <TrendingUp className="w-5 h-5 ml-2 group-hover:scale-110 transition-transform" />
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* FAQs */}
        <div className="space-y-8">
          <div className="text-center space-y-4">
            <h3 className="text-2xl lg:text-3xl font-semibold">Frequently Asked Questions</h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about our AI planning platform.
            </p>
          </div>

          <div className="grid md:grid-cols-2 gap-6">
            {faqs.map((faq, index) => (
              <div key={index} className="bg-card border border-border rounded-lg p-6">
                <div className="space-y-3">
                  <h4 className="font-medium text-foreground">
                    {faq.question}
                  </h4>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {faq.answer}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center space-y-8 mt-16">
          <div className="space-y-4">
            <h3 className="text-2xl lg:text-3xl font-semibold">
              Ready to <span className="text-primary">10x Your Planning?</span>
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              Join thousands who've already made the switch to AI-powered productivity.
              Start free, upgrade when you're ready.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="bg-primary hover:bg-primary/90 text-white px-8 py-4 text-lg group"
            >
              <Brain className="w-5 h-5 mr-2" />
              Start Free Trial
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
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
        </div>
      </div>
    </section>
  );
}
