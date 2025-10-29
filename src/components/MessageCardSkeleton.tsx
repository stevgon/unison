import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
interface MessageCardSkeletonProps {
  isCurrentUser?: boolean; // Optional prop to simulate current user's message alignment
}
export function MessageCardSkeleton({ isCurrentUser = false }: MessageCardSkeletonProps): JSX.Element {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "w-full flex",
        isCurrentUser ? "justify-end" : "justify-start"
      )}
    >
      <div
        className={cn(
          "p-4 rounded-xl shadow-sm max-w-[85%]",
          isCurrentUser
            ? "bg-primary/10 rounded-br-none"
            : "bg-secondary rounded-bl-none"
        )}
      >
        <Skeleton className="h-4 w-48 mb-2" /> {/* Message text line 1 */}
        <Skeleton className="h-4 w-32 mb-2" /> {/* Message text line 2 */}
        <Skeleton className="h-3 w-24 mt-2" /> {/* Timestamp */}
      </div>
    </motion.div>
  );
}