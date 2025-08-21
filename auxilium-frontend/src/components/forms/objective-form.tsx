"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Range } from "@/components/ui/range";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Clock, CalendarIcon, Battery, BatteryLow, Zap, Trash2, CheckCircle } from "lucide-react";
import { Objective, Task, ObjectiveType, ObjectiveStatus, EnergyLevel, Calendar } from "@/types";
import { objectivesApi } from "@/lib/api";
import { useCalendars } from "@/hooks/use-calendars";
import { 
  formatDateTimeLocal, 
  formatDateOnly, 
  parseLocalDateTimeToISO, 
  parseDateOnlyToISO 
} from "@/lib/date-utils";
import { motion } from "framer-motion";
import toast from "react-hot-toast";

interface ObjectiveFormData {
  title: string;
  description: string;
  objective_type: ObjectiveType;
  energy_requirement: EnergyLevel;
  priority_score: number;
  complexity_score: number;
  parent_id: string | null;
  calendar_id: string | null;  // Calendar assignment
  start_date: string;  // Contains date for all-day events
  due_date: string;    // Contains date for all-day events
  start_time: string;  // Contains datetime for timed events
  end_time: string;    // Contains datetime for timed events
  all_day: boolean;
  is_timed: boolean;   // Whether this objective is time-bound
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
  onDelete?: (id: string) => Promise<void>;
  parentId?: string;
  showTimeFields?: boolean;
  defaultToTask?: boolean;
  submitLabel?: string;
}

export function ObjectiveForm({
  initialData,
  onSubmit,
  onCancel,
  onDelete,
  parentId,
  showTimeFields = true,
  defaultToTask = true,
  submitLabel = "Create",
}: ObjectiveFormProps) {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [completing, setCompleting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Calendar management
  const { calendars, fetchCalendars, getDefaultCalendar } = useCalendars();
  
  const [formData, setFormData] = useState<ObjectiveFormData>(() => {
    const defaultType = defaultToTask ? ObjectiveType.TASK : ObjectiveType.MAIN_OBJECTIVE;
    
    if (initialData) {
      const data = initialData as any;
      const objRecurring = data.recurring;
      
      console.log("🔧 Form initialization - initialData:", {
        id: data.id,
        type: data.objective_type,
        start_date: data.start_date,
        due_date: data.due_date,
        all_day: data.all_day,
      });
      
      // Handle date/time fields based on all_day flag
      let startTime = "";
      let endTime = "";
      let startDate = "";
      let dueDate = "";
      
      if (data.all_day) {
        // For all-day events, use date-only fields
        startDate = data.start_date ? formatDateOnly(new Date(data.start_date)) : "";
        dueDate = data.due_date ? formatDateOnly(new Date(data.due_date)) : "";
      } else {
        // For timed events, convert stored dates to datetime-local format
        startTime = data.start_date ? formatDateTimeLocal(new Date(data.start_date)) : "";
        endTime = data.due_date ? formatDateTimeLocal(new Date(data.due_date)) : "";
      }
      
      // Normalize enum-like string fields to lowercase to match our TS enums
      // Also map legacy 'pending' -> 'not_started' to avoid blank Select value
      const rawStatusInit = typeof data.status === 'string'
        ? (data.status as string).toLowerCase()
        : (data.status || ObjectiveStatus.NOT_STARTED);
      const normalizedStatus: ObjectiveStatus = (rawStatusInit === 'pending'
        ? ObjectiveStatus.NOT_STARTED
        : (rawStatusInit as ObjectiveStatus));
      const normalizedEnergy: EnergyLevel = typeof data.energy_requirement === 'string'
        ? (data.energy_requirement as string).toLowerCase() as EnergyLevel
        : (data.energy_requirement || EnergyLevel.MEDIUM);
      const normalizedType: ObjectiveType = typeof data.objective_type === 'string'
        ? (data.objective_type as string).toLowerCase() as ObjectiveType
        : (data.objective_type || defaultType);

      return {
        title: data.title || "",
        description: data.description || "",
        objective_type: normalizedType,
        energy_requirement: normalizedEnergy,
        priority_score: data.priority_score ?? 0.5,
        complexity_score: data.complexity_score ?? 0.5,
        parent_id: data.parent_id || null,
        calendar_id: data.calendar_id || null,
        start_date: startDate,
        due_date: dueDate,
        start_time: startTime,
        end_time: endTime,
        all_day: data.all_day ?? false,
        is_timed: data.is_timed ?? true,
        location: data.location || "",
        is_recurring: !!(data.is_recurring || objRecurring),
        status: normalizedStatus,
        completion_percentage: data.completion_percentage || 0,
        recurring: objRecurring ? {
          frequency: objRecurring.frequency || "daily",
          interval: objRecurring.interval || 1,
          days_of_week: objRecurring.days_of_week || [],
          time_of_day: objRecurring.time_of_day || "09:00",
          end_date: objRecurring.end_date || "",
        } : {
          frequency: "daily",
          interval: 1,
          days_of_week: [],
          time_of_day: "09:00",
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
      parent_id: null,
      calendar_id: null,
      start_date: "",
      due_date: "",
      start_time: "",
      end_time: "",
      all_day: false,
      is_timed: true,
      location: "",
      is_recurring: false,
      status: ObjectiveStatus.NOT_STARTED,
      completion_percentage: 0,
      recurring: {
        frequency: "daily",
        interval: 1,
        days_of_week: [],
        time_of_day: "09:00",
        end_date: "",
      },
    };
  });

  // Update form data when initialData changes
  useEffect(() => {
    console.log("🔧 ObjectiveForm - useEffect triggered with initialData:", initialData);
    
    if (initialData) {
      const data = initialData as any;
      const objRecurring = data.recurring;
      
      console.log("🔄 Form data update - initialData changed:", {
        id: data.id,
        type: data.objective_type,
        start_date: data.start_date,
        due_date: data.due_date,
        start_time: data.start_time,
        end_time: data.end_time,
        all_day: data.all_day,
      });
      
      // Handle date/time fields based on all_day flag
      let startTime = "";
      let endTime = "";
      let startDate = "";
      let dueDate = "";
      
      if (data.all_day) {
        // For all-day events, use date-only fields
        startDate = data.start_date ? formatDateOnly(new Date(data.start_date)) : "";
        dueDate = data.due_date ? formatDateOnly(new Date(data.due_date)) : "";
      } else {
        // For timed events, prioritize start_time/end_time fields from modal, then fall back to converting dates
        startTime = data.start_time || (data.start_date ? formatDateTimeLocal(new Date(data.start_date)) : "");
        endTime = data.end_time || (data.due_date ? formatDateTimeLocal(new Date(data.due_date)) : "");
      }
      
      // Normalize enum-like string fields to lowercase to match our TS enums
      // Handle legacy/blank status values: map '' or undefined -> not_started; 'pending' -> not_started
      const rawStatusInitStr = typeof data.status === 'string' ? (data.status as string).trim().toLowerCase() : '';
      const normalizedStatus: ObjectiveStatus = (rawStatusInitStr === ''
        ? ObjectiveStatus.NOT_STARTED
        : (rawStatusInitStr === 'pending' ? ObjectiveStatus.NOT_STARTED : (rawStatusInitStr as ObjectiveStatus)));
      const normalizedEnergy: EnergyLevel = typeof data.energy_requirement === 'string'
        ? (data.energy_requirement as string).toLowerCase() as EnergyLevel
        : (data.energy_requirement || EnergyLevel.MEDIUM);
      const normalizedType: ObjectiveType = typeof data.objective_type === 'string'
        ? (data.objective_type as string).toLowerCase() as ObjectiveType
        : (data.objective_type || (defaultToTask ? ObjectiveType.TASK : ObjectiveType.MAIN_OBJECTIVE));

      setFormData({
        title: data.title || "",
        description: data.description || "",
        objective_type: normalizedType,
        energy_requirement: normalizedEnergy,
        priority_score: data.priority_score ?? 0.5,
        complexity_score: data.complexity_score ?? 0.5,
        parent_id: data.parent_id || null,
        calendar_id: data.calendar_id || null,
        start_date: startDate,
        due_date: dueDate,
        start_time: startTime,
        end_time: endTime,
        all_day: data.all_day ?? false,
        is_timed: data.is_timed ?? true,
        location: data.location || "",
        is_recurring: !!(data.is_recurring || objRecurring),
        status: normalizedStatus,
        completion_percentage: data.completion_percentage || 0,
        recurring: objRecurring ? {
          frequency: objRecurring.frequency || "daily",
          interval: objRecurring.interval || 1,
          days_of_week: objRecurring.days_of_week || [],
          time_of_day: objRecurring.time_of_day || "09:00",
          end_date: objRecurring.end_date || "",
        } : {
          frequency: "daily",
          interval: 1,
          days_of_week: [],
          time_of_day: "09:00",
          end_date: "",
        },
      });
    }
  }, [initialData, defaultToTask]);

  // Load parent objectives and calendars
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
    
    // Load calendars
    fetchCalendars();
  }, [fetchCalendars]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // Validate required fields
      if (!formData.title.trim()) {
        throw new Error("Title is required");
      }

      // For tasks, time is required only if it's timed and not all-day
      if (formData.objective_type === ObjectiveType.TASK && formData.is_timed) {
        if (showTimeFields && !formData.all_day && (!formData.start_time || !formData.end_time)) {
          throw new Error("Start time and end time are required for timed tasks");
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
        calendar_id: formData.calendar_id || undefined,
        status: formData.status,
        completion_percentage: formData.completion_percentage,
        all_day: formData.all_day,  // Explicit all-day flag
        is_timed: formData.is_timed,  // Whether this objective is time-bound
      };

      // Handle date/time fields - only for timed objectives
      if (formData.is_timed) {
        if (formData.all_day) {
          // All-day event - use date-only format with midnight times
          if (formData.start_date) {
            submitData.start_date = parseDateOnlyToISO(formData.start_date);
          }
          if (formData.due_date) {
            submitData.due_date = parseDateOnlyToISO(formData.due_date, true);
          }
        } else if (showTimeFields && (formData.start_time || formData.end_time)) {
          // Timed event - use datetime format
          if (formData.start_time) {
            submitData.start_date = parseLocalDateTimeToISO(formData.start_time);
          }
          if (formData.end_time) {
            submitData.due_date = parseLocalDateTimeToISO(formData.end_time);
          }
        } else {
          // Fallback to date-only for timed events without specific times
          if (formData.start_date) {
            submitData.start_date = parseDateOnlyToISO(formData.start_date);
          }
          if (formData.due_date) {
            submitData.due_date = parseDateOnlyToISO(formData.due_date, true);
          }
        }
      }
      // For non-timed objectives, we explicitly don't send any date/time data
      
      // Add task-specific fields if it's a task
      if (formData.objective_type === ObjectiveType.TASK && formData.location) {
        submitData.location = formData.location;
      }

      // Handle recurrence data
      if (formData.is_recurring && formData.recurring) {
        submitData.recurring = {
          frequency: formData.recurring.frequency,
          interval: formData.recurring.interval,
          days_of_week: formData.recurring.days_of_week,
          time_of_day: formData.start_time ? 
            new Date(parseLocalDateTimeToISO(formData.start_time)).toTimeString().slice(0, 5) : 
            formData.recurring.time_of_day || "09:00",
          end_date: formData.recurring.end_date || undefined,
        };
      } else {
        // Explicitly set recurring to null when not recurring to clear existing data
        submitData.recurring = null;
      }

      console.log("📝 Submitting data:", submitData);

      await onSubmit(submitData);
    } catch (err: any) {
      setError(err.message || "An error occurred");
    } finally {
      // FIXED: Always reset loading state, whether success or failure
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!initialData?.id || !onDelete) return;
    
    const confirmed = window.confirm("Are you sure you want to delete this objective?");
    if (!confirmed) return;

    setDeleting(true);
    try {
      await onDelete(initialData.id);
    } catch (err: any) {
      setError(err.message || "Failed to delete objective");
    }
    setDeleting(false);
  };

  const handleComplete = async () => {
    if (!initialData?.id || formData.status === ObjectiveStatus.COMPLETED) return;
    
    setCompleting(true);
    try {
      const result = await objectivesApi.complete(initialData.id);
      const gamificationResult = result.gamification;
      
      // Update form data to reflect completion
      setFormData(prev => ({
        ...prev,
        status: ObjectiveStatus.COMPLETED,
        completion_percentage: 100
      }));
      
      // Show success toast with XP information
      const totalXp = gamificationResult?.total_xp_earned || 0;
      const celebrationMessage = gamificationResult?.celebration || `Objective completed! +${totalXp} XP earned!`;
      
      toast.success(celebrationMessage, { duration: 4000 });
      
      // Show XP breakdown if available
      if (gamificationResult?.xp_breakdown) {
        const breakdown = gamificationResult.xp_breakdown;
        const details: string[] = [];
        if (breakdown.complexity_bonus > 0) details.push(`Complexity: +${breakdown.complexity_bonus}`);
        if (breakdown.priority_bonus > 0) details.push(`Priority: +${breakdown.priority_bonus}`);
        if (breakdown.type_bonus > 0) details.push(`Type: +${breakdown.type_bonus}`);
        if (breakdown.timeliness_bonus > 0) details.push(`Early: +${breakdown.timeliness_bonus}`);
        
        if (details.length > 0) {
          setTimeout(() => {
            toast.success(`💡 XP Breakdown: ${details.join(', ')}`, { 
              duration: 5000,
              icon: '📊'
            });
          }, 2000);
        }
      }
      
      // If leveled up, show level up message
      if (gamificationResult?.level_info?.leveled_up) {
        setTimeout(() => {
          toast.success(`🎆 LEVEL UP! You reached level ${gamificationResult.level_info.current_level}!`, { 
            duration: 6000,
            icon: '🎉'
          });
        }, 3000);
      }
      
    } catch (err: any) {
      setError(err.message || "Failed to complete objective");
      toast.error("Failed to complete objective");
    } finally {
      setCompleting(false);
    }
  };

  const handleAllDayToggle = (checked: boolean) => {
    setFormData(prev => {
      const newData = { ...prev, all_day: checked };
      
      if (checked) {
        // Switching to all-day: convert datetime fields to date fields
        if (prev.start_time) {
          newData.start_date = formatDateOnly(new Date(prev.start_time));
          newData.start_time = "";
        }
        if (prev.end_time) {
          newData.due_date = formatDateOnly(new Date(prev.end_time));
          newData.end_time = "";
        }
      } else {
        // Switching to timed: convert date fields to datetime fields
        if (prev.start_date) {
          const startDateTime = new Date(prev.start_date);
          startDateTime.setHours(9, 0, 0, 0); // Default to 9:00 AM
          newData.start_time = formatDateTimeLocal(startDateTime);
          newData.start_date = "";
        }
        if (prev.due_date) {
          const endDateTime = new Date(prev.due_date);
          endDateTime.setHours(17, 0, 0, 0); // Default to 5:00 PM
          newData.end_time = formatDateTimeLocal(endDateTime);
          newData.due_date = "";
        }
      }
      
      return newData;
    });
  };

  const isEdit = !!initialData?.id;
  const showDateTimeFields = showTimeFields && formData.objective_type === ObjectiveType.TASK;

  return (
    <form onSubmit={handleSubmit} className="space-y-4 p-6">
      {/* Error Display */}
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

      {/* Type */}
      <div>
        <Label>Type</Label>
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
            <SelectItem value={ObjectiveType.MAIN_OBJECTIVE}>Main Objective</SelectItem>
            <SelectItem value={ObjectiveType.SUB_OBJECTIVE}>Sub-Objective</SelectItem>
            <SelectItem value={ObjectiveType.TASK}>Task</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Parent Objective */}
      {formData.objective_type !== ObjectiveType.MAIN_OBJECTIVE && (
        <div>
          <Label htmlFor="parent">Parent Objective</Label>
          <Select
            value={formData.parent_id || "none"}
            onValueChange={(value) => 
              setFormData({ ...formData, parent_id: value === "none" ? null : value })
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a parent objective (optional)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">No parent</SelectItem>
              {objectives.map((obj) => (
                <SelectItem key={obj.id} value={obj.id}>
                  {obj.title}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Calendar Selection */}
      <div>
        <Label htmlFor="calendar">Calendar</Label>
        <Select
          value={formData.calendar_id || "none"}
          onValueChange={(value) => 
            setFormData({ ...formData, calendar_id: value === "none" ? null : value })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Select a calendar (optional)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">No calendar</SelectItem>
            {calendars.map((calendar) => (
              <SelectItem key={calendar.id} value={calendar.id}>
                <div className="flex items-center space-x-2">
                  <div
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: calendar.color }}
                  />
                  <span>{calendar.name}</span>
                  {calendar.is_default && (
                    <span className="text-xs text-muted-foreground">(Default)</span>
                  )}
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Time-bound Toggle */}
      <div className="flex items-center space-x-2">
        <Switch
          id="is-timed"
          checked={formData.is_timed}
          onCheckedChange={(checked) => setFormData({ ...formData, is_timed: checked })}
        />
        <Label htmlFor="is-timed">Time-bound objective</Label>
      </div>

      {/* All-Day Toggle */}
      {formData.is_timed && (
        <div className="flex items-center space-x-2">
          <Switch
            id="all-day"
            checked={formData.all_day}
            onCheckedChange={handleAllDayToggle}
          />
          <Label htmlFor="all-day">All-day event</Label>
        </div>
      )}

      {/* Date/Time Fields - Only show for timed objectives */}
      {formData.is_timed && (
        <>
          {showDateTimeFields && !formData.all_day ? (
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
        </>
      )}

      {/* Location (Tasks only) */}
      {formData.objective_type === ObjectiveType.TASK && (
        <div>
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData({ ...formData, location: e.target.value })}
            placeholder="Enter location (optional)"
          />
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
                  <Battery className="w-4 h-4 text-yellow-500" />
                  Medium
                </div>
              </SelectItem>
              <SelectItem value={EnergyLevel.HIGH}>
                <div className="flex items-center gap-2">
                  <Zap className="w-4 h-4 text-red-500" />
                  High
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label>Priority ({Math.round(formData.priority_score * 100)}%)</Label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={formData.priority_score}
            onChange={(e) => 
              setFormData({ ...formData, priority_score: parseFloat(e.target.value) })
            }
            className="w-full"
          />
        </div>

        <div>
          <Label>Complexity ({Math.round(formData.complexity_score * 100)}%)</Label>
          <input
            type="range"
            min={0}
            max={1}
            step={0.1}
            value={formData.complexity_score}
            onChange={(e) => 
              setFormData({ ...formData, complexity_score: parseFloat(e.target.value) })
            }
            className="w-full"
          />
        </div>
      </div>

      {/* Status (edit mode only) */}
      {isEdit && (
        <div className="space-y-4">
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
                  <SelectItem value={ObjectiveStatus.NOT_STARTED}>Not Started</SelectItem>
                  <SelectItem value={ObjectiveStatus.IN_PROGRESS}>In Progress</SelectItem>
                  <SelectItem value={ObjectiveStatus.BLOCKED}>Blocked</SelectItem>
                  <SelectItem value={ObjectiveStatus.COMPLETED}>Completed</SelectItem>
                  <SelectItem value={ObjectiveStatus.CANCELLED}>Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label>Completion ({formData.completion_percentage}%)</Label>
              <input
                type="range"
                min={0}
                max={100}
                step={5}
                value={formData.completion_percentage}
                onChange={(e) => {
                  const percentage = parseInt(e.target.value);
                  setFormData({ 
                    ...formData, 
                    completion_percentage: percentage
                  });
                }}
                className="w-full"
              />
            </div>
          </div>

          {/* Complete Button */}
          {formData.status !== ObjectiveStatus.COMPLETED && (
            <div className="flex justify-center">
              <Button
                type="button"
                onClick={handleComplete}
                disabled={completing || loading}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {completing ? "Completing..." : "Complete & Earn XP"}
              </Button>
            </div>
          )}

          {formData.status === ObjectiveStatus.COMPLETED && (
            <div className="flex justify-center">
              <div className="bg-green-100 dark:bg-green-900/20 text-green-800 dark:text-green-400 px-4 py-2 rounded-lg flex items-center gap-2">
                <CheckCircle className="w-4 h-4" />
                ✨ Completed
              </div>
            </div>
          )}
        </div>
      )}

      {/* Recurring */}
      <div className="space-y-4">
        <div className="flex items-center space-x-2">
          <Switch
            id="recurring"
            checked={formData.is_recurring}
            onCheckedChange={(checked) => setFormData({ ...formData, is_recurring: checked })}
          />
          <Label htmlFor="recurring">Make this recurring</Label>
        </div>

        {formData.is_recurring && (
          <div className="space-y-4 pl-4 border-l-2 border-primary/20">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Frequency</Label>
                <Select
                  value={formData.recurring?.frequency}
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

              <div>
                <Label>Every</Label>
                <Input
                  type="number"
                  min="1"
                  value={formData.recurring?.interval}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      recurring: { ...formData.recurring!, interval: parseInt(e.target.value) || 1 }
                    })
                  }
                />
              </div>
            </div>

            {formData.recurring?.frequency === "weekly" && (
              <div>
                <Label>Days of Week</Label>
                <div className="flex flex-wrap gap-2 mt-2">
                  {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((day, index) => (
                    <div key={day} className="flex items-center space-x-2 checkbox-container">
                      <Checkbox
                        id={`day-${index}`}
                        checked={formData.recurring?.days_of_week.includes(index)}
                        onCheckedChange={(checked) => {
                          const daysOfWeek = formData.recurring?.days_of_week || [];
                          const newDays = checked
                            ? [...daysOfWeek, index]
                            : daysOfWeek.filter(d => d !== index);
                          setFormData({
                            ...formData,
                            recurring: { ...formData.recurring!, days_of_week: newDays }
                          });
                        }}
                      />
                      <Label htmlFor={`day-${index}`} className="text-sm cursor-pointer">
                        {day}
                      </Label>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <Label>Time of Day</Label>
              <Input
                type="time"
                value={formData.recurring?.time_of_day}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recurring: { ...formData.recurring!, time_of_day: e.target.value }
                  })
                }
              />
            </div>

            <div>
              <Label>End Date (optional)</Label>
              <Input
                type="date"
                value={formData.recurring?.end_date}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    recurring: { ...formData.recurring!, end_date: e.target.value }
                  })
                }
              />
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          className="flex-1"
          disabled={loading || deleting}
        >
          Cancel
        </Button>
        
        {isEdit && onDelete && (
          <Button
            type="button"
            variant="destructive"
            onClick={handleDelete}
            disabled={loading || deleting}
            className="flex items-center gap-2"
          >
            <Trash2 className="w-4 h-4" />
            {deleting ? "Deleting..." : "Delete"}
          </Button>
        )}
        
        <Button 
          type="submit"
          className="flex-1"
          disabled={loading || deleting}
        >
          {loading ? "Saving..." : submitLabel}
        </Button>
      </div>
    </form>
  );
} 