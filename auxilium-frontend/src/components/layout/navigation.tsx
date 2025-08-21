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

const navItems = [
  { href: "/dashboard", icon: Home, label: "Dashboard", color: "from-blue-400 to-blue-600" },
  { href: "/objectives", icon: Target, label: "Objectives", color: "from-emerald-400 to-emerald-600" },
  { href: "/checklist", icon: CheckSquare, label: "Checklist", color: "from-teal-400 to-teal-600" },
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
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
              <span className="font-brand font-bold text-xl text-foreground hidden sm:block">
                Occuno
              </span>
            </Link>

            {/* Desktop Navigation */}
            <div className="hidden md:flex items-center space-x-2">
              {isLoggedIn ? (
                navItems.map((item) => {
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
                      <span className="text-sm font-medium">{item.label}</span>
                    </Link>
                  );
                })
              ) : (
                <>
                  <Link
                    href="/"
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-muted/50 hover:text-primary"
                    )}
                  >
                    <Home className="w-4 h-4" />
                    <span className="text-sm font-medium">Home</span>
                  </Link>
                  <Link
                    href="/login"
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 hover:bg-muted/50 hover:text-primary"
                    )}
                  >
                    <span className="text-sm font-medium">Login</span>
                  </Link>
                  <Link
                    href="/register"
                    className={cn(
                      "flex items-center space-x-2 px-4 py-2 rounded-xl transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90"
                    )}
                  >
                    <span className="text-sm font-medium">Register</span>
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
                      className="flex items-center space-x-2 bg-gradient-to-r from-primary to-secondary text-white px-6 py-2 rounded-xl font-medium transition-all duration-200 hover:scale-105"
                    >
                      <Plus className="w-4 h-4" />
                      <span className="hidden sm:inline">Create</span>
                    </button>

                    {/* User Menu - Desktop */}
                    <div className="hidden md:block relative user-menu">
                      <button
                        onClick={() => setUserMenuOpen(!userMenuOpen)}
                        className="flex items-center space-x-2 px-3 py-2 rounded-xl hover:bg-muted/50 transition-all duration-200"
                      >
                        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-primary to-secondary flex items-center justify-center text-white font-medium text-sm">
                          {user?.username?.charAt(0).toUpperCase() || user?.full_name?.charAt(0).toUpperCase() || 'U'}
                        </div>
                        <MoreVertical className="w-4 h-4" />
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

                {/* Mobile menu button */}
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-xl hover:bg-muted/50 transition-all duration-200"
                >
                  {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </button>
              </div>
            </div>

            {/* Mobile Navigation */}
            {mobileMenuOpen && (
              <div className="md:hidden py-4 border-t border-border/20 mt-4">
                <div className="grid grid-cols-2 gap-2">
                  {isLoggedIn ? (
                    navItems.map((item) => {
                      const Icon = item.icon;
                      const isActive = pathname === item.href;
                      return (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setMobileMenuOpen(false)}
                          className={cn(
                            "flex items-center space-x-2 px-3 py-3 rounded-xl transition-all duration-200",
                            isActive 
                              ? "bg-primary/20 text-primary" 
                              : "hover:bg-muted/50"
                          )}
                        >
                          <Icon className="w-4 h-4" />
                          <span className="text-sm font-medium">{item.label}</span>
                        </Link>
                      );
                    })
                  ) : (
                    <>
                      <Link
                        href="/"
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-muted/50"
                        )}
                      >
                        <Home className="w-4 h-4" />
                        <span className="text-sm font-medium">Home</span>
                      </Link>
                      <Link
                        href="/login"
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-3 rounded-xl transition-all duration-200 hover:bg-muted/50"
                        )}
                      >
                        <span className="text-sm font-medium">Login</span>
                      </Link>
                      <Link
                        href="/register"
                        onClick={() => setMobileMenuOpen(false)}
                        className={cn(
                          "flex items-center space-x-2 px-3 py-3 rounded-xl transition-all duration-200 bg-primary text-primary-foreground hover:bg-primary/90"
                        )}
                      >
                        <span className="text-sm font-medium">Register</span>
                      </Link>
                    </>
                  )}
                </div>

                {/* Mobile Calendar View Toggle */}
                {isCalendarPage && calendarViewMode && onCalendarViewChange && (
                  <div className="mt-4 pt-4 border-t border-border/20">
                    <div className="flex items-center bg-muted/20 rounded-xl p-1">
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

                {isLoggedIn && (
                  <div className="mt-4 pt-4 border-t border-border/20">
                    <button
                      onClick={() => {
                        setMobileMenuOpen(false);
                        logout();
                      }}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl bg-destructive/10 text-destructive hover:bg-destructive/15 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                      <span className="text-sm font-medium">Logout</span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </nav>

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