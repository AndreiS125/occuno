"use client";

import { useEffect, useState, useRef } from "react";

interface TimeIndicatorProps {
  view: string;
  containerRef?: React.RefObject<HTMLDivElement>;
}

export function TimeIndicator({ view, containerRef }: TimeIndicatorProps) {
  const [, setCurrentTime] = useState(new Date());
  const indicatorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const updateIndicator = () => {
      if (!indicatorRef.current || !containerRef?.current) return;
      if (view !== "week" && view !== "day") return;

      const now = new Date();
      const hours = now.getHours();
      const minutes = now.getMinutes();
      
      // Calculate position based on visible hours (usually 0-24)
      const startHour = 0; // Calendar typically starts at midnight
      const endHour = 24;
      const totalHours = endHour - startHour;
      
      // Current time as decimal hours
      const currentHour = hours + minutes / 60;
      const hoursFromStart = currentHour - startHour;
      
      // Calculate percentage
      const percentage = (hoursFromStart / totalHours) * 100;

      // Find the time content area
      const timeContent = containerRef.current.querySelector('.rbc-time-content');
      if (!timeContent) return;

      // Get the height of the time content
      const contentHeight = timeContent.scrollHeight;
      const topPosition = (contentHeight * percentage) / 100;
      
      // Apply styles directly
      indicatorRef.current.style.top = `${topPosition}px`;
      indicatorRef.current.style.display = 'block';
      indicatorRef.current.style.position = 'absolute';
      indicatorRef.current.style.left = '0';
      indicatorRef.current.style.right = '0';
      indicatorRef.current.style.zIndex = '50';
    };

    // Update immediately
    updateIndicator();
    setCurrentTime(new Date());

    // Update every minute
    const interval = setInterval(() => {
      updateIndicator();
      setCurrentTime(new Date());
    }, 60000);

    // Update on resize or scroll
    const handleUpdate = () => updateIndicator();
    window.addEventListener('resize', handleUpdate);
    
    const timeContent = containerRef?.current?.querySelector('.rbc-time-content');
    if (timeContent) {
      timeContent.addEventListener('scroll', handleUpdate);
    }
    
    return () => {
      clearInterval(interval);
      window.removeEventListener('resize', handleUpdate);
      if (timeContent) {
        timeContent.removeEventListener('scroll', handleUpdate);
      }
    };
  }, [view, containerRef]);

  if (view !== "week" && view !== "day") {
    return null;
  }

  return (
    <div
      ref={indicatorRef}
      className="time-indicator"
      style={{
        display: 'none',
        height: '3px',
        backgroundColor: '#ef4444',
        boxShadow: '0 2px 8px rgba(239, 68, 68, 0.5)',
        pointerEvents: 'none'
      }}
    >
      <div 
        style={{
          position: 'absolute',
          left: '-6px',
          top: '-4.5px',
          width: '12px',
          height: '12px',
          backgroundColor: '#ef4444',
          borderRadius: '50%',
          boxShadow: '0 0 0 3px rgba(239, 68, 68, 0.3)'
        }}
      />
    </div>
  );
} 