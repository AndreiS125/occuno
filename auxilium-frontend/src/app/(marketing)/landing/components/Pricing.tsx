'use client';

import { useState, useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { 
  CheckIcon, 
  XMarkIcon, 
  SparklesIcon, 
  CpuChipIcon,
  BoltIcon,
  StarIcon,
  FireIcon,
  LightBulbIcon
} from '@heroicons/react/24/outline';

gsap.registerPlugin(ScrollTrigger);

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);
  const [hoveredPlan, setHoveredPlan] = useState<number | null>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const plansRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      // Plan cards reveal animation
      ScrollTrigger.create({
        trigger: plansRef.current,
        start: "top 80%",
        onEnter: () => {
          gsap.from('.pricing-card', {
            y: 80,
            opacity: 0,
            duration: 1,
            ease: "power3.out",
            stagger: 0.2
          });
        }
      });

      // AI glow effect on pro plan
      gsap.to('.pro-glow', {
        boxShadow: '0 0 60px rgba(168, 85, 247, 0.6)',
        duration: 2,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut"
      });

      // Feature check animations
      gsap.to('.feature-check', {
        scale: 1.1,
        duration: 0.5,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
        stagger: 0.1
      });

    }, sectionRef);

    return () => ctx.revert();
  }, []);

  const pricingPlans = [
    {
      name: "Free",
      description: "Perfect for trying AI-powered planning",
      monthlyPrice: 0,
      annualPrice: 0,
      badge: null,
      color: "from-gray-600 to-gray-800",
      features: [
        "Basic AI planning assistant",
        "Up to 50 tasks per month",
        "Google Calendar import",
        "Simple task breakdown",
        "Basic gamification",
        "Mobile app access"
      ],
      limitations: [
        "No internet research",
        "Basic AI model only",
        "Limited integrations",
        "No team features"
      ],
      aiPower: "Basic AI",
      aiDescription: "Simple task organization and basic suggestions",
      ctaText: "Start Free",
      popular: false
    },
    {
      name: "Plus",
      description: "Multi-agent AI with research capabilities",
      monthlyPrice: 19,
      annualPrice: 15,
      badge: "Most Popular",
      color: "from-blue-600 to-cyan-600",
      features: [
        "Multi-agent AI system",
        "Unlimited tasks",
        "Internet research AI",
        "Advanced task breakdown",
        "Full gamification suite",
        "Notion integration",
        "Priority support",
        "Custom objectives"
      ],
      limitations: [
        "Standard AI models",
        "Limited research depth"
      ],
      aiPower: "Multi-Agent AI",
      aiDescription: "Planning + Research agents working together",
      ctaText: "Upgrade to Plus",
      popular: true
    },
    {
      name: "Pro",
      description: "Maximum AI power with top-tier models",
      monthlyPrice: 49,
      annualPrice: 39,
      badge: "Maximum Power",
      color: "from-purple-600 to-pink-600",
      features: [
        "Maximum AI intelligence",
        "Unlimited everything",
        "Deep research AI",
        "Advanced rollback system",
        "Complete analytics",
        "All integrations",
        "Team collaboration",
        "Priority AI processing",
        "Custom AI training",
        "White-glove onboarding"
      ],
      limitations: [],
      aiPower: "Maximum AI",
      aiDescription: "Top LLMs + unlimited research + custom training",
      ctaText: "Go Pro",
      popular: false
    }
  ];

  const aiComparison = [
    {
      feature: "AI Model Quality",
      free: "Basic",
      plus: "Advanced",
      pro: "Top-tier GPT-4+"
    },
    {
      feature: "Research Capability",
      free: "None",
      plus: "Standard",
      pro: "Deep & Unlimited"
    },
    {
      feature: "Planning Agents",
      free: "1 Simple",
      plus: "3 Multi-agent",
      pro: "5+ Specialized"
    },
    {
      feature: "Response Speed",
      free: "Standard",
      plus: "Fast",
      pro: "Instant Priority"
    }
  ];

  return (
    <div ref={sectionRef} className="relative py-32 bg-gradient-to-b from-slate-900 via-indigo-950 to-slate-900 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 opacity-20">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-indigo-500/20 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/20 rounded-full blur-3xl animate-pulse delay-1000"></div>
      </div>

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        {/* Main headline */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/20 rounded-full px-6 py-2 mb-8">
            <CpuChipIcon className="w-5 h-5 text-indigo-400" />
            <span className="text-indigo-300 font-semibold">Choose Your Intelligence Level</span>
          </div>
          
          <h2 className="text-4xl md:text-6xl font-bold mb-6 bg-gradient-to-b from-white via-indigo-100 to-purple-200 bg-clip-text text-transparent">
            Pricing That Scales
            <br />
            <span className="bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
              With Your Ambition
            </span>
          </h2>
          
          <p className="text-xl text-gray-300 max-w-3xl mx-auto mb-8 leading-relaxed">
            Start free and upgrade as you need more AI power. Every plan includes the core productivity features—what changes is how intelligent your assistant becomes.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-4 mb-8">
            <span className={`font-semibold ${!isAnnual ? 'text-white' : 'text-gray-400'}`}>Monthly</span>
            <button
              onClick={() => setIsAnnual(!isAnnual)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAnnual ? 'bg-indigo-600' : 'bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAnnual ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
            <span className={`font-semibold ${isAnnual ? 'text-white' : 'text-gray-400'}`}>
              Annual
              <span className="ml-2 text-sm text-green-400">(Save 20%)</span>
            </span>
          </div>
        </div>

        {/* Pricing cards */}
        <div ref={plansRef} className="grid lg:grid-cols-3 gap-8 mb-16">
          {pricingPlans.map((plan, index) => (
            <div
              key={index}
              className={`pricing-card relative ${plan.name === 'Pro' ? 'pro-glow' : ''}`}
              onMouseEnter={() => setHoveredPlan(index)}
              onMouseLeave={() => setHoveredPlan(null)}
            >
              {/* Popular badge */}
              {plan.badge && (
                <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                  <div className={`bg-gradient-to-r ${plan.color} text-white px-4 py-2 rounded-full text-sm font-semibold shadow-lg`}>
                    {plan.badge}
                  </div>
                </div>
              )}

              <div className={`p-8 bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-3xl backdrop-blur-sm hover:from-white/15 hover:to-white/10 transition-all duration-500 h-full ${
                plan.popular ? 'ring-2 ring-blue-500/50' : ''
              }`}>
                {/* Plan header */}
                <div className="text-center mb-8">
                  <div className={`w-16 h-16 bg-gradient-to-br ${plan.color} rounded-2xl mx-auto mb-4 flex items-center justify-center`}>
                    {plan.name === 'Free' && <BoltIcon className="w-8 h-8 text-white" />}
                    {plan.name === 'Plus' && <SparklesIcon className="w-8 h-8 text-white" />}
                    {plan.name === 'Pro' && <StarIcon className="w-8 h-8 text-white" />}
                  </div>
                  
                  <h3 className="text-2xl font-bold text-white mb-2">{plan.name}</h3>
                  <p className="text-gray-400 mb-6">{plan.description}</p>
                  
                  <div className="mb-6">
                    <div className="text-5xl font-bold text-white mb-2">
                      ${isAnnual ? plan.annualPrice : plan.monthlyPrice}
                      <span className="text-lg text-gray-400 font-normal">/month</span>
                    </div>
                    {isAnnual && plan.monthlyPrice > 0 && (
                      <div className="text-sm text-green-400">
                        Save ${(plan.monthlyPrice - plan.annualPrice) * 12}/year
                      </div>
                    )}
                  </div>

                  {/* AI Power indicator */}
                  <div className={`p-4 bg-gradient-to-br ${plan.color}/20 border border-white/10 rounded-xl mb-6`}>
                    <div className="flex items-center gap-2 mb-2">
                      <CpuChipIcon className="w-5 h-5 text-indigo-400" />
                      <span className="text-white font-semibold">{plan.aiPower}</span>
                    </div>
                    <p className="text-gray-300 text-sm">{plan.aiDescription}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="space-y-4 mb-8">
                  {plan.features.map((feature, featureIndex) => (
                    <div key={featureIndex} className="flex items-center gap-3">
                      <CheckIcon className="w-5 h-5 text-green-400 flex-shrink-0 feature-check" />
                      <span className="text-gray-300">{feature}</span>
                    </div>
                  ))}
                  
                  {plan.limitations.map((limitation, limitIndex) => (
                    <div key={limitIndex} className="flex items-center gap-3 opacity-60">
                      <XMarkIcon className="w-5 h-5 text-gray-500 flex-shrink-0" />
                      <span className="text-gray-500 line-through">{limitation}</span>
                    </div>
                  ))}
                </div>

                {/* CTA */}
                <button className={`w-full py-4 rounded-xl font-semibold transition-all duration-300 ${
                  plan.name === 'Free' 
                    ? 'bg-white/10 border border-white/20 text-white hover:bg-white/20'
                    : plan.name === 'Plus'
                    ? 'bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white shadow-lg hover:shadow-blue-500/25'
                    : 'bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-500 hover:to-pink-500 text-white shadow-lg hover:shadow-purple-500/25'
                } hover:scale-105`}>
                  {plan.ctaText}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* AI comparison table */}
        <div className="mb-16">
          <div className="text-center mb-8">
            <h3 className="text-3xl font-bold text-white mb-4">AI Intelligence Comparison</h3>
            <p className="text-gray-400">See exactly what AI power you get with each plan</p>
          </div>
          
          <div className="bg-gradient-to-br from-white/10 to-white/5 border border-white/10 rounded-2xl backdrop-blur-sm overflow-hidden">
            <div className="grid grid-cols-4 gap-4 p-6 border-b border-white/10">
              <div className="font-semibold text-white">Feature</div>
              <div className="text-center font-semibold text-gray-400">Free</div>
              <div className="text-center font-semibold text-blue-400">Plus</div>
              <div className="text-center font-semibold text-purple-400">Pro</div>
            </div>
            
            {aiComparison.map((row, index) => (
              <div key={index} className="grid grid-cols-4 gap-4 p-6 border-b border-white/10 last:border-b-0">
                <div className="text-white font-medium">{row.feature}</div>
                <div className="text-center text-gray-400">{row.free}</div>
                <div className="text-center text-blue-300">{row.plus}</div>
                <div className="text-center text-purple-300">{row.pro}</div>
              </div>
            ))}
          </div>
        </div>

        {/* FAQ & Trust builders */}
        <div className="grid md:grid-cols-2 gap-12 mb-16">
          {/* Guarantees */}
          <div className="bg-gradient-to-br from-green-900/20 via-emerald-900/10 to-transparent border border-green-500/20 rounded-2xl p-8">
            <h4 className="text-2xl font-bold text-white mb-6">Our Promises</h4>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <CheckIcon className="w-6 h-6 text-green-400" />
                <span className="text-gray-300">30-day money-back guarantee</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon className="w-6 h-6 text-green-400" />
                <span className="text-gray-300">Cancel anytime, no questions asked</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon className="w-6 h-6 text-green-400" />
                <span className="text-gray-300">Your data stays yours forever</span>
              </div>
              <div className="flex items-center gap-3">
                <CheckIcon className="w-6 h-6 text-green-400" />
                <span className="text-gray-300">Upgrade or downgrade anytime</span>
              </div>
            </div>
          </div>

          {/* Usage stats */}
          <div className="bg-gradient-to-br from-blue-900/20 via-indigo-900/10 to-transparent border border-blue-500/20 rounded-2xl p-8">
            <h4 className="text-2xl font-bold text-white mb-6">Real Usage Stats</h4>
            <div className="space-y-4">
              <div>
                <div className="text-3xl font-bold text-blue-400">89%</div>
                <div className="text-gray-300">Upgrade to Plus within 30 days</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-purple-400">67%</div>
                <div className="text-gray-300">Eventually choose Pro for max AI</div>
              </div>
              <div>
                <div className="text-3xl font-bold text-green-400">2.3x</div>
                <div className="text-gray-300">Productivity increase on average</div>
              </div>
            </div>
          </div>
        </div>

        {/* Final CTA */}
        <div className="text-center p-12 bg-gradient-to-br from-indigo-900/30 via-purple-900/20 to-indigo-900/30 border border-white/10 rounded-3xl backdrop-blur-sm">
          <h3 className="text-3xl font-bold text-white mb-6">Start Your AI-Powered Journey</h3>
          <p className="text-xl text-gray-300 mb-8 max-w-3xl mx-auto leading-relaxed">
            Join thousands who've transformed their productivity with AI. Start free, upgrade when you're ready for more power.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button className="bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-500 hover:to-cyan-500 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 shadow-lg hover:shadow-blue-500/25 hover:scale-105">
              Start Free Trial
            </button>
            <button className="bg-white/10 border border-white/20 hover:bg-white/20 text-white px-8 py-4 rounded-xl text-lg font-semibold transition-all duration-300 hover:scale-105">
              See All Features
            </button>
          </div>
        </div>
      </div>
    </div>
  );
} 