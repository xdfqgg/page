import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/**
 * Avatar — 行星粒子环绕 + 破碎玻璃
 *
 *   多层彩色粒子环 3D 倾斜环绕头像
 *   头像带裂纹碎片感
 *   hover 光晕加强，click 涟漪
 */

const RINGS = [
  { tilt: 15, color: "oklch(0.7 0.2 85)", count: 14, size: 3, speed: 12, radius: 100 },
  { tilt: -20, color: "oklch(0.65 0.15 15)", count: 10, size: 2.5, speed: 8, radius: 88 },
  { tilt: 35, color: "rgba(255,255,255,0.7)", count: 8, size: 2, speed: 15, radius: 106 },
];

export default function AvatarWithJelly() {
  const outerRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ─── 粒子环动画 ─── */
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const drivers = RINGS.map((ring) => {
      const ringEl = document.createElement("div");
      ringEl.className = "absolute left-1/2 top-1/2 rounded-full pointer-events-none";
      ringEl.style.cssText = `
        width: ${ring.radius * 2}px; height: ${ring.radius * 2}px;
        margin-left: -${ring.radius}px; margin-top: -${ring.radius}px;
        border: 1px solid ${ring.color} / 0.15;
        transform: rotateX(${ring.tilt}deg);
        z-index:0;
      `;
      container.appendChild(ringEl);

      // 粒子
      const dots: HTMLDivElement[] = [];
      for (let i = 0; i < ring.count; i++) {
        const dot = document.createElement("div");
        dot.className = "absolute rounded-full pointer-events-none";
        dot.style.cssText = `
          width: ${ring.size}px; height: ${ring.size}px;
          background: ${ring.color};
          box-shadow: 0 0 6px 2px ${ring.color} / 0.5;
          left: 50%; top: 50%;
        `;
        ringEl.appendChild(dot);
        dots.push(dot);
      }

      const anglePer = (2 * Math.PI) / ring.count;

      return { ringEl, dots, anglePer, radius: ring.radius, speed: ring.speed, tilt: ring.tilt };
    });

    // 驱动旋转
    const driver = { angle: 0 };
    const anim = animate(driver, {
      angle: Math.PI * 2,
      duration: 60000,
      ease: "linear",
      loop: true,
      onUpdate: () => {
        drivers.forEach((d) => {
          d.dots.forEach((dot, i) => {
            const a = driver.angle * (d.speed / 12) + i * d.anglePer;
            const rx = Math.cos(a) * d.radius;
            const ry = Math.sin(a) * d.radius;
            dot.style.translate = `${rx}px ${ry}px`;
          });
        });
      },
    });

    return () => {
      anim.pause();
      drivers.forEach((d) => { d.ringEl.remove(); });
    };
  }, []);

  /* ─── Hover：光晕加强 ─── */
  useEffect(() => {
    const el = outerRef.current;
    if (!el) return;

    const handleHover = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 200) {
        const t = 1 - Math.min(dist / 200, 1);
        el.style.boxShadow = `
          0 0 ${25 + 20 * t}px ${4 + 6 * t}px oklch(0.7 0.2 85 / ${0.2 + t * 0.25}),
          0 0 ${60 + 40 * t}px ${10 + 15 * t}px oklch(0.7 0.2 85 / ${0.08 + t * 0.1})
        `;
      }
    };

    window.addEventListener("mousemove", handleHover);
    return () => window.removeEventListener("mousemove", handleHover);
  }, []);

  /* ─── Click ─── */
  const handleClick = useCallback(() => {
    const el = outerRef.current;
    if (!el) return;
    animate(el, { scale: [1, 0.95, 1.03, 1], duration: 500, ease: "out(3)" });

    for (let i = 0; i < 2; i++) {
      const ripple = document.createElement("div");
      ripple.className = "absolute inset-0 rounded-full pointer-events-none";
      ripple.style.cssText = "border:1.5px solid oklch(0.7 0.2 85 / 0.4); z-index:30;";
      el.appendChild(ripple);
      animate(ripple, {
        scale: [0.9, 1.8], opacity: [0.5, 0], duration: 800, delay: i * 200,
        ease: "out(2)", onComplete: () => ripple.remove(),
      });
    }
  }, []);

  return (
    <div className="absolute left-1/2 top-1/2" style={{ marginLeft: -90, marginTop: -90 }}>
      {/* 3D 透视容器 */}
      <div className="flex items-center justify-center" style={{ perspective: 800, width: 180, height: 180 }}>
        {/* 粒子环容器 */}
        <div ref={containerRef} className="absolute inset-0"
          style={{ transformStyle: "preserve-3d", transform: "rotateX(15deg)" }} />

        {/* 头像 & 破碎玻璃 */}
        <div
          ref={outerRef}
          onClick={handleClick}
          className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-hidden"
          style={{
            width: 120, height: 120,
            boxShadow: "0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)",
            zIndex: 2,
          }}
          role="img" aria-label="头像"
        >
          <img src={import.meta.env.BASE_URL + "avatar.png"} alt=""
            className="absolute inset-0 h-full w-full rounded-full object-cover scale-110 pointer-events-none" draggable={false} />

          {/* 破碎玻璃裂痕 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 120 120">
            <line x1="0" y1="40" x2="120" y2="45" stroke="rgba(255,255,255,0.12)" strokeWidth="0.5" />
            <line x1="55" y1="0" x2="58" y2="120" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            <line x1="30" y1="0" x2="20" y2="80" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <line x1="90" y1="20" x2="100" y2="100" stroke="rgba(255,255,255,0.08)" strokeWidth="0.5" />
            <line x1="0" y1="80" x2="80" y2="120" stroke="rgba(255,255,255,0.1)" strokeWidth="0.5" />
            <circle cx="55" cy="40" r="15" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.3" />
          </svg>

          {/* 玻璃反光 */}
          <div className="absolute inset-0 rounded-full pointer-events-none z-10"
            style={{ background: "radial-gradient(ellipse at 40% 30%, rgba(255,255,255,0.2) 0%, transparent 55%)" }} />
        </div>
      </div>
    </div>
  );
}
