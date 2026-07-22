import { useState, useEffect } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { cn } from "@/lib/utils";
import {
  BookOpen,
  MessageCircle,
  Tv,
  Music,
  type LucideIcon,
} from "lucide-react";
import SakuraPetals from "@/components/SakuraPetals";

/**
 * Layout — 全局布局（暗色极简风格，参考 2x.nz）
 *
 * 结构：
 *   ┌─────────────────────────────────┐
 *   │  Sticky 导航栏（毛玻璃效果）      │
 *   │  左：Logo  右：菜单（带图标）     │
 *   ├─────────────────────────────────┤
 *   │                                 │
 *   │  <Outlet /> — 页面内容           │
 *   │                                 │
 *   └─────────────────────────────────┘
 */

/** 导航菜单项的类型 */
interface NavItem {
  to: string;
  label: string;
  icon: LucideIcon;
  /** 是否精确匹配（首页需要，避免所有路径都高亮） */
  end?: boolean;
}

/** 导航菜单配置——新增页面在这里加一项即可 */
const NAV_ITEMS: NavItem[] = [
  { to: "/", label: "博客", icon: BookOpen, end: true },
  { to: "/forum", label: "论坛", icon: MessageCircle },
  { to: "/anime", label: "番剧推荐", icon: Tv },
  { to: "/music", label: "音乐", icon: Music },
];

/**
 * useClock — 实时时钟 Hook
 *
 * 每 1 秒更新一次当前时间，返回格式化的中文字符串。
 * useEffect 中 setInterval → cleanup 时 clearInterval。
 */
function useClock() {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // toLocaleTimeString 输出如 "15:42:08"
  return time.toLocaleTimeString("zh-CN", { hour12: false });
}

export default function Layout() {
  const clock = useClock();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* ─── 顶部导航栏 ─── */}
      <header className="sticky top-0 z-50 border-b border-primary/[0.08] bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          {/* 左侧：Logo + 站点名 */}
          <Link
            to="/"
            className="flex items-center gap-3 font-bold text-lg tracking-tight hover:text-foreground/80 transition-colors"
          >
            {/* 实时时钟，每秒更新 */}
            <span className="font-mono tabular-nums tracking-tight text-lg font-bold">{clock}</span>
          </Link>

          {/* 右侧：导航菜单 */}
          <nav className="flex items-center gap-1">
            {NAV_ITEMS.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={({ isActive }) =>
                  cn(
                    // 基础样式
                    "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    // 激活状态
                    isActive
                      ? "bg-primary/12 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                  )
                }
              >
                <item.icon className="h-4 w-4" />
                {item.label}
              </NavLink>
            ))}
          </nav>
        </div>
      </header>

      {/* ─── 页面内容 ─── */}
      <main className="relative">
        {/* 花瓣飘落（absolute 定位在 main 内，跟随页面滚动） */}
        <SakuraPetals />
        <Outlet />
      </main>
    </div>
  );
}
