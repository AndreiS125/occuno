"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar,
  ChevronLeft,
  ChevronRight,
  Plus,
  Edit,
  Trash,
  GripVertical,
  AlertCircle,
  Target,
  CheckCircle,
  Clock
} from "lucide-react";
import { Objective, ObjectiveType } from "@/types";
import { Button } from "@/components/ui/button";
import { ObjectiveModal } from "@/components/modals";
import { cn } from "@/lib/utils";
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, isToday, addMonths, subMonths } from "date-fns";
import { expandRecurringEvent } from "@/lib/date-utils";
import { objectivesApi } from "@/lib/api";
import toast from "react-hot-toast";

interface GanttChartProps {
  objectives: Objective[];
  onUpdate: (id: string, updates: any) => void;
  onDelete: (id: string) => void;
  onRefresh: () => void;
}

interface DragItem {
  id: string;
  startDate: Date;
  endDate: Date;
  dragType: 'move' | 'resize-start' | 'resize-end';
}

export function GanttChart({ objectives, onUpdate, onDelete, onRefresh }: GanttChartProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedObjective, setSelectedObjective] = useState<Objective | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | undefined>();
  const [dragItem, setDragItem] = useState<DragItem | null>(null);
  const chartRef = useRef<HTMLDivElement>(null);

  // Expand recurring events
  const expandedObjectives = useMemo(() => {
    const expanded: any[] = [];
    objectives.forEach(obj => {
      const expandedEvents = expandRecurringEvent(obj, startOfMonth(currentMonth), endOfMonth(currentMonth));
      expanded.push(...expandedEvents);
    });
    return expanded;
  }, [objectives, currentMonth]);

  // Get all objectives with dates that fall within the current month view
  const objectivesWithDates = expandedObjectives.filter(obj => {
    if (!obj.due_date && !obj.created_at) return false;
    
    // Get the objective's date range
    let startDate: Date;
    let endDate: Date;
    
    if (obj.objective_type === ObjectiveType.TASK) {
      const task = obj as any;
      if (task.start_time && task.end_time) {
        startDate = new Date(task.start_time);
        endDate = new Date(task.end_time);
      } else if (obj.start_date && obj.due_date) {
        startDate = new Date(obj.start_date);
        endDate = new Date(obj.due_date);
      } else {
        startDate = new Date(obj.created_at);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000);
      }
    } else {
      startDate = obj.start_date ? new Date(obj.start_date) : new Date(obj.created_at);
      endDate = obj.due_date ? new Date(obj.due_date) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000);
    }
    
    // Check if the objective overlaps with the current month view
    const monthStart = startOfMonth(currentMonth);
    const monthEnd = endOfMonth(currentMonth);
    
    return startDate <= monthEnd && endDate >= monthStart;
  });

  // Group recurring events by their original ID to show them on the same line
  const groupedObjectives = useMemo(() => {
    const grouped = new Map();
    
    objectivesWithDates.forEach(obj => {
      const groupKey = obj.original_id || obj.id;
      
      if (!grouped.has(groupKey)) {
        // Use the original objective as the base, but merge recurring instances
        const baseObj = obj.original_id ? 
          objectives.find(o => o.id === obj.original_id) || obj : 
          obj;
        
        grouped.set(groupKey, {
          ...baseObj,
          recurring_instances: []
        });
      }
      
      // If this is a recurring instance, add it to the instances list
      if (obj.recurring_instance) {
        grouped.get(groupKey).recurring_instances.push(obj);
      }
    });
    
    return Array.from(grouped.values());
  }, [objectivesWithDates, objectives]);

  // Get the days in the current month
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });

  // Calculate grid column width
  const dayWidth = 40; // pixels per day
  const rowHeight = 50; // pixels per row

  const typeIcons = {
    [ObjectiveType.MAIN_OBJECTIVE]: <AlertCircle className="w-4 h-4" />,
    [ObjectiveType.SUB_OBJECTIVE]: <Target className="w-4 h-4" />,
    [ObjectiveType.TASK]: <CheckCircle className="w-4 h-4" />
  };

  const typeColors = {
    [ObjectiveType.MAIN_OBJECTIVE]: "bg-purple-500",
    [ObjectiveType.SUB_OBJECTIVE]: "bg-blue-500",
    [ObjectiveType.TASK]: "bg-green-500"
  };

  // Calculate bar position and width for an objective
  const getBarStyle = (objective: Objective) => {
    let startDate: Date;
    let endDate: Date;
    
    // For tasks, prefer start_time/end_time over start_date/due_date
    if (objective.objective_type === ObjectiveType.TASK) {
      const task = objective as any; // Cast to access task-specific fields
      if (task.start_time && task.end_time) {
        startDate = new Date(task.start_time);
        endDate = new Date(task.end_time);
      } else if (objective.start_date && objective.due_date) {
        startDate = new Date(objective.start_date);
        endDate = new Date(objective.due_date);
      } else {
        // Fallback for tasks without proper dates
        startDate = new Date(objective.created_at);
        endDate = new Date(startDate.getTime() + 24 * 60 * 60 * 1000); // 1 day duration
      }
    } else {
      // For non-task objectives
      startDate = objective.start_date ? new Date(objective.start_date) : new Date(objective.created_at);
      endDate = objective.due_date ? new Date(objective.due_date) : new Date(startDate.getTime() + 7 * 24 * 60 * 60 * 1000); // Default to 7 days
    }
    
    // Calculate positions relative to month start
    const startDiff = Math.max(0, (startDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24));
    const endDiff = Math.min(days.length, (endDate.getTime() - monthStart.getTime()) / (1000 * 60 * 60 * 24) + 1);
    
    const left = startDiff * dayWidth;
    const width = Math.max(dayWidth, (endDiff - startDiff) * dayWidth);
    
    return { left, width };
  };

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, objective: Objective, dragType: 'move' | 'resize-start' | 'resize-end' = 'move') => {
    let startDate: Date;
    let endDate: Date;
    
    // For tasks, use start_time/end_time if available
    if (objective.objective_type === ObjectiveType.TASK) {
      const task = objective as any;
      if (task.start_time && task.end_time) {
        startDate = new Date(task.start_time);
        endDate = new Date(task.end_time);
      } else {
        startDate = objective.start_date ? new Date(objective.start_date) : new Date(objective.created_at);
        endDate = objective.due_date ? new Date(objective.due_date) : new Date();
      }
    } else {
      startDate = objective.start_date ? new Date(objective.start_date) : new Date(objective.created_at);
      endDate = objective.due_date ? new Date(objective.due_date) : new Date();
    }
    
    setDragItem({
      id: objective.id,
      startDate,
      endDate,
      dragType
    });
    
    e.dataTransfer.effectAllowed = "move";
    // Prevent event from bubbling to parent drag handlers
    e.stopPropagation();
  };

  // Handle drag over
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
  };

  // Handle drop
  const handleDrop = async (e: React.DragEvent, dayIndex: number) => {
    e.preventDefault();
    
    if (!dragItem || !chartRef.current) return;
    
    const objective = objectives.find(obj => obj.id === dragItem.id);
    if (!objective) return;
    
    const dropDate = new Date(days[dayIndex]);
    let newStartDate: Date;
    let newEndDate: Date;
    
    if (dragItem.dragType === 'move') {
      // Calculate new dates based on drop position (maintain duration)
      const duration = dragItem.endDate.getTime() - dragItem.startDate.getTime();
      newStartDate = dropDate;
      newEndDate = new Date(newStartDate.getTime() + duration);
    } else if (dragItem.dragType === 'resize-start') {
      // Resize from start (keep end date fixed)
      newStartDate = dropDate;
      newEndDate = dragItem.endDate;
      
      // Ensure start is before end
      if (newStartDate >= newEndDate) {
        toast.error("Start date must be before end date");
        setDragItem(null);
        return;
      }
    } else if (dragItem.dragType === 'resize-end') {
      // Resize from end (keep start date fixed)
      newStartDate = dragItem.startDate;
      newEndDate = dropDate;
      
      // Ensure end is after start
      if (newEndDate <= newStartDate) {
        toast.error("End date must be after start date");
        setDragItem(null);
        return;
      }
    } else {
      return;
    }
    
    // Update objective with appropriate fields
    try {
      const updates: any = {
        start_date: newStartDate.toISOString(),
        due_date: newEndDate.toISOString()
      };
      
      // For tasks, also update time fields
      if (objective.objective_type === ObjectiveType.TASK) {
        updates.start_time = newStartDate.toISOString();
        updates.end_time = newEndDate.toISOString();
      }
      
      await onUpdate(objective.id, updates);
      toast.success(dragItem.dragType === 'move' ? "Task rescheduled!" : "Task duration updated!");
    } catch (error) {
      toast.error("Failed to update task");
    }
    
    setDragItem(null);
  };

  // Handle creating sub-objective
  const handleCreateSubObjective = (parentId: string) => {
    setCreateParentId(parentId);
    setShowCreateModal(true);
  };

  const handleCreate = async (data: any) => {
    try {
      await objectivesApi.create({
        ...data,
        parent_id: createParentId
      });
      toast.success("Objective created!");
      setShowCreateModal(false);
      setCreateParentId(undefined);
      onRefresh();
    } catch (error) {
      toast.error("Failed to create objective");
    }
  };

  // Handle edit modal
  useEffect(() => {
    if (selectedObjective) {
      setShowEditModal(true);
    }
  }, [selectedObjective]);

  const handleUpdateObjective = async (data: any) => {
    if (selectedObjective) {
      try {
        await onUpdate(selectedObjective.id, data);
        toast.success("Objective updated!");
        setShowEditModal(false);
        setSelectedObjective(null);
        onRefresh();
      } catch (error) {
        toast.error("Failed to update objective");
      }
    }
  };

  // Build hierarchical structure
  const buildHierarchy = () => {
    const rootObjectives = groupedObjectives.filter(obj => !obj.parent_id);
    const rows: { objective: any; level: number }[] = [];
    
    const addObjectiveAndChildren = (obj: any, level: number) => {
      rows.push({ objective: obj, level });
      const children = groupedObjectives.filter(child => child.parent_id === obj.id);
      children.forEach(child => addObjectiveAndChildren(child, level + 1));
    };
    
    rootObjectives.forEach(root => addObjectiveAndChildren(root, 0));
    return rows;
  };

  const hierarchicalRows = buildHierarchy();

  // Render multiple bars for recurring instances on the same line
  const renderObjectiveBars = (objective: any, rowIndex: number) => {
    const bars = [];
    const baseColor = typeColors[objective.objective_type as ObjectiveType];
    
    // Render the main objective bar if it's in the current month
    const objInMonth = objectivesWithDates.find(o => o.id === objective.id);
    if (objInMonth) {
      const barStyle = getBarStyle(objInMonth);
      const progress = objective.completion_percentage || 0;
      
      bars.push(
        <div
          key={`main-${objective.id}`}
          className={cn(
            "absolute top-2 h-[34px] rounded-md shadow-sm group",
            "hover:shadow-md transition-shadow",
            baseColor
          )}
          style={{
            left: `${barStyle.left}px`,
            width: `${barStyle.width}px`,
            opacity: 0.9
          }}
        >
          {/* Progress Bar */}
          <div
            className="absolute inset-0 bg-black/20 rounded-md pointer-events-none"
            style={{ width: `${progress}%` }}
          />
          
          {/* Main content (draggable for moving) */}
          <div
            draggable
            onDragStart={(e) => handleDragStart(e, objective, 'move')}
            onClick={() => setSelectedObjective(objective)}
            className="absolute inset-x-2 inset-y-0 cursor-move flex items-center px-2 text-white"
          >
            <GripVertical className="w-3 h-3 mr-1 opacity-50" />
            <span className="text-xs font-medium truncate">
              {objective.title}
            </span>
            {progress > 0 && (
              <span className="ml-auto text-xs opacity-75">
                {progress}%
              </span>
            )}
          </div>
        </div>
      );
    }
    
    // Render recurring instance bars
    if (objective.recurring_instances && objective.recurring_instances.length > 0) {
      objective.recurring_instances.forEach((instance: any, index: number) => {
        const barStyle = getBarStyle(instance);
        const yOffset = 2 + (index % 3) * 10; // Stack up to 3 instances with small offsets
        const opacity = 0.7 - (index * 0.1); // Slightly fade each additional instance
        
        bars.push(
          <div
            key={`instance-${instance.id}`}
            className={cn(
              "absolute h-[24px] rounded-sm shadow-sm group",
              "hover:shadow-md transition-shadow border border-white/30",
              baseColor
            )}
            style={{
              left: `${barStyle.left}px`,
              width: `${barStyle.width}px`,
              top: `${yOffset}px`,
              opacity
            }}
          >
            <div
              draggable
              onDragStart={(e) => handleDragStart(e, instance, 'move')}
              onClick={() => setSelectedObjective(instance)}
              className="absolute inset-0 cursor-move flex items-center px-1 text-white"
            >
              <span className="text-xs font-medium truncate">
                {instance.title} (R)
              </span>
            </div>
          </div>
        );
      });
    }
    
    return bars;
  };

  return (
    <div className="bg-card border rounded-xl overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b flex items-center justify-between bg-muted/50">
        <div className="flex items-center space-x-4">
          <h2 className="text-xl font-semibold">Gantt Chart</h2>
          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
            >
              <ChevronLeft className="w-4 h-4" />
            </Button>
            <span className="font-medium">
              {format(currentMonth, "MMMM yyyy")}
            </span>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
            >
              <ChevronRight className="w-4 h-4" />
            </Button>
          </div>
        </div>
        <Button
          size="sm"
          onClick={() => {
            setCreateParentId(undefined);
            setShowCreateModal(true);
          }}
        >
          <Plus className="w-4 h-4 mr-1" />
          New Task
        </Button>
      </div>

      {/* Chart Container */}
      <div className="flex">
        {/* Task Names Column */}
        <div className="w-64 border-r bg-muted/20">
          {/* Header */}
          <div className="h-12 border-b px-4 flex items-center font-medium text-sm">
            Tasks
          </div>
          
          {/* Task Rows */}
          {hierarchicalRows.map(({ objective, level }, index) => (
            <motion.div
              key={objective.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
              className="h-[50px] border-b flex items-center px-4 hover:bg-muted/50 group"
              style={{ paddingLeft: `${16 + level * 24}px` }}
            >
              <div className="flex items-center space-x-2 flex-1">
                {typeIcons[objective.objective_type as ObjectiveType]}
                <span className="text-sm font-medium truncate">
                  {objective.title}
                </span>
              </div>
              <div className="opacity-0 group-hover:opacity-100 transition-opacity flex items-center space-x-1">
                <button
                  onClick={() => handleCreateSubObjective(objective.id)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <Plus className="w-3 h-3" />
                </button>
                <button
                  onClick={() => setSelectedObjective(objective)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <button
                  onClick={() => onDelete(objective.id)}
                  className="p-1 hover:bg-muted rounded text-destructive"
                >
                  <Trash className="w-3 h-3" />
                </button>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Timeline Grid */}
        <div 
          ref={chartRef}
          className="flex-1 overflow-x-auto"
          onDragOver={handleDragOver}
        >
          {/* Days Header */}
          <div className="h-12 border-b flex sticky top-0 bg-background z-10">
            {days.map((day, index) => (
              <div
                key={day.toISOString()}
                className={cn(
                  "flex-shrink-0 border-r px-1 flex flex-col items-center justify-center",
                  isToday(day) && "bg-primary/10",
                  day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/50" : ""
                )}
                style={{ width: `${dayWidth}px` }}
              >
                <span className="text-xs font-medium">
                  {format(day, "d")}
                </span>
                <span className="text-xs text-muted-foreground">
                  {format(day, "EEE").charAt(0)}
                </span>
              </div>
            ))}
          </div>

          {/* Task Bars */}
          <div className="relative">
            {hierarchicalRows.map(({ objective }, rowIndex) => {
              return (
                <div
                  key={objective.id}
                  className="h-[50px] border-b relative"
                  onDrop={(e) => handleDrop(e, Math.floor((e.clientX - chartRef.current!.offsetLeft) / dayWidth))}
                >
                  {/* Grid lines */}
                  <div className="absolute inset-0 flex">
                    {days.map((day) => (
                      <div
                        key={day.toISOString()}
                        className={cn(
                          "flex-shrink-0 border-r",
                          isToday(day) && "bg-primary/5",
                          day.getDay() === 0 || day.getDay() === 6 ? "bg-muted/20" : ""
                        )}
                        style={{ width: `${dayWidth}px` }}
                      />
                    ))}
                  </div>

                  {/* Task Bars */}
                  {renderObjectiveBars(objective, rowIndex)}
                </div>
              );
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="p-4 border-t bg-muted/20 flex items-center justify-center space-x-6">
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-purple-500 rounded" />
          <span className="text-xs">Root</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-blue-500 rounded" />
          <span className="text-xs">Sub-objective</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-green-500 rounded" />
          <span className="text-xs">Task</span>
        </div>
        <div className="flex items-center space-x-2">
          <div className="w-4 h-4 bg-orange-500 rounded" />
          <span className="text-xs">Habit</span>
        </div>
      </div>

      {/* Create Modal */}
      <ObjectiveModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateParentId(undefined);
        }}
        onSuccess={() => {
          setShowCreateModal(false);
          onRefresh();
        }}
        parentId={createParentId}
        showTimeFields={true}
        defaultToTask={true}
      />

      {/* Edit Modal */}
      <ObjectiveModal
          isOpen={showEditModal}
        onClose={() => setShowEditModal(false)}
        onSuccess={() => {
          setShowEditModal(false);
          onRefresh();
        }}
        initialData={selectedObjective || undefined}
        showTimeFields={true}
        defaultToTask={true}
      />

      {/* Create Sub-task Modal */}
      <ObjectiveModal
        isOpen={showCreateModal}
          onClose={() => {
          setShowCreateModal(false);
          setCreateParentId(undefined);
          }}
        onSuccess={() => {
          setShowCreateModal(false);
          onRefresh();
        }}
        parentId={createParentId}
        showTimeFields={true}
        defaultToTask={true}
        />
    </div>
  );
} 