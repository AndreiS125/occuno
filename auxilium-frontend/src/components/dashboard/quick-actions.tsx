"use client";

import { useRef, useEffect } from "react";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  Plus, 
  Calendar, 
  Target, 
  CheckSquare,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { useState } from "react";
import { ObjectiveModal } from "@/components/modals";

interface QuickAction {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  color: string;
  action: () => void;
}

export function QuickActions() {
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<"task" | "objective">("objective");
  const containerRef = useRef<HTMLDivElement>(null);

  const quickActions: QuickAction[] = [
    {
      id: "create-objective",
      title: "New Objective",
      description: "Create a new goal or project",
      icon: Plus,
      color: "from-blue-500 to-purple-600",
      action: () => {
        setModalType("objective");
        setShowModal(true);
      },
    },
    {
      id: "view-calendar",
      title: "Calendar",
      description: "View your schedule and tasks",
      icon: Calendar,
      color: "from-emerald-500 to-teal-600",
      action: () => window.location.href = "/calendar",
    },
    {
      id: "review-objectives",
      title: "Review Goals",
      description: "Check progress on your objectives",
      icon: Target,
      color: "from-orange-500 to-red-600",
      action: () => window.location.href = "/objectives",
    },
    {
      id: "quick-task",
      title: "Quick Task",
      description: "Add a simple task for today",
      icon: CheckSquare,
      color: "from-indigo-500 to-blue-600",
      action: () => {
        setModalType("task");
        setShowModal(true);
      },
    },
  ];

  useGSAP(() => {
    // Initial animation for cards
    gsap.fromTo(".quick-action-card", 
      { 
        opacity: 0, 
        y: 20, 
        scale: 0.95 
      },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.5, 
        stagger: 0.1, 
        ease: "power2.out" 
      }
    );

    // Setup hover animations
    const cards = document.querySelectorAll(".quick-action-card");
    cards.forEach((card, index) => {
      const icon = card.querySelector(".action-icon");
      const arrow = card.querySelector(".action-arrow");
      const progress = card.querySelector(".progress-bar");

      card.addEventListener("mouseenter", () => {
        gsap.to(card, { scale: 1.03, duration: 0.2, ease: "power2.out" });
        gsap.to(icon, { scale: 1.1, rotation: 5, duration: 0.2 });
        gsap.to(arrow, { x: 5, opacity: 1, duration: 0.2 });
        gsap.to(progress, { width: "100%", duration: 0.6, ease: "power2.out" });
      });

      card.addEventListener("mouseleave", () => {
        gsap.to(card, { scale: 1, duration: 0.2, ease: "power2.out" });
        gsap.to(icon, { scale: 1, rotation: 0, duration: 0.2 });
        gsap.to(arrow, { x: 0, opacity: 0.6, duration: 0.2 });
        gsap.to(progress, { width: "0%", duration: 0.3 });
      });

      card.addEventListener("click", () => {
        gsap.to(card, { scale: 0.98, duration: 0.1, yoyo: true, repeat: 1 });
      });
    });

    // Floating animation for sparkles
    gsap.to(".sparkle-float", {
      y: -5,
      rotation: 180,
      duration: 2,
      ease: "power2.inOut",
      yoyo: true,
      repeat: -1,
      stagger: 0.5
    });

  }, { scope: containerRef });

  return (
    <>
      <div ref={containerRef} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <div
              key={action.id}
              onClick={action.action}
              className="quick-action-card group relative cursor-pointer overflow-hidden rounded-2xl bg-gradient-to-br from-card to-card/50 border border-border/50 backdrop-blur"
            >
              {/* Background gradient overlay */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-10 transition-opacity duration-500`} />
              
              {/* Content */}
              <div className="relative z-10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <div className="action-icon relative">
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} rounded-xl blur-md opacity-30`} />
                    <div className={`relative p-3 rounded-xl bg-gradient-to-r ${action.color} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </div>
                  
                  <div className="action-arrow opacity-60">
                    <ArrowRight className="w-5 h-5 text-primary" />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <h3 className="font-semibold text-lg text-foreground group-hover:text-primary transition-colors duration-300">
                    {action.title}
                  </h3>
                  <p className="text-sm text-muted-foreground group-hover:text-foreground transition-colors duration-300 leading-relaxed">
                    {action.description}
                  </p>
                </div>
                
                {/* Progress indicator */}
                <div className="pt-2">
                  <div className="h-1 bg-muted rounded-full overflow-hidden">
                    <div className={`progress-bar h-full bg-gradient-to-r ${action.color} rounded-full w-0`} />
                  </div>
                </div>
              </div>
              
              {/* Floating sparkles effect */}
              <div className="absolute top-4 right-4 opacity-60 group-hover:opacity-100 transition-opacity duration-500">
                <div className="sparkle-float">
                  <Sparkles className="w-4 h-4 text-primary/60" />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Enhanced Modal */}
      <ObjectiveModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={() => {
          setShowModal(false);
          // Could trigger a refresh if needed
        }}
        defaultToTask={modalType === "task"}
        showTimeFields={modalType === "task"}
      />
    </>
  );
} 