"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
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
  const [currentContent, setCurrentContent] = useState<"grid" | "tree" | "hierarchy">("tree");
  
  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const filtersRef = useRef<HTMLDivElement>(null);
  const statsRef = useRef<HTMLDivElement>(null);
  const controlsRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);

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

  // Handle view mode changes with GSAP transitions
  const handleViewModeChange = (newMode: "grid" | "tree" | "hierarchy") => {
    if (newMode === viewMode) return;
    
    // Animate out current content
    gsap.to(contentRef.current, {
      opacity: 0,
      x: viewMode === "tree" ? -20 : viewMode === "hierarchy" ? 0 : 20,
      scale: viewMode === "hierarchy" ? 0.95 : 1,
      duration: 0.15,
      ease: "power2.in",
      onComplete: () => {
        setCurrentContent(newMode);
        setViewMode(newMode);
        
        // Animate in new content
        gsap.fromTo(contentRef.current, 
          {
            opacity: 0,
            x: newMode === "tree" ? -20 : newMode === "hierarchy" ? 0 : 20,
            scale: newMode === "hierarchy" ? 0.95 : 1
          },
          {
            opacity: 1,
            x: 0,
            scale: 1,
            duration: 0.15,
            ease: "power2.out"
          }
        );
        
        // Animate individual grid items if switching to grid
        if (newMode === "grid") {
          gsap.fromTo(".grid-objective-card", 
            { opacity: 0, y: 20 },
            { 
              opacity: 1, 
              y: 0, 
              duration: 0.2, 
              stagger: 0.02,
              delay: 0.05,
              ease: "power2.out" 
            }
          );
        }
      }
    });
  };

  // GSAP animations
  useGSAP(() => {
    const tl = gsap.timeline();
    
    // Filters and stats
    tl.fromTo(filtersRef.current, 
      { opacity: 0, y: -20 }, 
      { opacity: 1, y: 0, duration: 0.25, ease: "power2.out" }
    );

    // Stats cards with stagger
    tl.fromTo(".stats-card", 
      { opacity: 0, y: 20, scale: 0.9 },
      { 
        opacity: 1, 
        y: 0, 
        scale: 1, 
        duration: 0.2, 
        stagger: 0.03,
        ease: "back.out(1.2)" 
      },
      "-=0.15"
    );

    // Animate progress bar
    tl.to(".progress-bar-fill", {
      width: `${stats.avgProgress}%`,
      duration: 0.3,
      ease: "power2.out"
    }, "-=0.1");

    // Controls
    tl.fromTo(controlsRef.current, 
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
      "-=0.15"
    );

    // Initial content
    tl.fromTo(contentRef.current,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.2, ease: "power2.out" },
      "-=0.1"
    );

  }, { dependencies: [objectives.length] });

  return (
    <div ref={containerRef} className="container mx-auto px-4 py-8">
      {/* Filters and Search */}
      <div
        ref={filtersRef}
        className="mb-6 flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center"
      >
        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          {/* Total Objectives */}
          <div className="stats-card bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <Target className="w-5 h-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.total}</span>
            </div>
            <p className="text-sm text-muted-foreground">Total Objectives</p>
          </div>

          {/* Average Progress */}
          <div className="stats-card bg-card border rounded-xl p-4">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="w-5 h-5 text-muted-foreground" />
              <span className="text-2xl font-bold">{stats.avgProgress}%</span>
            </div>
            <p className="text-sm text-muted-foreground">Average Progress</p>
            <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
              <div
                className="progress-bar-fill h-full bg-primary"
                style={{ width: '0%' }}
              />
            </div>
          </div>

          {/* Type Distribution */}
          <div className="stats-card bg-card border rounded-xl p-4">
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
          </div>

          {/* Status Distribution */}
          <div className="stats-card bg-card border rounded-xl p-4">
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
          </div>
        </div>

        {/* Controls */}
        <div ref={controlsRef} className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center space-x-4">
            {/* View Mode Toggle */}
            <div className="flex items-center bg-muted rounded-lg p-1">
              <Button
                size="sm"
                variant={viewMode === "tree" ? "default" : "ghost"}
                onClick={() => handleViewModeChange("tree")}
                className="gap-2"
              >
                <TreePine className="w-4 h-4" />
                Tree
              </Button>
              <Button
                size="sm"
                variant={viewMode === "hierarchy" ? "default" : "ghost"}
                onClick={() => handleViewModeChange("hierarchy")}
                className="gap-2"
              >
                <GitBranch className="w-4 h-4" />
                Diagram
              </Button>
              <Button
                size="sm"
                variant={viewMode === "grid" ? "default" : "ghost"}
                onClick={() => handleViewModeChange("grid")}
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
      </div>

      {/* Content */}
      <div ref={contentRef}>
        {currentContent === "tree" && (
          <ObjectiveTree
            objectives={objectives}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onRefresh={refetch}
          />
        )}
        {currentContent === "hierarchy" && (
          <div className="bg-card border rounded-xl">
            <ObjectiveHierarchyDiagram 
              objectives={objectives}
              onUpdate={handleUpdate}
              onDelete={handleDelete}
              onRefresh={refetch}
            />
          </div>
        )}
        {currentContent === "grid" && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {objectives.map((objective, index) => (
              <div
                key={objective.id}
                className="grid-objective-card"
              >
                <ObjectiveCard
                  objective={objective}
                  onUpdate={handleUpdate}
                  onDelete={handleDelete}
                />
              </div>
            ))}
          </div>
        )}
      </div>

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