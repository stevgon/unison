import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
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
      whileHover={{ scale: 1.01, boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }}
      className="w-full"
    >
      <Card className="border hover:shadow-md transition-shadow duration-200 ease-in-out">
        <CardContent className="p-6 space-y-3">
          <p className="text-base text-foreground font-medium leading-relaxed text-pretty">
            {message.text}
          </p>
          <p className="text-sm text-muted-foreground text-right">
            {formattedTimestamp}
          </p>
        </CardContent>
      </Card>
    </motion.div>
  );
}