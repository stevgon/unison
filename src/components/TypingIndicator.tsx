import React from 'react';
import { motion, Variants } from 'framer-motion'; // Import Variants type
export function TypingIndicator(): JSX.Element {
  // Define a base variant for the dot animation
  const dotBaseVariants: Variants = {
    initial: { y: "0%" },
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
        variants={dotBaseVariants}
        initial="initial"
        animate="animate"
      />
      <motion.span
        className="bg-muted-foreground rounded-full h-2 w-2"
        variants={dotBaseVariants}
        initial="initial"
        animate="animate"
        transition={{ ...dotBaseVariants.animate.transition, delay: 0.2 }} // Apply delay directly to the motion.span's transition prop
      />
      <motion.span
        className="bg-muted-foreground rounded-full h-2 w-2"
        variants={dotBaseVariants}
        initial="initial"
        animate="animate"
        transition={{ ...dotBaseVariants.animate.transition, delay: 0.4 }} // Apply delay directly to the motion.span's transition prop
      />
    </motion.div>
  );
}