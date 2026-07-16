import React, { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import AppModern from "./components/AppModern";
import ForgotPassword from "./components/ForgotPassword";
import ResetPassword from "./components/ResetPassword";
import Login from "./components/Login";
import { ThemeProvider } from "./contexts/ThemeContext";
import { ToastProvider } from "./lib/Toast";
import { AuroraBackground } from "./lib/premium/AuroraBackground";
import { soundManager } from "./lib/premium/SoundManager";
import { User } from "./types/incident";
import { Truck, Shield, ArrowRight, Activity, ChevronDown, Gauge, Zap } from "lucide-react";
import { pageTransition, fadeInUp, springBouncy, cardStagger } from "./lib/animations";
import "./App.css";


function App() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [page, setPage] = useState<"cover" | "login" | "forgot" | "reset">("cover");

  const handleLoginSuccess = (user: User) => {
    setCurrentUser(user);
    localStorage.setItem("currentUser", JSON.stringify(user));
  };

  const handleLogout = () => {
    setCurrentUser(null);
    localStorage.removeItem("currentUser");
  };

  if (currentUser) {
    return (
      <ThemeProvider>
        <ToastProvider>
          <AppModern currentUser={currentUser} onLogout={handleLogout} />
        </ToastProvider>
      </ThemeProvider>
    );
  }

  return (
    <ThemeProvider>
      <ToastProvider>
        <AnimatePresence mode="wait">
          {page === "forgot" && (
            <motion.div key="forgot" variants={pageTransition} initial="initial" animate="animate" exit="exit">
              <ForgotPassword onBack={() => setPage("login")} />
            </motion.div>
          )}
          {page === "reset" && (
            <motion.div key="reset" variants={pageTransition} initial="initial" animate="animate" exit="exit">
              <ResetPassword onBack={() => setPage("login")} />
            </motion.div>
          )}
          {page === "cover" && (
            <motion.div key="cover" variants={pageTransition} initial="initial" animate="animate" exit="exit">
              <div className="cover-page">
                <AuroraBackground intensity="medium" showGrid showBokeh showParticles />
                <div className="cover-content">
                  <motion.div
                    variants={fadeInUp}
                    initial="hidden"
                    animate="visible"
                    className="cover-badge"
                  >
                    <span className="cover-badge-dot" />
                    Fleet Management System v2.0
                  </motion.div>

                  <motion.div variants={cardStagger} initial="hidden" animate="visible">
                    <motion.div variants={fadeInUp} className="cover-logo">
                      <motion.div
                        className="cover-logo-icon"
                        whileHover={{ scale: 1.05, rotate: -5 }}
                        transition={springBouncy}
                      >
                        <Truck className="w-8 h-8 text-white" />
                        <div className="cover-logo-glow" />
                      </motion.div>
                    </motion.div>

                    <motion.h1 variants={fadeInUp} className="cover-title">
                      Smart <span>Fleet</span>
                    </motion.h1>

                    <motion.p variants={fadeInUp} className="cover-subtitle">
                      Pilotage intelligent de votre parc vehicules
                      <br />
                      <span className="cover-subtitle-tags">Securite · Performance · Conformite</span>
                    </motion.p>

                    <motion.div variants={fadeInUp} className="cover-features">
                      {[
                        { icon: Activity, label: "Monitoring temps reel", color: "blue" },
                        { icon: Shield, label: "Conformite documentaire", color: "emerald" },
                        { icon: Truck, label: "Gestion des interventions", color: "amber" },
                        { icon: Gauge, label: "KPIs & analytics", color: "violet" },
                      ].map((f, i) => {
                        const Icon = f.icon;
                        return (
                          <motion.div
                            key={i}
                            className="cover-feature"
                            whileHover={{ y: -2, scale: 1.02 }}
                            transition={{ type: "spring", stiffness: 300, damping: 25 }}
                          >
                            <Icon className={`w-4 h-4 cover-feature-icon-${f.color}`} />
                            <span>{f.label}</span>
                          </motion.div>
                        );
                      })}
                    </motion.div>
                  </motion.div>

                  <motion.button
                    className="cover-cta"
                    onClick={() => {
                      soundManager.click();
                      setPage("login");
                    }}
                    whileHover={{
                      scale: 1.02,
                      boxShadow: "0 16px 50px -8px rgba(59,130,246,0.6)",
                    }}
                    whileTap={{ scale: 0.97 }}
                  >
                    <span>Acceder a l'application</span>
                    <ArrowRight className="w-5 h-5 cover-cta-arrow" />
                    <div className="cover-cta-shimmer" />
                  </motion.button>

                  <motion.p
                    className="cover-footer"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 1.2, duration: 0.5 }}
                  >
                    Danone · DriverHub v2.0
                  </motion.p>
                </div>

                <motion.div
                  className="cover-scroll"
                  animate={{ y: [0, 8, 0], opacity: [0.4, 0.8, 0.4] }}
                  transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                >
                  <ChevronDown className="w-5 h-5" />
                </motion.div>

                <motion.div
                  className="cover-truck-decoration"
                  initial={{ x: -100, opacity: 0 }}
                  animate={{ x: 0, opacity: 0.08 }}
                  transition={{ delay: 1, duration: 1.5, ease: [0.16, 1, 0.3, 1] }}
                >
                  <svg width="320" height="160" viewBox="0 0 340 170" fill="none">
                    <rect x="8" y="28" width="195" height="82" rx="6" fill="#2563eb" />
                    <rect x="195" y="22" width="108" height="88" rx="8" fill="#1e293b" />
                    <rect x="205" y="28" width="40" height="34" rx="5" fill="#060e1a" />
                    <rect x="253" y="28" width="38" height="34" rx="5" fill="#060e1a" />
                    <circle cx="75" cy="120" r="18" fill="#0a0f18" />
                    <circle cx="255" cy="120" r="18" fill="#0a0f18" />
                  </svg>
                </motion.div>

                <motion.div
                  className="cover-zap"
                  initial={{ opacity: 0, scale: 0 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 1.5, type: "spring", stiffness: 200, damping: 15 }}
                >
                  <Zap className="w-3 h-3 text-amber-400" />
                </motion.div>
              </div>
            </motion.div>
          )}
          {page === "login" && (
            <motion.div key="login" variants={pageTransition} initial="initial" animate="animate" exit="exit">
              <Login onLoginSuccess={handleLoginSuccess} onForgotPassword={() => setPage("forgot")} />
            </motion.div>
          )}
        </AnimatePresence>
      </ToastProvider>
    </ThemeProvider>
  );
}

export default App;
