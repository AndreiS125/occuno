"use client";

import { useCallback, useEffect, useMemo, useState, useRef } from "react";
import { formatDateTimeLocal, parseLocalDateTimeToISO, expandRecurringEvent } from "@/lib/date-utils";
import {
  Calendar,
  dateFnsLocalizer,
  View,
  SlotInfo,
  EventPropGetter,
  Event as RBCEvent,
} from "react-big-calendar";
import withDragAndDrop, {
  withDragAndDropProps,
} from "react-big-calendar/lib/addons/dragAndDrop";
import { format } from "date-fns/format";
import { parse } from "date-fns/parse";
import { startOfWeek } from "date-fns/startOfWeek";
import { getDay } from "date-fns/getDay";
import { enUS } from "date-fns/locale/en-US";
import { motion, AnimatePresence } from "framer-motion";
import {
  ChevronLeft,
  ChevronRight,
  X,
  AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ObjectiveModal } from "@/components/modals";
import { Objective, Task, ObjectiveType, ObjectiveStatus, EnergyLevel } from "@/types";
import toast from "react-hot-toast";
import { TimeIndicator } from "./time-indicator";
import "react-big-calendar/lib/addons/dragAndDrop/styles.css";
import "react-big-calendar/lib/css/react-big-calendar.css";
import "@/styles/calendar.css";

const locales = {
  "en-US": enUS,
};

const localizer = dateFnsLocalizer({
  format: (date: Date, formatStr: string) => format(date, formatStr),
  parse: (dateString: string, formatStr: string, backupDate: Date) => parse(dateString, formatStr, backupDate),
  startOfWeek: (date: Date) => startOfWeek(date),
  getDay: (date: Date) => getDay(date),
  locales,
});

const DnDCalendar = withDragAndDrop(Calendar);

interface CalendarEvent extends RBCEvent {
  id: string;
  objectiveType: ObjectiveType;
  status: ObjectiveStatus;
  energyLevel: EnergyLevel;
  priorityScore: number;
  complexityScore: number;
  completionPercentage: number;
  allDay?: boolean;
}

interface FullCalendarProps {
  objectives: Objective[];
  onUpdate: (id: string, updates: Partial<Objective>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreate: (objective: Partial<Objective>) => Promise<void>;
  onRefresh: () => void;
}

export function FullCalendar({
  objectives,
  onUpdate,
  onDelete,
  onCreate,
  onRefresh,
}: FullCalendarProps) {
  const [view, setView] = useState<View>("week");
  const [date, setDate] = useState(new Date());
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<SlotInfo | null>(null);
  const [showGuides, setShowGuides] = useState(true);
  const [currentView, setCurrentView] = useState<View | null>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);

  // Force refresh for time indicator
  useEffect(() => {
    // Only run this effect for day and week views
    if (view !== "day" && view !== "week") return;

    // Force a re-render every minute to update the time indicator
    const interval = setInterval(() => {
      // Trigger a minimal state update to force re-render
      setDate(prevDate => new Date(prevDate));
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [view]);

  // Convert objectives to calendar events
  const events = useMemo<CalendarEvent[]>(() => {
    console.log("📊 Converting objectives to calendar events:", objectives.length, "objectives");
    
    // Calculate date range for expanding recurring events
    const viewStart = new Date(date);
    const viewEnd = new Date(date);
    
    // Expand view range based on current view
    switch (view) {
      case "day":
        viewStart.setHours(0, 0, 0, 0);
        viewEnd.setHours(23, 59, 59, 999);
        break;
      case "week":
        viewStart.setDate(viewStart.getDate() - viewStart.getDay());
        viewStart.setHours(0, 0, 0, 0);
        viewEnd.setDate(viewStart.getDate() + 6);
        viewEnd.setHours(23, 59, 59, 999);
        break;
      case "month":
        viewStart.setDate(1);
        viewStart.setHours(0, 0, 0, 0);
        viewEnd.setMonth(viewEnd.getMonth() + 1);
        viewEnd.setDate(0);
        viewEnd.setHours(23, 59, 59, 999);
        break;
      case "agenda":
        // Show next 30 days for agenda view
        viewStart.setHours(0, 0, 0, 0);
        viewEnd.setDate(viewEnd.getDate() + 30);
        viewEnd.setHours(23, 59, 59, 999);
        break;
    }
    
    // Expand recurring events
    const expandedObjectives: any[] = [];
    objectives.forEach(obj => {
      const expanded = expandRecurringEvent(obj, viewStart, viewEnd);
      expandedObjectives.push(...expanded);
    });
    
    console.log(`📅 Expanded ${objectives.length} objectives to ${expandedObjectives.length} events (including recurring)`);
    
    const filteredObjectives = expandedObjectives.filter((obj) => {
      // Include tasks with proper date/time fields OR any objective with due_date
        if (obj.objective_type === ObjectiveType.TASK) {
          const task = obj as Task;
        const hasData = (task.start_time && task.end_time) || (task.start_date && task.due_date);
        if (!hasData) {
          console.log("❌ Task filtered out (no dates):", obj.title, {
            start_time: task.start_time,
            end_time: task.end_time,
            start_date: task.start_date,
            due_date: task.due_date
          });
        }
        return hasData;
      }
      
      const hasDueDate = !!obj.due_date;
      if (!hasDueDate) {
        console.log("❌ Objective filtered out (no due_date):", obj.title, {
          objective_type: obj.objective_type,
          due_date: obj.due_date
        });
      } else {
        console.log("✅ Objective included:", obj.title, {
          objective_type: obj.objective_type,
          due_date: obj.due_date,
          recurring: obj.recurring_instance ? "recurring instance" : "original"
        });
      }
      return hasDueDate;
    });
    
    console.log("📋 Filtered objectives:", filteredObjectives.length, "passed filter");
    
    const calendarEvents = filteredObjectives.map((obj) => {
        let start: Date;
        let end: Date;
        
        if (obj.objective_type === ObjectiveType.TASK) {
          const task = obj as Task;
        
        // Priority order: use start_time/end_time if available, otherwise fall back to start_date/due_date
        if (task.start_time && task.end_time) {
          start = new Date(task.start_time);
          end = new Date(task.end_time);
        } else if (task.start_date && task.due_date) {
          start = new Date(task.start_date);
          end = new Date(task.due_date);
        } else if (obj.start_date && obj.due_date) {
          // Final fallback to base objective dates
          start = new Date(obj.start_date);
          end = new Date(obj.due_date);
        } else {
          // This shouldn't happen due to our filter, but safety fallback
          const now = new Date();
          start = now;
          end = new Date(now.getTime() + 60 * 60 * 1000); // 1 hour duration
        }
        
        // Ensure minimum duration of 15 minutes for visibility
        if (end.getTime() - start.getTime() < 15 * 60 * 1000) {
          end = new Date(start.getTime() + 60 * 60 * 1000); // 1 hour minimum
        }
      } else {
        // For other objectives, check if they have specific times
        // If due_date includes time (not just date), use it; otherwise make it all-day
          const dueDate = new Date(obj.due_date!);
        const dueDateString = obj.due_date!;
        
        // Check if due_date includes time (has 'T' and time components)
        const hasSpecificTime = dueDateString.includes('T') && 
          !dueDateString.endsWith('T00:00:00.000Z') && 
          !dueDateString.endsWith('T00:00:00+00:00') &&
          !dueDateString.endsWith('T00:00:00');
        
        if (hasSpecificTime) {
          // Has specific time - use 1-hour block
          start = dueDate;
          end = new Date(dueDate.getTime() + 60 * 60 * 1000);
        } else {
          // No specific time - make it all-day event
          start = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate());
          end = new Date(dueDate.getFullYear(), dueDate.getMonth(), dueDate.getDate() + 1);
        }
      }

      const isAllDay = obj.objective_type !== ObjectiveType.TASK && 
               (!obj.due_date || 
                !obj.due_date.includes('T') || 
                obj.due_date.endsWith('T00:00:00.000Z') ||
                obj.due_date.endsWith('T00:00:00+00:00') ||
                obj.due_date.endsWith('T00:00:00'));

      const event: CalendarEvent = {
          id: obj.id,
          title: obj.title,
          start,
          end,
          resource: obj,
          objectiveType: obj.objective_type,
          status: obj.status,
          energyLevel: obj.energy_requirement,
          priorityScore: obj.priority_score,
          complexityScore: obj.complexity_score,
          completionPercentage: obj.completion_percentage,
        allDay: isAllDay,
      };

      console.log(`📅 Created event: "${obj.title}"`, {
        type: obj.objective_type,
        allDay: isAllDay,
        start: start.toISOString(),
        end: end.toISOString(),
        due_date: obj.due_date
      });

      return event;
    });

    const allDayEvents = calendarEvents.filter((e: CalendarEvent) => e.allDay);
    const timedEvents = calendarEvents.filter((e: CalendarEvent) => !e.allDay);
    
    console.log("🎯 Final event summary:", {
      total: calendarEvents.length,
      allDay: allDayEvents.length,
      timed: timedEvents.length,
      allDayTitles: allDayEvents.map((e: CalendarEvent) => e.title)
    });

    return calendarEvents;
  }, [objectives, date, view]);

  // Custom event style getter
  const eventStyleGetter: EventPropGetter<CalendarEvent> = useCallback(
    (event) => {
      let backgroundColor = "#60a5fa"; // Brighter blue
      let borderColor = "#3b82f6";

      // Color based on status - brighter, more vibrant colors
      switch (event.status) {
        case ObjectiveStatus.COMPLETED:
          backgroundColor = "#4ade80"; // Bright green
          borderColor = "#22c55e";
          break;
        case ObjectiveStatus.IN_PROGRESS:
          backgroundColor = "#fbbf24"; // Bright amber
          borderColor = "#f59e0b";
          break;
        case ObjectiveStatus.BLOCKED:
          backgroundColor = "#f87171"; // Bright red
          borderColor = "#ef4444";
          break;
        case ObjectiveStatus.CANCELLED:
          backgroundColor = "#9ca3af"; // Bright gray
          borderColor = "#6b7280";
          break;
      }

      // Higher base opacity for better visibility
      const opacity = 0.85 + (event.completionPercentage / 100) * 0.15;

      return {
        style: {
          backgroundColor,
          borderColor,
          opacity,
          borderRadius: "8px",
          border: `2px solid ${borderColor}`,
          color: "white",
          fontWeight: "600",
          fontSize: "0.875rem",
          padding: "4px 8px",
          boxShadow: "0 2px 4px rgba(0,0,0,0.1)",
        },
      };
    },
    []
  );

  // Handle slot selection (clicking on empty calendar space)
  const handleSelectSlot = useCallback((slotInfo: SlotInfo) => {
    setSelectedSlot(slotInfo);
    setSelectedEvent(null);
    setShowModal(true);
  }, []);

  // Handle event selection
  const handleSelectEvent = useCallback((event: CalendarEvent) => {
    // If this is a recurring instance, find the original event
    const resource = event.resource as any;
    if (resource.recurring_instance && resource.original_id) {
      const originalEvent = objectives.find(obj => obj.id === resource.original_id);
      if (originalEvent) {
        setSelectedEvent({
          ...event,
          resource: originalEvent
        });
      } else {
    setSelectedEvent(event);
      }
    } else {
      setSelectedEvent(event);
    }
    setSelectedSlot(null);
    setShowModal(true);
  }, [objectives]);

  // Handle drag and drop
  const handleEventDrop = useCallback(
    async (data: { event: CalendarEvent; start: Date; end: Date }) => {
      try {
        const resource = data.event.resource as any;
        
        // If this is a recurring instance, we need to handle it differently
        if (resource.recurring_instance && resource.original_id) {
          // Create a new non-recurring event based on the dropped instance
          const originalEvent = objectives.find(obj => obj.id === resource.original_id);
          if (originalEvent) {
            const newEvent: any = {
              ...originalEvent,
              id: undefined, // Let backend generate new ID
              recurring: undefined, // Remove recurrence
              title: `${originalEvent.title} (Rescheduled)`,
              parent_id: originalEvent.parent_id,
            };
            
            if (data.event.objectiveType === ObjectiveType.TASK) {
              newEvent.start_time = data.start.toISOString();
              newEvent.end_time = data.end.toISOString();
              newEvent.start_date = data.start.toISOString();
              newEvent.due_date = data.end.toISOString();
            } else {
              newEvent.start_date = data.start.toISOString();
              newEvent.due_date = data.end.toISOString();
            }
            
            await onCreate(newEvent);
            toast.success("Created new event from recurring instance!");
          }
        } else {
          // Handle regular event drag
        const updates: any = {};
        
        if (data.event.objectiveType === ObjectiveType.TASK) {
            // For tasks, update both time fields and date fields, keeping them in sync
          updates.start_time = data.start.toISOString();
          updates.end_time = data.end.toISOString();
          updates.start_date = data.start.toISOString();
          updates.due_date = data.end.toISOString();
        } else {
            // For other objectives, just update date fields
            updates.start_date = data.start.toISOString();
          updates.due_date = data.end.toISOString();
        }
        
        await onUpdate(data.event.id, updates);
        toast.success("Event rescheduled!");
        }
        
        onRefresh();
      } catch (error) {
        console.error("Error rescheduling event:", error);
        toast.error("Failed to reschedule event");
      }
    },
    [onUpdate, onCreate, onRefresh, objectives]
  );

  // Handle event resize
  const handleEventResize = useCallback(
    async (data: { event: CalendarEvent; start: Date; end: Date }) => {
      try {
        // Validate that end time is after start time
        if (data.end <= data.start) {
          toast.error("End time must be after start time");
          return;
        }
        
        const updates: any = {};
        
        if (data.event.objectiveType === ObjectiveType.TASK) {
          // For tasks, update both time fields and date fields, keeping them in sync
          updates.start_time = data.start.toISOString();
          updates.end_time = data.end.toISOString();
          updates.start_date = data.start.toISOString();
          updates.due_date = data.end.toISOString();
        } else {
          // For other objectives, just update date fields
          updates.start_date = data.start.toISOString();
          updates.due_date = data.end.toISOString();
        }
        
        await onUpdate(data.event.id, updates);
        toast.success("Event duration updated!");
        onRefresh();
      } catch (error) {
        console.error("Error updating event duration:", error);
        toast.error("Failed to update event duration");
      }
    },
    [onUpdate, onRefresh]
  );

  // Custom toolbar component
  const CustomToolbar = ({ label, onNavigate, onView }: any) => (
    <div className="flex items-center justify-between mb-4 p-4 bg-background border-b">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onNavigate("TODAY")}
          className="font-medium"
        >
          Today
        </Button>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("PREV")}
          >
            <ChevronLeft className="w-4 h-4" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onNavigate("NEXT")}
          >
            <ChevronRight className="w-4 h-4" />
          </Button>
        </div>
        <h2 className="text-xl font-semibold">{label}</h2>
      </div>
      <div className="flex items-center gap-2">
        <Button
          variant={view === "month" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("month")}
        >
          Month
        </Button>
        <Button
          variant={view === "week" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("week")}
        >
          Week
        </Button>
        <Button
          variant={view === "day" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("day")}
        >
          Day
        </Button>
        <Button
          variant={view === "agenda" ? "default" : "outline"}
          size="sm"
          onClick={() => setView("agenda")}
        >
          Agenda
        </Button>
      </div>
    </div>
  );

  return (
    <motion.div
      ref={calendarContainerRef}
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full bg-card rounded-xl border overflow-hidden relative"
    >
        <DnDCalendar
          localizer={localizer}
          events={events}
          startAccessor={(event: any) => event.start}
          endAccessor={(event: any) => event.end}
          allDayAccessor={(event: any) => event.allDay}
          style={{ height: "100%" }}
          view={view}
          onView={setView}
          date={date}
          onNavigate={setDate}
          onSelectSlot={handleSelectSlot}
          onSelectEvent={(event: any) => handleSelectEvent(event as CalendarEvent)}
          onEventDrop={(args: any) => handleEventDrop({
            event: args.event as CalendarEvent,
            start: args.start as Date,
            end: args.end as Date,
          })}
          onEventResize={(args: any) => handleEventResize({
            event: args.event as CalendarEvent,
            start: args.start as Date,
            end: args.end as Date,
          })}
          eventPropGetter={eventStyleGetter as any}
          selectable
          resizable
          popup
          popupOffset={30}
          showMultiDayTimes={false}
          step={30}
          timeslots={2}
          getNow={() => new Date()}
          components={{
            toolbar: CustomToolbar,
          }}
          formats={{
            dayHeaderFormat: "EEE M/d",
            timeGutterFormat: "h a",
          }}
          messages={{
            showMore: (count: number) => `+${count} more`,
          }}
          className="auxilium-calendar"
        />
        
      <TimeIndicator view={view as string} containerRef={calendarContainerRef} />

      {/* Objective Modal */}
      <ObjectiveModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={onRefresh}
        initialData={selectedEvent?.resource as Objective | undefined}
        slotInfo={selectedSlot ? {
          start: selectedSlot.start,
          end: selectedSlot.end,
        } : undefined}
      />

      {/* Guides */}
      <AnimatePresence>
        {showGuides && currentView && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-4 p-4 bg-muted/50 rounded-lg border border-border/50"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <h4 className="font-medium flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-primary" />
                  Calendar Guide
                </h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li>• Click and drag on the calendar to create new events</li>
                  <li>• Click on events to edit them</li>
                  <li>• Drag events to reschedule</li>
                  <li>• Resize events to change duration</li>
                  <li>• Use the view buttons to switch between day/week/month views</li>
                </ul>
              </div>
              <button
                onClick={() => setShowGuides(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Custom Calendar Styles */}
      <style jsx global>{`
        .auxilium-calendar {
          font-family: inherit;
          background: transparent;
        }
        
        .auxilium-calendar .rbc-header {
          padding: 12px 8px;
          font-weight: 600;
          background: transparent;
          border: none !important;
          border-bottom: 1px solid hsl(var(--border) / 0.5) !important;
          font-size: 0.875rem;
          color: hsl(var(--muted-foreground));
        }
        
        .auxilium-calendar .rbc-header + .rbc-header {
          border-left: 1px solid hsl(var(--border) / 0.3) !important;
        }
        
        .auxilium-calendar .rbc-time-view {
          border: none;
          background: transparent;
        }
        
        .auxilium-calendar .rbc-time-header-cell {
          min-height: 50px;
          border: none !important;
        }
        
        .auxilium-calendar .rbc-time-content {
          border-top: 1px solid hsl(var(--border) / 0.5);
          background: transparent;
        }
        
        .auxilium-calendar .rbc-day-slot .rbc-time-slot {
          border-top: 1px solid hsl(var(--border) / 0.2);
          border-left: none;
        }
        
        .auxilium-calendar .rbc-time-slot.rbc-now {
          background-color: hsl(var(--primary) / 0.03);
        }
        
        .auxilium-calendar .rbc-timeslot-group {
          border-left: 1px solid hsl(var(--border) / 0.3);
          min-height: 60px;
        }
        
        .auxilium-calendar .rbc-time-gutter {
          background: transparent;
          border-right: 1px solid hsl(var(--border) / 0.3);
        }
        
        .auxilium-calendar .rbc-allday-cell {
          border: none;
          background: hsl(var(--muted) / 0.3);
        }
        
        .auxilium-calendar .rbc-current-time-indicator {
          background-color: #ef4444;
          height: 3px;
          position: absolute;
          left: 0;
          right: 0;
          z-index: 20;
          pointer-events: none;
          box-shadow: 0 1px 3px rgba(239, 68, 68, 0.5);
        }
        
        .auxilium-calendar .rbc-current-time-indicator::before {
          content: '';
          position: absolute;
          left: -6px;
          top: -5px;
          width: 12px;
          height: 12px;
          background-color: #ef4444;
          border-radius: 50%;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
        }
        
        .auxilium-calendar .rbc-today {
          background-color: hsl(var(--primary) / 0.05);
        }
        
        .auxilium-calendar .rbc-off-range-bg {
          background-color: hsl(var(--muted) / 0.3);
        }
        
        .auxilium-calendar .rbc-event {
          padding: 6px 10px;
          font-size: 0.875rem;
          border: none !important;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          transition: all 0.2s;
        }
        
        .auxilium-calendar .rbc-event:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
          transform: translateY(-1px);
        }
        
        .auxilium-calendar .rbc-event.rbc-selected {
          box-shadow: 0 0 0 2px hsl(var(--primary));
        }
        
        .auxilium-calendar .rbc-event-label {
          display: none;
        }
        
        .auxilium-calendar .rbc-event-content {
          font-weight: 500;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }
        
        .auxilium-calendar .rbc-toolbar {
          margin-bottom: 0;
          padding: 0;
          border: none;
        }
        
        .auxilium-calendar .rbc-toolbar button {
          color: hsl(var(--foreground));
          border: 1px solid hsl(var(--border));
          background: hsl(var(--background));
          font-weight: 500;
          padding: 6px 12px;
          border-radius: 6px;
          transition: all 0.2s;
        }
        
        .auxilium-calendar .rbc-toolbar button:hover {
          background: hsl(var(--muted));
          border-color: hsl(var(--primary));
        }
        
        .auxilium-calendar .rbc-toolbar button.rbc-active {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
        }
        
        .auxilium-calendar .rbc-show-more {
          color: hsl(var(--primary));
          font-weight: 500;
          font-size: 0.75rem;
        }
        
        .auxilium-calendar .rbc-month-view {
          border: none;
          background: transparent;
        }
        
        .auxilium-calendar .rbc-month-row {
          border: none;
          overflow: visible;
        }
        
        .auxilium-calendar .rbc-day-bg {
          border-left: 1px solid hsl(var(--border) / 0.3);
        }
        
        .auxilium-calendar .rbc-month-header {
          background: transparent;
          border-bottom: 1px solid hsl(var(--border) / 0.5);
        }
        
        .auxilium-calendar .rbc-date-cell {
          padding: 4px 8px;
          font-size: 0.875rem;
          font-weight: 500;
        }
        
        .auxilium-calendar .rbc-agenda-view {
          border: none;
        }
        
        .auxilium-calendar .rbc-agenda-table {
          border: none;
        }
        
        .auxilium-calendar .rbc-agenda-time-cell {
          padding: 8px 12px;
          font-size: 0.875rem;
          white-space: nowrap;
        }
        
        .auxilium-calendar .rbc-agenda-event-cell {
          padding: 8px 12px;
        }
        
        .auxilium-calendar .rbc-agenda-date-cell {
          padding: 8px 12px;
          font-weight: 600;
        }
        
        /* Dark mode adjustments */
        @media (prefers-color-scheme: dark) {
          .auxilium-calendar .rbc-event {
            box-shadow: 0 1px 3px rgba(0, 0, 0, 0.3);
          }
          
          .auxilium-calendar .rbc-event:hover {
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.4);
          }
        }
      `}</style>
    </motion.div>
  );
} 