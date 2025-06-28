"use client";

import { motion } from "framer-motion";
import { Trophy, Flame } from "lucide-react";
import { cn } from "@/lib/utils";

interface UserScoreProps {
  score: number;
  streak: number;
}

export function UserScore({ score, streak }: UserScoreProps) {
  return (
    <div className="flex items-center space-x-4">
      {/* Score */}
      <motion.div
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 200 }}
        className="flex items-center space-x-2 px-3 py-1 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg"
      >
        <Trophy className="w-4 h-4 text-yellow-600" />
        <span className="font-semibold text-yellow-900 dark:text-yellow-100">
          {score.toLocaleString()}
        </span>
      </motion.div>

      {/* Streak */}
      {streak > 0 && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ type: "spring", stiffness: 200, delay: 0.1 }}
          className="flex items-center space-x-2 px-3 py-1 bg-orange-100 dark:bg-orange-900/20 rounded-lg"
        >
          <Flame className="w-4 h-4 text-orange-600" />
          <span className="font-semibold text-orange-900 dark:text-orange-100">
            {streak}
          </span>
        </motion.div>
      )}
    </div>
  );
} 