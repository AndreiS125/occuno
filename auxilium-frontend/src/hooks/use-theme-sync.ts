import { useEffect } from "react";
import { useTheme } from "next-themes";
import { userApi } from "@/lib/api";

export function useThemeSync() {
  const { theme, setTheme, systemTheme } = useTheme();

  // Load theme from user preferences on mount
  useEffect(() => {
    const loadTheme = async () => {
      try {
        const profile = await userApi.getProfile();
        // The backend stores preferences in a different structure
        const savedTheme = (profile as any).preferences?.theme;
        
        if (savedTheme && savedTheme !== theme) {
          console.log("🎨 Loading saved theme:", savedTheme);
          setTheme(savedTheme);
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
      }
    };

    loadTheme();
  }, [setTheme]); // Only run on mount

  // Function to update theme both locally and in preferences
  const updateTheme = async (newTheme: string) => {
    try {
      // Update local theme immediately
      setTheme(newTheme);
      
      // Save to backend
      await userApi.updatePreferences({ theme: newTheme });
      console.log("🎨 Theme saved:", newTheme);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  return { theme, setTheme: updateTheme, systemTheme };
} 