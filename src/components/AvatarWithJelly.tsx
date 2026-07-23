import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/* ================================================================
 *  轨道环配置 — 4 层，每层参数完全不同
 * ================================================================ */
const RINGS = [
  { rx: 88, ry: 34, speed: 0.4,  color: "oklch(0.72 0.2 85 / 0.8)",  count: 10, size: 2.5 },
  { rx: 78, ry: 28, speed: -0.35, color: "oklch(0.63 0.15 20 / 0.65)", count: 8,  size: 2 },
  { rx: 94, ry: 26, speed: 0.6,  color: "rgba(255,255,255,0.45)",      count: 6,  size: 2 },
  { rx: 82, ry: 38, speed: -0.5,  color: "oklch(0.68 0.18 50 / 0.55)", count: 7,  size: 2.5 },
];

/* ================================================================
 *  20 块碎片 — 纯原图色彩，无任何滤镜/暗角
 * ================================================================ */
const FRAGS = [
  "polygon(0 0, 28% 0, 22% 18%, 0 22%)",
  "polygon(28% 0, 58% 0, 48% 20%, 22% 18%)",
  "polygon(58% 0, 100% 0, 100% 20%, 78% 24%, 48% 20%)",
  "polygon(100% 20%, 100% 44%, 84% 40%, 78% 24%)",
  "polygon(100% 44%, 100% 68%, 86% 60%, 84% 40%)",
  "polygon(100% 68%, 100% 90%, 80% 82%, 86% 60%)",
  "polygon(100% 90%, 100% 100%, 68% 100%, 60% 84%, 80% 82%)",
  "polygon(60% 84%, 68% 100%, 35% 100%, 28% 84%)",
  "polygon(28% 84%, 35% 100%, 0 100%, 0 84%)",
  "polygon(0 84%, 0 64%, 16% 56%, 28% 84%)",
  "polygon(0 64%, 0 44%, 14% 40%, 16% 56%)",
  "polygon(0 44%, 0 22%, 20% 26%, 14% 40%)",
  "polygon(22% 18%, 48% 20%, 36% 36%, 24% 30%)",
  "polygon(48% 20%, 78% 24%, 64% 40%, 36% 36%)",
  "polygon(78% 24%, 84% 40%, 64% 40%)",
  "polygon(84% 40%, 86% 60%, 64% 56%, 64% 40%)",
  "polygon(86% 60%, 80% 82%, 60% 72%, 64% 56%)",
  "polygon(60% 84%, 60% 72%, 80% 82%)",
  "polygon(24% 30%, 36% 36%, 28% 52%, 18% 42%)",
  "polygon(36% 36%, 64% 40%, 56% 56%, 46% 54%, 28% 52%)",
];

export default function AvatarWithJelly() {
  const fragsRef = useRef<HTMLDivElement[]>([]);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  /* ─── 光环轨道 ─── */
  useEffect(() => {
    const back = backRef.current, front = frontRef.current;
    if (!back || !front) return;

    const all: Array<{
      el: HTMLDivElement; rx: number; ry: number;
      speed: number; offset: number; fading: boolean;
    }> = [];

    RINGS.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        const dot = document.createElement("div");
        const s = cfg.size;
        dot.style.cssText = `
          position:absolute; border-radius:50%; pointer-events:none;
          width:${s}px; height:${s}px; background:${cfg.color};
          box-shadow:0 0 ${s*3}px ${s}px ${cfg.color};
          left:50%; top:50%; transition: opacity 0.2s;
        `;
        back.appendChild(dot);
        all.push({
          el: dot, rx: cfg.rx, ry: cfg.ry, speed: cfg.speed,
          offset: (i / cfg.count) * Math.PI * 2, fading: false,
        });
      }
    });

    const driver = { a: 0 };
    const anim = animate(driver, {
      a: Math.PI * 2, duration: 30000, ease: "linear", loop: true,
      onUpdate: () => all.forEach((d) => {
        const a = driver.a * d.speed + d.offset;
        const ca = Math.cos(a);
        d.el.style.translate = `${ca * d.rx}px ${Math.sin(a) * d.ry}px`;
        const shouldFront = ca > 0;
        if (shouldFront && d.el.parentElement === back && !d.fading) {
          d.fading = true; d.el.style.opacity = "0";
          setTimeout(() => { front.appendChild(d.el); d.el.style.opacity = ""; d.fading = false; }, 200);
        } else if (!shouldFront && d.el.parentElement === front && !d.fading) {
          d.fading = true; d.el.style.opacity = "0";
          setTimeout(() => { back.appendChild(d.el); d.el.style.opacity = ""; d.fading = false; }, 200);
        }
      }),
    });

    return () => { anim.pause(); all.forEach((d) => d.el.remove()); };
  }, []);

  /* ─── 碎片微呼吸 ─── */
  useEffect(() => {
    fragsRef.current.forEach((el) => {
      animate(el, {
        translateX: [0, (Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 1.2, 0],
        translateY: [0, (Math.random() - 0.5) * 1.2, 0, (Math.random() - 0.5) * 1.2, 0],
        scale: [1, 1.008, 1, 1.008, 1],
        duration: 3500 + Math.random() * 2500,
        delay: Math.random() * 3000,
        ease: "inOut(2)",
        loop: true,
      });
    });
  }, []);

  /* ─── 点击波纹 ─── */
  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;
    const centerX = rect.width / 2, centerY = rect.height / 2;

    const withDist = fragsRef.current.map((el) => {
      const fr = el.getBoundingClientRect();
      return { el, dist: Math.hypot(fr.left + fr.width / 2 - rect.left - cx, fr.top + fr.height / 2 - rect.top - cy) };
    }).sort((a, b) => a.dist - b.dist);

    withDist.forEach(({ el, dist }) => {
      const t = Math.max(0, 1 - dist / 100);
      const angle = Math.atan2(cy - centerY, cx - centerX);
      animate(el, {
        translateX: [0, Math.cos(angle) * 6 * t, -Math.cos(angle) * 2 * t, 0],
        translateY: [0, Math.sin(angle) * 6 * t, -Math.sin(angle) * 2 * t, 0],
        scale: [1, 1 + 0.03 * t, 1],
        duration: 500 + t * 300,
        delay: dist * 2.5,
        ease: "out(3)",
      });
    });
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center"
      style={{ width: 210, height: 210 }}
      ref={containerRef}>
      {/* 轨道后层 */}
      <div ref={backRef} className="absolute inset-0 z-0" />

      {/* 头像碎片 */}
      <div
        className="relative cursor-pointer select-none overflow-hidden rounded-full"
        style={{ width: 124, height: 124, zIndex: 1 }}
        onClick={handleClick}
        role="img" aria-label="头像"
      >
        {FRAGS.map((clip, i) => (
          <div
            key={i}
            ref={(el) => { if (el) fragsRef.current[i] = el; }}
            className="absolute"
            style={{
              clipPath: clip,
              inset: -2,
              backgroundImage: `url(${import.meta.env.BASE_URL}avatar.png)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}
        {/* 玻璃高光 */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.15) 0%, transparent 50%)" }} />
      </div>

      {/* 轨道前层 */}
      <div ref={frontRef} className="absolute inset-0" style={{ zIndex: 3 }} />
    </div>
  );
}
