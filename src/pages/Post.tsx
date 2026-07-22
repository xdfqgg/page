import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Card } from "@/components/ui/card";
import { fetchPost, type Post } from "@/lib/blog";
import { ArrowLeft } from "lucide-react";

/**
 * Post — 文章详情页
 *
 * 根据 URL 中的 slug 参数，从 GitHub 获取对应 Markdown 文件并渲染。
 */

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<Post | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!slug) return;

    setLoading(true);
    fetchPost(slug)
      .then((data) => {
        if (data) {
          setPost(data);
        } else {
          setError("文章未找到");
        }
        setLoading(false);
      })
      .catch(() => {
        setError("无法加载文章");
        setLoading(false);
      });
  }, [slug]);

  if (loading) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">
        加载中...
      </div>
    );
  }

  if (error || !post) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">文章未找到</h1>
        <p className="text-muted-foreground mb-8">
          {error || "这篇文章不存在或已被移除。"}
        </p>
        <Button variant="outline" asChild>
          <Link to="/blog">← 返回博客</Link>
        </Button>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      {/* 返回链接 */}
      <Link
        to="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        返回博客
      </Link>

      {/* 文章头部 */}
      <header className="mb-8">
        <time className="text-sm text-muted-foreground">{post.date}</time>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">
          {post.title}
        </h1>
        {post.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {post.tags.map((tag) => (
              <Badge
                key={tag}
                variant="secondary"
                className="bg-primary/[0.06] text-muted-foreground border-0"
              >
                {tag}
              </Badge>
            ))}
          </div>
        )}
      </header>

      <Separator className="mb-8 bg-primary/[0.08]" />

      {/* 文章正文（Markdown 渲染后的 HTML） */}
      <Card className="border-0 bg-transparent shadow-none">
        <div
          className="prose prose-invert max-w-none
            prose-headings:text-foreground
            prose-p:text-foreground/85 prose-p:leading-relaxed
            prose-a:text-primary prose-a:no-underline hover:prose-a:underline
            prose-code:text-primary/90 prose-code:bg-primary/[0.06] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-primary/[0.04] prose-pre:border prose-pre:border-primary/[0.08]
            prose-blockquote:border-l-primary/40 prose-blockquote:text-muted-foreground
            prose-strong:text-foreground
            prose-li:text-foreground/85
            prose-img:rounded-lg"
          dangerouslySetInnerHTML={{ __html: post.content }}
        />
      </Card>

      {/* 底部 */}
      <Separator className="my-10 bg-primary/[0.08]" />
      <div className="text-center">
        <Button variant="outline" asChild>
          <Link to="/blog">← 返回博客列表</Link>
        </Button>
      </div>
    </article>
  );
}
