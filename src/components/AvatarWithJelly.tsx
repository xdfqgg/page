import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { animate } from "animejs";

const GRID = 6;
const SIZE = 126;
const CELL = SIZE / GRID;
const MAX_DAMAGE = 6;

const RINGS = [
  { rx: 90, ry: 36, speed: 0.35, color: "oklch(0.72 0.2 85 / 0.7)", count: 12, size: 2.5, ring: "oklch(0.72 0.2 85 / 0.12)" },
  { rx: 80, ry: 30, speed: -0.3, color: "oklch(0.63 0.15 20 / 0.55)", count: 8, size: 2, ring: "oklch(0.63 0.15 20 / 0.08)" },
  { rx: 96, ry: 28, speed: 0.5, color: "rgba(255,255,255,0.4)", count: 6, size: 2, ring: "rgba(255,255,255,0.06)" },
  { rx: 84, ry: 40, speed: -0.45, color: "oklch(0.68 0.18 50 / 0.5)", count: 8, size: 2.5, ring: "oklch(0.68 0.18 50 / 0.1)" },
];

interface CellFrag {
  col: number; row: number; x: number; y: number;
  dist: number; angle: number;
}

function makeFragments(): CellFrag[] {
  const frags: CellFrag[] = [];
  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2;
  for (let row = 0; row < GRID; row++) {
    for (let col = 0; col < GRID; col++) {
      const fx = col * CELL + CELL / 2;
      const fy = row * CELL + CELL / 2;
      if (Math.hypot(fx - cx, fy - cy) <= r) {
        frags.push({
          col, row, x: col * CELL, y: row * CELL,
          dist: Math.hypot(fx - cx, fy - cy),
          angle: Math.atan2(fy - cy, fx - cx),
        });
      }
    }
  }
  return frags;
}

type Phase = "idle" | "exploding" | "rebuilding";

function spawnEmbers(container: HTMLElement, count: number) {
  for (let i = 0; i < count; i++) {
    const ember = document.createElement("div");
    const s = 3 + Math.random() * 4;
    const angle = Math.random() * Math.PI * 2;
    const dist = 10 + Math.random() * 20;
    ember.style.cssText = `
      position:absolute; left:50%; top:50%; border-radius:50%;
      width:${s}px; height:${s}px; pointer-events:none; z-index:10;
      background:oklch(${0.6 + Math.random() * 0.25} ${0.2 + Math.random() * 0.1} ${30 + Math.random() * 40});
      box-shadow:0 0 ${s * 3}px ${s}px oklch(0.7 0.25 40 / 0.5);
    `;
    container.appendChild(ember);
    animate(ember, {
      translateX: [0, Math.cos(angle) * dist],
      translateY: [0, Math.sin(angle) * dist - 15 - Math.random() * 20],
      opacity: [1, 0],
      scale: [1, 0.3],
      duration: 600 + Math.random() * 400,
      ease: "out(2)",
      onComplete: () => ember.remove(),
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
  const fragsRef = useRef<(HTMLDivElement | null)[]>([]);
  const fragments = useMemo(makeFragments, []);

  /* --- 爆炸 --- */
  const triggerExplosion = useCallback(() => {
    setPhase("exploding");
    const container = avatarRef.current;
    if (!container) return;

    // 大白闪
    if (flashRef.current) {
      animate(flashRef.current, { opacity: [0, 1, 0.8, 0], duration: 400, ease: "out(3)" });
    }

    // 震动
    animate(container, {
      translateX: [0, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, 0],
      translateY: [0, (Math.random() - 0.5) * 14, (Math.random() - 0.5) * 10, 0],
      duration: 500, ease: "out(2)",
    });

    // 火星
    for (let i = 0; i < 3; i++) {
      setTimeout(() => spawnEmbers(container, 8), i * 60);
    }

    // 碎片飞散
    fragsRef.current.forEach((el, i) => {
      if (!el) return;
      const f = fragments[i];
      if (!f) return;
      const flyDist = 80 + Math.random() * 120 + f.dist * 0.5;
      const flyAngle = f.angle + (Math.random() - 0.5) * 0.5;
      const rot = (Math.random() - 0.5) * 720;
      el.style.display = "block";
      animate(el, {
        translateX: Math.cos(flyAngle) * flyDist,
        translateY: Math.sin(flyAngle) * flyDist,
        rotate: rot,
        opacity: [1, 0.7],
        duration: 600 + Math.random() * 300,
        ease: "out(3)",
        delay: Math.random() * 80,
      });
    });

    // 复原
    setTimeout(() => {
      setPhase("rebuilding");
      fragsRef.current.forEach((el) => {
        if (!el) return;
        animate(el, {
          translateX: 0, translateY: 0, rotate: 0, opacity: 1,
          duration: 500 + Math.random() * 200,
          ease: "out(4)",
          delay: Math.random() * 100,
          onComplete: () => { el.style.display = ""; },
        });
      });
      setTimeout(() => {
        setDamage(0);
        setPhase("idle");
      }, 800);
    }, 1400);
  }, [fragments]);

  /* --- 点击 --- */
  const handleClick = useCallback(() => {
    if (phase !== "idle") return;
    const container = avatarRef.current;
    if (!container) return;

    const next = damage + 1;
    setDamage(next);

    // 闪光
    if (flashRef.current) {
      animate(flashRef.current, { opacity: [0.7, 0], duration: 250, ease: "out(3)" });
    }

    // 震动
    animate(container, {
      translateX: [0, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, 0],
      translateY: [0, (Math.random() - 0.5) * 6, (Math.random() - 0.5) * 4, 0],
      duration: 300, ease: "out(3)",
    });

    // 火星
    spawnEmbers(container, 2 + next);

    if (next >= MAX_DAMAGE) {
      triggerExplosion();
    }
  }, [damage, phase, triggerExplosion]);

  /* --- 光环轨道 --- */
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

  /* --- 光晕 --- */
  const glowIntensity = damage / MAX_DAMAGE;
  const boxShadow = phase === "idle"
    ? `0 0 ${25 + glowIntensity * 30}px ${4 + glowIntensity * 8}px oklch(0.7 ${0.2 + glowIntensity * 0.15} ${85 - glowIntensity * 40} / ${0.2 + glowIntensity * 0.4}), 0 0 ${60 + glowIntensity * 50}px ${10 + glowIntensity * 15}px oklch(0.7 ${0.2 + glowIntensity * 0.1} ${85 - glowIntensity * 30} / ${0.08 + glowIntensity * 0.2})`
    : "0 0 30px 8px oklch(0.8 0.3 40 / 0.6), 0 0 80px 20px oklch(0.8 0.3 40 / 0.3)";
  const damageColor = `oklch(${0.7 + glowIntensity * 0.15} ${0.2 + glowIntensity * 0.15} ${65 - glowIntensity * 25})`;

  /* --- Hover 高光追踪 --- */
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

      <div
        ref={avatarRef}
        onClick={handleClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-visible"
        style={{
          width: SIZE, height: SIZE, zIndex: 1, boxShadow,
          animation: phase === "idle" ? "breathe-amber 3s ease-in-out infinite" : "none",
        }}
        role="img" aria-label="avatar"
      >
        {/* 行星本体 */}
        <div className={`absolute inset-0 rounded-full overflow-hidden ${phase === "exploding" || phase === "rebuilding" ? "opacity-0" : "opacity-100"} transition-opacity duration-150`}
          style={{ clipPath: "circle(50%)" }}>
          <img src={import.meta.env.BASE_URL + "avatar.png"} alt=""
            className="h-full w-full object-cover pointer-events-none" draggable={false} />
        </div>

        {/* 爆炸碎片 */}
        {(phase === "exploding" || phase === "rebuilding") && (
          <div className="absolute inset-0" style={{ clipPath: "circle(50%)" }}>
            {fragments.map((f, i) => (
              <div key={i}
                ref={(el) => { fragsRef.current[i] = el; }}
                className="absolute"
                style={{
                  left: f.x, top: f.y, width: CELL + 1, height: CELL + 1,
                  backgroundImage: `url(${import.meta.env.BASE_URL}avatar.png)`,
                  backgroundSize: `${SIZE}px ${SIZE}px`,
                  backgroundPosition: `-${f.x}px -${f.y}px`,
                }} />
            ))}
          </div>
        )}

        {/* 伤害光晕 */}
        {damage > 0 && phase === "idle" && (
          <div className="absolute inset-0 rounded-full pointer-events-none"
            style={{
              background: `radial-gradient(circle at 50% 50%, ${damageColor} 0%, transparent ${60 - glowIntensity * 20}%)`,
              opacity: 0.15 + glowIntensity * 0.35, mixBlendMode: "screen",
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
