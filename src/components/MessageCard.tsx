import React from 'react';
// Removed Card import as it's no longer used for message display
import { formatDistanceToNowStrict } from 'date-fns';
import type { Message } from '@shared/types';
import { motion } from 'framer-motion';
interface MessageCardProps {
  message: Message;
}
export function MessageCard({ message }: MessageCardProps): JSX.Element {
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
      // Removed whileHover prop for chat bubble aesthetic
      className="w-full flex justify-end" // Align messages to the right for a chat feel
    >
      {/* Replaced Card with a div for chat bubble styling */}
      <div className="bg-secondary p-4 rounded-xl shadow-sm max-w-[85%]"> {/* Chat bubble styling */}
        <p className="text-base text-foreground font-medium leading-relaxed text-pretty">
          {message.text}
        </p>
        <p className="text-xs text-muted-foreground text-right mt-2"> {/* Smaller, subtle timestamp */}
          {formattedTimestamp}
        </p>
      </div>
    </motion.div>
  );
}