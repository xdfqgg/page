# 抛光玻璃背景 — 设计方案

> 日期：2026-08-01 | 状态：✅ 已确认

## 目标

在现有暗色琥珀主题的背景上，叠加静态抛光玻璃质感——暗底 + 反光光泽，类似黑曜石或深色琉璃的视觉效果。

## 不改的范围

- 导航栏、卡片、Hero 圆点图案、樱花动画全部保持现状
- 仅改动 `F:\cf\src\index.css` 中 `body` 的 `background-image`

## 层次结构（底 → 顶）

| 序号 | 层名 | 技术 | 峰值 opacity |
|------|------|------|:--:|
| ① | 虹彩色散 | 四角 `conic-gradient`（紫/蓝/粉） | 4% |
| ② | 主光带 | `radial-gradient` 对角线大面积反光 | 7% |
| ③ | 次光带 | `radial-gradient` 错角小光斑 | 5% |
| ④ | 噪点纹理 | inline SVG `feTurbulence` | 4% |
| ⑤ | 顶部柔光 | 保留现有 `body::before` 径向渐变 | 6% |

叠加最亮处约 18%，在深色底（`oklch(0.175 …)`）上为"可察觉但不刺眼"的反光。

## 各层参数

### ① 虹彩色散

```css
conic-gradient(
  from 0deg   at 15% 20%, oklch(0.55 0.18 320 / 0.04) 0deg, transparent 60deg,
  from 90deg  at 85% 15%, oklch(0.58 0.12 250 / 0.035) 0deg, transparent 60deg,
  from 180deg at 80% 85%, oklch(0.55 0.15 340 / 0.03) 0deg, transparent 60deg,
  from 270deg at 10% 80%, oklch(0.60 0.10 260 / 0.035) 0deg, transparent 60deg
);
```

### ② 主光带

```css
radial-gradient(ellipse 50% 35% at 30% 15%, oklch(0.85 0.03 85 / 0.07) 0%, transparent 70%);
```

### ③ 次光带

```css
radial-gradient(ellipse 35% 25% at 75% 60%, oklch(0.80 0.04 95 / 0.05) 0%, transparent 65%);
```

### ④ 噪点纹理

内联 SVG（`data:image/svg+xml;base64,...`），用 `feTurbulence` + `feColorMatrix` 生成高频灰度噪点，重复平铺。

### ⑤ 顶部柔光（不改）

```css
body::before {
  background: radial-gradient(ellipse 60% 50% at 50% 0%, oklch(0.72 0.15 85 / 0.06) 0%, transparent 70%);
}
```

## 技术约束

- **纯 CSS**：零 JS 开销，不影响交互性能
- **零额外请求**：SVG 噪点 base64 内联，不产生网络请求
- **oklch 色彩空间**：与项目现有 Tailwind v4 主题完全兼容
- **响应式**：所有渐变基于百分比定位，自适应窗口尺寸
- **覆盖模式**：多层 `background-image` 逗号分隔，叠加在 `bg-background` 之上

## 验收标准

- [ ] 页面加载后，背景有可见的玻璃反光质感（光带 + 虹彩边缘）
- [ ] 光带位置固定，不闪烁、不动画
- [ ] 暗色底色仍然主导，光效不刺眼
- [ ] 文字、卡片、导航栏可读性不受影响
- [ ] 在 1920px 和 375px 宽度下光带位置合理
