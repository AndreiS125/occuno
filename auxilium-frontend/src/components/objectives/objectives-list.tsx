"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ChevronRight, 
  Target, 
  Clock, 
  Flag,
  MoreHorizontal,
  CheckCircle,
  AlertCircle,
  Repeat
} from "lucide-react";
import { Objective } from "@/types";
import { cn, formatDate, getStatusBadgeColor, getEnergyLevelColor, formatObjectiveType } from "@/lib/utils";

interface ObjectivesListProps {
  objectives: Objective[];
}

export function ObjectivesList({ objectives }: ObjectivesListProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const toggleExpanded = (id: string) => {
    const newExpanded = new Set(expandedIds);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedIds(newExpanded);
  };

  const rootObjectives = objectives.filter(obj => !obj.parent_id);

  const getChildren = (parentId: string): Objective[] => {
    return objectives.filter(obj => obj.parent_id === parentId);
  };

  const renderObjective = (objective: Objective, depth = 0) => {
    const children = getChildren(objective.id);
    const hasChildren = children.length > 0;
    const isExpanded = expandedIds.has(objective.id);

    return (
      <motion.div
        key={objective.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        className={cn("mb-2", depth > 0 && "ml-8")}
      >
        <div className="group bg-card border border-border rounded-xl p-4 hover:shadow-lg transition-all duration-200">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-3 flex-1">
              {hasChildren && (
                <button
                  onClick={() => toggleExpanded(objective.id)}
                  className="mt-1 p-1 hover:bg-muted rounded-md transition-colors"
                >
                  <ChevronRight 
                    className={cn(
                      "w-4 h-4 transition-transform",
                      isExpanded && "rotate-90"
                    )}
                  />
                </button>
              )}
              
              <div className="flex-1">
                <div className="flex items-center space-x-2 mb-1">
                  <h4 className="font-semibold text-lg">{objective.title}</h4>
                  <span className={cn(
                    "px-2 py-1 text-xs rounded-md",
                    getStatusBadgeColor(objective.status)
                  )}>
                    {objective.status.replace("_", " ")}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatObjectiveType(objective.objective_type)}
                  </span>
                  {objective.recurring && (
                    <Repeat className="w-3 h-3 text-muted-foreground" />
                  )}
                </div>
                
                {objective.description && (
                  <p className="text-sm text-muted-foreground mb-2">
                    {objective.description}
                  </p>
                )}
                
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  {objective.due_date && (
                    <div className="flex items-center space-x-1">
                      <Clock className="w-3 h-3" />
                      <span>{formatDate(objective.due_date)}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-1">
                    <Flag className={cn("w-3 h-3", getEnergyLevelColor(objective.energy_requirement))} />
                    <span>{objective.energy_requirement}</span>
                  </div>
                  
                  {objective.completion_percentage > 0 && (
                    <div className="flex items-center space-x-1">
                      <div className="w-20 h-2 bg-muted rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${objective.completion_percentage}%` }}
                          className="h-full bg-primary"
                        />
                      </div>
                      <span>{Math.round(objective.completion_percentage)}%</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 opacity-0 group-hover:opacity-100 transition-opacity">
              <button className="p-2 hover:bg-muted rounded-md transition-colors">
                {objective.status === "COMPLETED" ? (
                  <CheckCircle className="w-4 h-4 text-green-500" />
                ) : (
                  <AlertCircle className="w-4 h-4 text-muted-foreground" />
                )}
              </button>
              <button className="p-2 hover:bg-muted rounded-md transition-colors">
                <MoreHorizontal className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
        
        {isExpanded && hasChildren && (
          <div className="mt-2">
            <AnimatePresence>
              {children.map(child => renderObjective(child, depth + 1))}
            </AnimatePresence>
          </div>
        )}
      </motion.div>
    );
  };

  return (
    <div className="space-y-2">
      <AnimatePresence>
        {rootObjectives.length > 0 ? (
          rootObjectives.map(obj => renderObjective(obj))
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-12"
          >
            <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-lg font-medium text-muted-foreground">
              No objectives yet
            </p>
            <p className="text-sm text-muted-foreground">
              Create your first objective to get started
            </p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
} 