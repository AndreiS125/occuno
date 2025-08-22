"use client";

import { usePathname } from "next/navigation";
import { useCalendarView } from "./navigation";

interface ConditionalLayoutProps {
  children: React.ReactNode;
}

export function ConditionalLayout({ children }: ConditionalLayoutProps) {
  const pathname = usePathname();
  const isCalendarPage = pathname === "/calendar";
  
  if (isCalendarPage) {
    const { viewMode } = useCalendarView();
    
    if (viewMode === "calendar") {
      // Calendar view: account for fixed navigation height but NO animations or effects
      return (
        <main className="pt-16 h-screen pb-16 md:pb-0">
          {children}
        </main>
      );
    }
  }
  
  // Default layout for all other pages and Gantt view
  return (
    <main className="pt-16 min-h-screen pb-16 md:pb-0">
      {children}
    </main>
  );
} 