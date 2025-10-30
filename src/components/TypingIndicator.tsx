import React from 'react';
import { motion, Variants, Transition } from 'framer-motion'; // Import Variants and Transition types
export function TypingIndicator(): JSX.Element {
  // Define the animation properties for the dot's y-axis movement
  const dotAnimation: Variants = {
    initial: { y: "0%" },
    animate: {
      y: ["0%", "-50%", "0%"],
    },
  };
  // Define the common transition properties for the dots
  const commonTransition: Transition = {
    duration: 1.5,
    ease: "easeInOut",
    repeat: Infinity,
    repeatType: "loop",
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
        variants={dotAnimation}
        initial="initial"
        animate="animate"
        transition={commonTransition} // Apply common transition
      />
      <motion.span
        className="bg-muted-foreground rounded-full h-2 w-2"
        variants={dotAnimation}
        initial="initial"
        animate="animate"
        transition={{ ...commonTransition, delay: 0.2 }} // Merge common transition with delay
      />
      <motion.span
        className="bg-muted-foreground rounded-full h-2 w-2"
        variants={dotAnimation}
        initial="initial"
        animate="animate"
        transition={{ ...commonTransition, delay: 0.4 }} // Merge common transition with delay
      />
    </motion.div>
  );
}