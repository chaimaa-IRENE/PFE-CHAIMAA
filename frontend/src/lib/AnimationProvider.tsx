import React, { createContext, useContext, useEffect, useState } from "react";
import { MotionConfig } from "framer-motion";

interface AnimationContextType {
  reducedMotion: boolean;
  prefersReducedMotion: boolean;
}

const AnimationContext = createContext<AnimationContextType>({
  reducedMotion: false,
  prefersReducedMotion: false,
});

export const useReducedMotion = () => useContext(AnimationContext).reducedMotion;

export const AnimationProvider: React.FC<{ children: React.ReactNode; disableAnimations?: boolean }> = ({
  children,
  disableAnimations = false,
}) => {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setPrefersReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setPrefersReducedMotion(e.matches);
    mq.addEventListener("change", handler);
    return () => mq.removeEventListener("change", handler);
  }, []);

  const reducedMotion = disableAnimations || prefersReducedMotion;

  return (
    <AnimationContext.Provider value={{ reducedMotion, prefersReducedMotion }}>
      <MotionConfig reducedMotion={reducedMotion ? "always" : "never"}>
        {children}
      </MotionConfig>
    </AnimationContext.Provider>
  );
};
