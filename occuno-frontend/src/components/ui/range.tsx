import * as React from "react";
import { cn } from "@/lib/utils";

export interface RangeProps
  extends React.InputHTMLAttributes<HTMLInputElement> {}

const Range = React.forwardRef<HTMLInputElement, RangeProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="range"
        className={cn(
          // Base styling
          "relative h-2 w-full cursor-pointer appearance-none rounded-lg bg-muted outline-none",
          // Track styling
          "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
          // Webkit thumb styling
          "[&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-primary [&::-webkit-slider-thumb]:cursor-pointer [&::-webkit-slider-thumb]:border-0 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:transition-transform [&::-webkit-slider-thumb]:hover:scale-110",
          // Firefox thumb styling
          "[&::-moz-range-thumb]:appearance-none [&::-moz-range-thumb]:h-5 [&::-moz-range-thumb]:w-5 [&::-moz-range-thumb]:rounded-full [&::-moz-range-thumb]:bg-primary [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-thumb]:border-0 [&::-moz-range-thumb]:shadow-md",
          // Firefox track styling
          "[&::-moz-range-track]:h-2 [&::-moz-range-track]:rounded-lg [&::-moz-range-track]:bg-muted",
          // Ensure full width usage and edge reach
          "slider-full-range",
          className
        )}
        ref={ref}
        {...props}
      />
    );
  }
);
Range.displayName = "Range";

export { Range }; 