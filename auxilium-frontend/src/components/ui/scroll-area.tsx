import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';

interface ScrollAreaProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  className?: string;
}

const ScrollArea = forwardRef<HTMLDivElement, ScrollAreaProps>(
  ({ children, className, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "relative overflow-auto scrollbar-thin scrollbar-thumb-gray-300 scrollbar-track-gray-100 hover:scrollbar-thumb-gray-400",
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);

ScrollArea.displayName = 'ScrollArea';

export { ScrollArea }; 