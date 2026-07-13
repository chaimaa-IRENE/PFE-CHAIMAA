import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { fadeInUp, rowStagger, listItem } from "./animations";

interface AnimatedTableProps {
  headers: { key: string; label: string; align?: "left" | "center" | "right" }[];
  rows: { key: string | number; cells: any[]; onClick?: () => void }[];
  maxHeight?: string;
  emptyMessage?: string;
}

export const AnimatedTable: React.FC<AnimatedTableProps> = ({
  headers, rows, maxHeight, emptyMessage = "Aucune donnée",
}) => {
  if (rows.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-center py-12 text-xs text-gray-500"
      >
        <div className="flex flex-col items-center gap-2">
          <svg className="w-8 h-8 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
          </svg>
          <span>{emptyMessage}</span>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className={`overflow-x-auto ${maxHeight ? `overflow-y-auto ${maxHeight}` : ""} custom-scrollbar rounded-xl border border-white/[0.04]`}
    >
      <table className="w-full text-xs">
        <thead>
          <tr className="border-b border-white/[0.06]">
            {headers.map((h) => (
              <th
                key={h.key}
                className={`py-3 px-3 font-bold text-[10px] uppercase tracking-widest
                  ${h.align === "right" ? "text-right" : h.align === "center" ? "text-center" : "text-left"}
                  text-gray-500 bg-white/[0.02]`}
              >
                {h.label}
              </th>
            ))}
          </tr>
        </thead>
        <motion.tbody
          variants={rowStagger}
          initial="hidden"
          animate="visible"
        >
          <AnimatePresence mode="popLayout">
            {rows.map((row, idx) => (
              <motion.tr
                key={row.key}
                variants={listItem}
                layout
                whileHover={{
                  backgroundColor: "rgba(59,130,246,0.06)",
                  transition: { duration: 0.15 },
                }}
                onClick={row.onClick}
                className={`border-b border-white/[0.03] transition-colors group
                  ${row.onClick ? "cursor-pointer" : ""}
                  ${idx % 2 === 0 ? "bg-white/[0.01]" : ""}`}
              >
                {row.cells.map((cell, i) => {
                  const align = headers[i]?.align || "left";
                  return (
                    <td
                      key={i}
                      className={`py-3 px-3 ${
                        align === "right" ? "text-right" : align === "center" ? "text-center" : "text-left"
                      }`}
                    >
                      {cell}
                    </td>
                  );
                })}
              </motion.tr>
            ))}
          </AnimatePresence>
        </motion.tbody>
      </table>
    </motion.div>
  );
};
