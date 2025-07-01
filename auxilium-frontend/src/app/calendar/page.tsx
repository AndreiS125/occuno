"use client";

import { useQuery } from "@tanstack/react-query";
import { GanttChart } from "@/components/calendar/gantt-chart";
import { FullCalendarModern } from "@/components/calendar/fullcalendar-modern";
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

  // Calendar view should fill the entire viewport height starting right below the navbar
  const containerClass = viewMode === "calendar" 
    ? "fixed top-16 left-0 right-0 bottom-0 overflow-hidden" // Position directly below navbar
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
          <FullCalendarModern
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
    </div>
  );
} 