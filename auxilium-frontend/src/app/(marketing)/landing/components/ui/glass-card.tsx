import { cn } from "@/lib/utils";
import { HTMLAttributes, forwardRef } from "react";

interface GlassCardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: "default" | "hover" | "glow";
  size?: "sm" | "md" | "lg";
}

const GlassCard = forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = "default", size = "md", children, ...props }, ref) => {
    const baseClasses = "glass-card relative";
    
    const variants = {
      default: "border-border/20",
      hover: "hover:border-primary/40 hover:shadow-lg hover:shadow-primary/20 transition-all duration-300",
      glow: "border-primary/30 shadow-lg shadow-primary/10 animate-pulse-glow"
    };

    const sizes = {
      sm: "p-4 rounded-lg",
      md: "p-6 rounded-xl", 
      lg: "p-8 rounded-2xl"
    };

    return (
      <div
        ref={ref}
        className={cn(
          baseClasses,
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

GlassCard.displayName = "GlassCard";

export { GlassCard }; 