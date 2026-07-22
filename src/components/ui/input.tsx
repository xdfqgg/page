import { cn } from "@/lib/utils";

/**
 * Input — 输入框
 *
 * ============================================================
 *   是什么？
 * ============================================================
 * 对原生 <input> 的封装，加上统一的样式，与 shadcn/ui 其他组件风格一致。
 *
 *   用法示例：
 *   <Input placeholder="请输入用户名" />
 *   <Input type="password" placeholder="密码" />
 *   <Input disabled placeholder="禁用状态" />
 *   <Input type="file" />    // 文件上传
 *
 * ============================================================
 *   原理
 * ============================================================
 * 直接基于原生 <input> 元素（没有用 Radix/Base UI），
 * 只加 Tailwind 样式 + 聚焦环（focus-visible:ring）。
 * 通过 React.forwardRef 让父组件可以通过 ref 访问原生 input DOM。
 *
 * ============================================================
 *   为什么不用受控组件？
 * ============================================================
 * 这个 Input 组件不管理自己的值（它是"非受控"的），
 * 值由父组件通过 value + onChange 来管理：
 *
 *   const [text, setText] = useState("");
 *   <Input value={text} onChange={(e) => setText(e.target.value)} />
 *
 * 这样做的好处：状态在父组件手中，多个组件可以共享同一份输入数据。
 */

const Input = ({
  className,
  type,
  ...props
}: React.ComponentProps<"input">) => {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        // 基础布局
        "flex h-9 w-full rounded-md",
        // 背景和边框
        "border border-input bg-transparent",
        // 内边距和文字
        "px-3 py-1 text-base",
        // 阴影效果（细微的内阴影，增加层次感）
        "shadow-xs",
        // 过渡动画
        "transition-colors",
        // 占位符文字颜色
        "placeholder:text-muted-foreground",
        // 聚焦样式：边框高亮 + 外发光环
        "focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring",
        // 禁用样式
        "disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50",
        // 小屏幕下文字稍小（防止 iOS 缩放）
        "md:text-sm",
        // 文件选择框特殊处理
        "file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground",
        className
      )}
      {...props}
    />
  );
};

export { Input };
