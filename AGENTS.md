# Repository Guidelines

## Project Structure & Module Organization
- `src/`: Vue 3 + TypeScript app.
  - `components/` (PascalCase folders, `index.vue` entry), `views/`, `api/`, `stores/` (Pinia), `composables/`, `utils/`, `router/`, `locales/`, `types/`, `assets/`.
  - Aliases: `@` → `./src`, `~` → repo root (see `vite.config.ts`).
- `public/`: static assets served as-is. `dist/`: build output.
- Config: `vite.config.ts`, `uno.config.ts`, `tsconfig*.json`, `.env.development`, `.env.production`.

## Build, Test, and Development Commands
- `pnpm dev` (or `npm run dev`): start Vite dev server. Uses `.env.development` and `VITE_APP_PORT`.
- `pnpm build` (or `npm run build`): production build to `dist/`.
- `pnpm run build:dev`: development-mode build.
- `pnpm preview` (or `npm run preview`): preview built `dist/` locally.
- Type check: `npx vue-tsc --noEmit`.

## Coding Style & Naming Conventions
- Language: TypeScript + Vue SFCs (Composition API).
- Indentation 2 spaces; end lines with semicolons; prefer double quotes for strings.
- Components PascalCase: `src/components/MyWidget/index.vue`.
- Composables `useXxx.ts` (e.g., `src/composables/useScroll.ts`). Stores `xxxStore.ts` or domain folders under `src/stores/`.
- Keep feature assets colocated (e.g., `views/Feature/`), share-only code in `utils/`.
- Prefer UnoCSS utility classes (e.g., `text-lg`, `bg-primary`, `flex gap-3`) for styling before adding custom CSS.

## Testing Guidelines
- No test runner is configured. If adding tests, prefer Vitest + Vue Test Utils.
- Place tests under `src/__tests__/` and name `*.spec.ts`.
- Aim for 80%+ coverage on new/changed code; include edge cases and i18n.
- Run type checks (`vue-tsc`) in CI if no tests are present.

## Commit & Pull Request Guidelines
- Use Conventional Commits: `feat(scope): message`, `fix(scope): message`, `refactor`, `style`, etc. (see `git log`).
- PRs must include: clear description, linked issues, screenshots/gifs for UI changes, and testing steps.
- Ensure dev server runs, build succeeds, and no TypeScript errors before requesting review.

## Security & Configuration Tips
- Do not commit secrets. Only expose client-safe vars with `VITE_` prefix.
- API proxy/config lives in `vite.config.ts` (`/api`), adjust via env when possible.
- Keep SVGs under `src/assets/icons/svg` (auto-registered); update `uno.config.ts` for design tokens.
## 使用准则概览
- 回复语言必须使用简体中文。
- 接到需求后先整理详细的 to-do 列表，发送用户确认;若用户提出修改意见，需重新整理并确认。
- 需求确认后，请用户确认需求，并给出详细需求描述。
- 执行 to-do 时，每完成一项都要暂停并请用户确认后再继续下一项,若用户回复全部执行,则不需要每一步都确认,直接完成所有步骤的执行。
- 涉及代码或文档改动时，使用审批流程，请用户确认后再提交最终变更。
- 开发过程中若有任何不确定之处，必须主动向用户提问
- 在代码修改完成之后，向用户请求测试，并且你需要review刚才所修改的代码。
- 如果用户没有要求，则严禁启动开发服务器和打包测试