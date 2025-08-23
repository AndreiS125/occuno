"use client";

import { useCallback } from "react";
import { BaseModal } from "@/components/modals/base-modal";
import { ObjectiveForm } from "@/components/forms/objective-form";
import { Objective, Task, ObjectiveStatus } from "@/types";
import { objectivesApi } from "@/lib/api";
import { formatDateTimeLocal, formatDateOnly } from "@/lib/date-utils";
import toast from "react-hot-toast";

interface ObjectiveModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialData?: Partial<Objective | Task>;
  parentId?: string;
  slotInfo?: {
    start: Date;
    end: Date;
    allDay?: boolean;
  };
  showTimeFields?: boolean;
  defaultToTask?: boolean;
}

export function ObjectiveModal({
  isOpen,
  onClose,
  onSuccess,
  initialData,
  parentId,
  slotInfo,
  showTimeFields = true,
  defaultToTask = true,
}: ObjectiveModalProps) {
  const isEdit = !!initialData?.id;
  
  const handleSubmit = useCallback(async (data: any) => {
    try {
      if (isEdit) {
        // If saving as completed, use the gamified complete endpoint when transitioning
        const isCompleting = (data.status === ObjectiveStatus.COMPLETED) || (data.completion_percentage >= 100);
        const wasCompleted = (initialData?.status === ObjectiveStatus.COMPLETED);

        if (isCompleting && !wasCompleted) {
          const result = await objectivesApi.complete(initialData!.id as string);
          const xp = result?.gamification?.total_xp_earned ?? result?.gamification?.xp_earned ?? 0;
          toast.success(xp > 0 ? `Objective completed! +${xp} XP 🎉` : "Objective completed! ✅");
        } else {
          await objectivesApi.update(initialData!.id as string, data);
          toast.success("Objective updated successfully! ✅");
        }
      } else {
        // Create new objective
        if (data.objective_type === "task" && showTimeFields) {
          await objectivesApi.createTask(data);
        } else {
          await objectivesApi.create(data);
        }
        toast.success("Objective created successfully! 🎉");
      }

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error saving objective:", error);
      toast.error(isEdit ? "Failed to update objective" : "Failed to create objective");
      throw error;
    }
  }, [isEdit, initialData, showTimeFields, onSuccess, onClose]);

  const handleDelete = useCallback(async (id: string) => {
    try {
      await objectivesApi.delete(id);
      toast.success("Objective deleted successfully! 🗑️");
      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Error deleting objective:", error);
      toast.error("Failed to delete objective");
      throw error;
    }
  }, [onSuccess, onClose]);

  // Prepare initial data with slot info if available
  const preparedInitialData = slotInfo ? {
    ...initialData,
    all_day: slotInfo.allDay || false,
    ...(slotInfo.allDay ? {
      // For all-day events, use date fields
      start_date: formatDateOnly(slotInfo.start),
      due_date: formatDateOnly(slotInfo.end),
    } : {
      // For timed events, use datetime fields
      start_time: formatDateTimeLocal(slotInfo.start),
      end_time: formatDateTimeLocal(slotInfo.end),
    })
  } : initialData;

  // Debug logging
  if (slotInfo) {
    console.log("🔧 ObjectiveModal - slotInfo received:", {
      slotInfo,
      allDay: slotInfo.allDay,
      start: slotInfo.start,
      end: slotInfo.end,
      formattedStart: slotInfo.allDay ? formatDateOnly(slotInfo.start) : formatDateTimeLocal(slotInfo.start),
      formattedEnd: slotInfo.allDay ? formatDateOnly(slotInfo.end) : formatDateTimeLocal(slotInfo.end),
      preparedData: preparedInitialData
    });
  }
  
  console.log("🔧 ObjectiveModal - Final preparedInitialData:", preparedInitialData);

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={onClose}
      title={
        isEdit 
          ? "Edit Objective" 
          : parentId 
            ? "Create Sub-objective" 
            : "Create New Objective"
      }
      description={
        isEdit
          ? "Update the details of your objective"
          : "Fill in the details for your new objective"
      }
      size="lg"
    >
      <ObjectiveForm
        initialData={preparedInitialData}
        onSubmit={handleSubmit}
        onCancel={onClose}
        onDelete={isEdit ? handleDelete : undefined}
        parentId={parentId}
        showTimeFields={showTimeFields}
        defaultToTask={defaultToTask}
        submitLabel={isEdit ? "Update" : "Create"}
      />
    </BaseModal>
  );
} 