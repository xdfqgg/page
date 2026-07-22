import * as React from "react";
import { Slot } from "@/components/ui/slot";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

/**
 * Button — shadcn/ui 按钮组件
 *
 * ============================================================
 *   先看 Demo，再理解原理 ————
 * ============================================================
 *
 * 【最简单的用法】
 *   <Button>点击我</Button>
 *   → 渲染一个默认样式的按钮
 *
 * 【变体（variant）】
 *   <Button variant="default">默认</Button>   // 主按钮，深色背景
 *   <Button variant="outline">边框</Button>    // 只有边框，透明背景
 *   <Button variant="ghost">幽灵</Button>     // 无边框无背景，hover 才显示
 *
 * 【尺寸（size）】
 *   <Button size="sm">小</Button>           // h-8，小按钮
 *   <Button size="default">默认</Button>     // h-9，标准尺寸
 *   <Button size="lg">大</Button>           // h-10，大按钮
 *
 * 【作为链接】
 *   <Button asChild>
 *     <a href="/about">跳转到关于页</a>
 *   </Button>
 *   → asChild 将按钮样式"嫁接"到子元素上，渲染成 <a> 标签但保持按钮外观
 *
 * ============================================================
 *   原理说明
 * ============================================================
 *
 * 1. cva()（class-variance-authority）：
 *    根据 variant 和 size 参数，自动选择对应的 CSS 类名组合。
 *    避免了手写 if/switch 来拼接类名。
 *
 * 2. Slot（@base-ui/react）：
 *    asChild 模式下，不渲染 <button>，而是把 props 和样式传给子元素。
 *    这样你可以把按钮样式用在 <a>、<Link> 等任何元素上。
 *
 * 3. React.forwardRef：
 *    让父组件可以通过 ref 访问到底层的 <button> DOM 节点。
 *    比如：const btnRef = useRef(); <Button ref={btnRef} />
 */

// ─── cva 定义变体样式 ───
const buttonVariants = cva(
  // 基础样式：所有按钮共享
  [
    "inline-flex items-center justify-center gap-2",
    "whitespace-nowrap rounded-md text-sm font-medium",
    "ring-offset-background",
    "transition-all duration-150",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
    "disabled:pointer-events-none disabled:opacity-50",
    "[&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg]:size-4",
    "cursor-pointer",
  ],
  {
    variants: {
      // ─── variant：按钮的视觉风格 ───
      variant: {
        default:
          "bg-primary text-primary-foreground shadow-sm hover:bg-primary/90 active:scale-[0.98]",
        destructive:
          "bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90",
        outline:
          "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        secondary:
          "bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/80",
        ghost: "hover:bg-accent hover:text-accent-foreground",
        link: "text-primary underline-offset-4 hover:underline",
      },
      // ─── size：按钮的尺寸 ───
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8 text-base",
        icon: "h-9 w-9", // 图标按钮，正方形
      },
    },
    // 默认值：不传 variant/size 时使用
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

// ─── 从 cva 中提取 TypeScript 类型 ───
export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /**
   * asChild = true 时，不渲染 <button>，而是把样式传给唯一的子元素。
   * 常用于：<Button asChild><Link to="/">...</Link></Button>
   */
  asChild?: boolean;
}

/**
 * Button 组件
 *
 * @example
 * // 基础用法
 * <Button>默认按钮</Button>
 *
 * @example
 * // 变体 + 尺寸
 * <Button variant="outline" size="lg">大号边框按钮</Button>
 *
 * @example
 * // 作为链接
 * <Button asChild>
 *   <Link to="/about">关于我们</Link>
 * </Button>
 */
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    // asChild 模式下使用 Slot（合并 props 到子元素），否则用原生 button
    const Comp = asChild ? Slot : "button";
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = "Button";

export { Button, buttonVariants };
