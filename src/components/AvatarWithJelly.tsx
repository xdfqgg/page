import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/**
 * Avatar — 高级感头像
 *
 *   玻璃拟态 + 微光晕 + 悬停跟随 + 点击涟漪
 */

export default function AvatarWithJelly() {
  const outerRef = useRef<HTMLDivElement>(null);
  const ringRef = useRef<HTMLDivElement>(null);

  /* ─── Hover：鼠标靠近时整体微倾向光源方向 ─── */
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

      if (dist < 250) {
        const t = 1 - Math.min(dist / 250, 1);
        // 光晕偏移
        const sx = (dx / (dist || 1)) * 12 * t;
        const sy = (dy / (dist || 1)) * 10 * t;
        el.style.boxShadow = `
          0 0 ${20 + 15 * t}px ${2 + 5 * t}px oklch(0.7 0.2 85 / ${0.15 + t * 0.2}),
          0 0 ${50 + 30 * t}px ${6 + 10 * t}px oklch(0.7 0.2 85 / ${0.06 + t * 0.08}),
          inset 0 0 30px rgba(255,255,255,${0.02 + t * 0.04})
        `;
        // 高光偏移
        const shine = el.querySelector(".avatar-shine") as HTMLElement;
        if (shine) {
          shine.style.background = `
            radial-gradient(
              ellipse at ${50 + sx}% ${50 + sy}%,
              rgba(255,255,255,0.6) 0%,
              rgba(255,255,255,0.12) 35%,
              transparent 65%
            )
          `;
        }
      }
    };

    window.addEventListener("mousemove", handleHover);
    return () => window.removeEventListener("mousemove", handleHover);
  }, []);

  /* ─── Click：涟漪 ─── */
  const handleClick = useCallback(() => {
    const el = outerRef.current;
    if (!el) return;

    // 微弹
    animate(el, { scale: [1, 0.95, 1.02, 1], duration: 500, ease: "out(3)" });

    // 涟漪
    for (let i = 0; i < 2; i++) {
      const ripple = document.createElement("div");
      ripple.className = "absolute inset-0 rounded-full pointer-events-none";
      ripple.style.cssText = `border: 1px solid oklch(0.7 0.2 85 / 0.4); z-index: 30;`;
      el.appendChild(ripple);
      animate(ripple, {
        scale: [0.9, 1.6],
        opacity: [0.5, 0],
        duration: 800,
        delay: i * 200,
        ease: "out(2)",
        onComplete: () => ripple.remove(),
      });
    }
  }, []);

  return (
    <div className="absolute left-1/2 top-1/2" style={{ marginLeft: -80, marginTop: -80 }}>
      {/* 外层：光晕 + 边框 */}
      <div
        ref={outerRef}
        onClick={handleClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none"
        style={{
          width: 160,
          height: 160,
          padding: 3,
          boxShadow: `
            0 0 20px 2px oklch(0.7 0.2 85 / 0.15),
            0 0 50px 6px oklch(0.7 0.2 85 / 0.06)
          `,
          zIndex: 1,
        }}
        role="img"
        aria-label="头像"
      >
        {/* 旋转渐变环 */}
        <div
          ref={ringRef}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `conic-gradient(from 0deg, oklch(0.7 0.2 85 / 0.3), transparent 40%, oklch(0.7 0.2 85 / 0.3), transparent 70%, oklch(0.7 0.2 85 / 0.3))`,
            mask: "radial-gradient(circle, transparent 72%, black 74%)",
            WebkitMask: "radial-gradient(circle, transparent 72%, black 74%)",
            animation: "spin-ring 4s linear infinite",
          }}
        />

        {/* 玻璃球体 */}
        <div className="relative flex items-center justify-center rounded-full overflow-hidden bg-primary/[0.06] backdrop-blur-sm"
          style={{ width: 154, height: 154 }}>
          {/* 表面光泽 */}
          <div
            className="avatar-shine absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 42% 35%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.1) 35%, transparent 65%)`,
              zIndex: 5,
            }}
          />
          {/* 底部反光 */}
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(ellipse at 50% 90%, rgba(255,255,255,0.15) 0%, transparent 40%)`,
              zIndex: 4,
            }}
          />
          {/* 头像 */}
          <img
            src={import.meta.env.BASE_URL + "avatar.png"}
            alt="头像"
            className="h-full w-full rounded-full object-cover scale-110 pointer-events-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
