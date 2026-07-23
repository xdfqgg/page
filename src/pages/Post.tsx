import { useState, useEffect } from "react";
import { useParams, Link } from "react-router";
import { marked } from "marked";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, PenLine } from "lucide-react";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
}

export default function PostPage() {
  const { slug } = useParams<{ slug: string }>();
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [content, setContent] = useState<string | null>(null);
  const [meta, setMeta] = useState<PostMeta | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!slug) return;

    Promise.all([
      api.fetchPosts(),
      api.fetchPostRaw(slug),
    ]).then(([posts, markdown]) => {
      const info = posts?.find((p) => p.slug === slug) || null;
      setMeta(info);
      setContent(markdown ? marked.parse(markdown) as string : null);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, [slug]);

  if (loading) {
    return <div className="mx-auto max-w-3xl px-6 py-24 text-center text-muted-foreground">加载中...</div>;
  }

  if (!content) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-24 text-center">
        <h1 className="text-2xl font-bold mb-4">文章未找到</h1>
        <p className="text-muted-foreground mb-8">这篇文章不存在或已被移除。</p>
        <Button variant="outline" asChild><Link to="/blog">← 返回博客</Link></Button>
      </div>
    );
  }

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <Link to="/blog" className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-8">
        <ArrowLeft className="h-3.5 w-3.5" />返回博客
      </Link>

      <header className="mb-8">
        {meta?.date && <time className="text-sm text-muted-foreground">{meta.date}</time>}
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{meta?.title || slug}</h1>
        {meta?.tags && meta.tags.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {meta.tags.map((tag) => (
              <Badge key={tag} variant="secondary" className="bg-primary/[0.06] text-muted-foreground border-0">{tag}</Badge>
            ))}
          </div>
        )}
        {isAdmin && (
          <Link
            to={`/blog/write?edit=${slug}`}
            className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-primary transition-colors mt-2"
          >
            <PenLine className="h-3 w-3" />编辑
          </Link>
        )}
      </header>

      <Separator className="mb-8 bg-primary/[0.08]" />

      <div className="prose prose-invert max-w-none
        prose-headings:text-foreground
        prose-p:text-foreground/85 prose-p:leading-relaxed
        prose-a:text-primary prose-a:no-underline
        prose-code:text-primary/90 prose-code:bg-primary/[0.06] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
        prose-pre:bg-primary/[0.04] prose-pre:border prose-pre:border-primary/[0.08]
        prose-blockquote:border-l-primary/40 prose-blockquote:text-muted-foreground
        prose-strong:text-foreground prose-li:text-foreground/85 prose-img:rounded-lg"
        dangerouslySetInnerHTML={{ __html: content }}
      />

      <Separator className="my-10 bg-primary/[0.08]" />
      <div className="text-center">
        <Button variant="outline" asChild><Link to="/blog">← 返回博客列表</Link></Button>
      </div>
    </article>
  );
}
