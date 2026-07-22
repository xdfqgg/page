import { useNavigate } from "react-router";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  BookOpen,
  MessageCircle,
  Tv,
  Music,
  type LucideIcon,
} from "lucide-react";

/**
 * FeatureGrid — 功能卡片网格
 *
 * 特点：
 *   - 3 列网格布局（移动端自适应为 1~2 列）
 *   - 每张卡片：图标 + Badge 标记 + 标题 + 描述 + 标签组 + 链接
 *   - 深色背景 + 微边框
 */

/** 单张功能卡片的数据结构 */
interface FeatureCard {
  icon: LucideIcon;
  title: string;
  description: string;
  badge?: string;
  tags?: string[];
  linkTo: string;
}

/** 功能卡片数据——新增功能在这里加一项 */
const FEATURES: FeatureCard[] = [
  {
    icon: BookOpen,
    title: "博客",
    description:
      "关于我最近的发现和技术总结。",
    badge: "NEW",
    tags: ["博客搭建", "前端", "后端"],
    linkTo: "/blog",
  },
  {
    icon: MessageCircle,
    title: "论坛",
    description:
      "自由的社区讨论空间。提问、分享、交流，与志同道合的人一起成长。",
    tags: ["社区", "问答", "分享"],
    linkTo: "/forum",
  },
  {
    icon: Tv,
    title: "番剧推荐",
    description:
      "记录追番进度，分享观感评价。",
    badge: "NEW",
    tags: ["新番", "经典", "评测"],
    linkTo: "/anime",
  },
  {
    icon: Music,
    title: "音乐",
    description:
      "分享喜欢的音乐，创建播放列表。放松心情，享受旋律。",
    tags: ["歌单", "分享", "放松"],
    linkTo: "/music",
  },
];

export default function FeatureGrid() {
  return (
    <section id="feature-grid" className="mx-auto max-w-5xl px-6 py-16">
      {/* ─── 区域标题 ─── */}
      <h2 className="mb-10 text-center text-sm font-medium uppercase tracking-widest text-muted-foreground">
        尝试点击一个模块吧!
      </h2>

      {/* ─── 卡片网格 ─── */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {FEATURES.map((feature) => (
          <FeatureCard key={feature.title} {...feature} />
        ))}
      </div>
    </section>
  );
}

/**
 * FeatureCard — 单张功能卡片
 *
 * 使用 shadcn/ui 的 Card 组件拼装。
 */
function FeatureCard({
  icon: Icon,
  title,
  description,
  badge,
  tags,
  linkTo,
}: FeatureCard) {
  const navigate = useNavigate();

  return (
    <Card
      onClick={() => navigate(linkTo)}
      className="group relative flex flex-col border-primary/[0.1] bg-card hover:bg-primary/[0.03] hover:border-primary/[0.2] transition-colors cursor-pointer"
    >
      <CardHeader className="pb-3">
        {/* 顶部行：左边图标，右边 Badge */}
        <div className="flex items-start justify-between">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/[0.1]">
            <Icon className="h-5 w-5 text-primary" />
          </div>
          {badge && (
            <Badge
              variant="secondary"
              className="bg-primary/[0.08] text-muted-foreground hover:bg-primary/[0.12] border-0"
            >
              {badge}
            </Badge>
          )}
        </div>
        <CardTitle className="mt-4 text-white">{title}</CardTitle>
        <CardDescription className="text-muted-foreground leading-relaxed">
          {description}
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-1">
        {/* 标签组 */}
        {tags && tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag) => (
              <span
                key={tag}
                className="inline-flex items-center rounded-md border border-primary/[0.08] bg-primary/[0.03] px-2 py-0.5 text-xs text-muted-foreground"
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </CardContent>

    </Card>
  );
}
