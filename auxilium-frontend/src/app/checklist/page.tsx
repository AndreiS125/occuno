"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, CheckCircle, Circle, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Objective, ObjectiveStatus } from "@/types";
import { objectivesApi } from "@/lib/api";
import { ObjectiveModal } from "@/components/modals/objective-modal";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ChecklistPage() {
  const [nonTimedObjectives, setNonTimedObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  useEffect(() => {
    fetchNonTimedObjectives();
  }, []);

  const fetchNonTimedObjectives = async () => {
    try {
      setLoading(true);
      const response = await objectivesApi.getAll();
      // Filter for non-timed objectives  
      const nonTimed = response.filter((obj: any) => obj.is_timed === false);
      setNonTimedObjectives(nonTimed);
    } catch (error) {
      console.error("Failed to fetch non-timed objectives:", error);
      toast.error("Failed to load checklist items");
    } finally {
      setLoading(false);
    }
  };

  const toggleObjectiveStatus = async (objective: Objective) => {
    try {
      const newStatus = objective.status === ObjectiveStatus.COMPLETED 
        ? ObjectiveStatus.NOT_STARTED 
        : ObjectiveStatus.COMPLETED;
      
      await objectivesApi.update(objective.id, { status: newStatus });
      toast.success(newStatus === ObjectiveStatus.COMPLETED ? "Item completed!" : "Item unmarked");
      fetchNonTimedObjectives();
    } catch (error) {
      console.error("Failed to update objective:", error);
      toast.error("Failed to update item");
    }
  };

  const handleCreateObjective = async (data: any) => {
    try {
      await objectivesApi.create({ ...data, is_timed: false });
      toast.success("Checklist item created!");
      setShowCreateModal(false);
      fetchNonTimedObjectives();
    } catch (error) {
      console.error("Failed to create objective:", error);
      toast.error("Failed to create checklist item");
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="space-y-3">
            {[1,2,3].map(i => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Checklist</h1>
          <p className="text-muted-foreground mt-1">
            Non-time-bound objectives and tasks
          </p>
        </div>
        <Button onClick={() => setShowCreateModal(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Item
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card className="p-4">
          <div className="text-2xl font-bold text-blue-600">
            {nonTimedObjectives.length}
          </div>
          <div className="text-sm text-muted-foreground">Total Items</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-green-600">
            {nonTimedObjectives.filter(obj => obj.status === ObjectiveStatus.COMPLETED).length}
          </div>
          <div className="text-sm text-muted-foreground">Completed</div>
        </Card>
        <Card className="p-4">
          <div className="text-2xl font-bold text-orange-600">
            {nonTimedObjectives.filter(obj => obj.status !== ObjectiveStatus.COMPLETED).length}
          </div>
          <div className="text-sm text-muted-foreground">Pending</div>
        </Card>
      </div>

      {/* Checklist Items */}
      <div className="space-y-3">
        {nonTimedObjectives.length === 0 ? (
          <Card className="p-8 text-center">
            <div className="text-muted-foreground">
              <Circle className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No checklist items yet</h3>
              <p className="mb-4">Create your first non-timed objective or task.</p>
              <Button onClick={() => setShowCreateModal(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add First Item
              </Button>
            </div>
          </Card>
        ) : (
          nonTimedObjectives.map((objective, index) => (
            <motion.div
              key={objective.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className={cn(
                "p-4 transition-all duration-200 hover:shadow-md cursor-pointer",
                objective.status === ObjectiveStatus.COMPLETED && "opacity-60"
              )}>
                <div className="flex items-center gap-4">
                  <button
                    onClick={() => toggleObjectiveStatus(objective)}
                    className="flex-shrink-0"
                  >
                    {objective.status === ObjectiveStatus.COMPLETED ? (
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    ) : (
                      <Circle className="w-6 h-6 text-gray-400 hover:text-blue-600" />
                    )}
                  </button>
                  
                  <div className="flex-1 min-w-0">
                    <h3 className={cn(
                      "font-medium",
                      objective.status === ObjectiveStatus.COMPLETED && "line-through text-muted-foreground"
                    )}>
                      {objective.title}
                    </h3>
                    {objective.description && (
                      <p className="text-sm text-muted-foreground mt-1 line-clamp-2">
                        {objective.description}
                      </p>
                    )}
                    <div className="flex items-center gap-2 mt-2">
                      <Badge variant="outline" className="text-xs">
                        {objective.objective_type.replace('_', ' ')}
                      </Badge>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          objective.energy_requirement === 'high' && "border-red-300 text-red-700",
                          objective.energy_requirement === 'medium' && "border-yellow-300 text-yellow-700",
                          objective.energy_requirement === 'low' && "border-green-300 text-green-700"
                        )}
                      >
                        {objective.energy_requirement} energy
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        Priority: {Math.round(objective.priority_score * 100)}%
                      </Badge>
                    </div>
                  </div>
                  
                  <button className="flex-shrink-0 p-2 hover:bg-gray-100 rounded">
                    <MoreHorizontal className="w-4 h-4" />
                  </button>
                </div>
              </Card>
            </motion.div>
          ))
        )}
      </div>

      {/* Create Modal */}
      {showCreateModal && (
        <ObjectiveModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            fetchNonTimedObjectives();
          }}
          defaultToTask={true}
        />
      )}
    </div>
  );
}
