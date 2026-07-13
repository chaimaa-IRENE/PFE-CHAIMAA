import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sun, Moon, Menu, X, Bell, LogOut, User, ChevronDown, Search, Cloud, Clock, Truck } from "lucide-react";
import { useTheme } from "../../contexts/ThemeContext";
import { soundManager } from "../../lib/premium/SoundManager";
import { spring } from "../../lib/animations";

interface HeaderProps {
  onLogout?: () => void;
  currentUser?: { name?: string; firstname?: string; role?: string } | null;
  onMenuToggle?: () => void;
  isMenuOpen?: boolean;
  notificationCount?: number;
}

const useClock = () => {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(t);
  }, []);
  return time;
};

const Greeting: React.FC<{ name?: string }> = ({ name }) => {
  const hour = new Date().getHours();
  let greeting = "Bonsoir";
  if (hour < 6) greeting = "Bonne nuit";
  else if (hour < 12) greeting = "Bonjour";
  else if (hour < 18) greeting = "Bon après-midi";
  return <span>{greeting}, {name || "Chaimaa"}</span>;
};

const Header: React.FC<HeaderProps> = ({
  onLogout,
  currentUser,
  onMenuToggle,
  isMenuOpen,
  notificationCount = 0,
}) => {
  const { theme, toggleTheme } = useTheme();
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchValue, setSearchValue] = useState("");
  const [notifOpen, setNotifOpen] = useState(false);
  const time = useClock();

  const timeStr = time.toLocaleTimeString("fr-FR", {
    hour: "2-digit",
    minute: "2-digit",
  });
  const dateStr = time.toLocaleDateString("fr-FR", {
    weekday: "short",
    day: "numeric",
    month: "short",
  });

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className="sticky top-0 z-50 glass-strong border-b border-white/[0.04]"
    >
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-2xl flex items-center justify-center shadow-glow-blue overflow-hidden"
            >
              <Truck className="w-5 h-5 text-white" />
            </motion.div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gradient">
                Smart <span className="text-gradient-blue">Fleet</span>
              </h1>
              <p className="text-[11px] text-slate-500 font-medium">
                <Greeting name={currentUser?.firstname || currentUser?.name} />
              </p>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-3">
            <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 glass rounded-xl">
              <Clock className="w-3.5 h-3.5 text-blue-400" />
              <span className="text-xs font-medium text-slate-300 tabular-nums">{timeStr}</span>
              <span className="text-xs text-slate-500 capitalize">{dateStr}</span>
            </div>

            <div className="hidden xl:flex items-center gap-1.5 px-3 py-1.5 glass rounded-xl">
              <Cloud className="w-3.5 h-3.5 text-slate-500 dark:text-slate-400" />
              <span className="text-xs font-medium text-slate-500 dark:text-slate-400">22°C</span>
              <span className="text-xs text-slate-500">Casablanca</span>
            </div>

            <AnimatePresence mode="wait">
              {searchOpen ? (
                <motion.div
                  key="search-expanded"
                  initial={{ width: 0, opacity: 0 }}
                  animate={{ width: 260, opacity: 1 }}
                  exit={{ width: 0, opacity: 0 }}
                  transition={{ type: "spring", stiffness: 300, damping: 25 }}
                  className="relative"
                >
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-slate-400" />
                  <input
                    autoFocus
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    onBlur={() => {
                      if (!searchValue) setSearchOpen(false);
                    }}
                    placeholder="Rechercher..."
                    className="w-full pl-9 pr-3 py-2 glass border border-white/[0.06] rounded-xl text-sm text-white placeholder-slate-500 focus:outline-none focus:border-blue-500/40 transition-all"
                  />
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.9 }}
                    onClick={() => {
                      setSearchOpen(false);
                      setSearchValue("");
                    }}
                    className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300"
                  >
                    <X className="w-3.5 h-3.5" />
                  </motion.button>
                </motion.div>
              ) : (
                <motion.button
                  key="search-closed"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => {
                    setSearchOpen(true);
                    soundManager.tap();
                  }}
                  className="p-2 rounded-xl glass hover:bg-white/[0.06] transition-colors"
                >
                  <Search className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                </motion.button>
              )}
            </AnimatePresence>

            <div className="relative">
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => {
                  setNotifOpen(!notifOpen);
                  soundManager.tap();
                }}
                className="relative p-2 rounded-xl glass hover:bg-white/[0.06] transition-colors"
              >
                <motion.div
                  animate={
                    notificationCount > 0
                      ? { rotate: [0, -12, 12, -8, 8, 0] }
                      : {}
                  }
                  transition={{ duration: 0.5, repeat: notificationCount > 0 ? Infinity : 0, repeatDelay: 3 }}
                >
                  <Bell
                    className={`w-4 h-4 ${
                      notificationCount > 0 ? "text-blue-400" : "text-slate-500 dark:text-slate-400"
                    }`}
                  />
                </motion.div>
                {notificationCount > 0 && (
                  <motion.span
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-gradient-to-br from-rose-500 to-red-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center shadow-glow-rose"
                  >
                    {notificationCount > 9 ? "9+" : notificationCount}
                  </motion.span>
                )}
              </motion.button>

              <AnimatePresence>
                {notifOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: -8, scale: 0.95 }}
                    transition={spring}
                    className="absolute right-0 top-full mt-2 w-72 glass-strong border border-white/[0.06] rounded-2xl shadow-premium p-3 z-50"
                  >
                    <p className="text-sm font-semibold text-white mb-2 px-1">
                      Notifications
                    </p>
                    <div className="space-y-1">
                      {[
                        { title: "Nouvelle panne critique", time: "Il y a 5 min", color: "rose" },
                        { title: "Intervention terminée", time: "Il y a 1h", color: "emerald" },
                        { title: "Checkup conforme", time: "Il y a 2h", color: "blue" },
                      ].map((n, i) => (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.05 }}
                          className="flex items-start gap-2.5 p-2.5 rounded-xl hover:bg-white/[0.03] transition-colors cursor-pointer"
                        >
                          <div
                            className={`w-2 h-2 rounded-full mt-1.5 ${
                              n.color === "rose"
                                ? "bg-rose-400"
                                : n.color === "emerald"
                                ? "bg-emerald-400"
                                : "bg-blue-400"
                            }`}
                          />
                          <div className="flex-1">
                            <p className="text-xs font-medium text-slate-200">
                              {n.title}
                            </p>
                            <p className="text-[10px] text-slate-500">{n.time}</p>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                toggleTheme();
                soundManager.toggle();
              }}
              className="p-2 rounded-xl glass hover:bg-white/[0.06] transition-colors"
            >
              <AnimatePresence mode="wait">
                {theme === "light" ? (
                  <motion.div
                    key="moon"
                    initial={{ rotate: -90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: 90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Moon className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </motion.div>
                ) : (
                  <motion.div
                    key="sun"
                    initial={{ rotate: 90, opacity: 0 }}
                    animate={{ rotate: 0, opacity: 1 }}
                    exit={{ rotate: -90, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Sun className="w-4 h-4 text-amber-400" />
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.button>

            {currentUser && (
              <div className="relative">
                <motion.button
                  onClick={() => {
                    setUserMenuOpen(!userMenuOpen);
                    soundManager.tap();
                  }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center gap-3 px-3 py-2 glass rounded-xl hover:bg-white/[0.06] transition-colors"
                >
                  <motion.div
                    className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-glow-blue"
                    whileHover={{ scale: 1.05 }}
                  >
                    <span className="text-white font-semibold text-sm">
                      {(currentUser.name || currentUser.firstname || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </motion.div>
                  <div className="text-left hidden lg:block">
                    <p className="text-sm font-semibold text-white">
                      {currentUser.name || currentUser.firstname || "Utilisateur"}
                    </p>
                    <p className="text-[11px] text-slate-500 dark:text-slate-400">{currentUser.role}</p>
                  </div>
                  <motion.div animate={{ rotate: userMenuOpen ? 180 : 0 }} transition={spring}>
                    <ChevronDown className="w-4 h-4 text-slate-500 dark:text-slate-400" />
                  </motion.div>
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -8, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -8, scale: 0.95 }}
                      transition={spring}
                      className="absolute right-0 top-full mt-2 w-52 glass-strong border border-white/[0.06] rounded-2xl shadow-premium p-2 z-50"
                    >
                      <div className="px-3 py-2 border-b border-white/[0.04] mb-1">
                        <p className="text-sm font-semibold text-white">
                          {currentUser.name || currentUser.firstname}
                        </p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</p>
                      </div>
                      <button className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-slate-300 hover:bg-white/[0.04] transition-colors">
                        <User className="w-4 h-4" />
                        Profil
                      </button>
                      {onLogout && (
                        <button
                          onClick={() => {
                            soundManager.click();
                            onLogout();
                          }}
                          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm text-rose-400 hover:bg-rose-500/10 transition-colors"
                        >
                          <LogOut className="w-4 h-4" />
                          Déconnexion
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            )}
          </div>

          <div className="flex md:hidden items-center gap-2">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => {
                toggleTheme();
                soundManager.toggle();
              }}
              className="p-2 rounded-xl glass hover:bg-white/[0.06] transition-colors"
            >
              {theme === "light" ? (
                <Moon className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              ) : (
                <Sun className="w-5 h-5 text-amber-400" />
              )}
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={onMenuToggle}
              className="p-2 rounded-xl glass hover:bg-white/[0.06] transition-colors"
            >
              {isMenuOpen ? (
                <X className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              ) : (
                <Menu className="w-5 h-5 text-slate-500 dark:text-slate-400" />
              )}
            </motion.button>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {isMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden glass-strong border-t border-white/[0.04] overflow-hidden"
          >
            <div className="px-4 py-4 space-y-3">
              <div className="flex items-center gap-2 px-3 py-2 glass rounded-xl">
                <Clock className="w-3.5 h-3.5 text-blue-400" />
                <span className="text-xs font-medium text-slate-300">{timeStr}</span>
                <span className="text-xs text-slate-500 capitalize">{dateStr}</span>
              </div>
              {currentUser && (
                <div className="flex items-center gap-3 px-4 py-3 glass rounded-xl">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-600 rounded-full flex items-center justify-center shadow-glow-blue">
                    <span className="text-white font-semibold">
                      {(currentUser.name || currentUser.firstname || "U")
                        .charAt(0)
                        .toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-white">
                      {currentUser.name || currentUser.firstname || "Utilisateur"}
                    </p>
                    <p className="text-xs text-slate-500 dark:text-slate-400">{currentUser.role}</p>
                  </div>
                </div>
              )}
              {onLogout && (
                <button
                  onClick={() => {
                    soundManager.click();
                    onLogout();
                  }}
                  className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 rounded-xl text-sm font-semibold hover:bg-rose-500/20 transition-colors"
                >
                  <LogOut className="w-4 h-4" />
                  Déconnexion
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
};

export default Header;
