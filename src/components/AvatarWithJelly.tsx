import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/**
 * Avatar — 玻璃拟态 + 光晕 + 漂浮粒子
 * 参考: designyff morphing sphere + starmaker heads
 */

export default function AvatarWithJelly() {
  const avatarRef = useRef<HTMLDivElement>(null);
  const particlesRef = useRef<HTMLDivElement>(null);

  /* ─── 漂浮粒子 ─── */
  useEffect(() => {
    const container = particlesRef.current;
    if (!container) return;

    const dots: HTMLDivElement[] = [];
    const colors = ["oklch(0.72 0.2 85 / 0.7)", "oklch(0.63 0.15 20 / 0.5)", "rgba(255,255,255,0.4)"];

    for (let i = 0; i < 8; i++) {
      const dot = document.createElement("div");
      dot.className = "absolute rounded-full pointer-events-none";
      const size = 2 + Math.random() * 2;
      dot.style.cssText = `
        width:${size}px; height:${size}px; background:${colors[i % 3]};
        box-shadow:0 0 ${size * 3}px ${size}px ${colors[i % 3]};
        left:50%; top:50%;
      `;
      container.appendChild(dot);
      dots.push(dot);

      // 随机初始位置
      const angle = Math.random() * Math.PI * 2;
      const r = 68 + Math.random() * 20;
      dot.style.translate = `${Math.cos(angle) * r}px ${Math.sin(angle) * r}px`;

      // 用 animejs 做漂浮
      animate(dot, {
        translateX: [Math.cos(angle) * r, Math.cos(angle + 0.5) * (r + 5), Math.cos(angle) * r],
        translateY: [Math.sin(angle) * r, Math.sin(angle + 0.5) * (r + 5), Math.sin(angle) * r],
        duration: 3000 + Math.random() * 2000,
        delay: Math.random() * 2000,
        ease: "inOut(2)",
        loop: true,
        direction: "alternate",
      });
    }

    return () => dots.forEach(d => d.remove());
  }, []);

  /* ─── Click ─── */
  const handleClick = useCallback(() => {
    const el = avatarRef.current;
    if (!el) return;
    animate(el, { scale: [1, 0.95, 1.02, 1], duration: 400, ease: "out(2)" });
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 180, height: 180 }}>
      {/* 漂浮粒子 */}
      <div ref={particlesRef} className="absolute inset-0 z-0" />

      {/* 头像玻璃球 */}
      <div
        ref={avatarRef}
        onClick={handleClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-hidden"
        style={{
          width: 120, height: 120, zIndex: 1,
          background: "radial-gradient(circle at 50% 50%, transparent 60%, rgba(0,0,0,0.3) 100%)",
          boxShadow: `
            0 0 20px 3px oklch(0.7 0.2 85 / 0.2),
            0 0 50px 8px oklch(0.7 0.2 85 / 0.08),
            inset 0 0 30px rgba(255,255,255,0.03)
          `,
          transition: "box-shadow 0.5s ease, transform 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow = `
            0 0 35px 8px oklch(0.7 0.2 85 / 0.35),
            0 0 80px 20px oklch(0.7 0.2 85 / 0.15),
            inset 0 0 30px rgba(255,255,255,0.05)
          `;
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow = `
            0 0 20px 3px oklch(0.7 0.2 85 / 0.2),
            0 0 50px 8px oklch(0.7 0.2 85 / 0.08),
            inset 0 0 30px rgba(255,255,255,0.03)
          `;
        }}
        role="img" aria-label="头像"
      >
        <img src={import.meta.env.BASE_URL + "avatar.png"} alt=""
          className="absolute inset-0 h-full w-full rounded-full object-cover pointer-events-none"
          draggable={false} />
        {/* 玻璃反光 */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.3) 0%, transparent 45%)" }} />
      </div>
    </div>
  );
}
