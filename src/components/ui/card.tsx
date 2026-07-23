import { cn } from "@/lib/utils";

/**
 * Card — 卡片容器
 *
 * ============================================================
 *   是什么？
 * ============================================================
 * Card 是最常用的展示容器。想象一张"卡片"：有标题、内容、底部操作按钮，
 * 用来展示文章摘要、商品信息、用户资料等。
 *
 * Card 不是一个组件，而是一组组件（5 个），可以自由组合：
 *
 *   <Card>                        ← 最外层容器（圆角 + 边框 + 阴影）
 *     <CardHeader>                ← 头部区域（标题和描述）
 *       <CardTitle>标题</CardTitle>
 *       <CardDescription>描述</CardDescription>
 *     </CardHeader>
 *     <CardContent>内容</CardContent>   ← 主体内容区
 *     <CardFooter>底部操作</CardFooter> ← 底部（放按钮）
 *   </Card>
 *
 * 你不需要全部使用，选你需要的部分即可。
 *
 * ============================================================
 *   原理
 * ============================================================
 * 所有子组件本质上都是 <div>，只是各自有不同的样式约定。
 * 不用 @base-ui/react 等底层库——Card 是纯展示组件，不需要交互逻辑。
 * 每个子组件都接受 className，方便用 Tailwind 覆盖默认样式。
 */

/**
 * Card — 最外层卡片容器
 *
 * 提供圆角、边框、背景色、阴影。
 * 默认 bg-background（会自动适配亮色/暗色主题）。
 */
function Card({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card"
      className={cn(
        "rounded-xl border bg-card/40 backdrop-blur-xl text-card-foreground shadow-sm",
        className
      )}
      {...props}
    />
  );
}

/**
 * CardHeader — 卡片头部
 *
 * 通常包含 CardTitle + CardDescription。
 * 默认有底部间距和 6（24px）的内边距。
 */
function CardHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-header"
      className={cn("flex flex-col gap-1.5 px-6 pt-6", className)}
      {...props}
    />
  );
}

/**
 * CardTitle — 卡片标题
 *
 * 默认使用 text-lg（18px）+ semibold 字重。
 * 语义上用 <h3> 标签（卡片通常是页面的子区域）。
 */
function CardTitle({ className, ...props }: React.ComponentProps<"h3">) {
  return (
    <h3
      data-slot="card-title"
      className={cn(
        "leading-none font-semibold tracking-tight",
        className
      )}
      {...props}
    />
  );
}

/**
 * CardDescription — 卡片描述
 *
 * 颜色较浅（text-muted-foreground），通常放在标题下方。
 * 默认 text-sm（14px）。
 */
function CardDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="card-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

/**
 * CardContent — 卡片主体内容
 *
 * 卡片的主要内容区域，默认有 24px 内边距。
 * 如果你不需要 Header/Footer，可以直接在 Content 里写任意内容。
 */
function CardContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-content"
      className={cn("px-6 py-4", className)}
      {...props}
    />
  );
}

/**
 * CardFooter — 卡片底部
 *
 * 通常放操作按钮（"查看更多"、"购买"等）。
 * 默认是 flex 布局，按钮之间自动排列。
 */
function CardFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="card-footer"
      className={cn("flex items-center gap-2 px-6 pb-6", className)}
      {...props}
    />
  );
}

export {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
  CardFooter,
};
