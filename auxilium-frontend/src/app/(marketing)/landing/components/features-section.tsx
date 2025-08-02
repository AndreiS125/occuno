"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  Calendar,
  BarChart3,
  Trophy,
  Zap,
  Database,
  Smartphone,
  ArrowRight,
  CheckCircle2,
  Gamepad2,
  Target,
  TrendingUp,
  Users,
  Import,
  GitBranch,
  Layers,
  Clock,
  Star,
  Award
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { GlassCard } from "./ui/glass-card";

interface FeaturesSectionProps {
  className?: string;
}

export default function FeaturesSection({ className }: FeaturesSectionProps) {
  const sectionRef = useRef<HTMLDivElement>(null);
  const [activeFeature, setActiveFeature] = useState(0);

  const mainFeatures = [
    {
      icon: Calendar,
      title: "Never Start From Scratch",
      subtitle: "Google Calendar Migration",
      description: "Import your existing calendar in minutes. Read-only sync means easy migration without the complexity.",
      benefits: [
        "One-click Google Calendar import",
        "Preserve all your existing events",
        "No sync conflicts or overwrites",
        "Start planning immediately"
      ],
      visual: {
        type: "calendar",
        data: "Live calendar preview with imported events"
      },
      color: "text-blue-500",
      bg: "bg-blue-500/10"
    },
    {
      icon: Database,
      title: "Research While You Sleep",
      subtitle: "AI Internet Research",
      description: "AI agents research market trends, competitor analysis, and industry insights before creating your plan.",
      benefits: [
        "Real-time internet research",
        "Market analysis and trends",
        "Competitor intelligence",
        "Data-driven recommendations"
      ],
      visual: {
        type: "research",
        data: "AI research dashboard with live data"
      },
      color: "text-purple-500",
      bg: "bg-purple-500/10"
    },
    {
      icon: GitBranch,
      title: "Break It Down, Build It Up",
      subtitle: "Infinite Task Nesting",
      description: "AI automatically breaks down complex goals into manageable tasks. Nest as deep as you need.",
      benefits: [
        "Unlimited nesting levels",
        "Automatic task breakdown",
        "Smart dependency mapping",
        "Visual progress tracking"
      ],
      visual: {
        type: "tree",
        data: "Interactive task tree with infinite levels"
      },
      color: "text-green-500",
      bg: "bg-green-500/10"
    },
    {
      icon: BarChart3,
      title: "See Your Success",
      subtitle: "Analytics & Gamification",
      description: "Track progress, earn achievements, and stay motivated with intelligent analytics and reward systems.",
      benefits: [
        "Progress analytics dashboard",
        "Achievement system",
        "Productivity streaks",
        "Performance insights"
      ],
      visual: {
        type: "analytics",
        data: "Live analytics dashboard with charts"
      },
      color: "text-orange-500",
      bg: "bg-orange-500/10"
    },
    {
      icon: Layers,
      title: "Your Way, AI-Powered",
      subtitle: "Notion Integration",
      description: "Seamlessly integrate with your existing Notion workspace. AI enhances your current workflow.",
      benefits: [
        "Two-way Notion sync",
        "Preserve your workspace",
        "AI-enhanced documentation",
        "Team collaboration ready"
      ],
      visual: {
        type: "integration",
        data: "Notion integration interface"
      },
      color: "text-cyan-500",
      bg: "bg-cyan-500/10"
    }
  ];

  const additionalFeatures = [
    {
      icon: Gamepad2,
      title: "Gamification System",
      description: "Turn productivity into a game with streaks, levels, and rewards"
    },
    {
      icon: BarChart3,
      title: "Gantt Chart View",
      description: "Visualize project timelines and dependencies clearly"
    },
    {
      icon: Smartphone,
      title: "Mobile Optimized",
      description: "Plan and track on any device, anywhere"
    },
    {
      icon: Users,
      title: "Team Collaboration",
      description: "Share objectives and track team progress"
    },
    {
      icon: Clock,
      title: "Time Tracking",
      description: "Automatic time estimation and tracking"
    },
    {
      icon: Target,
      title: "Goal Templates",
      description: "Pre-built templates for common objectives"
    }
  ];

  // Simplified GSAP Animations
  useGSAP(() => {
    // Simple entrance animations without ScrollTrigger
    gsap.set(".feature-card", { opacity: 0, y: 30 });
    gsap.set(".additional-feature", { opacity: 0, scale: 0.9 });

    // One-time entrance animations
    gsap.to(".feature-card", {
      opacity: 1,
      y: 0,
      duration: 0.6,
      stagger: 0.1,
      ease: "power2.out",
      delay: 0.2
    });

    gsap.to(".additional-feature", {
      opacity: 1,
      scale: 1,
      duration: 0.6,
      stagger: 0.1,
      ease: "back.out(1.2)",
      delay: 0.8
    });

  }, { scope: sectionRef });

  const currentFeature = mainFeatures[activeFeature];

  return (
    <section ref={sectionRef} className={`relative py-24 px-6 ${className}`}>
      <div className="container mx-auto max-w-7xl">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-20">
          <motion.div 
            initial={{ opacity: 0, scale: 0.8 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            className="inline-flex items-center space-x-2 bg-secondary/10 border border-secondary/20 text-secondary px-6 py-3 rounded-full text-sm font-medium"
          >
            <Star className="w-4 h-4" />
            <span>Complete Planning Ecosystem</span>
          </motion.div>

          <motion.h2 
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-4xl md:text-6xl font-bold leading-tight"
          >
            <span className="text-foreground">Everything You Need,</span>
            <br />
            <span className="text-gradient bg-gradient-to-r from-secondary via-accent to-primary bg-clip-text text-transparent">
              Nothing You Don't
            </span>
          </motion.h2>

          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
          >
            AI is just the beginning. Get calendar views, Gantt charts, analytics, gamification, 
            and seamless integrations in one <span className="text-primary font-semibold">beautiful</span> platform.
          </motion.p>
        </div>

        {/* Main Features Showcase */}
        <div className="grid lg:grid-cols-2 gap-12 mb-20">
          {/* Left: Feature Navigation */}
          <div className="space-y-6">
            <h3 className="text-2xl font-bold text-foreground mb-8">Core Features</h3>
            
            <div className="features-grid space-y-4">
              {mainFeatures.map((feature, index) => (
                <GlassCard 
                  key={index}
                  variant={activeFeature === index ? "glow" : "hover"}
                  className={`feature-card cursor-pointer transition-all duration-300 ${
                    activeFeature === index ? `${feature.bg} border-current/30` : ''
                  }`}
                  onClick={() => setActiveFeature(index)}
                >
                  <div className="flex items-start space-x-4">
                    <feature.icon className={`w-8 h-8 ${feature.color} flex-shrink-0 mt-1`} />
                    <div className="flex-1 space-y-2">
                      <div className="space-y-1">
                        <h4 className="font-bold text-lg">{feature.title}</h4>
                        <p className="text-sm opacity-75">{feature.subtitle}</p>
                      </div>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        {feature.description}
                      </p>
                      
                      {activeFeature === index && (
                        <motion.div 
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          className="pt-4 border-t border-current/20"
                        >
                          <div className="space-y-2">
                            {feature.benefits.map((benefit, i) => (
                              <div key={i} className="flex items-center space-x-2 text-xs">
                                <CheckCircle2 className="w-3 h-3 text-green-500 flex-shrink-0" />
                                <span>{benefit}</span>
                              </div>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </div>
                    
                    {activeFeature === index && (
                      <ArrowRight className="w-5 h-5 text-current animate-pulse" />
                    )}
                  </div>
                </GlassCard>
              ))}
            </div>
          </div>

          {/* Right: Feature Visual */}
          <div className="relative">
            <GlassCard variant="glow" size="lg" className="feature-visual min-h-[600px] flex items-center justify-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeFeature}
                  initial={{ opacity: 0, scale: 0.9, rotateY: 10 }}
                  animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                  exit={{ opacity: 0, scale: 0.9, rotateY: -10 }}
                  transition={{ duration: 0.5 }}
                  className="w-full h-full flex flex-col items-center justify-center space-y-6"
                >
                  {/* Feature Icon */}
                  <div className={`w-20 h-20 ${currentFeature.bg} rounded-full flex items-center justify-center`}>
                    <currentFeature.icon className={`w-10 h-10 ${currentFeature.color}`} />
                  </div>

                  {/* Feature Title */}
                  <div className="text-center space-y-2">
                    <h4 className="text-2xl font-bold">{currentFeature.title}</h4>
                    <p className="text-muted-foreground">{currentFeature.subtitle}</p>
                  </div>

                  {/* Mock Interface */}
                  <div className="w-full max-w-md space-y-4">
                    {currentFeature.visual.type === "calendar" && (
                      <div className="bg-muted/20 border border-border/30 rounded-lg p-4">
                        <div className="grid grid-cols-7 gap-1 text-xs text-center">
                          {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map(day => (
                            <div key={day} className="p-1 font-medium">{day}</div>
                          ))}
                          {Array.from({length: 35}, (_, i) => (
                            <div key={i} className={`p-1 aspect-square flex items-center justify-center rounded ${
                              i === 15 ? 'bg-primary/20 text-primary' : 
                              i === 22 ? 'bg-secondary/20 text-secondary' :
                              'text-muted-foreground'
                            }`}>
                              {i > 6 && i < 28 ? i - 6 : ''}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentFeature.visual.type === "research" && (
                      <div className="space-y-3">
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                            <span>Researching market trends...</span>
                          </div>
                        </div>
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                          <div className="text-xs space-y-1">
                            <div>📊 Market size: $2.3B</div>
                            <div>📈 Growth rate: 23% YoY</div>
                            <div>🏆 Top competitor: Notion</div>
                          </div>
                        </div>
                      </div>
                    )}

                    {currentFeature.visual.type === "tree" && (
                      <div className="space-y-2">
                        <div className="bg-primary/10 border border-primary/20 rounded p-2 text-sm">
                          🎯 Launch Startup
                        </div>
                        <div className="ml-4 space-y-1">
                          <div className="bg-muted/20 border border-border/30 rounded p-2 text-xs">
                            📋 Business Plan
                          </div>
                          <div className="ml-4 bg-muted/20 border border-border/30 rounded p-2 text-xs">
                            💡 Market Research
                          </div>
                        </div>
                      </div>
                    )}

                    {currentFeature.visual.type === "analytics" && (
                      <div className="space-y-3">
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                          <div className="text-sm font-medium mb-2">This Week</div>
                          <div className="flex items-center space-x-4 text-xs">
                            <div>🔥 7-day streak</div>
                            <div>✅ 12 tasks</div>
                            <div>🏆 Level 3</div>
                          </div>
                        </div>
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                          <div className="flex justify-between items-center text-xs">
                            <span>Progress</span>
                            <span>73%</span>
                          </div>
                          <div className="w-full bg-muted/30 rounded-full h-2 mt-1">
                            <div className="bg-primary h-2 rounded-full" style={{width: '73%'}} />
                          </div>
                        </div>
                      </div>
                    )}

                    {currentFeature.visual.type === "integration" && (
                      <div className="space-y-3">
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                          <div className="flex items-center space-x-2 text-sm">
                            <div className="w-6 h-6 bg-muted rounded" />
                            <span>Notion Workspace</span>
                            <div className="w-2 h-2 bg-green-500 rounded-full" />
                          </div>
                        </div>
                        <div className="bg-muted/20 border border-border/30 rounded-lg p-3">
                          <div className="text-xs space-y-1">
                            <div>📄 Project Notes → Synced</div>
                            <div>📋 Task Lists → Updated</div>
                            <div>🗓️ Calendar → Connected</div>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Action Button */}
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="text-xs"
                  >
                    <Zap className="w-3 h-3 mr-1" />
                    Try This Feature
                  </Button>
                </motion.div>
              </AnimatePresence>
            </GlassCard>

            {/* Floating feature indicators */}
            <div className="absolute -top-4 -right-4 w-8 h-8 bg-primary/20 rounded-full blur-lg animate-pulse" />
            <div className="absolute -bottom-4 -left-4 w-6 h-6 bg-secondary/30 rounded-full blur-md animate-pulse delay-500" />
          </div>
        </div>

        {/* Additional Features Grid */}
        <div className="additional-features space-y-12">
          <div className="text-center space-y-4">
            <h3 className="text-3xl font-bold text-foreground">And So Much More</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Every feature designed to eliminate friction and amplify your productivity.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {additionalFeatures.map((feature, index) => (
              <GlassCard 
                key={index}
                variant="hover"
                className="additional-feature group"
              >
                <div className="space-y-4">
                  <feature.icon className="w-8 h-8 text-primary group-hover:scale-110 transition-transform" />
                  <div className="space-y-2">
                    <h4 className="font-semibold text-lg">{feature.title}</h4>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {feature.description}
                    </p>
                  </div>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <motion.div 
          initial={{ opacity: 0, y: 40 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center space-y-8 mt-20"
        >
          <div className="space-y-4">
            <h3 className="text-3xl font-bold text-foreground">
              Stop Juggling Tools. <span className="text-primary">Start Achieving Goals.</span>
            </h3>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Everything you need in one AI-powered platform. No more app switching, 
              no more planning paralysis, no more excuses.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              className="btn-glow bg-gradient-to-r from-primary to-secondary text-white px-8 py-4 text-lg group"
            >
              <Target className="w-5 h-5 mr-2" />
              Start Planning for Free
              <ArrowRight className="w-5 h-5 ml-2 group-hover:translate-x-1 transition-transform" />
            </Button>
            
            <Button 
              variant="outline" 
              size="lg" 
              className="border-primary/30 text-primary hover:bg-primary/10 px-8 py-4 text-lg"
            >
              <Award className="w-5 h-5 mr-2" />
              See All Features
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
} 