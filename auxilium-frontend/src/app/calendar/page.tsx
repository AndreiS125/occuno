"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
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

  // Different container styles for different views
  const containerClass = viewMode === "calendar" 
    ? "h-screen" // Full height for calendar
    : "container mx-auto px-4 py-8"; // Normal container for Gantt

  return (
    <div className={containerClass}>
      {/* View Content */}
      <motion.div
        key={viewMode}
        initial={{ opacity: 0, x: viewMode === "gantt" ? -20 : 20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className={viewMode === "calendar" ? "h-full" : ""}
      >
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
      </motion.div>

      {/* Legend */}
      {viewMode === "calendar" && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 p-4 bg-card border rounded-lg"
        >
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
              <div className="w-4 h-4 rounded bg-green-500" />
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
        </motion.div>
      )}
    </div>
  );
} 