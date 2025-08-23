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
  CalendarRange,
  CalendarDays,
  Zap,
  LogOut,
  User,
  MoreVertical,
  CheckSquare
} from "lucide-react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { objectivesApi } from "@/lib/api";
import { ObjectiveModal } from "@/components/modals";
import { Button } from "@/components/ui/button";
import toast from "react-hot-toast";
import { cn } from "@/lib/utils";
import { useAuth } from "@/hooks/useAuth";

// Split nav into primary (always visible) and secondary (in More menu)
const primaryNav = [
  { href: "/dashboard", icon: Home, label: "Dashboard" },
  { href: "/objectives", icon: Target, label: "Objectives" },
  { href: "/calendar", icon: Calendar, label: "Calendar" },
  { href: "/checklist", icon: CheckSquare, label: "Checklist" },
];

const secondaryNav = [
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
  const [viewMode, setViewMode] = useState<"gantt" | "calendar">("calendar");
  
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
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const [bottomMoreOpen, setBottomMoreOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const queryClient = useQueryClient();
  const { user, logout, loading } = useAuth();
  const isLoggedIn = !!user;

  // Handle scroll effect for navigation background
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 10);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuOpen && !(event.target as Element).closest('.user-menu')) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [userMenuOpen]);

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
      <nav 
        className={cn(
          "fixed top-0 left-0 right-0 z-40 h-16 transition-all duration-200 ease-out",
          // Consistent styling to prevent layout shifts
          "bg-background/95 backdrop-blur-xl border-b",
          scrolled 
            ? "border-primary/20 shadow-lg shadow-primary/5" 
            : "border-border/20"
        )}
      >
        <div className="container mx-auto px-4 h-full">
          <div className="flex items-center justify-between h-full">
            {/* Logo */}
            <Link href="/" className="flex items-center space-x-3 group">
              <div className="relative">
                <Zap className="w-8 h-8 text-primary transition-transform duration-200 group-hover:scale-110" />
              </div>
              <span className="font-brand font-bold text-lg sm:text-xl text-foreground">
                Occuno
              </span>
            </Link>

            {/* Desktop Navigation (overflow into More) */}
            <div className="hidden md:flex items-center space-x-2">
              {isLoggedIn ? (
                <>
                  {primaryNav.map((item) => {
                    const Icon = item.icon;
                    const isActive = pathname === item.href;
                    return (
                      <Link
                        key={item.href}
                        href={item.href}
                        className={cn(
                          "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200",
                          isActive 
                            ? "bg-primary/20 text-primary border border-primary/30" 
                            : "hover:bg-muted/50 hover:text-primary"
                        )}
                      >
                        <Icon className="w-4 h-4" />
                        <span className="text-sm font-medium hidden xl:inline">{item.label}</span>
                      </Link>
                    );
                  })}

                  {/* More dropdown for secondary */}
                  <div className="relative">
                    <button
                      onClick={() => setMoreOpen((v) => !v)}
                      className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-muted/50"
                      aria-haspopup="menu"
                      aria-expanded={moreOpen}
                    >
                      <MoreVertical className="w-4 h-4" />
                      <span className="text-sm font-medium hidden xl:inline">More</span>
                    </button>
                    {moreOpen && (
                      <div className="absolute right-0 mt-2 w-44 bg-background border rounded-xl shadow-lg py-2 z-50">
                        {secondaryNav.map((item) => {
                          const Icon = item.icon;
                          const isActive = pathname === item.href;
                          return (
                            <Link
                              key={item.href}
                              href={item.href}
                              className={cn(
                                "flex items-center gap-2 px-3 py-2 text-sm rounded-lg",
                                isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                              )}
                              onClick={() => setMoreOpen(false)}
                            >
                              <Icon className="w-4 h-4" />
                              <span>{item.label}</span>
                            </Link>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <>
                  <Link
                    href="/"
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-muted/50 hover:text-primary"
                    )}
                  >
                    <Home className="w-4 h-4" />
                    <span className="text-sm font-medium hidden xl:inline">Home</span>
                  </Link>
                  <Link
                    href="/login"
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-muted/50 hover:text-primary"
                    )}
                  >
                    <span className="text-sm font-medium hidden xl:inline">Login</span>
                  </Link>
                  <Link
                    href="/register"
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <span className="text-sm font-medium hidden xl:inline">Register</span>
                  </Link>
                </>
              )}
            </div>

            {/* Calendar View Toggle */}
            {isCalendarPage && calendarViewMode && onCalendarViewChange && (
              <div className="hidden md:flex items-center bg-muted/20 rounded-xl p-1">
                <Button
                  size="sm"
                  variant={calendarViewMode === "gantt" ? "default" : "ghost"}
                  onClick={() => onCalendarViewChange("gantt")}
                  className="gap-2 rounded-lg"
                >
                  <CalendarRange className="w-4 h-4" />
                  Gantt
                </Button>
                <Button
                  size="sm"
                  variant={calendarViewMode === "calendar" ? "default" : "ghost"}
                  onClick={() => onCalendarViewChange("calendar")}
                  className="gap-2 rounded-lg"
                >
                  <CalendarDays className="w-4 h-4" />
                  Calendar
                </Button>
              </div>
            )}

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                {isLoggedIn && (
                  <>
                    <button
                      onClick={() => setShowCreateModal(true)}
                      className="flex items-center space-x-2 bg-primary text-primary-foreground px-6 py-2 rounded-xl font-medium transition-all duration-200 hover:bg-primary/90"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Create</span>
                    </button>

                    {/* User Menu - Desktop */}
                    <div className="hidden md:block relative user-menu">
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center px-2 py-2 rounded-xl hover:bg-muted/50 transition-all duration-200"
                      >
                        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-foreground font-medium text-sm">
                          {user?.username?.charAt(0).toUpperCase() || user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                      </button>

                      {userMenuOpen && (
                        <div className="absolute right-0 mt-2 w-48 bg-background border rounded-xl shadow-lg py-2 z-50">
                          <div className="px-4 py-2 border-b border-border/20">
                            <p className="font-medium text-sm">{user?.full_name || user?.username}</p>
                            <p className="text-xs text-muted-foreground">{user?.email}</p>
                          </div>
                          <Link
                            href="/settings"
                            className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-muted/50 transition-all"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <User className="w-4 h-4" />
                            <span>Profile</span>
                          </Link>
                          <Link
                            href="/settings"
                            className="flex items-center space-x-2 px-4 py-2 text-sm hover:bg-muted/50 transition-all"
                            onClick={() => setUserMenuOpen(false)}
                          >
                            <Settings className="w-4 h-4" />
                            <span>Settings</span>
                          </Link>
                          <hr className="my-2 border-border/20" />
                          <button
                            onClick={() => {
                              setUserMenuOpen(false);
                              logout();
                            }}
                            className="flex items-center space-x-2 px-4 py-2 text-sm text-destructive hover:bg-destructive/10 w-full text-left transition-all"
                          >
                            <LogOut className="w-4 h-4" />
                            <span>Logout</span>
                          </button>
                        </div>
                      )}
                    </div>
                  </>
                )}

                {/* Removed mobile header menu to avoid duplication with bottom bar */}
              </div>
            </div>
            {/* Mobile header menu removed */}
          </div>
        </nav>

        {/* Bottom Tab Bar (Mobile) */}
        {isLoggedIn && (
          <div className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background/95 backdrop-blur-xl border-t">
            <div className="grid grid-cols-5 gap-1 px-2 py-2">
              {primaryNav.slice(0,4).map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex flex-col items-center justify-center py-1 rounded-lg text-xs",
                      isActive ? "text-primary" : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="mt-0.5">{item.label}</span>
                  </Link>
                );
              })}
              <button
                onClick={() => setBottomMoreOpen(true)}
                className="flex flex-col items-center justify-center py-1 rounded-lg text-xs text-muted-foreground hover:text-foreground"
              >
                <MoreVertical className="w-5 h-5" />
                <span className="mt-0.5">More</span>
              </button>
            </div>
          </div>
        )}

        {/* FAB (Mobile create) */}
        {isLoggedIn && (
          <button
            onClick={() => setShowCreateModal(true)}
            className="fixed md:hidden bottom-16 right-4 z-50 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center hover:bg-primary/90"
            aria-label="Create"
          >
            <Plus className="w-5 h-5" />
          </button>
        )}

        {/* Bottom More Sheet */}
        {bottomMoreOpen && (
          <div className="md:hidden fixed inset-0 z-50">
            <div className="absolute inset-0 bg-black/40" onClick={() => setBottomMoreOpen(false)} />
            <div className="absolute bottom-0 left-0 right-0 bg-background border-t rounded-t-2xl p-4 space-y-2">
              <div className="w-10 h-1.5 bg-muted rounded-full mx-auto mb-2" />
              {secondaryNav.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      "flex items-center gap-3 px-3 py-3 rounded-lg",
                      isActive ? "bg-primary/10 text-primary" : "hover:bg-muted/50"
                    )}
                    onClick={() => setBottomMoreOpen(false)}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm font-medium">{item.label}</span>
                  </Link>
                );
              })}
              <div className="pt-2">
                <button
                  onClick={() => { setBottomMoreOpen(false); logout(); }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/15 transition-all"
                >
                  <LogOut className="w-4 h-4" />
                  <span className="text-sm font-medium">Logout</span>
                </button>
              </div>
            </div>
          </div>
        )}

      {/* Create Objective Modal */}
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

// Navigation wrapper that connects to context
export function NavigationWrapper() {
  const pathname = usePathname();
  const isCalendarPage = pathname === "/calendar";
  const { viewMode, setViewMode } = useCalendarView();

  return (
    <Navigation
      calendarViewMode={isCalendarPage ? viewMode : undefined}
      onCalendarViewChange={isCalendarPage ? setViewMode : undefined}
    />
  );
}