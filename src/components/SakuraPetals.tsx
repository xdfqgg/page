import { useEffect, useRef } from "react";
import { animate } from "animejs";

/**
 * SakuraPetals — 樱花飘落背景
 *
 * 粉白色半透明花瓣，absolute 定位在页面内容区内，
 * 跟随页面滚动，不固定在屏幕上。
 */

const PETAL_COUNT = 25;

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export default function SakuraPetals() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    // 容器高度 = 页面内容实际高度
    const height = container.scrollHeight || window.innerHeight;
    const petals: HTMLDivElement[] = [];

    // ─── 创建花瓣 ───
    for (let i = 0; i < PETAL_COUNT; i++) {
      const petal = document.createElement("div");
      const size = rand(10, 18);

      const colors = [
        "rgba(255, 183, 197, 0.4)",
        "rgba(255, 200, 210, 0.35)",
        "rgba(255, 218, 228, 0.3)",
        "rgba(255, 190, 200, 0.38)",
      ];
      const color = colors[Math.floor(Math.random() * colors.length)];

      petal.style.cssText = `
        position: absolute;
        top: 0;
        left: ${rand(0, 100)}%;
        width: ${size}px;
        height: ${size * 0.7}px;
        border-radius: ${rand(40, 80)}% ${rand(10, 30)}% ${rand(20, 50)}% ${rand(30, 60)}%;
        background: ${color};
        box-shadow: 0 0 3px rgba(255, 183, 197, 0.2);
        pointer-events: none;
        z-index: 0;
        will-change: transform;
        translate: 0 ${rand(-80, -20)}px;
      `;

      container.appendChild(petal);
      petals.push(petal);
    }

    // ─── 每个花瓣独立动画 ───
    petals.forEach((petal) => {
      const duration = rand(10000, 22000);
      const drift = rand(-40, 40);
      const rotation = rand(-120, 120);
      const delay = rand(0, 12000);
      // 起始位置已经用 translate 设置在顶部上方
      const startY = parseFloat(petal.style.translate.split(" ")[1]) || -40;
      const endY = height + 60; // 掉到容器底部以下

      animate(petal, {
        translateY: [startY, endY],
        translateX: [0, drift, -drift * 0.6, drift * 0.3, 0],
        rotate: [0, rotation * 0.4, rotation, rotation * 0.5, 0],
        duration,
        delay,
        ease: "linear",
        loop: true,
      });
    });

    return () => {
      petals.forEach((p) => p.remove());
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="pointer-events-none absolute inset-0 overflow-hidden"
      aria-hidden="true"
    />
  );
}
