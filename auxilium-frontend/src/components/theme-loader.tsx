"use client";

import { useThemeSync } from "@/hooks/use-theme-sync";
 
export function ThemeLoader() {
  useThemeSync();
  return null;
} 