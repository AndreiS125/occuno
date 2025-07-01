"use client";

import { useCallback, useMemo, useState, useRef } from "react";
import { expandRecurringEvent } from "@/lib/date-utils";
import FullCalendar from '@fullcalendar/react';
import dayGridPlugin from '@fullcalendar/daygrid';
import timeGridPlugin from '@fullcalendar/timegrid';
import interactionPlugin from '@fullcalendar/interaction';
import listPlugin from '@fullcalendar/list';
import multiMonthPlugin from '@fullcalendar/multimonth';
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  AlertCircle,
} from "lucide-react";
import { ObjectiveModal } from "@/components/modals";
import { Objective, Task, ObjectiveType, ObjectiveStatus, EnergyLevel } from "@/types";
import "@/styles/fullcalendar.css";

interface CalendarEvent {
  id: string;
  title: string;
  start: string | Date;
  end: string | Date;
  allDay?: boolean;
  backgroundColor?: string;
  borderColor?: string;
  textColor?: string;
  extendedProps: {
    objective: Objective;
    objectiveType: ObjectiveType;
    status: ObjectiveStatus;
    energyLevel: EnergyLevel;
    priorityScore: number;
    complexityScore: number;
    completionPercentage: number;
  };
}

interface FullCalendarModernProps {
  objectives: Objective[];
  onUpdate: (id: string, updates: Partial<Objective>) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onCreate: (objective: Partial<Objective>) => Promise<void>;
  onRefresh: () => void;
}

export function FullCalendarModern({
  objectives,
  onUpdate,
  onDelete,
  onCreate,
  onRefresh,
}: FullCalendarModernProps) {
  const [showModal, setShowModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const calendarRef = useRef<FullCalendar>(null);

  // Convert objectives to FullCalendar events
  const events = useMemo<CalendarEvent[]>(() => {
    console.log("📊 Converting objectives to FullCalendar events:", objectives.length, "objectives");
    
    // Get current view date range for expanding recurring events
    const now = new Date();
    const viewStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const viewEnd = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    
    // Expand recurring events
    const expandedObjectives: any[] = [];
    objectives.forEach(obj => {
      const expanded = expandRecurringEvent(obj, viewStart, viewEnd);
      expandedObjectives.push(...expanded);
    });
    
    console.log(`📅 Expanded ${objectives.length} objectives to ${expandedObjectives.length} events (including recurring)`);
    
    const filteredObjectives = expandedObjectives.filter((obj) => {
      // Include only objectives with both start_date and due_date
      const hasRequiredDates = !!(obj.start_date && obj.due_date);
      if (!hasRequiredDates) {
        console.log("❌ Objective filtered out (missing dates):", obj.title, {
          start_date: !!obj.start_date,
          due_date: !!obj.due_date
        });
      }
      return hasRequiredDates;
    });
    
    console.log("📋 Filtered objectives:", filteredObjectives.length, "passed filter");
    
    const calendarEvents = filteredObjectives.map((obj): CalendarEvent => {
      // Simple approach: Use the explicit all_day field from the backend
      const start = new Date(obj.start_date!);
      const end = new Date(obj.due_date!);
      
      // Use the explicit all_day field - no more complex inference!
      const allDay = obj.all_day || false;
      
      // Fix duration for single-day all-day events
      if (allDay && start.getTime() === end.getTime()) {
        // For single-day all-day events, end should be next day at midnight
        end.setDate(end.getDate() + 1);
        console.log(`🔧 Fixed single-day all-day duration: end moved to ${end.toISOString()}`);
      }
      
      console.log(`📅 Event "${obj.title}":`, {
        start_date: obj.start_date,
        due_date: obj.due_date,
        all_day: obj.all_day,
        allDay,
        eventType: allDay ? "ALL-DAY" : "TIMED",
        finalStart: start.toISOString(),
        finalEnd: end.toISOString(),
        durationHours: (end.getTime() - start.getTime()) / (1000 * 60 * 60)
      });
      
      // For timed events, ensure minimum duration of 30 minutes for visibility
      if (!allDay && end.getTime() - start.getTime() < 30 * 60 * 1000) {
        end.setTime(start.getTime() + 60 * 60 * 1000); // 1 hour minimum
      }

      // Color based on status
      let backgroundColor = "#60a5fa"; // Default blue
      switch (obj.status) {
        case ObjectiveStatus.COMPLETED:
          backgroundColor = "#4ade80"; // Green
          break;
        case ObjectiveStatus.IN_PROGRESS:
          backgroundColor = "#fbbf24"; // Amber
          break;
        case ObjectiveStatus.BLOCKED:
          backgroundColor = "#f87171"; // Red
          break;
        case ObjectiveStatus.CANCELLED:
          backgroundColor = "#9ca3af"; // Gray
          break;
      }

      const event: CalendarEvent = {
        id: obj.id,
        title: obj.title,
        start: allDay ? start.toISOString().split('T')[0] : start.toISOString(), // Date-only for all-day
        end: allDay ? end.toISOString().split('T')[0] : end.toISOString(),       // Date-only for all-day
        allDay,
        backgroundColor,
        borderColor: backgroundColor,
        textColor: "white",
        extendedProps: {
          objective: obj,
          objectiveType: obj.objective_type,
          status: obj.status,
          energyLevel: obj.energy_requirement,
          priorityScore: obj.priority_score,
          complexityScore: obj.complexity_score,
          completionPercentage: obj.completion_percentage,
        }
      };

      console.log(`📅 Created event: "${obj.title}"`, {
        type: obj.objective_type,
        allDay,
        start: allDay ? start.toISOString().split('T')[0] : start.toISOString(),
        end: allDay ? end.toISOString().split('T')[0] : end.toISOString(),
        eventType: allDay ? "ALL-DAY EVENT" : "TIMED EVENT",
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
        timezoneOffset: new Date().getTimezoneOffset() / 60
      });

      return event;
    });

    return calendarEvents;
  }, [objectives]);

  // Handle date selection (clicking on empty calendar space)
  const handleDateSelect = useCallback((selectInfo: any) => {
    console.log("📅 Date selection:", {
      allDay: selectInfo.allDay,
      start: selectInfo.start.toISOString(),
      end: selectInfo.end.toISOString()
    });
    
    setSelectedSlot({
      start: selectInfo.start,
      end: selectInfo.end,
      allDay: selectInfo.allDay,
    });
    setSelectedEvent(null);
    setShowModal(true);
  }, []);

  // Handle event click
  const handleEventClick = useCallback((clickInfo: any) => {
    const event = clickInfo.event;
    
    // Create a safe copy of extendedProps to avoid readonly issues
    const extendedPropsCopy = {
      objective: event.extendedProps.objective,
      objectiveType: event.extendedProps.objectiveType,
      status: event.extendedProps.status,
      energyLevel: event.extendedProps.energyLevel,
      priorityScore: event.extendedProps.priorityScore,
      complexityScore: event.extendedProps.complexityScore,
      completionPercentage: event.extendedProps.completionPercentage,
    };
    
    const calendarEvent: CalendarEvent = {
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      textColor: event.textColor,
      extendedProps: extendedPropsCopy,
    };

    // If this is a recurring instance, find the original event
    const resource = event.extendedProps.objective;
    if (resource.recurring_instance && resource.original_id) {
      const originalEvent = objectives.find(obj => obj.id === resource.original_id);
      if (originalEvent) {
        calendarEvent.extendedProps.objective = originalEvent;
      }
    }

    setSelectedEvent(calendarEvent);
    setSelectedSlot(null);
    setShowModal(true);
  }, [objectives]);

  // Handle event drop (drag and drop)
  const handleEventDrop = useCallback(async (dropInfo: any) => {
    try {
      const event = dropInfo.event;
      const resource = { ...event.extendedProps.objective }; // Create a safe copy
      const objectiveType = event.extendedProps.objectiveType;
      
      // FullCalendar provides dates in local time, use them directly
      const startDate = event.start;
      const endDate = event.end || new Date(startDate.getTime() + 60 * 60 * 1000);
      
      console.log("🔄 Event drop details:", {
        allDay: event.allDay,
        objectiveType: objectiveType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        originalAllDay: dropInfo.oldEvent.allDay
      });
      
      // If this is a recurring instance, create a new non-recurring event
      if (resource.recurring_instance && resource.original_id) {
        const originalEvent = objectives.find(obj => obj.id === resource.original_id);
        if (originalEvent) {
          const newEvent: any = {
            ...originalEvent,
            id: undefined, // Let backend generate new ID
            recurring: undefined, // Remove recurrence
            title: `${originalEvent.title} (Rescheduled)`,
            parent_id: originalEvent.parent_id,
          };
          
          // Handle all-day vs timed events
          if (event.allDay) {
            // All-day event - Fix FullCalendar's end date issue AND timezone
            let finalEndDate = endDate;
            if (!endDate || endDate.getTime() === startDate.getTime()) {
              finalEndDate = new Date(startDate);
              finalEndDate.setDate(finalEndDate.getDate() + 1); // Next day at 00:00
            }
            
            // Create UTC dates directly to avoid timezone conversion issues
            const startYear = startDate.getFullYear();
            const startMonth = startDate.getMonth();
            const startDay = startDate.getDate();
            
            const endYear = finalEndDate.getFullYear();
            const endMonth = finalEndDate.getMonth();
            const endDay = finalEndDate.getDate();
            
            // Create proper UTC dates for all-day events
            const utcStart = new Date(Date.UTC(startYear, startMonth, startDay, 0, 0, 0, 0));
            const utcEnd = new Date(Date.UTC(endYear, endMonth, endDay, 0, 0, 0, 0));
            
            // Use date-only format for all-day events to prevent timezone issues
            newEvent.start_date = utcStart.toISOString().split('T')[0] + 'T00:00:00.000Z';
            newEvent.due_date = utcEnd.toISOString().split('T')[0] + 'T00:00:00.000Z';
            newEvent.all_day = true;  // Explicit all-day flag
          } else {
            // Timed event
            newEvent.start_date = startDate.toISOString();
            newEvent.due_date = endDate.toISOString();
            newEvent.all_day = false;  // Explicit timed flag
          }
          
          await onCreate(newEvent);
        }
      } else {
        // Handle regular event drag
        const updates: any = {};
        
        if (event.allDay) {
          // All-day event - Fix FullCalendar's end date issue AND timezone
          let finalEndDate = endDate;
          if (!endDate || endDate.getTime() === startDate.getTime()) {
            finalEndDate = new Date(startDate);
            finalEndDate.setDate(finalEndDate.getDate() + 1); // Next day at 00:00
          }
          
          // Create UTC dates directly to avoid timezone conversion issues
          const startYear = startDate.getFullYear();
          const startMonth = startDate.getMonth();
          const startDay = startDate.getDate();
          
          const endYear = finalEndDate.getFullYear();
          const endMonth = finalEndDate.getMonth();
          const endDay = finalEndDate.getDate();
          
          // Create proper UTC dates for all-day events
          const utcStart = new Date(Date.UTC(startYear, startMonth, startDay, 0, 0, 0, 0));
          const utcEnd = new Date(Date.UTC(endYear, endMonth, endDay, 0, 0, 0, 0));
          
          updates.start_date = utcStart.toISOString().split('T')[0] + 'T00:00:00.000Z';
          updates.due_date = utcEnd.toISOString().split('T')[0] + 'T00:00:00.000Z';
          updates.all_day = true;  // Explicit all-day flag
          
          console.log("📅 All-day event drop:", {
            targetDate: `${startYear}-${startMonth + 1}-${startDay}`,
            originalStart: startDate.toISOString(),
            originalEnd: endDate?.toISOString(),
            finalStart: updates.start_date,
            finalEnd: updates.due_date,
            durationHours: (utcEnd.getTime() - utcStart.getTime()) / (1000 * 60 * 60),
            userTimezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            timezoneOffset: new Date().getTimezoneOffset() / 60
          });
          
        } else {
          // Timed event - update date fields with time
          updates.start_date = startDate.toISOString();
          updates.due_date = endDate.toISOString();
          updates.all_day = false;  // Explicit timed flag
        }
        
        console.log("🔄 Updating event with:", updates);
        await onUpdate(event.id, updates);
      }
      
      onRefresh();
    } catch (error) {
      console.error("Error rescheduling event:", error);
      const errorMessage = error instanceof Error ? error.message : "Unknown error";
      console.error("Event details:", {
        id: dropInfo.event.id,
        title: dropInfo.event.title,
        allDay: dropInfo.event.allDay,
        objectiveType: dropInfo.event.extendedProps?.objectiveType,
        error: errorMessage
      });
      dropInfo.revert(); // Revert the change on error
    }
  }, [onUpdate, onCreate, onRefresh, objectives]);

  // Handle event resize
  const handleEventResize = useCallback(async (resizeInfo: any) => {
    try {
      const event = resizeInfo.event;
      const objectiveType = event.extendedProps.objectiveType;
      
      // Validate that end time is after start time
      if (event.end <= event.start) {
        resizeInfo.revert();
        return;
      }
      
      // FullCalendar provides dates in local time, use them directly
      const startDate = event.start;
      const endDate = event.end;
      
      const updates: any = {};
      
      console.log("📏 Event resize details:", {
        allDay: event.allDay,
        objectiveType: objectiveType,
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString()
      });
      
      if (event.allDay) {
        // All-day event resize - Fix FullCalendar's end date issue AND timezone
        let finalEndDate = endDate;
        if (!endDate || endDate.getTime() === startDate.getTime()) {
          finalEndDate = new Date(startDate);
          finalEndDate.setDate(finalEndDate.getDate() + 1); // Next day at 00:00
        }
        
        // Create UTC dates directly to avoid timezone conversion issues
        const startYear = startDate.getFullYear();
        const startMonth = startDate.getMonth();
        const startDay = startDate.getDate();
        
        const endYear = finalEndDate.getFullYear();
        const endMonth = finalEndDate.getMonth();
        const endDay = finalEndDate.getDate();
        
        // Create proper UTC dates for all-day events
        const utcStart = new Date(Date.UTC(startYear, startMonth, startDay, 0, 0, 0, 0));
        const utcEnd = new Date(Date.UTC(endYear, endMonth, endDay, 0, 0, 0, 0));
        
        updates.start_date = utcStart.toISOString().split('T')[0] + 'T00:00:00.000Z';
        updates.due_date = utcEnd.toISOString().split('T')[0] + 'T00:00:00.000Z';
        updates.all_day = true;  // Explicit all-day flag
        
        console.log("📏 All-day event resize:", {
          targetDate: `${startYear}-${startMonth + 1}-${startDay}`,
          finalStart: updates.start_date,
          finalEnd: updates.due_date,
          durationHours: (utcEnd.getTime() - utcStart.getTime()) / (1000 * 60 * 60)
        });
        
      } else {
        // Timed event resize
        updates.start_date = startDate.toISOString();
        updates.due_date = endDate.toISOString();
        updates.all_day = false;  // Explicit timed flag
      }
      
      console.log("📏 Resizing event with:", updates);
      await onUpdate(event.id, updates);
      onRefresh();
    } catch (error) {
      console.error("Error updating event duration:", error);
      resizeInfo.revert(); // Revert the change on error
    }
  }, [onUpdate, onRefresh]);

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      className="h-full bg-card rounded-xl border overflow-hidden relative flex flex-col"
    >
      <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, multiMonthPlugin]}
        headerToolbar={{
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        initialView='timeGridWeek'
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={true}
        weekends={true}
        events={events}
        select={handleDateSelect}
        eventClick={handleEventClick}
        eventDrop={handleEventDrop}
        eventResize={handleEventResize}
        height="100%"
        // Timezone settings
        timeZone='local'
        // Improved drag and drop settings
        eventDragMinDistance={5}
        dragRevertDuration={300}
        eventOverlap={true}
        // Better visual feedback
        eventDisplay="block"
        displayEventTime={true}
        displayEventEnd={false}
        // Responsive settings
        handleWindowResize={true}
        // Performance settings
        lazyFetching={true}
        // Styling
        themeSystem="standard"
        // Time settings
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        slotDuration="00:30:00"
        slotLabelInterval="01:00:00"
        snapDuration="00:15:00"
        // All-day settings
        allDaySlot={true}
        allDayText="All Day"
        // Event rendering
        eventMinHeight={25}
        // Now indicator
        nowIndicator={true}
        // Custom styling through CSS classes
        eventClassNames={(arg) => {
          const status = arg.event.extendedProps?.status;
          const classNames = ['fc-event-modern'];
          if (status) {
            classNames.push(`fc-event-${status.toLowerCase()}`);
          }
          return classNames;
        }}
      />

      {/* Objective Modal */}
      <ObjectiveModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onSuccess={onRefresh}
        initialData={selectedEvent?.extendedProps.objective as Objective | undefined}
        slotInfo={selectedSlot ? {
          start: selectedSlot.start,
          end: selectedSlot.end,
        } : undefined}
      />



      {/* Note: Custom styles are now in /src/styles/fullcalendar.css */}
    </motion.div>
  );
} 