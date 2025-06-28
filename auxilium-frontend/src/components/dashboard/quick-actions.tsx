"use client";

import { motion } from "framer-motion";
import { 
  Plus, 
  Calendar, 
  Target, 
  CheckSquare,
  Clock,
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

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 30, rotateY: -15 }}
              animate={{ opacity: 1, y: 0, rotateY: 0 }}
              transition={{ 
                delay: index * 0.15, 
                duration: 0.6,
                ease: [0.68, -0.55, 0.265, 1.55]
              }}
              whileHover={{ 
                scale: 1.05, 
                y: -10,
                rotateY: 5,
                transition: { duration: 0.3 }
              }}
              whileTap={{ scale: 0.95 }}
              onClick={action.action}
              className="group relative glass-card overflow-hidden cursor-pointer border-glow"
            >
              {/* Animated background gradient */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-20 transition-all duration-500`} />
              
              {/* Glow effect on hover */}
              <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${action.color} opacity-0 group-hover:opacity-30 blur-xl transition-all duration-500`} />
              
              {/* Content */}
              <div className="relative z-10 p-6 space-y-4">
                <div className="flex items-center justify-between">
                  <motion.div
                    whileHover={{ scale: 1.2, rotate: 10 }}
                    transition={{ duration: 0.3 }}
                    className="relative"
                  >
                    <div className={`absolute inset-0 bg-gradient-to-br ${action.color} rounded-xl blur-md opacity-50 group-hover:opacity-80 transition-opacity duration-300`} />
                    <div className={`relative p-3 rounded-xl bg-gradient-to-r ${action.color} shadow-lg`}>
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                  </motion.div>
                  
                  <motion.div
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 0, x: -10 }}
                    whileHover={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3 }}
                    className="text-primary"
                  >
                    <ArrowRight className="w-5 h-5" />
                  </motion.div>
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
                    <motion.div
                      initial={{ width: "0%" }}
                      whileHover={{ width: "100%" }}
                      transition={{ duration: 0.8, ease: "easeInOut" }}
                      className={`h-full bg-gradient-to-r ${action.color} rounded-full`}
                    />
                  </div>
                </div>
              </div>
              
              {/* Shimmer effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
              
              {/* Floating particles effect */}
              <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                <motion.div
                  animate={{ 
                    y: [-5, -15, -5],
                    rotate: [0, 180, 360]
                  }}
                  transition={{ 
                    duration: 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                >
                  <Sparkles className="w-4 h-4 text-primary/60" />
                </motion.div>
              </div>
            </motion.div>
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