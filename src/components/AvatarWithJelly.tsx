import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/**
 * Avatar — 微光粒子环绕 + 玻璃质感
 *
 *   少量漂浮粒子在头像后方环绕
 *   头像本身干净简洁，玻璃反光 + 暖光晕
 *   hover 光晕加强，click 涟漪
 */

const COLORS = [
  "oklch(0.72 0.2 85 / 0.8)",
  "oklch(0.65 0.15 20 / 0.6)",
  "rgba(255,255,255,0.5)",
];

export default function AvatarWithJelly() {
  const containerRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  /* ─── 漂浮粒子（在头像后方） ─── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const dots: HTMLDivElement[] = [];
    const orbits: Array<{ r: number; angle: number; speed: number; y: number; ySpeed: number }> = [];

    for (let i = 0; i < 12; i++) {
      const dot = document.createElement("div");
      dot.className = "absolute rounded-full pointer-events-none";
      dot.style.cssText = `
        width:3px; height:3px; background:${COLORS[i % COLORS.length]};
        box-shadow:0 0 5px 2px ${COLORS[i % COLORS.length]};
        left:50%; top:50%; z-index:0;
      `;
      container.appendChild(dot);
      dots.push(dot);

      orbits.push({
        r: 72 + Math.random() * 30,
        angle: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.5,
        y: -15 + Math.random() * 30,
        ySpeed: 0.1 + Math.random() * 0.3,
      });
    }

    let raf: number;
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      dots.forEach((dot, i) => {
        const o = orbits[i];
        o.angle += o.speed * dt;
        o.y += o.ySpeed * dt * (Math.sin(o.angle * 3) > 0 ? 1 : -1);
        o.y = Math.max(-20, Math.min(20, o.y));
        const x = Math.cos(o.angle) * o.r;
        dot.style.translate = `${x}px ${o.y}px`;
        // 远处（左边）缩小变淡
        const scale = 0.4 + (Math.cos(o.angle) + 1) / 2 * 0.6;
        dot.style.scale = String(scale);
        dot.style.opacity = String(0.2 + scale * 0.8);
      });
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(raf); dots.forEach(d => d.remove()); };
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
        el.style.transform = `scale(${1 + t * 0.03})`;
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
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* 粒子容器（z-index:0，在头像后面） */}
      <div ref={containerRef} className="absolute inset-0 z-0" />

      {/* 头像 */}
      <div
        ref={avatarRef}
        onClick={handleClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-hidden transition-transform duration-300"
        style={{
          width: 120, height: 120, zIndex: 1,
          boxShadow: "0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)",
        }} role="img" aria-label="头像"
      >
        <img src={import.meta.env.BASE_URL + "avatar.png"} alt=""
          className="absolute inset-0 h-full w-full rounded-full object-cover pointer-events-none"
          draggable={false} />
        {/* 玻璃反光 */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 38% 28%, rgba(255,255,255,0.25) 0%, transparent 50%)" }} />
      </div>
    </div>
  );
}
