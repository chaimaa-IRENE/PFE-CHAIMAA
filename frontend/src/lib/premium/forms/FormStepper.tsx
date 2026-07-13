import React from "react";
import { motion } from "framer-motion";

interface Step {
  label: string;
  icon?: React.ReactNode;
  description?: string;
}

interface FormStepperProps {
  steps: Step[];
  currentStep: number;
  onStepClick?: (step: number) => void;
  className?: string;
  accentColor?: string;
}

export const FormStepper: React.FC<FormStepperProps> = ({
  steps, currentStep, onStepClick, className = "", accentColor = "blue",
}) => {
  const glowColors: Record<string, string> = {
    blue: "rgba(59,130,246,0.4)",
    emerald: "rgba(16,185,129,0.4)",
    violet: "rgba(139,92,246,0.4)",
    amber: "rgba(245,158,11,0.4)",
    rose: "rgba(239,68,68,0.4)",
  };
  const gradients: Record<string, string> = {
    blue: "from-blue-500 to-indigo-500",
    emerald: "from-emerald-500 to-teal-500",
    violet: "from-violet-500 to-purple-500",
    amber: "from-amber-500 to-orange-500",
    rose: "from-rose-500 to-pink-500",
  };
  const glow = glowColors[accentColor] || glowColors.blue;
  const grad = gradients[accentColor] || gradients.blue;

  return (
    <div className={`relative ${className}`}>
      <div className="flex items-center justify-between">
        {steps.map((step, i) => {
          const isCompleted = i < currentStep;
          const isActive = i === currentStep;
          const isPending = i > currentStep;
          const canClick = onStepClick && (isCompleted || isActive);

          return (
            <React.Fragment key={i}>
              <motion.button
                type="button"
                disabled={!canClick}
                onClick={() => canClick && onStepClick?.(i)}
                className={`relative flex flex-col items-center gap-2 ${canClick ? "cursor-pointer" : "cursor-default"}`}
                whileHover={canClick ? { scale: 1.05 } : {}}
                whileTap={canClick ? { scale: 0.95 } : {}}
              >
                <motion.div
                  className={`
                    relative w-11 h-11 rounded-full flex items-center justify-center text-sm font-semibold
                    transition-all duration-500
                    ${isCompleted
                      ? `bg-gradient-to-br ${grad} text-white`
                      : isActive
                        ? `bg-gradient-to-br ${grad} text-white`
                        : "bg-white/[0.04] border border-white/[0.08] text-slate-500"
                    }
                  `}
                  style={{
                    boxShadow: isActive ? `0 0 24px ${glow}, 0 0 48px ${glow.replace("0.4", "0.15")}` : "none",
                  }}
                  animate={{
                    scale: isActive ? 1 : 1,
                  }}
                  transition={{ duration: 0.4 }}
                >
                  {isCompleted ? (
                    <motion.svg
                      width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor"
                      strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
                      initial={{ scale: 0, rotate: -90 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 400, damping: 15 }}
                    >
                      <polyline points="20 6 9 17 4 12" />
                    </motion.svg>
                  ) : (
                    step.icon || <span>{i + 1}</span>
                  )}

                  {isActive && (
                    <motion.span
                      className={`absolute inset-0 rounded-full bg-gradient-to-br ${grad}`}
                      animate={{ scale: [1, 1.3, 1], opacity: [0.3, 0, 0.3] }}
                      transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" as const }}
                      style={{ zIndex: -1 }}
                    />
                  )}
                </motion.div>

                <div className="text-center">
                  <motion.span
                    className={`block text-xs font-medium leading-tight ${
                      isActive ? "text-[#f1f5f9]" : isCompleted ? "text-slate-600 dark:text-slate-400" : "text-slate-600"
                    }`}
                    animate={{ opacity: isActive ? 1 : 0.7 }}
                  >
                    {step.label}
                  </motion.span>
                  {step.description && isActive && (
                    <motion.span
                      className="block text-[10px] text-slate-500 mt-0.5"
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 }}
                    >
                      {step.description}
                    </motion.span>
                  )}
                </div>
              </motion.button>

              {i < steps.length - 1 && (
                <div className="flex-1 h-[2px] mx-3 mt-[-24px] relative overflow-hidden rounded-full bg-white/[0.04]">
                  <motion.div
                    className={`absolute inset-y-0 left-0 rounded-full bg-gradient-to-r ${grad}`}
                    initial={{ width: "0%" }}
                    animate={{
                      width: isCompleted ? "100%" : isActive ? "50%" : "0%",
                    }}
                    transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  />
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
};
