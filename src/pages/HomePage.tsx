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
        {/* Placeholder content for the reset UI */}
        <div className="flex-grow flex items-center justify-center text-muted-foreground text-lg">
          <p>UI Reset. Ready for new implementation.</p>
        </div>
        <Toaster richColors closeButton />
      </div>
    </AppLayout>
  );
}