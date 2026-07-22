import { useRef, useState } from "react";
import { animate, type JSAnimation } from "animejs";
import { Button } from "@/components/ui/button";

/**
 * AnimeDemo — animejs v4 教学页面
 *
 * ============================================================
 *   animejs 是什么？
 * ============================================================
 *
 * animejs 是一个轻量级的 JS 动画引擎。它做的事情很简单：
 *   给定一个 HTML 元素 + 目标属性值 + 时间，
 *   它会在每一帧自动计算中间值，平滑地"补间"过去。
 *
 *   比如你要把一个方块从 x=0 移动到 x=200：
 *     animate('.box', { translateX: 200, duration: 1000 })
 *   animejs 会自动在 1 秒内，每帧计算方块应该在的位置，形成流畅动画。
 *
 *   CSS transition 也能做，但 animejs 更强的是：
 *     - 可以控制时间线（timeline）：多个动画排队
 *     - 可以 stagger（错开）：10 个元素逐个出现
 *     - 可以暂停/恢复/完成/反转
 *     - 支持 SVG 动画、文字动画、滚动驱动等
 *
 * ============================================================
 *   animejs v3 vs v4
 * ============================================================
 *
 * v3 语法（旧）:
 *   anime({ targets: '.box', translateX: 200, duration: 1000 })
 *
 * v4 语法（新，我们用的这个）:
 *   animate('.box', { translateX: 200, duration: 1000 })
 *
 *   变化：targets 变成了第一个参数，不再包在对象里。
 */

export default function AnimeDemo() {
  return (
    <div className="space-y-12 py-4">
      <header className="text-center space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">
          animejs v4 教学演示
        </h1>
        <p className="text-muted-foreground">
          每个 Demo 独立运行，点击按钮触发动画
        </p>
      </header>

      <DemoBasic />
      <DemoStagger />
      <DemoEasing />
      <DemoControl />
    </div>
  );
}

/* ================================================================
   Demo 1：基础动画 —— 移动、旋转、缩放、透明度
   ================================================================ */

function DemoBasic() {
  // useRef 用来获取 DOM 元素的引用（不触发重新渲染）
  const boxRef = useRef<HTMLDivElement>(null);

  const play = () => {
    if (!boxRef.current) return;

    /**
     * animate(targets, parameters)
     *
     * targets  — 要动画的元素（CSS 选择器字符串 或 DOM 元素 或 Ref）
     * parameters — 描述动画的目标属性和选项
     *
     * 常用属性（数值型）：
     *   translateX / translateY  — 位移（px）
     *   rotate                    — 旋转（deg）
     *   scale                     — 缩放（1 = 原始大小）
     *   opacity                   — 透明度（0~1）
     *
     * 常用选项：
     *   duration  — 持续时间（毫秒），默认 1000
     *   ease      — 缓动函数，默认 "out(2)"（即 easeOutQuad）
     *   delay     — 延迟开始（毫秒）
     */
    animate(boxRef.current, {
      // 先在 500ms 内移过去...
      translateX: 200,
      rotate: 180,
      scale: 1.5,
      duration: 500,
    });
  };

  const reset = () => {
    if (!boxRef.current) return;
    // 恢复原位（duration: 0 是瞬间设置，不加动画，但 v4 可能需要 0）
    animate(boxRef.current, {
      translateX: 0,
      rotate: 0,
      scale: 1,
      duration: 300,
    });
  };

  return (
    <section className="border rounded-lg p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Demo 1：基础属性动画</h2>
        <p className="text-sm text-muted-foreground mt-1">
          同时改变方块的位置（translateX）、旋转（rotate）和缩放（scale）
        </p>
      </div>

      {/* 动画舞台 */}
      <div className="h-24 bg-muted/50 rounded-md relative flex items-center">
        <div
          ref={boxRef}
          className="w-16 h-16 bg-primary rounded-md flex items-center justify-center text-primary-foreground text-xs font-medium"
        >
          方块
        </div>
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={play}>
          播放动画
        </Button>
        <Button size="sm" variant="outline" onClick={reset}>
          复位
        </Button>
      </div>

      {/* 代码块 */}
      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          查看代码
        </summary>
        <pre className="mt-2 bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`// 核心 API：animate(目标元素, { 属性: 目标值, duration: 时长 })
animate(boxRef.current, {
  translateX: 200,  // 向右移动 200px
  rotate: 180,      // 旋转 180 度
  scale: 1.5,       // 放大到 1.5 倍
  duration: 500,    // 持续 500 毫秒
});`}
        </pre>
      </details>
    </section>
  );
}

/* ================================================================
   Demo 2：Stagger — 错开动画（让多个元素排队出现）
   ================================================================ */

function DemoStagger() {
  const containerRef = useRef<HTMLDivElement>(null);

  const play = () => {
    if (!containerRef.current) return;

    /**
     * stagger 是 animejs 最常用的高级功能：
     *   给多个元素同时调用 animate，但每个元素的动画延迟启动
     *   结果就是：元素们逐个登场，而不是一起出现
     *
     * 参数：
     *   stagger: 每个元素之间的延迟（毫秒）
     *     - 正数 如 50 → 每个比前一个晚 50ms 开始
     *     - 还可以是函数，根据 index 动态计算延迟
     *
     * 这里用 CSS 选择器 '.stagger-item' 一次性选中所有子元素
     */
    animate(".stagger-item", {
      // 从下方 30px + 完全透明 → 原位 + 完全不透明
      translateY: [30, 0], // [起始值, 结束值]
      opacity: [0, 1],
      duration: 400,
      ease: "out(3)", // easeOutCubic
      // stagger 让他们逐个出现
      stagger: 80, // 每个元素比前一个晚 80ms
    });
  };

  const reset = () => {
    if (!containerRef.current) return;
    animate(".stagger-item", {
      translateY: 30,
      opacity: 0,
      duration: 200,
    });
  };

  // 生成演示用的彩色方块
  const ITEMS = ["第一项", "第二项", "第三项", "第四项", "第五项"];
  const COLORS = [
    "bg-blue-500",
    "bg-green-500",
    "bg-yellow-500",
    "bg-orange-500",
    "bg-red-500",
  ];

  return (
    <section className="border rounded-lg p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Demo 2：Stagger（错开动画）</h2>
        <p className="text-sm text-muted-foreground mt-1">
          5 个元素使用 stagger 逐个出现，每个比前一个延迟 80ms
        </p>
      </div>

      <div ref={containerRef} className="flex gap-2 flex-wrap">
        {ITEMS.map((text, i) => (
          <div
            key={i}
            className={`stagger-item ${COLORS[i]} text-white px-4 py-2 rounded-md text-sm font-medium opacity-0`}
            style={{ transform: "translateY(30px)" }}
          >
            {text}
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={play}>
          播放动画
        </Button>
        <Button size="sm" variant="outline" onClick={reset}>
          复位
        </Button>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          查看代码
        </summary>
        <pre className="mt-2 bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`// CSS 选择器一次性选中所有子元素
animate('.stagger-item', {
  translateY: [30, 0],  // [起始值, 结束值]（从下方 30px 回到原位）
  opacity: [0, 1],      // [起始值, 结束值]（从透明到不透明）
  duration: 400,
  ease: 'out(3)',       // easeOutCubic 缓动
  stagger: 80,          // 🔑 每个元素延迟 80ms → 逐个出现
});`}
        </pre>
      </details>
    </section>
  );
}

/* ================================================================
   Demo 3：Easing — 缓动函数对比
   ================================================================ */

function DemoEasing() {
  const trackRef = useRef<HTMLDivElement>(null);

  /**
   * 缓动（easing）决定了动画的"节奏感"：
   *   - linear: 匀速，从头到尾一样快（机械感）
   *   - out: 开头快、结尾慢（最常用，自然感）
   *   - in: 开头慢、结尾快
   *   - inOut: 开头慢、中间快、结尾慢（适合循环动画）
   *   - elastic/spring: 弹跳感
   *
   * animejs v4 的 ease 可以用字符串简写：
   *   "out(2)" = easeOutQuad
   *   "out(3)" = easeOutCubic
   *   "inOut(2)" = easeInOutQuad
   */
  const playAll = () => {
    // 每个圆点单独调用 animate，使用不同的 ease
    const items = document.querySelectorAll<HTMLElement>(".ease-item");
    items.forEach((el) => {
      const easeName = el.dataset.ease || "out(1)";
      animate(el, {
        translateX: 320,
        duration: 2000,
        ease: easeName,
      });
    });
  };

  const resetAll = () => {
    if (!trackRef.current) return;
    animate(".ease-item", {
      translateX: 0,
      duration: 300,
    });
  };

  // 演示用的缓动类型
  const EASE_LIST = [
    { name: "linear", label: "匀速", color: "bg-slate-500" },
    { name: "out(2)", label: "easeOut", color: "bg-blue-500" },
    { name: "in(2)", label: "easeIn", color: "bg-green-500" },
    { name: "inOut(2)", label: "easeInOut", color: "bg-purple-500" },
  ];

  return (
    <section className="border rounded-lg p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Demo 3：缓动函数对比</h2>
        <p className="text-sm text-muted-foreground mt-1">
          四个方块同时出发，但使用不同的缓动函数，注意观察运动节奏的差异
        </p>
      </div>

      <div ref={trackRef} className="space-y-3">
        {EASE_LIST.map((item) => (
          <div key={item.name} className="flex items-center gap-3">
            <span className="text-xs text-muted-foreground w-20 text-right">
              {item.label}
            </span>
            <div className="flex-1 h-8 bg-muted/50 rounded-md relative flex items-center">
              <div
                className={`ease-item ${item.color} w-6 h-6 rounded-full`}
                data-ease={item.name}
              />
            </div>
          </div>
        ))}
      </div>

      <div className="flex gap-2">
        <Button size="sm" onClick={playAll}>
          播放动画
        </Button>
        <Button size="sm" variant="outline" onClick={resetAll}>
          复位
        </Button>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          查看代码
        </summary>
        <pre className="mt-2 bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`// 四个元素使用不同的 ease
animate('.ease-item', {
  translateX: 320,
  duration: 1500,
  delay: (_, i) => i * 100,  // 稍微错开，便于观察
});
// 每个元素的 ease 在自己的 data-ease 属性或 animate 参数中指定`}
        </pre>
      </details>
    </section>
  );
}

/* ================================================================
   Demo 4：动画控制 —— 暂停、恢复、方向
   ================================================================ */

function DemoControl() {
  const dotRef = useRef<HTMLDivElement>(null);
  // 保存当前运行的动画实例，以便控制它
  const animRef = useRef<JSAnimation | null>(null);
  const [status, setStatus] = useState("就绪");

  const play = () => {
    if (!dotRef.current) return;
    // 先停掉之前的动画
    animRef.current?.complete();

    /**
     * animate() 返回一个 JSAnimation 对象，可以用来：
     *   .pause()    — 暂停
     *   .resume()   — 恢复
     *   .complete() — 立即跳到结束状态
     *   .cancel()   — 取消动画（停在当前位置）
     *   .reversed   — 布尔值，切换方向（true=反向播放）
     *
     * 还有 Promise 风格：
     *   await animate(...)  // 等动画播完后 resolve
     */
    animRef.current = animate(dotRef.current, {
      translateX: [0, 300], // 从 0 移动到 300
      duration: 3000,
      ease: "inOut(3)",
    });
    setStatus("播放中 →");
  };

  const pause = () => {
    animRef.current?.pause();
    setStatus("已暂停 ⏸");
  };

  const resume = () => {
    animRef.current?.resume();
    setStatus("播放中 →");
  };

  const reverse = () => {
    if (!animRef.current) return;
    // reversed 切换方向
    animRef.current.reversed = !animRef.current.reversed;
    setStatus(animRef.current.reversed ? "反向 ◀" : "正向 ▶");
  };

  const stop = () => {
    animRef.current?.cancel();
    animRef.current = null;
    // 瞬间复位
    animate(dotRef.current!, { translateX: 0, duration: 0 });
    setStatus("就绪");
  };

  return (
    <section className="border rounded-lg p-6 space-y-4">
      <div>
        <h2 className="text-xl font-semibold">Demo 4：动画控制</h2>
        <p className="text-sm text-muted-foreground mt-1">
          暂停、恢复、反转、停止 —— animate() 返回的对象可以精确控制动画
        </p>
      </div>

      {/* 轨道 */}
      <div className="h-16 bg-muted/50 rounded-md relative flex items-center px-2">
        <div
          ref={dotRef}
          className="w-10 h-10 bg-primary rounded-full"
        />
      </div>

      <p className="text-sm text-muted-foreground">状态：{status}</p>

      <div className="flex gap-2 flex-wrap">
        <Button size="sm" onClick={play}>
          播放
        </Button>
        <Button size="sm" variant="outline" onClick={pause}>
          暂停
        </Button>
        <Button size="sm" variant="outline" onClick={resume}>
          恢复
        </Button>
        <Button size="sm" variant="outline" onClick={reverse}>
          反转
        </Button>
        <Button size="sm" variant="outline" onClick={stop}>
          停止
        </Button>
      </div>

      <details className="text-sm">
        <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
          查看代码
        </summary>
        <pre className="mt-2 bg-muted p-3 rounded-md text-xs overflow-x-auto">
{`// animate() 返回 JSAnimation 对象，提供完整的控制能力
const anim = animate(dotRef.current, {
  translateX: [0, 300],
  duration: 3000,
  ease: 'inOut(3)',
});

anim.pause();              // 暂停（保持当前位置）
anim.resume();             // 恢复播放
anim.reversed = true;      // 反转方向
anim.cancel();             // 取消动画
anim.complete();           // 立即完成（跳到结束状态）

// Promise 风格
await animate(element, { translateX: 200 }); // 动画完成后 resolve
console.log('动画结束！');`}
        </pre>
      </details>
    </section>
  );
}
