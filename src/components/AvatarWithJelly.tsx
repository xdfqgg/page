import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/**
 * Avatar — 3D 行星环 + 碎片头像
 */

// 轨道配置：颜色、粒子数、大小、速度、半径、3D 倾斜
const RINGS = [
  { color: "oklch(0.7 0.2 85 / 0.9)", count: 16, size: 3, speed: 10, rx: 88, ry: 28, z: 0 },
  { color: "oklch(0.65 0.15 20 / 0.7)", count: 10, size: 2, speed: 7, rx: 78, ry: 22, z: 5 },
  { color: "rgba(255,255,255,0.6)", count: 6, size: 2.5, speed: 14, rx: 95, ry: 20, z: -5 },
];

export default function AvatarWithJelly() {
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  /* ─── 3D 粒子环 ─── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const drivers = RINGS.map((cfg) => {
      const dots: HTMLDivElement[] = [];
      for (let i = 0; i < cfg.count; i++) {
        const dot = document.createElement("div");
        dot.className = "absolute rounded-full pointer-events-none";
        dot.style.cssText = `
          width:${cfg.size}px; height:${cfg.size}px; background:${cfg.color};
          box-shadow:0 0 6px 2px ${cfg.color};
          left:50%; top:50%; z-index:${cfg.z};
        `;
        container.appendChild(dot);
        dots.push(dot);
      }
      return { dots, rx: cfg.rx, ry: cfg.ry, speed: cfg.speed };
    });

    const driver = { t: 0 };
    const anim = animate(driver, {
      t: Math.PI * 2,
      duration: 20000,
      ease: "linear",
      loop: true,
      onUpdate: () => {
        drivers.forEach((d) => {
          d.dots.forEach((dot, i) => {
            const a = driver.t * (d.speed / 10) + (i / d.dots.length) * Math.PI * 2;
            dot.style.translate = `${Math.cos(a) * d.rx}px ${Math.sin(a) * d.ry}px`;
            // 模拟 3D：根据 y 位置调整缩放和透明度
            const yRatio = Math.sin(a);
            const scale = 0.5 + (1 - Math.abs(yRatio)) * 0.5;
            dot.style.scale = String(scale);
            dot.style.opacity = String(0.3 + (1 - Math.abs(yRatio)) * 0.7);
          });
        });
      },
    });

    return () => { anim.pause(); drivers.forEach(d => d.dots.forEach(dot => dot.remove())); };
  }, []);

  /* ─── Hover ─── */
  useEffect(() => {
    const el = avatarRef.current;
    if (!el) return;
    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const dx = e.clientX - (rect.left + rect.width / 2);
      const dy = e.clientY - (rect.top + rect.height / 2);
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const t = 1 - dist / 200;
        el.style.boxShadow = `
          0 0 ${25 + 20 * t}px ${4 + 8 * t}px oklch(0.7 0.2 85 / ${0.2 + t * 0.3}),
          0 0 ${60 + 40 * t}px ${10 + 20 * t}px oklch(0.7 0.2 85 / ${0.08 + t * 0.12})
        `;
      }
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  /* ─── Click ─── */
  const handleClick = useCallback(() => {
    const el = avatarRef.current;
    if (!el) return;
    animate(el, { scale: [1, 0.95, 1.04, 1], duration: 500, ease: "out(3)" });
    for (let i = 0; i < 2; i++) {
      const r = document.createElement("div");
      r.className = "absolute inset-0 rounded-full pointer-events-none";
      r.style.cssText = "border:1.5px solid oklch(0.7 0.2 85 / 0.5); z-index:30;";
      el.appendChild(r);
      animate(r, { scale: [0.8, 1.8], opacity: [0.6, 0], duration: 800, delay: i * 200, ease: "out(2)", onComplete: () => r.remove() });
    }
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 220, height: 220 }}>
      {/* 3D 粒子环 */}
      <div ref={containerRef} className="absolute inset-0" style={{ perspective: 600, transformStyle: "preserve-3d", transform: "rotateX(55deg)" }} />

      {/* 头像 */}
      <div
        ref={avatarRef}
        onClick={handleClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-visible"
        style={{
          width: 120, height: 120, zIndex: 10,
          boxShadow: "0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)",
        }} role="img" aria-label="头像"
      >
        {/* 碎片 */}
        <div className="absolute inset-0 rounded-full overflow-hidden">
          <img src={import.meta.env.BASE_URL + "avatar.png"} alt=""
            className="absolute inset-0 h-full w-full object-cover scale-110 pointer-events-none"
            draggable={false}
            style={{
              clipPath: "polygon(0 0, 45% 0, 42% 35%, 55% 30%, 58% 0, 100% 0, 100% 100%, 60% 100%, 55% 70%, 40% 75%, 38% 100%, 0 100%)",
            }} />
        </div>

        {/* 裂痕线 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10 rounded-full" viewBox="0 0 120 120">
          <line x1="45" y1="0" x2="42" y2="35" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="42" y1="35" x2="55" y2="30" stroke="rgba(255,255,255,0.12)" strokeWidth="0.8" />
          <line x1="55" y1="30" x2="58" y2="0" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="55" y1="70" x2="60" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
          <line x1="40" y1="75" x2="38" y2="100" stroke="rgba(255,255,255,0.1)" strokeWidth="0.8" />
          <line x1="55" y1="30" x2="55" y2="70" stroke="rgba(255,255,255,0.08)" strokeWidth="0.6" />
        </svg>

        {/* 玻璃反光 */}
        <div className="absolute inset-0 rounded-full pointer-events-none z-10"
          style={{ background: "radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.2) 0%, transparent 55%)" }} />
      </div>
    </div>
  );
}
