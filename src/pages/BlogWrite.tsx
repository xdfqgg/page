import { useState, useEffect } from "react";
import { useNavigate, useSearchParams, Link } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MarkdownEditor from "@/components/MarkdownEditor";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";

/**
 * BlogWrite — 写/编辑文章（管理员用）
 *
 * /blog/write          → 新建
 * /blog/write?edit=slug → 编辑已有文章
 */

export default function BlogWrite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editSlug = searchParams.get("edit");
  const isEdit = !!editSlug;

  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // 编辑模式：加载已有文章
  useEffect(() => {
    if (!editSlug) return;

    Promise.all([
      api.fetchPosts(),
      api.fetchPostRaw(editSlug),
    ]).then(([posts, raw]) => {
      const meta = posts?.find((p) => p.slug === editSlug);
      if (meta) {
        setTitle(meta.title);
        setTags(meta.tags.join(", "));
        setExcerpt(meta.excerpt);
      }
      if (raw) setContent(raw);
    }).catch(() => setError("加载文章失败"));
  }, [editSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("标题和内容不能为空");
      return;
    }

    setLoading(true);
    setError("");

    const payload = {
      title: title.trim(),
      tags: tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      excerpt: excerpt.trim(),
      content: content.trim(),
    };

    const result = isEdit
      ? await api.updatePost({ slug: editSlug!, ...payload })
      : await api.createPost(payload);

    setLoading(false);

    if (result.success) {
      navigate(`/blog/${result.slug}`);
    } else {
      setError(result.error || "操作失败");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-6 py-16">
      <Link
        to="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        返回博客
      </Link>

      <Card className="border-primary/[0.1] bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl">
            {isEdit ? "编辑文章" : "写文章"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="文章标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold"
            />

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                placeholder="标签（逗号分隔）"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
              />
              <Input
                placeholder="摘要（选填）"
                value={excerpt}
                onChange={(e) => setExcerpt(e.target.value)}
              />
            </div>

            <MarkdownEditor
              value={content}
              onChange={setContent}
            />

            {error && <p className="text-sm text-destructive">{error}</p>}

            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "保存中..." : isEdit ? "保存修改" : "发布文章"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
