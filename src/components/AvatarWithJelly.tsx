import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/**
 * Avatar — 3D 球体 + 轨道环绕 + 地震裂缝
 */

// 轨道配置：每个轨道有独立倾斜角、颜色、速度
const ORBITS = [
  { tilt: 55, color: "oklch(0.72 0.22 85)", count: 10, size: 2.5, speed: 0.5, r: 76 },
  { tilt: -40, color: "oklch(0.63 0.15 20)", count: 7, size: 2, speed: 0.35, r: 70 },
  { tilt: -70, color: "rgba(255,255,255,0.55)", count: 6, size: 2, speed: 0.7, r: 80 },
];

export default function AvatarWithJelly() {
  const frontRef = useRef<HTMLDivElement>(null);  // 轨道前半（z > 头像）
  const backRef = useRef<HTMLDivElement>(null);   // 轨道后半（z < 头像）
  const avatarRef = useRef<HTMLDivElement>(null);

  /* ─── 3D 轨道环绕 ─── */
  useEffect(() => {
    const front = frontRef.current;
    const back = backRef.current;
    if (!front || !back) return;

    const all: Array<{ dot: HTMLDivElement; orbit: typeof ORBITS[number]; angle: number }> = [];

    ORBITS.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        const angle = (i / cfg.count) * Math.PI * 2;
        const dot = document.createElement("div");
        dot.className = "absolute rounded-full pointer-events-none";
        dot.style.cssText = `
          width:${cfg.size}px; height:${cfg.size}px; background:${cfg.color};
          box-shadow:0 0 5px 1px ${cfg.color};
          left:50%; top:50%;
        `;
        // 先全放 back
        back.appendChild(dot);
        all.push({ dot, orbit: cfg, angle });
      }
    });

    const raf = { current: 0 };
    let last = performance.now();

    const tick = (now: number) => {
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;

      all.forEach(({ dot, orbit, angle: a }) => {
        const newA = a + orbit.speed * dt;
        (all as any).find((x: any) => x.dot === dot)!.angle = newA;

        const x = Math.cos(newA) * orbit.r;
        const y = Math.sin(newA) * orbit.r;
        dot.style.translate = `${x}px ${y}px`;

        // 判断粒子在前半还是后半（右半 = 前半可见）
        const isFront = Math.cos(newA) > -0.05;
        if (isFront && dot.parentElement === back) {
          front.appendChild(dot);
        } else if (!isFront && dot.parentElement === front) {
          back.appendChild(dot);
        }
      });

      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);

    return () => { cancelAnimationFrame(raf.current); all.forEach(d => d.dot.remove()); };
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
          0 0 ${25 + 15 * t}px ${4 + 6 * t}px oklch(0.7 0.2 85 / ${0.2 + t * 0.25}),
          0 0 ${55 + 35 * t}px ${10 + 15 * t}px oklch(0.7 0.2 85 / ${0.08 + t * 0.1})
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
    animate(el, { scale: [1, 0.96, 1.03, 1], duration: 500, ease: "out(3)" });
    for (let i = 0; i < 2; i++) {
      const r = document.createElement("div");
      r.className = "absolute inset-0 rounded-full pointer-events-none";
      r.style.cssText = "border:1.5px solid oklch(0.7 0.2 85 / 0.4); z-index:20;";
      el.appendChild(r);
      animate(r, { scale: [0.8, 1.8], opacity: [0.5, 0], duration: 800, delay: i * 200, ease: "out(2)", onComplete: () => r.remove() });
    }
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* 轨道后半（在头像后面） */}
      <div ref={backRef} className="absolute inset-0 z-0"
        style={{ transform: "rotateX(60deg)", transformStyle: "preserve-3d" }} />

      {/* 头像球体 */}
      <div
        ref={avatarRef}
        onClick={handleClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-hidden"
        style={{
          width: 120, height: 120, zIndex: 2,
          boxShadow: "0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)",
        }} role="img" aria-label="头像"
      >
        <img src={import.meta.env.BASE_URL + "avatar.png"} alt=""
          className="absolute inset-0 h-full w-full rounded-full object-cover pointer-events-none"
          draggable={false} />

        {/* 3D 球体阴影（边缘暗中间亮） */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(circle at 50% 50%, transparent 50%, rgba(0,0,0,0.5) 100%)" }} />

        {/* 地震裂缝 SVG */}
        <svg className="absolute inset-0 w-full h-full rounded-full pointer-events-none" viewBox="0 0 120 120">
          <defs>
            <filter id="crack-shadow">
              <feDropShadow dx="0.5" dy="0.5" stdDeviation="0.3" floodColor="rgba(0,0,0,0.6)" />
            </filter>
          </defs>
          {/* 主裂缝 */}
          <polyline points="10,40 25,35 28,42 38,30 40,36 55,28" fill="none"
            stroke="rgba(0,0,0,0.55)" strokeWidth="2.5" filter="url(#crack-shadow)" strokeLinejoin="miter" />
          {/* 分支 */}
          <polyline points="25,35 20,50 22,55 12,65" fill="none"
            stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" strokeLinejoin="miter" />
          <polyline points="38,30 45,20 48,18 60,10" fill="none"
            stroke="rgba(0,0,0,0.4)" strokeWidth="1.5" strokeLinejoin="miter" />
          <polyline points="40,36 50,42 60,40 75,45" fill="none"
            stroke="rgba(0,0,0,0.45)" strokeWidth="1.8" strokeLinejoin="miter" />
          {/* 横向裂缝 */}
          <polyline points="55,28 65,32 72,28 85,35" fill="none"
            stroke="rgba(0,0,0,0.45)" strokeWidth="2" filter="url(#crack-shadow)" strokeLinejoin="miter" />
          {/* 底部裂缝 */}
          <polyline points="30,90 42,82 48,85 55,75" fill="none"
            stroke="rgba(0,0,0,0.35)" strokeWidth="1.5" strokeLinejoin="miter" />
          {/* 裂缝边缘发亮 */}
          <polyline points="10,40 25,35 28,42 38,30 40,36 55,28" fill="none"
            stroke="rgba(255,255,255,0.08)" strokeWidth="2.8" strokeLinejoin="miter" />
          <polyline points="55,28 65,32 72,28 85,35" fill="none"
            stroke="rgba(255,255,255,0.06)" strokeWidth="2.2" strokeLinejoin="miter" />
          {/* 碎片位移标记 */}
          <circle cx="38" cy="30" r="1.2" fill="rgba(0,0,0,0.3)" />
          <circle cx="55" cy="28" r="1.5" fill="rgba(0,0,0,0.35)" />
          <circle cx="72" cy="28" r="1" fill="rgba(0,0,0,0.3)" />
        </svg>

        {/* 玻璃反光 */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 38% 28%, rgba(255,255,255,0.2) 0%, transparent 50%)" }} />
      </div>

      {/* 轨道前半（覆盖在头像前面） */}
      <div ref={frontRef} className="absolute inset-0 z-3"
        style={{ transform: "rotateX(60deg)", transformStyle: "preserve-3d" }} />
    </div>
  );
}
