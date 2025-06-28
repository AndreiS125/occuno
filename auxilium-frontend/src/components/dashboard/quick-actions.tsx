"use client";

import { motion } from "framer-motion";
import { 
  Plus, 
  Calendar, 
  Target, 
  CheckSquare,
  Clock
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
      color: "from-green-500 to-teal-600",
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {quickActions.map((action, index) => {
          const Icon = action.icon;
          
          return (
            <motion.div
              key={action.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={action.action}
              className="relative overflow-hidden rounded-xl p-6 cursor-pointer group"
            >
              {/* Gradient Background */}
              <div className={`absolute inset-0 bg-gradient-to-br ${action.color} opacity-10 group-hover:opacity-20 transition-opacity`} />
              
              {/* Content */}
              <div className="relative z-10">
                <div className="flex items-center space-x-3 mb-3">
                  <div className={`p-2 rounded-lg bg-gradient-to-br ${action.color}`}>
                    <Icon className="w-5 h-5 text-white" />
                  </div>
                  <h3 className="font-semibold text-foreground">{action.title}</h3>
                </div>
                <p className="text-sm text-muted-foreground">{action.description}</p>
              </div>
              
              {/* Hover Effect */}
              <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
            </motion.div>
          );
        })}
      </div>

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