import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { animate } from "animejs";

const SIZE = 126;
const MAX_DAMAGE = 6;
const FRAG_COUNT = 18;

const RINGS = [
  { rx: 90, ry: 36, speed: 0.35, color: "oklch(0.72 0.2 85 / 0.7)", count: 12, size: 2.5, ring: "oklch(0.72 0.2 85 / 0.12)" },
  { rx: 80, ry: 30, speed: -0.3, color: "oklch(0.63 0.15 20 / 0.55)", count: 8, size: 2, ring: "oklch(0.63 0.15 20 / 0.08)" },
  { rx: 96, ry: 28, speed: 0.5, color: "rgba(255,255,255,0.4)", count: 6, size: 2, ring: "rgba(255,255,255,0.06)" },
  { rx: 84, ry: 40, speed: -0.45, color: "oklch(0.68 0.18 50 / 0.5)", count: 8, size: 2.5, ring: "oklch(0.68 0.18 50 / 0.1)" },
];

/* ─── 不规则碎片生成 ─── */
interface Fragment {
  clipPath: string;
  /** 中心点 (用于飞散方向) */
  cx: number;
  cy: number;
  dist: number;
  angle: number;
}

function makeFragments(): Fragment[] {
  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2;
  const angles: number[] = [];
  for (let i = 0; i < FRAG_COUNT; i++) {
    angles.push((i / FRAG_COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.3);
  }
  angles.sort((a, b) => a - b);

  const frags: Fragment[] = [];
  for (let i = 0; i < FRAG_COUNT; i++) {
    const a0 = angles[i];
    const a1 = angles[(i + 1) % FRAG_COUNT];
    const mid = (a0 + a1) / 2;

    const cj = r * 0.15;
    const cxx = cx + (Math.random() - 0.5) * cj;
    const cyy = cy + (Math.random() - 0.5) * cj;

    const pts: string[] = [`${cxx} ${cyy}`];
    const segs = 2 + Math.floor(Math.random() * 2);
    for (let s = 0; s <= segs; s++) {
      const t = s / segs;
      const a = a0 + (a1 - a0) * t;
      const jr = r * (0.92 + (Math.random() - 0.5) * 0.08);
      pts.push(`${cx + Math.cos(a) * jr} ${cy + Math.sin(a) * jr}`);
    }

    frags.push({
      clipPath: `polygon(${pts.join(", ")})`,
      cx: cxx, cy: cyy,
      dist: Math.hypot(cxx - cx, cyy - cy),
      angle: mid,
    });
  }
  return frags;
}

/* ─── 岩浆裂纹生成 ─── */
function generateLavaCracks(dmg: number): string[] {
  const paths: string[] = [];
  const cx = SIZE / 2, cy = SIZE / 2;
  const mainCount = 2 + dmg;

  for (let i = 0; i < mainCount; i++) {
    const baseA = (i / mainCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
    const len = SIZE * 0.3 * (0.6 + Math.random() * 0.4);
    let pts = `M ${cx} ${cy}`;
    let px = cx, py = cy;
    const steps = 4 + Math.floor(dmg / 2);

    for (let s = 1; s <= steps; s++) {
      const a = baseA + (Math.random() - 0.5) * 0.8;
      const seg = len / steps;
      px += Math.cos(a) * seg + (Math.random() - 0.5) * 4;
      py += Math.sin(a) * seg + (Math.random() - 0.5) * 4;
      const d = Math.hypot(px - cx, py - cy);
      if (d > SIZE * 0.44) {
        const sc = (SIZE * 0.44) / d;
        px = cx + (px - cx) * sc;
        py = cy + (py - cy) * sc;
      }
      pts += ` L ${px} ${py}`;
    }
    paths.push(pts);

    // 分支
    const branches = Math.floor(Math.random() * 2) + (dmg >= 4 ? 1 : 0);
    for (let b = 0; b < branches; b++) {
      const splitIdx = 1 + Math.floor(Math.random() * (steps - 1));
      const parts = pts.split(" L ");
      if (splitIdx >= parts.length) continue;
      const sp = parts[splitIdx];
      const [sx, sy] = sp.split(" ").slice(1).map(Number);
      if (isNaN(sx) || isNaN(sy)) continue;

      const bAngle = baseA + (Math.random() - 0.5) * 2;
      const bLen = len * (0.25 + Math.random() * 0.25);
      let bpts = `M ${sx} ${sy}`;
      let bpx = sx, bpy = sy;
      for (let bs = 1; bs <= 3; bs++) {
        const ba = bAngle + (Math.random() - 0.5) * 1;
        const bl = bLen / 3;
        bpx += Math.cos(ba) * bl + (Math.random() - 0.5) * 3;
        bpy += Math.sin(ba) * bl + (Math.random() - 0.5) * 3;
        bpts += ` L ${bpx} ${bpy}`;
      }
      paths.push(bpts);
    }
  }
  return paths;
}

type Phase = "idle" | "exploding" | "rebuilding";

/* ─── 火星粒子 ─── */
function spawnEmbers(container: HTMLElement, count: number, big = false) {
  const cx = 63, cy = 63;
  for (let i = 0; i < count; i++) {
    const e = document.createElement("div");
    const s = big ? 4 + Math.random() * 6 : 2 + Math.random() * 4;
    const a = Math.random() * Math.PI * 2;
    const d = big ? 30 + Math.random() * 60 : 5 + Math.random() * 25;
    const hue = 20 + Math.random() * 30;
    e.style.cssText = `
      position:absolute; left:${cx}px; top:${cy}px; border-radius:50%;
      width:${s}px; height:${s}px; pointer-events:none;
      background:oklch(${0.55 + Math.random() * 0.25} ${0.25} ${hue});
      box-shadow:0 0 ${s * 4}px ${s * 1.5}px oklch(0.7 0.25 ${hue} / 0.5);
    `;
    container.appendChild(e);
    animate(e, {
      translateX: Math.cos(a) * d,
      translateY: Math.sin(a) * d - 10 - Math.random() * 15,
      opacity: [1, 0],
      scale: [1, 0.2],
      duration: 500 + Math.random() * 500,
      ease: "out(2)",
      onComplete: () => e.remove(),
    });
  }
}

/* ─── 冲击波 ─── */
function spawnShockwave(container: HTMLElement) {
  const ring = document.createElement("div");
  ring.style.cssText = `
    position:absolute; left:50%; top:50%; border-radius:50%;
    width:0; height:0; pointer-events:none;
    border:2px solid oklch(0.8 0.3 40 / 0.8);
    transform:translate(-50%,-50%);
  `;
  container.appendChild(ring);
  animate(ring, {
    width: [0, 220],
    height: [0, 220],
    opacity: [0.8, 0],
    borderWidth: [3, 0.5],
    duration: 600,
    ease: "out(3)",
    onComplete: () => ring.remove(),
  });
}

export default function AvatarWithJelly() {
  const [damage, setDamage] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const shockRef = useRef<HTMLDivElement>(null);
  const fragsRef = useRef<(HTMLDivElement | null)[]>([]);
  const fragments = useMemo(makeFragments, []);

  /* ─── 爆炸 ─── */
  const triggerExplosion = useCallback(() => {
    setPhase("exploding");
    const container = avatarRef.current;
    if (!container) return;

    // 大白闪
    if (flashRef.current) {
      animate(flashRef.current, { opacity: [0, 1, 0.8, 0], duration: 500, ease: "out(3)" });
    }

    // 冲击波
    if (shockRef.current) spawnShockwave(shockRef.current);

    // 震动
    animate(container, {
      translateX: [0, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, 0],
      translateY: [0, (Math.random() - 0.5) * 16, (Math.random() - 0.5) * 10, 0],
      scale: [1, 1.08, 0.96, 1],
      duration: 600, ease: "out(2)",
    });

    // 大量火星
    for (let i = 0; i < 5; i++) {
      setTimeout(() => spawnEmbers(container, 10, true), i * 40);
    }

    // 碎片向外飞散
    fragsRef.current.forEach((el, i) => {
      if (!el) return;
      const f = fragments[i];
      if (!f) return;
      const flyDist = 90 + Math.random() * 150 + f.dist * 0.6;
      const flyAngle = f.angle + (Math.random() - 0.5) * 0.4;
      const rotZ = (Math.random() - 0.5) * 720;
      const rotX = (Math.random() - 0.5) * 60;
      const rotY = (Math.random() - 0.5) * 60;
      el.style.display = "block";
      animate(el, {
        translateX: Math.cos(flyAngle) * flyDist,
        translateY: Math.sin(flyAngle) * flyDist,
        rotate: rotZ,
        rotateX: rotX,
        rotateY: rotY,
        opacity: [1, 0.5],
        duration: 500 + Math.random() * 400,
        ease: "out(3)",
        delay: Math.random() * 60,
      });
    });

    // 复原：碎片飞回来
    setTimeout(() => {
      setPhase("rebuilding");
      fragsRef.current.forEach((el) => {
        if (!el) return;
        animate(el, {
          translateX: 0, translateY: 0,
          rotate: 0, rotateX: 0, rotateY: 0,
          opacity: 1,
          duration: 400 + Math.random() * 300,
          ease: "out(4)",
          delay: Math.random() * 80,
          onComplete: () => { el.style.display = ""; },
        });
      });
      setTimeout(() => {
        setDamage(0);
        setPhase("idle");
      }, 700);
    }, 1200);
  }, [fragments]);

  /* ─── 点击 ─── */
  const handleClick = useCallback(() => {
    if (phase !== "idle") return;
    const container = avatarRef.current;
    if (!container) return;

    const next = damage + 1;
    setDamage(next);

    // 闪光
    if (flashRef.current) {
      animate(flashRef.current, { opacity: [0.5, 0], duration: 200, ease: "out(3)" });
    }

    // 震动 (越来越强)
    const intensity = 3 + next * 1.5;
    animate(container, {
      translateX: [0, (Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity * 0.6, 0],
      translateY: [0, (Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity * 0.6, 0],
      duration: 250 + next * 20, ease: "out(3)",
    });

    // 火星 (越来越多)
    spawnEmbers(container, 1 + next * 2);

    if (next >= MAX_DAMAGE) {
      triggerExplosion();
    }
  }, [damage, phase, triggerExplosion]);

  /* ─── 光环轨道 ─── */
  useEffect(() => {
    const back = backRef.current, front = frontRef.current;
    if (!back || !front) return;

    const ringEls: HTMLDivElement[] = [];
    RINGS.forEach((cfg) => {
      const r = document.createElement("div");
      r.style.cssText = `position:absolute; border-radius:50%; pointer-events:none; width:${cfg.rx * 2}px; height:${cfg.ry * 2}px; left:50%; top:50%; margin-left:-${cfg.rx}px; margin-top:-${cfg.ry}px; border:1px solid ${cfg.ring};`;
      back.appendChild(r); ringEls.push(r);
    });

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

  /* ─── 光晕/裂纹 ─── */
  const glowIntensity = damage / MAX_DAMAGE;
  const crackPaths = useMemo(() => damage > 0 ? generateLavaCracks(damage) : [], [damage]);
  const boxShadow = phase === "idle"
    ? (damage === 0
      ? "0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)"
      : `0 0 ${25 + glowIntensity * 40}px ${4 + glowIntensity * 12}px oklch(0.7 ${0.2 + glowIntensity * 0.25} ${85 - glowIntensity * 50} / ${0.2 + glowIntensity * 0.5}), 0 0 ${60 + glowIntensity * 60}px ${10 + glowIntensity * 20}px oklch(0.7 ${0.2 + glowIntensity * 0.15} ${85 - glowIntensity * 40} / ${0.08 + glowIntensity * 0.3})`)
    : "0 0 40px 12px oklch(0.85 0.35 35 / 0.7), 0 0 100px 30px oklch(0.85 0.35 35 / 0.35)";

  /* ─── Hover 高光 ─── */
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
      }
    };

    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 220, height: 220 }}>
      <div ref={backRef} className="absolute inset-0 z-0" />

      {/* 冲击波容器 */}
      <div ref={shockRef} className="absolute inset-0 z-10 pointer-events-none" />

      <div
        ref={avatarRef}
        onClick={handleClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-visible"
        style={{
          width: SIZE, height: SIZE, zIndex: 1, boxShadow,
          animation: phase === "idle" && damage === 0 ? "breathe-amber 3s ease-in-out infinite" : "none",
        }}
        role="img" aria-label="avatar"
      >
        {/* 行星本体 */}
        <div className={`absolute inset-0 rounded-full overflow-hidden ${phase === "exploding" || phase === "rebuilding" ? "opacity-0" : "opacity-100"} transition-opacity duration-150`}
          style={{ clipPath: "circle(50%)" }}>
          <img src={import.meta.env.BASE_URL + "avatar.png"} alt=""
            className="h-full w-full object-cover pointer-events-none" draggable={false} />
        </div>

        {/* 岩浆裂纹 SVG */}
        {damage > 0 && phase === "idle" && (
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full pointer-events-none z-10"
            style={{ clipPath: "circle(50%)" }}>
            {crackPaths.map((d, i) => (
              <g key={i}>
                {/* 外发光 */}
                <path d={d} fill="none"
                  stroke={`oklch(0.7 ${0.2 + glowIntensity * 0.15} ${45 - glowIntensity * 20} / ${0.3 + glowIntensity * 0.4})`}
                  strokeWidth={2.5 + glowIntensity * 3}
                  strokeLinecap="round" strokeLinejoin="round"
                  style={{ filter: "blur(2px)" }} />
                {/* 内亮线 */}
                <path d={d} fill="none"
                  stroke={`oklch(0.85 ${0.15} ${50 - glowIntensity * 15} / ${0.5 + glowIntensity * 0.4})`}
                  strokeWidth={1 + glowIntensity * 1.5}
                  strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ))}
          </svg>
        )}

        {/* 爆炸碎片 */}
        {(phase === "exploding" || phase === "rebuilding") && (
          <div className="absolute inset-0" style={{ perspective: "300px" }}>
            {fragments.map((f, i) => (
              <div key={i}
                ref={(el) => { fragsRef.current[i] = el; }}
                className="absolute"
                style={{
                  inset: 0, width: "100%", height: "100%",
                  clipPath: f.clipPath,
                  backgroundImage: `url(${import.meta.env.BASE_URL}avatar.png)`,
                  backgroundSize: "cover", backgroundPosition: "center",
                }} />
            ))}
          </div>
        )}

        {/* 伤害光晕 */}
        {damage > 0 && phase === "idle" && (
          <div className="absolute inset-0 rounded-full pointer-events-none z-5"
            style={{
              background: `radial-gradient(circle at 50% 50%, oklch(${0.7 + glowIntensity * 0.2} ${0.25} ${55 - glowIntensity * 25} / ${0.1 + glowIntensity * 0.3}) 0%, transparent ${55 - glowIntensity * 15}%)`,
              mixBlendMode: "screen",
            }} />
        )}

        {/* 闪光层 */}
        <div ref={flashRef} className="absolute inset-0 rounded-full pointer-events-none z-20"
          style={{ background: "white", opacity: 0 }} />

        {/* 高光 */}
        <div ref={shineRef} className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 42% 32%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 30%, transparent 60%)", opacity: 0.7 }} />
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 88%, rgba(255,255,255,0.15) 0%, transparent 30%)" }} />
      </div>

      <div ref={frontRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }} />
    </div>
  );
}
