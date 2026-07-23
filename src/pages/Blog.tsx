import { useState, useEffect } from "react";
import { Link } from "react-router";
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { api } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { PenLine, Trash2 } from "lucide-react";

interface PostMeta {
  slug: string;
  title: string;
  date: string;
  tags: string[];
  excerpt: string;
}

export default function Blog() {
  const { role } = useAuth();
  const isAdmin = role === "admin";
  const [posts, setPosts] = useState<PostMeta[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api.fetchPosts().then((data) => {
      setPosts(data || []);
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10 flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">博客</h1>
          <p className="mt-2 text-muted-foreground">技术文章、学习笔记和日常思考</p>
        </div>
        {isAdmin && (
          <Button asChild size="sm">
            <Link to="/blog/write">
              <PenLine className="h-4 w-4" />写文章
            </Link>
          </Button>
        )}
      </header>

      {loading && <p className="text-center text-muted-foreground py-20">加载中...</p>}

      {!loading && posts.length === 0 && (
        <p className="text-center text-muted-foreground py-20">还没有文章，敬请期待。</p>
      )}

      <div className="space-y-4">
        {posts.map((post) => (
          <Card key={post.slug} className="border-primary/[0.1] bg-card/60 backdrop-blur-xl hover:bg-primary/[0.02] transition-colors">
            <CardHeader className="pb-2">
              <time className="text-xs text-muted-foreground">{post.date}</time>
              <CardTitle className="text-lg">
                <Link to={`/blog/${post.slug}`} className="hover:text-primary transition-colors">
                  {post.title}
                </Link>
              </CardTitle>
              <CardDescription className="line-clamp-2">{post.excerpt}</CardDescription>
            </CardHeader>
            {post.tags.length > 0 && (
              <CardContent className="pb-2">
                <div className="flex flex-wrap gap-1.5">
                  {post.tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="bg-primary/[0.06] text-muted-foreground border-0 text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </CardContent>
            )}
            <CardFooter className="flex items-center justify-between">
              <Button variant="link" size="sm" asChild className="p-0">
                <Link to={`/blog/${post.slug}`}>阅读全文 →</Link>
              </Button>
              {isAdmin && (
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="sm" asChild>
                    <Link to={`/blog/write?edit=${post.slug}`}>
                      <PenLine className="h-3.5 w-3.5" />
                    </Link>
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={async () => {
                      if (!confirm(`确定删除「${post.title}」？`)) return;
                      const r = await api.deletePost(post.slug);
                      if (r.success) {
                        setPosts((prev) => prev.filter((p) => p.slug !== post.slug));
                      } else {
                        alert(r.error || "删除失败");
                      }
                    }}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-destructive" />
                  </Button>
                </div>
              )}
            </CardFooter>
          </Card>
        ))}
      </div>
    </div>
  );
}
