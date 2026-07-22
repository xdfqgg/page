import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import "./index.css";
import Layout from "./layouts/Layout";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import PostPage from "./pages/Post";
import Forum from "./pages/Forum";
import Anime from "./pages/Anime";
import Music from "./pages/Music";
import About from "./pages/About";
import AnimeDemo from "./pages/AnimeDemo";
import NotFound from "./pages/NotFound";

/**
 * main.tsx — 应用入口
 *
 * ─── 路由结构 ───
 *
 *   /             → Layout > Home（Landing Page）
 *   /blog         → Layout > Blog（博客列表）
 *   /forum        → Layout > Forum（论坛）
 *   /ai-art       → Layout > AiArt（AI 绘图）
 *   /about        → Layout > About
 *   /anime-demo   → Layout > AnimeDemo
 *   /*            → Layout > NotFound（404）
 *
 * 所有页面共享 Layout 组件（导航栏 + 暗色背景）。
 */

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    {/* basename: GitHub Pages 部署路径。本地 dev 时为空，构建时为 '/-/' */}
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          {/* 首页：Landing Page */}
          <Route index element={<Home />} />
          {/* 博客列表页 + 文章详情 */}
          <Route path="blog" element={<Blog />} />
          <Route path="blog/:slug" element={<PostPage />} />
          {/* 论坛页 */}
          <Route path="forum" element={<Forum />} />
          {/* 番剧推荐页 */}
          <Route path="anime" element={<Anime />} />
          {/* 音乐页 */}
          <Route path="music" element={<Music />} />
          {/* 关于页 */}
          <Route path="about" element={<About />} />
          {/* animejs 动画教学 Demo */}
          <Route path="anime-demo" element={<AnimeDemo />} />
          {/* 404 兜底：匹配所有未定义的路径 */}
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
  </StrictMode>
);
