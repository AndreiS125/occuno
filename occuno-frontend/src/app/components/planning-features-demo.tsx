"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar,
  BarChart3,
  TreePine,
  ChevronRight,
  ChevronDown,
  Clock,
  Target,
  CheckCircle2,
  Plus,
  ArrowRight
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

interface PlanningFeaturesDemoProps {
  className?: string;
}

export default function PlanningFeaturesDemo({ className }: PlanningFeaturesDemoProps) {
  const [activeDemo, setActiveDemo] = useState(0);
  const [isPlaying, setIsPlaying] = useState(true);
  const [expandedTasks, setExpandedTasks] = useState<Set<string>>(new Set(['main-1', 'sub-1-1']));
  const [mounted, setMounted] = useState(false);

  // Fix hydration issues
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-cycle through demos
  useEffect(() => {
    if (!isPlaying) return;
    
    const interval = setInterval(() => {
      setActiveDemo((prev) => (prev + 1) % 3);
    }, 5000);
    
    return () => clearInterval(interval);
  }, [isPlaying]);

  const demos = [
    {
      id: 'calendar',
      title: 'Google Calendar Integration',
      subtitle: 'Seamless scheduling that works with your existing workflow',
      icon: Calendar,
      color: 'text-blue-500',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20'
    },
    {
      id: 'gantt',
      title: 'Gantt Chart Timeline',
      subtitle: 'Visual project timelines with drag-and-drop scheduling',
      icon: BarChart3,
      color: 'text-purple-500',
      bgColor: 'bg-purple-500/10',
      borderColor: 'border-purple-500/20'
    },
    {
      id: 'nesting',
      title: 'Nested Task Hierarchy',
      subtitle: 'Break down complex projects into manageable sub-tasks',
      icon: TreePine,
      color: 'text-green-500',
      bgColor: 'bg-green-500/10',
      borderColor: 'border-green-500/20'
    }
  ];

  const toggleTask = (taskId: string) => {
    const newExpanded = new Set(expandedTasks);
    if (newExpanded.has(taskId)) {
      newExpanded.delete(taskId);
    } else {
      newExpanded.add(taskId);
    }
    setExpandedTasks(newExpanded);
  };

  const CalendarDemo = () => (
    <div className="bg-card border rounded-xl overflow-hidden shadow-2xl h-[700px] max-w-7xl mx-auto">
      {/* Calendar Header */}
      <div className="bg-gradient-to-r from-muted/80 to-muted/60 px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h4 className="text-xl font-semibold">December 9-15, 2024</h4>
          <div className="flex items-center space-x-2 bg-background rounded-lg p-1">
            <Button size="sm" variant="default" className="text-sm px-4">Week</Button>
            <Button size="sm" variant="ghost" className="text-sm px-4">Month</Button>
            <Button size="sm" variant="ghost" className="text-sm px-4">Day</Button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Clock className="w-4 h-4 mr-2" />
            Today
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            New Event
          </Button>
        </div>
      </div>
      
      {/* Week View Calendar */}
      <div className="flex h-[640px]">
        {/* Time Column */}
        <div className="w-20 border-r bg-muted/30">
          <div className="h-14 border-b bg-muted/50"></div>
          {Array.from({ length: 14 }, (_, i) => {
            const hour = i + 7; // 7 AM to 8 PM
            const time = hour === 12 ? '12 PM' : hour < 12 ? `${hour} AM` : `${hour - 12} PM`;
            return (
              <div key={`time-${hour}`} className="h-12 border-b border-muted/30 flex items-start justify-center pt-1">
                <span className="text-sm text-muted-foreground font-medium">{time}</span>
              </div>
            );
          })}
        </div>
        
        {/* Days Grid */}
        <div className="flex-1 overflow-hidden">
          {/* Day Headers */}
          <div className="h-14 border-b bg-muted/50 flex">
            {[
              { day: 'Monday', short: 'Mon', date: '9' },
              { day: 'Tuesday', short: 'Tue', date: '10' },
              { day: 'Wednesday', short: 'Wed', date: '11' },
              { day: 'Thursday', short: 'Thu', date: '12' },
              { day: 'Friday', short: 'Fri', date: '13' },
              { day: 'Saturday', short: 'Sat', date: '14' },
              { day: 'Sunday', short: 'Sun', date: '15' }
            ].map((dayInfo, index) => (
              <div key={dayInfo.day} className="flex-1 border-r border-muted/30 flex flex-col items-center justify-center py-2">
                <span className="text-sm font-medium text-muted-foreground">{dayInfo.short}</span>
                <span className={cn(
                  "text-lg font-semibold w-8 h-8 rounded-full flex items-center justify-center mt-1",
                  index === 2 && "bg-primary text-primary-foreground shadow-lg" // Wednesday is today
                )}>{dayInfo.date}</span>
              </div>
            ))}
          </div>
          
          {/* Time Grid */}
          <div className="relative flex">
            {/* Grid Lines */}
            {Array.from({ length: 7 }, (_, dayIndex) => (
              <div key={`day-${dayIndex}`} className="flex-1 border-r border-muted/30">
                {Array.from({ length: 14 }, (_, hourIndex) => (
                  <div key={`hour-${hourIndex}`} className={cn(
                    "h-12 border-b",
                    hourIndex % 2 === 0 ? "border-muted/30" : "border-muted/20"
                  )}></div>
                ))}
              </div>
            ))}
            
            {/* Events */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.5 }}
              className="absolute inset-2 pointer-events-none"
            >
              {/* Monday - Product Launch Planning */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="absolute bg-gradient-to-r from-blue-500 to-blue-600 text-white rounded-lg shadow-lg p-2 cursor-pointer hover:shadow-xl transition-shadow"
                style={{
                  left: '1%',
                  width: '13%',
                  top: '24px', // 9 AM
                  height: '36px'
                }}
              >
                <div className="font-semibold text-sm">Product Launch Planning</div>
                <div className="text-xs opacity-90">9:00 - 10:30 AM</div>
              </motion.div>
              
              {/* Monday - Feature Development */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="absolute bg-gradient-to-r from-indigo-500 to-indigo-600 text-white rounded-lg shadow-lg p-2"
                style={{
                  left: '1%',
                  width: '13%',
                  top: '96px', // 11 AM
                  height: '72px'
                }}
              >
                <div className="font-semibold text-sm">Feature Development Sprint</div>
                <div className="text-xs opacity-90">11:00 AM - 2:00 PM</div>
              </motion.div>
              
              {/* Monday - QA Testing Session */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="absolute bg-gradient-to-r from-red-500 to-red-600 text-white rounded-lg shadow-lg p-2"
                style={{
                  left: '1%',
                  width: '13%',
                  top: '192px', // 4 PM
                  height: '48px'
                }}
              >
                <div className="font-semibold text-sm">QA Testing Session</div>
                <div className="text-xs opacity-90">4:00 - 6:00 PM</div>
              </motion.div>
              
              {/* Tuesday - Design System Review */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.6 }}
                className="absolute bg-gradient-to-r from-purple-500 to-purple-600 text-white rounded-lg shadow-lg p-2"
                style={{
                  left: '15.5%',
                  width: '13%',
                  top: '48px', // 10 AM
                  height: '60px'
                }}
              >
                <div className="font-semibold text-sm">Design System Review</div>
                <div className="text-xs opacity-90">10:00 AM - 12:30 PM</div>
              </motion.div>
              
              {/* Tuesday - Backend Architecture */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="absolute bg-gradient-to-r from-cyan-500 to-cyan-600 text-white rounded-lg shadow-lg p-2"
                style={{
                  left: '15.5%',
                  width: '13%',
                  top: '144px', // 2 PM
                  height: '72px'
                }}
              >
                <div className="font-semibold text-sm">Backend Architecture Meeting</div>
                <div className="text-xs opacity-90">2:00 - 5:00 PM</div>
              </motion.div>
              
              {/* Wednesday - Client Demo Prep */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.8 }}
                className="absolute bg-gradient-to-r from-green-500 to-green-600 text-white rounded-lg shadow-lg p-2"
                style={{
                  left: '30%',
                  width: '13%',
                  top: '72px', // 10:30 AM
                  height: '60px'
                }}
              >
                <div className="font-semibold text-sm">Client Demo Preparation</div>
                <div className="text-xs opacity-90">10:30 AM - 1:00 PM</div>
              </motion.div>
              
              {/* Wednesday - Product Demo */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.9 }}
                className="absolute bg-gradient-to-r from-emerald-500 to-emerald-600 text-white rounded-lg shadow-lg p-2"
                style={{
                  left: '30%',
                  width: '13%',
                  top: '168px', // 3 PM
                  height: '48px'
                }}
              >
                <div className="font-semibold text-sm">Product Demo Session</div>
                <div className="text-xs opacity-90">3:00 - 5:00 PM</div>
              </motion.div>
              
              {/* Thursday - Launch Strategy */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.0 }}
                className="absolute bg-gradient-to-r from-orange-500 to-orange-600 text-white rounded-lg shadow-lg p-2"
                style={{
                  left: '44.5%',
                  width: '13%',
                  top: '48px', // 10 AM
                  height: '96px'
                }}
              >
                <div className="font-semibold text-sm">Launch Strategy Workshop</div>
                <div className="text-xs opacity-90">10:00 AM - 2:00 PM</div>
              </motion.div>
              
              {/* Thursday - Marketing Campaign */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.1 }}
                className="absolute bg-gradient-to-r from-yellow-500 to-yellow-600 text-white rounded-lg shadow-lg p-2"
                style={{
                  left: '44.5%',
                  width: '13%',
                  top: '168px', // 3 PM
                  height: '48px'
                }}
              >
                <div className="font-semibold text-sm">Marketing Campaign Review</div>
                <div className="text-xs opacity-90">3:00 - 5:00 PM</div>
              </motion.div>
              
              {/* Friday - Final Testing */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.2 }}
                className="absolute bg-gradient-to-r from-pink-500 to-pink-600 text-white rounded-lg shadow-lg p-2"
                style={{
                  left: '59%',
                  width: '13%',
                  top: '72px', // 10:30 AM
                  height: '72px'
                }}
              >
                <div className="font-semibold text-sm">Final Testing & Bug Fixes</div>
                <div className="text-xs opacity-90">10:30 AM - 1:30 PM</div>
              </motion.div>
              
              {/* Friday - Launch Preparation */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.3 }}
                className="absolute bg-gradient-to-r from-amber-500 to-amber-600 text-white rounded-lg shadow-lg p-2"
                style={{
                  left: '59%',
                  width: '13%',
                  top: '168px', // 3 PM
                  height: '72px'
                }}
              >
                <div className="font-semibold text-sm">Launch Day Preparation</div>
                <div className="text-xs opacity-90">3:00 - 6:00 PM</div>
              </motion.div>
              
              {/* Saturday - Launch Event */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.4 }}
                className="absolute bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-lg shadow-lg p-2"
                style={{
                  left: '73.5%',
                  width: '13%',
                  top: '96px', // 12 PM
                  height: '96px'
                }}
              >
                <div className="font-semibold text-sm">Product Launch Event</div>
                <div className="text-xs opacity-90">12:00 - 4:00 PM</div>
              </motion.div>
              
              {/* Sunday - Post-Launch Review */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 1.5 }}
                className="absolute bg-gradient-to-r from-slate-500 to-slate-600 text-white rounded-lg shadow-lg p-2"
                style={{
                  left: '88%',
                  width: '13%',
                  top: '144px', // 2 PM
                  height: '48px'
                }}
              >
                <div className="font-semibold text-sm">Post-Launch Review</div>
                <div className="text-xs opacity-90">2:00 - 4:00 PM</div>
              </motion.div>
            </motion.div>
          </div>
        </div>
      </div>
    </div>
  );

  const GanttDemo = () => (
    <div className="bg-card border rounded-xl overflow-hidden shadow-2xl h-[700px] max-w-7xl mx-auto">
      {/* Gantt Header */}
      <div className="bg-gradient-to-r from-muted/80 to-muted/60 px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h4 className="text-xl font-semibold">Product Launch Timeline</h4>
          <div className="flex items-center space-x-2 bg-background rounded-lg p-1">
            <Button size="sm" variant="default" className="text-sm px-4">Gantt</Button>
            <Button size="sm" variant="ghost" className="text-sm px-4">Board</Button>
            <Button size="sm" variant="ghost" className="text-sm px-4">List</Button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <Target className="w-4 h-4 mr-2" />
            Milestones
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>
      
      <div className="flex h-[640px]">
        {/* Task Names */}
        <div className="w-80 border-r bg-muted/20">
          <div className="h-16 px-4 py-3 border-b bg-muted/50 flex items-center">
            <span className="text-base font-semibold">Tasks & Milestones</span>
          </div>
          <div className="overflow-y-auto h-[580px]">
            {[
              { name: 'Product Launch Project', type: 'main', color: 'purple', progress: 65, team: 'Full Team' },
              { name: 'Market Research & Analysis', type: 'sub', color: 'blue', progress: 100, team: 'Research Team' },
              { name: 'Competitive Analysis', type: 'task', color: 'blue', progress: 100, team: 'Sarah M.' },
              { name: 'User Surveys', type: 'task', color: 'blue', progress: 100, team: 'Mike R.' },
              { name: 'Product Design & Development', type: 'sub', color: 'green', progress: 80, team: 'Design Team' },
              { name: 'UI/UX Design', type: 'task', color: 'green', progress: 95, team: 'Alex K.' },
              { name: 'Frontend Development', type: 'task', color: 'green', progress: 85, team: 'Dev Team A' },
              { name: 'Backend Development', type: 'task', color: 'green', progress: 70, team: 'Dev Team B' },
              { name: 'Testing & Quality Assurance', type: 'sub', color: 'orange', progress: 45, team: 'QA Team' },
              { name: 'Unit Testing', type: 'task', color: 'orange', progress: 80, team: 'QA Team' },
              { name: 'Integration Testing', type: 'task', color: 'orange', progress: 30, team: 'QA Team' },
              { name: 'User Acceptance Testing', type: 'task', color: 'orange', progress: 0, team: 'Beta Users' },
              { name: 'Marketing & Launch', type: 'sub', color: 'pink', progress: 25, team: 'Marketing' },
              { name: 'Marketing Campaign', type: 'task', color: 'pink', progress: 60, team: 'Marketing' },
              { name: 'Launch Event', type: 'task', color: 'pink', progress: 0, team: 'Events Team' }
            ].map((task, index) => (
              <motion.div
                key={`gantt-task-${task.name}-${index}`}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
                className={cn(
                  "px-4 py-3 border-b border-muted/30 flex items-center space-x-3 hover:bg-muted/30 transition-colors",
                  task.type === 'sub' && "pl-8",
                  task.type === 'task' && "pl-12"
                )}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full flex-shrink-0",
                  task.color === 'purple' && "bg-purple-500",
                  task.color === 'blue' && "bg-blue-500",
                  task.color === 'green' && "bg-green-500",
                  task.color === 'orange' && "bg-orange-500",
                  task.color === 'pink' && "bg-pink-500"
                )} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between">
                    <span className={cn(
                      "font-medium truncate",
                      task.type === 'main' && "text-base",
                      task.type === 'sub' && "text-sm",
                      task.type === 'task' && "text-sm text-muted-foreground"
                    )}>{task.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{task.progress}%</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs text-muted-foreground">{task.team}</span>
                    <div className="w-16 h-1 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: `${task.progress}%` }}
                        transition={{ delay: index * 0.05 + 0.3, duration: 0.8 }}
                        className={cn(
                          "h-full rounded-full",
                          task.color === 'purple' && "bg-purple-500",
                          task.color === 'blue' && "bg-blue-500",
                          task.color === 'green' && "bg-green-500",
                          task.color === 'orange' && "bg-orange-500",
                          task.color === 'pink' && "bg-pink-500"
                        )}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
        
        {/* Timeline */}
        <div className="flex-1 overflow-x-auto bg-background">
          {/* Timeline Header */}
          <div className="h-16 border-b bg-muted/50 flex items-center px-4">
            <div className="flex items-center space-x-8">
              {[
                { month: 'November', days: ['1', '8', '15', '22', '29'] },
                { month: 'December', days: ['6', '13', '20', '27'] },
                { month: 'January', days: ['3', '10', '17', '24', '31'] }
              ].map((monthData, monthIndex) => (
                <div key={monthData.month} className="flex flex-col">
                  <span className="text-sm font-semibold text-muted-foreground mb-1">{monthData.month} 2024</span>
                  <div className="flex space-x-6">
                    {monthData.days.map((day) => (
                      <div key={`${monthData.month}-${day}`} className="w-12 text-center">
                        <span className="text-xs font-medium">{day}</span>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
          
          <div className="relative overflow-y-auto h-[580px]">
            {/* Grid lines */}
            <div className="absolute inset-0 flex">
              {Array.from({ length: 14 }, (_, i) => (
                <div key={`gantt-grid-${i}`} className="w-12 border-r border-muted/20" />
              ))}
            </div>
            
            {/* Gantt bars */}
            <div className="relative">
              {[
                { width: 600, left: 0, color: 'purple', height: 8, top: 20 }, // Main project
                { width: 120, left: 0, color: 'blue', height: 6, top: 80 }, // Market Research
                { width: 60, left: 0, color: 'blue', height: 4, top: 120 }, // Competitive Analysis
                { width: 60, left: 60, color: 'blue', height: 4, top: 160 }, // User Surveys
                { width: 240, left: 120, color: 'green', height: 6, top: 200 }, // Product Design
                { width: 80, left: 120, color: 'green', height: 4, top: 240 }, // UI/UX
                { width: 100, left: 180, color: 'green', height: 4, top: 280 }, // Frontend
                { width: 120, left: 160, color: 'green', height: 4, top: 320 }, // Backend
                { width: 180, left: 300, color: 'orange', height: 6, top: 360 }, // Testing
                { width: 60, left: 300, color: 'orange', height: 4, top: 400 }, // Unit Testing
                { width: 80, left: 360, color: 'orange', height: 4, top: 440 }, // Integration
                { width: 60, left: 420, color: 'orange', height: 4, top: 480 }, // UAT
                { width: 160, left: 440, color: 'pink', height: 6, top: 520 }, // Marketing
                { width: 80, left: 440, color: 'pink', height: 4, top: 560 }, // Campaign
                { width: 40, left: 560, color: 'pink', height: 4, top: 600 } // Launch Event
              ].map((bar, index) => (
                <motion.div
                  key={`gantt-bar-${index}`}
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: bar.width, opacity: 1 }}
                  transition={{ delay: index * 0.1, duration: 0.8, ease: "easeOut" }}
                  className="absolute rounded-md shadow-lg hover:shadow-xl transition-shadow cursor-pointer"
                  style={{
                    left: `${bar.left + 16}px`,
                    top: `${bar.top}px`,
                    height: `${bar.height * 4}px`,
                    background: bar.color === 'purple' ? 'linear-gradient(90deg, #8b5cf6, #a78bfa)' :
                               bar.color === 'blue' ? 'linear-gradient(90deg, #3b82f6, #60a5fa)' :
                               bar.color === 'green' ? 'linear-gradient(90deg, #10b981, #34d399)' :
                               bar.color === 'orange' ? 'linear-gradient(90deg, #f59e0b, #fbbf24)' :
                               'linear-gradient(90deg, #ec4899, #f472b6)'
                  }}
                >
                  <div className="absolute inset-0 bg-white/20 rounded-md"></div>
                </motion.div>
              ))}
              
              {/* Milestone markers */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.5, duration: 0.5 }}
                className="absolute w-4 h-4 bg-red-500 rotate-45 shadow-lg"
                style={{ left: '136px', top: '196px' }}
                title="Design Complete"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.7, duration: 0.5 }}
                className="absolute w-4 h-4 bg-red-500 rotate-45 shadow-lg"
                style={{ left: '376px', top: '356px' }}
                title="Development Complete"
              />
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 1.9, duration: 0.5 }}
                className="absolute w-4 h-4 bg-red-500 rotate-45 shadow-lg"
                style={{ left: '596px', top: '516px' }}
                title="Launch Ready"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  const NestingDemo = () => (
    <div className="bg-card border rounded-xl overflow-hidden shadow-2xl h-[700px] max-w-7xl mx-auto">
      {/* Nesting Header */}
      <div className="bg-gradient-to-r from-muted/80 to-muted/60 px-6 py-4 border-b flex items-center justify-between">
        <div className="flex items-center space-x-6">
          <h4 className="text-xl font-semibold">Product Launch Project Structure</h4>
          <div className="flex items-center space-x-2 bg-background rounded-lg p-1">
            <Button size="sm" variant="default" className="text-sm px-4">Tree</Button>
            <Button size="sm" variant="ghost" className="text-sm px-4">List</Button>
            <Button size="sm" variant="ghost" className="text-sm px-4">Board</Button>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Button variant="outline" size="sm">
            <TreePine className="w-4 h-4 mr-2" />
            Expand All
          </Button>
          <Button size="sm" className="bg-primary hover:bg-primary/90">
            <Plus className="w-4 h-4 mr-2" />
            Add Task
          </Button>
        </div>
      </div>

      <div className="p-6 h-[640px] overflow-y-auto">
        <div className="space-y-3">
          {/* Main Project */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="border rounded-xl bg-gradient-to-r from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20"
          >
            <div className="p-4 flex items-center space-x-4 cursor-pointer hover:bg-purple-100/50 dark:hover:bg-purple-800/30 rounded-xl transition-colors"
                 onClick={() => toggleTask('main-1')}>
              <button className="text-muted-foreground">
                {expandedTasks.has('main-1') ? 
                  <ChevronDown className="w-5 h-5" /> : 
                  <ChevronRight className="w-5 h-5" />
                }
              </button>
              <div className="w-6 h-6 bg-purple-500 rounded-lg flex items-center justify-center">
                <Target className="w-4 h-4 text-white" />
              </div>
              <div className="flex-1">
                <div className="flex items-center justify-between">
                  <span className="text-lg font-semibold">Product Launch Project</span>
                  <div className="flex items-center space-x-3">
                    <span className="text-sm text-muted-foreground">65% Complete</span>
                    <div className="w-24 h-2 bg-muted rounded-full overflow-hidden">
                      <motion.div
                        initial={{ width: 0 }}
                        animate={{ width: "65%" }}
                        transition={{ delay: 0.3, duration: 1 }}
                        className="h-full bg-purple-500 rounded-full"
                      />
                    </div>
                    <span className="text-xs bg-purple-500/10 text-purple-500 px-3 py-1 rounded-full font-medium">
                      Main Project
                    </span>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground mt-1">Launch new AI planning platform to market</p>
              </div>
            </div>
            
            <AnimatePresence>
              {expandedTasks.has('main-1') && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  className="border-t bg-muted/10"
                >
                  <div className="p-4 space-y-3">
                    {/* Phase 1: Research & Planning */}
                    <div className="border rounded-lg bg-gradient-to-r from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20">
                      <div className="p-3 flex items-center space-x-3 cursor-pointer hover:bg-blue-100/50 dark:hover:bg-blue-800/30 rounded-lg transition-colors"
                           onClick={() => toggleTask('phase-1')}>
                        <button className="text-muted-foreground ml-6">
                          {expandedTasks.has('phase-1') ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                        </button>
                        <div className="w-5 h-5 bg-blue-500 rounded-md flex items-center justify-center">
                          <Target className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Phase 1: Research & Planning</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">100% Complete</span>
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: "100%" }}
                                  transition={{ delay: 0.5, duration: 0.8 }}
                                  className="h-full bg-blue-500 rounded-full"
                                />
                              </div>
                              <span className="text-xs bg-blue-500/10 text-blue-500 px-2 py-1 rounded-full">
                                Phase
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedTasks.has('phase-1') && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t bg-muted/20"
                          >
                            <div className="p-3 space-y-2">
                              {[
                                { name: 'Market Research & Competitive Analysis', completed: true, assignee: 'Research Team' },
                                { name: 'User Persona Development', completed: true, assignee: 'UX Team' },
                                { name: 'Technical Architecture Planning', completed: true, assignee: 'Tech Lead' },
                                { name: 'Project Timeline & Resource Planning', completed: true, assignee: 'PM Team' }
                              ].map((task, index) => (
                                <motion.div
                                  key={`phase1-task-${index}`}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.6 + index * 0.1 }}
                                  className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 ml-10 bg-background border"
                                >
                                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                                  <div className="flex-1">
                                    <span className="text-sm font-medium line-through text-muted-foreground">
                                      {task.name}
                                    </span>
                                    <p className="text-xs text-muted-foreground">{task.assignee}</p>
                                  </div>
                                  <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">
                                    Complete
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Phase 2: Design & Development */}
                    <div className="border rounded-lg bg-gradient-to-r from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20">
                      <div className="p-3 flex items-center space-x-3 cursor-pointer hover:bg-green-100/50 dark:hover:bg-green-800/30 rounded-lg transition-colors"
                           onClick={() => toggleTask('phase-2')}>
                        <button className="text-muted-foreground ml-6">
                          {expandedTasks.has('phase-2') ? 
                            <ChevronDown className="w-4 h-4" /> : 
                            <ChevronRight className="w-4 h-4" />
                          }
                        </button>
                        <div className="w-5 h-5 bg-green-500 rounded-md flex items-center justify-center">
                          <Target className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Phase 2: Design & Development</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">80% Complete</span>
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: "80%" }}
                                  transition={{ delay: 0.7, duration: 0.8 }}
                                  className="h-full bg-green-500 rounded-full"
                                />
                              </div>
                              <span className="text-xs bg-green-500/10 text-green-500 px-2 py-1 rounded-full">
                                Active
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <AnimatePresence>
                        {expandedTasks.has('phase-2') && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="border-t bg-muted/20"
                          >
                            <div className="p-3 space-y-2">
                              {[
                                { name: 'UI/UX Design System', completed: true, assignee: 'Design Team' },
                                { name: 'Frontend Development', completed: true, assignee: 'Frontend Team' },
                                { name: 'Backend API Development', completed: false, assignee: 'Backend Team' },
                                { name: 'Database Schema & Migration', completed: false, assignee: 'DevOps Team' }
                              ].map((task, index) => (
                                <motion.div
                                  key={`phase2-task-${index}`}
                                  initial={{ opacity: 0, x: -10 }}
                                  animate={{ opacity: 1, x: 0 }}
                                  transition={{ delay: 0.8 + index * 0.1 }}
                                  className="flex items-center space-x-3 p-3 rounded-md hover:bg-muted/50 ml-10 bg-background border"
                                >
                                  {task.completed ? 
                                    <CheckCircle2 className="w-4 h-4 text-green-500" /> :
                                    <Clock className="w-4 h-4 text-orange-500" />
                                  }
                                  <div className="flex-1">
                                    <span className={cn(
                                      "text-sm font-medium",
                                      task.completed && "line-through text-muted-foreground"
                                    )}>
                                      {task.name}
                                    </span>
                                    <p className="text-xs text-muted-foreground">{task.assignee}</p>
                                  </div>
                                  <span className={cn(
                                    "text-xs px-2 py-1 rounded-full",
                                    task.completed 
                                      ? "bg-green-500/10 text-green-500" 
                                      : "bg-orange-500/10 text-orange-500"
                                  )}>
                                    {task.completed ? 'Complete' : 'In Progress'}
                                  </span>
                                </motion.div>
                              ))}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </div>

                    {/* Phase 3: Testing & Launch */}
                    <div className="border rounded-lg bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20">
                      <div className="p-3 flex items-center space-x-3 ml-6">
                        <div className="w-5 h-5 bg-orange-500 rounded-md flex items-center justify-center">
                          <Target className="w-3 h-3 text-white" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <span className="font-medium">Phase 3: Testing & Launch</span>
                            <div className="flex items-center space-x-2">
                              <span className="text-xs text-muted-foreground">25% Complete</span>
                              <div className="w-16 h-1.5 bg-muted rounded-full overflow-hidden">
                                <motion.div
                                  initial={{ width: 0 }}
                                  animate={{ width: "25%" }}
                                  transition={{ delay: 0.9, duration: 0.8 }}
                                  className="h-full bg-orange-500 rounded-full"
                                />
                              </div>
                              <span className="text-xs bg-orange-500/10 text-orange-500 px-2 py-1 rounded-full">
                                Upcoming
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </div>
  );

  return (
    <section className={`py-24 px-6 bg-muted/20 ${className}`}>
      <div className="container mx-auto max-w-6xl">
        {/* Section Header */}
        <div className="text-center space-y-6 mb-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <h2 className="text-4xl lg:text-6xl font-light leading-tight">
              <span className="text-foreground">
                Planning Tools That
              </span>
              <br />
              <span className="text-aura-primary font-medium">
                Actually Work
              </span>
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto leading-relaxed">
              From Google Calendar integration to Gantt charts and nested task hierarchies - 
              everything you need to plan, track, and execute your goals.
            </p>
          </motion.div>
        </div>

        {/* Demo Tabs */}
        <div className="flex justify-center mb-8">
          <div className="flex bg-muted rounded-lg p-1">
            {demos.map((demo, index) => (
              <button
                key={demo.id}
                onClick={() => {
                  setActiveDemo(index);
                  setIsPlaying(false);
                  setTimeout(() => setIsPlaying(true), 1000);
                }}
                className={cn(
                  "flex items-center space-x-2 px-4 py-2 rounded-md text-sm font-medium transition-all",
                  activeDemo === index 
                    ? "bg-background shadow-sm text-foreground" 
                    : "text-muted-foreground hover:text-foreground"
                )}
              >
                {React.createElement(demo.icon, { className: "w-4 h-4" })}
                <span>{demo.title}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Demo Content - Full Width Focus */}
        <div className="space-y-8">
          {/* Demo Description - Centered */}
          <motion.div
            key={activeDemo}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center space-y-4 max-w-4xl mx-auto"
          >



          </motion.div>

          {/* Demo Visualization - Full Width Hero */}
          <div className="w-full">
            {mounted && (
              <AnimatePresence mode="wait">
                <motion.div
                  key={`demo-${activeDemo}`}
                  initial={{ opacity: 0, y: 30 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -30 }}
                  transition={{ duration: 0.4 }}
                  className="w-full"
                >
                  {activeDemo === 0 && <CalendarDemo />}
                  {activeDemo === 1 && <GanttDemo />}
                  {activeDemo === 2 && <NestingDemo />}
                </motion.div>
              </AnimatePresence>
            )}
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="text-center mt-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-4"
          >
            <p className="text-lg text-muted-foreground">
              Ready to experience planning that actually works?
            </p>
            <Button size="lg" className="text-lg px-8">
              Try All Features Free
              <ArrowRight className="w-5 h-5 ml-2" />
            </Button>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
