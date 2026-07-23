import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router";
import { AuthProvider } from "./contexts/AuthContext";
import "./index.css";
import Layout from "./layouts/Layout";
import Home from "./pages/Home";
import Blog from "./pages/Blog";
import Forum from "./pages/Forum";
import Anime from "./pages/Anime";
import Music from "./pages/Music";
import Login from "./pages/Login";
import About from "./pages/About";
import AnimeDemo from "./pages/AnimeDemo";
import NotFound from "./pages/NotFound";

/**
 * main.tsx — 应用入口
 *
 * 纯静态前端，后端 API 另建独立项目。
 *
 * 路由：
 *   /             → 首页
 *   /blog         → 博客（后期接 API）
 *   /forum        → 论坛（后期接 API）
 *   /anime        → 番剧推荐
 *   /music        → 音乐
 *   /about        → 关于
 *   /*            → 404
 */

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <AuthProvider>
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="blog" element={<Blog />} />
          <Route path="forum" element={<Forum />} />
          <Route path="anime" element={<Anime />} />
          <Route path="music" element={<Music />} />
          <Route path="login" element={<Login />} />
          <Route path="about" element={<About />} />
          <Route path="anime-demo" element={<AnimeDemo />} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Routes>
    </BrowserRouter>
    </AuthProvider>
  </StrictMode>
);
