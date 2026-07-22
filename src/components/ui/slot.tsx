import * as React from "react";

/**
 * Slot — 将父组件的 props "合并"到唯一的子元素上
 *
 * ============================================================
 *   原理说明
 * ============================================================
 *
 * 问题场景：
 *   你想让一个 <a> 标签看起来像 Button，但 <button> 不能嵌套在 <a> 里。
 *   <Button asChild>
 *     <Link to="/about">关于</Link>
 *   </Button>
 *
 * Slot 做的事情：
 *   不渲染自己的 DOM 节点，而是找到唯一的子元素，
 *   把本应传给 Slot 的 props（className、onClick 等）合并到子元素上。
 *
 *   渲染前：
 *     <Slot className="btn-style" onClick={handler}>
 *       <a href="/about">关于</a>
 *     </Slot>
 *
 *   渲染后（DOM）：
 *     <a href="/about" class="btn-style">关于</a>
 *     （Slot 自己消失了，所有 props 嫁接到 <a> 上了）
 */

interface SlotProps {
  children?: React.ReactNode;
  className?: string;
  [key: string]: unknown;
}

/**
 * Slot 组件
 *
 * 使用 `React.cloneElement` 把 Slot 收到的所有 props（除了 children）
 * 浅合并到唯一的子元素上。子元素自己的 props 优先级更高（不会被覆盖）。
 */
export const Slot = React.forwardRef<HTMLElement, SlotProps>(
  ({ children, ...slotProps }, ref) => {
    // 确保只有一个子元素（Fragment 和文字节点不支持）
    if (!React.isValidElement(children)) {
      return children as React.ReactNode;
    }

    // 安全地获取子元素的 props
    const childProps = (children as React.ReactElement<Record<string, unknown>>)
      .props;

    return React.cloneElement(
      children as React.ReactElement<Record<string, unknown>>,
      {
        // Slot 的 props 传给子元素...
        ...slotProps,
        // ...子元素自己的同名 prop 优先
        ...childProps,
        // ref 合并：同时保留 Slot 传入的 ref 和子元素自己的 ref
        ref: mergeRefs(ref, (children as React.RefAttributes<HTMLElement>).ref),
        // className 合并：Slot 的 className + 子元素自己的 className
        className: [slotProps.className, childProps.className]
          .filter(Boolean)
          .join(" "),
      }
    );
  }
);
Slot.displayName = "Slot";

/**
 * 合并两个 ref
 *
 * React 中 ref 可以是三种形式：
 *   1. 回调函数: (node) => { ... }
 *   2. useRef 对象: { current: null }
 *   3. null / undefined
 *
 * 这个函数会同时调用/设置两个 ref，确保两者都生效。
 */
function mergeRefs<T>(
  ...refs: Array<React.Ref<T> | null | undefined>
): React.RefCallback<T> {
  return (value: T | null) => {
    refs.forEach((ref) => {
      if (typeof ref === "function") {
        ref(value);
      } else if (ref !== null && ref !== undefined) {
        (ref as React.MutableRefObject<T | null>).current = value;
      }
    });
  };
}
