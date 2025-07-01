"use client";

import { useCallback } from "react";
import { BaseModal } from "@/components/modals/base-modal";
import { ObjectiveForm } from "@/components/forms/objective-form";
import { Objective, Task } from "@/types";
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
        // Update existing objective
        await objectivesApi.update(initialData.id!, data);
      } else {
        // Create new objective
        if (data.objective_type === "task" && showTimeFields) {
          await objectivesApi.createTask(data);
        } else {
          await objectivesApi.create(data);
        }
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
      start_date: formatDateOnly(slotInfo.start),
      due_date: formatDateOnly(slotInfo.end),
    } : {
      start_time: formatDateTimeLocal(slotInfo.start),
      end_time: formatDateTimeLocal(slotInfo.end),
      start_date: formatDateOnly(slotInfo.start),
      due_date: formatDateOnly(slotInfo.end),
    })
  } : initialData;

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