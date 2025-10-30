import React from 'react';
import { motion } from 'framer-motion';
export function TypingIndicator(): JSX.Element {
  const dotVariants = {
    animate: {
      y: ["0%", "-50%", "0%"],
      transition: {
        duration: 1.5,
        ease: "easeInOut",
        repeat: Infinity,
        repeatType: "loop",
      },
    },
  };
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      transition={{ duration: 0.2 }}
      className="flex items-center space-x-1 px-4 py-2"
      aria-label="Someone is typing"
    >
      <motion.span
        className="bg-muted-foreground rounded-full h-2 w-2"
        variants={dotVariants}
        animate="animate"
      />
      <motion.span
        className="bg-muted-foreground rounded-full h-2 w-2"
        variants={dotVariants}
        animate="animate"
        transition={{ ...dotVariants.animate.transition, delay: 0.2 }}
      />
      <motion.span
        className="bg-muted-foreground rounded-full h-2 w-2"
        variants={dotVariants}
        animate="animate"
        transition={{ ...dotVariants.animate.transition, delay: 0.4 }}
      />
    </motion.div>
  );
}