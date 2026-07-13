import React from "react";
import { motion } from "framer-motion";
import { Truck, FileText, AlertTriangle, Search, Activity } from "lucide-react";
import { scaleInBounce, fadeInUp } from "./animations";
import { RippleButton } from "./RippleButton";

interface EmptyStateProps {
  icon?: "truck" | "document" | "anomaly" | "search" | "chart" | "none";
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
}

const icons: Record<string, React.ReactNode> = {
  truck: <Truck className="w-16 h-16" />,
  document: <FileText className="w-16 h-16" />,
  anomaly: <AlertTriangle className="w-16 h-16" />,
  search: <Search className="w-16 h-16" />,
  chart: <Activity className="w-16 h-16" />,
};

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = "truck", title = "Prêt à démarrer",
  message = "Les données apparaîtront ici une fois disponibles.",
  actionLabel, onAction,
}) => {
  return (
    <motion.div
      variants={fadeInUp}
      initial="hidden"
      animate="visible"
      className="flex flex-col items-center justify-center py-16 px-8"
    >
      <motion.div
        variants={scaleInBounce}
        initial="hidden"
        animate="visible"
        className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500/10 to-indigo-500/10
          border border-blue-500/20 flex items-center justify-center mb-6 text-blue-400/60"
      >
        {icon !== "none" && icons[icon]}
      </motion.div>
      <h3 className="text-lg font-bold text-gray-300 mb-2">{title}</h3>
      <p className="text-sm text-gray-500 text-center max-w-xs mb-6">{message}</p>
      {actionLabel && onAction && (
        <RippleButton onClick={onAction} glow>
          {actionLabel}
        </RippleButton>
      )}
    </motion.div>
  );
};
