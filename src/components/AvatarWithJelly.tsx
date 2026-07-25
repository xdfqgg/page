import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { animate } from "animejs";

const SIZE = 126;
const MAX_DAMAGE = 6;

const RINGS = [
  { rx: 90, ry: 36, speed: 0.35, color: "oklch(0.72 0.2 85 / 0.7)", count: 12, size: 2.5, ring: "oklch(0.72 0.2 85 / 0.12)" },
  { rx: 80, ry: 30, speed: -0.3, color: "oklch(0.63 0.15 20 / 0.55)", count: 8, size: 2, ring: "oklch(0.63 0.15 20 / 0.08)" },
  { rx: 96, ry: 28, speed: 0.5, color: "rgba(255,255,255,0.4)", count: 6, size: 2, ring: "rgba(255,255,255,0.06)" },
  { rx: 84, ry: 40, speed: -0.45, color: "oklch(0.68 0.18 50 / 0.5)", count: 8, size: 2.5, ring: "oklch(0.68 0.18 50 / 0.1)" },
];

interface Shard {
  left: number; top: number; w: number; h: number;
  clipPath: string; bgX: number; bgY: number;
  cx: number; cy: number; dist: number; angle: number;
}

function makeShards(): Shard[] {
  const GRID = 8;
  const cell = SIZE / GRID;
  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2;
  const shards: Shard[] = [];
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const x = col * cell, y = row * cell;
      const cr = [[x, y], [x + cell, y], [x, y + cell], [x + cell, y + cell]];
      if (!cr.some(([px, py]) => Math.hypot(px - cx, py - cy) <= r)) continue;
      const j = cell * 0.22;
      const pts = [
        `${(Math.random() - 0.5) * j} ${(Math.random() - 0.5) * j}`,
        `${cell + (Math.random() - 0.5) * j} ${(Math.random() - 0.5) * j}`,
        `${cell + (Math.random() - 0.5) * j} ${cell + (Math.random() - 0.5) * j}`,
        `${(Math.random() - 0.5) * j} ${cell + (Math.random() - 0.5) * j}`,
      ];
      const cx2 = x + cell / 2 + (Math.random() - 0.5) * j;
      const cy2 = y + cell / 2 + (Math.random() - 0.5) * j;
      shards.push({
        left: x, top: y, w: cell + 2, h: cell + 2,
        clipPath: `polygon(${pts.join(", ")})`,
        bgX: -x, bgY: -y,
        cx: cx2, cy: cy2,
        dist: Math.hypot(cx2 - cx, cy2 - cy),
        angle: Math.atan2(cy2 - cy, cx2 - cx),
      });
    }
  }
  return shards;
}

function generateCracks(dmg: number): { d: string; w: number }[] {
  const cx = SIZE / 2, cy = SIZE / 2;
  const paths: { d: string; w: number }[] = [];
  const mainCount = 3 + dmg;
  for (let i = 0; i < mainCount; i++) {
    const baseA = (i / mainCount) * Math.PI * 2 + (Math.random() - 0.5) * 0.6;
    const len = SIZE * (0.25 + Math.random() * 0.3);
    let pts = `M ${cx} ${cy}`;
    let px = cx, py = cy;
    const steps = 5 + dmg;
    for (let s = 1; s <= steps; s++) {
      const a = baseA + (Math.random() - 0.5) * 1.0;
      const seg = len / steps;
      px += Math.cos(a) * seg + (Math.random() - 0.5) * 5;
      py += Math.sin(a) * seg + (Math.random() - 0.5) * 5;
      const d = Math.hypot(px - cx, py - cy);
      if (d > SIZE * 0.44) {
        const sc = (SIZE * 0.44) / d;
        px = cx + (px - cx) * sc; py = cy + (py - cy) * sc;
      }
      pts += ` L ${px} ${py}`;
    }
    paths.push({ d: pts, w: 2 + dmg * 0.4 });
    for (let b = 0; b < Math.floor(Math.random() * 2) + (dmg >= 3 ? 1 : 0); b++) {
      const parts = pts.split(" L ");
      const si = 1 + Math.floor(Math.random() * (steps - 2));
      if (si >= parts.length) continue;
      const sp = parts[si];
      const [sx, sy] = sp.split(" ").slice(1).map(Number);
      if (isNaN(sx)) continue;
      const ba = baseA + (Math.random() - 0.5) * 2.2;
      const bl = len * (0.2 + Math.random() * 0.2);
      let bpts = `M ${sx} ${sy}`;
      let bpx = sx, bpy = sy;
      for (let bs = 1; bs <= 3; bs++) {
        const ba2 = ba + (Math.random() - 0.5) * 1.2;
        bpx += Math.cos(ba2) * bl / 3 + (Math.random() - 0.5) * 4;
        bpy += Math.sin(ba2) * bl / 3 + (Math.random() - 0.5) * 4;
        bpts += ` L ${bpx} ${bpy}`;
      }
      paths.push({ d: bpts, w: 1 + dmg * 0.2 });
    }
  }
  return paths;
}

type Phase = "idle" | "exploding" | "rebuilding";

function spawnEmbers(container: HTMLElement, count: number, sizeMul = 1) {
  for (let i = 0; i < count; i++) {
    const e = document.createElement("div");
    const s = (2 + Math.random() * 4) * sizeMul;
    const a = Math.random() * Math.PI * 2;
    const d = (5 + Math.random() * 30) * sizeMul;
    const hue = 20 + Math.random() * 30;
    e.style.cssText = `position:absolute; left:63px; top:63px; border-radius:50%; width:${s}px; height:${s}px; pointer-events:none; background:oklch(${0.55 + Math.random() * 0.25} ${0.25} ${hue}); box-shadow:0 0 ${s * 4}px ${s * 1.5}px oklch(0.7 0.25 ${hue} / 0.5);`;
    container.appendChild(e);
    animate(e, {
      translateX: Math.cos(a) * d,
      translateY: Math.sin(a) * d - 10 - Math.random() * 15,
      opacity: [1, 0], scale: [1, 0.2],
      duration: 400 + Math.random() * 600,
      ease: "out(2)", onComplete: () => e.remove(),
    });
  }
}

/* ─── 全屏特效 ─── */
function fullScreenFlash() {
  const flash = document.createElement("div");
  flash.style.cssText = "position:fixed;inset:0;z-index:9999;background:white;pointer-events:none;";
  document.body.appendChild(flash);
  animate(flash, { opacity: [0, 1, 0.7, 0], duration: 600, ease: "out(3)", onComplete: () => flash.remove() });
}

function pageShake() {
  const html = document.documentElement;
  html.style.transition = "transform 0.6s ease-out";
  html.style.transform = `translate(${(Math.random() - 0.5) * 12}px, ${(Math.random() - 0.5) * 12}px)`;
  setTimeout(() => {
    html.style.transform = `translate(${(Math.random() - 0.5) * 8}px, ${(Math.random() - 0.5) * 8}px)`;
    setTimeout(() => {
      html.style.transform = "";
      html.style.transition = "";
    }, 200);
  }, 100);
}

function pageParticles(count: number, originX: number, originY: number) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const s = 3 + Math.random() * 8;
    const a = Math.random() * Math.PI * 2;
    const d = 100 + Math.random() * 400;
    const hue = 20 + Math.random() * 30;
    p.style.cssText = `
      position:fixed; left:${originX}px; top:${originY}px; border-radius:50%;
      width:${s}px; height:${s}px; pointer-events:none; z-index:9998;
      background:oklch(${0.6 + Math.random() * 0.3} ${0.25} ${hue});
      box-shadow:0 0 ${s * 5}px ${s * 2}px oklch(0.8 0.3 ${hue} / 0.4);
    `;
    document.body.appendChild(p);
    animate(p, {
      translateX: Math.cos(a) * d,
      translateY: Math.sin(a) * d - 20,
      opacity: [1, 0], scale: [1.5, 0],
      duration: 600 + Math.random() * 800,
      ease: "out(2)", onComplete: () => p.remove(),
    });
  }
}

function pageShockwave(originX: number, originY: number) {
  for (let i = 0; i < 3; i++) {
    const r = document.createElement("div");
    r.style.cssText = `
      position:fixed; left:${originX}px; top:${originY}px; border-radius:50%;
      width:0; height:0; pointer-events:none; z-index:9997;
      border:${3 - i}px solid oklch(${0.85 - i * 0.15} ${0.3} ${35 + i * 10} / ${0.7 - i * 0.2});
      transform:translate(-50%,-50%);
    `;
    document.body.appendChild(r);
    animate(r, {
      width: [0, 600 + i * 300],
      height: [0, 600 + i * 300],
      opacity: [0.8, 0],
      duration: 700 + i * 200,
      delay: i * 100,
      ease: "out(3)", onComplete: () => r.remove(),
    });
  }
}

/* ─── 局部冲击波 ─── */
function spawnShockwave(container: HTMLElement) {
  for (let i = 0; i < 2; i++) {
    const r = document.createElement("div");
    r.style.cssText = `
      position:absolute; left:50%; top:50%; border-radius:50%;
      width:0; height:0; pointer-events:none;
      border:${2 - i}px solid oklch(${0.85 - i * 0.15} ${0.3} ${35 + i * 10} / ${0.8 - i * 0.3});
      transform:translate(-50%,-50%);
    `;
    container.appendChild(r);
    animate(r, {
      width: [0, 180 + i * 60], height: [0, 180 + i * 60],
      opacity: [0.9, 0], duration: 500 + i * 200, delay: i * 80,
      ease: "out(3)", onComplete: () => r.remove(),
    });
  }
}

function spawnMagmaJet(container: HTMLElement, cx: number, cy: number) {
  for (let i = 0; i < 8; i++) {
    const angle = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    for (let layer = 0; layer < 4; layer++) {
      const e = document.createElement("div");
      const s = (3 + Math.random() * 6) * (1 - layer * 0.2);
      const d = (20 + Math.random() * 50) * (1 + layer * 0.5);
      const delay = layer * 30 + Math.random() * 50;
      const hue = 25 + Math.random() * 25;
      e.style.cssText = `position:absolute; left:${cx}px; top:${cy}px; border-radius:50%; width:${s}px; height:${s}px; pointer-events:none; background:oklch(${0.7 - layer * 0.1} ${0.3} ${hue}); box-shadow:0 0 ${s * 6}px ${s * 2}px oklch(0.8 0.3 ${hue} / 0.6);`;
      container.appendChild(e);
      animate(e, {
        translateX: Math.cos(angle) * d,
        translateY: Math.sin(angle) * d,
        opacity: [1, 0], scale: [1.5, 0.1],
        duration: 300 + Math.random() * 400, delay,
        ease: "out(2)", onComplete: () => e.remove(),
      });
    }
  }
}

function spawnSmoke(container: HTMLElement) {
  for (let i = 0; i < 6; i++) {
    const s = document.createElement("div");
    const a = Math.random() * Math.PI * 2;
    const d = 10 + Math.random() * 40;
    const sz = 20 + Math.random() * 40;
    s.style.cssText = `position:absolute; left:${63 - sz / 2}px; top:${63 - sz / 2}px; width:${sz}px; height:${sz}px; border-radius:50%; pointer-events:none; background:radial-gradient(circle, oklch(0.5 0.05 40 / 0.3), transparent); filter:blur(4px);`;
    container.appendChild(s);
    animate(s, {
      translateX: Math.cos(a) * d, translateY: Math.sin(a) * d,
      scale: [0.5, 2.5], opacity: [0.4, 0],
      duration: 800 + Math.random() * 600, ease: "out(3)", onComplete: () => s.remove(),
    });
  }
}

export default function AvatarWithJelly() {
  const [damage, setDamage] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);
  const shineRef = useRef<HTMLDivElement>(null);
  const flashRef = useRef<HTMLDivElement>(null);
  const fxRef = useRef<HTMLDivElement>(null);
  const fragsRef = useRef<(HTMLDivElement | null)[]>([]);
  const shards = useMemo(makeShards, []);

  const triggerExplosion = useCallback(() => {
    setPhase("exploding");
    const container = avatarRef.current;
    const fx = fxRef.current;
    if (!container) return;

    // 获取头像在页面的位置
    const rect = container.getBoundingClientRect();
    const pageCx = rect.left + rect.width / 2;
    const pageCy = rect.top + rect.height / 2;

    // ═══ 全屏特效 ═══
    fullScreenFlash();
    pageShake();
    pageShockwave(pageCx, pageCy);
    pageParticles(30, pageCx, pageCy);

    // ═══ 头像局部特效 ═══
    if (flashRef.current) {
      animate(flashRef.current, { opacity: [0, 1, 0.7, 0], duration: 500, ease: "out(3)" });
    }
    if (fx) spawnShockwave(fx);
    if (fx) spawnSmoke(fx);

    animate(container, {
      translateX: [0, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 12, 0],
      translateY: [0, (Math.random() - 0.5) * 18, (Math.random() - 0.5) * 12, 0],
      scale: [1, 1.1, 0.95, 1],
      duration: 700, ease: "out(2)",
    });

    // 碎片
    fragsRef.current.forEach((el, i) => {
      if (!el) return;
      const f = shards[i];
      if (!f) return;
      const flyDist = 40 + Math.random() * 180 + f.dist * 0.8;
      const flyAngle = f.angle + (Math.random() - 0.5) * 0.6;
      const rotZ = (Math.random() - 0.5) * 900;
      const rotX = (Math.random() - 0.5) * 120;
      const rotY = (Math.random() - 0.5) * 120;
      el.style.display = "block";
      animate(el, {
        translateX: Math.cos(flyAngle) * flyDist,
        translateY: Math.sin(flyAngle) * flyDist,
        rotate: rotZ, rotateX: rotX, rotateY: rotY,
        opacity: [1, 0.4],
        duration: 400 + Math.random() * 500,
        ease: "out(3)", delay: Math.random() * 100,
      });
    });

    // 岩浆
    for (let w = 0; w < 3; w++) {
      setTimeout(() => {
        if (fx) spawnMagmaJet(fx, 63 + (Math.random() - 0.5) * 20, 63 + (Math.random() - 0.5) * 20);
      }, 50 + w * 80);
    }
    for (let i = 0; i < 4; i++) {
      setTimeout(() => spawnEmbers(container, 12, 1.5), 150 + i * 60);
    }

    // 第二轮全屏粒子
    setTimeout(() => pageParticles(20, pageCx, pageCy), 300);

    // 重建
    setTimeout(() => {
      setPhase("rebuilding");
      fragsRef.current.forEach((el) => {
        if (!el) return;
        animate(el, {
          translateX: 0, translateY: 0,
          rotate: 0, rotateX: 0, rotateY: 0, opacity: 1,
          duration: 600 + Math.random() * 300,
          ease: "outBack(1.7)", delay: Math.random() * 150,
          onComplete: () => { el.style.display = ""; },
        });
      });
      setTimeout(() => {
        if (flashRef.current) {
          animate(flashRef.current, { opacity: [0, 0.3, 0], duration: 300, ease: "out(3)" });
        }
        if (fx) {
          spawnShockwave(fx);
          for (let i = 0; i < 3; i++) setTimeout(() => spawnEmbers(container, 4), i * 50);
        }
        setDamage(0);
        setPhase("idle");
      }, 900);
    }, 1300);
  }, [shards]);

  const handleClick = useCallback(() => {
    if (phase !== "idle") return;
    const container = avatarRef.current;
    if (!container) return;
    const next = damage + 1;
    setDamage(next);
    if (flashRef.current) {
      animate(flashRef.current, { opacity: [0.5, 0], duration: 200, ease: "out(3)" });
    }
    const intensity = 3 + next * 2;
    animate(container, {
      translateX: [0, (Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity * 0.6, 0],
      translateY: [0, (Math.random() - 0.5) * intensity, (Math.random() - 0.5) * intensity * 0.6, 0],
      duration: 250 + next * 20, ease: "out(3)",
    });
    spawnEmbers(container, 2 + next * 2);
    if (next >= MAX_DAMAGE) triggerExplosion();
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

  const glowIntensity = damage / MAX_DAMAGE;
  const crackData = useMemo(() => damage > 0 ? generateCracks(damage) : [], [damage]);
  const boxShadow = phase === "idle"
    ? (damage === 0
      ? "0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)"
      : `0 0 ${25 + glowIntensity * 45}px ${4 + glowIntensity * 14}px oklch(0.7 ${0.2 + glowIntensity * 0.3} ${85 - glowIntensity * 55} / ${0.2 + glowIntensity * 0.5}), 0 0 ${60 + glowIntensity * 70}px ${10 + glowIntensity * 25}px oklch(0.7 ${0.2 + glowIntensity * 0.2} ${85 - glowIntensity * 45} / ${0.08 + glowIntensity * 0.35})`)
    : "0 0 50px 15px oklch(0.85 0.35 35 / 0.8), 0 0 120px 35px oklch(0.85 0.35 35 / 0.4)";

  useEffect(() => {
    const el = avatarRef.current, shine = shineRef.current;
    if (!el || !shine) return;
    const handler = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const cx = rect.left + rect.width / 2, cy = rect.top + rect.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy, dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < 200) {
        const t = 1 - dist / 200;
        shine.style.background = `radial-gradient(ellipse at ${50 + (dx / (dist || 1)) * 20 * t}% ${50 + (dy / (dist || 1)) * 16 * t}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.03) 55%, transparent 72%)`;
        shine.style.opacity = "1";
      }
    };
    window.addEventListener("mousemove", handler);
    return () => window.removeEventListener("mousemove", handler);
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 220, height: 220 }}>
      <div ref={backRef} className="absolute inset-0 z-0" />
      <div ref={fxRef} className="absolute inset-0 z-10 pointer-events-none" />

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
        <div className={`absolute inset-0 rounded-full overflow-hidden transition-opacity duration-150 ${phase === "exploding" || phase === "rebuilding" ? "opacity-0" : "opacity-100"}`}
          style={{ clipPath: "circle(50%)" }}>
          <img src={import.meta.env.BASE_URL + "avatar.png"} alt=""
            className="h-full w-full object-cover pointer-events-none" draggable={false} />
        </div>

        {damage > 0 && phase === "idle" && (
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full pointer-events-none"
            style={{ clipPath: "circle(50%)", zIndex: 2 }}>
            {crackData.map((c, i) => (
              <g key={i}>
                <path d={c.d} fill="none" stroke={`oklch(0.7 ${0.2 + glowIntensity * 0.2} ${40 - glowIntensity * 20} / ${0.3 + glowIntensity * 0.5})`}
                  strokeWidth={c.w + 3} strokeLinecap="round" strokeLinejoin="round" style={{ filter: "blur(3px)" }} />
                <path d={c.d} fill="none" stroke={`oklch(0.9 ${0.15} ${50 - glowIntensity * 15} / ${0.5 + glowIntensity * 0.5})`}
                  strokeWidth={c.w} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ))}
          </svg>
        )}

        {(phase === "exploding" || phase === "rebuilding") && (
          <div className="absolute inset-0" style={{ perspective: "400px", zIndex: 2 }}>
            {shards.map((f, i) => (
              <div key={i}
                ref={(el) => { fragsRef.current[i] = el; }}
                className="absolute"
                style={{
                  left: f.left, top: f.top, width: f.w, height: f.h,
                  clipPath: f.clipPath,
                  backgroundImage: `url(${import.meta.env.BASE_URL}avatar.png)`,
                  backgroundSize: `${SIZE}px ${SIZE}px`,
                  backgroundPosition: `${f.bgX}px ${f.bgY}px`,
                }} />
            ))}
          </div>
        )}

        {damage > 0 && phase === "idle" && (
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, oklch(${0.7 + glowIntensity * 0.2} ${0.3} ${55 - glowIntensity * 30} / ${0.1 + glowIntensity * 0.35}) 0%, transparent ${55 - glowIntensity * 18}%)`,
              mixBlendMode: "screen", zIndex: 1,
            }} />
        )}

        <div ref={flashRef} className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "white", opacity: 0, zIndex: 20 }} />

        <div ref={shineRef} className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 42% 32%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 30%, transparent 60%)", opacity: 0.7 }} />
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 88%, rgba(255,255,255,0.15) 0%, transparent 30%)" }} />
      </div>

      <div ref={frontRef} className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }} />
    </div>
  );
}
