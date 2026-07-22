/**
 * GitHub Pages SPA 路由修复
 *
 * GitHub Pages 不认识 React Router 的前端路由（如 /blog、/about），
 * 访问这些路径会返回 404。解决方案：
 *   把 index.html 复制一份为 404.html，
 *   GitHub Pages 找不到匹配文件时会返回 404.html，
 *   而 404.html 就是 React 应用本身，
 *   React Router 接管后渲染正确的页面。
 */
import { copyFileSync, writeFileSync, rmSync, cpSync } from "fs";
import { join } from "path";

// 删除旧 docs 文件夹，复制 dist 到 docs
const docs = "docs";
rmSync(docs, { recursive: true, force: true });
cpSync("dist", docs, { recursive: true });

// 告诉 GitHub Pages 不要用 Jekyll 处理
writeFileSync(join(docs, ".nojekyll"), "");
console.log("[gh-pages-spa] copied dist → docs, created .nojekyll");

// SPA 路由修复
copyFileSync(join(docs, "index.html"), join(docs, "404.html"));
console.log("[gh-pages-spa] copied index.html → 404.html");
