import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FileText, Download, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { docCard, spring, buttonTap, springGentle } from "./animations";

type DocumentStatus = "valid" | "expiring" | "expired" | "pending";

interface DocumentCardProps {
  title: string;
  status: DocumentStatus;
  progress?: number;
  date?: string;
  onDownload?: () => void;
  delay?: number;
}

const statusConfig: Record<DocumentStatus, { icon: React.ReactNode; label: string; color: string; bg: string }> = {
  valid: {
    icon: <CheckCircle className="w-4 h-4" />,
    label: "Valide",
    color: "text-emerald-400",
    bg: "bg-emerald-500/10 border-emerald-500/20",
  },
  expiring: {
    icon: <Clock className="w-4 h-4" />,
    label: "Expiration proche",
    color: "text-amber-400",
    bg: "bg-amber-500/10 border-amber-500/20",
  },
  expired: {
    icon: <AlertTriangle className="w-4 h-4" />,
    label: "Expiré",
    color: "text-rose-400",
    bg: "bg-rose-500/10 border-rose-500/20",
  },
  pending: {
    icon: <Clock className="w-4 h-4" />,
    label: "En attente",
    color: "text-blue-400",
    bg: "bg-blue-500/10 border-blue-500/20",
  },
};

export const DocumentCard: React.FC<DocumentCardProps> = ({
  title, status, progress, date, onDownload, delay = 0,
}) => {
  const cfg = statusConfig[status];

  return (
    <motion.div
      variants={docCard}
      initial="hidden"
      animate="visible"
      exit="exit"
      transition={{ delay }}
      whileHover={{ y: -2, transition: springGentle }}
      className={`rounded-xl border ${cfg.bg} p-3.5 relative overflow-hidden`}
    >
      <div className="flex items-start gap-3">
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center ${cfg.bg}`}>
          <FileText className={`w-4 h-4 ${cfg.color}`} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-gray-200 truncate">{title}</p>
          <div className="flex items-center gap-1.5 mt-1">
            <span className={cfg.color}>{cfg.icon}</span>
            <span className={`text-xs ${cfg.color}`}>{cfg.label}</span>
          </div>
          {date && <p className="text-xs text-gray-600 mt-1">{date}</p>}
        </div>
        {onDownload && (
          <motion.button
            onClick={onDownload}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            className="p-1.5 rounded-lg text-gray-500 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
          >
            <Download className="w-4 h-4" />
          </motion.button>
        )}
      </div>

      {progress !== undefined && (
        <div className="mt-3">
          <div className="h-1.5 rounded-full bg-white/5 overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.3 }}
              className={`h-full rounded-full ${status === "valid" ? "bg-emerald-400" : status === "expiring" ? "bg-amber-400" : "bg-rose-400"}`}
            />
          </div>
        </div>
      )}

      <AnimatePresence>
        {status === "expiring" && (
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            className="absolute inset-y-0 right-0 w-1 bg-gradient-to-b from-amber-400/40 to-transparent"
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
};
