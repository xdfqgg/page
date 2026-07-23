import { useRef, useEffect, useCallback, useMemo } from "react";
import { animate } from "animejs";

/* ─── 光环配置 ─── */
const RINGS = [
  { rx: 90, ry: 36, speed: 0.35, color: "oklch(0.72 0.2 85 / 0.7)", count: 12, size: 2.5, ring: "oklch(0.72 0.2 85 / 0.12)" },
  { rx: 80, ry: 30, speed: -0.3, color: "oklch(0.63 0.15 20 / 0.55)", count: 8, size: 2, ring: "oklch(0.63 0.15 20 / 0.08)" },
  { rx: 96, ry: 28, speed: 0.5, color: "rgba(255,255,255,0.4)", count: 6, size: 2, ring: "rgba(255,255,255,0.06)" },
  { rx: 84, ry: 40, speed: -0.45, color: "oklch(0.68 0.18 50 / 0.5)", count: 8, size: 2.5, ring: "oklch(0.68 0.18 50 / 0.1)" },
];

/**
 * 简化的沃罗诺伊图生成（Fortune算法太复杂，用暴力法替代）
 * 在 100x100 区域内生成种子点，用暴力法计算每个像素归属
 * 返回每个细胞的边界多边形（简化版：凸包近似）
 */
function generateVoronoi(seeds: number, size: number): string[] {
  // 生成随机种子点（在中心更密集，模拟撞击点）
  const pts: { x: number; y: number }[] = [];
  for (let i = 0; i < seeds; i++) {
    // 用极坐标使种子分布更像"撞击 + 裂纹"
    const angle = Math.random() * Math.PI * 2;
    const dist = Math.pow(Math.random(), 0.6) * size * 0.48; // 中心更密
    pts.push({
      x: size / 2 + Math.cos(angle) * dist,
      y: size / 2 + Math.sin(angle) * dist,
    });
  }

  // 为每个种子生成近似细胞多边形
  // 方法：对每个种子，找到它和邻近种子之间的中垂线，构造凸多边形
  return pts.map((seed, i) => {
    // 找到最近的 8 个邻居
    const neighbors = pts
      .map((p, j) => ({ ...p, j, dist: Math.hypot(p.x - seed.x, p.y - seed.y) }))
      .filter((n) => n.j !== i)
      .sort((a, b) => a.dist - b.dist)
      .slice(0, 8);

    // 对每个邻居计算中垂线，与边界相交得到多边形顶点
    const vertices: { x: number; y: number }[] = [];

    for (let k = 0; k < neighbors.length; k++) {
      const n = neighbors[k];
      const next = neighbors[(k + 1) % neighbors.length];
      const mid = { x: (seed.x + n.x) / 2, y: (seed.y + n.y) / 2 };
      // 与下一个邻居的中垂线交点
      const mid2 = { x: (seed.x + next.x) / 2, y: (seed.y + next.y) / 2 };
      const dx = n.y - seed.y;
      const dy = -(n.x - seed.x);
      const dx2 = next.y - seed.y;
      const dy2 = -(next.x - seed.x);

      // 两条中垂线的交点
      const det = dx * dy2 - dy * dx2;
      if (Math.abs(det) < 0.001) {
        // 近似平行，用两中点的中点
        vertices.push({ x: (mid.x + mid2.x) / 2, y: (mid.y + mid2.y) / 2 });
        continue;
      }
      const t = ((mid2.x - mid.x) * dy2 - (mid2.y - mid.y) * dx2) / det;
      vertices.push({
        x: mid.x + t * dx,
        y: mid.y + t * dy,
      });
    }

    // 裁剪到边界内并转换为 polygon 字符串
    const clamped = vertices
      .map((v) => ({
        x: Math.max(0, Math.min(size, v.x)),
        y: Math.max(0, Math.min(size, v.y)),
      }))
      .map((v) => `${(v.x / size) * 100}% ${(v.y / size) * 100}%`);

    return `polygon(${clamped.join(", ")})`;
  });
}

export default function AvatarWithJelly() {
  const fragsRef = useRef<HTMLDivElement[]>([]);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);

  // 生成沃罗诺伊碎片（挂载时计算一次）
  const frags = useMemo(() => generateVoronoi(22, 120), []);

  /* ─── 光环 ─── */
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

  /* ─── 微呼吸 ─── */
  useEffect(() => {
    fragsRef.current.forEach((el) => {
      animate(el, {
        translateX: [0, (Math.random() - .5) * 1.2, 0, (Math.random() - .5) * 1.2, 0],
        translateY: [0, (Math.random() - .5) * 1.2, 0, (Math.random() - .5) * 1.2, 0],
        rotate: [0, (Math.random() - .5) * 0.6, 0, (Math.random() - .5) * 0.6, 0],
        duration: 4000 + Math.random() * 3000,
        delay: Math.random() * 4000,
        ease: "inOut(2)",
        loop: true,
      });
    });
  }, []);

  /* ─── 点击波纹 ─── */
  const handleClick = useCallback((e: React.MouseEvent) => {
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    const cx = e.clientX - rect.left, cy = e.clientY - rect.top, center = rect.width / 2;
    fragsRef.current
      .map((el) => {
        const fr = el.getBoundingClientRect();
        return { el, dist: Math.hypot(fr.left + fr.width / 2 - rect.left - cx, fr.top + fr.height / 2 - rect.top - cy) };
      })
      .sort((a, b) => a.dist - b.dist)
      .forEach(({ el, dist }) => {
        const t = Math.max(0, 1 - dist / 100);
        const angle = Math.atan2(cy - center, cx - center);
        animate(el, {
          translateX: [0, Math.cos(angle) * 5 * t, -Math.cos(angle) * 2 * t, 0],
          translateY: [0, Math.sin(angle) * 5 * t, -Math.sin(angle) * 2 * t, 0],
          rotate: [0, (Math.random() - .5) * 3 * t, 0],
          duration: 500 + t * 300, delay: dist * 3, ease: "out(3)",
        });
      });
  }, []);

  return (
    <div className="relative mx-auto mb-10 flex items-center justify-center" style={{ width: 220, height: 220 }}>
      <div ref={backRef} className="absolute inset-0 z-0" />
      <div
        className="relative cursor-pointer select-none overflow-hidden rounded-full"
        style={{ width: 126, height: 126, zIndex: 1, boxShadow: "inset 0 0 2px oklch(0.7 0.15 85 / 0.4)" }}
        onClick={handleClick}
        role="img" aria-label="头像"
      >
        {frags.map((clip, i) => (
          <div
            key={i}
            ref={(el) => { if (el) fragsRef.current[i] = el; }}
            className="absolute"
            style={{
              clipPath: clip, inset: -1,
              backgroundImage: `url(${import.meta.env.BASE_URL}avatar.png)`,
              backgroundSize: "cover", backgroundPosition: "center",
            }}
          />
        ))}
      </div>
      <div ref={frontRef} className="absolute inset-0" style={{ zIndex: 3 }} />
    </div>
  );
}
