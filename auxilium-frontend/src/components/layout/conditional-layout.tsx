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
      // Calendar view: no top padding, full height
      return <main className="h-screen">{children}</main>;
    }
  }
  
  // Default layout for all other pages and Gantt view
  return <main className="pt-12">{children}</main>;
} 