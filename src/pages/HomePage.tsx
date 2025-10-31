import React from 'react';
import { ThemeToggle } from '@/components/ThemeToggle';
import { Toaster } from '@/components/ui/sonner';
import { AppLayout } from '@/components/layout/AppLayout';
export function HomePage(): JSX.Element {
  return (
    <AppLayout container className="min-h-screen">
      {/* The main content wrapper, constrained to max-w-3xl and centered, with flex column layout */}
      <div className="max-w-3xl mx-auto w-full h-full flex flex-col items-center justify-center relative">
        {/* ThemeToggle remains absolutely positioned */}
        <ThemeToggle className="absolute top-4 right-4 md:top-6 md:right-6" />
        {/* Centered application name */}
        <h1 className="text-5xl font-bold text-foreground leading-tight animate-fade-in">
          Unison
        </h1>
        <Toaster richColors closeButton />
      </div>
    </AppLayout>
  );
}