import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Mail,
  MessageCircle,
  ExternalLink,
  Check,
  type LucideIcon,
} from "lucide-react";

/**
 * AboutSection — 关于 + 社交链接区
 *
 * 两个部分：
 *   1. 个人简介卡片
 *   2. 社交链接按钮行：
 *      - 外链（GitHub）→ 打开新标签
 *      - 复制（邮箱/QQ）→ 点击写入剪贴板 + 显示 ✓ 反馈
 */

/** 社交链接的数据结构 */
interface SocialLink {
  label: string;
  /** 外链为完整 URL，复制项为要复制的文本 */
  href: string;
  icon: LucideIcon;
  /** "link" = 打开外链，"copy" = 复制到剪贴板 */
  action: "link" | "copy";
}

/** 社交链接配置 */
const SOCIAL_LINKS: SocialLink[] = [
  { label: "邮箱", href: "3523137931@qq.com", icon: Mail, action: "copy" },
  { label: "GitHub", href: "https://github.com/xdfqgg", icon: ExternalLink, action: "link" },
  { label: "QQ 群", href: "458159992", icon: MessageCircle, action: "copy" },
];

export default function AboutSection() {
  /** 当前被复制的链接 label，用来显示 ✓ */
  const [copiedLabel, setCopiedLabel] = useState<string | null>(null);

  const handleClick = async (link: SocialLink) => {
    if (link.action === "link") return; // 外链由 <a> 正常处理

    try {
      await navigator.clipboard.writeText(link.href);
      setCopiedLabel(link.label);
      setTimeout(() => setCopiedLabel(null), 2000);
    } catch {
      // 降级：选中文本手动复制（fallback for HTTP）
      const input = document.createElement("input");
      input.value = link.href;
      document.body.appendChild(input);
      input.select();
      document.execCommand("copy");
      document.body.removeChild(input);
      setCopiedLabel(link.label);
      setTimeout(() => setCopiedLabel(null), 2000);
    }
  };

  return (
    <section className="mx-auto max-w-5xl px-6 py-16 pb-24">
      <Separator className="mb-16 bg-primary/[0.1]" />

      {/* ─── 个人简介卡片 ─── */}
      <Card className="mx-auto max-w-xl border-primary/[0.06] bg-card/30 backdrop-blur-md">
        <CardHeader className="text-center pb-6">
          <CardTitle className="text-foreground text-xl">关于我</CardTitle>
          <CardDescription className="text-muted-foreground leading-relaxed space-y-3">
            <p>正在精进计算机技术。</p>
            <p>那天，我使用了 Claude，我眩晕瘫坐在椅子上，就好像看见了核弹爆炸。</p>
            <p>这个页面基本配合大语言模型进行制作，欢迎通过以下方式与我交流。</p>
          </CardDescription>
        </CardHeader>
      </Card>

      {/* ─── 社交链接按钮行 ─── */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {SOCIAL_LINKS.map((link) => {
          const isCopied = copiedLabel === link.label;

          const buttonContent = (
            <>
              {isCopied ? (
                <Check className="h-3.5 w-3.5" />
              ) : (
                <link.icon className="h-3.5 w-3.5" />
              )}
              {isCopied ? "已复制" : link.label}
            </>
          );

          // 外链：用 <a> 标签
          if (link.action === "link") {
            return (
              <Button
                key={link.label}
                variant="outline"
                size="sm"
                asChild
                className="rounded-full border-primary/[0.12] bg-primary/[0.04] text-muted-foreground hover:bg-primary/[0.1] hover:text-foreground hover:border-primary/[0.2] transition-all"
              >
                <a href={link.href} target="_blank" rel="noopener noreferrer">
                  {buttonContent}
                </a>
              </Button>
            );
          }

          // 复制：用 <button> + onClick
          return (
            <Button
              key={link.label}
              variant="outline"
              size="sm"
              onClick={() => handleClick(link)}
              className="rounded-full border-primary/[0.12] bg-primary/[0.04] text-muted-foreground hover:bg-primary/[0.1] hover:text-foreground hover:border-primary/[0.2] transition-all cursor-pointer"
            >
              {buttonContent}
            </Button>
          );
        })}
      </div>
    </section>
  );
}
