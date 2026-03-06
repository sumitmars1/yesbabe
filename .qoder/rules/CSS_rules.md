---
trigger: always_on
---
# CSS Rules

## 核心原则
- **优先使用 UnoCSS**：所有样式优先通过 UnoCSS 工具类实现
- **自定义 class 作为补充**：仅在以下情况编写自定义 class：
  - UnoCSS 不支持的复杂样式
  - 需要跨文件或多处复用的样式
  - 需要动态计算的复杂 CSS 属性

## 命名规范
- 自定义 class 使用 `kebab-case` 命名
- 业务组件前缀：`bc-`（如 `bc-user-card`）
- 布局组件前缀：`ly-`（如 `ly-sidebar`）
- 工具类前缀：`u-`（如 `u-ellipsis`）

## 文件组织
src/
  styles/
    index.css          # 全局基础样式
    variables.css      # CSS 变量（主题色、间距等）
    utilities.css      # 自定义工具类
    components/        # 组件级复用样式
      button.css
      card.css

## 示例

### ✅ 推荐：使用 UnoCSS
<template>
  <!-- 使用 UnoCSS 工具类 -->
  <div class="flex items-center justify-between px-4 py-2 bg-primary text-white rounded-lg shadow-md">
    <span class="text-sm font-medium">标题</span>
    <button class="hover:bg-primary-dark transition-colors duration-200">按钮</button>
  </div>
</template>

### ✅ 允许：自定义 class（复杂/复用场景）
<template>
  <!-- 复杂动画，UnoCSS 难以表达 -->
  <div class="bc-floating-card">
    悬浮卡片内容
  </div>
</template>

<style scoped>
.bc-floating-card {
  position: fixed;
  backdrop-filter: blur(10px);
  animation: float 3s ease-in-out infinite;
}

@keyframes float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}
</style>

## 禁止事项
- ❌ 不使用 `@apply` 大量堆砌 UnoCSS 类（失去原子化优势）
- ❌ 不编写仅使用一次的复杂自定义 class
- ❌ 不使用深度选择器 `:deep()` 覆盖组件库样式（优先通过 props 或配置修改）

## UnoCSS 快捷配置建议
在 `uno.config.ts` 中预设常用组合：
shortcuts: {
  'btn-primary': 'px-4 py-2 bg-primary text-white rounded hover:bg-primary-dark transition-colors',
  'card-base': 'bg-white rounded-lg shadow p-4',
  'flex-center': 'flex items-center justify-center',
}
