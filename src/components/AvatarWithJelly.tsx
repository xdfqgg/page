import { useRef, useEffect, useCallback } from "react";
import { animate } from "animejs";

// ── 配置 ──────────────────────────────────────────

const SZ = 126; // 头像尺寸（px）
const TILT_MAX = 18; // 3D 凝视最大倾斜角度（度）

/** 单条轨道光环的配置 */
interface RingConfig {
  rx: number;   // 椭圆 X 半径（px）
  ry: number;   // 椭圆 Y 半径（px）
  sp: number;   // 转速系数（正=顺时针，负=逆时针，绝对值决定速度）
  c: string;    // 粒子颜色（CSS 色值）
  n: number;    // 粒子数量
  sz: number;   // 粒子尺寸（px）
  ri: string;   // 轨道光环颜色
}

/** 四条椭圆轨道，共同形成围绕头像的粒子光环系统 */
const RINGS: RingConfig[] = [
  { rx: 90, ry: 36, sp: 0.35, c: "oklch(0.72 0.2 85 / 0.7)", n: 12, sz: 2.5, ri: "oklch(0.72 0.2 85 / 0.12)" },
  { rx: 80, ry: 30, sp: -0.3, c: "oklch(0.63 0.15 20 / 0.55)", n: 8, sz: 2, ri: "oklch(0.63 0.15 20 / 0.08)" },
  { rx: 96, ry: 28, sp: 0.5, c: "rgba(255,255,255,0.4)", n: 6, sz: 2, ri: "rgba(255,255,255,0.06)" },
  { rx: 84, ry: 40, sp: -0.45, c: "oklch(0.68 0.18 50 / 0.5)", n: 8, sz: 2.5, ri: "oklch(0.68 0.18 50 / 0.1)" },
];

/** 涟漪参数 */
interface RippleParams {
  size: number;       // 涟漪直径（px）
  scale: [number, number]; // [起始, 结束]
  opacity: [number, number];
  duration: number;   // 动画时长（ms）
  delay: number;      // 延迟（ms）
  borderColor: string;
  boxShadow: string;
  zIndex: number;
}

// ── 工具函数 ──────────────────────────────────────

/**
 * 创建一个涟漪元素并播放扩散动画
 * @returns 自动清理的 DOM 元素（动画结束后自删）
 */
function createRipple(x: number, y: number, p: RippleParams): void {
  const el = document.createElement("div");
  el.style.cssText = `
    position:fixed; left:${x - p.size / 2}px; top:${y - p.size / 2}px;
    width:${p.size}px; height:${p.size}px; border-radius:50%;
    pointer-events:none;
    border:1px solid ${p.borderColor};
    box-shadow:${p.boxShadow};
    z-index:${p.zIndex};
  `;
  document.body.appendChild(el);

  animate(el, {
    scale: p.scale,
    opacity: p.opacity,
    duration: p.duration,
    delay: p.delay,
    ease: "out(3)",
    onComplete: () => el.remove(),
  });
}

// ── 粒子 ──────────────────────────────────────────

interface Particle {
  el: HTMLElement;
  rx: number;
  ry: number;
  sp: number;
  o: number;    // 初始相位角（弧度）
  f: boolean;    // 防抖标记（防止频繁 DOM 移动）
}

// ── 组件 ──────────────────────────────────────────

/**
 * AvatarWithJelly — 交互式头像
 *
 * 三种交互：
 *   1. 鼠标追踪 — 头像随光标位置 3D 倾斜（perspective rotate）
 *   2. 点击涟漪 — 以点击位置为中心扩散两圈环形波纹，不破坏头像
 *   3. 轨道粒子 — 四条椭圆轨道匀速绕行 + 呼吸琥珀光晕（自动循环）
 */
export default function AvatarWithJelly() {
  const containerRef = useRef<HTMLDivElement>(null);
  const backRef = useRef<HTMLDivElement>(null);
  const frontRef = useRef<HTMLDivElement>(null);
  const avatarRef = useRef<HTMLDivElement>(null);

  const tiltRef = useRef({ x: 0, y: 0, tx: 0, ty: 0 });
  const hoverRef = useRef(0); // 0=光标远离, 1=光标贴近头像中心
  const rafRef = useRef(0);

  // ── 点击涟漪 ────────────────────────────────────
  const spawnRipple = useCallback((clientX: number, clientY: number) => {
    // 主圈（亮色描边 + 内外发光）
    createRipple(clientX, clientY, {
      size: 160,
      scale: [0.4, 2.2],
      opacity: [0.8, 0],
      duration: 800,
      delay: 0,
      borderColor: "oklch(0.75 0.22 80 / 0.7)",
      boxShadow: "0 0 20px 3px oklch(0.7 0.25 45 / 0.25), inset 0 0 20px 3px oklch(0.7 0.25 45 / 0.1)",
      zIndex: 100,
    });
    // 副圈（更淡、更大、更慢）
    createRipple(clientX, clientY, {
      size: 160,
      scale: [0.4, 2.8],
      opacity: [0.5, 0],
      duration: 1000,
      delay: 100,
      borderColor: "oklch(0.7 0.18 60 / 0.35)",
      boxShadow: "none",
      zIndex: 99,
    });
  }, []);

  // ── 鼠标追踪（凝视） ────────────────────────────
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const onMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // 鼠标相对于头像中心的偏移，归一化到 [-1, 1]
      const rx = (e.clientX - cx) / (rect.width / 2);
      const ry = (e.clientY - cy) / (rect.height / 2);
      tiltRef.current.tx = Math.max(-1, Math.min(1, rx));
      tiltRef.current.ty = Math.max(-1, Math.min(1, ry));
      // 光标到中心的距离 → 影响粒子速度
      const dist = Math.hypot(e.clientX - cx, e.clientY - cy);
      const maxDist = Math.hypot(rect.width, rect.height) / 2;
      hoverRef.current = Math.max(0, 1 - dist / maxDist);
    };

    const onLeave = () => {
      tiltRef.current.tx = 0;
      tiltRef.current.ty = 0;
      hoverRef.current = 0;
    };

    // rAF 循环：平滑插值倾斜角度
    const loop = () => {
      tiltRef.current.x += (tiltRef.current.tx - tiltRef.current.x) * 0.08;
      tiltRef.current.y += (tiltRef.current.ty - tiltRef.current.y) * 0.08;
      const av = avatarRef.current;
      if (av) {
        av.style.transform = `perspective(400px) rotateY(${tiltRef.current.x * TILT_MAX}deg) rotateX(${-tiltRef.current.y * TILT_MAX}deg)`;
      }
      rafRef.current = requestAnimationFrame(loop);
    };

    window.addEventListener("mousemove", onMove);
    container.addEventListener("mouseleave", onLeave);
    rafRef.current = requestAnimationFrame(loop);

    return () => {
      window.removeEventListener("mousemove", onMove);
      container.removeEventListener("mouseleave", onLeave);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  // ── 轨道粒子系统 ────────────────────────────────
  useEffect(() => {
    const bk = backRef.current;
    const f = frontRef.current;
    if (!bk || !f) return;

    // 绘制轨道光环（椭圆描边）
    const ringEls: HTMLElement[] = [];
    RINGS.forEach((c) => {
      const r = document.createElement("div");
      r.style.cssText = `
        position:absolute; border-radius:50%; pointer-events:none;
        width:${c.rx * 2}px; height:${c.ry * 2}px;
        left:50%; top:50%;
        margin-left:-${c.rx}px; margin-top:-${c.ry}px;
        border:1px solid ${c.ri};
      `;
      bk.appendChild(r);
      ringEls.push(r);
    });

    // 创建粒子（每个环上的发光点）
    const particles: Particle[] = [];
    RINGS.forEach((c) => {
      for (let i = 0; i < c.n; i++) {
        const d = document.createElement("div");
        d.style.cssText = `
          position:absolute; border-radius:50%; pointer-events:none;
          width:${c.sz}px; height:${c.sz}px;
          background:${c.c};
          box-shadow:0 0 ${c.sz * 3}px ${c.sz}px ${c.c};
          left:50%; top:50%;
          transition:opacity .25s;
          will-change:transform;
        `;
        bk.appendChild(d);
        particles.push({
          el: d, rx: c.rx, ry: c.ry, sp: c.sp,
          o: (i / c.n) * Math.PI * 2, f: false,
        });
      }
    });

    // 动画循环：粒子沿椭圆轨道运动
    const drv = { a: 0 };
    const anim = animate(drv, {
      a: Math.PI * 2,
      duration: 35000,
      ease: "linear",
      loop: true,
      onUpdate: () => {
        particles.forEach((d) => {
          const ang = drv.a * d.sp + d.o;
          const ca = Math.cos(ang);
          d.el.style.translate = `${ca * d.rx}px ${Math.sin(ang) * d.ry}px`;
          // 深度感：椭圆前半部分粒子移到 frontRef（z-index: 10），后半部分在 backRef（z-index: 0）
          const inFront = ca > 0.05;
          if (inFront && d.el.parentElement === bk && !d.f) {
            d.f = true;
            d.el.style.opacity = "0";
            setTimeout(() => { f.appendChild(d.el); d.el.style.opacity = ""; d.f = false; }, 250);
          } else if (!inFront && d.el.parentElement === f && !d.f) {
            d.f = true;
            d.el.style.opacity = "0";
            setTimeout(() => { bk.appendChild(d.el); d.el.style.opacity = ""; d.f = false; }, 250);
          }
        });
      },
    });

    return () => {
      anim.pause();
      particles.forEach((d) => d.el.remove());
      ringEls.forEach((r) => r.remove());
    };
  }, []);

  // ── 渲染 ────────────────────────────────────────
  return (
    <div
      ref={containerRef}
      className="relative mx-auto mb-10 flex items-center justify-center"
      style={{ width: 220, height: 220 }}
    >
      <style>{`
        @keyframes breathe-amber {
          0%, 100% { box-shadow: 0 0 20px 2px oklch(0.7 0.2 85 / 0.15), 0 0 50px 6px oklch(0.7 0.2 85 / 0.06); }
          50%      { box-shadow: 0 0 35px 10px oklch(0.7 0.2 85 / 0.3), 0 0 70px 18px oklch(0.7 0.2 85 / 0.12); }
        }
      `}</style>

      <div ref={backRef} className="absolute inset-0 z-0" />
      <div ref={frontRef} className="absolute inset-0 z-10 pointer-events-none" />

      <div
        ref={avatarRef}
        onClick={(e) => spawnRipple(e.clientX, e.clientY)}
        className="relative flex items-center justify-center rounded-full cursor-pointer select-none overflow-visible"
        style={{
          width: SZ,
          height: SZ,
          zIndex: 1,
          boxShadow: "0 0 25px 4px oklch(0.7 0.2 85/0.2), 0 0 60px 10px oklch(0.7 0.2 85/0.08)",
          animation: "breathe-amber 3s ease-in-out infinite",
          transition: "transform 0.05s linear",
        }}
        role="img"
        aria-label="avatar"
      >
        <img
          src={import.meta.env.BASE_URL + "avatar.png"}
          alt=""
          className="h-full w-full rounded-full object-cover pointer-events-none"
          draggable={false}
          style={{ clipPath: "circle(50%)" }}
        />
      </div>
    </div>
  );
}
