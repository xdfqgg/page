import { useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { animate } from "animejs";
import AvatarWithJelly from "@/components/AvatarWithJelly";

/**
 * Hero — 首页展示区
 *
 * 头像特效（三层叠加，全部以 translate(-50%, -50%) 统一居中）：
 *   🟠 呼吸光晕  — CSS animation，琥珀色阴影明暗交替（3s 周期）
 *   🟠 旋转渐变环 — CSS animation，conic-gradient 边框旋转（4s 一圈）
 *   🟠 粒子环绕  — animejs，8 个小光点以不同半径和速度绕头像旋转
 */

export default function Hero() {
  /* ================================================================
   *  粒子环绕（animejs）
   *
   *  原理：
   *    1. 创建一个虚拟对象 { angle: 0 }，animejs 驱动它从 0 到 2π
   *    2. onUpdate 中，每个粒子用 cos/sin 计算 x/y 位置
   *    3. 每个粒子有不同半径（60~84px）和速度（0.6~1.4x），错落有致
   *    4. loop: true 无限循环，角度到 2π 后无缝回到 0
   * ================================================================ */
  const avatarAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = avatarAreaRef.current;
    if (!container) return;

    // 创建 8 个粒子 DOM
    const COUNT = 8;
    const dots: HTMLDivElement[] = [];
    for (let i = 0; i < COUNT; i++) {
      const dot = document.createElement("div");
      dot.style.cssText = `
        position: absolute;
        left: 50%; top: 50%;
        width: 4px; height: 4px;
        border-radius: 50%;
        background: oklch(0.72 0.18 85);
        box-shadow: 0 0 4px 1px oklch(0.7 0.2 85 / 0.5);
        pointer-events: none;
        z-index: 0;
      `;
      container.appendChild(dot);
      dots.push(dot);
    }

    // 轨道参数：半径、起始角、速度
    const orbits = dots.map((_, i) => ({
      radius: 80 + Math.random() * 22,
      startAngle: (i / COUNT) * Math.PI * 2 + (Math.random() - 0.5) * 0.5,
      speed: 0.6 + Math.random() * 0.8,
    }));

    // 驱动对象
    const driver = { angle: 0 };
    const animation = animate(driver, {
      angle: Math.PI * 2,
      duration: 6000,
      ease: "linear",
      loop: true,
      onUpdate: () => {
        dots.forEach((dot, i) => {
          const { radius, startAngle, speed } = orbits[i];
          const a = startAngle + driver.angle * speed;
          dot.style.translate = `${Math.cos(a) * radius}px ${Math.sin(a) * radius}px`;
        });
      },
    });

    return () => {
      animation.pause();
      dots.forEach((d) => d.remove());
    };
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* ─── 注入 CSS keyframes ─── */}
      <style>{`
        /* 呼吸光晕：只改变 box-shadow，不碰 transform */
        @keyframes breathe-amber {
          0%, 100% {
            box-shadow:
              0 0 20px 2px oklch(0.7 0.2 85 / 0.15),
              0 0 50px 6px oklch(0.7 0.2 85 / 0.06);
          }
          50% {
            box-shadow:
              0 0 35px 10px oklch(0.7 0.2 85 / 0.3),
              0 0 70px 18px oklch(0.7 0.2 85 / 0.12);
          }
        }
        /* 旋转环：translate(-50%, -50%) 居中 + rotate 旋转 */
        @keyframes spin-ring {
          from { transform: translate(-50%, -50%) rotate(0deg); }
          to   { transform: translate(-50%, -50%) rotate(360deg); }
        }
        /* 向下引导箭头：上下弹跳 */
        @keyframes bounce-down {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50%      { transform: translateY(8px); opacity: 0.8; }
        }
      `}</style>

      {/* 背景点阵 */}
      <div
        className="absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "radial-gradient(circle, rgba(251,191,36,0.6) 1px, transparent 1px)",
          backgroundSize: "24px 24px",
        }}
        aria-hidden="true"
      />

      <div className="relative mx-auto max-w-5xl px-6 pb-20 pt-24 text-center">
        {/* ================================================================
            头像区域
            三层都使用 left: 50%; top: 50%; transform: translate(-50%, -50%)
            作为统一的居中方式，确保完全对齐
            ================================================================ */}

        <div
          ref={avatarAreaRef}
          className="relative mx-auto mb-10"
          style={{ width: 180, height: 180 }}
        >
          {/* 层 1：旋转渐变环 —— keyframe 自带 translate(-50%,-50%) */}
          <div
            className="absolute left-1/2 top-1/2 rounded-full"
            style={{
              width: 168,
              height: 168,
              background: `
                conic-gradient(
                  from 0deg,
                  oklch(0.7 0.2 85 / 0.4),
                  oklch(0.65 0.15 85 / 0.05) 25%,
                  oklch(0.7 0.2 85 / 0.4) 50%,
                  oklch(0.65 0.15 85 / 0.05) 75%,
                  oklch(0.7 0.2 85 / 0.4)
                )
              `,
              maskImage: "radial-gradient(circle, transparent 58%, black 60%)",
              WebkitMaskImage:
                "radial-gradient(circle, transparent 58%, black 60%)",
              animation: "spin-ring 4s linear infinite",
            }}
            aria-hidden="true"
          />

          {/* 层 2：头像（自带居中 + 拖拽 + 果冻 + 涟漪） */}
          <AvatarWithJelly />

          {/* 层 3：粒子 —— animejs 动态创建并驱动，left:50%;top:50% + translate 偏移 */}
        </div>

        {/* ─── Slogan ─── */}
        <h1 className="text-5xl font-extrabold tracking-tight sm:text-6xl">
         XDFQ
        </h1>

        {/* ─── 简介 ─── */}
        <p className="mx-auto mt-5 max-w-lg text-lg text-muted-foreground">
          这里会热闹起来的!!!!
        </p>

        {/* ─── 向下滚动引导 ─── */}
        <button
          onClick={() => {
            // 平滑滚动到下一个 Section（FeatureGrid）
            const next = document.querySelector("#feature-grid");
            if (next) {
              next.scrollIntoView({ behavior: "smooth" });
            }
          }}
          className="mx-auto mt-16 flex flex-col items-center gap-1 text-muted-foreground/40 hover:text-primary transition-colors cursor-pointer"
          aria-label="向下滚动"
        >
          <span className="text-xs tracking-widest uppercase">Scroll</span>
          <ChevronDown
            className="h-5 w-5"
            style={{ animation: "bounce-down 2s ease-in-out infinite" }}
          />
        </button>
      </div>
    </section>
  );
}
