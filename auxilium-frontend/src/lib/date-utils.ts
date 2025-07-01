// Date and timezone utilities for consistent handling across the app

/**
 * Convert Date to datetime-local format (YYYY-MM-DDTHH:mm)
 * Used for HTML datetime-local inputs
 */
export const formatDateTimeLocal = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day}T${hours}:${minutes}`;
};

/**
 * Convert Date to date format (YYYY-MM-DD)
 * Used for HTML date inputs
 */
export const formatDateOnly = (date: Date): string => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

/**
 * Parse a date-only string to ISO format with midnight time
 */
export const parseDateOnlyToISO = (dateString: string, isEndDate: boolean = false): string => {
  const date = new Date(dateString + 'T00:00:00.000Z');
  
  // For end dates, we want the end of the day (23:59:59) instead of start of day
  if (isEndDate) {
    date.setUTCHours(23, 59, 59, 999);
  }
  
  return date.toISOString();
};

/**
 * Parse a local datetime string to ISO format
 */
export const parseLocalDateTimeToISO = (dateTimeString: string): string => {
  const date = new Date(dateTimeString);
  return date.toISOString();
};

// Removed isAllDayDate function - now using explicit all_day field from backend

/**
 * Convert ISO date string to local date object
 */
export const parseISOToLocal = (isoString: string): Date => {
  return new Date(isoString);
};

/**
 * Expand a recurring event into individual occurrences
 */
export const expandRecurringEvent = (
  objective: any,
  startDate: Date,
  endDate: Date
): any[] => {
  if (!objective.recurring) return [objective];
  
  const events: any[] = [];
  const recurring = objective.recurring;
  
  // Get the base start/end times from the original event
  let baseStart: Date;
  let baseEnd: Date;
  
  if (objective.start_time && objective.end_time) {
    baseStart = new Date(objective.start_time);
    baseEnd = new Date(objective.end_time);
  } else if (objective.start_date && objective.due_date) {
    baseStart = new Date(objective.start_date);
    baseEnd = new Date(objective.due_date);
  } else {
    return [objective]; // Can't expand without dates
  }
  
  // Calculate duration
  const duration = baseEnd.getTime() - baseStart.getTime();
  
  // Set up iteration boundaries
  const iterStart = new Date(Math.max(startDate.getTime(), baseStart.getTime()));
  const iterEnd = recurring.end_date ? 
    new Date(Math.min(endDate.getTime(), new Date(recurring.end_date).getTime())) : 
    endDate;
  
  // Generate occurrences based on frequency
  let currentDate = new Date(baseStart);
  let occurrenceIndex = 0;
  
  while (currentDate <= iterEnd) {
    if (currentDate >= iterStart) {
      // Check if this occurrence should be included
      let includeOccurrence = true;
      
      if (recurring.frequency === 'weekly' && recurring.days_of_week?.length > 0) {
        // For weekly recurrence, check if current day is in days_of_week
        const dayOfWeek = currentDate.getDay();
        // Convert Sunday (0) to 6, and shift others down by 1 to match our 0=Monday system
        const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
        includeOccurrence = recurring.days_of_week.includes(adjustedDayOfWeek);
      }
      
      if (includeOccurrence) {
        // Create a new occurrence
        const occurrence = {
          ...objective,
          id: `${objective.id}_${occurrenceIndex}`,
          recurring_instance: true,
          original_id: objective.id,
          start_time: objective.start_time ? currentDate.toISOString() : undefined,
          end_time: objective.end_time ? new Date(currentDate.getTime() + duration).toISOString() : undefined,
          start_date: currentDate.toISOString(),
          due_date: new Date(currentDate.getTime() + duration).toISOString(),
        };
        events.push(occurrence);
        occurrenceIndex++;
      }
    }
    
    // Move to next occurrence
    switch (recurring.frequency) {
      case 'daily':
        currentDate.setDate(currentDate.getDate() + (recurring.interval || 1));
        break;
      case 'weekly':
        if (recurring.days_of_week?.length > 0) {
          // Move to next specified day of week
          let daysToAdd = 1;
          let found = false;
          for (let i = 1; i <= 7; i++) {
            const nextDate = new Date(currentDate);
            nextDate.setDate(nextDate.getDate() + i);
            const dayOfWeek = nextDate.getDay();
            const adjustedDayOfWeek = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
            if (recurring.days_of_week.includes(adjustedDayOfWeek)) {
              daysToAdd = i;
              found = true;
              break;
            }
          }
          if (!found) {
            // If no next day found in current week, jump to next week
            daysToAdd = 7 * (recurring.interval || 1);
          }
          currentDate.setDate(currentDate.getDate() + daysToAdd);
        } else {
          // Simple weekly recurrence
          currentDate.setDate(currentDate.getDate() + 7 * (recurring.interval || 1));
        }
        break;
      case 'monthly':
        currentDate.setMonth(currentDate.getMonth() + (recurring.interval || 1));
        break;
    }
  }
  
  // Include original event if it has no occurrences in the range
  if (events.length === 0 && baseStart >= iterStart && baseStart <= iterEnd) {
    events.push(objective);
  }
  
  return events;
}; 