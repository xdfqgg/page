import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/**
 * Avatar — 轨道粒子 + 20碎片裂纹
 *   碎片空闲微呼吸，点击波纹传导分离再合拢
 */

const ORBITS = [
  { rx: 84, ry: 32, speed: 0.45, color: "oklch(0.72 0.2 85)", count: 8, size: 2.5 },
  { rx: 76, ry: 28, speed: -0.38, color: "oklch(0.63 0.15 20)", count: 6, size: 2 },
  { rx: 90, ry: 24, speed: 0.65, color: "rgba(255,255,255,0.5)", count: 5, size: 2 },
  { rx: 80, ry: 36, speed: -0.55, color: "oklch(0.68 0.18 50 / 0.6)", count: 5, size: 2.5 },
];

const FRAGMENTS = [
  { clip: "polygon(0 0, 30% 0, 20% 15%, 0 20%)" },
  { clip: "polygon(30% 0, 60% 0, 50% 18%, 20% 15%)" },
  { clip: "polygon(60% 0, 100% 0, 100% 18%, 80% 22%, 50% 18%)" },
  { clip: "polygon(100% 18%, 100% 42%, 85% 38%, 80% 22%)" },
  { clip: "polygon(100% 42%, 100% 65%, 88% 58%, 85% 38%)" },
  { clip: "polygon(100% 65%, 100% 88%, 82% 80%, 88% 58%)" },
  { clip: "polygon(100% 88%, 100% 100%, 70% 100%, 60% 85%, 82% 80%)" },
  { clip: "polygon(60% 85%, 70% 100%, 35% 100%, 30% 82%)" },
  { clip: "polygon(30% 82%, 35% 100%, 0 100%, 0 82%)" },
  { clip: "polygon(0 82%, 0 62%, 18% 55%, 30% 82%)" },
  { clip: "polygon(0 62%, 0 42%, 15% 38%, 18% 55%)" },
  { clip: "polygon(0 42%, 0 20%, 18% 25%, 15% 38%)" },
  { clip: "polygon(20% 15%, 50% 18%, 38% 35%, 22% 30%)" },
  { clip: "polygon(50% 18%, 80% 22%, 65% 38%, 38% 35%)" },
  { clip: "polygon(80% 22%, 85% 38%, 65% 38%)" },
  { clip: "polygon(85% 38%, 88% 58%, 65% 55%, 65% 38%)" },
  { clip: "polygon(88% 58%, 82% 80%, 60% 70%, 65% 55%)" },
  { clip: "polygon(60% 85%, 60% 70%, 82% 80%)" },
  { clip: "polygon(22% 30%, 38% 35%, 30% 50%, 18% 40%)" },
  { clip: "polygon(38% 35%, 65% 38%, 55% 55%, 45% 52%, 30% 50%)" },
];

export default function AvatarWithJelly() {
  const fragsRef = useRef<HTMLDivElement[]>([]);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);

  /* ─── 椭圆轨道 ─── */
  useEffect(() => {
    const back = backRef.current, front = frontRef.current;
    if (!back || !front) return;
    const all: Array<{ el: HTMLDivElement; rx: number; ry: number; speed: number; offset: number }> = [];
    ORBITS.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        const dot = document.createElement("div");
        dot.className = "absolute rounded-full pointer-events-none";
        const s = (cfg as any).size || 3;
        dot.style.cssText = `width:${s}px; height:${s}px; background:${cfg.color}; box-shadow:0 0 ${s*2}px ${s/2}px ${cfg.color}; left:50%; top:50%;`;
        back.appendChild(dot);
        all.push({ el: dot, rx: cfg.rx, ry: cfg.ry, speed: cfg.speed, offset: (i / cfg.count) * Math.PI * 2 });
      }
    });
    const driver = { angle: 0 };
    const anim = animate(driver, {
      angle: Math.PI * 2, duration: 25000, ease: "linear", loop: true,
      onUpdate: () => all.forEach((d) => {
        const a = driver.angle * d.speed + d.offset;
        d.el.style.translate = `${Math.cos(a) * d.rx}px ${Math.sin(a) * d.ry}px`;
        const cosA = Math.cos(a);
        const inFront = cosA > -0.1;
        // 越靠近边缘越透明（模拟绕到后面）
        d.el.style.opacity = String(0.3 + Math.abs(cosA) * 0.7);
        if (inFront && d.el.parentElement === back) {
          (d.el as any)._fading = true;
          d.el.style.opacity = "0";
          setTimeout(() => { front.appendChild(d.el); d.el.style.opacity = ""; (d.el as any)._fading = false; }, 150);
        } else if (!inFront && d.el.parentElement === front && !(d.el as any)._fading) {
          (d.el as any)._fading = true;
          d.el.style.opacity = "0";
          setTimeout(() => { back.appendChild(d.el); d.el.style.opacity = ""; (d.el as any)._fading = false; }, 150);
        }
      }),
    });
    return () => { anim.pause(); all.forEach(d => d.el.remove()); };
  }, []);

  /* ─── 碎片空闲微呼吸 ─── */
  useEffect(() => {
    fragsRef.current.forEach((el) => {
      const tx = (Math.random() - 0.5) * 1.5;
      const ty = (Math.random() - 0.5) * 1.5;
      const s = 1 + (Math.random() - 0.5) * 0.015;
      animate(el, {
        translateX: [0, tx, 0, -tx, 0],
        translateY: [0, ty, 0, -ty, 0],
        scale: [1, s, 1, s, 1],
        duration: 3000 + Math.random() * 2000,
        delay: Math.random() * 2000,
        ease: "inOut(2)",
        loop: true,
      });
    });
  }, []);

  /* ─── 点击波纹传导 ─── */
  const handleClick = useCallback((e: React.MouseEvent) => {
    const container = e.currentTarget as HTMLElement;
    const rect = container.getBoundingClientRect();
    const cx = e.clientX - rect.left;
    const cy = e.clientY - rect.top;

    // 计算每个碎片中心到点击位置的距离
    const fragsWithDist = fragsRef.current.map((el, i) => {
      const fr = el.getBoundingClientRect();
      const fx = fr.left - rect.left + fr.width / 2;
      const fy = fr.top - rect.top + fr.height / 2;
      const dist = Math.sqrt((fx - cx) ** 2 + (fy - cy) ** 2);
      return { el, i, dist };
    });

    // 按距离排序
    fragsWithDist.sort((a, b) => a.dist - b.dist);

    // 波纹动画：距离近的先动，远的后动
    fragsWithDist.forEach(({ el, dist }) => {
      const delay = dist * 2; // 距离越远延迟越大
      const intensity = Math.max(0, 1 - dist / 120); // 越远越弱
      const angle = Math.atan2(
        cy - (rect.height / 2),
        cx - (rect.width / 2)
      );
      const tx = Math.cos(angle) * 8 * intensity;
      const ty = Math.sin(angle) * 8 * intensity;

      animate(el, {
        translateX: [0, tx, -tx * 0.3, 0],
        translateY: [0, ty, -ty * 0.3, 0],
        scale: [1, 1 + 0.04 * intensity, 1],
        duration: 500 + intensity * 200,
        delay,
        ease: "out(3)",
      });
    });
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 200, height: 200 }}>
      <div ref={backRef} className="absolute inset-0 z-0" />

      <div
        className="relative cursor-pointer select-none overflow-hidden rounded-full"
        style={{ width: 120, height: 120, zIndex: 1 }}
        onClick={handleClick}
        role="img" aria-label="头像"
      >
        {FRAGMENTS.map((f, i) => (
          <div
            key={i}
            ref={(el) => { if (el) fragsRef.current[i] = el; }}
            className="absolute inset-0"
            style={{
              clipPath: f.clip,
              backgroundImage: `url(${import.meta.env.BASE_URL}avatar.png)`,
              backgroundSize: "cover",
              backgroundPosition: "center",
            }}
          />
        ))}

        {/* 裂纹线 */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-10" viewBox="0 0 120 120">
          {/* 水平主裂 */}
          <polyline points="0,20 20,15 50,18 80,22 100,18" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
          <polyline points="0,42 15,38 38,35 65,38 85,38 100,42" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.2" />
          <polyline points="0,62 18,55 30,50 45,52 55,55 65,55 88,58 100,65" fill="none" stroke="rgba(0,0,0,0.2)" strokeWidth="1.2" />
          <polyline points="0,82 30,82 60,85 82,80 100,88" fill="none" stroke="rgba(0,0,0,0.25)" strokeWidth="1.5" />
          {/* 竖直裂纹 */}
          <polyline points="20,0 22,30 18,40 18,55 30,82" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          <polyline points="38,35 55,55 60,70 60,85" fill="none" stroke="rgba(0,0,0,0.15)" strokeWidth="1" />
          <polyline points="65,38 65,55 88,58" fill="none" stroke="rgba(0,0,0,0.12)" strokeWidth="0.8" />
        </svg>

        {/* 玻璃反光 */}
        <div className="absolute inset-0 rounded-full pointer-events-none z-10"
          style={{ background: "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.2) 0%, transparent 45%)" }} />
      </div>

      <div ref={frontRef} className="absolute inset-0" style={{ zIndex: 3 }} />
    </div>
  );
}
