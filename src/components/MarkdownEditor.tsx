import { useState, useRef, useCallback } from "react";
import { marked } from "marked";
import {
  Bold, Italic, Heading, Link, Image, Code, Quote,
  List, ListOrdered, Minus, Eye, Edit3,
} from "lucide-react";

/**
 * MarkdownEditor — Markdown 写作编辑器
 *
 * 功能：
 *   - 工具栏：加粗/斜体/标题/链接/图片/代码/引用/列表/分割线
 *   - 实时预览切换
 *   - 字数统计
 *   - Ctrl+B/I/K 快捷键
 */

interface Props {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

type Tool =
  | "bold" | "italic" | "heading" | "link" | "image"
  | "code" | "quote" | "ul" | "ol" | "hr";

export default function MarkdownEditor({ value, onChange, placeholder }: Props) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  /** 在光标处插入/包裹文本 */
  const insert = useCallback(
    (before: string, after = "") => {
      const ta = textareaRef.current;
      if (!ta) return;
      const start = ta.selectionStart;
      const end = ta.selectionEnd;
      const selected = value.slice(start, end);
      const newText =
        value.slice(0, start) + before + selected + after + value.slice(end);
      onChange(newText);

      // 恢复光标位置
      requestAnimationFrame(() => {
        ta.focus();
        ta.selectionStart = start + before.length;
        ta.selectionEnd = start + before.length + selected.length;
      });
    },
    [value, onChange]
  );

  /** 工具栏操作 */
  const tools: Record<Tool, { icon: typeof Bold; label: string; action: () => void }> = {
    bold:     { icon: Bold, label: "加粗", action: () => insert("**", "**") },
    italic:   { icon: Italic, label: "斜体", action: () => insert("*", "*") },
    heading:  { icon: Heading, label: "标题", action: () => insert("\n## ") },
    link:     { icon: Link, label: "链接", action: () => insert("[", "](url)") },
    image:    { icon: Image, label: "图片", action: () => insert("![", "](图片URL)") },
    code:     { icon: Code, label: "代码块", action: () => insert("\n```\n", "\n```\n") },
    quote:    { icon: Quote, label: "引用", action: () => insert("\n> ") },
    ul:       { icon: List, label: "无序列表", action: () => insert("\n- ") },
    ol:       { icon: ListOrdered, label: "有序列表", action: () => insert("\n1. ") },
    hr:       { icon: Minus, label: "分割线", action: () => insert("\n---\n") },
  };

  /** 键盘快捷键 */
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.ctrlKey || e.metaKey) {
      switch (e.key) {
        case "b": e.preventDefault(); tools.bold.action(); break;
        case "i": e.preventDefault(); tools.italic.action(); break;
        case "k": e.preventDefault(); tools.link.action(); break;
      }
    }
  };

  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;
  const charCount = value.length;

  return (
    <div className="space-y-3">
      {/* ─── 工具栏 ─── */}
      <div className="flex flex-wrap items-center gap-1 p-2 rounded-lg border border-primary/[0.08] bg-primary/[0.02]">
        {Object.entries(tools).map(([key, tool]) => (
          <button
            key={key}
            type="button"
            title={tool.label}
            onClick={tool.action}
            className="inline-flex items-center justify-center w-8 h-8 rounded-md text-muted-foreground hover:text-foreground hover:bg-primary/[0.08] transition-colors cursor-pointer"
          >
            <tool.icon className="h-4 w-4" />
          </button>
        ))}

        <span className="flex-1" />

        {/* 预览切换 */}
        <button
          type="button"
          onClick={() => setPreview(!preview)}
          className={`inline-flex items-center gap-1.5 px-3 h-8 rounded-md text-xs font-medium transition-colors cursor-pointer ${
            preview
              ? "bg-primary/12 text-primary"
              : "text-muted-foreground hover:text-foreground hover:bg-primary/[0.06]"
          }`}
        >
          {preview ? (
            <><Edit3 className="h-3.5 w-3.5" />编辑</>
          ) : (
            <><Eye className="h-3.5 w-3.5" />预览</>
          )}
        </button>
      </div>

      {/* ─── 编辑/预览区 ─── */}
      {preview ? (
        <div
          className="min-h-[400px] rounded-md border border-primary/[0.08] bg-primary/[0.01] p-4 prose prose-invert max-w-none
            prose-headings:text-foreground prose-p:text-foreground/85 prose-p:leading-relaxed
            prose-a:text-primary prose-code:text-primary/90 prose-code:bg-primary/[0.06] prose-code:px-1 prose-code:py-0.5 prose-code:rounded
            prose-pre:bg-primary/[0.04] prose-pre:border prose-pre:border-primary/[0.08]
            prose-blockquote:border-l-primary/40 prose-blockquote:text-muted-foreground
            prose-strong:text-foreground prose-li:text-foreground/85 prose-img:rounded-lg"
          dangerouslySetInnerHTML={{
            __html: value.trim()
              ? (marked.parse(value) as string)
              : '<p class="text-muted-foreground text-sm">没有内容可预览</p>',
          }}
        />
      ) : (
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder={placeholder || "开始写 Markdown..."}
          rows={18}
          className="flex w-full rounded-md border border-input bg-transparent px-4 py-3 text-sm shadow-xs transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 resize-y min-h-[400px] font-mono"
        />
      )}

      {/* ─── 底部状态栏 ─── */}
      <div className="flex items-center justify-between text-xs text-muted-foreground px-1">
        <span>支持 Markdown 语法 · Ctrl+B 加粗 · Ctrl+I 斜体 · Ctrl+K 链接</span>
        <span>字数 {wordCount} · 字符 {charCount}</span>
      </div>
    </div>
  );
}
