"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight,
  ChevronDown,
  Plus,
  Target,
  CheckCircle,
  Clock,
  AlertCircle,
  Zap,
  Battery,
  BatteryLow
} from "lucide-react";
import { Objective, ObjectiveStatus, ObjectiveType, EnergyLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { ObjectiveModal } from "@/components/modals";
import { ObjectiveCard } from "@/components/objectives/objective-card";
import { cn } from "@/lib/utils";
import { objectivesApi } from "@/lib/api";
import toast from "react-hot-toast";

interface ObjectiveTreeProps {
  objectives: Objective[];
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

interface TreeNodeProps {
  objective: Objective;
  childObjectives: Objective[];
  level: number;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
  allObjectives: Objective[];
}

function TreeNode({ objective, childObjectives, level, onUpdate, onDelete, onRefresh, allObjectives }: TreeNodeProps) {
  const [isExpanded, setIsExpanded] = useState(level < 2); // Only expand first two levels by default
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

  const typeIcons = {
    [ObjectiveType.MAIN_OBJECTIVE]: <AlertCircle className="w-4 h-4" />,
    [ObjectiveType.SUB_OBJECTIVE]: <Target className="w-4 h-4" />,
    [ObjectiveType.TASK]: <CheckCircle className="w-4 h-4" />
  };

  const energyIcons = {
    [EnergyLevel.HIGH]: <Zap className="w-3 h-3 text-yellow-500" />,
    [EnergyLevel.MEDIUM]: <Battery className="w-3 h-3 text-blue-500" />,
    [EnergyLevel.LOW]: <BatteryLow className="w-3 h-3 text-green-500" />
  };

  const statusColors = {
    [ObjectiveStatus.NOT_STARTED]: "bg-gray-200 text-gray-900 dark:bg-gray-700 dark:text-gray-100",
    [ObjectiveStatus.IN_PROGRESS]: "bg-blue-200 text-blue-900 dark:bg-blue-700 dark:text-blue-100",
    [ObjectiveStatus.COMPLETED]: "bg-green-200 text-green-900 dark:bg-green-700 dark:text-green-100",
    [ObjectiveStatus.BLOCKED]: "bg-red-200 text-red-900 dark:bg-red-700 dark:text-red-100",
    [ObjectiveStatus.CANCELLED]: "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-300"
  };

  const handleCreateSubObjective = async (data: any) => {
    try {
      await objectivesApi.create({
        ...data,
        parent_id: objective.id
      });
      toast.success("Sub-objective created!");
      setShowCreateModal(false);
      onRefresh();
    } catch (error) {
      toast.error("Failed to create sub-objective");
    }
  };

  const hasChildren = childObjectives.length > 0;

  // Calculate progress based on children
  const childProgress = hasChildren
    ? Math.round(
        childObjectives.reduce((sum, child) => sum + (child.completion_percentage || 0), 0) / 
        childObjectives.length
      )
    : objective.completion_percentage || 0;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: level * 0.02 }}
        className={cn(
          "relative",
          level > 0 && "ml-8"
        )}
      >
        {/* Connector Line */}
        {level > 0 && (
          <div className="absolute left-[-24px] top-0 bottom-0 w-px bg-border" />
        )}

        {/* Node */}
        <div className="relative">
          {/* Horizontal Connector */}
          {level > 0 && (
            <div className="absolute left-[-24px] top-8 w-6 h-px bg-border" />
          )}

          <div
            className={cn(
              "bg-card border rounded-xl p-4 mb-3 transition-all cursor-pointer",
              objective.status === ObjectiveStatus.COMPLETED 
                ? "border-green-500/50 bg-green-50/5" 
                : "border-border hover:border-primary/50"
            )}
            onClick={() => setShowDetails(!showDetails)}
          >
            <div className="flex items-start justify-between">
              <div className="flex items-start space-x-3 flex-1">
                {/* Expand/Collapse Button */}
                {hasChildren && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setIsExpanded(!isExpanded);
                    }}
                    className="mt-0.5 p-1 hover:bg-muted rounded"
                  >
                    {isExpanded ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                )}

                {/* Icon & Title */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-2 mb-2">
                    {typeIcons[objective.objective_type]}
                    <h4 className="font-medium truncate">{objective.title}</h4>
                    {energyIcons[objective.energy_requirement]}
                  </div>

                  {/* Status & Progress */}
                  <div className="flex items-center space-x-3">
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs",
                      statusColors[objective.status]
                    )}>
                      {objective.status.replace("_", " ")}
                    </span>

                    {/* Progress Bar */}
                    {objective.status === ObjectiveStatus.IN_PROGRESS && (
                      <div className="flex-1 max-w-[200px]">
                        <div className="h-2 bg-muted rounded-full overflow-hidden">
                          <motion.div
                            initial={{ width: 0 }}
                            animate={{ width: `${childProgress}%` }}
                            transition={{ duration: 0.3 }}
                            className="h-full bg-primary"
                          />
                        </div>
                      </div>
                    )}

                    {/* Completion Percentage */}
                    <span className="text-xs text-muted-foreground">
                      {childProgress}%
                    </span>
                  </div>
                </div>
              </div>

              {/* Add Sub-objective Button */}
              {objective.objective_type !== ObjectiveType.TASK && (
                <Button
                  size="sm"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowCreateModal(true);
                  }}
                  className="ml-2 group relative"
                >
                  <Plus className="w-4 h-4" />
                  <span className="ml-1 hidden sm:inline">Add</span>
                  {/* Tooltip */}
                  <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs bg-popover text-popover-foreground rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                    Add sub-objective
                  </span>
                </Button>
              )}
            </div>

            {/* Details (shown on click) */}
            <AnimatePresence>
              {showDetails && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: "auto", opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="mt-4 pt-4 border-t border-border"
                  onClick={(e) => e.stopPropagation()} // Prevent event bubbling
                >
                  <ObjectiveCard
                    objective={objective}
                    onUpdate={onUpdate}
                    onDelete={onDelete}
                  />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Children */}
        <AnimatePresence>
          {isExpanded && hasChildren && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.2 }}
            >
              {childObjectives.map((child, index) => (
                <TreeNode
                  key={child.id}
                  objective={child}
                  childObjectives={allObjectives.filter((obj: Objective) => obj.parent_id === child.id)}
                  level={level + 1}
                  onUpdate={onUpdate}
                  onDelete={onDelete}
                  onRefresh={onRefresh}
                  allObjectives={allObjectives}
                />
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Create Sub-objective Modal */}
      <ObjectiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          onRefresh();
        }}
        parentId={objective.id}
        defaultToTask={false}
      />
    </>
  );
}

export function ObjectiveTree({ objectives, onUpdate, onDelete, onRefresh }: ObjectiveTreeProps) {
  // Get root objectives (no parent)
  const rootObjectives = objectives.filter(obj => !obj.parent_id);

  // Helper to get all objectives (for passing to TreeNode)
  const allObjectives = objectives;

  if (rootObjectives.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          No root objectives found. Create one to get started!
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {rootObjectives.map((root) => (
        <TreeNode
          key={root.id}
          objective={root}
          childObjectives={allObjectives.filter(obj => obj.parent_id === root.id)}
          level={0}
          onUpdate={onUpdate}
          onDelete={onDelete}
          onRefresh={onRefresh}
          allObjectives={allObjectives}
        />
      ))}
    </div>
  );
} 