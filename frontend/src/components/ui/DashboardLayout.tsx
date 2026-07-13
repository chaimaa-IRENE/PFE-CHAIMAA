import React, { useState } from "react";
import { motion } from "framer-motion";
import { Truck } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { AnimatedSidebar } from "../../lib/AnimatedSidebar";
import Header from "./Header";
import { PageTransition } from "../../lib/PageTransition";
import { AuroraBackground } from "../../lib/premium/AuroraBackground";

interface DashboardLayoutProps {
  children: React.ReactNode;
  navItems: { id: string; label: string; icon: React.ReactNode; onClick?: () => void; badge?: number; active?: boolean }[];
  title: string;
  subtitle?: string;
  currentUser?: { name?: string; firstname?: string; role?: string } | null;
  onLogout?: () => void;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  navItems,
  title,
  subtitle,
  currentUser,
  onLogout,
}) => {
  const { theme } = useTheme();
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const activeId = navItems.find((n) => n.active)?.id || navItems[0]?.id || "";

  const sidebarItems = navItems.map((n) => ({
    key: n.id,
    label: n.label,
    icon: n.icon,
  }));

  const handleNavSelect = (key: string) => {
    const item = navItems.find((n) => n.id === key);
    item?.onClick?.();
  };

  return (
    <div className="min-h-screen flex bg-[#05070D] relative">
      <AuroraBackground variant={theme === "dark" ? "dark" : "light"} showGrid showBokeh showParticles intensity="subtle" />

      <div className="hidden md:flex relative z-10">
        <AnimatedSidebar
          items={sidebarItems}
          activeKey={activeId}
          onSelect={handleNavSelect}
          collapsed={sidebarCollapsed}
          onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
          logo={
            <div className="flex items-center gap-3">
              <motion.div
                className="w-9 h-9 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-glow-blue shrink-0"
                whileHover={{ scale: 1.05, rotate: -5 }}
              >
                <Truck className="w-5 h-5 text-white" />
              </motion.div>
            </div>
          }
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative z-10">
        <Header
          onLogout={onLogout}
          currentUser={currentUser}
          onMenuToggle={() => setMobileMenuOpen(!mobileMenuOpen)}
          isMenuOpen={mobileMenuOpen}
        />

        <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 glass-strong border-t border-white/[0.04] px-2 py-1 safe-area-bottom">
          <div className="flex justify-around items-center">
            {navItems.slice(0, 5).map((item) => {
              const isActive = activeId === item.id;
              return (
                <motion.button
                  key={item.id}
                  onClick={() => {
                    item.onClick?.();
                    setMobileMenuOpen(false);
                  }}
                  whileTap={{ scale: 0.9 }}
                  className={`flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl relative ${
                    isActive ? "text-blue-400" : "text-slate-500"
                  }`}
                >
                  {isActive && (
                    <motion.span
                      layoutId="mobileNavGlow"
                      className="absolute -top-1 left-1/2 -translate-x-1/2 w-8 h-1 bg-gradient-to-r from-blue-400 to-indigo-500 rounded-full"
                      style={{ boxShadow: "0 0 8px rgba(59,130,246,0.5)" }}
                      transition={{ type: "spring", stiffness: 300, damping: 25 }}
                    />
                  )}
                  <span className="w-5 h-5">{item.icon}</span>
                  <span className="text-[10px] font-medium">{item.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>

        <main className="flex-1 overflow-y-auto pb-16 md:pb-0 custom-scrollbar">
          <PageTransition pageKey={activeId}>{children}</PageTransition>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
