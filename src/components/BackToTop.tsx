import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowUp } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * BackToTop — 回到顶部按钮
 *
 * 行为：
 *   - 页面滚动超过 300px 时显示
 *   - 点击后平滑滚动回顶部
 *   - 固定在屏幕右下角
 *
 * 原理：
 *   - useEffect 监听 window 的 scroll 事件，更新 isVisible 状态
 *   - window.scrollTo({ top: 0, behavior: "smooth" }) 实现平滑滚动
 *   - 用 cn() 控制显示/隐藏（opacity + pointer-events）
 */

export default function BackToTop() {
  // 是否显示按钮（滚动超过 300px 才显示）
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    /**
     * 监听滚动事件
     *
     * 为什么不在事件处理函数里直接用 useState？
     *   因为事件处理函数每秒触发几十次，如果不用 requestAnimationFrame
     *   来节流，React 会频繁重新渲染，浪费性能。
     *
     * ticking 标志位实现了一个简单的节流：
     *   - 同一帧内无论滚多少次，只检查一次
     *   - 下一帧开始时重置标志
     */
    let ticking = false;

    const handleScroll = () => {
      if (ticking) return; // 本帧已经处理过了，跳过
      ticking = true;
      requestAnimationFrame(() => {
        setIsVisible(window.scrollY > 300);
        ticking = false;
      });
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    // cleanup：组件卸载时移除监听，避免内存泄漏
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  /** 点击回到顶部 */
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={scrollToTop}
      className={cn(
        // 固定位置：右下角
        "fixed bottom-6 right-6 z-50",
        // 样式
        "h-10 w-10 rounded-full",
        "border-primary/[0.12] bg-background/80 backdrop-blur-xl",
        "text-muted-foreground hover:text-foreground hover:border-primary/[0.2] hover:bg-primary/[0.08]",
        "shadow-lg shadow-black/20",
        // 过渡动画：显示时淡入 + 向上滑入
        "transition-all duration-300",
        isVisible
          ? "opacity-100 translate-y-0 pointer-events-auto"
          : "opacity-0 translate-y-4 pointer-events-none"
      )}
      aria-label="回到顶部"
    >
      <ArrowUp className="h-4 w-4" />
    </Button>
  );
}
