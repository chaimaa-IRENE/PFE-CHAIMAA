import React, { Suspense, useEffect, useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { User, Role, ROLE_LABELS } from "../types/incident";
import { AuroraBackground } from "../lib/premium/AuroraBackground";
import { soundManager } from "../lib/premium/SoundManager";

const ModernChauffeurModule = React.lazy(() => import("./ModernChauffeurModule"));
const ModernPrestataireDashboard = React.lazy(() => import("./ModernPrestataireDashboard"));
const ModernResponsableSupportDashboard = React.lazy(() => import("./ModernResponsableSupportDashboard"));
const ModernAdministrationCentrale = React.lazy(() => import("./ModernAdministrationCentrale"));
const AdminModule = React.lazy(() => import("./AdminModule"));
const ModernSLDashboard = React.lazy(() => import("./ModernSLDashboard"));
const ModernLDDashboard = React.lazy(() => import("./ModernLDDashboard"));
const ModernCPLDashboard = React.lazy(() => import("./ModernCPLDashboard"));
const ModernMaintenanceModule = React.lazy(() => import("./ModernMaintenanceModule"));
const ModernRPFDashboard = React.lazy(() => import("./ModernRPFDashboard"));
const ASMDashboard = React.lazy(() => import("./ASMDashboard"));

const LazyFallback = () => (
  <div className="min-h-screen flex items-center justify-center bg-[#050811]">
    <motion.div
      className="flex flex-col items-center gap-4"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <motion.div
        className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-glow-blue"
        animate={{ scale: [1, 1.05, 1] }}
        transition={{ duration: 2, repeat: Infinity }}
      >
        <svg className="w-8 h-8 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M1 3h15v13H1z" />
          <path d="M16 8h4l3 3v5h-7V8z" />
          <circle cx="5.5" cy="18.5" r="2.5" />
          <circle cx="18.5" cy="18.5" r="2.5" />
        </svg>
      </motion.div>
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-blue-400"
            animate={{ opacity: [0.2, 1, 0.2], y: [0, -6, 0] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  </div>
);

interface AppModernProps {
  currentUser?: User | null;
  onLogout?: () => void;
}

const AppModern: React.FC<AppModernProps> = ({ currentUser: propCurrentUser, onLogout: propOnLogout }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(propCurrentUser || null);
  const [showWelcome, setShowWelcome] = useState(false);

  useEffect(() => {
    if (propCurrentUser) {
      setCurrentUser(propCurrentUser);
      setShowWelcome(true);
      soundManager.notification();
      const timer = setTimeout(() => setShowWelcome(false), 3500);
      return () => clearTimeout(timer);
    }
  }, [propCurrentUser]);

  const handleLogout = () => {
    soundManager.click();
    if (propOnLogout) {
      propOnLogout();
    } else {
      localStorage.removeItem("currentUser");
      setCurrentUser(null);
    }
  };

  const dashboard = useMemo(() => {
    if (!currentUser) return null;
    switch (currentUser.role) {
      case Role.CHAUFFEUR: return <ModernChauffeurModule currentUser={currentUser} onLogout={handleLogout} />;
      case Role.SL: return <ModernSLDashboard currentUser={currentUser} onLogout={handleLogout} />;
      case Role.PRESTATAIRE: return <ModernPrestataireDashboard currentUser={currentUser} onLogout={handleLogout} />;
      case Role.MAINTENANCE: return <ModernMaintenanceModule currentUser={currentUser} onLogout={handleLogout} />;
      case Role.RS: return <ModernResponsableSupportDashboard currentUser={currentUser} onLogout={handleLogout} />;
      case Role.ADMIN: return <AdminModule currentUser={currentUser} onLogout={handleLogout} />;
      case Role.CPL: return <ModernCPLDashboard currentUser={currentUser} onLogout={handleLogout} />;
      case Role.DRL:
      case Role.RFL: return <ModernLDDashboard currentUser={currentUser} onLogout={handleLogout} />;
      case Role.RPF: return <ModernRPFDashboard currentUser={currentUser} onLogout={handleLogout} />;
      case Role.ASM: return <ASMDashboard currentUser={currentUser} onLogout={handleLogout} />;
      default: return <ModernAdministrationCentrale currentUser={currentUser} onLogout={handleLogout} />;
    }
  }, [currentUser]);

  const roleDisplay = (role: Role) => ROLE_LABELS[role] || role;

  return (
    <div className="min-h-screen bg-[#050811] relative">
      <AuroraBackground intensity="subtle" showGrid showBokeh={false} showParticles={false} />

      <AnimatePresence>
        {showWelcome && currentUser && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ type: "spring", stiffness: 200, damping: 22 }}
            className="fixed top-0 left-0 right-0 z-[200] glass-strong border-b border-white/[0.04]"
          >
            <div className="max-w-7xl mx-auto flex items-center gap-3 px-6 py-3">
              <motion.div
                className="w-8 h-8 rounded-full bg-gradient-to-br from-emerald-400 to-emerald-600 flex items-center justify-center shadow-glow-emerald"
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ delay: 0.1, type: "spring", stiffness: 200, damping: 15 }}
              >
                <svg className="w-4 h-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </motion.div>
              <p className="text-sm font-medium text-white">
                Bienvenue, <span className="font-bold">{currentUser.firstname} {currentUser.name}</span> — role: <span className="font-bold text-blue-400">{roleDisplay(currentUser.role)}</span>
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="relative z-10">
        <Suspense fallback={<LazyFallback />}>{dashboard}</Suspense>
      </main>
    </div>
  );
};

export default AppModern;
