# AI-Chat 项目开发规范

本文档旨在为 AI-Chat 项目提供一套统一的开发规范，以确保代码库的长期健康、可维护性和团队协作效率。

## 1. 代码风格

- **格式化**：所有代码提交前必须使用 Prettier 进行格式化，确保代码风格统一。
- **Linting**：遵循项目根目录下 `.eslintrc.js` 文件中定义的 ESLint 规则，以减少潜在错误和不规范的写法。

## 2. 组件规范

### 2.1. 命名与目录

- **组件命名**：所有组件文件名和组件内 `name` 属性均使用 **PascalCase** 风格（例如：`MyComponent.vue`）。
- **目录结构**：
  - **通用组件**：存放于 `src/components/` 目录下，按功能或业务模块进行分组。
  - **页面视图组件**：存放于 `src/views/` 目录下，每个视图对应一个子目录。

### 2.2. API 使用

- **Composition API**：所有组件优先使用 Composition API（组合式 API），以提高逻辑复用性和代码组织性。
- **Props 定义**：使用 `defineProps` 宏定义组件的 props，并使用 `withDefaults` 为可选 props 提供默认值。
- **事件定义**：使用 `defineEmits` 宏定义组件触发的事件，事件名使用 **kebab-case** 风格（例如：`'update:model-value'`）。

## 3. 组合式函数 (Composables)

- **命名规范**：所有组合式函数均以 `use` 开头（例如：`useWebSocket.ts`）。
- **职责单一**：每个组合式函数应只关注一件事情，保持其功能的内聚性。
- **返回响应式数据**：函数内部应使用 `ref`、`reactive` 等创建响应式数据，并将其作为返回值，以便在组件中使用。

## 4. 状态管理 (Pinia)

- **模块化**：根据业务领域在 `src/stores/` 目录下创建独立的 store 模块（例如：`auth`、`chat`、`theme`）。
- **数据解构**：在组件中使用 `storeToRefs` 来解构 store 中的状态，以保持其响应性。

## 5. API 请求

- **模块化**：所有 API 请求均在 `src/api/` 目录下按模块进行封装（例如：`auth`、`chat`）。
- **请求封装**：所有请求均基于 `src/utils/http.ts` 中封装的 `axios` 实例，该实例已处理了请求拦截、响应拦截、错误处理等通用逻辑。

## 6. 类型定义 (TypeScript)

- **类型文件**：所有全局或共享的 TypeScript 类型定义均存放于 `src/types/` 目录下。
- **命名规范**：接口（`interface`）和类型别名（`type`）均使用 **PascalCase** 风格。

## 7. 国际化 (i18n)

- **语言文件**：所有本地化文本均存放于 `src/locales/` 目录下的语言文件中（例如：`en-US.ts`、`zh-CN.ts`）。
- **配置**：国际化配置遵循 `src/utils/i18n.ts` 中的设置。

## 8. 路由管理

- **配置文件**：所有路由均在 `src/router/index.ts` 文件中进行统一配置。
- **路由命名**：路由的 `name` 属性使用 **kebab-case** 风格（例如：`'chat-room'`）。

## 9. 样式规范 (UnoCSS)

- **原子化 CSS**：项目使用 UnoCSS 进行原子化 CSS 开发，以提高样式复用性和开发效率。
- **配置文件**：所有 UnoCSS 的配置均在 `uno.config.ts` 文件中进行定义。

## 10. 性能优化

- **计算属性**：对于依赖多个响应式数据的复杂逻辑，优先使用 `computed` 进行缓存。
- **条件渲染**：根据场景合理选择 `v-if`（高切换开销）和 `v-show`（高初始渲染开销）。

## 11. 统一方法调用

为了确保项目的一致性，以下是部分常用功能的统一调用方式：

- **登录/注册弹窗**：
  - **调用方式**：通过调用 `showLoginModal` 函数来显示登录/注册弹窗。
  - **函数来源**：`import { showLoginModal } from '@/utils/authModal';`
  - **参数**：支持传入 `'login'`（默认）或 `'register'` 作为初始视图。
  - **示例**：`showLoginModal('register');`

- **订阅弹窗**：
  - **调用方式**：通过调用 `showSubscriptionModal` 函数来显示订阅弹窗。
  - **函数来源**：`import { showSubscriptionModal } from '@/utils/subscriptionModal';`

# BabeButton Component Rules

## Overview

The `BabeButton` is a wrapper component built around Naive UI's `n-button`. It provides a standardized set of styles and predefined behaviors to ensure a consistent look and feel across the application.

## Props

The component accepts the following properties:

| Prop          | Type                                       | Default     | Description                                                                                             |
|---------------|--------------------------------------------|-------------|---------------------------------------------------------------------------------------------------------|
| `variant`     | `'primary'` \| `'default'` \| `'secondary'` \| `'text'` | `'primary'` | Defines the button's style. `primary` has a gradient background, `secondary` and `default` have borders, and `text` is a plain text button. |
| `size`        | `'small'` \| `'medium'` \| `'large'`          | `'large'`   | Sets the size of the button.                                                                            |
| `loading`     | `boolean`                                  | `false`     | When `true`, displays a loading indicator.                                                              |
| `disabled`    | `boolean`                                  | `false`     | When `true`, the button is disabled and cannot be clicked.                                              |
| `round`       | `boolean`                                  | `true`      | If `true`, the button will have rounded corners.                                                        |
| `text`        | `string`                                   | `''`        | The text to display inside the button. Can also be provided via the default slot.                       |
| `loadingText` | `string`                                   | `'加载中...'` | Text to display when the button is in a loading state.                                                  |

## Slots

### `default`

The default slot is used to place content inside the button, such as text or icons.

**Example:**

```vue
<BabeButton>
  Click Me
</BabeButton>
```

## Events

### `click`

This event is emitted when the button is clicked. It passes the native DOM event object as its payload.

**Signature:** `(event: MouseEvent) => void`

## Usage Examples

### Primary Button

```vue
<BabeButton variant="primary" size="large">
  Primary Action
</BabeButton>
```

### Default Button

```vue
<BabeButton variant="default" size="medium">
  Default Action
</BabeButton>
```

### Secondary Button

```vue
<BabeButton variant="secondary" size="small">
  Secondary Action
</BabeButton>
```

### Text Button

```vue
<BabeButton variant="text">
  Text Action
</BabeButton>
```

### Loading State

```vue
<BabeButton :loading="true">
  Submitting...
</BabeButton>
```

### Disabled State

```vue
<BabeButton :disabled="true">
  Cannot Click
</BabeButton>
```