import { useState } from "react";
import { useNavigate } from "react-router";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import MarkdownEditor from "@/components/MarkdownEditor";
import { api } from "@/lib/api";
import { ArrowLeft } from "lucide-react";
import { Link } from "react-router";

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
      tags: tags
        .split(/[,，]/)
        .map((t) => t.trim())
        .filter(Boolean),
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
    <div className="mx-auto max-w-4xl px-6 py-16">
      {/* 返回 */}
      <Link
        to="/blog"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        返回博客
      </Link>

      <Card className="border-primary/[0.1] bg-card/60 backdrop-blur-xl">
        <CardHeader>
          <CardTitle className="text-xl">写文章</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 标题 */}
            <Input
              placeholder="文章标题"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="text-lg font-semibold"
            />

            {/* 标签 + 摘要 */}
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

            {/* Markdown 编辑器 */}
            <MarkdownEditor
              value={content}
              onChange={setContent}
              placeholder="开始写 Markdown 正文..."
            />

            {/* 错误提示 */}
            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* 发布按钮 */}
            <Button type="submit" className="w-full" size="lg" disabled={loading}>
              {loading ? "发布中..." : "发布文章"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
