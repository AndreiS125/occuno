"use client";

import { useState, useEffect, useRef } from "react";
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
  AlertCircle,
  Calendar,
  Activity,
  Zap,
  ArrowUp,
  User,
  Timer,
  Flag,
  ChevronRight
} from "lucide-react";
import { formatDate, formatRelativeTime, cn } from "@/lib/utils";
import { Objective, ObjectiveType } from "@/types";

export default function Home() {
  const { objectives, loading, activeObjectives, completedObjectives, tasks } = useObjectives();
  const [showCreateModal, setShowCreateModal] = useState(false);
  
  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const todayRef = useRef<HTMLDivElement>(null);
  const quickActionsRef = useRef<HTMLDivElement>(null);
  const recentRef = useRef<HTMLDivElement>(null);

  // Get today's tasks and high priority objectives
  const todaysTasks = tasks.filter(task => {
    if (!task.due_date) return false;
    const today = new Date();
    const taskDate = new Date(task.due_date);
    return taskDate.toDateString() === today.toDateString();
  });

  const highPriorityObjectives = activeObjectives
    .filter(obj => obj.priority_score >= 0.7)
    .slice(0, 5);

  const recentlyCompleted = completedObjectives
    .sort((a, b) => new Date(b.updated_at || b.created_at).getTime() - new Date(a.updated_at || a.created_at).getTime())
    .slice(0, 3);

  // GSAP animations
  useGSAP(() => {
    if (loading) return;

    const tl = gsap.timeline();
    
    // Header animation
    tl.fromTo(headerRef.current, 
      { opacity: 0, y: -20 }, 
      { opacity: 1, y: 0, duration: 0.6, ease: "power2.out" }
    );

    // Stats cards with stagger
    tl.fromTo(".stat-card", 
      { opacity: 0, y: 30, scale: 0.9 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.5, 
        stagger: 0.1, 
        ease: "back.out(1.2)" 
      },
      "-=0.3"
    );

    // Main content sections
    tl.fromTo([todayRef.current, quickActionsRef.current, recentRef.current],
      { opacity: 0, y: 40 },
      { 
        opacity: 1, 
        y: 0, 
        duration: 0.6, 
        stagger: 0.2, 
        ease: "power2.out" 
      },
      "-=0.2"
    );

    // Hover animations for interactive elements
    gsap.set(".hover-card", { scale: 1 });
    
    const hoverCards = document.querySelectorAll(".hover-card");
    hoverCards.forEach(card => {
      card.addEventListener("mouseenter", () => {
        gsap.to(card, { scale: 1.02, duration: 0.2, ease: "power2.out" });
      });
      card.addEventListener("mouseleave", () => {
        gsap.to(card, { scale: 1, duration: 0.2, ease: "power2.out" });
      });
    });

    // Floating animation for accent elements
    gsap.to(".float-accent", {
      y: -8,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.3
    });

  }, { dependencies: [loading, objectives.length] });

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  const completionRate = objectives.length > 0 ? Math.round((completedObjectives.length / objectives.length) * 100) : 0;
  const todaysProgress = todaysTasks.length > 0 ? Math.round((todaysTasks.filter(t => t.status === "completed").length / todaysTasks.length) * 100) : 0;

  const stats = [
    {
      title: "Today's Tasks",
      value: todaysTasks.length,
      subtitle: `${todaysProgress}% completed`,
      icon: Calendar,
      gradient: "from-blue-500 to-cyan-500",
      iconBg: "bg-blue-500/10",
      trend: todaysProgress >= 50 ? "up" : "neutral"
    },
    {
      title: "Active Goals",
      value: activeObjectives.length,
      subtitle: "In progress",
      icon: Target,
      gradient: "from-emerald-500 to-teal-500",
      iconBg: "bg-emerald-500/10",
      trend: "up"
    },
    {
      title: "Success Rate",
      value: `${completionRate}%`,
      subtitle: "Overall completion",
      icon: TrendingUp,
      gradient: "from-purple-500 to-pink-500",
      iconBg: "bg-purple-500/10",
      trend: completionRate >= 70 ? "up" : "neutral"
    },
    {
      title: "High Priority",
      value: highPriorityObjectives.length,
      subtitle: "Need attention",
      icon: AlertCircle,
      gradient: "from-orange-500 to-red-500",
      iconBg: "bg-orange-500/10",
      trend: "neutral"
    }
  ];

  return (
    <>
      <div ref={containerRef} className="container mx-auto px-4 py-8 space-y-8 pt-20">
        {/* Header */}
        <div ref={headerRef} className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-foreground">
                Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'}! 👋
              </h1>
              <p className="text-muted-foreground mt-1">
                Here's what's happening with your goals today
              </p>
            </div>
            <div className="float-accent">
              <div className="p-3 rounded-2xl bg-gradient-to-r from-primary/10 to-secondary/10 border border-primary/20">
                <Activity className="w-6 h-6 text-primary" />
              </div>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div ref={statsRef} className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
          {stats.map((stat, index) => {
            const Icon = stat.icon;
            return (
              <Card key={stat.title} className="stat-card hover-card relative overflow-hidden border-0 bg-gradient-to-br from-card to-card/50 backdrop-blur">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="space-y-2">
                      <div className={cn("p-2 rounded-lg w-fit", stat.iconBg)}>
                        <Icon className="w-5 h-5 text-current" />
                      </div>
                      <div>
                        <p className="text-2xl font-bold text-foreground">
                          {stat.value}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {stat.title}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          {stat.subtitle}
                        </p>
                      </div>
                    </div>
                    {stat.trend === "up" && (
                      <div className="flex items-center text-emerald-500 float-accent">
                        <ArrowUp className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                  <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${stat.gradient} w-full`} />
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Today's Focus */}
        <div ref={todayRef} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Today's Tasks */}
          <Card className="hover-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Timer className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Today's Tasks</h2>
                </div>
                <span className="text-sm text-muted-foreground">
                  {todaysTasks.length} tasks
                </span>
              </div>
              
              <div className="space-y-3">
                {todaysTasks.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No tasks scheduled for today</p>
                    <button 
                      onClick={() => setShowCreateModal(true)}
                      className="text-primary hover:underline text-sm mt-2"
                    >
                      Create a task for today
                    </button>
                  </div>
                ) : (
                  todaysTasks.slice(0, 5).map(task => (
                    <div key={task.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        task.status === "completed" ? "bg-emerald-500" : 
                        task.status === "in_progress" ? "bg-blue-500" : "bg-gray-400"
                      )} />
                                             <div className="flex-1 min-w-0">
                         <p className={cn(
                           "text-sm font-medium truncate",
                           task.status === "completed" && "line-through text-muted-foreground"
                         )}>
                           {task.title}
                         </p>
                         {(task as any).start_time && (
                           <p className="text-xs text-muted-foreground">
                             {new Date(`2024-01-01 ${(task as any).start_time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                           </p>
                         )}
                       </div>
                      <ChevronRight className="w-4 h-4 text-muted-foreground" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>

          {/* High Priority Items */}
          <Card className="hover-card">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center space-x-2">
                  <Flag className="w-5 h-5 text-orange-500" />
                  <h2 className="text-xl font-semibold">High Priority</h2>
                </div>
                <span className="text-sm text-muted-foreground">
                  {highPriorityObjectives.length} items
                </span>
              </div>
              
              <div className="space-y-3">
                {highPriorityObjectives.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Target className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>No high priority items</p>
                  </div>
                ) : (
                  highPriorityObjectives.map(objective => (
                    <div key={objective.id} className="flex items-center space-x-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                      <div className="w-8 h-8 rounded-lg bg-orange-500/10 flex items-center justify-center">
                        <Target className="w-4 h-4 text-orange-500" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">
                          {objective.title}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {objective.completion_percentage}% complete
                        </p>
                      </div>
                      <div className="text-right">
                        <span className="text-xs text-orange-500 font-medium">
                          Priority: {Math.round(objective.priority_score * 100)}%
                        </span>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div ref={quickActionsRef}>
          <div className="flex items-center space-x-2 mb-4">
            <Zap className="w-5 h-5 text-primary float-accent" />
            <h2 className="text-xl font-semibold">Quick Actions</h2>
          </div>
          <QuickActions />
        </div>

        {/* Recent Activity */}
        <div ref={recentRef}>
          <Card className="hover-card">
            <CardContent className="p-6">
              <div className="flex items-center space-x-2 mb-4">
                <CheckCircle className="w-5 h-5 text-emerald-500" />
                <h2 className="text-xl font-semibold">Recently Completed</h2>
              </div>
              
              <div className="space-y-3">
                {recentlyCompleted.length === 0 ? (
                  <div className="text-center py-6 text-muted-foreground">
                    <Activity className="w-10 h-10 mx-auto mb-2 opacity-50" />
                    <p>No recent completions</p>
                  </div>
                ) : (
                  recentlyCompleted.map(item => (
                    <div key={item.id} className="flex items-center space-x-3 p-3 rounded-lg bg-emerald-500/5 border border-emerald-500/10">
                      <div className="w-2 h-2 rounded-full bg-emerald-500" />
                      <div className="flex-1">
                        <p className="text-sm font-medium">{item.title}</p>
                        <p className="text-xs text-muted-foreground">
                          Completed {formatRelativeTime(item.updated_at || item.created_at)}
                        </p>
                      </div>
                      <CheckCircle className="w-4 h-4 text-emerald-500" />
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <ObjectiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
        }}
        defaultToTask={true}
      />
    </>
  );
} 