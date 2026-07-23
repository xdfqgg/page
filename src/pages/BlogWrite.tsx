import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { api } from "@/lib/api";

/**
 * BlogWrite — 写文章（管理员用）
 */

export default function BlogWrite() {
  const navigate = useNavigate();
  const [title, setTitle] = useState("");
  const [tags, setTags] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError("标题和内容不能为空");
      return;
    }

    setLoading(true);
    setError("");

    const result = await api.createPost({
      title: title.trim(),
      tags: tags.split(/[,，]/).map((t) => t.trim()).filter(Boolean),
      excerpt: excerpt.trim(),
      content: content.trim(),
    });

    setLoading(false);

    if (result.success) {
      navigate(`/blog/${result.slug}`);
    } else {
      setError(result.error || "发布失败");
    }
  };

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <Card className="border-primary/[0.1] bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl">写文章</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              placeholder="文章标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
            <Input
              placeholder="标签（逗号分隔，如：React,TypeScript）"
              value={tags}
              onChange={(e) => setTags(e.target.value)}
            />
            <Input
              placeholder="摘要（选填）"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
            />
            <textarea
              placeholder="Markdown 正文..."
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={16}
              className="flex w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50"
            />
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? "发布中..." : "发布文章"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
