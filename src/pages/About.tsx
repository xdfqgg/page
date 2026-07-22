/**
 * About — 关于页
 *
 * 第二个页面，用来验证 React Router 路由跳转是否正常工作。
 * 后续替换为实际内容。
 */
export default function About() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[80vh] gap-4">
      <h1 className="text-3xl font-bold tracking-tight">关于</h1>
      <p className="text-muted-foreground">
        这是关于页面。如果你能看到这个，说明路由跳转正常。
      </p>
    </div>
  );
}
