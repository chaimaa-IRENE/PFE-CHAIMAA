import React, { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { spring } from "./animations";
import { soundManager } from "./premium/SoundManager";

interface SidebarItem {
  key: string;
  label: string;
  icon: React.ReactNode;
}

interface AnimatedSidebarProps {
  items: SidebarItem[];
  activeKey: string;
  onSelect: (key: string) => void;
  collapsed: boolean;
  onToggle: () => void;
  logo?: React.ReactNode;
  bottomContent?: React.ReactNode;
  collapseLabel?: string;
}

interface Ripple {
  x: number;
  y: number;
  id: number;
}

export const AnimatedSidebar: React.FC<AnimatedSidebarProps> = ({
  items,
  activeKey,
  onSelect,
  collapsed,
  onToggle,
  logo,
  bottomContent,
  collapseLabel = "Réduire",
}) => {
  const [ripples, setRipples] = useState<Record<string, Ripple[]>>({});

  const handleSelect = useCallback(
    (key: string, e: React.MouseEvent) => {
      soundManager.tap();
      const rect = e.currentTarget.getBoundingClientRect();
      const id = Date.now();
      const ripple: Ripple = {
        x: e.clientX - rect.left,
        y: e.clientY - rect.top,
        id,
      };
      setRipples((prev) => ({
        ...prev,
        [key]: [...(prev[key] || []), ripple],
      }));
      setTimeout(() => {
        setRipples((prev) => ({
          ...prev,
          [key]: (prev[key] || []).filter((r) => r.id !== id),
        }));
      }, 600);
      onSelect(key);
    },
    [onSelect],
  );

  return (
    <motion.aside
      animate={{ width: collapsed ? 72 : 280 }}
      transition={{ type: "spring", stiffness: 180, damping: 22 }}
      className="bg-gradient-to-b from-[#05070D] via-[#0B1220] to-[#05070D] border-r border-white/[0.04] flex flex-col shrink-0 overflow-hidden relative"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.04] to-transparent pointer-events-none" />
      <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-blue-500/20 to-transparent" />

      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-blue-500/[0.05] blur-3xl pointer-events-none" />
      <div className="absolute bottom-20 -left-10 w-32 h-32 rounded-full bg-violet-500/[0.03] blur-3xl pointer-events-none" />

      {logo && (
        <div className="px-5 py-5 border-b border-white/[0.04] relative">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/[0.05] to-transparent" />
          {logo}
        </div>
      )}

      <nav className="flex-1 py-4 px-3 space-y-1 overflow-y-auto custom-scrollbar">
        {items.map((item, index) => {
          const isActive = activeKey === item.key;
          return (
            <motion.button
              key={item.key}
              onClick={(e) => handleSelect(item.key, e)}
              whileHover={{ scale: 1.02, transition: spring }}
              whileTap={{ scale: 0.97, transition: spring }}
              initial={{
                opacity: 0,
                x: -20,
              }}
              animate={{
                opacity: 1,
                x: 0,
              }}
              transition={{
                delay: index * 0.04,
                type: "spring",
                stiffness: 300,
                damping: 25,
              }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs font-medium relative overflow-hidden group transition-colors duration-300 ${
                isActive ? "text-blue-200" : "text-slate-500 hover:text-slate-300"
              }`}
            >
              {isActive && (
                <motion.div
                  layoutId="activeNavBg"
                  className="absolute inset-0 bg-gradient-to-r from-blue-500/12 via-blue-500/6 to-transparent rounded-2xl"
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}

              {isActive && (
                <motion.span
                  layoutId="activeNavGlow"
                  className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-7 bg-gradient-to-b from-blue-400 via-blue-500 to-indigo-500 rounded-full"
                  style={{ boxShadow: "0 0 10px rgba(59,130,246,0.6)" }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                />
              )}

              {(ripples[item.key] || []).map((r) => (
                <motion.span
                  key={r.id}
                  className="absolute rounded-full bg-blue-400/20 pointer-events-none"
                  style={{ left: r.x - 50, top: r.y - 50, width: 100, height: 100 }}
                  initial={{ scale: 0, opacity: 0.5 }}
                  animate={{ scale: 2, opacity: 0 }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              ))}

              <motion.span
                animate={
                  isActive
                    ? { scale: [1, 1.2, 1], transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } }
                    : {}
                }
                whileHover={{ scale: 1.1 }}
                className={`relative z-10 w-5 h-5 flex items-center justify-center transition-colors duration-300 ${
                  isActive ? "text-blue-400" : "text-slate-500 group-hover:text-slate-300"
                }`}
              >
                {item.icon}
              </motion.span>

              <AnimatePresence>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0, x: -8 }}
                    animate={{ opacity: 1, width: "auto", x: 0 }}
                    exit={{ opacity: 0, width: 0, x: -8 }}
                    transition={{ type: "spring", stiffness: 200, damping: 22 }}
                    className="flex-1 text-left overflow-hidden whitespace-nowrap relative z-10"
                  >
                    {item.label}
                  </motion.span>
                )}
              </AnimatePresence>

              {isActive && !collapsed && (
                <motion.span
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="relative z-10"
                >
                  <svg
                    className="w-3 h-3 text-blue-400"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="9 18 15 12 9 6" />
                  </svg>
                </motion.span>
              )}

              {!isActive && (
                <motion.span
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  style={{
                    background:
                      "linear-gradient(90deg, rgba(59,130,246,0.04) 0%, transparent 100%)",
                  }}
                />
              )}
            </motion.button>
          );
        })}
      </nav>

      {bottomContent && (
        <div className="px-3 py-3 border-t border-white/[0.04] relative">
          {bottomContent}
        </div>
      )}

      <div className="px-3 py-3 border-t border-white/[0.04] relative">
        <motion.button
          onClick={() => {
            soundManager.toggle();
            onToggle();
          }}
          whileHover={{ backgroundColor: "rgba(255,255,255,0.03)" }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-2xl text-xs text-slate-500 hover:text-slate-300 transition-colors group"
        >
          <motion.div
            animate={{ rotate: collapsed ? 0 : 180 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="w-4 h-4 flex items-center justify-center"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="15 18 9 12 15 6" />
            </svg>
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, x: -4 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -4 }}
                transition={{ duration: 0.15 }}
              >
                {collapseLabel}
              </motion.span>
            )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  );
};

