import { useRef, useEffect, useCallback, useState, useMemo } from "react";
import { animate } from "animejs";
import * as THREE from "three";

const SIZE = 126;
const RADIUS = 60;
const MAX_DAMAGE = 6;

const RINGS = [
  { rx: 90, ry: 36, speed: 0.35, color: "oklch(0.72 0.2 85 / 0.7)", count: 12, size: 2.5, ring: "oklch(0.72 0.2 85 / 0.12)" },
  { rx: 80, ry: 30, speed: -0.3, color: "oklch(0.63 0.15 20 / 0.55)", count: 8, size: 2, ring: "oklch(0.63 0.15 20 / 0.08)" },
  { rx: 96, ry: 28, speed: 0.5, color: "rgba(255,255,255,0.4)", count: 6, size: 2, ring: "rgba(255,255,255,0.06)" },
  { rx: 84, ry: 40, speed: -0.45, color: "oklch(0.68 0.18 50 / 0.5)", count: 8, size: 2.5, ring: "oklch(0.68 0.18 50 / 0.1)" },
];

function genCracks(dmg: number): { d: string; w: number }[] {
  const cx = SIZE / 2, cy = SIZE / 2, r = SIZE / 2 - 4, pts = 8 + dmg * 2;
  const out: { d: string; w: number }[] = [];
  for (let i = 0; i < pts; i++) {
    const eA = (i / pts) * Math.PI * 2 + (Math.random() - 0.5) * 0.3;
    const ex = cx + Math.cos(eA) * r, ey = cy + Math.sin(eA) * r;
    const len = r * (0.3 + Math.random() * 0.5);
    let px = ex, py = ey, s = `M ${px} ${py}`;
    for (let s2 = 1; s2 <= 3 + Math.floor(Math.random() * 4); s2++) {
      const dir = eA + Math.PI + (Math.random() - 0.5) * 1.2;
      const seg = len / (s2 + 1) * (0.5 + Math.random() * 0.7);
      px += Math.cos(dir) * seg + (Math.random() - 0.5) * 4;
      py += Math.sin(dir) * seg + (Math.random() - 0.5) * 4;
      const dd = Math.hypot(px - cx, py - cy);
      if (dd > r * 0.92) { const sc = (r * 0.92) / dd; px = cx + (px - cx) * sc; py = cy + (py - cy) * sc; }
      s += ` L ${px} ${py}`;
    }
    out.push({ d: s, w: 1.5 + Math.random() + dmg * 0.2 });
    for (let b = 0; b < Math.floor(Math.random() * 2); b++) {
      const ps = s.split(" L "), si = 1 + Math.floor(Math.random() * (ps.length - 2));
      if (si >= ps.length) continue;
      const cr = ps[si].replace(/^M\s*/, "").split(" ").map(Number);
      if (isNaN(cr[0])) continue;
      const ba = eA + Math.PI + (Math.random() > 0.5 ? 1 : -1) * (0.3 + Math.random() * 0.6);
      const bl = len * (0.15 + Math.random() * 0.2);
      let bp = `M ${cr[0]} ${cr[1]}`, bpx = cr[0], bpy = cr[1];
      for (let bs = 1; bs <= 3; bs++) {
        bpx += Math.cos(ba + (Math.random() - 0.5) * 0.5) * bl / 3;
        bpy += Math.sin(ba + (Math.random() - 0.5) * 0.5) * bl / 3;
        bp += ` L ${bpx} ${bpy}`;
      }
      out.push({ d: bp, w: 0.8 + dmg * 0.1 });
    }
  }
  if (dmg >= 3) {
    for (let i = 0; i < out.length - 1; i++) {
      for (let j = i + 1; j < out.length; j++) {
        if (Math.random() > 0.3) continue;
        const e1 = out[i].d.split(" L ").pop()!.replace(/^M\s*/, "").split(" ").map(Number);
        const e2 = out[j].d.split(" L ").pop()!.replace(/^M\s*/, "").split(" ").map(Number);
        if (!isNaN(e1[0]) && !isNaN(e2[0]) && Math.hypot(e1[0] - e2[0], e1[1] - e2[1]) < SIZE * 0.25) {
          out.push({ d: `M ${e1[0]} ${e1[1]} L ${e2[0]} ${e2[1]}`, w: 0.6 + dmg * 0.1 });
        }
      }
    }
  }
  return out;
}

function initThree(c: HTMLCanvasElement, src: string) {
  const s = new THREE.Scene();
  const cam = new THREE.PerspectiveCamera(45, 1, 1, 500);
  cam.position.set(0, 0, RADIUS * 3.2);
  cam.lookAt(0, 0, 0);
  const r = new THREE.WebGLRenderer({ canvas: c, alpha: true, antialias: true });
  r.setSize(SIZE, SIZE);
  r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  const g = new THREE.SphereGeometry(RADIUS, 48, 48);
  const t = new THREE.TextureLoader().load(src);
  const m = new THREE.MeshBasicMaterial({ map: t });
  const mesh = new THREE.Mesh(g, m);
  s.add(mesh);
  let a = 0;
  function l() { a += 0.003; mesh.rotation.y = a; r.render(s, cam); requestAnimationFrame(l); }
  l();
  return { s, cam, r, mesh, g, m, t };
}

type Phase = "idle" | "exploding" | "rebuilding";

function se(c: HTMLElement, n: number, m = 1) {
  for (let i = 0; i < n; i++) {
    const e = document.createElement("div");
    const s = (2 + Math.random() * 4) * m, a = Math.random() * Math.PI * 2;
    const d = (5 + Math.random() * 30) * m, h = 20 + Math.random() * 30;
    e.style.cssText = `position:absolute;left:63px;top:63px;border-radius:50%;width:${s}px;height:${s}px;pointer-events:none;background:oklch(${0.55 + Math.random() * 0.25} 0.25 ${h});box-shadow:0 0 ${s * 4}px ${s * 1.5}px oklch(0.7 0.25 ${h}/0.5);`;
    c.appendChild(e);
    animate(e, {
      translateX: Math.cos(a) * d,
      translateY: Math.sin(a) * d - 10 - Math.random() * 15,
      opacity: [1, 0], scale: [1, 0.2],
      duration: 500 + Math.random() * 700, ease: "out(2)",
      onComplete: () => e.remove(),
    });
  }
}

function ssw(c: HTMLElement) {
  for (let i = 0; i < 2; i++) {
    const r = document.createElement("div");
    r.style.cssText = `position:absolute;left:50%;top:50%;border-radius:50%;width:0;height:0;pointer-events:none;border:${2 - i}px solid oklch(${0.85 - i * 0.15} 0.3 ${35 + i * 10}/${0.8 - i * 0.3});transform:translate(-50%,-50%);`;
    c.appendChild(r);
    animate(r, {
      width: [0, 160 + i * 50], height: [0, 160 + i * 50],
      opacity: [0.9, 0], duration: 600 + i * 200, delay: i * 80, ease: "out(3)",
      onComplete: () => r.remove(),
    });
  }
}

function smj(c: HTMLElement, cx: number, cy: number) {
  for (let i = 0; i < 8; i++) {
    const a = (i / 8) * Math.PI * 2 + (Math.random() - 0.5) * 0.4;
    for (let l = 0; l < 4; l++) {
      const e = document.createElement("div");
      const s = (3 + Math.random() * 6) * (1 - l * 0.2);
      const d = (20 + Math.random() * 40) * (1 + l * 0.5);
      const h = 25 + Math.random() * 25;
      e.style.cssText = `position:absolute;left:${cx}px;top:${cy}px;border-radius:50%;width:${s}px;height:${s}px;pointer-events:none;background:oklch(${0.7 - l * 0.1} 0.3 ${h});box-shadow:0 0 ${s * 6}px ${s * 2}px oklch(0.8 0.3 ${h}/0.6);`;
      c.appendChild(e);
      animate(e, {
        translateX: Math.cos(a) * d, translateY: Math.sin(a) * d,
        opacity: [1, 0], scale: [1.5, 0.1],
        duration: 500 + Math.random() * 600, delay: l * 30 + Math.random() * 50, ease: "out(2)",
        onComplete: () => e.remove(),
      });
    }
  }
}

function ssm(c: HTMLElement) {
  for (let i = 0; i < 6; i++) {
    const s = document.createElement("div");
    const a = Math.random() * Math.PI * 2, d = 10 + Math.random() * 40, sz = 20 + Math.random() * 40;
    s.style.cssText = `position:absolute;left:${63 - sz / 2}px;top:${63 - sz / 2}px;width:${sz}px;height:${sz}px;border-radius:50%;pointer-events:none;background:radial-gradient(circle,oklch(0.5 0.05 40/0.3),transparent);filter:blur(4px);`;
    c.appendChild(s);
    animate(s, {
      translateX: Math.cos(a) * d, translateY: Math.sin(a) * d,
      scale: [0.5, 2.5], opacity: [0.4, 0],
      duration: 1200 + Math.random() * 800, ease: "out(3)",
      onComplete: () => s.remove(),
    });
  }
}

function ff() {
  const f = document.createElement("div");
  f.style.cssText = "position:fixed;inset:0;z-index:9999;background:white;pointer-events:none;";
  document.body.appendChild(f);
  animate(f, { opacity: [0, 1, 0.7, 0], duration: 1000, ease: "out(3)", onComplete: () => f.remove() });
}

function ps() {
  const h = document.documentElement;
  h.style.transition = "transform 0.8s ease-out";
  h.style.transform = `translate(${(Math.random() - 0.5) * 15}px, ${(Math.random() - 0.5) * 15}px)`;
  setTimeout(() => {
    h.style.transform = `translate(${(Math.random() - 0.5) * 10}px, ${(Math.random() - 0.5) * 10}px)`;
    setTimeout(() => { h.style.transform = ""; h.style.transition = ""; }, 300);
  }, 200);
}

function pp(n: number, ox: number, oy: number) {
  for (let i = 0; i < n; i++) {
    const p = document.createElement("div");
    const s = 3 + Math.random() * 8, a = Math.random() * Math.PI * 2;
    const d = 100 + Math.random() * 400, h = 20 + Math.random() * 30;
    p.style.cssText = `position:fixed;left:${ox}px;top:${oy}px;border-radius:50%;width:${s}px;height:${s}px;pointer-events:none;z-index:9998;background:oklch(${0.6 + Math.random() * 0.3} 0.25 ${h});box-shadow:0 0 ${s * 5}px ${s * 2}px oklch(0.8 0.3 ${h}/0.4);`;
    document.body.appendChild(p);
    animate(p, {
      translateX: Math.cos(a) * d, translateY: Math.sin(a) * d - 20,
      opacity: [1, 0], scale: [1.5, 0],
      duration: 800 + Math.random() * 1000, ease: "out(2)",
      onComplete: () => p.remove(),
    });
  }
}

function psw(ox: number, oy: number) {
  for (let i = 0; i < 3; i++) {
    const r = document.createElement("div");
    r.style.cssText = `position:fixed;left:${ox}px;top:${oy}px;border-radius:50%;width:0;height:0;pointer-events:none;z-index:9997;border:${3 - i}px solid oklch(${0.85 - i * 0.15} 0.3 ${35 + i * 10}/${0.7 - i * 0.2});transform:translate(-50%,-50%);`;
    document.body.appendChild(r);
    animate(r, {
      width: [0, 600 + i * 300], height: [0, 600 + i * 300],
      opacity: [0.8, 0], duration: 1000 + i * 300, delay: i * 120, ease: "out(3)",
      onComplete: () => r.remove(),
    });
  }
}

export default function AvatarWithJelly() {
  const [dmg, setDmg] = useState(0);
  const [phase, setPhase] = useState<Phase>("idle");
  const br = useRef<HTMLDivElement>(null), fr = useRef<HTMLDivElement>(null);
  const ar = useRef<HTMLDivElement>(null), sr = useRef<HTMLDivElement>(null);
  const flr = useRef<HTMLDivElement>(null), fxr = useRef<HTMLDivElement>(null);
  const cr = useRef<HTMLCanvasElement>(null);
  const tRef = useRef<ReturnType<typeof initThree> | null>(null);
  const crackData = useMemo(() => dmg > 0 ? genCracks(dmg) : [], [dmg]);

  useEffect(() => {
    if (!cr.current) return;
    const t = initThree(cr.current, import.meta.env.BASE_URL + "avatar.png");
    tRef.current = t;
    return () => { t.r.dispose(); t.g.dispose(); t.m.dispose(); t.t.dispose(); };
  }, []);

  const handleClick = useCallback(() => {
    if (phase !== "idle") return;
    const c = ar.current; if (!c) return;
    const n = dmg + 1; setDmg(n);
    if (flr.current) animate(flr.current, { opacity: [0.5, 0], duration: 300, ease: "out(3)" });
    const int = 3 + n * 2;
    animate(c, {
      translateX: [0, (Math.random() - 0.5) * int, (Math.random() - 0.5) * int * 0.6, 0],
      translateY: [0, (Math.random() - 0.5) * int, (Math.random() - 0.5) * int * 0.6, 0],
      duration: 300 + n * 20, ease: "out(3)",
    });
    se(c, 2 + n * 2);
    if (n >= MAX_DAMAGE) setPhase("exploding");
  }, [dmg, phase]);

  useEffect(() => {
    if (phase !== "exploding") return;
    const c = ar.current, fx = fxr.current; if (!c) return;
    const r = c.getBoundingClientRect(), pcx = r.left + r.width / 2, pcy = r.top + r.height / 2;
    ff(); ps(); psw(pcx, pcy); pp(30, pcx, pcy);
    if (flr.current) animate(flr.current, { opacity: [0, 1, 0.7, 0], duration: 800, ease: "out(3)" });
    if (fx) { ssw(fx); ssm(fx); }
    for (let w = 0; w < 3; w++) setTimeout(() => { if (fx) smj(fx, 63 + (Math.random() - 0.5) * 20, 63 + (Math.random() - 0.5) * 20); }, 80 + w * 120);
    for (let i = 0; i < 4; i++) setTimeout(() => se(c, 12, 1.5), 200 + i * 80);
    setTimeout(() => pp(20, pcx, pcy), 400);

    const three = tRef.current; if (!three) return;
    const g = three.g, pos = g.attributes.position, idx = g.index!;
    const vc = idx.count;
    const groups: number[][] = [], assigned = new Uint8Array(vc / 3);
    [12, 6, 3].forEach((gs, i) => {
      const gc = i === 0 ? 8 : i === 1 ? 15 : 30;
      for (let g2 = 0; g2 < gc; g2++) {
        let seed = -1;
        for (let j = 0; j < vc / 3; j++) { if (!assigned[j]) { seed = j; break; } }
        if (seed === -1) break;
        const grp: number[] = [], q = [seed], vis = new Set<number>();
        while (q.length > 0 && grp.length < gs) {
          const fi = q.shift()!;
          if (vis.has(fi)) continue;
          vis.add(fi); assigned[fi] = 1; grp.push(fi);
          const a0 = idx.getX(fi * 3), a1 = idx.getX(fi * 3 + 1), a2 = idx.getX(fi * 3 + 2);
          for (let j = 0; j < vc / 3; j++) {
            if (assigned[j]) continue;
            const b0 = idx.getX(j * 3), b1 = idx.getX(j * 3 + 1), b2 = idx.getX(j * 3 + 2);
            if ([a0, a1, a2].filter(v => v === b0 || v === b1 || v === b2).length >= 2) q.push(j);
          }
        }
        if (grp.length > 0) groups.push(grp);
      }
    });
    for (let i = 0; i < vc / 3; i++) if (!assigned[i]) groups.push([i]);

    three.s.remove(three.mesh);
    const tex = three.t;
    const frags3D: { mesh: THREE.Mesh; vel: THREE.Vector3; rot: THREE.Vector3 }[] = [];
    const uvA = g.attributes.uv;

    groups.forEach(fids => {
      const verts: number[] = [], uvs: number[] = [];
      fids.forEach(fi => {
        for (let v = 0; v < 3; v++) {
          const vi = idx.getX(fi * 3 + v);
          verts.push(pos.getX(vi), pos.getY(vi), pos.getZ(vi));
          uvs.push(uvA.getX(vi), uvA.getY(vi));
        }
      });
      const fg = new THREE.BufferGeometry();
      fg.setAttribute("position", new THREE.Float32BufferAttribute(verts, 3));
      fg.setAttribute("uv", new THREE.Float32BufferAttribute(uvs, 2));
      fg.computeVertexNormals();
      const fm = new THREE.MeshBasicMaterial({ map: tex, side: THREE.DoubleSide });
      const fmesh = new THREE.Mesh(fg, fm);
      const cc = new THREE.Vector3();
      for (let v = 0; v < verts.length; v += 3) {
        cc.x += verts[v]; cc.y += verts[v + 1]; cc.z += verts[v + 2];
      }
      cc.divideScalar(verts.length / 3);
      frags3D.push({
        mesh: fmesh,
        vel: cc.clone().normalize().multiplyScalar(1.5 + Math.random() * 3),
        rot: new THREE.Vector3((Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1, (Math.random() - 0.5) * 0.1),
      });
      three.s.add(fmesh);
    });

    const st = Date.now(), dur = 2000;
    function af() {
      const t = Math.min(1, (Date.now() - st) / dur);
      const et = 1 - Math.pow(1 - t, 3);
      frags3D.forEach(f => {
        f.mesh.position.copy(f.vel.clone().multiplyScalar(et * RADIUS * 2.5));
        f.mesh.rotation.x += f.rot.x;
        f.mesh.rotation.y += f.rot.y;
        f.mesh.rotation.z += f.rot.z;
      });
      if (t < 1) requestAnimationFrame(af);
    }
    af();
    setTimeout(() => setPhase("rebuilding"), 2200);
  }, [phase]);

  useEffect(() => {
    if (phase !== "rebuilding") return;
    const three = tRef.current; if (!three) return;
    for (const child of three.s.children.slice()) {
      if (child !== three.mesh) {
        three.s.remove(child);
        if (child instanceof THREE.Mesh) {
          child.geometry.dispose();
          (child.material as THREE.Material).dispose();
        }
      }
    }
    const ng = new THREE.SphereGeometry(RADIUS, 48, 48);
    three.mesh.geometry.dispose();
    three.mesh.geometry = ng;
    three.s.add(three.mesh);
    setTimeout(() => {
      if (flr.current) animate(flr.current, { opacity: [0, 0.3, 0], duration: 500, ease: "out(3)" });
      setDmg(0); setPhase("idle");
    }, 800);
  }, [phase]);

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
        d.style.cssText = `position:absolute;border-radius:50%;pointer-events:none;width:${s}px;height:${s}px;background:${c.color};box-shadow:0 0 ${s * 4}px ${s * 1.5}px ${c.color};left:50%;top:50%;transition:opacity .25s;`;
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

  useEffect(() => {
    const el = ar.current, sh = sr.current; if (!el || !sh) return;
    const fn = (e: MouseEvent) => {
      const r = el.getBoundingClientRect(), cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.sqrt(dx * dx + dy * dy);
      if (d < 200) {
        const t = 1 - d / 200;
        sh.style.background = `radial-gradient(ellipse at ${50 + (dx / (d || 1)) * 20 * t}% ${50 + (dy / (d || 1)) * 16 * t}%, rgba(255,255,255,0.7) 0%, rgba(255,255,255,0.2) 25%, rgba(255,255,255,0.03) 55%, transparent 72%)`;
        sh.style.opacity = "1";
      }
    };
    window.addEventListener("mousemove", fn);
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
        <canvas ref={cr} width={SIZE} height={SIZE} className="rounded-full pointer-events-none"
          style={{ width: SIZE, height: SIZE, clipPath: "circle(50%)", zIndex: 2 }} />
        {dmg > 0 && phase === "idle" && (
          <svg viewBox={`0 0 ${SIZE} ${SIZE}`} className="absolute inset-0 h-full w-full pointer-events-none"
            style={{ clipPath: "circle(50%)", zIndex: 3 }}>
            {crackData.map((c, i) => (
              <path key={i} d={c.d} fill="none"
                stroke={`oklch(0.75 ${0.2 + gi * 0.15} ${40 - gi * 20} / ${0.3 + gi * 0.4})`}
                strokeWidth={c.w + 3} strokeLinecap="round" strokeLinejoin="round"
                style={{ filter: "blur(3px)" }} />
            ))}
            {crackData.map((c, i) => (
              <path key={`i-${i}`} d={c.d} fill="none"
                stroke={`oklch(0.95 0.15 ${50 - gi * 15} / ${0.5 + gi * 0.4})`}
                strokeWidth={c.w} strokeLinecap="round" strokeLinejoin="round" />
            ))}
          </svg>
        )}
        {dmg > 0 && phase === "idle" && (
          <div className="absolute inset-0 rounded-full pointer-events-none" style={{
            zIndex: 4,
            background: `radial-gradient(circle at 50% 50%, oklch(${0.7 + gi * 0.2} 0.3 ${55 - gi * 30} / ${0.1 + gi * 0.35}) 0%, transparent ${55 - gi * 18}%)`,
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
