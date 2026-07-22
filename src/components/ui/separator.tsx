import { cn } from "@/lib/utils";

/**
 * Separator — 分割线
 *
 * ============================================================
 *   是什么？
 * ============================================================
 * 一条水平或垂直的线，用来在视觉上分隔不同的内容区域。
 *
 *   用法示例：
 *   <Separator />                         // 默认水平分割线
 *   <Separator className="my-4" />        // 加上垂直间距
 *   <Separator orientation="vertical" />  // 垂直分割线（用在 flex 容器中）
 *
 * ============================================================
 *   原理
 * ============================================================
 * 本质上就是一个 <div>，用 Tailwind 类名画出线条：
 *   - 水平：宽度 100%，高度 1px，背景色 = border 颜色
 *   - 垂直：宽度 1px，高度 100%
 */

interface SeparatorProps {
  /** 方向：horizontal（水平，默认）| vertical（垂直） */
  orientation?: "horizontal" | "vertical";
  /** 是否为装饰性的（无障碍属性，屏幕阅读器会跳过） */
  decorative?: boolean;
  className?: string;
}

export function Separator({
  orientation = "horizontal",
  decorative = true,
  className,
}: SeparatorProps) {
  return (
    <div
      role={decorative ? "none" : "separator"}
      aria-orientation={decorative ? undefined : orientation}
      className={cn(
        // 收缩为 0：在 flex 容器中不会抢占空间
        "shrink-0 bg-border",
        // 水平方向
        orientation === "horizontal" && "h-[1px] w-full",
        // 垂直方向
        orientation === "vertical" && "h-full w-[1px]",
        className
      )}
    />
  );
}
