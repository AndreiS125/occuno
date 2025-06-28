"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QuickActions } from "@/components/dashboard/quick-actions";
import { ObjectiveModal } from "@/components/modals";
import { useObjectives } from "@/hooks/use-objectives";
import { LoadingSpinner, Card, CardContent } from "@/components/ui";

export default function Home() {
  const { objectives, loading, activeObjectives, completedObjectives } = useObjectives();
  const [showCreateModal, setShowCreateModal] = useState(false);

  if (loading) {
    return <LoadingSpinner fullScreen />;
  }

  return (
    <>
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <motion.h1
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl font-bold mb-4"
          >
            Welcome to Auxilium
          </motion.h1>
          <motion.p
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="text-xl text-muted-foreground max-w-2xl mx-auto"
          >
            Your productivity planner to organize goals, track progress, and achieve more.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4 max-w-md mx-auto"
          >
            <Card>
              <CardContent className="text-center p-4">
                <div className="text-2xl font-bold text-primary">{objectives.length}</div>
                <div className="text-sm text-muted-foreground">Total Objectives</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center p-4">
                <div className="text-2xl font-bold text-green-600">{activeObjectives.length}</div>
                <div className="text-sm text-muted-foreground">Active</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="text-center p-4">
                <div className="text-2xl font-bold text-blue-600">{completedObjectives.length}</div>
                <div className="text-sm text-muted-foreground">Completed</div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Main Content Grid */}
        <div className="max-w-4xl mx-auto">
          {/* Quick Actions */}
          <QuickActions />
        </div>
      </div>

      <ObjectiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
        }}
        defaultToTask={false}
      />
    </>
  );
} 