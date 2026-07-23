import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/* ─── 轨道环 ─── */
const RINGS = [
  { rx: 90, ry: 36, speed: 0.35, color: "oklch(0.72 0.2 85 / 0.7)", count: 12, size: 2.5, ring: "oklch(0.72 0.2 85 / 0.12)" },
  { rx: 80, ry: 30, speed: -0.3, color: "oklch(0.63 0.15 20 / 0.55)", count: 8, size: 2, ring: "oklch(0.63 0.15 20 / 0.08)" },
  { rx: 96, ry: 28, speed: 0.5, color: "rgba(255,255,255,0.4)", count: 6, size: 2, ring: "rgba(255,255,255,0.06)" },
  { rx: 84, ry: 40, speed: -0.45, color: "oklch(0.68 0.18 50 / 0.5)", count: 8, size: 2.5, ring: "oklch(0.68 0.18 50 / 0.1)" },
];

export default function AvatarWithJelly() {
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  /* ─── 光环轨道 ─── */
  useEffect(() => {
    const back = backRef.current, front = frontRef.current;
    if (!back || !front) return;

    // 轨道线
    const ringEls: HTMLDivElement[] = [];
    RINGS.forEach((cfg) => {
      const r = document.createElement("div");
      r.style.cssText = `position:absolute; border-radius:50%; pointer-events:none; width:${cfg.rx * 2}px; height:${cfg.ry * 2}px; left:50%; top:50%; margin-left:-${cfg.rx}px; margin-top:-${cfg.ry}px; border:1px solid ${cfg.ring};`;
      back.appendChild(r); ringEls.push(r);
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

  /* ─── Click 涟漪 ─── */
  const handleClick = useCallback(() => {
    const el = avatarRef.current;
    if (!el) return;
    animate(el, { scale: [1, 0.94, 1.03, 1], duration: 500, ease: "out(3)" });
    for (let i = 0; i < 2; i++) {
      const ripple = document.createElement("div");
      ripple.className = "absolute inset-0 rounded-full pointer-events-none";
      ripple.style.cssText = "border:1.5px solid oklch(0.7 0.2 85 / 0.4); z-index:20;";
      el.appendChild(ripple);
      animate(ripple, { scale: [0.8, 1.8], opacity: [0.5, 0], duration: 800, delay: i * 200, ease: "out(2)", onComplete: () => ripple.remove() });
    }
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 220, height: 220 }}>
      {/* 光环后层 */}
      <div ref={backRef} className="absolute inset-0 z-0" />

      {/* 水滴头像 */}
      <div
        ref={avatarRef}
        onClick={handleClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-hidden"
        style={{
          width: 120, height: 120, zIndex: 1,
          boxShadow: "0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)",
          transition: "box-shadow 0.5s, transform 0.3s",
        }}
        onMouseEnter={(e) => { e.currentTarget.style.boxShadow = "0 0 40px 10px oklch(0.7 0.2 85 / 0.35), 0 0 90px 22px oklch(0.7 0.2 85 / 0.15)"; e.currentTarget.style.transform = "scale(1.03)"; }}
        onMouseLeave={(e) => { e.currentTarget.style.boxShadow = "0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)"; e.currentTarget.style.transform = "scale(1)"; }}
        role="img" aria-label="头像"
      >
        <img src={import.meta.env.BASE_URL + "avatar.png"} alt=""
          className="absolute inset-0 h-full w-full rounded-full object-cover pointer-events-none"
          draggable={false} />
        {/* 玻璃反光 */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.25) 0%, transparent 50%)" }} />
        {/* 底部反光 */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 88%, rgba(255,255,255,0.1) 0%, transparent 30%)" }} />
      </div>

      {/* 光环前层 */}
      <div ref={frontRef} className="absolute inset-0" style={{ zIndex: 3 }} />
    </div>
  );
}
