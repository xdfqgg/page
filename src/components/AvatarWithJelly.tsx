import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/**
 * Avatar — 轨道粒子环绕
 * 参考 StackOverflow #75746203 + CodePen MWqGbqq
 * 标准做法：animejs onUpdate + cos/sin 计算轨道位置
 */

const PARTICLES = [
  { r: 75, speed: 0.6, color: "oklch(0.72 0.2 85)", count: 3 },
  { r: 68, speed: -0.5, color: "oklch(0.63 0.15 20)", count: 2 },
  { r: 82, speed: 0.8, color: "rgba(255,255,255,0.6)", count: 2 },
];

export default function AvatarWithJelly() {
  const orbitRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  /* ─── 轨道粒子 ─── */
  useEffect(() => {
    const container = orbitRef.current;
    if (!container) return;

    const dots: Array<{ el: HTMLDivElement; r: number; speed: number; offset: number }> = [];

    PARTICLES.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        const dot = document.createElement("div");
        dot.className = "absolute rounded-full pointer-events-none";
        dot.style.cssText = `
          width:3px; height:3px; background:${cfg.color};
          box-shadow:0 0 5px 1px ${cfg.color};
          left:50%; top:50%;
        `;
        container.appendChild(dot);
        dots.push({
          el: dot,
          r: cfg.r,
          speed: cfg.speed,
          offset: (i / cfg.count) * Math.PI * 2 + Math.random() * 0.5,
        });
      }
    });

    const driver = { angle: 0 };
    const anim = animate(driver, {
      angle: Math.PI * 2,
      duration: 10000,
      ease: "linear",
      loop: true,
      onUpdate: () => {
        dots.forEach((d) => {
          const a = driver.angle * d.speed + d.offset;
          d.el.style.translate = `${Math.cos(a) * d.r}px ${Math.sin(a) * d.r}px`;
        });
      },
    });

    return () => { anim.pause(); dots.forEach((d) => d.el.remove()); };
  }, []);

  /* ─── Click ─── */
  const handleClick = useCallback(() => {
    const el = avatarRef.current;
    if (!el) return;
    animate(el, { scale: [1, 0.94, 1.03, 1], duration: 500, ease: "out(3)" });
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* 轨道粒子 */}
      <div ref={orbitRef} className="absolute inset-0 z-0" />

      {/* 头像 */}
      <div
        ref={avatarRef}
        onClick={handleClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-hidden"
        style={{
          width: 120, height: 120, zIndex: 1,
          boxShadow: "0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.boxShadow =
            "0 0 40px 10px oklch(0.7 0.2 85 / 0.35), 0 0 90px 22px oklch(0.7 0.2 85 / 0.15)";
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.boxShadow =
            "0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)";
        }}
        role="img" aria-label="头像"
      >
        <img src={import.meta.env.BASE_URL + "avatar.png"} alt=""
          className="absolute inset-0 h-full w-full rounded-full object-cover pointer-events-none"
          draggable={false} />
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 50%, transparent 55%, rgba(0,0,0,0.4) 100%)" }} />
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.25) 0%, transparent 45%)" }} />
      </div>
    </div>
  );
}
