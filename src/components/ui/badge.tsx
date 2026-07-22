import { cn } from "@/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";

/**
 * Badge — 标签/徽章
 *
 * ============================================================
 *   是什么？
 * ============================================================
 * 一个小标签，用来标记状态、分类、计数等。比如：
 *   - 文章分类标签："React"、"TypeScript"
 *   - 状态标记："已发布"、"草稿"
 *   - 计数徽章："5 条新消息"
 *
 *   用法示例：
 *   <Badge>默认</Badge>
 *   <Badge variant="secondary">次要</Badge>
 *   <Badge variant="destructive">危险</Badge>
 *   <Badge variant="outline">边框</Badge>
 *
 * ============================================================
 *   原理
 * ============================================================
 * 使用 cva（class-variance-authority）管理多个变体样式，
 * 和 Button 用的是同一套机制。
 */

const badgeVariants = cva(
  // 基础样式：所有 badge 共享
  [
    "inline-flex items-center rounded-md border px-2.5 py-0.5",
    "text-xs font-semibold",
    "transition-colors",
    "focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  ],
  {
    variants: {
      variant: {
        default:
          "border-transparent bg-primary text-primary-foreground shadow-sm",
        secondary:
          "border-transparent bg-secondary text-secondary-foreground",
        destructive:
          "border-transparent bg-destructive text-destructive-foreground shadow-sm",
        outline: "text-foreground",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

/**
 * Badge 组件
 *
 * @example
 * <Badge>React</Badge>
 * <Badge variant="secondary">第二版</Badge>
 */
export function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  );
}
