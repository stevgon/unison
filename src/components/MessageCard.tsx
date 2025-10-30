import React from 'react';
import { formatDistanceToNowStrict } from 'date-fns';
import type { Message } from '@shared/types';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils'; // Import cn utility for conditional class names
interface MessageCardProps {
  message: Message;
  isCurrentUser: boolean; // New prop to determine message origin
}
export function MessageCard({ message, isCurrentUser }: MessageCardProps): JSX.Element {
  const formattedTimestamp = React.useMemo(() => {
    try {
      return formatDistanceToNowStrict(new Date(message.timestamp), { addSuffix: true });
    } catch (e) {
      console.error('Error formatting timestamp:', e);
      return 'just now'; // Fallback for invalid dates
    }
  }, [message.timestamp]);
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3, ease: 'easeOut' }}
      className={cn(
        "w-full flex hover:shadow-md transition-shadow duration-200", // Added hover effect
        isCurrentUser ? "justify-end" : "justify-start"
      )} // Conditionally align messages
    >
      <div
        className={cn(
          "p-4 rounded-xl shadow-sm max-w-[85%]",
          isCurrentUser
            ? "bg-primary/10 text-foreground rounded-br-none" // Subtle background for current user, rounded-br-none for bubble shape
            : "bg-secondary text-foreground rounded-bl-none" // Default secondary background for others, rounded-bl-none for bubble shape
        )}
      >
        <p className="text-base font-medium leading-relaxed text-pretty">
          {message.text}
        </p>
        <p className={cn("text-xs text-muted-foreground mt-2", isCurrentUser ? "text-right" : "text-left")}> {/* Conditionally align timestamp */}
          {formattedTimestamp}
        </p>
      </div>
    </motion.div>
  );
}