import { useState, useEffect, useCallback, useRef } from "react";
import axios from "axios";
import { Objective, ObjectiveType } from "@/types";
import { objectivesApi } from "@/lib/api";
import toast from "react-hot-toast";

export interface UseObjectivesReturn {
  objectives: Objective[];
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
  create: (data: Partial<Objective>) => Promise<void>;
  update: (id: string, updates: Partial<Objective>) => Promise<void>;
  delete: (id: string) => Promise<void>;
  // Computed values
  activeObjectives: Objective[];
  completedObjectives: Objective[];
  mainObjectives: Objective[];
  tasks: Objective[];
  habits: Objective[];
}

export function useObjectives(): UseObjectivesReturn {
  const [objectives, setObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  // Load objectives
  const loadObjectives = useCallback(async () => {
    setLoading(true);
    setError(null);

    const isCanceled = (err: any) =>
      (axios as any).isCancel?.(err) || err?.code === "ERR_CANCELED" || err?.name === "CanceledError";

    let attempt = 0;
    const maxAttempts = 2; // 1 retry

    while (attempt < maxAttempts) {
      try {
        const { data } = await objectivesApi.list();
        if (!isMountedRef.current) return;
        setObjectives(data);
        break;
      } catch (err) {
        if (isCanceled(err)) {
          if (!isMountedRef.current) return;
          setError(err as Error);
          // Do not toast for canceled requests
          break;
        }
        attempt += 1;
        if (attempt >= maxAttempts) {
          if (!isMountedRef.current) return;
          const error = err as Error;
          setError(error);
          console.error("Failed to load objectives:", error);
          toast.error("Failed to load objectives");
          break;
        }
        // brief backoff before retry
        await new Promise((res) => setTimeout(res, 150));
      }
    }
    if (isMountedRef.current) setLoading(false);
  }, []);

  // Initial load
  useEffect(() => {
    loadObjectives();
  }, [loadObjectives]);

  // Create objective
  const create = useCallback(async (data: Partial<Objective>) => {
    try {
      if (data.objective_type === ObjectiveType.TASK) {
        await objectivesApi.createTask(data);
      } else {
        await objectivesApi.create(data);
      }
      toast.success("Objective created successfully!");
      await loadObjectives();
    } catch (err) {
      const error = err as Error;
      console.error("Failed to create objective:", error);
      toast.error("Failed to create objective");
      throw error;
    }
  }, [loadObjectives]);

  // Update objective
  const update = useCallback(async (id: string, updates: Partial<Objective>) => {
    try {
      await objectivesApi.update(id, updates);
      toast.success("Objective updated successfully!");
      await loadObjectives();
    } catch (err) {
      const error = err as Error;
      console.error("Failed to update objective:", error);
      toast.error("Failed to update objective");
      throw error;
    }
  }, [loadObjectives]);

  // Delete objective
  const deleteObjective = useCallback(async (id: string) => {
    try {
      await objectivesApi.delete(id);
      toast.success("Objective deleted successfully!");
      await loadObjectives();
    } catch (err) {
      const error = err as Error;
      console.error("Failed to delete objective:", error);
      toast.error("Failed to delete objective");
      throw error;
    }
  }, [loadObjectives]);

  // Computed values
  const activeObjectives = objectives.filter(obj => 
    obj.status === "in_progress" || obj.status === "not_started"
  );

  const completedObjectives = objectives.filter(obj => 
    obj.status === "completed"
  );

  const mainObjectives = objectives.filter(obj => 
    obj.objective_type === ObjectiveType.MAIN_OBJECTIVE
  );

  const tasks = objectives.filter(obj => 
    obj.objective_type === ObjectiveType.TASK
  );

  const habits = objectives.filter(obj => 
    obj.objective_type === ObjectiveType.HABIT
  );

  return {
    objectives,
    loading,
    error,
    refresh: loadObjectives,
    create,
    update,
    delete: deleteObjective,
    activeObjectives,
    completedObjectives,
    mainObjectives,
    tasks,
    habits,
  };
} 