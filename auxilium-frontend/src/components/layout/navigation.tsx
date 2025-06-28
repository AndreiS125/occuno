"use client";

import { useState, createContext, useContext } from "react";
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
  CalendarDays
} from "lucide-react";
import { motion } from "framer-motion";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { objectivesApi } from "@/lib/api";
import { ObjectiveModal } from "@/components/modals";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", icon: Home, label: "Dashboard" },
  { href: "/objectives", icon: Target, label: "Objectives" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/analytics", icon: BarChart3, label: "Analytics" },
  { href: "/achievements", icon: Trophy, label: "Achievements" },
  { href: "/settings", icon: Settings, label: "Settings" },
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
  const queryClient = useQueryClient();

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
      <nav className="bg-background border-b border-border sticky top-0 z-40">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-2">
              <Target className="w-8 h-8 text-primary" />
              <span className="font-bold text-xl hidden sm:block">Auxilium</span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-8">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                      className={cn(
                      "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors",
                        isActive 
                        ? "bg-primary text-primary-foreground" 
                        : "hover:bg-muted"
                      )}
                    >
                    <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
            </div>

            {/* Calendar View Toggle */}
            {isCalendarPage && calendarViewMode && onCalendarViewChange && (
              <div className="hidden md:flex items-center bg-muted rounded-lg p-1">
                <Button
                  size="sm"
                  variant={calendarViewMode === "gantt" ? "default" : "ghost"}
                  onClick={() => onCalendarViewChange("gantt")}
                  className="gap-2"
                >
                  <CalendarRange className="w-4 h-4" />
                  Gantt
                </Button>
                <Button
                  size="sm"
                  variant={calendarViewMode === "calendar" ? "default" : "ghost"}
                  onClick={() => onCalendarViewChange("calendar")}
                  className="gap-2"
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendar
                </Button>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowCreateModal(true)}
                className="flex items-center space-x-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                <Plus className="w-4 h-4" />
                <span className="hidden sm:inline">New</span>
              </motion.button>

              {/* Mobile menu button */}
              <button
                onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                className="md:hidden p-2 hover:bg-muted rounded-lg"
              >
                {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {/* Mobile Navigation */}
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden py-4 border-t border-border"
            >
              <div className="grid grid-cols-2 gap-2">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href;
                  
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center space-x-2 px-3 py-2 rounded-lg transition-colors",
                        isActive 
                          ? "bg-primary text-primary-foreground" 
                          : "hover:bg-muted"
                      )}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>
              
              {/* Mobile Calendar View Toggle */}
              {isCalendarPage && calendarViewMode && onCalendarViewChange && (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex items-center bg-muted rounded-lg p-1">
                    <Button
                      size="sm"
                      variant={calendarViewMode === "gantt" ? "default" : "ghost"}
                      onClick={() => onCalendarViewChange("gantt")}
                      className="gap-2 flex-1"
                    >
                      <CalendarRange className="w-4 h-4" />
                      Gantt
                    </Button>
                    <Button
                      size="sm"
                      variant={calendarViewMode === "calendar" ? "default" : "ghost"}
                      onClick={() => onCalendarViewChange("calendar")}
                      className="gap-2 flex-1"
                    >
                      <CalendarDays className="w-4 h-4" />
                      Calendar
                    </Button>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </div>
      </nav>

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