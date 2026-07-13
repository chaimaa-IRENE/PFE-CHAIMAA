import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { pageTransition } from "./animations";

interface PageTransitionProps {
  children: React.ReactNode;
  className?: string;
  pageKey?: string;
  mode?: "wait" | "sync" | "popLayout";
}

export const PageTransition: React.FC<PageTransitionProps> = ({
  children, className = "", pageKey, mode = "wait",
}) => (
  <AnimatePresence mode={mode}>
    <motion.div
      key={pageKey}
      variants={pageTransition}
      initial="initial"
      animate="animate"
      exit="exit"
      className={className}
    >
      {children}
    </motion.div>
  </AnimatePresence>
);

export { motion, AnimatePresence } from "framer-motion";
