import { useEffect, useRef } from "react";
import { animate } from "animejs";

/**
 * SakuraPetals — 樱花飘落背景（深度景深版）
 *
 * 三层花瓣系统：
 *   - 远景（back）：模糊、小、慢 → 营造空间纵深感
 *   - 中景（mid）：正常、中等 → 主体花瓣
 *   - 近景（front）：清晰、大、快 → 仿佛从眼前掠过
 *
 * 额外效果：
 *   - 闪烁光点（sparkles）：模拟阳光穿透花瓣的微光
 *   - 微风摇曳（sway）：用 sin 波模拟左右摆动
 */

const rand = (min: number, max: number) => min + Math.random() * (max - min);

// ── 花瓣颜色 —— 从柔白渐变到樱花粉 ──
const COLORS = {
  front: [
    "rgba(255, 190, 200, 0.55)",
    "rgba(255, 175, 190, 0.5)",
    "rgba(255, 205, 215, 0.48)",
    "rgba(255, 160, 180, 0.52)",
  ],
  mid: [
    "rgba(255, 183, 197, 0.35)",
    "rgba(255, 200, 210, 0.3)",
    "rgba(255, 218, 228, 0.28)",
    "rgba(245, 170, 190, 0.33)",
  ],
  back: [
    "rgba(255, 195, 208, 0.18)",
    "rgba(255, 210, 220, 0.15)",
    "rgba(245, 185, 200, 0.16)",
  ],
} as const;

type Layer = "front" | "mid" | "back";

/** 单个花瓣的视觉参数 */
interface PetalConfig {
  layer: Layer;
  size: number;
  blur: number;     // CSS filter: blur() px 值
  duration: number;  // 飘落周期 ms（近景快、远景慢）
  opacity: number;
}

/** 生成花瓣配置 */
function pickPetal(): PetalConfig {
  const r = Math.random();
  if (r < 0.2) {
    // 近景：清晰、大、快
    return { layer: "front", size: rand(16, 26), blur: 0, duration: rand(7000, 12000), opacity: rand(0.4, 0.6) };
  } else if (r < 0.7) {
    // 中景（主体）
    return { layer: "mid", size: rand(10, 18), blur: rand(0.5, 2), duration: rand(12000, 20000), opacity: rand(0.25, 0.4) };
  } else {
    // 远景：模糊、小、慢
    return { layer: "back", size: rand(6, 12), blur: rand(3, 6), duration: rand(20000, 30000), opacity: rand(0.12, 0.22) };
  }
}

// ── 组件 ──────────────────────────────────────────

export default function SakuraPetals() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const height = window.innerHeight;
    const petalAnims: ReturnType<typeof animate>[] = [];

    // ── 创建花瓣（55 片，分三个景深层） ──
    for (let i = 0; i < 55; i++) {
      const cfg = pickPetal();
      const petal = document.createElement("div");
      const color = COLORS[cfg.layer][Math.floor(Math.random() * COLORS[cfg.layer].length)];

      // 花瓣形状：不规则椭圆（模拟真实樱花花瓣的顶部缺刻）
      const asymmetryY = rand(0.25, 0.65);
      petal.style.cssText = `
        position: absolute;
        top: 0;
        left: ${rand(0, 100)}%;
        width: ${cfg.size}px;
        height: ${cfg.size * asymmetryY}px;
        border-radius: ${rand(50, 90)}% ${rand(5, 20)}% ${rand(15, 40)}% ${rand(25, 55)}%;
        background: ${color};
        filter: blur(${cfg.blur}px);
        opacity: ${cfg.opacity};
        pointer-events: none;
        will-change: transform;
        translate: 0 ${rand(-120, -20)}px;
      `;

      container.appendChild(petal);

      // 每片花瓣独立飘落动画 —— 含微风摇曳
      const startY = -120;
      const endY = height + 80;
      const swayAmp = rand(15, 50);  // 左右摇曳幅度
      const swayFreq = rand(0.3, 0.8); // 摇曳频率
      const rotation = rand(-180, 180);
      const delay = rand(0, 15000);

      // 用 animejs 驱动旋转 + 进度，位置在 onUpdate 中手动计算（含微风摇曳）
      const petalState = { progress: 0 };
      const anim = animate(petalState, {
        progress: 100,
        duration: cfg.duration,
        delay,
        ease: "linear",
        loop: true,
        onUpdate: () => {
          const p = petalState.progress / 100; // 0 → 1 线性
          const baseY = startY + (endY - startY) * p;
          // 微风摇曳：sin 波水平偏移，越往下散得越开
          const t = Date.now() / 1000;
          const sway = Math.sin(t * swayFreq + i) * swayAmp;
          const xOff = sway * p;
          petal.style.translate = `${xOff}px ${baseY}px`;
          // 旋转独立计算
          petal.style.rotate = `${rotation * Math.sin(p * Math.PI)}deg`;
        },
      });
      petalAnims.push(anim);
    }

    // ── 闪烁光点（阳光穿过花瓣） ──
    const sparkles: HTMLDivElement[] = [];
    for (let i = 0; i < 8; i++) {
      const spark = document.createElement("div");
      const size = rand(2, 4);
      spark.style.cssText = `
        position: absolute;
        top: ${rand(10, 90)}%;
        left: ${rand(5, 95)}%;
        width: ${size}px;
        height: ${size}px;
        border-radius: 50%;
        background: rgba(255, 240, 220, 0.7);
        box-shadow: 0 0 ${size * 3}px ${size}px rgba(255, 230, 200, 0.5);
        pointer-events: none;
        opacity: 0;
      `;
      container.appendChild(spark);
      sparkles.push(spark);

      // 循环闪烁
      const twinkle = () => {
        animate(spark, {
          opacity: [0, rand(0.3, 0.7), 0],
          scale: [0.5, 1.2, 0.3],
          duration: rand(1500, 3500),
          ease: "inOut(2)",
          onComplete: () => {
            // 随机间隔再闪
            setTimeout(twinkle, rand(1000, 5000));
          },
        });
      };
      setTimeout(twinkle, rand(0, 4000));
    }

    return () => {
      petalAnims.forEach((a) => a.pause());
      sparkles.forEach((s) => s.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none fixed inset-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
