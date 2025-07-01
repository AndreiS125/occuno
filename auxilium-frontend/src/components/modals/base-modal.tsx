"use client";

import { ReactNode, useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { createPortal } from "react-dom";
import { gsap } from "gsap";

interface BaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children: ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
}

const sizeClasses = {
  sm: "max-w-sm",
  md: "max-w-md",
  lg: "max-w-lg",
  xl: "max-w-xl",
};

export function BaseModal({
  isOpen,
  onClose,
  title,
  description,
  children,
  className,
  size = "md",
}: BaseModalProps) {
  const backdropRef = useRef<HTMLDivElement>(null);
  const modalRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isMounted, setIsMounted] = useState(false);

  // Fix hydration by only mounting after client-side render
  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (!isMounted || typeof window === "undefined") return;

    const backdrop = backdropRef.current;
    const modal = modalRef.current;
    const container = containerRef.current;

    if (!backdrop || !modal || !container) return;

    if (isOpen) {
      // Prevent body scroll
      document.body.style.overflow = 'hidden';
      
      // Set initial states - just opacity, no scaling
      gsap.set(backdrop, { opacity: 0 });
      gsap.set(modal, { opacity: 0 });
      
      // Show container immediately
      container.style.display = 'block';
      
      // Simple fade-in animation
      const tl = gsap.timeline();
      tl.to(backdrop, { 
        opacity: 1, 
        duration: 0.2, 
        ease: "power2.out" 
      })
      .to(modal, { 
        opacity: 1, 
        duration: 0.05, 
        ease: "power2.out" 
      }, "-=0.1");
        
    } else {
      // Simple fade-out
      const tl = gsap.timeline({
        onComplete: () => {
          if (container) container.style.display = 'none';
          document.body.style.overflow = '';
        }
      });
      
      tl.to([modal, backdrop], { 
        opacity: 0, 
        duration: 0.05, 
        ease: "power2.in" 
      });
    }

    // Cleanup function
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen, isMounted]);

  // Don't render anything during SSR
  if (!isMounted || typeof window === "undefined") return null;

  const modalContent = (
    <div 
      ref={containerRef}
      className="fixed inset-0 z-[9999]" 
      style={{ display: 'none' }}
    >
      {/* Backdrop */}
      <div
        ref={backdropRef}
        onClick={onClose}
        className="fixed inset-0 bg-black/60 backdrop-blur-md z-[9998]"
        style={{ position: 'fixed' }}
      />
      
      {/* Modal Container */}
      <div className="fixed inset-0 flex items-center justify-center z-[9999] p-4" style={{ position: 'fixed' }}>
        <div
          ref={modalRef}
          className={cn(
            "w-full glass-card border-2 border-primary/20 rounded-2xl shadow-2xl shadow-primary/20 max-h-[90vh] overflow-hidden flex flex-col relative",
            "bg-background/95 backdrop-blur-xl",
            sizeClasses[size],
            className
          )}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Glow effect for modal */}
          <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-primary/10 via-secondary/5 to-accent/10 pointer-events-none" />
          
          {/* Header with modern styling */}
          <div className="relative flex items-center justify-between p-6 border-b border-border/30 bg-gradient-to-r from-primary/5 to-secondary/5">
            <div>
              <h2 className="text-2xl font-bold text-gradient">{title}</h2>
              {description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {description}
                </p>
              )}
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-muted/50 rounded-xl transition-all duration-300 glass-card border-primary/20 hover:border-primary/40 group hover:scale-110 hover:rotate-90"
            >
              <X className="w-5 h-5 group-hover:text-primary transition-colors duration-300" />
            </button>
          </div>

          {/* Scrollable Content with enhanced styling */}
          <div className="flex-1 overflow-y-auto relative">
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/50 to-transparent pointer-events-none" />
            <div className="relative z-10">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Use portal to ensure modal is rendered at document body level
  return createPortal(modalContent, document.body);
} 