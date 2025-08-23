import { useState, useCallback } from 'react';
import { Calendar } from '@/types';
import api from '@/lib/api';

export interface CalendarCreateData {
  name: string;
  description?: string;
  color?: string;
  is_default?: boolean;
  is_visible?: boolean;
}

export interface CalendarUpdateData {
  name?: string;
  description?: string;
  color?: string;
  is_default?: boolean;
  is_visible?: boolean;
}

export function useCalendars() {
  const [calendars, setCalendars] = useState<Calendar[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchCalendars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/calendars');
      setCalendars(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch calendars');
      console.error('Error fetching calendars:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchVisibleCalendars = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.get('/calendars/visible');
      setCalendars(response.data);
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to fetch visible calendars');
      console.error('Error fetching visible calendars:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  const getDefaultCalendar = useCallback(async (): Promise<Calendar | null> => {
    try {
      const response = await api.get('/calendars/default');
      return response.data;
    } catch (err: any) {
      console.error('Error fetching default calendar:', err);
      return null;
    }
  }, []);

  const createCalendar = useCallback(async (data: CalendarCreateData): Promise<Calendar | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post('/calendars', data);
      const newCalendar = response.data;
      setCalendars(prev => [...prev, newCalendar]);
      return newCalendar;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to create calendar');
      console.error('Error creating calendar:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const updateCalendar = useCallback(async (id: string, data: CalendarUpdateData): Promise<Calendar | null> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.put(`/calendars/${id}`, data);
      const updatedCalendar = response.data;
      setCalendars(prev => prev.map(cal => cal.id === id ? updatedCalendar : cal));
      return updatedCalendar;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to update calendar');
      console.error('Error updating calendar:', err);
      return null;
    } finally {
      setLoading(false);
    }
  }, []);

  const deleteCalendar = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await api.delete(`/calendars/${id}`);
      setCalendars(prev => prev.filter(cal => cal.id !== id));
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to delete calendar');
      console.error('Error deleting calendar:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const setDefaultCalendar = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      await api.post(`/calendars/${id}/set-default`);
      setCalendars(prev => prev.map(cal => ({
        ...cal,
        is_default: cal.id === id
      })));
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to set default calendar');
      console.error('Error setting default calendar:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const toggleCalendarVisibility = useCallback(async (id: string): Promise<boolean> => {
    setLoading(true);
    setError(null);
    try {
      const response = await api.post(`/calendars/${id}/toggle-visibility`);
      const { is_visible } = response.data;
      setCalendars(prev => prev.map(cal => 
        cal.id === id ? { ...cal, is_visible } : cal
      ));
      return true;
    } catch (err: any) {
      setError(err.response?.data?.detail || 'Failed to toggle calendar visibility');
      console.error('Error toggling calendar visibility:', err);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  const ensureDefaultCalendar = useCallback(async (): Promise<Calendar | null> => {
    try {
      const response = await api.post('/calendars/ensure-default');
      return response.data;
    } catch (err: any) {
      console.error('Error ensuring default calendar:', err);
      return null;
    }
  }, []);

  return {
    calendars,
    loading,
    error,
    fetchCalendars,
    fetchVisibleCalendars,
    getDefaultCalendar,
    createCalendar,
    updateCalendar,
    deleteCalendar,
    setDefaultCalendar,
    toggleCalendarVisibility,
    ensureDefaultCalendar,
  };
}
