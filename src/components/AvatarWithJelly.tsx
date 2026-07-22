import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/**
 * AvatarWithJelly — 凝珠包裹头像
 *
 *   头像被一颗透明水珠包裹着。
 *   水珠表面有：
 *     - 高光点（鼠标方向的光源反射）
 *     - 边缘光（菲涅尔效应：边缘比中心亮）
 *     - 底部反光（桌面反弹的光）
 *   hover → 高光点跟随鼠标
 *   click → 果冻弹 + 涟漪
 */

export default function AvatarWithJelly() {
  const containerRef = useRef<HTMLDivElement>(null);
  const highlightRef = useRef<HTMLDivElement>(null);

  /* ─── Hover：高光点跟随鼠标 ─── */
  useEffect(() => {
    const container = containerRef.current;
    const highlight = highlightRef.current;
    if (!container || !highlight) return;

    const handleHover = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx;
      const dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 200) {
        const t = Math.max(0, 1 - dist / 200);
        // 高光位置偏向鼠标方向
        const hx = 50 + (dx / (dist || 1)) * 22 * t;
        const hy = 50 + (dy / (dist || 1)) * 18 * t;
        highlight.style.background = `
          radial-gradient(
            ellipse at ${hx}% ${hy}%,
            rgba(255,255,255,0.9) 0%,
            rgba(255,255,255,0.3) 20%,
            rgba(255,255,255,0.05) 50%,
            transparent 70%
          )
        `;
        highlight.style.opacity = "1";
      }
    };

    window.addEventListener("mousemove", handleHover);
    return () => window.removeEventListener("mousemove", handleHover);
  }, []);

  /* ─── Click ─── */
  const handleClick = useCallback(() => {
    const el = containerRef.current;
    if (!el) return;

    animate(el, {
      scale: [1, 0.9, 1.04, 1],
      duration: 500,
      ease: "out(3)",
    });

    for (let i = 0; i < 3; i++) {
      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: absolute; inset: -4px; border-radius: 50%;
        border: 1.5px solid oklch(0.7 0.2 85 / 0.5);
        pointer-events: none; z-index: 30;
      `;
      el.appendChild(ripple);
      animate(ripple, {
        scale: [0.8, 2.5],
        opacity: [0.5, 0],
        duration: 900,
        delay: i * 180,
        ease: "out(2)",
        onComplete: () => ripple.remove(),
      });
    }
  }, []);

  return (
    <div
      className="absolute left-1/2 top-1/2"
      style={{ marginLeft: -68, marginTop: -68 }}
    >
      {/* 水珠外壳 */}
      <div
        ref={containerRef}
        onClick={handleClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none"
        style={{
          width: 136,
          height: 136,
          padding: 8,
          animation: "breathe-amber 3s ease-in-out infinite",
          zIndex: 1,
        }}
        role="img"
        aria-label="头像"
      >
        {/* ─── 水珠边缘光（菲涅尔：边缘亮，内部透明） ─── */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `
              radial-gradient(
                circle at 50% 50%,
                transparent 55%,
                rgba(255,255,255,0.08) 75%,
                rgba(255,255,255,0.2) 90%,
                rgba(255,255,255,0.35) 100%
              )
            `,
            zIndex: 10,
          }}
        />

        {/* ─── 水珠底部反光 ─── */}
        <div
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `
              radial-gradient(
                ellipse at 50% 88%,
                rgba(255,255,255,0.3) 0%,
                rgba(255,255,255,0.08) 30%,
                transparent 50%
              )
            `,
            zIndex: 10,
          }}
        />

        {/* ─── 高光点（hover 跟随鼠标） ─── */}
        <div
          ref={highlightRef}
          className="absolute inset-0 rounded-full pointer-events-none"
          style={{
            background: `
              radial-gradient(
                ellipse at 45% 35%,
                rgba(255,255,255,0.7) 0%,
                rgba(255,255,255,0.2) 20%,
                rgba(255,255,255,0.03) 50%,
                transparent 70%
              )
            `,
            opacity: 1,
            zIndex: 11,
          }}
        />

        {/* ─── 头像（在水珠里面） ─── */}
        <div
          className="relative flex items-center justify-center rounded-full overflow-hidden"
          style={{ width: 120, height: 120, zIndex: 5 }}
        >
          <img
            src="/avatar.png"
            alt="头像"
            className="h-full w-full rounded-full object-cover scale-125 pointer-events-none"
            draggable={false}
          />
        </div>
      </div>
    </div>
  );
}
