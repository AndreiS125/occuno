"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Calendar, Palette, Check, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Calendar as CalendarType } from "@/types";

interface CalendarManagementModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (calendar: Partial<CalendarType>) => Promise<void>;
  onDelete?: (calendarId: string) => Promise<void>;
  calendar?: CalendarType | null; // null for create, CalendarType for edit
  mode: 'create' | 'edit';
}

const PRESET_COLORS = [
  "#3b82f6", // Blue
  "#ef4444", // Red
  "#22c55e", // Green
  "#f59e0b", // Amber
  "#8b5cf6", // Purple
  "#ec4899", // Pink
  "#06b6d4", // Cyan
  "#84cc16", // Lime
  "#f97316", // Orange
  "#6366f1", // Indigo
  "#14b8a6", // Teal
  "#a855f7", // Violet
];

export function CalendarManagementModal({
  isOpen,
  onClose,
  onSave,
  onDelete,
  calendar,
  mode
}: CalendarManagementModalProps) {
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    color: "#3b82f6"
  });
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Reset form when modal opens/closes or calendar changes
  useEffect(() => {
    if (isOpen) {
      if (mode === 'edit' && calendar) {
        setFormData({
          name: calendar.name,
          description: calendar.description || "",
          color: calendar.color
        });
      } else {
        setFormData({
          name: "",
          description: "",
          color: "#3b82f6"
        });
      }
    }
  }, [isOpen, calendar, mode]);

  const handleSave = async () => {
    if (!formData.name.trim()) return;

    setIsSaving(true);
    try {
      const calendarData: Partial<CalendarType> = {
        name: formData.name.trim(),
        description: formData.description.trim() || undefined,
        color: formData.color,
        is_visible: true
      };

      if (mode === 'edit' && calendar) {
        calendarData.id = calendar.id;
      }

      await onSave(calendarData);
      onClose();
    } catch (error) {
      console.error("Error saving calendar:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!calendar || !onDelete) return;

    setIsDeleting(true);
    try {
      await onDelete(calendar.id);
      onClose();
    } catch (error) {
      console.error("Error deleting calendar:", error);
    } finally {
      setIsDeleting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/30"
          onClick={onClose}
        />

        {/* Modal */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative bg-card border rounded-lg shadow-lg w-full max-w-md mx-4"
        >
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b">
            <div className="flex items-center space-x-2">
              <Calendar className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-semibold">
                {mode === 'create' ? 'Create Calendar' : 'Edit Calendar'}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content */}
          <div className="p-6 space-y-4">
            {/* Calendar Name */}
            <div className="space-y-2">
              <Label htmlFor="calendar-name">Calendar Name *</Label>
              <Input
                id="calendar-name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="My Calendar"
                className="w-full"
              />
            </div>

            {/* Description */}
            <div className="space-y-2">
              <Label htmlFor="calendar-description">Description</Label>
              <Textarea
                id="calendar-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optional description..."
                rows={3}
                className="w-full resize-none"
              />
            </div>

            {/* Color Picker */}
            <div className="space-y-3">
              <Label>Calendar Color</Label>
              <div className="grid grid-cols-6 gap-2">
                {PRESET_COLORS.map((color) => (
                  <button
                    key={color}
                    onClick={() => setFormData({ ...formData, color })}
                    className="relative w-8 h-8 rounded-full border-2 border-border hover:scale-110 transition-transform"
                    style={{ backgroundColor: color }}
                  >
                    {formData.color === color && (
                      <Check className="w-4 h-4 text-white absolute inset-0 m-auto" />
                    )}
                  </button>
                ))}
              </div>
              
              {/* Custom Color Input */}
              <div className="flex items-center space-x-2">
                <Label htmlFor="custom-color" className="text-sm">Custom:</Label>
                <input
                  id="custom-color"
                  type="color"
                  value={formData.color}
                  onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                  className="w-8 h-8 border border-border rounded cursor-pointer"
                />
                <span className="text-sm text-muted-foreground">{formData.color}</span>
              </div>
            </div>

            {/* Calendar Preview */}
            <div className="p-3 border rounded-md bg-muted/20">
              <div className="flex items-center space-x-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: formData.color }}
                />
                <span className="text-sm font-medium">
                  {formData.name || "Calendar Preview"}
                </span>
              </div>
              {formData.description && (
                <p className="text-xs text-muted-foreground mt-1 ml-5">
                  {formData.description}
                </p>
              )}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between p-6 border-t">
            {/* Delete Button (only in edit mode) */}
            {mode === 'edit' && calendar && onDelete && (
              <Button
                variant="destructive"
                onClick={handleDelete}
                disabled={isDeleting}
                className="flex items-center space-x-2"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? "Deleting..." : "Delete"}</span>
              </Button>
            )}

            {/* Spacer for create mode */}
            {mode === 'create' && <div />}

            {/* Action Buttons */}
            <div className="flex items-center space-x-2">
              <Button variant="outline" onClick={onClose}>
                Cancel
              </Button>
              <Button
                onClick={handleSave}
                disabled={!formData.name.trim() || isSaving}
              >
                {isSaving ? "Saving..." : mode === 'create' ? "Create" : "Save"}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
