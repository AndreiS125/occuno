"use client";

import { motion } from "framer-motion";
import { 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle,
  AlertCircle,
  Activity
} from "lucide-react";
import { ObjectiveStats } from "@/types";
import { cn } from "@/lib/utils";

interface DashboardStatsProps {
  stats: ObjectiveStats;
}

export function DashboardStats({ stats }: DashboardStatsProps) {
  const statCards = [
    {
      title: "Total Objectives",
      value: stats.total,
      icon: Target,
      color: "text-blue-600 dark:text-blue-400",
      bgColor: "bg-blue-100 dark:bg-blue-900/40",
    },
    {
      title: "Completion Rate",
      value: `${stats.completion_rate}%`,
      icon: TrendingUp,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/40",
    },
    {
      title: "Active",
      value: stats.active_count,
      icon: Activity,
      color: "text-amber-600 dark:text-amber-400",
      bgColor: "bg-amber-100 dark:bg-amber-900/40",
    },
    {
      title: "Completed",
      value: stats.by_status.completed || 0,
      icon: CheckCircle,
      color: "text-green-600 dark:text-green-400",
      bgColor: "bg-green-100 dark:bg-green-900/40",
    },
    {
      title: "Blocked",
      value: stats.blocked_count,
      icon: AlertCircle,
      color: "text-red-600 dark:text-red-400",
      bgColor: "bg-red-100 dark:bg-red-900/40",
    },
    {
      title: "Pending",
      value: stats.by_status.not_started || 0,
      icon: Clock,
      color: "text-gray-600 dark:text-gray-400",
      bgColor: "bg-gray-100 dark:bg-gray-800/40",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
      {statCards.map((stat, index) => (
        <motion.div
          key={stat.title}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.05 }}
          className="relative overflow-hidden"
        >
          <div className="bg-card border border-border rounded-xl p-6 card-hover">
            <div className="flex items-start justify-between mb-2">
              <div className={cn("p-2 rounded-lg", stat.bgColor)}>
                <stat.icon className={cn("w-5 h-5", stat.color)} />
              </div>
            </div>
            <p className="text-sm text-muted-foreground mb-1">{stat.title}</p>
            <p className="text-2xl font-semibold">{stat.value}</p>
            
            {/* Subtle gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-muted/5 pointer-events-none" />
          </div>
        </motion.div>
      ))}
    </div>
  );
} 