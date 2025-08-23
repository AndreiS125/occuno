"use client";

import { useCallback, useMemo, useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Plus,
  CheckCircle,
  Circle,
  MoreHorizontal,
  Calendar,
  Edit3,
  Search,
  Filter,
  AlertTriangle,
  Flame,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Objective, ObjectiveStatus, EnergyLevel } from "@/types";
import { objectivesApi } from "@/lib/api";
import { ObjectiveModal } from "@/components/modals/objective-modal";
import { cn } from "@/lib/utils";
import toast from "react-hot-toast";

export default function ChecklistPage() {
  const [nonTimedObjectives, setNonTimedObjectives] = useState<Objective[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editObjective, setEditObjective] = useState<Objective | null>(null);
  const [view, setView] = useState<"matrix" | "list">("matrix");
  const [query, setQuery] = useState("");
  const [energyFilter, setEnergyFilter] = useState<EnergyLevel | "all">("all");

  useEffect(() => {
    fetchNonTimedObjectives();
  }, []);

  const normalize = (obj: any): Objective => ({
    ...obj,
    context_tags: Array.isArray(obj.context_tags) ? obj.context_tags : [],
    success_criteria: Array.isArray(obj.success_criteria) ? obj.success_criteria : [],
  });

  const fetchNonTimedObjectives = async () => {
    try {
      setLoading(true);
      const response = await objectivesApi.getAll();
      // Filter for non-timed objectives  
      const nonTimed = response
        .filter((obj: any) => obj.is_timed === false)
        .map(normalize);
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

  const updateTags = useCallback(async (objective: Objective, updates: { urgent?: boolean; important?: boolean; }) => {
    const tags = new Set(objective.context_tags || []);
    if (updates.urgent !== undefined) {
      if (updates.urgent) tags.add("urgent"); else tags.delete("urgent");
    }
    if (updates.important !== undefined) {
      if (updates.important) tags.add("important"); else tags.delete("important");
    }
    try {
      await objectivesApi.update(objective.id, { context_tags: Array.from(tags) as any });
      fetchNonTimedObjectives();
    } catch (e) {
      toast.error("Failed to update tags");
    }
  }, []);

  const planObjective = useCallback((objective: Objective) => {
    // Open edit modal with time fields visible and is_timed set to true
    setEditObjective({ ...objective, // @ts-ignore allow temporary flag
      is_timed: true,
      objective_type: objective.objective_type || "task",
    } as any);
  }, []);

  const updateInline = useCallback(async (objective: Objective, patch: Partial<Objective>) => {
    try {
      await objectivesApi.update(objective.id, patch as any);
      fetchNonTimedObjectives();
      toast.success("Updated");
    } catch (e) {
      toast.error("Update failed");
    }
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return nonTimedObjectives.filter((o) => {
      if (energyFilter !== "all" && (o.energy_requirement as any) !== energyFilter) return false;
      if (!q) return true;
      return (
        o.title.toLowerCase().includes(q) ||
        (o.description || "").toLowerCase().includes(q) ||
        (o.context_tags || []).some((t) => t.toLowerCase().includes(q))
      );
    });
  }, [nonTimedObjectives, query, energyFilter]);

  const isImportant = (o: Objective) => (o.context_tags || []).includes("important") || (o.priority_score ?? 0) >= 0.6;
  const isUrgent = (o: Objective) => (o.context_tags || []).includes("urgent");

  const quadrants = useMemo(() => {
    const Q1: Objective[] = []; // Important + Urgent (Do)
    const Q2: Objective[] = []; // Important + Not Urgent (Schedule)
    const Q3: Objective[] = []; // Not Important + Urgent (Delegate)
    const Q4: Objective[] = []; // Not Important + Not Urgent (Eliminate)
    for (const o of filtered) {
      const imp = isImportant(o);
      const urg = isUrgent(o);
      if (imp && urg) Q1.push(o);
      else if (imp && !urg) Q2.push(o);
      else if (!imp && urg) Q3.push(o);
      else Q4.push(o);
    }
    return { Q1, Q2, Q3, Q4 };
  }, [filtered]);

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
    <div className="max-w-6xl mx-auto p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold">Checklist</h1>
          <p className="text-muted-foreground mt-1">Manage non-time-bound objectives efficiently</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden sm:flex items-center gap-2 mr-2">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search..."
                className="pl-9 pr-3 py-2 bg-white border rounded-md text-sm w-56"
              />
            </div>
            <div className="flex items-center gap-2">
              <Filter className="w-4 h-4 text-muted-foreground" />
              <select
                value={energyFilter}
                onChange={(e) => setEnergyFilter(e.target.value as any)}
                className="py-2 px-2 border rounded-md text-sm bg-white"
              >
                <option value="all">All energy</option>
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
              </select>
            </div>
          </div>
          <div className="bg-gray-100 rounded-md p-1 flex">
            <button
              onClick={() => setView("matrix")}
              className={cn("px-3 py-1 rounded text-sm", view === "matrix" ? "bg-white shadow" : "text-muted-foreground")}
            >Matrix</button>
            <button
              onClick={() => setView("list")}
              className={cn("px-3 py-1 rounded text-sm", view === "list" ? "bg-white shadow" : "text-muted-foreground")}
            >List</button>
          </div>
          <Button onClick={() => setShowCreateModal(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Item
          </Button>
        </div>
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

      {/* Content Views */}
      {filtered.length === 0 ? (
        <Card className="p-8 text-center">
          <div className="text-muted-foreground">
            <Circle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <h3 className="text-lg font-medium mb-2">No checklist items</h3>
            <p className="mb-4">Create your first non-timed objective or task.</p>
            <Button onClick={() => setShowCreateModal(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Add First Item
            </Button>
          </div>
        </Card>
      ) : view === "matrix" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Q1 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-600" />
                <h3 className="font-semibold">Important + Urgent</h3>
              </div>
              <Badge variant="outline">{quadrants.Q1.length}</Badge>
            </div>
            <Separator className="my-2" />
            <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
              {quadrants.Q1.map((o) => (
                <MatrixItem
                  key={o.id}
                  o={o}
                  onToggleComplete={() => toggleObjectiveStatus(o)}
                  onEdit={() => setEditObjective(o)}
                  onPlan={() => planObjective(o)}
                  onUrgent={(v: boolean) => updateTags(o, { urgent: v })}
                  onImportant={(v: boolean) => updateTags(o, { important: v })}
                  onInlineUpdate={(p: Partial<Objective>) => updateInline(o, p)}
                  urgent={true}
                  important={true}
                />
              ))}
            </div>
          </Card>
          {/* Q2 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-600" />
                <h3 className="font-semibold">Important + Not Urgent</h3>
              </div>
              <Badge variant="outline">{quadrants.Q2.length}</Badge>
            </div>
            <Separator className="my-2" />
            <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
              {quadrants.Q2.map((o) => (
                <MatrixItem
                  key={o.id}
                  o={o}
                  onToggleComplete={() => toggleObjectiveStatus(o)}
                  onEdit={() => setEditObjective(o)}
                  onPlan={() => planObjective(o)}
                  onUrgent={(v: boolean) => updateTags(o, { urgent: v })}
                  onImportant={(v: boolean) => updateTags(o, { important: v })}
                  onInlineUpdate={(p: Partial<Objective>) => updateInline(o, p)}
                  urgent={false}
                  important={true}
                />
              ))}
            </div>
          </Card>
          {/* Q3 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Zap className="w-4 h-4 text-orange-600" />
                <h3 className="font-semibold">Not Important + Urgent</h3>
              </div>
              <Badge variant="outline">{quadrants.Q3.length}</Badge>
            </div>
            <Separator className="my-2" />
            <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
              {quadrants.Q3.map((o) => (
                <MatrixItem
                  key={o.id}
                  o={o}
                  onToggleComplete={() => toggleObjectiveStatus(o)}
                  onEdit={() => setEditObjective(o)}
                  onPlan={() => planObjective(o)}
                  onUrgent={(v: boolean) => updateTags(o, { urgent: v })}
                  onImportant={(v: boolean) => updateTags(o, { important: v })}
                  onInlineUpdate={(p: Partial<Objective>) => updateInline(o, p)}
                  urgent={true}
                  important={false}
                />
              ))}
            </div>
          </Card>
          {/* Q4 */}
          <Card className="p-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Flame className="w-4 h-4 text-gray-500" />
                <h3 className="font-semibold">Not Important + Not Urgent</h3>
              </div>
              <Badge variant="outline">{quadrants.Q4.length}</Badge>
            </div>
            <Separator className="my-2" />
            <div className="space-y-2 max-h-[420px] overflow-auto pr-1">
              {quadrants.Q4.map((o) => (
                <MatrixItem
                  key={o.id}
                  o={o}
                  onToggleComplete={() => toggleObjectiveStatus(o)}
                  onEdit={() => setEditObjective(o)}
                  onPlan={() => planObjective(o)}
                  onUrgent={(v: boolean) => updateTags(o, { urgent: v })}
                  onImportant={(v: boolean) => updateTags(o, { important: v })}
                  onInlineUpdate={(p: Partial<Objective>) => updateInline(o, p)}
                  urgent={false}
                  important={false}
                />
              ))}
            </div>
          </Card>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((objective, index) => (
            <motion.div
              key={objective.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.02 }}
            >
              <ListItem
                o={objective}
                onToggleComplete={() => toggleObjectiveStatus(objective)}
                onEdit={() => setEditObjective(objective)}
                onPlan={() => planObjective(objective)}
                onUrgent={(v: boolean) => updateTags(objective, { urgent: v })}
                onImportant={(v: boolean) => updateTags(objective, { important: v })}
                onInlineUpdate={(p: Partial<Objective>) => updateInline(objective, p)}
              />
            </motion.div>
          ))}
        </div>
      )}

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

      {/* Edit/Plan Modal */}
      {editObjective && (
        <ObjectiveModal
          isOpen={true}
          onClose={() => setEditObjective(null)}
          onSuccess={() => {
            setEditObjective(null);
            fetchNonTimedObjectives();
          }}
          initialData={editObjective as any}
          showTimeFields={true}
          defaultToTask={true}
        />
      )}
    </div>
  );
}

// --- Components ---
function MatrixItem({
  o,
  onToggleComplete,
  onEdit,
  onPlan,
  onUrgent,
  onImportant,
  onInlineUpdate,
  urgent,
  important,
}: {
  o: Objective;
  onToggleComplete: () => void;
  onEdit: () => void;
  onPlan: () => void;
  onUrgent: (v: boolean) => void;
  onImportant: (v: boolean) => void;
  onInlineUpdate: (p: Partial<Objective>) => void;
  urgent: boolean;
  important: boolean;
}) {
  return (
    <Card className={cn("p-3 hover:shadow-sm transition", o.status === ObjectiveStatus.COMPLETED && "opacity-60")}> 
      <div className="flex items-start gap-3">
        <button onClick={onToggleComplete} className="mt-1">
          {o.status === ObjectiveStatus.COMPLETED ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : (
            <Circle className="w-5 h-5 text-gray-400 hover:text-blue-600" />
          )}
        </button>
        <div className="flex-1 min-w-0">
          <InlineEditableText
            className={cn("font-medium", o.status === ObjectiveStatus.COMPLETED && "line-through text-muted-foreground")}
            text={o.title}
            onSave={(val) => onInlineUpdate({ title: val } as any)}
          />
          {!!o.description && (
            <InlineEditableText
              className="text-sm text-muted-foreground mt-1"
              text={o.description}
              onSave={(val) => onInlineUpdate({ description: val } as any)}
            />
          )}
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <Badge variant="outline" className="text-xs">{o.objective_type?.toString().replace("_", " ")}</Badge>
            <Badge variant="outline" className={cn("text-xs", (o.energy_requirement as any) === 'high' && "border-red-300 text-red-700", (o.energy_requirement as any) === 'medium' && "border-yellow-300 text-yellow-700", (o.energy_requirement as any) === 'low' && "border-green-300 text-green-700")}>{o.energy_requirement} energy</Badge>
            <Badge variant="outline" className="text-xs">Priority: {Math.round((o.priority_score ?? 0) * 100)}%</Badge>
            {urgent && <Badge className="text-xs" variant="secondary">Urgent</Badge>}
            {important && <Badge className="text-xs" variant="secondary">Important</Badge>}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <button onClick={onEdit} className="p-1 hover:bg-gray-100 rounded" title="Edit">
            <Edit3 className="w-4 h-4" />
          </button>
          <button onClick={onPlan} className="p-1 hover:bg-gray-100 rounded" title="Plan (schedule)">
            <Calendar className="w-4 h-4" />
          </button>
          <DropdownQuick o={o} onUrgent={onUrgent} onImportant={onImportant} />
        </div>
      </div>
    </Card>
  );
}

function ListItem(props: any) {
  return (
    <MatrixItem {...props} urgent={(props.o.context_tags || []).includes('urgent')} important={(props.o.context_tags || []).includes('important')} />
  );
}

function InlineEditableText({ text, onSave, className }: { text: string; onSave: (val: string) => void; className?: string; }) {
  const [editing, setEditing] = useState(false);
  const [value, setValue] = useState(text);
  useEffect(() => setValue(text), [text]);
  const commit = () => {
    const v = value.trim();
    if (v && v !== text) onSave(v);
    setEditing(false);
  };
  return editing ? (
    <input
      autoFocus
      value={value}
      onChange={(e) => setValue(e.target.value)}
      onBlur={commit}
      onKeyDown={(e) => { if (e.key === 'Enter') commit(); if (e.key === 'Escape') setEditing(false); }}
      className={cn("border rounded px-2 py-1 w-full", className)}
    />
  ) : (
    <div className={cn("cursor-text", className)} onClick={() => setEditing(true)}>{text || "Untitled"}</div>
  );
}

function DropdownQuick({ o, onUrgent, onImportant }: { o: Objective; onUrgent: (v: boolean) => void; onImportant: (v: boolean) => void; }) {
  const urgent = (o.context_tags || []).includes('urgent');
  const important = (o.context_tags || []).includes('important');
  return (
    <div className="relative group">
      <button className="p-1 hover:bg-gray-100 rounded" title="Quick actions">
        <MoreHorizontal className="w-4 h-4" />
      </button>
      <div className="absolute right-0 mt-1 hidden group-hover:block bg-white border rounded shadow-md z-10 min-w-[160px]">
        <button onClick={() => onUrgent(!urgent)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">
          {urgent ? "Unmark Urgent" : "Mark Urgent"}
        </button>
        <button onClick={() => onImportant(!important)} className="w-full text-left px-3 py-2 hover:bg-gray-50 text-sm">
          {important ? "Unmark Important" : "Mark Important"}
        </button>
      </div>
    </div>
  );
}
