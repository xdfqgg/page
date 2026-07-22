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
  type LucideIcon,
} from "lucide-react";

/**
 * AboutSection — 关于 + 社交链接区
 *
 * 两个部分：
 *   1. 个人简介卡片（头像 + 介绍文字）
 *   2. 社交链接按钮行（邮箱/B站/QQ/GitHub 等，图标 + 文字）
 */

/** 社交链接的数据结构 */
interface SocialLink {
  label: string;
  href: string;
  icon: LucideIcon;
}

/** 社交链接配置——替换为你自己的信息 */
const SOCIAL_LINKS: SocialLink[] = [
  { label: "邮箱", href: "3523137931@qq.com", icon: Mail },
  { label: "GitHub", href: "https://github.com", icon: ExternalLink },
  { label: "QQ 群", href: "458159992", icon: MessageCircle },
  { label: "Telegram", href: "https://t.me", icon: MessageCircle },
];

export default function AboutSection() {
  return (
    <section className="mx-auto max-w-5xl px-6 py-16">
      <Separator className="mb-16 bg-primary/[0.1]" />

      {/* ─── 个人简介卡片 ─── */}
      <Card className="mx-auto max-w-2xl border-primary/[0.1] bg-card">
        <CardHeader className="text-center">
          <CardTitle className="text-foreground text-xl">关于我</CardTitle>
          <CardDescription className="text-muted-foreground leading-relaxed">
            正在精进计算机技术。
            那天,我使用了claude,我眩晕瘫坐在椅子上,就好像看见了核弹爆炸,
            这个页面基本配合大语言模型进行制作,
            欢迎通过以下方式与我交流。
          </CardDescription>
        </CardHeader>
      </Card>

      {/* ─── 社交链接按钮行 ─── */}
      <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
        {SOCIAL_LINKS.map((link) => (
          <Button
            key={link.label}
            variant="outline"
            size="sm"
            asChild
            className="rounded-full border-primary/[0.12] bg-primary/[0.04] text-muted-foreground hover:bg-primary/[0.1] hover:text-foreground hover:border-primary/[0.2] transition-all"
          >
            <a
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
            >
              <link.icon className="h-3.5 w-3.5" />
              {link.label}
            </a>
          </Button>
        ))}
      </div>
    </section>
  );
}
