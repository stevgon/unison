import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/AppLayout';
export function HomePage(): JSX.Element {
  return (
    <AppLayout container className="min-h-screen">
      {/* The main content wrapper, constrained to max-w-3xl and centered, with flex column layout */}
      <div className="max-w-3xl mx-auto w-full flex flex-col h-full relative">
        {/* ThemeToggle remains absolutely positioned */}
        <ThemeToggle className="absolute top-4 right-4 md:top-6 md:right-6" />
        {/* Top Element for debugging layout */}
        <div className="py-8 md:py-10 lg:py-12 text-center text-2xl font-bold text-foreground">
          Top Element
        </div>
        {/* This div will take up all available space, pushing the bottom element down */}
        <div className="flex-grow flex items-center justify-center text-muted-foreground text-lg">
          (Content area for debugging)
        </div>
        {/* Bottom Element for debugging layout */}
        <div className="py-8 md:py-10 lg:py-12 text-center text-2xl font-bold text-foreground">
          Bottom Element
        </div>
        <Toaster richColors closeButton />
      </div>
    </AppLayout>
  );
}