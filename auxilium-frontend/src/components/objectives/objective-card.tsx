"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { 
  Calendar,
  Clock,
  AlertCircle,
  CheckCircle,
  Edit2,
  Trash2,
  ChevronRight,
  Zap,
  Battery,
  BatteryLow,
  Edit,
  Plus
} from "lucide-react";
import { Objective, ObjectiveStatus, ObjectiveType, EnergyLevel } from "@/types";
import { Button } from "@/components/ui/button";
import { ObjectiveModal } from "@/components/modals";
import { cn } from "@/lib/utils";
import { format } from "date-fns";
import { objectivesApi } from "@/lib/api";

interface ObjectiveCardProps {
  objective: Objective;
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
}

export function ObjectiveCard({ objective, onUpdate, onDelete }: ObjectiveCardProps) {
  const [showEditModal, setShowEditModal] = useState(false);
  const [showCreateSubModal, setShowCreateSubModal] = useState(false);

  const statusColors = {
    [ObjectiveStatus.NOT_STARTED]: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200",
    [ObjectiveStatus.IN_PROGRESS]: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
    [ObjectiveStatus.COMPLETED]: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
    [ObjectiveStatus.BLOCKED]: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
    [ObjectiveStatus.CANCELLED]: "bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400"
  };

  const typeIcons = {
    [ObjectiveType.MAIN_OBJECTIVE]: <AlertCircle className="w-4 h-4" />,
    [ObjectiveType.SUB_OBJECTIVE]: <ChevronRight className="w-4 h-4" />,
    [ObjectiveType.TASK]: <CheckCircle className="w-4 h-4" />
  };

  const energyIcons = {
    [EnergyLevel.HIGH]: <Zap className="w-4 h-4 text-yellow-500" />,
    [EnergyLevel.MEDIUM]: <Battery className="w-4 h-4 text-blue-500" />,
    [EnergyLevel.LOW]: <BatteryLow className="w-4 h-4 text-green-500" />
  };

  const handleComplete = () => {
    onUpdate(objective.id, { 
      status: ObjectiveStatus.COMPLETED, 
      completion_percentage: 100 
    });
  };

  const handleEdit = async (updatedData: any) => {
    await onUpdate(objective.id, updatedData);
    setShowEditModal(false);
  };

  return (
    <>
      <motion.div
        whileHover={{ scale: 1.01 }}
        transition={{ duration: 0.1 }}
        className="bg-card border border-border rounded-xl p-6 h-full flex flex-col"
      >
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center space-x-2">
            {typeIcons[objective.objective_type]}
            <span className={cn(
              "px-2 py-1 rounded-full text-xs font-medium",
              statusColors[objective.status]
            )}>
              {objective.status.replace("_", " ")}
            </span>
          </div>
          <div className="flex items-center space-x-1">
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8"
              onClick={() => setShowEditModal(true)}
            >
              <Edit2 className="w-4 h-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              className="h-8 w-8 text-destructive"
              onClick={() => onDelete(objective.id)}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          <h3 className="font-semibold text-lg mb-2">{objective.title}</h3>
          {objective.description && (
            <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
              {objective.description}
            </p>
          )}

          {/* Metadata */}
          <div className="space-y-2">
            {objective.due_date && (
              <div className="flex items-center text-sm text-muted-foreground">
                <Calendar className="w-4 h-4 mr-2" />
                Due {format(new Date(objective.due_date), "MMM d, yyyy")}
              </div>
            )}
            
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="flex items-center">
                  {energyIcons[objective.energy_requirement]}
                </div>
                <div className="text-sm">
                  <span className="text-muted-foreground">Priority:</span>{" "}
                  <span className="font-medium">
                    {Math.round(objective.priority_score * 100)}%
                  </span>
                </div>
              </div>
            </div>

            {/* Progress Bar */}
            {objective.status === ObjectiveStatus.IN_PROGRESS && (
              <div className="mt-4">
                <div className="flex justify-between text-sm mb-1">
                  <span className="text-muted-foreground">Progress</span>
                  <span className="font-medium">{objective.completion_percentage}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${objective.completion_percentage}%` }}
                    transition={{ duration: 0.2 }}
                    className="h-full bg-primary"
                  />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t">
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowEditModal(true)}
            >
              <Edit className="w-3 h-3 mr-1" />
              Edit
            </Button>
            {objective.objective_type !== ObjectiveType.TASK && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => setShowCreateSubModal(true)}
              >
                <Plus className="w-3 h-3 mr-1" />
                Add Sub
              </Button>
            )}
            {objective.status !== ObjectiveStatus.COMPLETED && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleComplete}
              >
                Mark as Complete
              </Button>
            )}
          </div>
        </div>
      </motion.div>

      {/* Edit Modal */}
      <ObjectiveModal
        isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          // Trigger refresh
          window.location.reload();
        }}
        initialData={objective}
        defaultToTask={false}
        showTimeFields={objective.objective_type === ObjectiveType.TASK}
      />

      {/* Create Sub-objective Modal */}
      <ObjectiveModal
        isOpen={showCreateSubModal}
        onClose={() => setShowCreateSubModal(false)}
        onSuccess={() => {
          setShowCreateSubModal(false);
          // Trigger refresh
          window.location.reload();
        }}
        parentId={objective.id}
        defaultToTask={false}
      />
    </>
  );
} 