import { Link } from "react-router";
import { Button } from "@/components/ui/button";

/**
 * NotFound — 404 页面
 */
export default function NotFound() {
  return (
    <div className="mx-auto flex max-w-5xl flex-col items-center justify-center px-6 py-24 text-center">
      <p className="text-8xl font-bold text-primary/10">404</p>
      <h1 className="mt-4 text-2xl font-bold">页面未找到</h1>
      <p className="mt-2 text-muted-foreground">
        你访问的页面不存在，可能已经被移动或删除。
      </p>
      <Button asChild variant="outline" className="mt-8 rounded-full">
        <Link to="/">← 返回首页</Link>
      </Button>
    </div>
  );
}
