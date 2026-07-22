import Hero from "@/components/Hero";
import FeatureGrid from "@/components/FeatureGrid";
import AboutSection from "@/components/AboutSection";
import BackToTop from "@/components/BackToTop";

/**
 * Home — 首页（Landing Page）
 *
 * 按照 2x.nz 的布局结构搭建：
 *   Hero → 功能卡片网格 → 关于/社交 → 回到顶部
 *
 * 每个 Section 是独立组件，方便后续单独维护。
 */

export default function Home() {
  return (
    <>
      <Hero />
      <FeatureGrid />
      <AboutSection />
      <BackToTop />
    </>
  );
}
