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

/* ─── 随机多边形碎片 ─── */
interface Fragment {
  clipPath: string;
  cx: number; cy: number;
  dist: number; angle: number;
}

function makeFragments(): Fragment[] {
  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2;
  const frags: Fragment[] = [];
  const count = 40;

  for (let i = 0; i < count; i++) {
    const a = Math.random() * Math.PI * 2;
    const d = Math.pow(Math.random(), 0.6) * r * 0.85;
    const px = cx + Math.cos(a) * d;
    const py = cy + Math.sin(a) * d;
    const sides = 4 + Math.floor(Math.random() * 5);
    const size = r * (0.08 + Math.random() * 0.2);
    const pts: string[] = [];

    for (let s = 0; s < sides; s++) {
      const sa = (s / sides) * Math.PI * 2 + (Math.random() - 0.5) * 0.5;
      const sd = size * (0.5 + Math.random() * 0.7);
      let vx = px + Math.cos(sa) * sd;
      let vy = py + Math.sin(sa) * sd;
      // 约束在圆形内
      const d2 = Math.hypot(vx - cx, vy - cy);
      if (d2 > r * 0.96) {
        const sc = (r * 0.96) / d2;
        vx = cx + (vx - cx) * sc;
        vy = cy + (vy - cy) * sc;
      }
      pts.push(`${vx} ${vy}`);
    }

    frags.push({
      clipPath: `polygon(${pts.join(", ")})`,
      cx: px, cy: py,
      dist: Math.hypot(px - cx, py - cy),
      angle: Math.atan2(py - cy, px - cx),
    });
  }
  return frags;
}

/* ─── 自然裂纹生成 ─── */
function generateCracks(dmg: number): { d: string; w: number }[] {
  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2;
  const paths: { d: string; w: number }[] = [];

  // 多个撞击点
  const imp: { x: number; y: number }[] = [{ x: cx, y: cy }];
  if (dmg >= 3) {
    for (let i = 0; i < Math.min(2, dmg - 2); i++) {
      const a = Math.random() * Math.PI * 2;
      const d = r * (0.1 + Math.random() * 0.25);
      imp.push({ x: cx + Math.cos(a) * d, y: cy + Math.sin(a) * d });
    }
  }

  for (const pt of imp) {
    const n = 2 + Math.floor(Math.random() * 2) + (dmg >= 4 ? 1 : 0);
    for (let i = 0; i < n; i++) {
      const baseA = Math.random() * Math.PI * 2;
      const len = r * (0.25 + Math.random() * 0.5);
      let pts = `M ${pt.x} ${pt.y}`;
      let px = pt.x, py = pt.y;
      const steps = 4 + dmg + Math.floor(Math.random() * 3);

      for (let s = 1; s <= steps; s++) {
        const a = baseA + (Math.random() - 0.5) * 1.4;
        const seg = (len / steps) * (0.5 + Math.random() * 0.8);
        px += Math.cos(a) * seg;
        py += Math.sin(a) * seg;
        const d = Math.hypot(px - cx, py - cy);
        if (d > r * 0.88) {
          const sc = (r * 0.88) / d;
          px = cx + (px - cx) * sc; py = cy + (py - cy) * sc;
        }
        pts += ` L ${px} ${py}`;
      }
      paths.push({ d: pts, w: 1.5 + Math.random() * 1.5 + dmg * 0.3 });

      // 自然角度分支 (~45度)
      for (let b = 0; b < Math.floor(Math.random() * 2); b++) {
        const parts = pts.split(" L ");
        const si = 1 + Math.floor(Math.random() * (parts.length - 2));
        if (si >= parts.length) continue;
        const sp = parts[si];
        const [sx, sy] = sp.split(" ").slice(1).map(Number);
        if (isNaN(sx)) continue;

        const ba = baseA + (Math.random() > 0.5 ? 1 : -1) * (0.5 + Math.random() * 0.4);
        const bl = len * (0.15 + Math.random() * 0.2);
        let bpts = `M ${sx} ${sy}`;
        let bpx = sx, bpy = sy;
        for (let bs = 1; bs <= 3; bs++) {
          const ba2 = ba + (Math.random() - 0.5) * 0.6;
          bpx += Math.cos(ba2) * bl / 3;
          bpy += Math.sin(ba2) * bl / 3;
          bpts += ` L ${bpx} ${bpy}`;
        }
        paths.push({ d: bpts, w: 0.8 + Math.random() * 0.5 + dmg * 0.15 });
      }
    }
  }

  // 连接裂纹：把距离近的端点连起来
  if (paths.length >= 3 && dmg >= 4) {
    for (let i = 0; i < paths.length - 1; i++) {
      for (let j = i + 1; j < paths.length; j++) {
        const endI = paths[i].d.split(" L ").pop()!;
        const endJ = paths[j].d.split(" L ").pop()!;
        const [ix, iy] = endI.split(" ").slice(1).map(Number);
        const [jx, jy] = endJ.split(" ").slice(1).map(Number);
        if (isNaN(ix) || isNaN(jx)) continue;
        const dist = Math.hypot(ix - jx, iy - jy);
        if (dist < r * 0.3 && Math.random() < 0.4) {
          paths.push({
            d: `M ${ix} ${iy} L ${jx} ${jy}`,
            w: 0.8 + Math.random() * 0.5 + dmg * 0.1,
          });
        }
      }
    }
  }

  return paths;
}

type Phase = "idle" | "exploding" | "rebuilding";

function spawnEmbers(c: HTMLElement, count: number, mul = 1) {
  for (let i = 0; i < count; i++) {
    const e = document.createElement("div");
    const s = (2 + Math.random() * 4) * mul;
    const a = Math.random() * Math.PI * 2;
    const d = (5 + Math.random() * 30) * mul;
    const h = 20 + Math.random() * 30;
    e.style.cssText = `position:absolute;left:63px;top:63px;border-radius:50%;width:${s}px;height:${s}px;pointer-events:none;background:oklch(${0.55+Math.random()*0.25} 0.25 ${h});box-shadow:0 0 ${s*4}px ${s*1.5}px oklch(0.7 0.25 ${h}/.5);`;
    c.appendChild(e);
    animate(e, {
      translateX: Math.cos(a)*d, translateY: Math.sin(a)*d-10-Math.random()*15,
      opacity: [1,0], scale: [1,0.2], duration: 400+Math.random()*600,
      ease: "out(2)", onComplete: () => e.remove(),
    });
  }
}

function spawnShockwave(c: HTMLElement) {
  for (let i = 0; i < 2; i++) {
    const r = document.createElement("div");
    r.style.cssText = `position:absolute;left:50%;top:50%;border-radius:50%;width:0;height:0;pointer-events:none;border:${2-i}px solid oklch(${0.85-i*0.15} 0.3 ${35+i*10}/${0.8-i*0.3});transform:translate(-50%,-50%);`;
    c.appendChild(r);
    animate(r, {
      width: [0, 180+i*60], height: [0, 180+i*60],
      opacity: [0.9,0], duration: 500+i*200, delay: i*80,
      ease: "out(3)", onComplete: () => r.remove(),
    });
  }
}

function spawnMagmaJet(c: HTMLElement, cx: number, cy: number) {
  for (let i = 0; i < 8; i++) {
    const a = (i/8)*Math.PI*2 + (Math.random()-.5)*.4;
    for (let l = 0; l < 4; l++) {
      const e = document.createElement("div");
      const s = (3+Math.random()*6)*(1-l*.2);
      const d = (20+Math.random()*50)*(1+l*.5);
      const h = 25+Math.random()*25;
      e.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;border-radius:50%;width:${s}px;height:${s}px;pointer-events:none;background:oklch(${0.7-l*.1} 0.3 ${h});box-shadow:0 0 ${s*6}px ${s*2}px oklch(0.8 0.3 ${h}/.6);`;
      c.appendChild(e);
      animate(e, {
        translateX: Math.cos(a)*d, translateY: Math.sin(a)*d,
        opacity: [1,0], scale: [1.5,.1], duration: 300+Math.random()*400, delay: l*30+Math.random()*50,
        ease: "out(2)", onComplete: () => e.remove(),
      });
    }
  }
}

function spawnSmoke(c: HTMLElement) {
  for (let i = 0; i < 6; i++) {
    const s = document.createElement("div");
    const a = Math.random()*Math.PI*2, d = 10+Math.random()*40, sz = 20+Math.random()*40;
    s.style.cssText = `position:absolute;left:${63-sz/2}px;top:${63-sz/2}px;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,oklch(.5 .05 40/.3),transparent);filter:blur(4px);`;
    c.appendChild(s);
    animate(s, {
      translateX: Math.cos(a)*d, translateY: Math.sin(a)*d,
      scale: [0.5, 2.5], opacity: [0.4, 0], duration: 800+Math.random()*600,
      ease: "out(3)", onComplete: () => s.remove(),
    });
  }
}

function fullScreenFlash() {
  const f = document.createElement("div");
  f.style.cssText = "position:fixed;inset:0;z-index:9999;background:white;pointer-events:none;";
  document.body.appendChild(f);
  animate(f, { opacity: [0,1,0.7,0], duration: 600, ease: "out(3)", onComplete: () => f.remove() });
}

function pageShake() {
  const h = document.documentElement;
  h.style.transition = "transform .6s ease-out";
  h.style.transform = `translate(${(Math.random()-.5)*12}px,${(Math.random()-.5)*12}px)`;
  setTimeout(() => { h.style.transform = `translate(${(Math.random()-.5)*8}px,${(Math.random()-.5)*8}px)`; setTimeout(() => { h.style.transform = ""; h.style.transition = ""; }, 200); }, 100);
}

function pageParticles(count: number, ox: number, oy: number) {
  for (let i = 0; i < count; i++) {
    const p = document.createElement("div");
    const s = 3+Math.random()*8, a = Math.random()*Math.PI*2, d = 100+Math.random()*400, h = 20+Math.random()*30;
    p.style.cssText = `position:fixed;left:${ox}px;top:${oy}px;border-radius:50%;width:${s}px;height:${s}px;pointer-events:none;z-index:9998;background:oklch(${0.6+Math.random()*.3} 0.25 ${h});box-shadow:0 0 ${s*5}px ${s*2}px oklch(0.8 0.3 ${h}/.4);`;
    document.body.appendChild(p);
    animate(p, {
      translateX: Math.cos(a)*d, translateY: Math.sin(a)*d-20,
      opacity: [1,0], scale: [1.5,0], duration: 600+Math.random()*800,
      ease: "out(2)", onComplete: () => p.remove(),
    });
  }
}

function pageShockwave(ox: number, oy: number) {
  for (let i = 0; i < 3; i++) {
    const r = document.createElement("div");
    r.style.cssText = `position:fixed;left:${ox}px;top:${oy}px;border-radius:50%;width:0;height:0;pointer-events:none;z-index:9997;border:${3-i}px solid oklch(${0.85-i*.15} 0.3 ${35+i*10}/${0.7-i*.2});transform:translate(-50%,-50%);`;
    document.body.appendChild(r);
    animate(r, {
      width: [0, 600+i*300], height: [0, 600+i*300],
      opacity: [0.8,0], duration: 700+i*200, delay: i*100,
      ease: "out(3)", onComplete: () => r.remove(),
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
  const fragments = useMemo(makeFragments, []);

  const triggerExplosion = useCallback(() => {
    setPhase("exploding");
    const container = avatarRef.current;
    const fx = fxRef.current;
    if (!container) return;

    const rect = container.getBoundingClientRect();
    const pcx = rect.left + rect.width / 2;
    const pcy = rect.top + rect.height / 2;

    fullScreenFlash();
    pageShake();
    pageShockwave(pcx, pcy);
    pageParticles(30, pcx, pcy);

    if (flashRef.current) {
      animate(flashRef.current, { opacity: [0,1,0.7,0], duration: 500, ease: "out(3)" });
    }
    if (fx) { spawnShockwave(fx); spawnSmoke(fx); }

    animate(container, {
      translateX: [0,(Math.random()-.5)*18,(Math.random()-.5)*12,0],
      translateY: [0,(Math.random()-.5)*18,(Math.random()-.5)*12,0],
      scale: [1,1.1,0.95,1], duration: 700, ease: "out(2)",
    });

    fragsRef.current.forEach((el, i) => {
      if (!el) return;
      const f = fragments[i];
      if (!f) return;
      const flyDist = 30 + Math.random()*200 + f.dist*0.6;
      const flyAngle = f.angle + (Math.random()-.5)*0.5;
      el.style.display = "block";
      animate(el, {
        translateX: Math.cos(flyAngle)*flyDist,
        translateY: Math.sin(flyAngle)*flyDist,
        rotate: (Math.random()-.5)*900,
        rotateX: (Math.random()-.5)*120,
        rotateY: (Math.random()-.5)*120,
        opacity: [1,0.3],
        duration: 300+Math.random()*500,
        ease: "out(3)", delay: Math.random()*80,
      });
    });

    for (let w = 0; w < 3; w++) {
      setTimeout(() => { if (fx) spawnMagmaJet(fx, 63+(Math.random()-.5)*20, 63+(Math.random()-.5)*20); }, 50+w*80);
    }
    for (let i = 0; i < 4; i++) {
      setTimeout(() => spawnEmbers(container, 12, 1.5), 150+i*60);
    }
    setTimeout(() => pageParticles(20, pcx, pcy), 300);

    setTimeout(() => {
      setPhase("rebuilding");
      fragsRef.current.forEach((el) => {
        if (!el) return;
        animate(el, {
          translateX: 0, translateY: 0, rotate: 0, rotateX: 0, rotateY: 0, opacity: 1,
          duration: 600+Math.random()*300, ease: "outBack(1.7)", delay: Math.random()*150,
          onComplete: () => { el.style.display = ""; },
        });
      });
      setTimeout(() => {
        if (flashRef.current) animate(flashRef.current, { opacity: [0,0.3,0], duration: 300, ease: "out(3)" });
        if (fx) { spawnShockwave(fx); for (let i = 0; i < 3; i++) setTimeout(() => spawnEmbers(container, 4), i*50); }
        setDamage(0);
        setPhase("idle");
      }, 900);
    }, 1300);
  }, [fragments]);

  const handleClick = useCallback(() => {
    if (phase !== "idle") return;
    const c = avatarRef.current;
    if (!c) return;
    const n = damage + 1;
    setDamage(n);
    if (flashRef.current) animate(flashRef.current, { opacity: [0.5,0], duration: 200, ease: "out(3)" });
    const i = 3 + n * 2;
    animate(c, {
      translateX: [0,(Math.random()-.5)*i,(Math.random()-.5)*i*.6,0],
      translateY: [0,(Math.random()-.5)*i,(Math.random()-.5)*i*.6,0],
      duration: 250+n*20, ease: "out(3)",
    });
    spawnEmbers(c, 2+n*2);
    if (n >= MAX_DAMAGE) triggerExplosion();
  }, [damage, phase, triggerExplosion]);

  useEffect(() => {
    const back = backRef.current, front = frontRef.current;
    if (!back || !front) return;
    const rs: HTMLDivElement[] = [];
    RINGS.forEach((c) => {
      const r = document.createElement("div");
      r.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;width:${c.rx*2}px;height:${c.ry*2}px;left:50%;top:50%;margin-left:-${c.rx}px;margin-top:-${c.ry}px;border:1px solid ${c.ring};`;
      back.appendChild(r); rs.push(r);
    });
    const all: Array<{el:HTMLDivElement;rx:number;ry:number;speed:number;offset:number;fading:boolean}> = [];
    RINGS.forEach((c) => {
      for (let i = 0; i < c.count; i++) {
        const d = document.createElement("div"); const s = c.size;
        d.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;width:${s}px;height:${s}px;background:${c.color};box-shadow:0 0 ${s*4}px ${s*1.5}px ${c.color};left:50%;top:50%;transition:opacity .25s;`;
        back.appendChild(d);
        all.push({el:d,rx:c.rx,ry:c.ry,speed:c.speed,offset:(i/c.count)*Math.PI*2,fading:false});
      }
    });
    const drv = {a:0};
    const anim = animate(drv, {
      a: Math.PI*2, duration: 35000, ease: "linear", loop: true,
      onUpdate: () => all.forEach((d) => {
        const a = drv.a*d.speed+d.offset, ca = Math.cos(a);
        d.el.style.translate = `${ca*d.rx}px ${Math.sin(a)*d.ry}px`;
        const tf = ca > 0.05;
        if (tf && d.el.parentElement===back && !d.fading) {
          d.fading = true; d.el.style.opacity = "0";
          setTimeout(() => { front.appendChild(d.el); d.el.style.opacity = ""; d.fading = false; }, 250);
        } else if (!tf && d.el.parentElement===front && !d.fading) {
          d.fading = true; d.el.style.opacity = "0";
          setTimeout(() => { back.appendChild(d.el); d.el.style.opacity = ""; d.fading = false; }, 250);
        }
      }),
    });
    return () => { anim.pause(); all.forEach(d=>d.el.remove()); rs.forEach(r=>r.remove()); };
  }, []);

  const glowI = damage / MAX_DAMAGE;
  const crackData = useMemo(() => damage > 0 ? generateCracks(damage) : [], [damage]);
  const bs = phase === "idle"
    ? (damage === 0
      ? "0 0 25px 4px oklch(0.7 0.2 85 / 0.2), 0 0 60px 10px oklch(0.7 0.2 85 / 0.08)"
      : `0 0 ${25+glowI*45}px ${4+glowI*14}px oklch(0.7 ${0.2+glowI*.3} ${85-glowI*55}/${0.2+glowI*.5}), 0 0 ${60+glowI*70}px ${10+glowI*25}px oklch(0.7 ${0.2+glowI*.2} ${85-glowI*45}/${0.08+glowI*.35})`)
    : "0 0 50px 15px oklch(0.85 0.35 35 / 0.8), 0 0 120px 35px oklch(0.85 0.35 35 / 0.4)";

  useEffect(() => {
    const el = avatarRef.current, sh = shineRef.current;
    if (!el || !sh) return;
    const fn = (e: MouseEvent) => {
      const r = el.getBoundingClientRect(), cx = r.left+r.width/2, cy = r.top+r.height/2;
      const dx = e.clientX-cx, dy = e.clientY-cy, d = Math.sqrt(dx*dx+dy*dy);
      if (d < 200) {
        const t = 1-d/200;
        sh.style.background = `radial-gradient(ellipse at ${50+(dx/(d||1))*20*t}% ${50+(dy/(d||1))*16*t}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.03) 55%, transparent 72%)`;
        sh.style.opacity = "1";
      }
    };
    window.addEventListener("mousemove", fn);
    return () => window.removeEventListener("mousemove", fn);
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 220, height: 220 }}>
      <div ref={backRef} className="absolute inset-0 z-0" />
      <div ref={fxRef} className="absolute inset-0 z-10 pointer-events-none" />

      <div ref={avatarRef} onClick={handleClick}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-visible"
        style={{ width: SIZE, height: SIZE, zIndex: 1, boxShadow: bs, animation: phase==="idle"&&damage===0 ? "breathe-amber 3s ease-in-out infinite" : "none" }}
        role="img" aria-label="avatar">
        <div className={`absolute inset-0 rounded-full overflow-hidden transition-opacity duration-150 ${phase==="exploding"||phase==="rebuilding"?"opacity-0":"opacity-100"}`} style={{clipPath:"circle(50%)"}}>
          <img src={import.meta.env.BASE_URL+"avatar.png"} alt="" className="h-full w-full object-cover pointer-events-none" draggable={false} />
        </div>

        {damage > 0 && phase === "idle" && (
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full pointer-events-none" style={{clipPath:"circle(50%)",zIndex:2}}>
            {crackData.map((c, i) => (
              <g key={i}>
                <path d={c.d} fill="none" stroke={`oklch(0.7 ${0.2+glowI*.2} ${40-glowI*20}/${0.3+glowI*.5})`} strokeWidth={c.w+3} strokeLinecap="round" strokeLinejoin="round" style={{filter:"blur(3px)"}} />
                <path d={c.d} fill="none" stroke={`oklch(0.9 0.15 ${50-glowI*15}/${0.5+glowI*.5})`} strokeWidth={c.w} strokeLinecap="round" strokeLinejoin="round" />
              </g>
            ))}
          </svg>
        )}

        {(phase === "exploding" || phase === "rebuilding") && (
          <div className="absolute inset-0" style={{perspective:"400px",zIndex:2}}>
            {fragments.map((f, i) => (
              <div key={i} ref={(el)=>{fragsRef.current[i]=el;}} className="absolute"
                style={{inset:0,clipPath:f.clipPath,backgroundImage:`url(${import.meta.env.BASE_URL}avatar.png)`,backgroundSize:"cover",backgroundPosition:"center"}} />
            ))}
          </div>
        )}

        {damage > 0 && phase === "idle" && (
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{background:`radial-gradient(circle at 50% 50%, oklch(${0.7+glowI*.2} 0.3 ${55-glowI*30}/${0.1+glowI*.35}) 0%, transparent ${55-glowI*18}%)`,mixBlendMode:"screen",zIndex:1}} />
        )}

        <div ref={flashRef} className="absolute inset-0 rounded-full pointer-events-none" style={{background:"white",opacity:0,zIndex:20}} />
        <div ref={shineRef} className="absolute inset-0 rounded-full pointer-events-none" style={{background:"radial-gradient(ellipse at 42% 32%, rgba(255,255,255,0.5) 0%, rgba(255,255,255,0.12) 30%, transparent 60%)",opacity:0.7}} />
        <div className="absolute inset-0 rounded-full pointer-events-none" style={{background:"radial-gradient(ellipse at 50% 88%, rgba(255,255,255,0.15) 0%, transparent 30%)"}} />
      </div>

      <div ref={frontRef} className="absolute inset-0 pointer-events-none" style={{zIndex:3}} />
    </div>
  );
}
