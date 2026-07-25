import { useRef, useEffect, useCallback, useState } from "react";
import { animate } from "animejs";

/* ─── 轨道环配置 ─── */
const RINGS = [
  { rx: 90, ry: 36, speed: 0.35, color: "oklch(0.72 0.2 85 / 0.7)", count: 12, size: 2.5, ring: "oklch(0.72 0.2 85 / 0.12)" },
  { rx: 80, ry: 30, speed: -0.3, color: "oklch(0.63 0.15 20 / 0.55)", count: 8, size: 2, ring: "oklch(0.63 0.15 20 / 0.08)" },
  { rx: 96, ry: 28, speed: 0.5, color: "rgba(255,255,255,0.4)", count: 6, size: 2, ring: "rgba(255,255,255,0.06)" },
  { rx: 84, ry: 40, speed: -0.45, color: "oklch(0.68 0.18 50 / 0.5)", count: 8, size: 2.5, ring: "oklch(0.68 0.18 50 / 0.1)" },
];

/* ─── 玻璃裂纹生成 ─── */
interface CrackLine {
  d: string;
  width: number;
}

/**
 * 从撞击点生成放射状玻璃裂纹
 * 返回 SVG path 数组，每条裂纹宽度递减
 */
function generateCracks(cx: number, cy: number, r: number, mainCount: number): CrackLine[] {
  const lines: CrackLine[] = [];
  const steps = 6;

  for (let i = 0; i < mainCount; i++) {
    const baseAngle = (i / mainCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    const mainLen = r * (0.5 + Math.random() * 0.5);

    let pts = `M ${cx} ${cy}`;
    let px = cx, py = cy;
    for (let s = 1; s <= steps; s++) {
      const t = s / steps;
      const angle = baseAngle + (Math.random() - 0.5) * 0.6;
      const segLen = mainLen / steps;
      const jitter = r * 0.04 * (1 - t * 0.5);
      px += Math.cos(angle) * segLen + (Math.random() - 0.5) * jitter;
      py += Math.sin(angle) * segLen + (Math.random() - 0.5) * jitter;
      const dist = Math.hypot(px - cx, py - cy);
      if (dist > r * 0.92) {
        const scale = (r * 0.92) / dist;
        px = cx + (px - cx) * scale;
        py = cy + (py - cy) * scale;
      }
      pts += ` L ${px} ${py}`;
    }

    const mainWidth = 1.8 + Math.random() * 1.2;
    lines.push({ d: pts, width: mainWidth });

    const branchCount = Math.floor(Math.random() * 3);
    for (let b = 0; b < branchCount; b++) {
      const splitT = 0.3 + Math.random() * 0.5;
      const si = Math.floor(splitT * steps);
      const sp = pts.split(" L ")[si] || pts.split(" L ")[0];
      const [sxStr, syStr] = sp.split(" ").slice(1);
      const spx = parseFloat(sxStr), spy = parseFloat(syStr);

      const branchAngle = baseAngle + (Math.random() - 0.5) * 1.8;
      const branchLen = mainLen * (0.2 + Math.random() * 0.35);

      let bpts = `M ${spx} ${spy}`;
      let bpx = spx, bpy = spy;
      const bSteps = 3 + Math.floor(Math.random() * 2);
      for (let bs = 1; bs <= bSteps; bs++) {
        const ba = branchAngle + (Math.random() - 0.5) * 0.8;
        const bl = branchLen / bSteps;
        bpx += Math.cos(ba) * bl + (Math.random() - 0.5) * r * 0.03;
        bpy += Math.sin(ba) * bl + (Math.random() - 0.5) * r * 0.03;
        const bd = Math.hypot(bpx - cx, bpy - cy);
        if (bd > r * 0.92) {
          const s2 = (r * 0.92) / bd;
          bpx = cx + (bpx - cx) * s2;
          bpy = cy + (bpy - cy) * s2;
        }
        bpts += ` L ${bpx} ${bpy}`;
      }
      lines.push({ d: bpts, width: mainWidth * 0.4 + Math.random() * 0.3 });
    }
  }

  return lines;
}

function scaleCracks(cracks: CrackLine[], oldR: number, newR: number): CrackLine[] {
  const s = newR / oldR;
  return cracks.map(c => ({
    d: c.d.replace(/[\d.]+/g, (m) => (parseFloat(m) * s).toFixed(1)),
    width: c.width * s,
  }));
}

export default function AvatarWithJelly() {
  const [cracks, setCracks] = useState<CrackLine[]>([]);
  const [crackKey, setCrackKey] = useState(0);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const initCracks = generateCracks(60, 60, 60, 5);
    setCracks(scaleCracks(initCracks, 60, 110));
  }, []);

  const handleClick = useCallback((e: React.MouseEvent) => {
    const el = avatarRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = ((e.clientX - rect.left) / rect.width) * 110;
    const cy = ((e.clientY - rect.top) / rect.height) * 110;
    const dist = Math.hypot(cx - 55, cy - 55);
    if (dist > 52) return;

    const newCracks = generateCracks(cx, cy, Math.min(55, dist + 30), 4 + Math.floor(Math.random() * 2));
    setCracks(prev => [...prev, ...scaleCracks(newCracks, 60, 110)]);
    setCrackKey(k => k + 1);

    animate(el, { scale: [1, 0.96, 1.02, 1], duration: 400, ease: "out(3)" });
  }, []);

  const [hovered, setHovered] = useState(false);

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

  /* ─── Hover 高光追踪 ─── */
  useEffect(() => {
    const el = avatarRef.current;
    const shine = shineRef.current;
    if (!el || !shine) return;

    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      if (dist < 200) {
        const t = 1 - dist / 200;
        const sx = 50 + (dx / (dist || 1)) * 20 * t;
        const sy = 50 + (dy / (dist || 1)) * 16 * t;
        shine.style.background = `radial-gradient(ellipse at ${sx}% ${sy}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.03) 55%, transparent 72%)`;
        shine.style.opacity = "1";
        el.style.boxShadow = `0 0 ${25 + 15 * t}px ${4 + 6 * t}px oklch(0.7 0.2 85 / ${0.2 + t * 0.25}), 0 0 ${55 + 35 * t}px ${10 + 15 * t}px oklch(0.7 0.2 85 / ${0.08 + t * 0.1})`;
      }
    };

    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  const viewBox = `0 0 110 110`;

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 220, height: 220 }}>
      {/* 光环后层 */}
      <div ref={backRef} className="absolute inset-0 z-0" />

      {/* 水滴头像 + 呼吸光晕 */}
      <div
        ref={avatarRef}
        onClick={handleClick}
        onMouseEnter={() => setHovered(true)}
        onMouseLeave={() => setHovered(false)}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none"
        style={{
          width: 126, height: 126, zIndex: 1,
          boxShadow: "0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)",
          animation: "breathe-amber 3s ease-in-out infinite",
          clipPath: "circle(50%)",
        }}
        role="img" aria-label="avatar with cracks"
      >
        <img src={import.meta.env.BASE_URL + "avatar.png"} alt=""
          className="absolute inset-0 h-full w-full object-cover pointer-events-none"
          draggable={false} />

        <svg viewBox={viewBox} className="absolute inset-0 h-full w-full pointer-events-none"
          style={{ filter: hovered ? "drop-shadow(0 0 3px oklch(0.7 0.2 85 / 0.5))" : "none" }}
          key={crackKey}>
          {cracks.map((c, i) => (
            <path key={i} d={c.d} fill="none"
              stroke="oklch(0.15 0.02 80 / 0.85)" strokeWidth={c.width}
              strokeLinecap="round" strokeLinejoin="round" />
          ))}
          {cracks.map((c, i) => (
            <path key={`g-${i}`} d={c.d} fill="none"
              stroke="oklch(0.72 0.2 85 / 0.25)" strokeWidth={c.width * 0.45}
              strokeLinecap="round" strokeLinejoin="round" />
          ))}
        </svg>

        {/* 高光点（hover 追踪鼠标） */}
        <div ref={shineRef} className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 42% 32%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 30%, transparent 60%)", opacity: 0.7 }} />
        {/* 底部反光（水珠坐在桌面） */}
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 88%, rgba(255,255,255,0.15) 0%, transparent 30%)" }} />
      </div>

      {/* 光环前层 */}
      <div ref={frontRef} className="absolute inset-0" style={{ zIndex: 3 }} />
    </div>
  );
}
