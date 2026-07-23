import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/* ─── 4 层光环 ─── */
const RINGS = [
  { rx: 90, ry: 36, speed: 0.35, color: "oklch(0.72 0.2 85 / 0.7)", count: 12, size: 2.5, ring: "oklch(0.72 0.2 85 / 0.12)" },
  { rx: 80, ry: 30, speed: -0.3, color: "oklch(0.63 0.15 20 / 0.55)", count: 8, size: 2, ring: "oklch(0.63 0.15 20 / 0.08)" },
  { rx: 96, ry: 28, speed: 0.5, color: "rgba(255,255,255,0.4)", count: 6, size: 2, ring: "rgba(255,255,255,0.06)" },
  { rx: 84, ry: 40, speed: -0.45, color: "oklch(0.68 0.18 50 / 0.5)", count: 8, size: 2.5, ring: "oklch(0.68 0.18 50 / 0.1)" },
];

/* ─── 20 块自然碎裂（不规则多边形） ─── */
const FRAGS = [
  "polygon(0 3, 25% 0, 30% 8, 22% 20, 0 22)",
  "polygon(25% 0, 55% 2, 50% 14, 30% 8)",
  "polygon(55% 2, 80% 0, 100% 4, 95% 18, 78% 22, 50% 14)",
  "polygon(95% 18, 100% 4, 100% 40, 86% 38, 78% 22)",
  "polygon(86% 38, 100% 40, 100% 62, 90% 56, 84% 42)",
  "polygon(90% 56, 100% 62, 100% 85, 82% 76, 84% 42)",
  "polygon(82% 76, 100% 85, 100% 100, 68% 97, 62% 82)",
  "polygon(62% 82, 68% 97, 38% 100, 28% 86)",
  "polygon(28% 86, 38% 100, 0 100, 0 86)",
  "polygon(0 86, 0 66, 15% 60, 28% 86)",
  "polygon(0 66, 0 44, 12% 42, 15% 60)",
  "polygon(0 44, 0 22, 18% 28, 12% 42)",
  "polygon(22% 20, 30% 8, 50% 14, 38% 34, 18% 28)",
  "polygon(50% 14, 78% 22, 66% 40, 38% 34)",
  "polygon(78% 22, 86% 38, 66% 40)",
  "polygon(66% 40, 84% 42, 70% 56, 58% 52)",
  "polygon(84% 42, 90% 56, 70% 56)",
  "polygon(70% 56, 82% 76, 62% 82, 58% 52)",
  "polygon(58% 52, 62% 82, 28% 86, 38% 60, 42% 48)",
  "polygon(18% 28, 38% 34, 42% 48, 38% 60, 28% 86, 15% 60, 12% 42)",
];

export default function AvatarWithJelly() {
  const fragsRef = useRef<HTMLDivElement[]>([]);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);

  /* ─── 光环 ─── */
  useEffect(() => {
    const back = backRef.current, front = frontRef.current;
    if (!back || !front) return;

    // 轨道线
    const ringEls: HTMLDivElement[] = [];
    RINGS.forEach((cfg) => {
      const r = document.createElement("div");
      r.style.cssText = `position:absolute; border-radius:50%; pointer-events:none; width:${cfg.rx * 2}px; height:${cfg.ry * 2}px; left:50%; top:50%; margin-left:-${cfg.rx}px; margin-top:-${cfg.ry}px; border:1px solid ${cfg.ring};`;
      back.appendChild(r);
      ringEls.push(r);
    });

    // 粒子
    const all: Array<{ el: HTMLDivElement; rx: number; ry: number; speed: number; offset: number; fading: boolean }> = [];
    RINGS.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        const dot = document.createElement("div");
        const s = cfg.size;
        dot.style.cssText = `position:absolute; border-radius:50%; pointer-events:none; width:${s}px; height:${s}px; background:${cfg.color}; box-shadow:0 0 ${s * 4}px ${s * 1.5}px ${cfg.color}; left:50%; top:50%; transition:opacity .25s;`;
        back.appendChild(dot);
        all.push({ el: dot, rx: cfg.rx, ry: cfg.ry, speed: cfg.speed, offset: (i / cfg.count) * Math.PI * 2, fading: false });
      }
    });

    const driver = { a: 0 };
    const anim = animate(driver, {
      a: Math.PI * 2, duration: 35000, ease: "linear", loop: true,
      onUpdate: () => all.forEach((d) => {
        const a = driver.a * d.speed + d.offset, ca = Math.cos(a);
        d.el.style.translate = `${ca * d.rx}px ${Math.sin(a) * d.ry}px`;
        const toFront = ca > 0.05;
        if (toFront && d.el.parentElement === back && !d.fading) {
          d.fading = true; d.el.style.opacity = "0";
          setTimeout(() => { front.appendChild(d.el); d.el.style.opacity = ""; d.fading = false; }, 250);
        } else if (!toFront && d.el.parentElement === front && !d.fading) {
          d.fading = true; d.el.style.opacity = "0";
          setTimeout(() => { back.appendChild(d.el); d.el.style.opacity = ""; d.fading = false; }, 250);
        }
      }),
    });
    return () => { anim.pause(); all.forEach(d => d.el.remove()); ringEls.forEach(r => r.remove()); };
  }, []);

  /* ─── 微呼吸 ─── */
  useEffect(() => {
    fragsRef.current.forEach((el) => {
      animate(el, {
        translateX: [0, (Math.random() - .5) * 1.2, 0, (Math.random() - .5) * 1.2, 0],
        translateY: [0, (Math.random() - .5) * 1.2, 0, (Math.random() - .5) * 1.2, 0],
        rotate: [0, (Math.random() - .5) * 0.6, 0, (Math.random() - .5) * 0.6, 0],
        duration: 4000 + Math.random() * 3000,
        delay: Math.random() * 4000,
        ease: "inOut(2)",
        loop: true,
      });
    });
  }, []);

  /* ─── 点击波纹 ─── */
  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top, center = rect.width / 2;

    fragsRef.current
      .map((el) => {
        const fr = el.getBoundingClientRect();
        return { el, dist: Math.hypot(fr.left + fr.width / 2 - rect.left - cx, fr.top + fr.height / 2 - rect.top - cy) };
      })
      .sort((a, b) => a.dist - b.dist)
      .forEach(({ el, dist }) => {
        const t = Math.max(0, 1 - dist / 100);
        const angle = Math.atan2(cy - center, cx - center);
        animate(el, {
          translateX: [0, Math.cos(angle) * 5 * t, -Math.cos(angle) * 2 * t, 0],
          translateY: [0, Math.sin(angle) * 5 * t, -Math.sin(angle) * 2 * t, 0],
          rotate: [0, (Math.random() - .5) * 3 * t, 0],
          duration: 500 + t * 300,
          delay: dist * 3,
          ease: "out(3)",
        });
      });
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 220, height: 220 }}>
      {/* 光环后层 */}
      <div ref={backRef} className="absolute inset-0 z-0" />

      {/* 头像碎片 — 裂痕处透出暖光 */}
      <div
        className="relative cursor-pointer select-none overflow-hidden rounded-full"
        style={{
          width: 126, height: 126, zIndex: 1,
          boxShadow: "inset 0 0 2px oklch(0.7 0.15 85 / 0.4)",
        }}
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
              inset: -1,
              backgroundImage: `url(${import.meta.env.BASE_URL}avatar.png)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
              filter: "brightness(1.02)",
            }}
          />
        ))}
        {/* 裂痕琥珀光 */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ boxShadow: "inset 0 0 8px oklch(0.7 0.15 85 / 0.25)" }} />
      </div>

      {/* 光环前层 */}
      <div ref={frontRef} className="absolute inset-0" style={{ zIndex: 3 }} />
    </div>
  );
}
