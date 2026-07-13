import React from "react";
import { motion } from "framer-motion";
import { useAnimatedNumber } from "./useAnimatedNumber";

interface AnimatedCounterProps {
  value: number;
  suffix?: string;
  prefix?: string;
  decimals?: number;
  duration?: number;
  className?: string;
  inline?: boolean;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value, suffix = "", prefix = "", decimals = 0, duration = 800, className = "", inline = false,
}) => {
  const display = useAnimatedNumber(value, duration, decimals);
  const Wrapper = inline ? React.Fragment : motion.span;

  const content = (
    <>{prefix}{display.toFixed(decimals)}{suffix}</>
  );

  if (inline) {
    return <span className={className}>{content}</span>;
  }

  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
    >
      {content}
    </motion.span>
  );
};
