"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, CalendarIcon, Battery, BatteryLow, Zap } from "lucide-react";
import { Objective, Task, ObjectiveType, ObjectiveStatus, EnergyLevel } from "@/types";
import { objectivesApi } from "@/lib/api";
import { 
  formatDateTimeLocal, 
  formatDateOnly, 
  parseLocalDateTimeToISO, 
  parseDateOnlyToISO 
} from "@/lib/date-utils";
import { motion } from "framer-motion";

interface ObjectiveFormData {
  title: string;
  description: string;
  objective_type: ObjectiveType;
  energy_requirement: EnergyLevel;
  priority_score: number;
  complexity_score: number;
  parent_id: string | null;
  start_time: string;
  end_time: string;
  start_date: string;
  due_date: string;
  location?: string;
  is_recurring: boolean;
  status: ObjectiveStatus;
  completion_percentage: number;
  recurring?: {
    frequency: "daily" | "weekly" | "monthly";
    interval: number;
    days_of_week: number[];
    time_of_day: string;
    end_date: string;
  };
}

interface ObjectiveFormProps {
  initialData?: Partial<Objective | Task>;
  onSubmit: (data: any) => Promise<void>;
  onCancel: () => void;
  parentId?: string;
  showTimeFields?: boolean;
  defaultToTask?: boolean;
  submitLabel?: string;
}

export function ObjectiveForm({
  initialData,
  onSubmit,
  onCancel,
  parentId,
  showTimeFields = true,
  defaultToTask = true,
  submitLabel = "Create",
}: ObjectiveFormProps) {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<ObjectiveFormData>(() => {
    const defaultType = defaultToTask ? ObjectiveType.TASK : ObjectiveType.MAIN_OBJECTIVE;
    
    if (initialData) {
      const data = initialData as any;
      const objRecurring = data.recurring;
      
      console.log("🔧 Form initialization - initialData:", {
        id: data.id,
        type: data.objective_type,
        start_time: data.start_time,
        end_time: data.end_time,
        start_date: data.start_date,
        due_date: data.due_date,
        hasStartTime: !!data.start_time,
        hasEndTime: !!data.end_time,
      });
      
      return {
        title: data.title || "",
        description: data.description || "",
        objective_type: data.objective_type || defaultType,
        energy_requirement: data.energy_requirement || EnergyLevel.MEDIUM,
        priority_score: data.priority_score ?? 0.5,
        complexity_score: data.complexity_score ?? 0.5,
        parent_id: data.parent_id || parentId || null,
        start_time: data.start_time 
          ? formatDateTimeLocal(new Date(data.start_time)) 
          : (data.start_date && data.objective_type === ObjectiveType.TASK)
            ? formatDateTimeLocal(new Date(data.start_date))
            : "",
        end_time: data.end_time 
          ? formatDateTimeLocal(new Date(data.end_time)) 
          : (data.due_date && data.objective_type === ObjectiveType.TASK)
            ? formatDateTimeLocal(new Date(data.due_date))
            : "",
        start_date: data.start_date ? formatDateOnly(new Date(data.start_date)) : "",
        due_date: data.due_date ? formatDateOnly(new Date(data.due_date)) : "",
        location: data.location || "",
        is_recurring: !!objRecurring,
        status: data.status || ObjectiveStatus.NOT_STARTED,
        completion_percentage: data.completion_percentage || 0,
        recurring: objRecurring ? {
          frequency: objRecurring.frequency || "daily",
          interval: objRecurring.interval || 1,
          days_of_week: objRecurring.days_of_week || [],
          time_of_day: objRecurring.time_of_day || "",
          end_date: objRecurring.end_date || "",
        } : {
          frequency: "daily",
          interval: 1,
          days_of_week: [],
          time_of_day: "",
          end_date: "",
        },
      };
    }
    
    return {
      title: "",
      description: "",
      objective_type: defaultType,
      energy_requirement: EnergyLevel.MEDIUM,
      priority_score: 0.5,
      complexity_score: 0.5,
      parent_id: parentId || null,
      start_time: "",
      end_time: "",
      start_date: "",
      due_date: "",
      location: "",
      is_recurring: false,
      status: ObjectiveStatus.NOT_STARTED,
      completion_percentage: 0,
      recurring: {
        frequency: "daily",
        interval: 1,
        days_of_week: [],
        time_of_day: "",
        end_date: "",
      },
    };
  });

  // Update form data when initialData changes
  useEffect(() => {
    if (initialData) {
      const data = initialData as any;
      const objRecurring = data.recurring;
      
      console.log("🔄 Form update - initialData changed:", {
        id: data.id,
        type: data.objective_type,
        start_time: data.start_time,
        end_time: data.end_time,
        hasStartTime: !!data.start_time,
        hasEndTime: !!data.end_time,
      });
      
      setFormData({
        title: data.title || "",
        description: data.description || "",
        objective_type: data.objective_type || (defaultToTask ? ObjectiveType.TASK : ObjectiveType.MAIN_OBJECTIVE),
        energy_requirement: data.energy_requirement || EnergyLevel.MEDIUM,
        priority_score: data.priority_score ?? 0.5,
        complexity_score: data.complexity_score ?? 0.5,
        parent_id: data.parent_id || parentId || null,
        start_time: data.start_time 
          ? formatDateTimeLocal(new Date(data.start_time)) 
          : (data.start_date && data.objective_type === ObjectiveType.TASK)
            ? formatDateTimeLocal(new Date(data.start_date))
            : "",
        end_time: data.end_time 
          ? formatDateTimeLocal(new Date(data.end_time)) 
          : (data.due_date && data.objective_type === ObjectiveType.TASK)
            ? formatDateTimeLocal(new Date(data.due_date))
            : "",
        start_date: data.start_date ? formatDateOnly(new Date(data.start_date)) : "",
        due_date: data.due_date ? formatDateOnly(new Date(data.due_date)) : "",
        location: data.location || "",
        is_recurring: !!objRecurring,
        status: data.status || ObjectiveStatus.NOT_STARTED,
        completion_percentage: data.completion_percentage || 0,
        recurring: objRecurring ? {
          frequency: objRecurring.frequency || "daily",
          interval: objRecurring.interval || 1,
          days_of_week: objRecurring.days_of_week || [],
          time_of_day: objRecurring.time_of_day || "",
          end_date: objRecurring.end_date || "",
        } : {
          frequency: "daily",
          interval: 1,
          days_of_week: [],
          time_of_day: "",
          end_date: "",
        },
      });
    }
  }, [initialData, defaultToTask, parentId]);

  // Load parent objectives
  useEffect(() => {
    objectivesApi.list()
      .then(({ data }) => {
        setObjectives(data.filter((obj: Objective) => 
          obj.objective_type !== ObjectiveType.TASK
        ));
      })
      .catch((err) => {
        console.error("Failed to load objectives:", err);
      });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }

      // For tasks, time is required
      if (formData.objective_type === ObjectiveType.TASK) {
        if (showTimeFields && (!formData.start_time || !formData.end_time)) {
          throw new Error("Start time and end time are required for tasks");
        }
      }

      // Prepare submission data
      const submitData: any = {
        title: formData.title,
        description: formData.description,
        objective_type: formData.objective_type,
        energy_requirement: formData.energy_requirement,
        priority_score: formData.priority_score,
        complexity_score: formData.complexity_score,
        parent_id: formData.parent_id || undefined,
        status: formData.status,
        completion_percentage: formData.completion_percentage,
      };

      // Handle dates and times based on type and availability
      if (formData.objective_type === ObjectiveType.TASK && showTimeFields) {
        if (formData.start_time && formData.end_time) {
          // Use datetime for tasks
          submitData.start_time = parseLocalDateTimeToISO(formData.start_time);
          submitData.end_time = parseLocalDateTimeToISO(formData.end_time);
          submitData.start_date = submitData.start_time;
          submitData.due_date = submitData.end_time;
        } else if (formData.start_date && formData.due_date) {
          // Fallback to date-only
          submitData.start_date = parseDateOnlyToISO(formData.start_date);
          submitData.due_date = parseDateOnlyToISO(formData.due_date, true);
        }
        
        if (formData.location) {
          submitData.location = formData.location;
        }
      } else {
        // For non-task objectives
        if (formData.start_date) {
          submitData.start_date = parseDateOnlyToISO(formData.start_date);
        }
        if (formData.due_date) {
          submitData.due_date = parseDateOnlyToISO(formData.due_date, true);
        }
      }

      // Add recurrence data if enabled
      if (formData.is_recurring && formData.recurring) {
        submitData.recurring = {
          frequency: formData.recurring.frequency,
          interval: formData.recurring.interval,
          days_of_week: formData.recurring.days_of_week,
          time_of_day: formData.start_time ? 
            new Date(parseLocalDateTimeToISO(formData.start_time)).toTimeString().slice(0, 5) : 
            undefined,
          end_date: formData.recurring.end_date || undefined,
        };
      }

      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || "An error occurred");
      setLoading(false);
    }
  };

  const isTask = formData.objective_type === ObjectiveType.TASK;
  const showDateTimeFields = isTask && showTimeFields;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      {error && (
        <div className="p-3 text-sm text-red-600 bg-red-50 dark:bg-red-900/20 rounded-lg">
          {error}
        </div>
      )}

      {/* Title */}
      <div>
        <Label htmlFor="title">Title *</Label>
        <Input
          id="title"
          value={formData.title}
          onChange={(e) => setFormData({ ...formData, title: e.target.value })}
          placeholder="Enter objective title"
          required
        />
      </div>

      {/* Description */}
      <div>
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          value={formData.description}
          onChange={(e) => setFormData({ ...formData, description: e.target.value })}
          placeholder="Describe your objective"
          rows={3}
        />
      </div>

      {/* Parent Objective */}
      <div>
        <Label htmlFor="parent">Parent Objective (Optional)</Label>
        <Select
          value={formData.parent_id || "none"}
          onValueChange={(value) =>
            setFormData({ ...formData, parent_id: value === "none" ? null : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select parent objective" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No Parent (Root Level)</SelectItem>
            {objectives.map((obj) => (
              <SelectItem key={obj.id} value={obj.id}>
                {obj.title} ({obj.objective_type.replace("_", " ")})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Objective Type */}
      <div>
        <Label htmlFor="type">Objective Type</Label>
        <Select
          value={formData.objective_type}
          onValueChange={(value: ObjectiveType) =>
            setFormData({ ...formData, objective_type: value })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {!parentId && (
              <SelectItem value={ObjectiveType.MAIN_OBJECTIVE}>Main Objective</SelectItem>
            )}
            <SelectItem value={ObjectiveType.SUB_OBJECTIVE}>Sub Objective</SelectItem>
            <SelectItem value={ObjectiveType.TASK}>Task</SelectItem>
          </SelectContent>
        </Select>
        <p className="text-xs text-muted-foreground mt-1">
          {isTask 
            ? "Tasks are specific actions with defined time periods" 
            : "Objectives are goals that can contain sub-objectives and tasks"}
        </p>
      </div>

      {/* Date/Time Fields */}
      {showDateTimeFields ? (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              Start Time *
            </Label>
            <Input
              type="datetime-local"
              value={formData.start_time}
              onChange={(e) => setFormData({ ...formData, start_time: e.target.value })}
              required
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              End Time *
            </Label>
            <Input
              type="datetime-local"
              value={formData.end_time}
              onChange={(e) => setFormData({ ...formData, end_time: e.target.value })}
              required
            />
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Start Date
            </Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
            />
          </div>
          <div>
            <Label className="flex items-center gap-2">
              <CalendarIcon className="w-4 h-4" />
              Due Date
            </Label>
            <Input
              type="date"
              value={formData.due_date}
              onChange={(e) => setFormData({ ...formData, due_date: e.target.value })}
            />
          </div>
        </div>
      )}

      {/* Energy and Priority */}
      <div className="grid grid-cols-3 gap-4">
        <div>
          <Label>Energy Level</Label>
          <Select
            value={formData.energy_requirement}
            onValueChange={(value: EnergyLevel) =>
              setFormData({ ...formData, energy_requirement: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={EnergyLevel.LOW}>
                <div className="flex items-center gap-2">
                  <BatteryLow className="w-4 h-4 text-green-500" />
                  Low
                </div>
              </SelectItem>
              <SelectItem value={EnergyLevel.MEDIUM}>
                <div className="flex items-center gap-2">
                  <Battery className="w-4 h-4 text-blue-500" />
                  Medium
                </div>
              </SelectItem>
              <SelectItem value={EnergyLevel.HIGH}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-yellow-500" />
                  High
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <div>
          <Label>Priority ({Math.round(formData.priority_score * 100)}%)</Label>
          <Input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={formData.priority_score}
            onChange={(e) => 
              setFormData({ ...formData, priority_score: parseFloat(e.target.value) })
            }
          />
        </div>

        <div>
          <Label>Complexity ({Math.round(formData.complexity_score * 100)}%)</Label>
          <Input
            type="range"
            min="0"
            max="1"
            step="0.1"
            value={formData.complexity_score}
            onChange={(e) => 
              setFormData({ ...formData, complexity_score: parseFloat(e.target.value) })
            }
          />
        </div>
      </div>

      {/* Status and Progress */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label>Status</Label>
          <Select
            value={formData.status}
            onValueChange={(value: ObjectiveStatus) =>
              setFormData({ ...formData, status: value })
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={ObjectiveStatus.NOT_STARTED}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-500" />
                  Not Started
                </div>
              </SelectItem>
              <SelectItem value={ObjectiveStatus.IN_PROGRESS}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-blue-500" />
                  In Progress
                </div>
              </SelectItem>
              <SelectItem value={ObjectiveStatus.COMPLETED}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-green-500" />
                  Completed
                </div>
              </SelectItem>
              <SelectItem value={ObjectiveStatus.BLOCKED}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-red-500" />
                  Blocked
                </div>
              </SelectItem>
              <SelectItem value={ObjectiveStatus.CANCELLED}>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-gray-400" />
                  Cancelled
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Completion ({formData.completion_percentage}%)</Label>
          <Input
            type="range"
            min="0"
            max="100"
            step="5"
            value={formData.completion_percentage}
            onChange={(e) => {
              const percentage = parseInt(e.target.value);
              setFormData({ 
                ...formData, 
                completion_percentage: percentage,
                // Auto-update status based on completion
                status: percentage === 100 ? ObjectiveStatus.COMPLETED : 
                        percentage > 0 ? ObjectiveStatus.IN_PROGRESS : 
                        formData.status
              });
            }}
          />
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${formData.completion_percentage}%` }}
              className="h-full bg-primary transition-all duration-300"
            />
          </div>
        </div>
      </div>

      {/* Task-specific fields */}
      {isTask && (
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location || ""}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Where will this task take place?"
          />
        </div>
      )}

      {/* Recurrence (for tasks) */}
      {isTask && showTimeFields && (
        <div className="space-y-4 border-t pt-4">
          <div className="flex items-center justify-between">
            <div className="space-y-0.5">
              <Label htmlFor="recurring">Repeat Task</Label>
              <p className="text-xs text-muted-foreground">
                Create recurring tasks with custom patterns
              </p>
            </div>
            <Switch
              id="recurring"
              checked={formData.is_recurring}
              onCheckedChange={(checked) =>
                setFormData({ ...formData, is_recurring: checked })
              }
            />
          </div>
          
          {formData.is_recurring && (
            <div className="space-y-4 animate-in fade-in-0 slide-in-from-top-2">
              <div>
                <Label>Frequency</Label>
                <Select
                  value={formData.recurring!.frequency}
                  onValueChange={(value: "daily" | "weekly" | "monthly") =>
                    setFormData({
                      ...formData,
                      recurring: { ...formData.recurring!, frequency: value }
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="daily">Daily</SelectItem>
                    <SelectItem value="weekly">Weekly</SelectItem>
                    <SelectItem value="monthly">Monthly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              {formData.recurring!.frequency === "weekly" && (
                <div>
                  <Label className="mb-2">On these days</Label>
                  <div className="grid grid-cols-7 gap-2">
                    {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                      <label
                        key={day}
                        className="flex flex-col items-center space-y-1 cursor-pointer"
                      >
                        <Checkbox
                          checked={formData.recurring!.days_of_week.includes(index)}
                          onCheckedChange={(checked) => {
                            const days = [...formData.recurring!.days_of_week];
                            if (checked) {
                              days.push(index);
                            } else {
                              const idx = days.indexOf(index);
                              if (idx > -1) days.splice(idx, 1);
                            }
                            setFormData({
                              ...formData,
                              recurring: { ...formData.recurring!, days_of_week: days }
                            });
                          }}
                        />
                        <span className="text-xs">{day}</span>
                      </label>
                    ))}
                  </div>
                </div>
              )}
              
              <div>
                <Label htmlFor="end_date">End Date (Optional)</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.recurring!.end_date}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurring: { ...formData.recurring!, end_date: e.target.value }
                    })
                  }
                  placeholder="When should this recurrence end?"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Leave empty to repeat indefinitely
                </p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Form Actions */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={loading}
        >
          Cancel
        </Button>
        <Button 
          type="submit"
          className="flex-1"
          disabled={loading}
        >
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
} 