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

/* ─── 裂纹生成（限制复杂度） ─── */
function genCracks(d: number): { path: string; w: number; pool?: { x: number; y: number; r: number } }[] {
  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 4;
  const pts = 6 + d * 2; // 比之前少2条主裂纹
  const out: { path: string; w: number; pool?: { x: number; y: number; r: number } }[] = [];
  for (let i = 0; i < pts; i++) {
    const ea = (i / pts) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const ex = cx + Math.cos(ea) * r, ey = cy + Math.sin(ea) * r;
    const len = r * (0.3 + Math.random() * 0.5);
    let px = ex, py = ey, p = `M ${ex} ${ey}`;
    const steps = 2 + Math.floor(Math.random() * 3); // 减少步数
    for (let s = 1; s <= steps; s++) {
      const dir = ea + Math.PI + (Math.random() - 0.5) * 1.0;
      const seg = len / steps;
      px += Math.cos(dir) * seg + (Math.random() - 0.5) * 3;
      py += Math.sin(dir) * seg + (Math.random() - 0.5) * 3;
      const dd = Math.hypot(px - cx, py - cy);
      if (dd > r * 0.92) { const sc = (r * 0.92) / dd; px = cx + (px - cx) * sc; py = cy + (py - cy) * sc; }
      p += ` L ${px} ${py}`;
    }
    const lastP = [px, py];
    out.push({
      path: p, w: 1.5 + Math.random() + d * 0.2,
      pool: Math.random() < 0.5 ? { x: lastP[0], y: lastP[1], r: 2 + Math.random() * 2 + d * 0.2 } : undefined,
    });
    // 分支：只在50%的裂纹上生成1条
    if (Math.random() < 0.5) {
      const midParts = p.split(" L ");
      const si = 1 + Math.floor(Math.random() * (midParts.length - 1));
      const cr = midParts[si].split(" ").map(Number);
      if (!isNaN(cr[0])) {
        const ba = ea + Math.PI + (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.5);
        const bl = len * (0.12 + Math.random() * 0.15);
        let bpx = cr[0], bpy = cr[1];
        let bp = `M ${cr[0]} ${cr[1]}`;
        for (let bs = 0; bs < 2; bs++) {
          bpx += Math.cos(ba + (Math.random() - 0.5) * 0.4) * bl / 2;
          bpy += Math.sin(ba + (Math.random() - 0.5) * 0.4) * bl / 2;
          bp += ` L ${bpx} ${bpy}`;
        }
        out.push({ path: bp, w: 0.7 + d * 0.1 });
      }
    }
  }
  // 简化交叉连线：只在 dmg>=4 时，随机选几条做一次采样
  if (d >= 4 && out.length > 10) {
    const sample = Math.min(out.length, 8);
    for (let k = 0; k < sample; k++) {
      const i = Math.floor(Math.random() * out.length);
      const j = Math.floor(Math.random() * out.length);
      if (i === j) continue;
      const ei = out[i].path.split(" L ").pop()!.split(" ").map(Number);
      const ej = out[j].path.split(" L ").pop()!.split(" ").map(Number);
      if (!isNaN(ei[0]) && !isNaN(ej[0]) && Math.hypot(ei[0] - ej[0], ei[1] - ej[1]) < SIZE * 0.3) {
        out.push({ path: `M ${ei[0]} ${ei[1]} L ${ej[0]} ${ej[1]}`, w: 0.5 + d * 0.1 });
      }
    }
  }
  return out;
}

/* ─── 5x5 碎片网格（减少 DOM 节点数） ─── */
interface Frag { left: number; top: number; w: number; h: number; cp: string; bgX: number; bgY: number; }
function makeFrags(): Frag[] {
  const G = 5, cl = SIZE / G, cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2;
  const f: Frag[] = [];
  for (let R = 0; R < G; R++) {
    for (let C = 0; C < G; C++) {
      const x = C * cl, y = R * cl, xe = x + cl, ye = y + cl;
      if (![[x, y], [xe, y], [x, ye], [xe, ye]].some(([px, py]) => Math.hypot(px - cx, py - cy) <= r)) continue;
      const j = cl * 0.25;
      const pts = [
        `${(Math.random() - 0.5) * j} ${(Math.random() - 0.5) * j}`,
        `${cl + (Math.random() - 0.5) * j} ${(Math.random() - 0.5) * j}`,
        `${cl + (Math.random() - 0.5) * j} ${cl + (Math.random() - 0.5) * j}`,
        `${(Math.random() - 0.5) * j} ${cl + (Math.random() - 0.5) * j}`,
      ];
      f.push({ left: x, top: y, w: cl + 2, h: cl + 2, cp: `polygon(${pts.join(", ")})`, bgX: -x, bgY: -y });
    }
  }
  return f;
}

type Phase = "idle" | "exploding" | "rebuilding";

/* ─── 粒子效果（简化） ─── */
function spawnEmbers(c: HTMLElement, n: number) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const e = document.createElement("div");
    const s = 2 + Math.random() * 4, a = Math.random() * Math.PI * 2;
    const d = 8 + Math.random() * 25, hue = 20 + Math.random() * 30;
    e.style.cssText = `position:absolute;left:63px;top:63px;border-radius:50%;width:${s}px;height:${s}px;pointer-events:none;background:oklch(${0.55 + Math.random() * 0.25} 0.25 ${hue});`;
    frag.appendChild(e);
    animate(e, {
      translateX: Math.cos(a) * d,
      translateY: Math.sin(a) * d - 10 - Math.random() * 15,
      opacity: [1, 0], scale: [1, 0.2],
      duration: 400 + Math.random() * 500, ease: "out(2)",
      onComplete: () => e.remove(),
    });
  }
  c.appendChild(frag);
}

function shockwave(fx: HTMLElement) {
  for (let i = 0; i < 2; i++) {
    const r = document.createElement("div");
    r.style.cssText = `position:absolute;left:50%;top:50%;border-radius:50%;width:0;height:0;pointer-events:none;border:${2 - i}px solid oklch(${0.85 - i * 0.15} 0.3 ${35 + i * 10}/${0.8 - i * 0.3});transform:translate(-50%,-50%);`;
    fx.appendChild(r);
    animate(r, { width: [0, 140 + i * 40], height: [0, 140 + i * 40], opacity: [0.8, 0], duration: 500 + i * 150, delay: i * 60, ease: "out(3)", onComplete: () => r.remove() });
  }
}

function flashScreen() {
  const f = document.createElement("div");
  f.style.cssText = "position:fixed;inset:0;z-index:9999;background:white;pointer-events:none;";
  document.body.appendChild(f);
  animate(f, { opacity: [0, 1, 0.6, 0], duration: 600, ease: "out(2)", onComplete: () => f.remove() });
}

function pageShake() {
  const h = document.documentElement;
  h.style.transition = "transform 0.8s ease-out";
  h.style.transform = `translate(${(Math.random() - 0.5) * 12}px, ${(Math.random() - 0.5) * 12}px)`;
  setTimeout(() => {
    h.style.transform = `translate(${(Math.random() - 0.5) * 8}px, ${(Math.random() - 0.5) * 8}px)`;
    setTimeout(() => { h.style.transform = ""; h.style.transition = ""; }, 300);
  }, 200);
}

function pageShockwave(ox: number, oy: number) {
  for (let i = 0; i < 3; i++) {
    const r = document.createElement("div");
    r.style.cssText = `position:fixed;left:${ox}px;top:${oy}px;border-radius:50%;width:0;height:0;pointer-events:none;z-index:9997;border:${3 - i}px solid oklch(${0.85 - i * 0.15} 0.3 ${35 + i * 10}/${0.7 - i * 0.2});transform:translate(-50%,-50%);`;
    document.body.appendChild(r);
    animate(r, { width: [0, 600 + i * 300], height: [0, 600 + i * 300], opacity: [0.8, 0], duration: 1000 + i * 300, delay: i * 120, ease: "out(3)", onComplete: () => r.remove() });
  }
}

function pageParticles(n: number, ox: number, oy: number) {
  const frag = document.createDocumentFragment();
  for (let i = 0; i < n; i++) {
    const p = document.createElement("div");
    const s = 3 + Math.random() * 6, a = Math.random() * Math.PI * 2;
    const d = 80 + Math.random() * 300, hue = 20 + Math.random() * 30;
    p.style.cssText = `position:fixed;left:${ox}px;top:${oy}px;border-radius:50%;width:${s}px;height:${s}px;pointer-events:none;z-index:9998;background:oklch(${0.6 + Math.random() * 0.3} 0.25 ${hue});`;
    frag.appendChild(p);
    animate(p, { translateX: Math.cos(a) * d, translateY: Math.sin(a) * d - 15, opacity: [1, 0], scale: [1.5, 0], duration: 600 + Math.random() * 800, ease: "out(2)", onComplete: () => p.remove() });
  }
  document.body.appendChild(frag);
}

export default function AvatarWithJelly() {
  const [dmg, setDmg] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const [detached, setDet] = useState<Set<number>>(new Set());
  const br = useRef<HTMLDivElement>(null), fr = useRef<HTMLDivElement>(null), ar = useRef<HTMLDivElement>(null);
  const sr = useRef<HTMLDivElement>(null), flr = useRef<HTMLDivElement>(null), fxr = useRef<HTMLDivElement>(null);
  const fragr = useRef<(HTMLDivElement | null)[]>([]);
  const frags = useMemo(makeFrags, []);
  const crackData = useMemo(() => dmg > 0 ? genCracks(dmg) : [], [dmg]);

  // 用 ref 追踪 detached 避免 hc 依赖变化
  const detachedRef = useRef(detached);
  detachedRef.current = detached;

  const handleClick = useCallback(() => {
    if (phase !== "idle") return;
    const c = ar.current; if (!c) return;

    const n = dmg + 1;
    setDmg(n);

    // 闪光
    if (flr.current) animate(flr.current, { opacity: [0.5, 0], duration: 250, ease: "out(3)" });

    // 震动
    const shake = 3 + n * 2;
    animate(c, {
      translateX: [0, (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake * 0.5, 0],
      translateY: [0, (Math.random() - 0.5) * shake, (Math.random() - 0.5) * shake * 0.5, 0],
      duration: 250 + n * 20, ease: "out(3)",
    });

    // 火星
    spawnEmbers(c, 3 + n * 2);

    // 累积松脱碎片（用函数式更新避免依赖 detached）
    setDet(prev => {
      const nd = new Set(prev);
      const target = Math.min(frags.length, 2 + n * 3);
      while (nd.size < target) nd.add(Math.floor(Math.random() * frags.length));
      // 动画松脱的碎片
      nd.forEach(idx => {
        const el = fragr.current[idx]; if (!el) return;
        const a = Math.random() * Math.PI * 2;
        el.style.display = "block";
        animate(el, {
          translateX: Math.cos(a) * (2 + n),
          translateY: Math.sin(a) * (2 + n),
          rotate: (Math.random() - 0.5) * 15,
          opacity: [1, 0.6],
          duration: 400, ease: "out(2)",
        });
      });
      return nd;
    });

    if (n >= MAX_DAMAGE) setPhase("exploding");
  }, [dmg, phase, frags.length]); // 移除了 detached 依赖

  // 爆炸
  useEffect(() => {
    if (phase !== "exploding") return;
    const c = ar.current, fx = fxr.current; if (!c) return;

    const rect = c.getBoundingClientRect();
    const pcx = rect.left + rect.width / 2, pcy = rect.top + rect.height / 2;

    flashScreen(); pageShake(); pageShockwave(pcx, pcy); pageParticles(25, pcx, pcy);
    if (flr.current) animate(flr.current, { opacity: [0, 1, 0.7, 0], duration: 700, ease: "out(3)" });
    if (fx) shockwave(fx);

    // 所有碎片爆炸散开（用 rAF 分散到多帧）
    const els = fragr.current.filter(Boolean);
    const batchSize = 8;
    let offset = 0;
    function animateBatch() {
      const batch = els.slice(offset, offset + batchSize);
      batch.forEach(el => {
        if (!el) return;
        const a = Math.random() * Math.PI * 2;
        el.style.display = "block";
        animate(el, {
          translateX: Math.cos(a) * (30 + Math.random() * 150),
          translateY: Math.sin(a) * (30 + Math.random() * 150),
          rotate: (Math.random() - 0.5) * 600,
          opacity: [1, 0.25],
          duration: 500 + Math.random() * 500, ease: "out(3)",
        });
      });
      offset += batchSize;
      if (offset < els.length) requestAnimationFrame(animateBatch);
    }
    requestAnimationFrame(animateBatch);

    setTimeout(() => setPhase("rebuilding"), 2000);
  }, [phase]);

  // 重建
  useEffect(() => {
    if (phase !== "rebuilding") return;
    const c = ar.current, fx = fxr.current;

    // 分批复原
    const els = fragr.current.filter(Boolean);
    const batchSize = 10;
    let offset = 0;
    function rebuildBatch() {
      const batch = els.slice(offset, offset + batchSize);
      batch.forEach(el => {
        if (!el) return;
        animate(el, {
          translateX: 0, translateY: 0, rotate: 0,
          opacity: 1,
          duration: 600 + Math.random() * 300, ease: "outBack(1.4)",
          onComplete: () => { el.style.display = ""; },
        });
      });
      offset += batchSize;
      if (offset < els.length) requestAnimationFrame(rebuildBatch);
    }
    requestAnimationFrame(rebuildBatch);

    setTimeout(() => {
      if (flr.current) animate(flr.current, { opacity: [0, 0.3, 0], duration: 400, ease: "out(3)" });
      if (fx) shockwave(fx);
      if (c) spawnEmbers(c, 6);
      setDmg(0); setDet(new Set()); setPhase("idle");
    }, 1000);
  }, [phase]);

  // 光环轨道
  useEffect(() => {
    const bk = br.current, f = fr.current; if (!bk || !f) return;
    const rs: HTMLDivElement[] = [];
    RINGS.forEach(c => {
      const r = document.createElement("div");
      r.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;width:${c.rx * 2}px;height:${c.ry * 2}px;left:50%;top:50%;margin-left:-${c.rx}px;margin-top:-${c.ry}px;border:1px solid ${c.ring};`;
      bk.appendChild(r); rs.push(r);
    });
    const all: Array<{ el: HTMLDivElement; rx: number; ry: number; speed: number; offset: number; fading: boolean }> = [];
    RINGS.forEach(c => {
      for (let i = 0; i < c.count; i++) {
        const d = document.createElement("div"); const s = c.size;
        d.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;width:${s}px;height:${s}px;background:${c.color};box-shadow:0 0 ${s * 3}px ${s}px ${c.color};left:50%;top:50%;transition:opacity .25s;will-change:transform;`;
        bk.appendChild(d);
        all.push({ el: d, rx: c.rx, ry: c.ry, speed: c.speed, offset: (i / c.count) * Math.PI * 2, fading: false });
      }
    });
    const drv = { a: 0 };
    const anim = animate(drv, {
      a: Math.PI * 2, duration: 35000, ease: "linear", loop: true,
      onUpdate: () => all.forEach(d => {
        const a = drv.a * d.speed + d.offset, ca = Math.cos(a);
        d.el.style.translate = `${ca * d.rx}px ${Math.sin(a) * d.ry}px`;
        const tf = ca > 0.05;
        if (tf && d.el.parentElement === bk && !d.fading) {
          d.fading = true; d.el.style.opacity = "0";
          setTimeout(() => { f.appendChild(d.el); d.el.style.opacity = ""; d.fading = false; }, 250);
        } else if (!tf && d.el.parentElement === f && !d.fading) {
          d.fading = true; d.el.style.opacity = "0";
          setTimeout(() => { bk.appendChild(d.el); d.el.style.opacity = ""; d.fading = false; }, 250);
        }
      }),
    });
    return () => { anim.pause(); all.forEach(d => d.el.remove()); rs.forEach(r => r.remove()); };
  }, []);

  const gi = dmg / MAX_DAMAGE;
  const bs = phase === "idle"
    ? (dmg === 0
      ? "0 0 25px 4px oklch(0.7 0.2 85/0.2),0 0 60px 10px oklch(0.7 0.2 85/0.08)"
      : `0 0 ${25 + gi * 40}px ${4 + gi * 12}px oklch(0.7 ${0.2 + gi * 0.25} ${85 - gi * 50}/${0.2 + gi * 0.5}),0 0 ${60 + gi * 60}px ${10 + gi * 20}px oklch(0.7 ${0.2 + gi * 0.15} ${85 - gi * 40}/${0.08 + gi * 0.35})`)
    : "0 0 50px 15px oklch(0.85 0.35 35/0.8),0 0 120px 35px oklch(0.85 0.35 35/0.4)";

  // 高光追踪（加了 passive 和节流）
  useEffect(() => {
    const el = ar.current, sh = sr.current; if (!el || !sh) return;
    let ticking = false;
    const fn = (e: MouseEvent) => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy);
        if (d < 200) {
          const t = 1 - d / 200;
          sh.style.background = `radial-gradient(ellipse at ${50 + (dx / (d || 1)) * 20 * t}% ${50 + (dy / (d || 1)) * 16 * t}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.03) 55%, transparent 72%)`;
          sh.style.opacity = "1";
        }
        ticking = false;
      });
    };
    window.addEventListener("mousemove", fn, { passive: true });
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 220, height: 220 }}>
      <div ref={br} className="absolute inset-0 z-0" />
      <div ref={fxr} className="absolute inset-0 z-10 pointer-events-none" />
      <div ref={ar} onClick={handleClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-visible"
        style={{
          width: SIZE, height: SIZE, zIndex: 1, boxShadow: bs,
          animation: phase === "idle" && dmg === 0 ? "breathe-amber 3s ease-in-out infinite" : "none",
        }}
        role="img" aria-label="avatar">

        {/* 熔岩底层 */}
        {dmg > 0 && phase === "idle" && (
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{
            clipPath: "circle(50%)", zIndex: 2,
            background: `radial-gradient(circle at 50% 50%, oklch(${0.75 + gi * 0.15} ${0.25 + gi * 0.1} ${45 - gi * 20}/${0.2 + gi * 0.3}) 0%, transparent 70%)`,
          }}>
            {crackData.filter(c => c.pool).map((c, i) => (
              <div key={i} style={{
                position: "absolute",
                left: c.pool!.x - c.pool!.r * 2.5, top: c.pool!.y - c.pool!.r * 2.5,
                width: c.pool!.r * 5, height: c.pool!.r * 5, borderRadius: "50%",
                background: `oklch(0.9 0.25 ${50 - gi * 15}/${0.5 + gi * 0.3})`,
                filter: "blur(3px)", opacity: 0.5 + gi * 0.3,
              }} />
            ))}
          </div>
        )}

        {/* SVG Mask + 图片 */}
        <div className="absolute inset-0 rounded-full overflow-hidden pointer-events-none transition-opacity duration-300"
          style={{ clipPath: "circle(50%)", zIndex: 3, opacity: phase === "idle" ? Math.max(0.15, 1 - dmg * 0.18) : 0 }}>
          {dmg > 0 && phase === "idle" ? (
            <>
              <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 ${SIZE} ${SIZE}`} style={{ zIndex: 1 }}>
                <defs>
                  <mask id={`m-${dmg}`}>
                    <rect width={SIZE} height={SIZE} fill="white" />
                    {crackData.map((c, i) => (
                      <path key={i} d={c.path} fill="none" stroke="black" strokeWidth={c.w * 2} strokeLinecap="round" strokeLinejoin="round" />
                    ))}
                  </mask>
                </defs>
              </svg>
              <div className="absolute inset-0" style={{ mask: `url(#m-${dmg})`, WebkitMask: `url(#m-${dmg})` }}>
                <img src={import.meta.env.BASE_URL + "avatar.png"} alt="" className="h-full w-full object-cover pointer-events-none" draggable={false} />
              </div>
            </>
          ) : (
            <img src={import.meta.env.BASE_URL + "avatar.png"} alt="" className="h-full w-full object-cover pointer-events-none" draggable={false} />
          )}
        </div>

        {/* 碎片层 */}
        {(phase !== "idle" || dmg > 0) && (
          <div className="absolute inset-0" style={{ clipPath: phase === "idle" ? "circle(50%)" : undefined, zIndex: 2 }}>
            {frags.map((f, i) => (
              <div key={i} ref={(el) => { fragr.current[i] = el; }} className="absolute"
                style={{
                  left: f.left, top: f.top, width: f.w, height: f.h,
                  clipPath: f.cp,
                  backgroundImage: `url(${import.meta.env.BASE_URL}avatar.png)`,
                  backgroundSize: `${SIZE}px ${SIZE}px`,
                  backgroundPosition: `${f.bgX}px ${f.bgY}px`,
                  willChange: "transform",
                }} />
            ))}
          </div>
        )}

        {dmg > 0 && phase === "idle" && (
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{
            zIndex: 4,
            background: `radial-gradient(circle at 50% 50%, oklch(${0.7 + gi * 0.2} 0.3 ${55 - gi * 30}/${0.1 + gi * 0.35}) 0%, transparent ${55 - gi * 18}%)`,
            mixBlendMode: "screen",
          }} />
        )}
        <div ref={flr} className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "white", opacity: 0, zIndex: 20 }} />
        <div ref={sr} className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 42% 32%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 30%, transparent 60%)", opacity: 0.7 }} />
        <div className="absolute inset-0 rounded-full pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 88%, rgba(255,255,255,0.15) 0%, transparent 30%)" }} />
      </div>
      <div ref={fr} className="absolute inset-0 pointer-events-none" style={{ zIndex: 3 }} />
    </div>
  );
}
