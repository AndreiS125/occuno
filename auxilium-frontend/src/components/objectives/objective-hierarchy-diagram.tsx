"use client";

import { useState, useRef } from "react";
import { Objective, ObjectiveType, ObjectiveStatus } from "@/types";
import { gsap } from "gsap";
import { useGSAP } from "@gsap/react";
import { 
  AlertCircle, 
  Target, 
  CheckCircle, 
  Clock,
  ChevronRight,
  Edit,
  Plus,
  GripVertical,
  ArrowRight,
  Check,
  X
} from "lucide-react";
import { objectivesApi } from "@/lib/api";
import { ObjectiveModal } from "@/components/modals";
import { Button } from "@/components/ui";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

interface ObjectiveHierarchyDiagramProps {
  objectives: Objective[];
  onUpdate?: (id: string, updates: any) => void;
  onDelete?: (id: string) => void;
  onRefresh?: () => void;
}

interface TreeNode extends Objective {
  children: TreeNode[];
  level: number;
}

interface DragState {
  draggedNode: TreeNode | null;
  dragTarget: TreeNode | null;
  isDragging: boolean;
  dragPosition: 'over' | 'before' | 'after' | null;
}

export function ObjectiveHierarchyDiagram({ 
  objectives, 
  onUpdate, 
  onDelete, 
  onRefresh 
}: ObjectiveHierarchyDiagramProps) {
  const [editingObjective, setEditingObjective] = useState<Objective | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [createParentId, setCreateParentId] = useState<string | null>(null);
  const [dragState, setDragState] = useState<DragState>({
    draggedNode: null,
    dragTarget: null,
    isDragging: false,
    dragPosition: null
  });

  // Refs for GSAP animations
  const containerRef = useRef<HTMLDivElement>(null);
  const dragPreviewRef = useRef<HTMLDivElement>(null);

  // Build tree structure with level information
  const buildTree = (parentId: string | null = null, level: number = 0): TreeNode[] => {
    return objectives
      .filter(obj => obj.parent_id === parentId)
      .map(obj => ({
        ...obj,
        level,
        children: buildTree(obj.id, level + 1)
      }));
  };

  const rootNodes = buildTree(null, 0);

  const typeIcons = {
    [ObjectiveType.MAIN_OBJECTIVE]: <AlertCircle className="w-4 h-4" />,
    [ObjectiveType.SUB_OBJECTIVE]: <Target className="w-4 h-4" />,
    [ObjectiveType.TASK]: <CheckCircle className="w-4 h-4" />
  };

  const typeStyles = {
    [ObjectiveType.MAIN_OBJECTIVE]: "from-purple-600/30 to-purple-700/20 border-purple-600/60",
    [ObjectiveType.SUB_OBJECTIVE]: "from-blue-600/30 to-blue-700/20 border-blue-600/60",
    [ObjectiveType.TASK]: "from-green-600/30 to-green-700/20 border-green-600/60"
  };

  const statusStyles = {
    [ObjectiveStatus.COMPLETED]: "border-green-600/80 bg-green-100/80",
    [ObjectiveStatus.IN_PROGRESS]: "border-blue-600/80 bg-blue-100/80",
    [ObjectiveStatus.BLOCKED]: "border-red-600/80 bg-red-100/80",
    [ObjectiveStatus.NOT_STARTED]: "border-gray-500/80 bg-gray-100/80",
    [ObjectiveStatus.CANCELLED]: "border-gray-400/80 bg-gray-200/80"
  };

  // Handle drag operations
  const handleDragStart = (e: React.DragEvent, node: TreeNode) => {
    console.log("🚀 Drag start:", node.title);
    
    setDragState(prev => ({
      ...prev,
      draggedNode: node,
      isDragging: true
    }));

    // Create custom drag preview
    if (dragPreviewRef.current) {
      gsap.set(dragPreviewRef.current, {
        opacity: 0.8,
        scale: 0.9,
        rotationZ: 2
      });
    }

    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', node.id);
  };

  const handleDragEnd = () => {
    console.log("🏁 Drag end");
    
    setDragState({
      draggedNode: null,
      dragTarget: null,
      isDragging: false,
      dragPosition: null
    });

    // Reset any drag styling
    document.querySelectorAll('.drag-over').forEach(el => {
      el.classList.remove('drag-over', 'drag-before', 'drag-after');
    });
  };

  const handleDragOver = (e: React.DragEvent, targetNode: TreeNode) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = 'move';

    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const y = e.clientY - rect.top;
    const height = rect.height;
    
    let position: 'over' | 'before' | 'after' = 'over';
    if (y < height * 0.25) {
      position = 'before';
    } else if (y > height * 0.75) {
      position = 'after';
    }

    setDragState(prev => ({
      ...prev,
      dragTarget: targetNode,
      dragPosition: position
    }));
    
    console.log(`📍 Drag over: ${targetNode.title} (${position})`);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    // Only clear if we're leaving the entire node area
    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
      setDragState(prev => ({
        ...prev,
        dragTarget: null,
        dragPosition: null
      }));
    }
  };

  const handleDrop = async (e: React.DragEvent, targetNode: TreeNode) => {
    e.preventDefault();
    
    const { draggedNode, dragPosition } = dragState;
    if (!draggedNode || draggedNode.id === targetNode.id) {
      handleDragEnd();
      return;
    }

    // Prevent dropping parent onto its own descendant
    if (isDescendant(targetNode, draggedNode)) {
      toast.error("Cannot move an objective into its own sub-objective");
      handleDragEnd();
      return;
    }

    try {
      let newParentId: string | null = null;
      let updates: any = {};

      if (dragPosition === 'over') {
        // Drop on the node makes it a child
        newParentId = targetNode.id;
        updates.parent_id = newParentId;
        
        // Handle objective type changes when dragging main objectives
        if (draggedNode.objective_type === ObjectiveType.MAIN_OBJECTIVE && 
            targetNode.objective_type === ObjectiveType.MAIN_OBJECTIVE) {
          // Main objective dropped into another main objective becomes a sub-objective
          updates.objective_type = ObjectiveType.SUB_OBJECTIVE;
          toast.success("Main objective converted to sub-objective");
        }
      } else {
        // Drop before/after makes it a sibling
        newParentId = targetNode.parent_id || null;
        updates.parent_id = newParentId;  // Use null explicitly, not undefined
        
        // If dropping next to a root objective, convert sub-objective to main objective
        if (newParentId === null && draggedNode.objective_type === ObjectiveType.SUB_OBJECTIVE) {
          updates.objective_type = ObjectiveType.MAIN_OBJECTIVE;
          toast.success("Sub-objective converted to main objective");
        }
      }

      console.log("📝 Updating objective with:", updates);
      
      // Update the objective
      await objectivesApi.update(draggedNode.id, updates);
      
      toast.success("Objective moved successfully!");
      onRefresh?.();
      
      // Animate success
      gsap.to(e.currentTarget, {
        scale: 1.05,
        duration: 0.2,
        yoyo: true,
        repeat: 1,
        ease: "power2.inOut"
      });

    } catch (error) {
      console.error("Failed to move objective:", error);
      toast.error("Failed to move objective");
    }

    handleDragEnd();
  };

  // Check if potential child is a descendant of potential parent
  const isDescendant = (potentialChild: TreeNode, potentialParent: TreeNode): boolean => {
    if (potentialChild.parent_id === potentialParent.id) return true;
    
    const parent = findNodeById(potentialChild.parent_id || null);
    if (!parent) return false;
    
    return isDescendant(parent, potentialParent);
  };

  const findNodeById = (id: string | null): TreeNode | null => {
    if (!id) return null;
    
    const findInTree = (nodes: TreeNode[]): TreeNode | null => {
      for (const node of nodes) {
        if (node.id === id) return node;
        const found = findInTree(node.children);
        if (found) return found;
      }
      return null;
    };
    
    return findInTree(rootNodes);
  };

  // Handle objective editing
  const handleEdit = (objective: Objective) => {
    setEditingObjective(objective);
  };

  const handleCreate = (parentId: string) => {
    setCreateParentId(parentId);
    setShowCreateModal(true);
  };

  const handleModalSuccess = () => {
    setEditingObjective(null);
    setShowCreateModal(false);
    setCreateParentId(null);
    onRefresh?.();
  };

  // GSAP Animations
  useGSAP(() => {
    if (rootNodes.length === 0) return;

    // Animate nodes entrance
    gsap.fromTo(".hierarchy-node", 
      { opacity: 0, x: -20, scale: 0.95 },
      { 
        opacity: 1, 
        x: 0, 
        scale: 1,
        duration: 0.25, 
        stagger: 0.05,
        ease: "back.out(1.2)"
      }
    );

    // Animate connection lines
    gsap.fromTo(".connection-line", 
      { scaleX: 0, opacity: 0 },
      { 
        scaleX: 1, 
        opacity: 1,
        duration: 0.2, 
        delay: 0.1,
        stagger: 0.02,
        ease: "power2.out"
      }
    );

  }, { dependencies: [rootNodes.length] });

  const renderNode = (node: TreeNode, isLast: boolean = true) => {
    const hasChildren = node.children && node.children.length > 0;
    const { draggedNode, dragTarget, dragPosition, isDragging } = dragState;
    
    const isDraggedOver = dragTarget?.id === node.id;
    const isBeingDragged = draggedNode?.id === node.id;

    return (
      <div key={node.id} className="relative">
        {/* Connection Lines */}
        {node.level > 0 && (
          <>
            {/* Vertical line from parent */}
            <div 
              className="connection-line absolute border-l-2 border-dashed border-muted-foreground/30"
              style={{
                left: `${(node.level - 1) * 32 - 16}px`,
                top: '-24px',
                height: '44px'
              }}
            />
            {/* Horizontal line to node */}
            <div 
              className="connection-line absolute border-t-2 border-dashed border-muted-foreground/30"
              style={{
                left: `${(node.level - 1) * 32 - 16}px`,
                top: '20px',
                width: '32px'
              }}
            />
          </>
        )}

        {/* Node */}
        <div 
          className={cn(
            "hierarchy-node flex items-start mb-6 relative",
            `ml-${node.level * 8}`
          )}
          style={{ marginLeft: `${node.level * 32}px` }}
        >
          <div 
            draggable
            onDragStart={(e) => handleDragStart(e, node)}
            onDragEnd={handleDragEnd}
            onDragOver={(e) => handleDragOver(e, node)}
            onDragLeave={handleDragLeave}
            onDrop={(e) => handleDrop(e, node)}
            className={cn(
              "group relative bg-gradient-to-br border-2 rounded-xl p-4 min-w-[280px] max-w-[400px]",
              "cursor-move transition-all duration-100 hover:shadow-lg",
              typeStyles[node.objective_type],
              statusStyles[node.status],
              isBeingDragged && "opacity-50 scale-95",
              isDraggedOver && dragPosition === 'over' && "ring-2 ring-primary ring-offset-2",
              isDraggedOver && dragPosition === 'before' && "border-t-4 border-t-primary",
              isDraggedOver && dragPosition === 'after' && "border-b-4 border-b-primary",
              isDragging && !isBeingDragged && "hover:ring-2 hover:ring-primary/50"
            )}
            onClick={() => handleEdit(node)}
          >
            {/* Drag Handle */}
            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
              <GripVertical className="w-4 h-4 text-muted-foreground/60" />
            </div>

            <div className="flex items-start space-x-3 w-full pl-2">
              <div className="mt-0.5">
                {typeIcons[node.objective_type]}
              </div>
              
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-sm truncate pr-2">{node.title}</h4>
                  
                  {/* Action Buttons */}
                  <div className="flex items-center space-x-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-7 w-7 p-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(node);
                      }}
                    >
                      <Edit className="w-3 h-3" />
                    </Button>
                    
                    {node.objective_type !== ObjectiveType.TASK && (
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-7 w-7 p-1"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCreate(node.id);
                        }}
                      >
                        <Plus className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                </div>

                {node.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                    {node.description}
                  </p>
                )}

                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <span className={cn(
                      "text-xs px-2 py-0.5 rounded-full font-medium",
                      node.status === ObjectiveStatus.COMPLETED ? "bg-green-500/20 text-green-700" :
                      node.status === ObjectiveStatus.IN_PROGRESS ? "bg-blue-500/20 text-blue-700" :
                      node.status === ObjectiveStatus.BLOCKED ? "bg-red-500/20 text-red-700" :
                      "bg-gray-500/20 text-gray-700"
                    )}>
                      {node.status.replace("_", " ")}
                    </span>
                    
                    {node.completion_percentage > 0 && (
                      <span className="text-xs text-muted-foreground font-medium">
                        {node.completion_percentage}%
                      </span>
                    )}
                  </div>

                  {hasChildren && (
                    <div className="flex items-center space-x-1 text-muted-foreground">
                      <ArrowRight className="w-3 h-3" />
                      <span className="text-xs">{node.children.length}</span>
                    </div>
                  )}
                </div>

                {/* Progress Bar */}
                {node.status === ObjectiveStatus.IN_PROGRESS && node.completion_percentage > 0 && (
                  <div className="mt-2">
                    <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-primary transition-all duration-150"
                        style={{ width: `${node.completion_percentage}%` }}
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Drop Zone Indicators */}
            {isDraggedOver && (
              <div className="absolute inset-0 pointer-events-none">
                {dragPosition === 'before' && (
                  <div className="absolute -top-1 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
                {dragPosition === 'after' && (
                  <div className="absolute -bottom-1 left-0 right-0 h-1 bg-primary rounded-full" />
                )}
                {dragPosition === 'over' && (
                  <div className="absolute inset-0 border-2 border-primary rounded-xl border-dashed bg-primary/5" />
                )}
              </div>
            )}
          </div>
        </div>

        {/* Children */}
        {hasChildren && (
          <div className="relative">
            {/* Vertical line connecting children */}
            {node.children.length > 1 && (
              <div 
                className="connection-line absolute border-l-2 border-dashed border-muted-foreground/30"
                style={{
                  left: `${node.level * 32 + 16}px`,
                  top: '0',
                  height: `calc(100% - 48px)`
                }}
              />
            )}
            
            {node.children.map((child: TreeNode, index: number) => 
              renderNode(child, index === node.children.length - 1)
            )}
          </div>
        )}
      </div>
    );
  };

  if (rootNodes.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground mb-2">
          No objectives to visualize
        </p>
        <p className="text-sm text-muted-foreground">
          Create your first objective to see the hierarchy
        </p>
      </div>
    );
  }

  return (
    <>
      <div ref={containerRef} className="overflow-x-auto pb-6">
        <div className="min-w-max p-8 relative">
          {/* Instructions */}
          <div className="mb-6 p-4 bg-muted/30 rounded-lg border border-dashed border-muted-foreground/30">
            <p className="text-sm text-muted-foreground">
              <strong>💡 Tip:</strong> Drag objectives to reorganize the hierarchy. 
              Click on any objective to edit it, or use the + button to add sub-objectives.
            </p>
          </div>

          {rootNodes.map((node, index) => (
            <div key={node.id} className="mb-8">
              {renderNode(node, index === rootNodes.length - 1)}
            </div>
          ))}

          {/* Drag preview placeholder */}
          <div ref={dragPreviewRef} className="fixed pointer-events-none z-50 opacity-0" />
        </div>
      </div>

      {/* Edit Modal */}
      {editingObjective && (
        <ObjectiveModal
          isOpen={!!editingObjective}
          onClose={() => setEditingObjective(null)}
          onSuccess={handleModalSuccess}
          initialData={editingObjective}
        />
      )}

      {/* Create Modal */}
      <ObjectiveModal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          setCreateParentId(null);
        }}
        onSuccess={handleModalSuccess}
        parentId={createParentId || undefined}
      />
    </>
  );
} 