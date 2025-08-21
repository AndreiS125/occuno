"use client";

import { useQuery } from "@tanstack/react-query";
import { GanttChart } from "@/components/calendar/gantt-chart";
import { FullCalendarModern } from "@/components/calendar/fullcalendar-modern";
import { useCalendarView } from "@/components/layout/navigation";
import api, { objectivesApi } from "@/lib/api";
import toast from "react-hot-toast";
import { ObjectiveStatus } from "@/types";

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
    const isCompleting =
      updates?.status === ObjectiveStatus.COMPLETED ||
      (typeof updates?.completion_percentage === "number" && updates.completion_percentage >= 100);

    try {
      if (isCompleting) {
        const payload = { ...updates };
        if (!payload.status) payload.status = ObjectiveStatus.COMPLETED;
        if (
          typeof payload.completion_percentage !== "number" ||
          payload.completion_percentage < 100
        ) {
          payload.completion_percentage = 100;
        }

        const response = await api.put(`/objectives/${id}?include_gamification=true`, payload);
        const gamification = response?.data?.gamification;
        toast.success(`🎯 +${gamification?.total_xp_earned || 0} XP earned!`);
        if (gamification?.level_info?.leveled_up) {
          toast.success(`🎆 LEVEL UP! You reached level ${gamification.level_info.current_level}!`);
        }
      } else {
        await objectivesApi.update(id, updates);
        toast.success("Objective updated!");
      }
      refetch();
    } catch (error) {
      toast.error(isCompleting ? "Failed to complete objective" : "Failed to update objective");
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