"use client";

import React, { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";

interface MiniCalendarProps {
  selectedDate?: Date;
  onDateClick: (date: Date) => void;
  className?: string;
  highlightedDates?: Date[]; // Dates with events
}

export function MiniCalendar({ 
  selectedDate, 
  onDateClick, 
  className = "",
  highlightedDates = []
}: MiniCalendarProps) {
  const [currentDate, setCurrentDate] = useState(selectedDate || new Date());

  const { monthYear, daysInMonth, firstDayOfWeek, previousMonthDays, nextMonthDays } = useMemo(() => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    
    const monthYear = currentDate.toLocaleDateString('en-US', { 
      month: 'long', 
      year: 'numeric' 
    });
    
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const firstDayOfWeek = new Date(year, month, 1).getDay(); // 0 = Sunday
    
    // Previous month days to fill the grid
    const prevMonthDays = new Date(year, month, 0).getDate();
    const previousMonthDays = Array.from({ length: firstDayOfWeek }, (_, i) => {
      const day = prevMonthDays - firstDayOfWeek + i + 1;
      return new Date(year, month - 1, day);
    });
    
    // Current month days
    const currentMonthDays = Array.from({ length: daysInMonth }, (_, i) => {
      return new Date(year, month, i + 1);
    });
    
    // Next month days to complete the grid (42 total cells for 6 rows)
    const totalCells = 42;
    const remainingCells = totalCells - previousMonthDays.length - currentMonthDays.length;
    const nextMonthDays = Array.from({ length: remainingCells }, (_, i) => {
      return new Date(year, month + 1, i + 1);
    });
    
    return {
      monthYear,
      daysInMonth: currentMonthDays,
      firstDayOfWeek,
      previousMonthDays,
      nextMonthDays
    };
  }, [currentDate]);

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentDate(prev => {
      const newDate = new Date(prev);
      if (direction === 'prev') {
        newDate.setMonth(prev.getMonth() - 1);
      } else {
        newDate.setMonth(prev.getMonth() + 1);
      }
      return newDate;
    });
  };

  const isToday = (date: Date) => {
    const today = new Date();
    return date.toDateString() === today.toDateString();
  };

  const isSelected = (date: Date) => {
    return selectedDate && date.toDateString() === selectedDate.toDateString();
  };

  const hasEvents = (date: Date) => {
    return highlightedDates.some(highlightedDate => 
      highlightedDate.toDateString() === date.toDateString()
    );
  };

  const isCurrentMonth = (date: Date) => {
    return date.getMonth() === currentDate.getMonth();
  };

  const handleDateClick = (date: Date) => {
    onDateClick(date);
  };

  const weekDays = [
    { short: 'S', full: 'Sunday' },
    { short: 'M', full: 'Monday' },
    { short: 'T', full: 'Tuesday' },
    { short: 'W', full: 'Wednesday' },
    { short: 'T', full: 'Thursday' },
    { short: 'F', full: 'Friday' },
    { short: 'S', full: 'Saturday' }
  ];
  
  const allDays = [...previousMonthDays, ...daysInMonth, ...nextMonthDays];

  return (
    <div className={`bg-card border rounded-lg p-3 ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between mb-3">
        <button
          onClick={() => navigateMonth('prev')}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        
        <h3 className="text-sm font-medium text-center min-w-0 px-2">
          {monthYear}
        </h3>
        
        <button
          onClick={() => navigateMonth('next')}
          className="p-1 hover:bg-muted rounded transition-colors"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Week Days */}
      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map((day, index) => (
          <div
            key={`${day.full}-${index}`}
            className="text-xs text-muted-foreground font-medium text-center p-1"
          >
            {day.short}
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="grid grid-cols-7 gap-1">
        {allDays.map((date, index) => {
          const dayNumber = date.getDate();
          const isTodayDate = isToday(date);
          const isSelectedDate = isSelected(date);
          const hasEventsDate = hasEvents(date);
          const isCurrentMonthDate = isCurrentMonth(date);

          return (
            <motion.button
              key={`${date.toISOString()}-${index}`}
              onClick={() => handleDateClick(date)}
              className={`
                relative text-xs p-1.5 rounded transition-all duration-200 hover:bg-muted
                ${isCurrentMonthDate ? 'text-foreground' : 'text-muted-foreground'}
                ${isTodayDate ? 'bg-primary text-primary-foreground hover:bg-primary/90' : ''}
                ${isSelectedDate && !isTodayDate ? 'bg-accent text-accent-foreground' : ''}
                ${hasEventsDate && !isTodayDate && !isSelectedDate ? 'font-semibold' : ''}
              `}
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <span className="relative z-10">{dayNumber}</span>
              
              {/* Event indicator dot */}
              {hasEventsDate && (
                <div className={`
                  absolute bottom-0.5 left-1/2 transform -translate-x-1/2 w-1 h-1 rounded-full
                  ${isTodayDate ? 'bg-primary-foreground' : 
                    isSelectedDate ? 'bg-accent-foreground' : 'bg-primary'}
                `} />
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Today Button */}
      <div className="mt-3 pt-2 border-t">
        <button
          onClick={() => {
            const today = new Date();
            setCurrentDate(today);
            onDateClick(today);
          }}
          className="w-full text-xs text-primary hover:text-primary/80 transition-colors"
        >
          Today
        </button>
      </div>
    </div>
  );
}
