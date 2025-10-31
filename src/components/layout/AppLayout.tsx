import React from "react";
import { cn } from "@/lib/utils"; // Import cn utility
type AppLayoutProps = {
  children: React.ReactNode;
  container?: boolean;
  className?: string;
  contentClassName?: string;
  footer?: React.ReactNode; // Added footer prop
};
export function AppLayout({ children, container = false, className, contentClassName, footer }: AppLayoutProps): JSX.Element {
  return (
    <div className={cn("min-h-screen flex flex-col relative", className)}> {/* Added relative */}
      {container ? (
        <div className={cn("max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex-grow flex flex-col w-full", contentClassName)}>{children}</div>
      ) : (
        children
      )}
      {footer} {/* Render footer as a direct child */}
    </div>
  );
}