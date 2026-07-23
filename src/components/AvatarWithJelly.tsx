import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/* ─── 4 层光环 ─── */
const RINGS = [
  { rx: 90, ry: 36, speed: 0.35, color: "oklch(0.72 0.2 85 / 0.7)", count: 12, size: 2.5, ring: "oklch(0.72 0.2 85 / 0.12)" },
  { rx: 80, ry: 30, speed: -0.3, color: "oklch(0.63 0.15 20 / 0.55)", count: 8, size: 2, ring: "oklch(0.63 0.15 20 / 0.08)" },
  { rx: 96, ry: 28, speed: 0.5, color: "rgba(255,255,255,0.4)", count: 6, size: 2, ring: "rgba(255,255,255,0.06)" },
  { rx: 84, ry: 40, speed: -0.45, color: "oklch(0.68 0.18 50 / 0.5)", count: 8, size: 2.5, ring: "oklch(0.68 0.18 50 / 0.1)" },
];

/* ─── 20 碎片 ─── */
const FRAGS = [
  "polygon(0 0, 28% 0, 22% 18%, 0 22%)",
  "polygon(28% 0, 56% 0, 48% 20%, 22% 18%)",
  "polygon(56% 0, 100% 0, 100% 20%, 78% 24%, 48% 20%)",
  "polygon(100% 20%, 100% 44%, 84% 40%, 78% 24%)",
  "polygon(100% 44%, 100% 66%, 86% 58%, 84% 40%)",
  "polygon(100% 66%, 100% 88%, 80% 80%, 86% 58%)",
  "polygon(100% 88%, 100% 100%, 66% 100%, 60% 84%, 80% 80%)",
  "polygon(60% 84%, 66% 100%, 34% 100%, 28% 84%)",
  "polygon(28% 84%, 34% 100%, 0 100%, 0 84%)",
  "polygon(0 84%, 0 64%, 16% 56%, 28% 84%)",
  "polygon(0 64%, 0 44%, 14% 40%, 16% 56%)",
  "polygon(0 44%, 0 22%, 20% 26%, 14% 40%)",
  "polygon(22% 18%, 48% 20%, 36% 36%, 24% 30%)",
  "polygon(48% 20%, 78% 24%, 64% 40%, 36% 36%)",
  "polygon(78% 24%, 84% 40%, 64% 40%)",
  "polygon(84% 40%, 86% 58%, 64% 54%, 64% 40%)",
  "polygon(86% 58%, 80% 80%, 60% 70%, 64% 54%)",
  "polygon(60% 84%, 60% 70%, 80% 80%)",
  "polygon(24% 30%, 36% 36%, 28% 50%, 18% 42%)",
  "polygon(36% 36%, 64% 40%, 54% 54%, 44% 52%, 28% 50%)",
];

export default function AvatarWithJelly() {
  const fragsRef = useRef<HTMLDivElement[]>([]);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);

  /* ─── 光环 + 轨道粒子 ─── */
  useEffect(() => {
    const back = backRef.current, front = frontRef.current;
    if (!back || !front) return;

    // 环线
    const rings: HTMLDivElement[] = [];
    RINGS.forEach((cfg) => {
      const ring = document.createElement("div");
      ring.style.cssText = `
        position:absolute; border-radius:50%; pointer-events:none;
        width:${cfg.rx * 2}px; height:${cfg.ry * 2}px;
        left:50%; top:50%; margin-left:-${cfg.rx}px; margin-top:-${cfg.ry}px;
        border:1px solid ${cfg.ring};
      `;
      back.appendChild(ring);
      rings.push(ring);
    });

    // 粒子
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
          box-shadow:0 0 ${s*4}px ${s*1.5}px ${cfg.color};
          left:50%; top:50%; transition: opacity 0.25s;
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
      a: Math.PI * 2, duration: 35000, ease: "linear", loop: true,
      onUpdate: () => all.forEach((d) => {
        const a = driver.a * d.speed + d.offset;
        const ca = Math.cos(a);
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

    return () => { anim.pause(); all.forEach(d => d.el.remove()); rings.forEach(r => r.remove()); };
  }, []);

  /* ─── 碎片微呼吸 ─── */
  useEffect(() => {
    fragsRef.current.forEach((el) => {
      animate(el, {
        translateX: [0, (Math.random() - 0.5) * 1, 0, (Math.random() - 0.5) * 1, 0],
        translateY: [0, (Math.random() - 0.5) * 1, 0, (Math.random() - 0.5) * 1, 0],
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
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top;

    const list = fragsRef.current.map((el) => {
      const fr = el.getBoundingClientRect();
      return { el, dist: Math.hypot(fr.left + fr.width / 2 - rect.left - cx, fr.top + fr.height / 2 - rect.top - cy) };
    }).sort((a, b) => a.dist - b.dist);

    list.forEach(({ el, dist }) => {
      const t = Math.max(0, 1 - dist / 100);
      const a = Math.atan2(cy - rect.height / 2, cx - rect.width / 2);
      animate(el, {
        translateX: [0, Math.cos(a) * 5 * t, -Math.cos(a) * 2 * t, 0],
        translateY: [0, Math.sin(a) * 5 * t, -Math.sin(a) * 2 * t, 0],
        rotate: [0, (Math.random() - 0.5) * 3 * t, 0],
        duration: 500 + t * 300,
        delay: dist * 3,
        ease: "out(3)",
      });
    });
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 220, height: 220 }}>
      {/* 光环 + 粒子后层 */}
      <div ref={backRef} className="absolute inset-0 z-0" />

      {/* 头像碎片容器（深色底让裂隙可见） */}
      <div
        className="relative cursor-pointer select-none overflow-hidden rounded-full"
        style={{ width: 126, height: 126, zIndex: 1, background: "#0a0a0a" }}
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
            }}
          />
        ))}
      </div>

      {/* 粒子前层 */}
      <div ref={frontRef} className="absolute inset-0" style={{ zIndex: 3 }} />
    </div>
  );
}
