"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { 
  BarChart3, 
  TrendingUp, 
  Activity,
  Target,
  Clock,
  Zap,
  Calendar,
  PieChart,
  Award
} from "lucide-react";
import { objectivesApi } from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { Objective, ObjectiveStatus, ObjectiveType, EnergyLevel } from "@/types";
import { Button } from "@/components/ui/button";

export default function AnalyticsPage() {
  const [timeRange, setTimeRange] = useState<'week' | 'month' | 'quarter'>('week');
  const { data: objectives = [] } = useQuery({
    queryKey: ['objectives-analytics'],
    queryFn: async () => {
      const { data } = await objectivesApi.list();
      return data;
    },
  });

  const { data: stats } = useQuery({
    queryKey: ['analytics-stats'],
    queryFn: objectivesApi.getStats
  });

  // Calculate analytics data
  const completedThisMonth = objectives.filter(obj => {
    if (obj.status !== ObjectiveStatus.COMPLETED) return false;
    if (!obj.updated_at) return false;
    const completedDate = new Date(obj.updated_at);
    const now = new Date();
    return completedDate.getMonth() === now.getMonth() && 
           completedDate.getFullYear() === now.getFullYear();
  }).length;

  const productivityScore = objectives.length > 0
    ? Math.round(
        (objectives.filter(obj => obj.status === ObjectiveStatus.COMPLETED).length / objectives.length) * 100
      )
    : 0;

  // Weekly activity data
  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const date = new Date();
    date.setDate(date.getDate() - (6 - i));
    const dayObjectives = objectives.filter(obj => {
      if (!obj.updated_at) return false;
      const objDate = new Date(obj.updated_at);
      return objDate.toDateString() === date.toDateString();
    });
    
    return {
      day: date.toLocaleDateString('en', { weekday: 'short' }),
      completed: dayObjectives.filter(obj => obj.status === ObjectiveStatus.COMPLETED).length,
      created: dayObjectives.filter(obj => {
        const created = new Date(obj.created_at);
        return created.toDateString() === date.toDateString();
      }).length,
      active: dayObjectives.filter(obj => obj.status === ObjectiveStatus.IN_PROGRESS).length
    };
  });

  // Type distribution for pie chart
  const typeDistribution = {
    ROOT: objectives.filter(obj => obj.objective_type === ObjectiveType.MAIN_OBJECTIVE).length,
    SUB_OBJECTIVE: objectives.filter(obj => obj.objective_type === ObjectiveType.SUB_OBJECTIVE).length,
    TASK: objectives.filter(obj => obj.objective_type === ObjectiveType.TASK).length,
    HABIT: 0 // HABIT type doesn't exist in the current enum
  };

  // Energy level distribution
  const energyDistribution = {
    HIGH: objectives.filter(obj => obj.energy_requirement === EnergyLevel.HIGH).length,
    MEDIUM: objectives.filter(obj => obj.energy_requirement === EnergyLevel.MEDIUM).length,
    LOW: objectives.filter(obj => obj.energy_requirement === EnergyLevel.LOW).length
  };

  // Calculate completion time metrics
  const completedObjectives = objectives.filter(obj => obj.status === ObjectiveStatus.COMPLETED);
  const avgCompletionTime = completedObjectives.length > 0
    ? completedObjectives.reduce((sum, obj) => {
        const created = new Date(obj.created_at);
        const updated = obj.updated_at ? new Date(obj.updated_at) : new Date();
        return sum + (updated.getTime() - created.getTime()) / (1000 * 60 * 60 * 24); // days
      }, 0) / completedObjectives.length
    : 0;

  const maxActivity = Math.max(
    ...weeklyActivity.map(d => Math.max(d.completed, d.created, d.active)),
    1
  );

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Time Range Selector */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8 flex justify-center"
      >
        <div className="inline-flex items-center bg-muted rounded-lg p-1">
          <Button
            size="sm"
            variant={timeRange === "week" ? "default" : "ghost"}
            onClick={() => setTimeRange("week")}
          >
            Week
          </Button>
          <Button
            size="sm"
            variant={timeRange === "month" ? "default" : "ghost"}
            onClick={() => setTimeRange("month")}
          >
            Month
          </Button>
          <Button
            size="sm"
            variant={timeRange === "quarter" ? "default" : "ghost"}
            onClick={() => setTimeRange("quarter")}
          >
            Quarter
          </Button>
        </div>
      </motion.div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-card border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <Target className="w-5 h-5 text-primary" />
            </div>
            <span className="text-2xl font-bold">{stats?.total || 0}</span>
          </div>
          <p className="text-sm text-muted-foreground">Total Objectives</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <TrendingUp className="w-5 h-5 text-green-500" />
            </div>
            <span className="text-2xl font-bold">{productivityScore}%</span>
          </div>
          <p className="text-sm text-muted-foreground">Productivity Score</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Activity className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-2xl font-bold">{completedThisMonth}</span>
          </div>
          <p className="text-sm text-muted-foreground">Completed This Month</p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card border rounded-xl p-6"
        >
          <div className="flex items-center justify-between mb-2">
            <div className="p-2 bg-purple-500/10 rounded-lg">
              <Clock className="w-5 h-5 text-purple-500" />
            </div>
            <span className="text-2xl font-bold">{avgCompletionTime.toFixed(1)}d</span>
          </div>
          <p className="text-sm text-muted-foreground">Avg Completion Time</p>
        </motion.div>
      </div>

      {/* Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Weekly Activity Chart */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.4 }}
          className="bg-card border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <BarChart3 className="w-5 h-5 mr-2" />
            Weekly Activity
          </h3>
          
          <div className="space-y-4">
            {weeklyActivity.map((day, index) => (
              <motion.div
                key={day.day}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 + index * 0.05 }}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium w-12">{day.day}</span>
                  <div className="flex-1 mx-4 flex items-center space-x-2">
                    {/* Created */}
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(day.created / maxActivity) * 100}%` }}
                        transition={{ delay: 0.6 + index * 0.05, duration: 0.5 }}
                        className="h-full bg-blue-500 absolute"
                      />
                    </div>
                    {/* Completed */}
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(day.completed / maxActivity) * 100}%` }}
                        transition={{ delay: 0.7 + index * 0.05, duration: 0.5 }}
                        className="h-full bg-green-500 absolute"
                      />
                    </div>
                    {/* Active */}
                    <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden relative">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${(day.active / maxActivity) * 100}%` }}
                        transition={{ delay: 0.8 + index * 0.05, duration: 0.5 }}
                        className="h-full bg-orange-500 absolute"
                      />
                    </div>
                  </div>
                  <div className="flex items-center space-x-2 text-xs">
                    <span className="text-blue-500">{day.created}</span>
                    <span className="text-green-500">{day.completed}</span>
                    <span className="text-orange-500">{day.active}</span>
                  </div>
                </div>
              </motion.div>
            ))}
            
            <div className="flex items-center justify-center space-x-4 mt-4 text-xs">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full mr-1" />
                <span>Created</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-1" />
                <span>Completed</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-1" />
                <span>Active</span>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Type Distribution */}
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ delay: 0.5 }}
          className="bg-card border rounded-xl p-6"
        >
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <PieChart className="w-5 h-5 mr-2" />
            Objective Types
          </h3>
          
          <div className="flex justify-center mb-4">
            <div className="relative w-48 h-48">
              {/* Simple Pie Chart Visualization */}
              <svg className="w-full h-full" viewBox="0 0 100 100">
                {(() => {
                  const total = Object.values(typeDistribution).reduce((a, b) => a + b, 0);
                  let cumulativePercentage = 0;
                  
                  return Object.entries(typeDistribution).map(([type, count], index) => {
                    const percentage = total > 0 ? (count / total) * 100 : 0;
                    const startAngle = (cumulativePercentage * 360) / 100;
                    const endAngle = ((cumulativePercentage + percentage) * 360) / 100;
                    cumulativePercentage += percentage;
                    
                    const colors = {
                      ROOT: "#a855f7",
                      SUB_OBJECTIVE: "#3b82f6",
                      TASK: "#22c55e",
                      HABIT: "#f97316"
                    };
                    
                    if (percentage === 0) return null;
                    
                    const x1 = 50 + 40 * Math.cos((startAngle - 90) * Math.PI / 180);
                    const y1 = 50 + 40 * Math.sin((startAngle - 90) * Math.PI / 180);
                    const x2 = 50 + 40 * Math.cos((endAngle - 90) * Math.PI / 180);
                    const y2 = 50 + 40 * Math.sin((endAngle - 90) * Math.PI / 180);
                    
                    const largeArcFlag = percentage > 50 ? 1 : 0;
                    
                    return (
                      <motion.path
                        key={type}
                        d={`M 50 50 L ${x1} ${y1} A 40 40 0 ${largeArcFlag} 1 ${x2} ${y2} Z`}
                        fill={colors[type as keyof typeof colors]}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        transition={{ delay: 0.6 + index * 0.1 }}
                      />
                    );
                  });
                })()}
              </svg>
            </div>
          </div>
          
          <div className="space-y-2">
            {Object.entries(typeDistribution).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <div className="flex items-center">
                  <div className={`w-3 h-3 rounded-full mr-2 ${
                    type === "ROOT" ? "bg-purple-500" :
                    type === "SUB_OBJECTIVE" ? "bg-blue-500" :
                    type === "TASK" ? "bg-green-500" :
                    "bg-orange-500"
                  }`} />
                  <span className="text-sm">{type.replace("_", " ")}</span>
                </div>
                <span className="text-sm font-medium">{count}</span>
              </div>
            ))}
          </div>
        </motion.div>
      </div>

      {/* Energy Distribution */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.7 }}
        className="bg-card border rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Zap className="w-5 h-5 mr-2" />
          Energy Level Distribution
        </h3>
        
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(energyDistribution).map(([level, count]) => {
            const total = Object.values(energyDistribution).reduce((a, b) => a + b, 0);
            const percentage = total > 0 ? (count / total) * 100 : 0;
            
            return (
              <motion.div
                key={level}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.8 }}
                className="text-center"
              >
                <div className={`
                  h-32 rounded-lg flex items-end justify-center p-4 relative overflow-hidden
                  ${level === "HIGH" ? "bg-red-500/10" :
                    level === "MEDIUM" ? "bg-blue-500/10" :
                    "bg-green-500/10"}
                `}>
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${percentage}%` }}
                    transition={{ delay: 0.9, duration: 0.5 }}
                    className={`absolute bottom-0 left-0 right-0 ${
                      level === "HIGH" ? "bg-red-500/30" :
                      level === "MEDIUM" ? "bg-blue-500/30" :
                      "bg-green-500/30"
                    }`}
                  />
                  <div className="relative z-10">
                    <div className="text-2xl font-bold">{count}</div>
                    <div className="text-xs text-muted-foreground">{percentage.toFixed(0)}%</div>
                  </div>
                </div>
                <p className="text-sm font-medium mt-2">{level} Energy</p>
              </motion.div>
            );
          })}
        </div>
      </motion.div>

      {/* Recent Achievements */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.9 }}
        className="mt-8 bg-gradient-to-br from-primary/10 to-purple-600/10 border border-primary/20 rounded-xl p-6"
      >
        <h3 className="text-lg font-semibold mb-4 flex items-center">
          <Award className="w-5 h-5 mr-2" />
          Performance Insights
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <p className="text-sm text-muted-foreground mb-1">Most Productive Day</p>
            <p className="font-semibold">
              {weeklyActivity.reduce((a, b) => a.completed > b.completed ? a : b).day}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Focus Areas</p>
            <p className="font-semibold">
              {Object.entries(typeDistribution).reduce((a, b) => a[1] > b[1] ? a : b)[0].replace("_", " ")}
            </p>
          </div>
          <div>
            <p className="text-sm text-muted-foreground mb-1">Completion Rate</p>
            <p className="font-semibold">
              {stats?.by_status?.completed || 0} of {stats?.total || 0}
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
} 