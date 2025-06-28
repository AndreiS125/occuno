"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ObjectiveModal } from "@/components/modals";
import { useObjectives } from "@/hooks/use-objectives";
import { LoadingSpinner, Card, CardContent } from "@/components/ui";
import { 
  Target, 
  TrendingUp, 
  CheckCircle, 
  Clock, 
  Sparkles,
  Zap,
  BarChart3,
  Calendar
} from "lucide-react";

export default function Home() {
  const { objectives, loading, activeObjectives, completedObjectives } = useObjectives();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

  // GSAP animations for enhanced effects
  useGSAP(() => {
    if (loading) return;

    // Enhanced entrance animations
    const tl = gsap.timeline();
    
    tl.fromTo(headerRef.current, 
      { 
        opacity: 0, 
        y: 50,
        scale: 0.9
      }, 
      { 
        opacity: 1, 
        y: 0,
        scale: 1,
        duration: 1,
        ease: "back.out(1.7)"
      }
    )
    .fromTo(".stat-card",
      {
        opacity: 0,
        y: 30,
        rotationX: -15
      },
      {
        opacity: 1,
        y: 0,
        rotationX: 0,
        duration: 0.8,
        stagger: 0.1,
        ease: "power3.out"
      },
      "-=0.5"
    )
    .fromTo(contentRef.current,
      {
        opacity: 0,
        y: 40
      },
      {
        opacity: 1,
        y: 0,
        duration: 0.8,
        ease: "power3.out"
      },
      "-=0.3"
    );

    // Floating animation for decorative elements
    gsap.to(".float-element", {
      y: -15,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.5
    });

    // Pulse animation for interactive elements
    gsap.to(".pulse-element", {
      scale: 1.05,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1
    });

  }, { dependencies: [loading] });

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const completionRate = objectives.length > 0 ? Math.round((completedObjectives.length / objectives.length) * 100) : 0;

  const stats = [
    {
      title: "Total Objectives",
      value: objectives.length,
      icon: Target,
      gradient: "from-blue-500 to-blue-700",
      bgGradient: "from-blue-500/10 to-blue-700/10",
      glow: "shadow-blue-500/20"
    },
    {
      title: "Active",
      value: activeObjectives.length,
      icon: Clock,
      gradient: "from-amber-500 to-orange-600",
      bgGradient: "from-amber-500/10 to-orange-600/10",
      glow: "shadow-amber-500/20"
    },
    {
      title: "Completed",
      value: completedObjectives.length,
      icon: CheckCircle,
      gradient: "from-emerald-500 to-emerald-700",
      bgGradient: "from-emerald-500/10 to-emerald-700/10",
      glow: "shadow-emerald-500/20"
    },
    {
      title: "Success Rate",
      value: `${completionRate}%`,
      icon: TrendingUp,
      gradient: "from-purple-500 to-purple-700",
      bgGradient: "from-purple-500/10 to-purple-700/10",
      glow: "shadow-purple-500/20"
    }
  ];

  return (
    <>
      <div className="container mx-auto px-4 py-12 space-y-16">
        {/* Header Section with enhanced animations */}
        <div ref={headerRef} className="text-center space-y-8">
          <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, ease: [0.68, -0.55, 0.265, 1.55] }}
            className="relative inline-block"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-primary via-secondary to-accent rounded-full blur-3xl opacity-20 animate-pulse-glow float-element" />
            <Sparkles className="w-16 h-16 text-primary relative z-10 mx-auto mb-6 drop-shadow-glow" />
          </motion.div>

          <div className="space-y-4">
            <h1 className="text-6xl md:text-7xl font-bold tracking-tight">
              <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
                Welcome to
              </span>
              <br />
              <span className="text-gradient text-glow">
                Auxilium
              </span>
            </h1>
            
            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.8 }}
              className="text-xl md:text-2xl text-muted-foreground max-w-3xl mx-auto leading-relaxed"
            >
              Your advanced productivity command center. 
              <span className="text-primary font-medium"> Plan, execute, and achieve </span>
              with cutting-edge tools designed for peak performance.
            </motion.p>
          </div>
        </div>

        {/* Enhanced Statistics Grid */}
        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            
            return (
              <motion.div
                key={stat.title}
                initial={{ opacity: 0, y: 50, rotateX: -15 }}
                animate={{ opacity: 1, y: 0, rotateX: 0 }}
                transition={{ 
                  delay: index * 0.1, 
                  duration: 0.8,
                  ease: [0.68, -0.55, 0.265, 1.55]
                }}
                whileHover={{ 
                  scale: 1.05, 
                  y: -10,
                  transition: { duration: 0.2 }
                }}
                className={`stat-card glass-card group cursor-pointer overflow-hidden relative`}
              >
                {/* Animated background gradient */}
                <div className={`absolute inset-0 bg-gradient-to-br ${stat.bgGradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                {/* Glow effect */}
                <div className={`absolute inset-0 rounded-2xl shadow-2xl ${stat.glow} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />
                
                <CardContent className="relative z-10 p-6 text-center space-y-4">
                  <motion.div
                    whileHover={{ rotate: 360, scale: 1.2 }}
                    transition={{ duration: 0.6 }}
                    className="relative inline-block"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-r ${stat.gradient} rounded-full blur-lg opacity-50 pulse-element`} />
                    <Icon className={`w-8 h-8 relative z-10 text-white p-1.5 rounded-lg bg-gradient-to-r ${stat.gradient} shadow-lg`} />
                  </motion.div>
                  
                  <div className="space-y-2">
                    <motion.div
                      initial={{ scale: 0.5 }}
                      animate={{ scale: 1 }}
                      transition={{ 
                        delay: index * 0.1 + 0.5,
                        type: "spring",
                        stiffness: 200
                      }}
                      className="text-3xl font-bold text-gradient"
                    >
                      {stat.value}
                    </motion.div>
                    <div className="text-sm font-medium text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                      {stat.title}
                    </div>
                  </div>
                </CardContent>

                {/* Hover shimmer effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              </motion.div>
            );
          })}
        </div>

        {/* Quick Actions Section with enhanced styling */}
        <motion.div
          ref={contentRef}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.8 }}
          className="max-w-6xl mx-auto"
        >
          <div className="glass-card p-8 border-glow-animated">
            <div className="flex items-center justify-center mb-8">
              <motion.div
                whileHover={{ scale: 1.1 }}
                className="flex items-center space-x-3"
              >
                <Zap className="w-6 h-6 text-primary" />
                <h2 className="text-2xl font-bold text-gradient">Quick Actions</h2>
              </motion.div>
            </div>
            
            <QuickActions />
          </div>
        </motion.div>

        {/* Feature Highlights */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto"
        >
          {[
            {
              icon: Calendar,
              title: "Smart Calendar",
              description: "Advanced Gantt charts and calendar views with intelligent scheduling",
              gradient: "from-blue-500 to-purple-600"
            },
            {
              icon: BarChart3,
              title: "Analytics Hub",
              description: "Real-time insights and performance metrics to optimize your workflow",
              gradient: "from-emerald-500 to-teal-600"
            },
            {
              icon: Target,
              title: "Goal Tracking",
              description: "Hierarchical objectives with AI-powered recommendations",
              gradient: "from-orange-500 to-red-600"
            }
          ].map((feature, index) => {
            const Icon = feature.icon;
            
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 + index * 0.2, duration: 0.8 }}
                whileHover={{ y: -5 }}
                className="glass-card p-6 text-center group hover:shadow-glow transition-all duration-500"
              >
                <motion.div
                  whileHover={{ scale: 1.1, rotate: 5 }}
                  className="float-element"
                >
                  <Icon className={`w-12 h-12 mx-auto mb-4 p-2 rounded-xl bg-gradient-to-r ${feature.gradient} text-white shadow-lg`} />
                </motion.div>
                
                <h3 className="text-xl font-semibold mb-2 group-hover:text-primary transition-colors duration-300">
                  {feature.title}
                </h3>
                
                <p className="text-muted-foreground group-hover:text-foreground transition-colors duration-300">
                  {feature.description}
                </p>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      <ObjectiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
        }}
        defaultToTask={false}
      />
    </>
  );
} 