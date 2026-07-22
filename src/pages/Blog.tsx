import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { fetchPosts, type PostMeta } from "@/lib/blog";

/**
 * Blog — 博客列表页
 *
 * 从 GitHub 仓库 xdfqgg/wz 读取 posts.json，渲染文章卡片列表。
 */

export default function Blog() {
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPosts()
      .then((data) => {
        setPosts(data);
        setLoading(false);
      })
      .catch(() => {
        setError("无法加载文章列表");
        setLoading(false);
      });
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold">博客</h1>
        <p className="mt-2 text-muted-foreground">
          技术文章、学习笔记和日常思考
        </p>
      </header>

      {/* 加载中 */}
      {loading && (
        <p className="text-center text-muted-foreground py-20">加载中...</p>
      )}

      {/* 错误 */}
      {error && (
        <div className="text-center py-20">
          <p className="text-muted-foreground mb-4">{error}</p>
          <p className="text-sm text-muted-foreground">
            请确认{" "}
            <a
              href="https://github.com/xdfqgg/wz"
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary underline"
            >
              xdfqgg/wz
            </a>{" "}
            仓库中存在 posts.json 文件
          </p>
        </div>
      )}

      {/* 文章列表 */}
      {!loading && !error && posts.length === 0 && (
        <p className="text-center text-muted-foreground py-20">
          还没有文章，敬请期待。
        </p>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <BlogCard key={post.slug} post={post} />
        ))}
      </div>
    </div>
  );
}

/** 文章卡片 */
function BlogCard({ post }: { post: PostMeta }) {
  return (
    <Card className="border-primary/[0.1] bg-card hover:bg-primary/[0.02] transition-colors">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <time className="text-xs text-muted-foreground">{post.date}</time>
        </div>
        <CardTitle className="text-lg">
          <Link
            to={`/blog/${post.slug}`}
            className="hover:text-primary transition-colors"
          >
            {post.title}
          </Link>
        </CardTitle>
        <CardDescription className="line-clamp-2">
          {post.excerpt}
        </CardDescription>
      </CardHeader>

      {post.tags.length > 0 && (
        <CardContent className="pb-2">
          <div className="flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-primary/[0.06] text-muted-foreground border-0 text-xs"
              >
                {tag}
              </Badge>
            ))}
          </div>
        </CardContent>
      )}

      <CardFooter>
        <Button variant="link" size="sm" asChild className="p-0">
          <Link to={`/blog/${post.slug}`}>阅读全文 →</Link>
        </Button>
      </CardFooter>
    </Card>
  );
}
