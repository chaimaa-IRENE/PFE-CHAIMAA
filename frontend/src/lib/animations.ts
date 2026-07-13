import { Variants, Transition, TargetAndTransition } from "framer-motion";

// ──────────────────────────────────────────────
// 1. Enhanced Spring Presets
// ──────────────────────────────────────────────

export const appleSpring: Transition = { type: "spring", stiffness: 300, damping: 25, mass: 1 };
export const vercelSpring: Transition = { type: "spring", stiffness: 400, damping: 30, mass: 0.8 };
export const linearSpring: Transition = { type: "spring", stiffness: 200, damping: 40, mass: 1.5 };
export const bouncySpring: Transition = { type: "spring", stiffness: 400, damping: 15, mass: 0.7 };

export const spring: Transition = { type: "spring", stiffness: 300, damping: 25 };
export const springSoft: Transition = { type: "spring", stiffness: 200, damping: 20 };
export const springBouncy: Transition = { type: "spring", stiffness: 400, damping: 15 };
export const springGentle: Transition = { type: "spring", stiffness: 150, damping: 22 };
export const springSnappy: Transition = { type: "spring", stiffness: 500, damping: 30 };
export const springStiff: Transition = { type: "spring", stiffness: 600, damping: 35 };

export const easeOut: Transition = { type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.4 };
export const easeOutFast: Transition = { type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.25 };
export const easeInOut: Transition = { type: "tween", ease: [0.65, 0, 0.35, 1], duration: 0.4 };
export const easeIn: Transition = { type: "tween", ease: [0.65, 0, 0.35, 1], duration: 0.3 };
export const easeOutSlow: Transition = { type: "tween", ease: [0.16, 1, 0.3, 1], duration: 0.6 };

// ──────────────────────────────────────────────
// 2. Stagger Variants
// ──────────────────────────────────────────────

export const staggerFast: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.03, delayChildren: 0.05 } },
};

export const fastStagger: Variants = staggerFast;

export const staggerMed: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const staggerSlow: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.1, delayChildren: 0.2 } },
};

export const cardStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06, delayChildren: 0.1 } },
};

export const rowStagger: Variants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.04 } },
};

// ──────────────────────────────────────────────
// 3. Card Entrance Variants
// ──────────────────────────────────────────────

export const cardSlideUp: Variants = {
  hidden: { opacity: 0, y: 30, scale: 0.98 },
  visible: { opacity: 1, y: 0, scale: 1, transition: appleSpring },
  exit: { opacity: 0, y: 20, scale: 0.98, transition: { duration: 0.2 } },
};

export const cardFadeIn: Variants = {
  hidden: { opacity: 0, scale: 0.97 },
  visible: { opacity: 1, scale: 1, transition: vercelSpring },
  exit: { opacity: 0, scale: 0.97, transition: { duration: 0.2 } },
};

export const cardScaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.88, filter: "blur(4px)" },
  visible: { opacity: 1, scale: 1, filter: "blur(0px)", transition: bouncySpring },
  exit: { opacity: 0, scale: 0.92, filter: "blur(4px)", transition: { duration: 0.2 } },
};

// ──────────────────────────────────────────────
// 4. Premium Hover Effects
// ──────────────────────────────────────────────

export const hoverScale: Variants = {
  whileHover: { scale: 1.03, transition: springSnappy },
  whileTap: { scale: 0.97, transition: springSnappy },
};

export const hoverLift: Variants = {
  whileHover: { y: -4, boxShadow: "0 8px 25px rgba(0,0,0,0.15)", transition: { duration: 0.2 } },
  whileTap: { scale: 0.98 },
};

export const hoverGlow: Variants = {
  whileHover: {
    scale: 1.02,
    boxShadow: "0 0 30px rgba(59,130,246,0.18)",
    transition: { duration: 0.2 },
  },
  whileTap: { scale: 0.98 },
};

export const hoverLiftVariants: Variants = {
  rest: { y: 0, boxShadow: "0 0 0 rgba(0,0,0,0)" },
  hover: { y: -4, boxShadow: "0 8px 25px rgba(0,0,0,0.15)", transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};

export const hoverGlowVariants: Variants = {
  rest: { scale: 1, boxShadow: "0 0 0 rgba(59,130,246,0)" },
  hover: { scale: 1.02, boxShadow: "0 0 30px rgba(59,130,246,0.18)", transition: { duration: 0.2 } },
  tap: { scale: 0.98 },
};

export const sidebarItem: Variants = {
  idle: { scale: 1 },
  hover: { scale: 1.02, transition: spring },
  tap: { scale: 0.97, transition: spring },
};

export const buttonTap = {
  scale: 0.96,
  transition: { type: "spring", stiffness: 500, damping: 20 },
};

// ──────────────────────────────────────────────
// 5. Page Transition
// ──────────────────────────────────────────────

export const pageTransition: Variants = {
  initial: { opacity: 0, y: 12, scale: 0.98 },
  animate: {
    opacity: 1, y: 0, scale: 1,
    transition: { ...easeOut, duration: 0.35 },
  },
  exit: {
    opacity: 0, y: -12, scale: 0.98,
    transition: { ...easeOut, duration: 0.25 },
  },
};

export const pageCrossfade: Variants = {
  initial: { opacity: 0, scale: 0.97 },
  animate: { opacity: 1, scale: 1, transition: { duration: 0.4, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, scale: 1.02, transition: { duration: 0.3, ease: [0.65, 0, 0.35, 1] } },
};

export const pageTransitionFast: Variants = {
  initial: { opacity: 0, y: 8, filter: "blur(3px)" },
  animate: { opacity: 1, y: 0, filter: "blur(0px)", transition: { duration: 0.25, ease: [0.16, 1, 0.3, 1] } },
  exit: { opacity: 0, y: -8, filter: "blur(3px)", transition: { duration: 0.2 } },
};

// ──────────────────────────────────────────────
// 6. Modal / Overlay
// ──────────────────────────────────────────────

export const modalOverlay: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { duration: 0.2 } },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

export const modalBackdrop: Variants = {
  hidden: { opacity: 0, backdropFilter: "blur(0px)" },
  visible: { opacity: 1, backdropFilter: "blur(8px)", transition: { duration: 0.3 } },
  exit: { opacity: 0, backdropFilter: "blur(0px)", transition: { duration: 0.2 } },
};

export const modalContent: Variants = {
  hidden: { opacity: 0, scale: 0.92, filter: "blur(4px)", y: 20 },
  visible: {
    opacity: 1, scale: 1, filter: "blur(0px)", y: 0,
    transition: springBouncy,
  },
  exit: {
    opacity: 0, scale: 0.92, filter: "blur(4px)", y: 20,
    transition: { ...easeOutFast, duration: 0.2 },
  },
};

// ──────────────────────────────────────────────
// 7. Counter Animation
// ──────────────────────────────────────────────

export const counterSpring: Transition = { type: "spring", stiffness: 100, damping: 30, mass: 1 };

export const countUp = (end: number, duration = 0.8) => ({
  hidden: { count: 0 },
  visible: { count: end, transition: { duration, ease: [0.16, 1, 0.3, 1] } },
});

export const countSpring = (end: number) => ({
  hidden: { count: 0 },
  visible: { count: end, transition: counterSpring },
});

// ──────────────────────────────────────────────
// 8. Chart Animation
// ──────────────────────────────────────────────

export const chartBar: Variants = {
  hidden: { scaleY: 0, opacity: 0 },
  visible: (i: number) => ({
    scaleY: 1, opacity: 1,
    transition: { ...bouncySpring, delay: i * 0.05 },
  }),
};

export const chartLine: Variants = {
  hidden: { pathLength: 0, opacity: 0 },
  visible: { pathLength: 1, opacity: 1, transition: { duration: 1.2, ease: [0.16, 1, 0.3, 1] } },
};

export const chartPie: Variants = {
  hidden: { scale: 0.8, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: bouncySpring },
  exit: { scale: 0.8, opacity: 0, transition: { duration: 0.2 } },
};

// ──────────────────────────────────────────────
// 9. Text Animation
// ──────────────────────────────────────────────

export const textWord: Variants = {
  hidden: { opacity: 0, y: 20, filter: "blur(4px)" },
  visible: (i: number) => ({
    opacity: 1, y: 0, filter: "blur(0px)",
    transition: { ...springGentle, delay: i * 0.04 },
  }),
};

export const textChar: Variants = {
  hidden: { opacity: 0, y: 10, rotateX: -90 },
  visible: (i: number) => ({
    opacity: 1, y: 0, rotateX: 0,
    transition: { ...springSnappy, delay: i * 0.03 },
  }),
};

export const textReveal: Variants = {
  hidden: { width: 0 },
  visible: { width: "100%", transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
};

// ──────────────────────────────────────────────
// 10. Notification
// ──────────────────────────────────────────────

export const notificationSlide: Variants = {
  hidden: { opacity: 0, x: 80, scale: 0.9 },
  visible: { opacity: 1, x: 0, scale: 1, transition: spring },
  exit: { opacity: 0, x: 80, scale: 0.9, transition: { duration: 0.2 } },
};

export const notificationBadge: Variants = {
  hidden: { scale: 0, opacity: 0 },
  visible: { scale: 1, opacity: 1, transition: bouncySpring },
  pulse: { scale: [1, 1.2, 1], transition: { duration: 0.6, repeat: Infinity, ease: "easeInOut" } },
};

export const notificationPulseAnimate = {
  scale: [1, 1.15, 1],
  opacity: [0.7, 1, 0.7],
};

export const notificationPulseTransition = {
  duration: 2,
  repeat: Infinity,
  ease: "easeInOut" as const,
};

// ──────────────────────────────────────────────
// 11. Skeleton Shimmer
// ──────────────────────────────────────────────

export const shimmer = "bg-gradient-to-r from-transparent via-white/5 to-transparent bg-[length:200%_100%] animate-shimmer";

export const shimmerDark = "bg-gradient-to-r from-transparent via-white/[0.03] to-transparent bg-[length:200%_100%] animate-shimmer";

export const shimmerCSS = `@keyframes shimmer {
  0% { background-position: 200% 0; }
  100% { background-position: -200% 0; }
}`;

// ──────────────────────────────────────────────
// 12. Status Badge
// ──────────────────────────────────────────────

export const statusBadgeEntrance: Variants = {
  hidden: { opacity: 0, scale: 0.5 },
  visible: { opacity: 1, scale: 1, transition: springSnappy },
};

export const statusBadgePulse: Variants = {
  active: {
    scale: [1, 1.05, 1],
    transition: { duration: 1.5, repeat: Infinity, ease: "easeInOut" },
  },
};

export const statusBadge = (color: string, bgColor: string) =>
  `inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[10px] font-bold ${bgColor} ${color} border border-white/5`;

// ──────────────────────────────────────────────
// 13. Search Bar
// ──────────────────────────────────────────────

export const searchExpand: Variants = {
  collapsed: { width: 40, opacity: 0.7 },
  expanded: { width: "100%", opacity: 1, transition: spring },
};

export const searchFocus: Variants = {
  blurred: { boxShadow: "0 0 0 rgba(59,130,246,0)" },
  focused: { boxShadow: "0 0 0 2px rgba(59,130,246,0.4)", transition: { duration: 0.2 } },
};

// ──────────────────────────────────────────────
// 14. Tooltip
// ──────────────────────────────────────────────

export const tooltip: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: 4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { ...springSnappy, delay: 0.1 } },
  exit: { opacity: 0, scale: 0.92, y: 4, transition: { duration: 0.15 } },
};

export const tooltipBottom: Variants = {
  hidden: { opacity: 0, scale: 0.92, y: -4 },
  visible: { opacity: 1, scale: 1, y: 0, transition: { ...springSnappy, delay: 0.1 } },
  exit: { opacity: 0, scale: 0.92, y: -4, transition: { duration: 0.15 } },
};

// ──────────────────────────────────────────────
// 15. Toast
// ──────────────────────────────────────────────

export const toastVariants: Variants = {
  hidden: { opacity: 0, x: 80, scale: 0.95 },
  visible: { opacity: 1, x: 0, scale: 1, transition: spring },
  exit: { opacity: 0, x: 80, scale: 0.95, transition: { duration: 0.2 } },
};

export const toastSlideIn: Variants = toastVariants;

export const toastSlideOut: Variants = {
  hidden: { opacity: 1, x: 0, scale: 1 },
  visible: { opacity: 1, x: 0, scale: 1, transition: { duration: 0.3 } },
  exit: { opacity: 0, x: 120, scale: 0.9, transition: { duration: 0.25, ease: [0.65, 0, 0.35, 1] } },
};

export const toastStack: Variants = {
  hidden: { opacity: 0, y: -10, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springGentle },
  exit: { opacity: 0, y: -10, scale: 0.95, transition: { duration: 0.15 } },
};

// ──────────────────────────────────────────────
// Fade Variants
// ──────────────────────────────────────────────

export const fadeIn: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeOut },
  exit: { opacity: 0, transition: easeOutFast },
};

export const fadeInFast: Variants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: easeOutFast },
  exit: { opacity: 0, transition: { duration: 0.15 } },
};

// ──────────────────────────────────────────────
// Slide Variants
// ──────────────────────────────────────────────

export const fadeInUp: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, y: -10, transition: easeOutFast },
};

export const fadeInDown: Variants = {
  hidden: { opacity: 0, y: -16 },
  visible: { opacity: 1, y: 0, transition: easeOut },
  exit: { opacity: 0, y: 10, transition: easeOutFast },
};

export const fadeInLeft: Variants = {
  hidden: { opacity: 0, x: -20 },
  visible: { opacity: 1, x: 0, transition: easeOut },
  exit: { opacity: 0, x: 20, transition: easeOutFast },
};

export const fadeInRight: Variants = {
  hidden: { opacity: 0, x: 20 },
  visible: { opacity: 1, x: 0, transition: easeOut },
  exit: { opacity: 0, x: -20, transition: easeOutFast },
};

export const slideUp: Variants = {
  hidden: { y: 40, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: springGentle },
  exit: { y: 20, opacity: 0, transition: { duration: 0.2 } },
};

export const slideDown: Variants = {
  hidden: { y: -20, opacity: 0 },
  visible: { y: 0, opacity: 1, transition: springGentle },
  exit: { y: -10, opacity: 0, transition: { duration: 0.2 } },
};

export const slideInLeft: Variants = {
  hidden: { x: -40, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: spring },
  exit: { x: -20, opacity: 0, transition: { duration: 0.2 } },
};

export const slideInRight: Variants = {
  hidden: { x: 40, opacity: 0 },
  visible: { x: 0, opacity: 1, transition: spring },
  exit: { x: 20, opacity: 0, transition: { duration: 0.2 } },
};

// ──────────────────────────────────────────────
// Scale Variants
// ──────────────────────────────────────────────

export const scaleIn: Variants = {
  hidden: { opacity: 0, scale: 0.95 },
  visible: { opacity: 1, scale: 1, transition: spring },
  exit: { opacity: 0, scale: 0.95, transition: { duration: 0.2 } },
};

export const scaleInBounce: Variants = {
  hidden: { opacity: 0, scale: 0.85 },
  visible: { opacity: 1, scale: 1, transition: springBouncy },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};

export const scaleInSmall: Variants = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: { opacity: 1, scale: 1, transition: springSnappy },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.15 } },
};

// ──────────────────────────────────────────────
// Blur Variants
// ──────────────────────────────────────────────

export const blurIn: Variants = {
  hidden: { opacity: 0, filter: "blur(12px)" },
  visible: { opacity: 1, filter: "blur(0px)", transition: easeOut },
  exit: { opacity: 0, filter: "blur(8px)", transition: easeOutFast },
};

export const blurInUp: Variants = {
  hidden: { opacity: 0, filter: "blur(8px)", y: 16 },
  visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: easeOut },
  exit: { opacity: 0, filter: "blur(4px)", y: -8, transition: easeOutFast },
};

export const blurInDown: Variants = {
  hidden: { opacity: 0, filter: "blur(6px)", y: -12 },
  visible: { opacity: 1, filter: "blur(0px)", y: 0, transition: easeOut },
  exit: { opacity: 0, filter: "blur(4px)", y: 8, transition: easeOutFast },
};

// ──────────────────────────────────────────────
// List Item
// ──────────────────────────────────────────────

export const listItem: Variants = {
  hidden: { opacity: 0, x: -10 },
  visible: { opacity: 1, x: 0, transition: springGentle },
};

// ──────────────────────────────────────────────
// Shared Layout
// ──────────────────────────────────────────────

export const sharedLayout = {
  layout: true,
  layoutId: undefined as string | undefined,
  transition: spring,
};

// ──────────────────────────────────────────────
// Document Card
// ──────────────────────────────────────────────

export const docCard: Variants = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  visible: { opacity: 1, y: 0, scale: 1, transition: springGentle },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

// ──────────────────────────────────────────────
// Counter Card
// ──────────────────────────────────────────────

export const counterCard = (accentColor: string) =>
  `bg-gradient-to-br from-[#1E293B] to-[#1A2436] rounded-2xl border border-white/[0.06] p-4 hover:border-${accentColor}-500/20 transition-all duration-300`;

// ──────────────────────────────────────────────
// CSS Utility Classes
// ──────────────────────────────────────────────

export const glassmorphism = "bg-[#1E293B]/80 backdrop-blur-xl border border-white/10 shadow-xl shadow-black/10";

export const glassmorphismLight = "bg-white/70 backdrop-blur-xl border border-white/20 shadow-xl shadow-black/5";

export const premiumCard = `${glassmorphism} rounded-2xl transition-all duration-300 hover:translate-y-[-4px] hover:shadow-[0_8px_30px_rgba(59,130,246,0.12)]`;

export const premiumCardHover = "hover:translate-y-[-6px] hover:shadow-[0_12px_40px_rgba(59,130,246,0.15)]";

export const textGradient = "bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400";

export const glowBlue = "shadow-[0_0_20px_rgba(59,130,246,0.15)]";

export const glowEmerald = "shadow-[0_0_20px_rgba(16,185,129,0.15)]";

export const glowAmber = "shadow-[0_0_20px_rgba(245,158,11,0.15)]";

export const glowRose = "shadow-[0_0_20px_rgba(239,68,68,0.15)]";

export const hoverGlowClass = "hover:shadow-[0_0_25px_rgba(59,130,246,0.2)] transition-shadow duration-300";

// ──────────────────────────────────────────────
// Helper
// ──────────────────────────────────────────────

export function getColorWithAlpha(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}