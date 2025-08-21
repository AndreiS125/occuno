import * as React from "react";

export type AlertProps = React.HTMLAttributes<HTMLDivElement> & {
  variant?: "default" | "destructive";
};

export function Alert({ variant = "default", className = "", ...props }: AlertProps) {
  const base = "rounded-md border p-4 text-sm";
  const variants: Record<string, string> = {
    default: "border-gray-300 text-gray-800 dark:border-gray-700 dark:text-gray-200 bg-white dark:bg-black/20",
    destructive:
      "border-red-500/60 text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20",
  };
  return (
    <div className={`${base} ${variants[variant] ?? variants.default} ${className}`} {...props} />
  );
}

export function AlertDescription({ className = "", ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={`mt-1 leading-relaxed ${className}`} {...props} />;
}
