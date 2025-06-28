"use client";

import { Objective, ObjectiveType, ObjectiveStatus } from "@/types";
import { motion } from "framer-motion";
import { PieChart, BarChart3, Target, TrendingUp } from "lucide-react";

interface ObjectiveProgressChartProps {
  objectives: Objective[];
}

export function ObjectiveProgressChart({ objectives }: ObjectiveProgressChartProps) {
  // Calculate data for visualizations
  const totalObjectives = objectives.length;
  const completedObjectives = objectives.filter(obj => obj.status === ObjectiveStatus.COMPLETED).length;
  const inProgressObjectives = objectives.filter(obj => obj.status === ObjectiveStatus.IN_PROGRESS).length;
  const notStartedObjectives = objectives.filter(obj => obj.status === ObjectiveStatus.NOT_STARTED).length;
  
  // Calculate completion percentage
  const completionPercentage = totalObjectives > 0 
    ? Math.round((completedObjectives / totalObjectives) * 100)
    : 0;

  // Calculate progress by type
  const progressByType = [ObjectiveType.MAIN_OBJECTIVE, ObjectiveType.SUB_OBJECTIVE, ObjectiveType.TASK].map(type => {
    const typeObjectives = objectives.filter(obj => obj.objective_type === type);
    const completed = typeObjectives.filter(obj => obj.status === ObjectiveStatus.COMPLETED).length;
    const total = typeObjectives.length;
    return {
      type,
      completed,
      total,
      percentage: total > 0 ? Math.round((completed / total) * 100) : 0
    };
  });

  const typeColors = {
    [ObjectiveType.MAIN_OBJECTIVE]: "#a855f7",
    [ObjectiveType.SUB_OBJECTIVE]: "#3b82f6",
    [ObjectiveType.TASK]: "#22c55e"
  };

  const typeNames = {
    [ObjectiveType.MAIN_OBJECTIVE]: "Root Goals",
    [ObjectiveType.SUB_OBJECTIVE]: "Sub-objectives",
    [ObjectiveType.TASK]: "Tasks"
  };

  return (
    <div className="bg-card border rounded-xl p-6">
      <h3 className="text-lg font-semibold mb-6">Progress Overview</h3>
      
      {/* Overall Progress Circle */}
      <div className="flex justify-center mb-8">
        <div className="relative w-48 h-48">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background Circle */}
            <circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              className="text-muted"
            />
            
            {/* Progress Circle */}
            <motion.circle
              cx="96"
              cy="96"
              r="88"
              fill="none"
              stroke="currentColor"
              strokeWidth="8"
              strokeLinecap="round"
              className="text-primary"
              strokeDasharray={553}
              initial={{ strokeDashoffset: 553 }}
              animate={{ strokeDashoffset: 553 - (553 * completionPercentage) / 100 }}
              transition={{ duration: 1, ease: "easeOut" }}
            />
          </svg>
          
          {/* Center Text */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              <div className="text-3xl font-bold">{completionPercentage}%</div>
              <div className="text-sm text-muted-foreground">Complete</div>
            </motion.div>
          </div>
        </div>
      </div>

      {/* Status Breakdown */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center"
        >
          <div className="text-2xl font-bold text-green-500">{completedObjectives}</div>
          <div className="text-xs text-muted-foreground">Completed</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="text-center"
        >
          <div className="text-2xl font-bold text-blue-500">{inProgressObjectives}</div>
          <div className="text-xs text-muted-foreground">In Progress</div>
        </motion.div>
        
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="text-center"
        >
          <div className="text-2xl font-bold text-gray-500">{notStartedObjectives}</div>
          <div className="text-xs text-muted-foreground">Not Started</div>
        </motion.div>
      </div>

      {/* Progress by Type */}
      <div className="space-y-3">
        <h4 className="text-sm font-medium text-muted-foreground mb-3">Progress by Type</h4>
        {progressByType.map((item, index) => (
          <motion.div
            key={item.type}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 * index }}
          >
            <div className="flex items-center justify-between mb-1">
              <span className="text-sm">{typeNames[item.type as keyof typeof typeNames]}</span>
              <span className="text-sm text-muted-foreground">
                {item.completed}/{item.total}
              </span>
            </div>
            <div className="relative h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                className="absolute inset-y-0 left-0 rounded-full"
                style={{ backgroundColor: typeColors[item.type as keyof typeof typeColors] }}
                initial={{ width: 0 }}
                animate={{ width: `${item.percentage}%` }}
                transition={{ duration: 0.8, delay: 0.1 * index, ease: "easeOut" }}
              />
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
} 