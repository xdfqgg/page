import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * cn() — shadcn/ui 的类名合并工具
 *
 * 做了两件事：
 * 1. clsx()  — 把多种格式的类名参数合并成一个字符串
 *    支持：字符串 'px-4'、对象 { 'px-4': true }、数组 ['px-4', 'py-2']
 * 2. twMerge() — 消除 Tailwind 类名冲突
 *    比如 cn('px-4', 'px-6') → 最终只保留 'px-6'，不会两个都生效
 *
 * @param inputs - 任意数量的类名参数，每个可以是 string | object | array | undefined | null | false
 * @returns 合并并去重后的类名字符串
 *
 * 使用示例：
 *   cn('text-lg', 'font-bold')                    // → 'text-lg font-bold'
 *   cn('px-4', isActive && 'bg-blue-500')         // → 'px-4 bg-blue-500'（条件为真时）
 *   cn('px-4', 'px-6')                            // → 'px-6'（twMerge 解决冲突）
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
