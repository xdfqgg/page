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
import { copyFileSync } from "fs";
import { join } from "path";

const dist = "dist";
const src = join(dist, "index.html");
const dest = join(dist, "404.html");

copyFileSync(src, dest);
console.log("[gh-pages-spa] copied index.html → 404.html for SPA routing");
