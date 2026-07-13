import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronDown } from 'lucide-react';
import { sidebarItem, fadeInLeft, easeOut } from '../../lib/animations';
import logoDanone from '../../assets/logo-danone.svg';
import { useTheme } from '../../contexts/ThemeContext';

export interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  onClick?: () => void;
  badge?: number;
  active?: boolean;
  children?: { label: string; onClick?: () => void; badge?: number }[];
}

interface SidebarProps {
  items: NavItem[];
  title?: string;
  subtitle?: string;
  isOpen?: boolean;
  onClose?: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({
  items,
  title = 'Navigation',
  subtitle,
  isOpen = true,
  onClose,
}) => {
  const { theme } = useTheme();
  const [hoveredItem, setHoveredItem] = useState<string | null>(null);
  const [expandedMobile, setExpandedMobile] = useState<string | null>(null);

  const renderNavItem = (item: NavItem, isMobile: boolean) => {
    const hasChildren = item.children && item.children.length > 0;
    const showChildren = isMobile
      ? expandedMobile === item.id
      : hoveredItem === item.id;

    return (
      <motion.div
        key={item.id}
        variants={fadeInLeft}
        initial="hidden"
        animate="visible"
        className="relative"
        onMouseEnter={() => !isMobile && setHoveredItem(item.id)}
        onMouseLeave={() => !isMobile && setHoveredItem(null)}
      >
        <motion.button
          onClick={() => {
            if (isMobile && hasChildren) {
              setExpandedMobile(expandedMobile === item.id ? null : item.id);
            } else {
              item.onClick?.();
              if (isMobile) onClose?.();
            }
          }}
          variants={sidebarItem}
          initial="idle"
          whileHover="hover"
          whileTap="tap"
          className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors duration-200
            ${item.active
              ? 'bg-danone-blue/15 text-danone-blue font-semibold dark:bg-danone-blue/25 dark:text-danone-blue-light shadow-sm border-l-2 border-danone-blue'
              : 'text-neutral-text-light dark:text-dark-text-secondary hover:bg-neutral-gray dark:hover:bg-dark-border hover:text-neutral-text dark:hover:text-white'
            }
          `}
        >
          <span className="w-5 h-5 flex items-center justify-center flex-shrink-0">
            {item.icon}
          </span>
          <span className="flex-1 text-left truncate">{item.label}</span>
          {item.badge !== undefined && item.badge > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={easeOut}
              className="bg-danone-blue text-white text-[10px] font-bold px-2 py-0.5 rounded-full min-w-[20px] text-center"
            >
              {item.badge}
            </motion.span>
          )}
          {hasChildren && (
            <motion.div
              animate={{ rotate: showChildren ? 180 : 0 }}
              transition={{ duration: 0.2 }}
            >
              <ChevronDown className="w-4 h-4" />
            </motion.div>
          )}
        </motion.button>

        <AnimatePresence>
          {hasChildren && showChildren && (
            <motion.div
              initial={{ opacity: 0, y: -8, height: 0 }}
              animate={{ opacity: 1, y: 0, height: "auto" }}
              exit={{ opacity: 0, y: -8, height: 0 }}
              transition={{ duration: 0.2 }}
              className={`
                ${isMobile
                  ? 'pl-8 mt-1 space-y-1'
                  : 'absolute left-full top-0 ml-2 w-56 bg-white dark:bg-dark-surface rounded-xl shadow-card border border-neutral-gray dark:border-dark-border p-2 z-50'
                }
              `}
            >
              {item.children!.map((child, idx) => (
                <motion.button
                  key={idx}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.03 }}
                  onClick={() => { child.onClick?.(); if (isMobile) onClose?.(); }}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium text-neutral-text-light dark:text-dark-text-secondary hover:bg-neutral-gray dark:hover:bg-dark-border hover:text-neutral-text dark:hover:text-white transition-colors duration-200 text-left"
                >
                  <span className="flex-1 truncate">{child.label}</span>
                  {child.badge !== undefined && child.badge > 0 && (
                    <span className="bg-danone-blue/10 text-danone-blue text-[10px] font-bold px-2 py-0.5 rounded-full">
                      {child.badge}
                    </span>
                  )}
                </motion.button>
              ))}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    );
  };

  return (
    <>
      <motion.aside
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.3 }}
        className={`hidden md:flex flex-col w-64 ${theme === 'dark' ? 'bg-dark-surface border-r border-dark-border' : 'bg-white border-r border-neutral-gray'} shadow-soft`}
      >
        <div className="p-5 border-b border-neutral-gray dark:border-dark-border bg-gradient-to-r from-danone-blue/5 to-transparent">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ scale: 1.05, rotate: -5 }}
              className="w-10 h-10 bg-gradient-to-br from-danone-blue to-danone-blue-dark rounded-xl flex items-center justify-center shadow-lg shadow-danone-blue/20 overflow-hidden flex-shrink-0"
            >
              <img src={logoDanone} alt="Danone" className="w-7 h-7 object-contain" />
            </motion.div>
            <div>
              <h2 className="font-bold text-danone-blue dark:text-white text-sm leading-tight">{title}</h2>
              {subtitle && (
                <p className="text-[10px] text-neutral-text-light dark:text-dark-text-secondary">{subtitle}</p>
              )}
            </div>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          {items.map((item) => renderNavItem(item, false))}
        </nav>

        <div className="p-4 border-t border-neutral-gray dark:border-dark-border">
          <p className="text-[10px] text-neutral-text-light dark:text-dark-text-secondary text-center">
            One Planet. One Health.
          </p>
        </div>
      </motion.aside>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="md:hidden fixed inset-0 z-50"
          >
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 bg-black/50 backdrop-blur-sm"
              onClick={onClose}
            />
            <motion.aside
              initial={{ x: -300 }}
              animate={{ x: 0 }}
              exit={{ x: -300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className={`relative w-72 h-full ${theme === 'dark' ? 'bg-dark-surface' : 'bg-white'} shadow-2xl overflow-y-auto`}
            >
              <div className="flex items-center justify-between p-5 border-b border-neutral-gray dark:border-dark-border">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 bg-danone-blue rounded-lg flex items-center justify-center shadow-soft overflow-hidden">
                    <img src={logoDanone} alt="Danone" className="w-7 h-7 object-contain" />
                  </div>
                  <div>
                    <h2 className="font-bold text-danone-blue dark:text-white text-sm">{title}</h2>
                    {subtitle && (
                      <p className="text-[10px] text-neutral-text-light dark:text-dark-text-secondary">{subtitle}</p>
                    )}
                  </div>
                </div>
                <motion.button
                  onClick={onClose}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  className="p-1 rounded-lg hover:bg-neutral-gray dark:hover:bg-dark-border transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-text-light" />
                </motion.button>
              </div>
              <nav className="p-3 space-y-1">
                {items.map((item) => renderNavItem(item, true))}
              </nav>
            </motion.aside>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default Sidebar;
