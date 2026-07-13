import React, { useEffect, useRef } from "react";

const AnimatedBackground: React.FC<{ health?: number }> = ({ health = 50 }) => {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const colors = [
      [59, 130, 246], [139, 92, 246], [16, 185, 129],
      [245, 158, 11], [239, 68, 68], [99, 102, 241]
    ];
    const particles: { x: number; y: number; vx: number; vy: number; r: number; color: number[]; alpha: number }[] = [];
    for (let i = 0; i < 25; i++) {
      particles.push({
        x: Math.random() * 100, y: Math.random() * 100,
        vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
        r: Math.random() * 120 + 60,
        color: colors[i % colors.length],
        alpha: Math.random() * 0.08 + 0.03
      });
    }
    let frame: number;
    const animate = () => {
      particles.forEach(p => {
        p.x += p.vx; p.y += p.vy;
        if (p.x < -10) p.x = 110; if (p.x > 110) p.x = -10;
        if (p.y < -10) p.y = 110; if (p.y > 110) p.y = -10;
      });
      const grad = particles.map(p =>
        `radial-gradient(circle at ${p.x}% ${p.y}%, rgba(${p.color.join(",")},${p.alpha}) 0%, transparent ${p.r}%)`
      ).join(",");
      el.style.backgroundImage = grad;
      frame = requestAnimationFrame(animate);
    };
    frame = requestAnimationFrame(animate);
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div
      ref={ref}
      className="fixed inset-0 -z-10 transition-all duration-1000"
      style={{
        background: `radial-gradient(circle at 50% 50%, rgba(59,130,246,0.05) 0%, transparent 60%), radial-gradient(circle at 80% 20%, rgba(139,92,246,0.04) 0%, transparent 50%)`
      }}
    />
  );
};

export default AnimatedBackground;
