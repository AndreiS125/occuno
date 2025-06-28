"use client";

import { useState, createContext, useContext, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { 
  Home, 
  Target, 
  Calendar, 
  BarChart3, 
  Settings,
  Trophy,
  Plus,
  Menu,
  X,
  CalendarRange,
  CalendarDays,
  Zap
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { objectivesApi } from "@/lib/api";
import { ObjectiveModal } from "@/components/modals";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Dashboard", color: "from-blue-400 to-blue-600" },
  { href: "/objectives", icon: Target, label: "Objectives", color: "from-emerald-400 to-emerald-600" },
  { href: "/calendar", icon: Calendar, label: "Calendar", color: "from-purple-400 to-purple-600" },
  { href: "/analytics", icon: BarChart3, label: "Analytics", color: "from-orange-400 to-orange-600" },
  { href: "/achievements", icon: Trophy, label: "Achievements", color: "from-yellow-400 to-yellow-600" },
  { href: "/settings", icon: Settings, label: "Settings", color: "from-gray-400 to-gray-600" },
];

// Context for managing calendar view state globally
interface CalendarViewContextType {
  viewMode: "gantt" | "calendar";
  setViewMode: (mode: "gantt" | "calendar") => void;
}

const CalendarViewContext = createContext<CalendarViewContextType | undefined>(undefined);

export function useCalendarView() {
  const context = useContext(CalendarViewContext);
  if (!context) {
    throw new Error("useCalendarView must be used within CalendarViewProvider");
  }
  return context;
}

export function CalendarViewProvider({ children }: { children: React.ReactNode }) {
  const [viewMode, setViewMode] = useState<"gantt" | "calendar">("gantt");
  
  return (
    <CalendarViewContext.Provider value={{ viewMode, setViewMode }}>
      {children}
    </CalendarViewContext.Provider>
  );
}

interface NavigationProps {
  calendarViewMode?: "gantt" | "calendar";
  onCalendarViewChange?: (mode: "gantt" | "calendar") => void;
}

function Navigation({ calendarViewMode, onCalendarViewChange }: NavigationProps) {
  const pathname = usePathname();
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const queryClient = useQueryClient();

  // Handle scroll effect for navigation background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const createObjectiveMutation = useMutation({
    mutationFn: (objectiveData: any) => objectivesApi.create(objectiveData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["objectives"] });
      toast.success("Objective created successfully!");
      setShowCreateModal(false);
    },
    onError: () => {
      toast.error("Failed to create objective");
    }
  });

  const isCalendarPage = pathname === "/calendar";

  return (
    <>
      <motion.nav 
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-500",
          scrolled 
            ? "glass-nav backdrop-blur-2xl shadow-2xl shadow-primary/10" 
            : "bg-background/80 backdrop-blur-md border-b border-border/20"
        )}
      >
        {/* Animated background gradient */}
        <div className="absolute inset-0 bg-gradient-to-r from-primary/5 via-secondary/5 to-accent/5 animate-gradient-shift opacity-50" />
        
        <div className="relative container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo with glow effect */}
            <Link href="/" className="flex items-center space-x-3 group">
              <motion.div
                whileHover={{ rotate: 360, scale: 1.1 }}
                transition={{ duration: 0.6, ease: "easeInOut" }}
                className="relative"
              >
                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-primary to-secondary opacity-20 animate-pulse-glow" />
                <Zap className="w-8 h-8 text-primary relative z-10 drop-shadow-glow" />
              </motion.div>
              <motion.span 
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
                className="font-bold text-xl bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent hidden sm:block"
              >
                Auxilium
              </motion.span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {navItems.map((item, index) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <motion.div
                    key={item.href}
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Link
                      href={item.href}
                      className={cn(
                        "relative group flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-300 overflow-hidden",
                        isActive 
                          ? "glass-card bg-gradient-to-r from-primary/20 to-secondary/20 text-primary shadow-glow border-primary/30" 
                          : "hover:glass-card hover:bg-muted/50 hover:scale-105"
                      )}
                    >
                      {/* Animated background for active state */}
                      {isActive && (
                        <motion.div
                          layoutId="activeTab"
                          className="absolute inset-0 bg-gradient-to-r from-primary/10 to-secondary/10 rounded-xl"
                          transition={{ duration: 0.3 }}
                        />
                      )}
                      
                      {/* Icon with individual color and glow */}
                      <motion.div
                        whileHover={{ scale: 1.2, rotate: 5 }}
                        className="relative z-10"
                      >
                        <Icon className={cn(
                          "w-4 h-4 transition-all duration-300",
                          isActive ? "text-primary drop-shadow-glow" : "group-hover:text-primary"
                        )} />
                      </motion.div>
                      
                      <span className={cn(
                        "text-sm font-medium relative z-10 transition-all duration-300",
                        isActive ? "text-primary" : "group-hover:text-primary"
                      )}>
                        {item.label}
                      </span>
                      
                      {/* Hover shimmer effect */}
                      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000" />
                    </Link>
                  </motion.div>
                );
              })}
            </div>

            {/* Calendar View Toggle with futuristic design */}
            {isCalendarPage && calendarViewMode && onCalendarViewChange && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="hidden md:flex items-center glass-card rounded-2xl p-1 bg-muted/20 border-primary/20"
              >
                <Button
                  size="sm"
                  variant={calendarViewMode === "gantt" ? "default" : "ghost"}
                  onClick={() => onCalendarViewChange("gantt")}
                  className={cn(
                    "gap-2 transition-all duration-300 rounded-xl",
                    calendarViewMode === "gantt" 
                      ? "bg-gradient-to-r from-primary to-secondary text-white shadow-glow" 
                      : "hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <CalendarRange className="w-4 h-4" />
                  Gantt
                </Button>
                <Button
                  size="sm"
                  variant={calendarViewMode === "calendar" ? "default" : "ghost"}
                  onClick={() => onCalendarViewChange("calendar")}
                  className={cn(
                    "gap-2 transition-all duration-300 rounded-xl",
                    calendarViewMode === "calendar" 
                      ? "bg-gradient-to-r from-primary to-secondary text-white shadow-glow" 
                      : "hover:bg-primary/10 hover:text-primary"
                  )}
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendar
                </Button>
              </motion.div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-3">
              <motion.button
                whileHover={{ scale: 1.05, boxShadow: "0 0 20px rgba(34, 197, 194, 0.5)" }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="relative group btn-glow flex items-center space-x-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-xl font-medium shadow-glow transition-all duration-300 overflow-hidden"
              >
                <motion.div
                  whileHover={{ rotate: 90 }}
                  transition={{ duration: 0.3 }}
                >
                  <Plus className="w-4 h-4" />
                </motion.div>
                <span className="hidden sm:inline relative z-10">Create</span>
                
                {/* Button shine effect */}
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700" />
              </motion.button>

              {/* Mobile menu button with rotation animation */}
              <motion.button
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 rounded-xl glass-card hover:bg-primary/10 hover:text-primary transition-all duration-300 border-primary/20"
              >
                <motion.div
                  animate={{ rotate: mobileMenuOpen ? 180 : 0 }}
                  transition={{ duration: 0.3 }}
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </motion.div>
              </motion.button>
            </div>
          </div>

          {/* Mobile Navigation with advanced animations */}
          <AnimatePresence>
            {mobileMenuOpen && (
              <motion.div
                initial={{ opacity: 0, height: 0, y: -20 }}
                animate={{ opacity: 1, height: "auto", y: 0 }}
                exit={{ opacity: 0, height: 0, y: -20 }}
                transition={{ duration: 0.4, ease: "easeInOut" }}
                className="md:hidden py-6 border-t border-border/20 glass-card mt-2 rounded-2xl"
              >
                <div className="grid grid-cols-2 gap-3 px-2">
                  {navItems.map((item, index) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                      >
                        <Link
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "relative group flex items-center space-x-2 px-3 py-3 rounded-xl transition-all duration-300 overflow-hidden",
                            isActive 
                              ? "glass-card bg-gradient-to-r from-primary/20 to-secondary/20 text-primary border-primary/30" 
                              : "hover:glass-card hover:bg-muted/50 hover:scale-105"
                          )}
                        >
                          <Icon className={cn(
                            "w-4 h-4 transition-all duration-300",
                            isActive ? "text-primary" : "group-hover:text-primary"
                          )} />
                          <span className={cn(
                            "text-sm font-medium transition-all duration-300",
                            isActive ? "text-primary" : "group-hover:text-primary"
                          )}>
                            {item.label}
                          </span>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
                
                {/* Mobile Calendar View Toggle */}
                {isCalendarPage && calendarViewMode && onCalendarViewChange && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="mt-6 pt-4 border-t border-border/20 px-2"
                  >
                    <div className="flex items-center glass-card rounded-2xl p-1 bg-muted/20">
                      <Button
                        size="sm"
                        variant={calendarViewMode === "gantt" ? "default" : "ghost"}
                        onClick={() => onCalendarViewChange("gantt")}
                        className={cn(
                          "gap-2 flex-1 rounded-xl transition-all duration-300",
                          calendarViewMode === "gantt" 
                            ? "bg-gradient-to-r from-primary to-secondary text-white" 
                            : "hover:bg-primary/10 hover:text-primary"
                        )}
                      >
                        <CalendarRange className="w-4 h-4" />
                        Gantt
                      </Button>
                      <Button
                        size="sm"
                        variant={calendarViewMode === "calendar" ? "default" : "ghost"}
                        onClick={() => onCalendarViewChange("calendar")}
                        className={cn(
                          "gap-2 flex-1 rounded-xl transition-all duration-300",
                          calendarViewMode === "calendar" 
                            ? "bg-gradient-to-r from-primary to-secondary text-white" 
                            : "hover:bg-primary/10 hover:text-primary"
                        )}
                      >
                        <CalendarDays className="w-4 h-4" />
                        Calendar
                      </Button>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.nav>

      {/* Create Objective Modal */}
      <ObjectiveModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={() => {
          setShowCreateModal(false);
          // Could trigger a refresh if needed
        }}
        defaultToTask={false}
      />
    </>
  );
}

// Navigation wrapper that connects to context
export function NavigationWrapper() {
  const pathname = usePathname();
  const isCalendarPage = pathname === "/calendar";
  
  if (isCalendarPage) {
    // On calendar page, connect to context
    const { viewMode, setViewMode } = useCalendarView();
    return (
      <Navigation 
        calendarViewMode={viewMode}
        onCalendarViewChange={setViewMode}
      />
    );
  }
  
  // On other pages, use simple navigation
  return <Navigation />;
} 