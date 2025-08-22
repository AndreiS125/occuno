"use client";

import { useCallback, useMemo, useState, useRef, useEffect } from "react";
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
  Calendar as CalendarIcon,
  Plus,
  Eye,
  EyeOff,
  Edit,
  Trash2,
  Settings,
  ChevronDown,
  Check,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { ObjectiveModal, CalendarManagementModal } from "@/components/modals";

import { Objective, Task, ObjectiveType, ObjectiveStatus, EnergyLevel, Calendar } from "@/types";
import { useCalendars } from "@/hooks/use-calendars";
import { MiniCalendar } from "./mini-calendar";
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
  const [showPopover, setShowPopover] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [selectedSlot, setSelectedSlot] = useState<any>(null);
  const [popoverAnchor, setPopoverAnchor] = useState<HTMLElement | null>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const [showAllDay, setShowAllDay] = useState(true);
  const [showCalendarSidebar, setShowCalendarSidebar] = useState(true);
  const [selectedCalendarIds, setSelectedCalendarIds] = useState<Set<string>>(new Set());
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [editingCalendar, setEditingCalendar] = useState<Calendar | null>(null);
  const [calendarModalMode, setCalendarModalMode] = useState<'create' | 'edit'>('create');
  const calendarRef = useRef<FullCalendar>(null);
  const calendarContainerRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [calendarTitle, setCalendarTitle] = useState("");
  
  // Calendar management
  const {
    calendars,
    loading: calendarsLoading,
    fetchCalendars,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    toggleCalendarVisibility,
    setDefaultCalendar,
    ensureDefaultCalendar
  } = useCalendars();

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
        return false;
      }
      
      // Apply calendar filtering if specific calendars are selected
      if (selectedCalendarIds.size > 0) {
        const isInSelectedCalendar = obj.calendar_id && selectedCalendarIds.has(obj.calendar_id);
        if (!isInSelectedCalendar) {
          console.log("📅 Objective filtered out (calendar not selected):", obj.title, {
            calendar_id: obj.calendar_id,
            selectedCalendars: Array.from(selectedCalendarIds)
          });
          return false;
        }
      }
      
      return true;
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
      
      // Let events display their actual duration - no artificial minimum
      // FullCalendar will handle minimum visual height via eventMinHeight setting

      // Color based on calendar first, then status
      let backgroundColor = "#60a5fa"; // Default blue
      
      // Use calendar color if available
      const calendar = calendars.find(cal => cal.id === obj.calendar_id);
      if (calendar?.color) {
        backgroundColor = calendar.color;
      } else {
        // Fallback to status-based coloring
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
  }, [objectives, selectedCalendarIds, calendars]);

  // Initialize calendars and set all visible calendars as selected by default
  const initializeCalendars = useCallback(async () => {
    await fetchCalendars();
    // Set all visible calendars as selected by default
    if (calendars.length > 0) {
      const visibleCalendarIds = calendars.filter(cal => cal.is_visible).map(cal => cal.id);
      setSelectedCalendarIds(new Set(visibleCalendarIds));
    }
  }, [fetchCalendars, calendars]);

  // Initialize calendars on mount
  useEffect(() => {
    initializeCalendars();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Track viewport to switch to compact mobile toolbar
  useEffect(() => {
    const check = () => setIsMobile(typeof window !== 'undefined' && window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  // Ensure FullCalendar recalculates its size when the sidebar toggles
  useEffect(() => {
    const api = calendarRef.current?.getApi();
    if (!api) return;
    // Immediate update and one after the transition ends
    try {
      api.updateSize();
    } catch {}
    const t = setTimeout(() => {
      try { api.updateSize(); } catch {}
      try { window.dispatchEvent(new Event('resize')); } catch {}
    }, 320); // matches transition duration-300
    return () => clearTimeout(t);
  }, [showCalendarSidebar]);

  // Observe container width changes to force FullCalendar to stretch/shrink
  useEffect(() => {
    const el = calendarContainerRef.current;
    const api = calendarRef.current?.getApi();
    if (!el || !api) return;
    let raf = 0;
    let last = el.getBoundingClientRect().width;
    const ro = new ResizeObserver((entries) => {
      const w = entries[0].contentRect.width;
      if (Math.abs(w - last) > 0.5) {
        last = w;
        cancelAnimationFrame(raf);
        raf = requestAnimationFrame(() => {
          try { api.updateSize(); } catch {}
        });
      }
    });
    ro.observe(el);
    return () => {
      ro.disconnect();
      cancelAnimationFrame(raf);
    };
  }, []);

  // Close popover on outside click or Escape
  useEffect(() => {
    if (!showPopover) return;
    const handlePointerDown = (e: MouseEvent) => {
      const pop = popoverRef.current;
      const anchor = popoverAnchor;
      const target = e.target as Node;
      if (pop && pop.contains(target)) return;
      if (anchor && anchor.contains(target as Node)) return;
      setShowPopover(false);
    };
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setShowPopover(false);
    };
    document.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('keydown', handleKey);
    return () => {
      document.removeEventListener('mousedown', handlePointerDown);
      window.removeEventListener('keydown', handleKey);
    };
  }, [showPopover, popoverAnchor]);

  // Calendar management functions
  const handleSaveCalendar = useCallback(async (calendarData: Partial<Calendar>) => {
    if (calendarModalMode === 'create') {
      // Convert to CalendarCreateData format
      const createData = {
        name: calendarData.name!,
        description: calendarData.description,
        color: calendarData.color || "#3b82f6",
        is_visible: calendarData.is_visible ?? true,
        is_default: calendarData.is_default ?? false
      };
      const newCalendar = await createCalendar(createData);
      if (newCalendar) {
        // Add to selected calendars by default
        setSelectedCalendarIds(prev => new Set([...Array.from(prev), newCalendar.id]));
      }
    } else {
      // Update existing calendar
      const updateData = {
        name: calendarData.name,
        description: calendarData.description,
        color: calendarData.color,
        is_visible: calendarData.is_visible,
        is_default: calendarData.is_default
      };
      await updateCalendar(calendarData.id!, updateData);
    }
  }, [calendarModalMode, createCalendar, updateCalendar]);

  const handleDeleteCalendar = useCallback(async (calendarId: string) => {
    const success = await deleteCalendar(calendarId);
    if (success) {
      // Remove from selected calendars
      setSelectedCalendarIds(prev => {
        const newSet = new Set(prev);
        newSet.delete(calendarId);
        return newSet;
      });
    }
  }, [deleteCalendar]);

  const openCreateCalendarModal = useCallback(() => {
    setEditingCalendar(null);
    setCalendarModalMode('create');
    setShowCalendarModal(true);
  }, []);

  const openEditCalendarModal = useCallback((calendar: Calendar) => {
    setEditingCalendar(calendar);
    setCalendarModalMode('edit');
    setShowCalendarModal(true);
  }, []);

  const handleToggleCalendarVisibility = useCallback(async (calendarId: string) => {
    const success = await toggleCalendarVisibility(calendarId);
    if (success) {
      // Remove from selected if hidden
      const calendar = calendars.find(c => c.id === calendarId);
      if (calendar && !calendar.is_visible) {
        setSelectedCalendarIds(prev => {
          const newSet = new Set(prev);
          newSet.delete(calendarId);
          return newSet;
        });
      }
    }
  }, [toggleCalendarVisibility, calendars]);

  const handleToggleCalendarSelection = useCallback((calendarId: string) => {
    setSelectedCalendarIds(prev => {
      const newSet = new Set(prev);
      if (newSet.has(calendarId)) {
        newSet.delete(calendarId);
      } else {
        newSet.add(calendarId);
      }
      return newSet;
    });
  }, []);

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

  // Handle event click (existing objective) - Show popover instead of modal
  const handleEventClick = useCallback((clickInfo: any) => {
    console.log("📅 Event clicked:", clickInfo.event.title);
    const event = clickInfo.event;
    
    // Find the matching objective
    const objective = event.extendedProps?.objective;
    if (!objective) {
      console.error("❌ No objective found in event extended props");
      return;
    }
    
    console.log("🎯 Found objective for popover:", objective);
    
    // Set the selected event for the popover
    setSelectedEvent({
      id: event.id,
      title: event.title,
      start: event.start,
      end: event.end,
      allDay: event.allDay,
      backgroundColor: event.backgroundColor,
      borderColor: event.borderColor,
      textColor: event.textColor,
      extendedProps: event.extendedProps
    });
    
    // Set anchor element for popover positioning
    setPopoverAnchor(clickInfo.el);
    setShowPopover(true);
  }, []);

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
            // Timed event - preserve local time without timezone conversion
            const formatLocalDateTime = (date: Date) => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              const seconds = String(date.getSeconds()).padStart(2, '0');
              return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
            };
            
            newEvent.start_date = formatLocalDateTime(startDate);
            newEvent.due_date = formatLocalDateTime(endDate);
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
          // Timed event - preserve local time without timezone conversion
          const formatLocalDateTime = (date: Date) => {
            const year = date.getFullYear();
            const month = String(date.getMonth() + 1).padStart(2, '0');
            const day = String(date.getDate()).padStart(2, '0');
            const hours = String(date.getHours()).padStart(2, '0');
            const minutes = String(date.getMinutes()).padStart(2, '0');
            const seconds = String(date.getSeconds()).padStart(2, '0');
            return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
          };
          
          updates.start_date = formatLocalDateTime(startDate);
          updates.due_date = formatLocalDateTime(endDate);
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
        // Timed event resize - preserve local time without timezone conversion
        const formatLocalDateTime = (date: Date) => {
          const year = date.getFullYear();
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const day = String(date.getDate()).padStart(2, '0');
          const hours = String(date.getHours()).padStart(2, '0');
          const minutes = String(date.getMinutes()).padStart(2, '0');
          const seconds = String(date.getSeconds()).padStart(2, '0');
          return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}.000Z`;
        };
        
        updates.start_date = formatLocalDateTime(startDate);
        updates.due_date = formatLocalDateTime(endDate);
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
      className="h-full bg-card rounded-xl border overflow-hidden relative flex w-full"
    >
      {/* Calendar Sidebar */}
      <AnimatePresence>
        {showCalendarSidebar && (
          <motion.div
            initial={{ x: -300, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -300, opacity: 0 }}
            className="w-80 bg-card border-r flex flex-col"
            onAnimationStart={() => {
              const api = calendarRef.current?.getApi();
              if (!api) return;
              try { api.updateSize(); } catch {}
            }}
            onAnimationComplete={() => {
              const api = calendarRef.current?.getApi();
              if (!api) return;
              try { api.updateSize(); } catch {}
              try { window.dispatchEvent(new Event('resize')); } catch {}
            }}
          >
            {/* Sidebar Header */}
            <div className="p-4 border-b">
              <div className="flex items-center justify-between">
                <h3 className="font-semibold text-lg">My Calendars</h3>
                <button
                  onClick={() => setShowCalendarSidebar(false)}
                  className="p-1 hover:bg-muted rounded"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Mini Calendar */}
            <div className="p-4 border-b">
              <MiniCalendar
                selectedDate={new Date()}
                onDateClick={(date) => {
                  // Navigate main calendar to the selected date, preserving current view
                  const calendar = calendarRef.current;
                  if (calendar) {
                    calendar.getApi().gotoDate(date);
                    // Don't change view - just navigate to the date
                  }
                }}
                highlightedDates={objectives
                  .filter(obj => obj.start_date)
                  .map(obj => new Date(obj.start_date!))
                }
              />
            </div>

            {/* Calendars List */}
            <div className="flex-1 p-4 overflow-y-auto">
              {calendarsLoading ? (
                <div className="text-center text-muted-foreground py-8">
                  Loading calendars...
                </div>
              ) : (
                <div className="space-y-2">
                  {calendars.map((calendar) => (
                    <div
                      key={calendar.id}
                      className="flex items-center justify-between p-2 rounded hover:bg-muted/50"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={selectedCalendarIds.has(calendar.id)}
                          onChange={() => handleToggleCalendarSelection(calendar.id)}
                          className="rounded"
                        />
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: calendar.color }}
                        />
                        <span className="text-sm font-medium">{calendar.name}</span>
                        {calendar.is_default && (
                          <span className="text-xs text-muted-foreground">(Default)</span>
                        )}
                      </div>
                      <div className="flex items-center space-x-1">
                        <button
                          onClick={() => handleToggleCalendarVisibility(calendar.id)}
                          className="p-1 hover:bg-muted rounded"
                          title={calendar.is_visible ? "Hide calendar" : "Show calendar"}
                        >
                          {calendar.is_visible ? (
                            <Eye className="w-3 h-3" />
                          ) : (
                            <EyeOff className="w-3 h-3 text-muted-foreground" />
                          )}
                        </button>
                        <button
                          onClick={() => openEditCalendarModal(calendar)}
                          className="p-1 hover:bg-muted rounded"
                          title="Edit calendar"
                        >
                          <Edit className="w-3 h-3" />
                        </button>
                        <button
                          onClick={() => openEditCalendarModal(calendar)}
                          className="p-1 hover:bg-muted rounded text-destructive"
                          title="Delete calendar"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Add Calendar Button */}
              <button
                onClick={openCreateCalendarModal}
                className="w-full mt-4 p-2 border-2 border-dashed border-muted-foreground/30 rounded-lg hover:border-primary/50 hover:bg-muted/30 transition-colors text-sm text-muted-foreground hover:text-foreground flex items-center justify-center space-x-2"
              >
                <Plus className="w-4 h-4" />
                <span>Add Calendar</span>
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Left edge tab to open Calendars when sidebar is hidden */}
      {!showCalendarSidebar && (
        <button
          onClick={() => setShowCalendarSidebar(true)}
          aria-label="Show calendars"
          className="absolute left-0 top-1/2 -translate-y-1/2 z-20 bg-primary text-primary-foreground rounded-r-md shadow px-2 py-3 hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary"
        >
          <CalendarIcon className="w-4 h-4" />
        </button>
      )}

      {/* Main Calendar - always flex-1; sidebar presence dictates remaining width */}
      <div ref={calendarContainerRef} className="aux-calendar-container flex-1 min-w-0 w-full flex flex-col transition-all duration-300">
        {/* Compact custom mobile toolbar (replaces FullCalendar header) */}
        {isMobile && (
          <div className="flex items-center justify-between gap-2 px-2 py-1">
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous"
                className="p-1 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-muted"
                onClick={() => calendarRef.current?.getApi().prev()}
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                aria-label="Next"
                className="p-1 rounded-md border border-gray-200 dark:border-gray-700 hover:bg-muted"
                onClick={() => calendarRef.current?.getApi().next()}
              >
                <ChevronRight className="w-4 h-4" />
              </button>
              <button
                type="button"
                className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 hover:bg-muted"
                onClick={() => calendarRef.current?.getApi().today()}
              >
                Today
              </button>
            </div>
            <div className="flex-1 min-w-0 text-center">
              <span className="text-sm font-semibold truncate">{calendarTitle}</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                className="px-2 py-1 text-xs rounded-md border border-gray-200 dark:border-gray-700 hover:bg-muted"
                onClick={() => {
                  const api = calendarRef.current?.getApi();
                  if (!api) return;
                  const order = ['dayGridMonth', 'timeGridWeek', 'listWeek'] as const;
                  const idx = order.indexOf((api.view as any)?.type ?? 'timeGridWeek');
                  const next = order[(idx + 1) % order.length];
                  api.changeView(next);
                }}
              >
                View
              </button>
            </div>
          </div>
        )}
        <FullCalendar
        ref={calendarRef}
        plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin, listPlugin, multiMonthPlugin]}
        headerToolbar={isMobile ? (false as any) : {
          left: 'prev,next today',
          center: 'title',
          right: 'dayGridMonth,timeGridWeek,timeGridDay,listWeek'
        }}
        buttonText={isMobile ? {
          today: 'Tdy',
          month: 'M',
          week: 'W',
          day: 'D',
          list: 'L'
        } : {
          today: 'Today',
          month: 'Month',
          week: 'Week',
          day: 'Day',
          list: 'List'
        }}
        views={{
          dayGridMonth: { titleFormat: { month: 'short', year: 'numeric' } as any },
          timeGridWeek: { titleFormat: { month: 'short', day: 'numeric' } as any },
          timeGridDay: { titleFormat: { month: 'short', day: 'numeric' } as any },
          listWeek: { titleFormat: { month: 'short', day: 'numeric' } as any }
        }}
        datesSet={(arg) => setCalendarTitle(arg.view.title)}
        initialView='timeGridWeek'
        editable={true}
        selectable={true}
        selectMirror={true}
        dayMaxEvents={showAllDay ? 2 : false}
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
        // Time settings - Improved for better event duration rendering
        slotMinTime="00:00:00"
        slotMaxTime="24:00:00"
        // Start scrolled to 9 AM on initial load
        scrollTime="09:00:00"
        slotDuration="00:30:00"  // Smaller slots for better precision
        slotLabelInterval="01:00:00"
        snapDuration="00:05:00"  // Finer snapping for precise times
        // All-day settings - More compact
        allDaySlot={showAllDay}
        allDayText={showAllDay ? "All Day" : ""}
        dayHeaderFormat={{ weekday: 'short', month: 'numeric', day: 'numeric' }}
        // Event rendering - Allow smaller events
        eventMinHeight={15}  // Smaller minimum height for short events
        eventShortHeight={20}  // Height for events under 30 minutes
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
          allDay: selectedSlot.allDay,
        } : undefined}
      />

      {/* Calendar Management Modal */}
      <CalendarManagementModal
        isOpen={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onSave={handleSaveCalendar}
        onDelete={handleDeleteCalendar}
        calendar={editingCalendar}
        mode={calendarModalMode}
      />

      {/* Full-Featured Event Popover - Complete replacement for modal */}
      {showPopover && selectedEvent && (
          // Popover without screen-blocking overlay
          <div 
            ref={popoverRef}
            className="fixed z-50 w-[420px] bg-white dark:bg-gray-900 rounded-xl shadow-2xl border border-gray-200/60 dark:border-gray-700/60 max-h-[80vh] overflow-hidden"
            style={{
              left: popoverAnchor ? Math.min(popoverAnchor.getBoundingClientRect().right + 10, window.innerWidth - 400) : 100,
              top: popoverAnchor ? Math.min(popoverAnchor.getBoundingClientRect().top, window.innerHeight - 600) : 100,
            }}
          >
            {/* Header */}
            <div className="p-4 border-b border-gray-200/60 dark:border-gray-700/60 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/40 dark:to-purple-950/40">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold text-gray-900 dark:text-white">Edit Event</h3>
                <button 
                  onClick={() => setShowPopover(false)}
                  className="p-1.5 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Content - Scrollable */}
            <div className="p-4 space-y-4 max-h-96 overflow-y-auto" data-popover-form>
              {/* Title */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Title
                </label>
                <input 
                  type="text"
                  defaultValue={selectedEvent.title}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                  placeholder="Event title..."
                />
              </div>

              {/* Status */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <div className="relative">
                  <select 
                    defaultValue={selectedEvent.extendedProps.objective.status}
                    className="w-full appearance-none px-3 py-2 pr-9 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                  >
                    <option value="not_started">Not Started</option>
                    <option value="in_progress">In Progress</option>
                    <option value="completed">Completed</option>
                    <option value="blocked">Blocked</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                </div>
              </div>

              {/* Priority & Energy */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Priority (0–100%)
                  </label>
                  <input 
                    type="range"
                    min="0"
                    max="1"
                    step="0.1"
                    defaultValue={selectedEvent.extendedProps.objective.priority_score}
                    data-priority
                    className="w-full accent-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Energy Level
                  </label>
                  <div className="relative">
                    <select 
                      defaultValue={selectedEvent.extendedProps.objective.energy_requirement}
                      className="w-full appearance-none px-3 py-2 pr-9 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent shadow-sm"
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                  </div>
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea 
                  defaultValue={selectedEvent.extendedProps.objective.description || ''}
                  rows={3}
                  className="w-full px-3 py-2 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary focus:border-transparent resize-none shadow-sm max-h-56 overflow-auto"
                  placeholder="Add a description..."
                  onInput={(e) => {
                    const ta = e.currentTarget;
                    ta.style.height = 'auto';
                    const max = 224; // ~max-h-56 (14rem)
                    ta.style.height = Math.min(ta.scrollHeight, max) + 'px';
                  }}
                />
              </div>

              {/* Progress */}
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Progress ({selectedEvent.extendedProps.objective.completion_percentage}%)
                </label>
                <div className="flex items-center space-x-3">
                  <input 
                    type="range"
                    min="0"
                    max="100"
                    step="5"
                    defaultValue={selectedEvent.extendedProps.objective.completion_percentage}
                    className="flex-1 accent-blue-500"
                    data-completion
                    onChange={(e) => {
                      const label = e.target.previousElementSibling as HTMLLabelElement;
                      if (label) {
                        label.textContent = `Progress (${e.target.value}%)`;
                      }
                    }}
                  />
                  <span className="text-sm text-gray-600 dark:text-gray-400 w-12 text-right">
                    {selectedEvent.extendedProps.objective.completion_percentage}%
                  </span>
                </div>
              </div>

              {/* Time Info - Read-only display */}
              <div className="bg-gray-50 dark:bg-gray-900 rounded-md p-3">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-1">Time</div>
                <div className="text-sm text-gray-900 dark:text-white">
                  {new Date(selectedEvent.start).toLocaleString()} 
                  {selectedEvent.end && ` - ${new Date(selectedEvent.end).toLocaleString()}`}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Drag event to reschedule • Resize to change duration
                </div>
              </div>
            </div>

            {/* Footer Actions */}
            <div className="flex items-center justify-end gap-2 p-3 border-t border-gray-200/60 dark:border-gray-700/60">
              {/* Delete (icon-only) */}
              <button
                type="button"
                aria-label="Delete"
                title="Delete"
                className="p-2 rounded-md hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 dark:text-red-400 transition-colors"
                onClick={async () => {
                  try {
                    await onDelete(selectedEvent.extendedProps.objective.id);
                    setShowPopover(false);
                    onRefresh();
                  } catch (error) {
                    console.error('Error deleting:', error);
                  }
                }}
              >
                <Trash2 className="w-4 h-4" />
              </button>

              {/* Complete (icon-only) */}
              <button
                type="button"
                aria-label="Complete"
                title="Complete"
                className="p-2 rounded-md hover:bg-green-50 dark:hover:bg-green-900/20 text-green-600 dark:text-green-400 transition-colors"
                onClick={async () => {
                  try {
                    await onUpdate(selectedEvent.extendedProps.objective.id, {
                      status: ObjectiveStatus.COMPLETED,
                      completion_percentage: 100,
                    });
                    setShowPopover(false);
                    onRefresh();
                  } catch (error) {
                    console.error('Error completing:', error);
                  }
                }}
              >
                <Check className="w-4 h-4" />
              </button>

              {/* Open Full Editor (icon-only) */}
              <button
                type="button"
                aria-label="Open Full Editor"
                title="Open Full Editor"
                className="p-2 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-200 transition-colors"
                onClick={() => {
                  setShowPopover(false);
                  setShowModal(true);
                }}
              >
                <Edit className="w-4 h-4" />
              </button>

              {/* Save (text) */}
              <button
                type="button"
                className="ml-1 px-4 py-2 bg-primary hover:bg-primary/90 text-primary-foreground rounded-md transition-colors text-sm font-medium shadow"
                onClick={async () => {
                  const form = popoverRef.current?.querySelector('[data-popover-form]') as HTMLElement | null;
                  if (!form) return;
                  const title = (form.querySelector('input[type="text"]') as HTMLInputElement | null)?.value?.trim();
                  const selects = form.querySelectorAll('select') as NodeListOf<HTMLSelectElement>;
                  const status = selects[0]?.value as ObjectiveStatus;
                  const energy = selects[1]?.value as EnergyLevel;
                  const priorityStr = (form.querySelector('[data-priority]') as HTMLInputElement | null)?.value;
                  const priority = priorityStr ? parseFloat(priorityStr) : undefined;
                  const description = (form.querySelector('textarea') as HTMLTextAreaElement | null)?.value ?? '';
                  const completionStr = (form.querySelector('[data-completion]') as HTMLInputElement | null)?.value;
                  const completion = completionStr ? parseInt(completionStr) : undefined;

                  const updates: Partial<Objective> = {
                    title: title ?? selectedEvent.extendedProps.objective.title,
                    status,
                    priority_score: priority,
                    energy_requirement: energy,
                    description,
                    completion_percentage: completion,
                  };

                  try {
                    await onUpdate(selectedEvent.extendedProps.objective.id, updates);
                    setShowPopover(false);
                    onRefresh();
                  } catch (error) {
                    console.error('Error updating:', error);
                  }
                }}
              >
                Save
              </button>
            </div>
          </div>
        )}

{/* Note: Custom styles are now in /src/styles/fullcalendar.css */}
      
{/* Calendar Management Buttons */}
<div className="fixed bottom-4 right-4 z-10 flex flex-col space-y-2">
  <button 
    onClick={() => setShowCalendarSidebar(!showCalendarSidebar)}
    className="px-4 py-2 bg-primary text-primary-foreground rounded-md shadow-lg hover:bg-primary/90 transition-colors flex items-center space-x-2"
  >
    <CalendarIcon className="w-4 h-4" />
    <span>{showCalendarSidebar ? 'Hide Calendars' : 'Show Calendars'}</span>
  </button>
  
  <button 
    onClick={() => setShowAllDay(!showAllDay)}
    className="px-4 py-2 bg-secondary text-secondary-foreground rounded-md shadow-lg hover:bg-secondary/90 transition-colors"
  >
    {showAllDay ? 'Hide All-Day Section' : 'Show All-Day Section'}
  </button>
</div>
</div>
</motion.div>
);
} 