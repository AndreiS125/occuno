"use client";

import { useQuery } from "@tanstack/react-query";
import { GanttChart } from "@/components/calendar/gantt-chart";
import { FullCalendar } from "@/components/calendar/full-calendar";
import { useCalendarView } from "@/components/layout/navigation";
import { objectivesApi } from "@/lib/api";
import toast from "react-hot-toast";

export default function CalendarPage() {
  const { viewMode } = useCalendarView();

  const { data: objectives = [], refetch } = useQuery({
    queryKey: ['objectives-calendar'],
    queryFn: async () => {
      const data = await objectivesApi.getAll();
      return data;
    },
  });

  const handleUpdate = async (id: string, updates: any) => {
    try {
      await objectivesApi.update(id, updates);
      toast.success("Objective updated!");
      refetch();
    } catch (error) {
      toast.error("Failed to update objective");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await objectivesApi.delete(id);
      toast.success("Objective deleted!");
      refetch();
    } catch (error) {
      toast.error("Failed to delete objective");
    }
  };

  // Different container styles for different views - CRITICAL: Preserve exact original logic
  const containerClass = viewMode === "calendar" 
    ? "h-screen" // Full height for calendar (CRITICAL - DO NOT MODIFY)
    : "container mx-auto px-4 py-8"; // Normal container for Gantt

  return (
    <div className={containerClass}>
      {/* View Content - NO animations or wrappers that could interfere */}
      {viewMode === "gantt" ? (
        <GanttChart
          objectives={objectives}
          onUpdate={handleUpdate}
          onDelete={handleDelete}
          onRefresh={refetch}
        />
      ) : (
        <div className="h-full">
          <FullCalendar
            objectives={objectives}
            onUpdate={handleUpdate}
            onDelete={handleDelete}
            onCreate={async (objective) => {
              try {
                await objectivesApi.create(objective);
                toast.success("Event created!");
                refetch();
              } catch (error) {
                toast.error("Failed to create event");
              }
            }}
            onRefresh={refetch}
          />
        </div>
      )}

      {/* Simple Legend for calendar view only */}
      {viewMode === "calendar" && (
        <div className="mt-6 p-4 bg-card border rounded-lg">
          <h3 className="text-sm font-semibold mb-3">Event Colors</h3>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-blue-500" />
              <span className="text-sm">Not Started</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-amber-500" />
              <span className="text-sm">In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-emerald-500" />
              <span className="text-sm">Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500" />
              <span className="text-sm">Blocked</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-gray-500" />
              <span className="text-sm">Cancelled</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
} 