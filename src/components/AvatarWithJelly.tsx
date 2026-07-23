import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

/**
 * Avatar — 轨道粒子 + 裂纹碎片
 * 头像被切割为多个碎片，hover/click 时碎片分离再合拢
 */

// 椭圆轨道: rx, ry, speed, color, count
const ORBITS = [
  { rx: 82, ry: 30, speed: 0.5, color: "oklch(0.72 0.2 85)", count: 5 },
  { rx: 74, ry: 26, speed: -0.4, color: "oklch(0.63 0.15 20)", count: 4 },
  { rx: 88, ry: 22, speed: 0.7, color: "rgba(255,255,255,0.55)", count: 3 },
];

// 每个碎片的 clip-path 和悬停偏移方向
const FRAGMENTS = [
  // 左上大块
  { clip: "polygon(0 0, 55% 0, 45% 35%, 30% 55%, 0 45%)", hover: { x: -6, y: -5 } },
  // 右上大块
  { clip: "polygon(55% 0, 100% 0, 100% 50%, 70% 45%, 45% 35%)", hover: { x: 6, y: -4 } },
  // 右中大块
  { clip: "polygon(100% 50%, 100% 100%, 65% 100%, 55% 70%, 70% 45%)", hover: { x: 7, y: 3 } },
  // 左下大块
  { clip: "polygon(0 45%, 30% 55%, 20% 80%, 0 100%)", hover: { x: -5, y: 6 } },
  // 底部中间
  { clip: "polygon(20% 80%, 30% 55%, 45% 35%, 55% 70%, 65% 100%, 20% 100%)", hover: { x: 0, y: 8 } },
  // 右侧小碎片
  { clip: "polygon(70% 45%, 90% 30%, 100% 45%)", hover: { x: 4, y: -6 } },
  // 中心横条
  { clip: "polygon(45% 35%, 55% 30%, 60% 40%, 50% 45%)", hover: { x: -2, y: -2 } },
  // 左中
  { clip: "polygon(0 45%, 15% 65%, 30% 55%)", hover: { x: -7, y: -2 } },
];

export default function AvatarWithJelly() {
  const fragsRef = useRef<HTMLDivElement[]>([]);
  /* ─── 椭圆轨道（前面+后面分层） ─── */
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const back = backRef.current;
    const front = frontRef.current;
    if (!back || !front) return;

    const all: Array<{ el: HTMLDivElement; rx: number; ry: number; speed: number; offset: number }> = [];
    ORBITS.forEach((cfg) => {
      for (let i = 0; i < cfg.count; i++) {
        const dot = document.createElement("div");
        dot.className = "absolute rounded-full pointer-events-none";
        dot.style.cssText = `width:3px; height:3px; background:${cfg.color}; box-shadow:0 0 5px 1px ${cfg.color}; left:50%; top:50%;`;
        back.appendChild(dot);
        all.push({ el: dot, rx: cfg.rx, ry: cfg.ry, speed: cfg.speed, offset: (i / cfg.count) * Math.PI * 2 });
      }
    });

    const driver = { angle: 0 };
    const anim = animate(driver, {
      angle: Math.PI * 2, duration: 10000, ease: "linear", loop: true,
      onUpdate: () => {
        all.forEach((d) => {
          const a = driver.angle * d.speed + d.offset;
          d.el.style.translate = `${Math.cos(a) * d.rx}px ${Math.sin(a) * d.ry}px`;
          // 右边=前面(在头像上方), 左边=后面(在头像下方)
          const isFront = Math.cos(a) > 0.02;
          if (isFront && d.el.parentElement === back) front.appendChild(d.el);
          else if (!isFront && d.el.parentElement === front) back.appendChild(d.el);
        });
      },
    });
    return () => { anim.pause(); all.forEach(d => d.el.remove()); };
  }, []);

  /* ─── 碎片动画 ─── */
  const animateFrags = useCallback((spread: boolean) => {
    fragsRef.current.forEach((el, i) => {
      const f = FRAGMENTS[i];
      animate(el, {
        translateX: spread ? f.hover.x : 0,
        translateY: spread ? f.hover.y : 0,
        duration: 400,
        ease: "out(2)",
      });
    });
  }, []);

  const handleClick = useCallback(() => {
    // 点击：碎片弹开再合拢
    fragsRef.current.forEach((el, i) => {
      const f = FRAGMENTS[i];
      animate(el, {
        translateX: [0, f.hover.x * 1.8, 0],
        translateY: [0, f.hover.y * 1.8, 0],
        duration: 600,
        ease: "out(3)",
      });
    });
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 200, height: 200 }}>
      {/* 轨道后半（头像后面） */}
      <div ref={backRef} className="absolute inset-0 z-0" />
      {/* 轨道前半（头像前面） */}
      <div ref={frontRef} className="absolute inset-0" style={{ zIndex: 3 }} />

      {/* 碎片头像容器 */}
      <div
        className="relative cursor-pointer select-none"
        style={{ width: 120, height: 120, zIndex: 1 }}
        onMouseEnter={() => animateFrags(true)}
        onMouseLeave={() => animateFrags(false)}
        onClick={handleClick}
        role="img" aria-label="头像"
      >
        {/* 3D 球体阴影底层 */}
        <div className="absolute inset-0 rounded-full pointer-events-none z-10"
          style={{ boxShadow: `0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)`, transition: "box-shadow 0.5s" }}
        />

        {/* 碎片 */}
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
              zIndex: 5,
              transition: "transform 0.05s",
            }}
          />
        ))}

        {/* 裂纹线（碎片之间） */}
        <svg className="absolute inset-0 w-full h-full pointer-events-none z-8" viewBox="0 0 120 120">
          <line x1="55" y1="0" x2="45" y2="35" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
          <line x1="45" y1="35" x2="30" y2="55" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" />
          <line x1="30" y1="55" x2="0" y2="45" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
          <line x1="45" y1="35" x2="55" y2="30" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
          <line x1="55" y1="30" x2="70" y2="45" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" />
          <line x1="70" y1="45" x2="90" y2="30" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
          <line x1="70" y1="45" x2="55" y2="70" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" />
          <line x1="55" y1="70" x2="65" y2="100" stroke="rgba(0,0,0,0.3)" strokeWidth="1.5" />
          <line x1="30" y1="55" x2="20" y2="80" stroke="rgba(0,0,0,0.2)" strokeWidth="1" />
          <line x1="20" y1="80" x2="0" y2="100" stroke="rgba(0,0,0,0.25)" strokeWidth="1.2" />
          <line x1="45" y1="35" x2="50" y2="45" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
          <line x1="50" y1="45" x2="60" y2="40" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
          {/* 裂纹发光边 */}
          <line x1="55" y1="0" x2="45" y2="35" stroke="rgba(255,255,255,0.05)" strokeWidth="1.7" />
          <line x1="45" y1="35" x2="30" y2="55" stroke="rgba(255,255,255,0.04)" strokeWidth="1.4" />
        </svg>

        {/* 玻璃反光 */}
        <div className="absolute inset-0 rounded-full pointer-events-none z-10"
          style={{ background: "radial-gradient(ellipse at 35% 25%, rgba(255,255,255,0.2) 0%, transparent 45%)" }} />
      </div>
    </div>
  );
}
