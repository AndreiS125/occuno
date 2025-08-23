import * as React from "react";

export interface SeparatorProps extends React.HTMLAttributes<HTMLDivElement> {
  orientation?: "horizontal" | "vertical";
  decorative?: boolean;
}

export function Separator({
  orientation = "horizontal",
  decorative = true,
  className = "",
  ...props
}: SeparatorProps) {
  const sizeClass = orientation === "vertical" ? "h-full w-px" : "w-full h-px";
  const base = "shrink-0 bg-gray-200 dark:bg-gray-800";

  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={orientation}
      className={`${base} ${sizeClass} ${className}`}
      {...props}
    />
  );
}
