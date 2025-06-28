"use client";

import { useState, useEffect, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { 
  Target, 
  Filter, 
  Grid3X3, 
  TreePine, 
  PieChart,
  BarChart3,
  TrendingUp,
  GitBranch
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { ObjectiveCard } from "@/components/objectives/objective-card";
import { ObjectiveTree } from "@/components/objectives/objective-tree";
import { ObjectiveHierarchyDiagram } from "@/components/objectives/objective-hierarchy-diagram";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { objectivesApi } from "@/lib/api";
import toast from "react-hot-toast";
import { Objective } from "@/types";
import { LoadingSpinner } from "@/components/ui";
import { Card } from "@/components/ui/card";

export default function ObjectivesPage() {
  const [filterType, setFilterType] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [viewMode, setViewMode] = useState<"grid" | "tree" | "hierarchy">("tree");

  const { data: objectives = [], refetch } = useQuery({
    queryKey: ['objectives', filterType, filterStatus],
    queryFn: async () => {
      const params: any = {};
      if (filterType !== 'all') params.objective_type = filterType;
      if (filterStatus !== 'all') params.status = filterStatus;
      const { data } = await objectivesApi.list(params);
      return data;
    }
  });

  const handleUpdate = async (id: string, updates: any) => {
    try {
      await objectivesApi.update(id, updates);
      toast.success("Objective updated!");
      refetch();
    } catch (error) {
      toast.error("Failed to update objective");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await objectivesApi.delete(id);
      toast.success("Objective deleted!");
      refetch();
    } catch (error) {
      toast.error("Failed to delete objective");
    }
  };

  // Calculate statistics
  const stats = {
    total: objectives.length,
    byType: objectives.reduce((acc: Record<string, number>, obj: Objective) => {
      acc[obj.objective_type] = (acc[obj.objective_type] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    byStatus: objectives.reduce((acc: Record<string, number>, obj: Objective) => {
      acc[obj.status] = (acc[obj.status] || 0) + 1;
      return acc;
    }, {} as Record<string, number>),
    avgProgress: objectives.length > 0
      ? Math.round(objectives.reduce((sum: number, obj: Objective) => sum + (obj.completion_percentage || 0), 0) / objectives.length)
      : 0
  };

  const typeColors: Record<string, string> = {
    ROOT: "bg-purple-500",
    SUB_OBJECTIVE: "bg-blue-500",
    TASK: "bg-green-500",
    HABIT: "bg-orange-500"
  };

  const statusColors: Record<string, string> = {
    NOT_STARTED: "bg-gray-500",
    IN_PROGRESS: "bg-blue-500",
    COMPLETED: "bg-green-500",
    BLOCKED: "bg-red-500",
    CANCELLED: "bg-gray-400"
  };

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Filters and Search */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
      >
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Objectives */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-card border rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Objectives</p>
          </motion.div>

          {/* Average Progress */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.avgProgress}%</span>
            </div>
            <p className="text-sm text-muted-foreground">Average Progress</p>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${stats.avgProgress}%` }}
                className="h-full bg-primary"
              />
            </div>
          </motion.div>

          {/* Type Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="bg-card border rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <PieChart className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Types</span>
            </div>
            <div className="space-y-1">
              {Object.entries(stats.byType).map(([type, count]) => (
                <div key={type} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${typeColors[type]}`} />
                    <span className="text-xs">{type.replace("_", " ")}</span>
                  </div>
                  <span className="text-xs font-medium">{String(count)}</span>
                </div>
              ))}
            </div>
          </motion.div>

          {/* Status Distribution */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="bg-card border rounded-xl p-4"
          >
            <div className="flex items-center justify-between mb-2">
              <BarChart3 className="w-5 h-5 text-muted-foreground" />
              <span className="text-sm font-medium">Status</span>
            </div>
            <div className="space-y-1">
              {Object.entries(stats.byStatus).map(([status, count]) => (
                <div key={status} className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <div className={`w-2 h-2 rounded-full ${statusColors[status]}`} />
                    <span className="text-xs">{status.replace("_", " ")}</span>
                  </div>
                  <span className="text-xs font-medium">{String(count)}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>

        {/* Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === "tree" ? "default" : "ghost"}
                onClick={() => setViewMode("tree")}
                className="gap-2"
              >
                <TreePine className="w-4 h-4" />
                Tree
              </Button>
              <Button
                size="sm"
                variant={viewMode === "hierarchy" ? "default" : "ghost"}
                onClick={() => setViewMode("hierarchy")}
                className="gap-2"
              >
                <GitBranch className="w-4 h-4" />
                Diagram
              </Button>
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
                onClick={() => setViewMode("grid")}
                className="gap-2"
              >
                <Grid3X3 className="w-4 h-4" />
                Grid
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="ROOT">Root</SelectItem>
                <SelectItem value="SUB_OBJECTIVE">Sub-objective</SelectItem>
                <SelectItem value="TASK">Task</SelectItem>
                <SelectItem value="HABIT">Habit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="NOT_STARTED">Not Started</SelectItem>
                <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
                <SelectItem value="COMPLETED">Completed</SelectItem>
                <SelectItem value="BLOCKED">Blocked</SelectItem>
                <SelectItem value="CANCELLED">Cancelled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </motion.div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {viewMode === "tree" ? (
          <motion.div
            key="tree"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
          >
            <ObjectiveTree
              objectives={objectives}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onRefresh={refetch}
            />
          </motion.div>
        ) : viewMode === "hierarchy" ? (
          <motion.div
            key="hierarchy"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="bg-card border rounded-xl"
          >
            <ObjectiveHierarchyDiagram objectives={objectives} />
          </motion.div>
        ) : (
          <motion.div
            key="grid"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
          >
            {objectives.map((objective, index) => (
              <motion.div
                key={objective.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <ObjectiveCard
                  objective={objective}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              </motion.div>
            ))}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Empty State */}
      {objectives.length === 0 && (
        <div className="text-center py-12">
          <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
          <p className="text-lg text-muted-foreground mb-4">
            No objectives found. Create your first objective to get started!
          </p>
        </div>
      )}
    </div>
  );
} 