# AI-Chat Project Agent Guide

## Build/Dev Commands
- `npm run dev` - Start development server
- `npm run build` - Production build
- `npm run build:dev` - Development build
- `npm run preview` - Preview production build
- No tests found in project

## Architecture
Vue 3 + TypeScript + Vite project with:
- **UI Framework**: Naive UI
- **CSS**: UnoCSS for styling
- **State**: Pinia with persistence
- **Routing**: Vue Router
- **i18n**: Vue I18n
- **Backend API**: Proxied to http://47.94.83.43:8000/api

## Code Style (from .cursor/rules)
- Use Composition API with `<script setup lang="ts">`
- Component names: PascalCase (e.g., `Header`, `SideBar`)
- Props: `defineProps` with TypeScript, `withDefault` for defaults
- Events: `defineEmits`
- Composables: prefix with `use` (e.g., `useThemeStore`)
- Imports: `@/` alias for src/, organize by type (components, stores, etc.)
- File structure: components/, views/, composables/, utils/, api/, types/, assets/
- Performance: Use `computed` appropriately, choose `v-show` vs `v-if`
- TypeScript: Type all props, use `defineComponent` when needed
## 使用准则概览
- 回复语言必须使用简体中文。
- 接到需求后先整理详细的 to-do 列表，发送用户确认;若用户提出修改意见，需重新整理并确认。
- 需求确认后，请用户确认需求，并给出详细需求描述。
- 执行 to-do 时，每完成一项都要暂停并请用户确认后再继续下一项,若用户回复全部执行,则不需要每一步都确认,直接完成所有步骤的执行。
- 涉及代码或文档改动时，使用审批流程，请用户确认后再提交最终变更。
- 开发过程中若有任何不确定之处，必须主动向用户提问
- 在代码修改完成之后，向用户请求测试，并且你需要review刚才所修改的代码。
- 如果用户没有要求，则严禁启动开发服务器和打包测试