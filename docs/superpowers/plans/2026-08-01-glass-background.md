# 抛光玻璃背景 — 实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 在暗色主题 body 背景上叠加 4 层静态抛光玻璃质感（虹彩色散 + 主光带 + 次光带 + SVG 噪点）

**Architecture:** 纯 CSS 实现，修改 `F:\cf\src\index.css` 中 `body` 规则，通过逗号分隔的 `background-image` 叠加多层渐变 + 内联 SVG 噪点。保留现有 `body::before` 顶部柔光不动。

**Tech Stack:** CSS（oklch 色彩空间、conic-gradient、radial-gradient、feTurbulence SVG filter）、TailwindCSS v4

## 全局约束

- 仅修改 `F:\cf\src\index.css`
- 保留现有 `.dark` 主题变量不动
- 保留 `body::before` 顶部柔光不动
- 不影响导航栏、卡片、Hero、樱花动画
- 零 JS 开销、零网络请求

---

### Task 1: 在 body 上叠加 4 层玻璃质感 background-image

**Files:**
- 修改: `F:\cf\src\index.css`（`body` 规则）

**说明:** 在现有 `body { @apply bg-background text-foreground; }` 后追加 `background-image` 属性，4 层逗号分隔（先写的在上面），并设置 `background-attachment: fixed` 确保渐变相对视口定位。

SVG 噪点需要转为 base64 data URI 内联。

- [ ] **Step 1: 修改 `index.css` 中 `body` 规则**

找到 `@layer base` 中的 `body` 规则：

```css
body {
    @apply bg-background text-foreground;
}
```

替换为：

```css
body {
    @apply bg-background text-foreground;
    background-image:
        /* ④ 微噪点纹理 — 模拟玻璃表面微粒 */
        url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E"),
        /* ③ 次光带 — 右下对角小光斑 */
        radial-gradient(ellipse 35% 25% at 75% 60%, oklch(0.80 0.04 95 / 0.05) 0%, transparent 65%),
        /* ② 主光带 — 左上对角大面积反光 */
        radial-gradient(ellipse 50% 35% at 30% 15%, oklch(0.85 0.03 85 / 0.07) 0%, transparent 70%),
        /* ① 虹彩色散 — 四角极淡镀膜反光 */
        conic-gradient(
            from 0deg   at 15% 20%, oklch(0.55 0.18 320 / 0.04) 0deg, transparent 60deg,
            from 90deg  at 85% 15%, oklch(0.58 0.12 250 / 0.035) 0deg, transparent 60deg,
            from 180deg at 80% 85%, oklch(0.55 0.15 340 / 0.03) 0deg, transparent 60deg,
            from 270deg at 10% 80%, oklch(0.60 0.10 260 / 0.035) 0deg, transparent 60deg
        );
    background-attachment: fixed;
}
```

- [ ] **Step 2: 启动开发服务器验证**

```bash
cd F:\cf && npm run dev
```

用浏览器打开，确认：
- 背景有明显可见的光带（左上亮，右下稍暗）
- 四角有极淡的彩色光斑（紫/蓝/粉）
- 深色底色仍主导，文字可读
- 滚动页面时光带位置保持固定（玻璃感）

- [ ] **Step 3: Commit**

```bash
git add F:\cf\src\index.css
git commit -m "feat: add polished glass background with CSS gradients and SVG noise"
```

---

## 验收检查

- [ ] 光带在 1920px 和 375px 宽度下位置自然
- [ ] 文字/卡片/导航栏可读性不受影响
- [ ] `body::before` 顶部柔光仍在
- [ ] 无额外网络请求（浏览器 DevTools Network 面板确认）
- [ ] 无 JS 报错
