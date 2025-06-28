"use client";

import { Objective, ObjectiveType, ObjectiveStatus } from "@/types";
import { motion } from "framer-motion";
import { 
  AlertCircle, 
  Target, 
  CheckCircle, 
  Clock,
  ChevronRight
} from "lucide-react";

interface ObjectiveHierarchyDiagramProps {
  objectives: Objective[];
}

interface TreeNode extends Objective {
  children: TreeNode[];
}

export function ObjectiveHierarchyDiagram({ objectives }: ObjectiveHierarchyDiagramProps) {
  // Build tree structure
  const buildTree = (parentId: string | null = null): TreeNode[] => {
    return objectives
      .filter(obj => obj.parent_id === parentId)
      .map(obj => ({
        ...obj,
        children: buildTree(obj.id)
      }));
  };

  const rootNodes = buildTree(null);

  const typeIcons = {
    [ObjectiveType.MAIN_OBJECTIVE]: <AlertCircle className="w-5 h-5" />,
    [ObjectiveType.SUB_OBJECTIVE]: <Target className="w-5 h-5" />,
    [ObjectiveType.TASK]: <CheckCircle className="w-5 h-5" />
  };

  const typeColors = {
    [ObjectiveType.MAIN_OBJECTIVE]: "from-purple-500/20 to-purple-600/10 border-purple-500/50",
    [ObjectiveType.SUB_OBJECTIVE]: "from-blue-500/20 to-blue-600/10 border-blue-500/50",
    [ObjectiveType.TASK]: "from-green-500/20 to-green-600/10 border-green-500/50"
  };

  const renderNode = (node: TreeNode, level: number = 0, isLast: boolean = true) => {
    const hasChildren = node.children && node.children.length > 0;
    
    return (
      <motion.div
        key={node.id}
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ delay: level * 0.1 }}
        className="relative"
      >
        {/* Connector Lines */}
        {level > 0 && (
          <>
            {/* Vertical line from parent */}
            <div 
              className="absolute border-l-2 border-dashed border-muted-foreground/30"
              style={{
                left: `${-20}px`,
                top: '-20px',
                height: '40px'
              }}
            />
            {/* Horizontal line to node */}
            <div 
              className="absolute border-t-2 border-dashed border-muted-foreground/30"
              style={{
                left: `${-20}px`,
                top: '20px',
                width: '20px'
              }}
            />
          </>
        )}

        {/* Node */}
        <div className="flex items-start mb-4">
          <div className={`
            bg-gradient-to-br ${typeColors[node.objective_type]}
            border-2 rounded-xl p-4 min-w-[250px] max-w-[350px]
            hover:shadow-lg transition-all cursor-pointer
          `}>
            <div className="flex items-start space-x-3">
              <div className="mt-0.5">
                {typeIcons[node.objective_type]}
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1">{node.title}</h4>
                {node.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">
                    {node.description}
                  </p>
                )}
                <div className="flex items-center space-x-4 mt-2">
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    node.status === ObjectiveStatus.COMPLETED ? "bg-green-500/20 text-green-600" :
                    node.status === ObjectiveStatus.IN_PROGRESS ? "bg-blue-500/20 text-blue-600" :
                    node.status === ObjectiveStatus.BLOCKED ? "bg-red-500/20 text-red-600" :
                    "bg-gray-500/20 text-gray-600"
                  }`}>
                    {node.status.replace("_", " ")}
                  </span>
                  {node.completion_percentage > 0 && (
                    <span className="text-xs text-muted-foreground">
                      {node.completion_percentage}%
                    </span>
                  )}
                </div>
              </div>
              {hasChildren && (
                <ChevronRight className="w-4 h-4 text-muted-foreground mt-0.5" />
              )}
            </div>
          </div>
        </div>

        {/* Children */}
        {hasChildren && (
          <div className="ml-12 relative">
            {/* Vertical line connecting children */}
            {node.children.length > 1 && (
              <div 
                className="absolute border-l-2 border-dashed border-muted-foreground/30"
                style={{
                  left: '-32px',
                  top: '0',
                  height: `calc(100% - 60px)`
                }}
              />
            )}
            {node.children.map((child: TreeNode, index: number) => 
              renderNode(child, level + 1, index === node.children.length - 1)
            )}
          </div>
        )}
      </motion.div>
    );
  };

  if (rootNodes.length === 0) {
    return (
      <div className="text-center py-12">
        <Target className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
        <p className="text-lg text-muted-foreground">
          No objectives to visualize
        </p>
      </div>
    );
  }

  return (
    <div className="overflow-x-auto pb-4">
      <div className="min-w-max p-8">
        {rootNodes.map((node, index) => (
          <div key={node.id} className="mb-8">
            {renderNode(node, 0, index === rootNodes.length - 1)}
          </div>
        ))}
      </div>
    </div>
  );
} 