"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { objectivesApi } from "@/lib/api";
import { DashboardStats } from "@/components/dashboard/dashboard-stats";
import { 
  Calendar,
  Target,
  TrendingUp,
  Clock,
  Plus,
  ArrowRight
} from "lucide-react";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function DashboardPage() {
  const { data: objectives = [], isLoading } = useQuery({
    queryKey: ["objectives"],
    queryFn: objectivesApi.getAll,
  });

  const { data: stats } = useQuery({
    queryKey: ["objective-stats"],
    queryFn: objectivesApi.getStats,
  });

  const recentObjectives = objectives.slice(0, 5);
  const upcomingDeadlines = objectives
    .filter(obj => obj.deadline_date)
    .sort((a, b) => new Date(a.deadline_date!).getTime() - new Date(b.deadline_date!).getTime())
    .slice(0, 3);

  if (isLoading) {
    return (
      <div className="container mx-auto px-6 py-8">
        <div className="animate-pulse space-y-8">
          <div className="h-8 bg-muted rounded w-64"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-muted rounded-xl"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-6 py-8 space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h1 className="text-3xl font-bold">Dashboard</h1>
          <p className="text-muted-foreground mt-2">
            Welcome back! Here's your productivity overview.
          </p>
        </div>
        <Button asChild>
          <Link href="/objectives" className="gap-2">
            <Plus className="w-4 h-4" />
            New Objective
          </Link>
        </Button>
      </motion.div>

      {/* Stats */}
      {stats && <DashboardStats stats={stats} />}

      {/* Quick Actions & Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Recent Objectives */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="lg:col-span-2"
        >
          <div className="bg-card border border-border rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-semibold flex items-center gap-2">
                <Target className="w-5 h-5 text-primary" />
                Recent Objectives
              </h2>
              <Button variant="ghost" size="sm" asChild>
                <Link href="/objectives" className="gap-1">
                  View All
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div className="space-y-3">
              {recentObjectives.length > 0 ? (
                recentObjectives.map((objective, index) => (
                  <motion.div
                    key={objective.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 + index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg hover:bg-muted/50 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${
                        objective.status === 'completed' ? 'bg-green-500' :
                        objective.status === 'in_progress' ? 'bg-blue-500' :
                        objective.status === 'blocked' ? 'bg-red-500' :
                        'bg-gray-400'
                      }`} />
                      <div>
                        <p className="font-medium">{objective.title}</p>
                        <p className="text-sm text-muted-foreground capitalize">
                          {objective.status.replace('_', ' ')}
                        </p>
                      </div>
                    </div>
                    {objective.deadline_date && (
                      <div className="text-sm text-muted-foreground">
                        {new Date(objective.deadline_date).toLocaleDateString()}
                      </div>
                    )}
                  </motion.div>
                ))
              ) : (
                <div className="text-center py-8 text-muted-foreground">
                  <Target className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p>No objectives yet. Create your first one!</p>
                  <Button asChild className="mt-4">
                    <Link href="/objectives">
                      Get Started
                    </Link>
                  </Button>
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-6"
        >
          {/* Upcoming Deadlines */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
              <Clock className="w-5 h-5 text-amber-500" />
              Upcoming Deadlines
            </h3>
            <div className="space-y-3">
              {upcomingDeadlines.length > 0 ? (
                upcomingDeadlines.map((objective, index) => (
                  <motion.div
                    key={objective.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 + index * 0.05 }}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/30"
                  >
                    <div>
                      <p className="font-medium text-sm">{objective.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(objective.deadline_date!).toLocaleDateString()}
                      </p>
                    </div>
                  </motion.div>
                ))
              ) : (
                <p className="text-sm text-muted-foreground text-center py-4">
                  No upcoming deadlines
                </p>
              )}
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-card border border-border rounded-xl p-6">
            <h3 className="text-lg font-semibold mb-4">Quick Actions</h3>
            <div className="space-y-3">
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/calendar">
                  <Calendar className="w-4 h-4" />
                  View Calendar
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/analytics">
                  <TrendingUp className="w-4 h-4" />
                  Analytics
                </Link>
              </Button>
              <Button asChild variant="outline" className="w-full justify-start gap-2">
                <Link href="/objectives">
                  <Target className="w-4 h-4" />
                  All Objectives
                </Link>
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
