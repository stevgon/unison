import React from "react";
import { cn } from "@/lib/utils"; // Import cn utility
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
};
export function AppLayout({ children, container = false, className, contentClassName }: AppLayoutProps): JSX.Element {
  return (
    <div className={cn("min-h-screen flex flex-col", className)}>
      {container ? (
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-full w-full", contentClassName)}>{children}</div>
      ) : (
        children
      )}
    </div>
  );
}