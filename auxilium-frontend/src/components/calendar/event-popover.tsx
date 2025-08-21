"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  X, 
  Clock, 
  Calendar, 
  Target, 
  Zap, 
  BarChart3, 
  Edit, 
  Trash2, 
  CheckCircle2,
  Circle,
  AlertCircle,
  PauseCircle
} from "lucide-react";
import { Objective, ObjectiveStatus, ObjectiveType, EnergyLevel } from "@/types";
import { objectivesApi } from "@/lib/api";
import toast from "react-hot-toast";

interface EventPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  onEdit: () => void;
  onRefresh: () => void;
  objective: Objective | null;
  anchorEl: HTMLElement | null;
}

const statusIcons = {
  [ObjectiveStatus.NOT_STARTED]: Circle,
  [ObjectiveStatus.IN_PROGRESS]: AlertCircle,
  [ObjectiveStatus.COMPLETED]: CheckCircle2,
  [ObjectiveStatus.BLOCKED]: PauseCircle,
  [ObjectiveStatus.CANCELLED]: X,
};

const statusColors = {
  [ObjectiveStatus.NOT_STARTED]: "text-gray-500",
  [ObjectiveStatus.IN_PROGRESS]: "text-yellow-500",
  [ObjectiveStatus.COMPLETED]: "text-green-500",
  [ObjectiveStatus.BLOCKED]: "text-red-500",
  [ObjectiveStatus.CANCELLED]: "text-gray-400",
};

const energyColors = {
  [EnergyLevel.LOW]: "text-green-500",
  [EnergyLevel.MEDIUM]: "text-yellow-500",
  [EnergyLevel.HIGH]: "text-red-500",
};

export function EventPopover({
  isOpen,
  onClose,
  onEdit,
  onRefresh,
  objective,
  anchorEl
}: EventPopoverProps) {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDeleting, setIsDeleting] = useState(false);
  const popoverRef = useRef<HTMLDivElement>(null);

  // Calculate position based on anchor element
  useEffect(() => {
    if (!anchorEl || !isOpen) return;

    const updatePosition = () => {
      const rect = anchorEl.getBoundingClientRect();
      const popoverWidth = 320;
      const popoverHeight = 400;
      
      // Calculate ideal position (to the right of the event)
      let x = rect.right + 10;
      let y = rect.top;
      
      // Adjust if popover would go off-screen horizontally
      if (x + popoverWidth > window.innerWidth) {
        x = rect.left - popoverWidth - 10; // Position to the left instead
      }
      
      // Adjust if popover would go off-screen vertically
      if (y + popoverHeight > window.innerHeight) {
        y = window.innerHeight - popoverHeight - 20;
      }
      
      // Ensure minimum margins
      x = Math.max(10, x);
      y = Math.max(10, y);
      
      setPosition({ x, y });
    };

    updatePosition();
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition);
    
    return () => {
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition);
    };
  }, [anchorEl, isOpen]);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;

    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current && 
        !popoverRef.current.contains(event.target as Node) &&
        !anchorEl?.contains(event.target as Node)
      ) {
        onClose();
      }
    };

    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('keydown', handleEscape);
    
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleEscape);
    };
  }, [isOpen, onClose, anchorEl]);

  const handleDelete = useCallback(async () => {
    if (!objective || isDeleting) return;
    
    setIsDeleting(true);
    try {
      await objectivesApi.delete(objective.id);
      toast.success("Objective deleted successfully! 🗑️");
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Error deleting objective:", error);
      toast.error("Failed to delete objective");
    } finally {
      setIsDeleting(false);
    }
  }, [objective, isDeleting, onRefresh, onClose]);

  const handleStatusToggle = useCallback(async () => {
    if (!objective) return;
    
    const isCompleting = objective.status !== ObjectiveStatus.COMPLETED;
    try {
      if (isCompleting) {
        const result = await objectivesApi.complete(objective.id);
        const xp = result?.gamification?.total_xp_earned ?? result?.gamification?.xp_earned ?? 0;
        toast.success(xp > 0 ? `Completed! +${xp} XP 🎉` : "Completed!");
      } else {
        await objectivesApi.update(objective.id, { status: ObjectiveStatus.NOT_STARTED, completion_percentage: 0 });
        toast.success("Objective reopened");
      }
      onRefresh();
      onClose();
    } catch (error) {
      console.error("Error updating objective status:", error);
      toast.error("Failed to update objective");
    }
  }, [objective, onRefresh, onClose]);

  const formatDateTime = (dateStr: string, isAllDay: boolean) => {
    const date = new Date(dateStr);
    if (isAllDay) {
      return date.toLocaleDateString();
    }
    return date.toLocaleString();
  };

  if (!objective) return null;

  const StatusIcon = statusIcons[objective.status];

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop - subtle, doesn't blur */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/10 z-40"
            onClick={onClose}
          />
          
          {/* Popover */}
          <motion.div
            ref={popoverRef}
            initial={{ opacity: 0, scale: 0.95, y: 10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 10 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="fixed z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden"
            style={{
              left: position.x,
              top: position.y,
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white truncate">
                    {objective.title}
                  </h3>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusIcon className={`w-4 h-4 ${statusColors[objective.status]}`} />
                    <span className="text-sm text-gray-600 dark:text-gray-400 capitalize">
                      {objective.status.replace('_', ' ')}
                    </span>
                    {objective.objective_type === ObjectiveType.TASK && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded">
                        Task
                      </span>
                    )}
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition-colors"
                >
                  <X className="w-4 h-4 text-gray-500" />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 space-y-4 max-h-80 overflow-y-auto">
              {/* Description */}
              {objective.description && (
                <div>
                  <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
                    {objective.description}
                  </p>
                </div>
              )}

              {/* Important Details */}
              <div className="space-y-3">
                {/* Time */}
                <div className="flex items-center gap-3">
                  <Clock className="w-4 h-4 text-gray-500" />
                  <div className="text-sm">
                    <div className="text-gray-900 dark:text-white">
                      {formatDateTime(objective.start_date!, !!objective.all_day)}
                    </div>
                    {objective.due_date && objective.due_date !== objective.start_date && (
                      <div className="text-gray-600 dark:text-gray-400">
                        to {formatDateTime(objective.due_date, !!objective.all_day)}
                      </div>
                    )}
                  </div>
                </div>

                {/* Priority & Energy */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex items-center gap-2">
                    <Target className="w-4 h-4 text-gray-500" />
                    <div className="text-sm">
                      <div className="text-gray-600 dark:text-gray-400">Priority</div>
                      <div className="text-gray-900 dark:text-white font-medium">
                        {Math.round((objective.priority_score ?? 0) * 100)}%
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Zap className={`w-4 h-4 ${energyColors[objective.energy_requirement]}`} />
                    <div className="text-sm">
                      <div className="text-gray-600 dark:text-gray-400">Energy</div>
                      <div className="text-gray-900 dark:text-white font-medium capitalize">
                        {objective.energy_requirement}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Optional Details */}
              {(objective.completion_percentage > 0 || objective.complexity_score > 0) && (
                <div className="pt-2 border-t border-gray-200 dark:border-gray-700 space-y-3">
                  {objective.completion_percentage > 0 && (
                    <div className="flex items-center gap-3">
                      <BarChart3 className="w-4 h-4 text-gray-500" />
                      <div className="flex-1">
                        <div className="flex items-center justify-between text-sm mb-1">
                          <span className="text-gray-600 dark:text-gray-400">Progress</span>
                          <span className="text-gray-900 dark:text-white font-medium">
                            {objective.completion_percentage}%
                          </span>
                        </div>
                        <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                          <div 
                            className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                            style={{ width: `${objective.completion_percentage}%` }}
                          />
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {objective.complexity_score > 0 && (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 flex items-center justify-center">
                        <div className="w-2 h-2 bg-gray-500 rounded-full" />
                      </div>
                      <div className="text-sm">
                        <span className="text-gray-600 dark:text-gray-400">Complexity: </span>
                        <span className="text-gray-900 dark:text-white font-medium">
                          {Math.round((objective.complexity_score ?? 0) * 100)}%
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Actions */}
            <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
              <div className="flex items-center gap-2">
                <button
                  onClick={handleStatusToggle}
                  className="flex-1 px-3 py-2 bg-blue-500 hover:bg-blue-600 text-white text-sm font-medium rounded transition-colors"
                >
                  {objective.status === ObjectiveStatus.COMPLETED ? 'Reopen' : 'Complete'}
                </button>
                <button
                  onClick={onEdit}
                  className="px-3 py-2 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm font-medium rounded transition-colors"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={handleDelete}
                  disabled={isDeleting}
                  className="px-3 py-2 border border-red-300 hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 text-sm font-medium rounded transition-colors disabled:opacity-50"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
