import { useState, useEffect } from "react";
import { Link, NavLink, Outlet } from "react-router";
import { cn } from "@/lib/utils";
import {
  Home,
  BookOpen,
  MessageCircle,
  Tv,
  LogIn,
  LogOut,
  type LucideIcon,
} from "lucide-react";
import SakuraPetals from "@/components/SakuraPetals";
import { useAuth } from "@/contexts/AuthContext";

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
  { to: "/", label: "主页", icon: Home, end: true },
  { to: "/blog", label: "博客", icon: BookOpen },
  { to: "/forum", label: "论坛", icon: MessageCircle },
  { to: "/anime", label: "番剧", icon: Tv },
];

function useClock() {
  const [time, setTime] = useState(new Date());
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);
  return time.toLocaleTimeString("zh-CN", { hour12: false });
}

export default function Layout() {
  const clock = useClock();
  const { isLoggedIn, username, logout } = useAuth();

  return (
    <div className="min-h-screen bg-background text-foreground antialiased">
      {/* 樱花飘落（fixed 全屏，不受页面滚动影响） */}
      <SakuraPetals />
      {/* ─── 顶部导航栏 ─── */}
      <header className="sticky top-0 z-50 border-b border-primary/[0.08] bg-background/80 backdrop-blur-xl shadow-[0_1px_3px_rgba(0,0,0,0.3)]">
        <div className="mx-auto flex h-16 max-w-5xl items-center justify-between px-6">
          {/* 左侧：Logo + 站点名 */}
          <Link
            to="/"
            className="flex items-center gap-3 font-bold text-lg tracking-tight hover:text-foreground/80 transition-colors"
          >
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

            {/* 登录/退出 */}
            {isLoggedIn ? (
              <button
                onClick={logout}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-primary/5 transition-colors cursor-pointer"
                title={username || ""}
              >
                <LogOut className="h-4 w-4" />
                {username}
              </button>
            ) : (
              <NavLink
                to="/login"
                className={({ isActive }) =>
                  cn(
                    "inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                    isActive
                      ? "bg-primary/12 text-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-primary/5"
                  )
                }
              >
                <LogIn className="h-4 w-4" />
                登录
              </NavLink>
            )}
          </nav>
        </div>
      </header>

      {/* ─── 页面内容 ─── */}
      <main className="relative">
        <Outlet />
      </main>
    </div>
  );
}
