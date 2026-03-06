# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

```bash
# Development
npm run dev                 # Start development server on port 5173

# Build
npm run build              # Production build
npm run build:dev          # Development build
npm run preview            # Preview build locally
```

## High-Level Architecture

### Tech Stack
- **Frontend**: Vue 3.5+ with Composition API + TypeScript + Vite
- **UI Framework**: Naive UI 2.41+ with auto-import
- **CSS**: UnoCSS with atomic CSS and custom theme system
- **State Management**: Pinia 3.0+ with persistence plugin
- **Routing**: Vue Router 4.5+ with authentication guards
- **Internationalization**: Vue i18n 9.14+ (zh-CN/en-US)
- **HTTP Client**: Axios 1.9+ with comprehensive interceptors
- **Real-time**: Custom WebSocket composables for chat and notifications
- **Build Tools**: Vite 6.3+ with optimized asset bundling
- **Development**: VConsole for mobile debugging, Better Scroll for enhanced scrolling

### Project Structure

```
src/
├── api/              # API layer with TypeScript interfaces
│   ├── auth/         # Authentication APIs (login, register, profile)
│   ├── chat/         # Chat and messaging APIs
│   ├── create/       # AI character creation APIs
│   ├── premium/      # Subscription and payment APIs
│   ├── notification/ # Notification system APIs
│   └── AIGenerator/  # AI content generation APIs
├── components/       # Reusable Vue components (PascalCase naming)
├── composables/      # Vue composition functions (use* pattern)
├── layouts/          # Layout components (Desktop/Mobile responsive)
├── locales/          # i18n language files (zh-CN, en-US)
├── router/           # Vue Router configuration with auth guards
├── stores/           # Pinia stores (auth, chat, create, theme, etc.)
├── utils/            # Utility functions (http, theme, modals, websocket)
├── types/            # TypeScript type definitions
├── views/            # Page components (route-level components)
└── assets/           # Static assets (SVG icons, images)
```

### Key Architectural Patterns

#### State Management (Pinia)
- **Composition API Style**: All stores use functions returning reactive state
- **Modular Architecture**: `auth` (tokens, user info), `chat` (messages, unread counts), `global` (UI state), `theme` (theming)
- **Persistence Strategy**: User data fetched fresh on load, tokens persisted locally
- **Account Management**: Automatic balance polling and consumption tracking
- **Reactive Patterns**: Use `storeToRefs()` to maintain reactivity when destructuring

#### HTTP Client Architecture (`src/utils/http.ts`)
- **Custom Axios Wrapper** with comprehensive error handling and duplicate request prevention
- **Request Interceptors**: Auto-token injection, language headers, fingerprint tracking, account refresh markers
- **Response Interceptors**: 401 silent logout, 403 login prompts, automatic account balance updates
- **Form Handling**: Automatic serialization for `application/x-www-form-urlencoded` and `multipart/form-data`
- **Rate Limiting**: Built-in duplicate request prevention with AbortController

#### Authentication & Authorization
- **Dual Logout Strategy**: `logout()` for user actions (refreshes page), `logoutSilently()` for system errors (no refresh)
- **Route Guards**: Router-based authentication with automatic login prompts
- **Token Management**: JWT tokens with automatic refresh on API calls
- **Account Polling**: Real-time balance updates after consuming operations
- **Error Handling**: 401 triggers silent logout, 403 shows login modal

#### WebSocket Architecture (Advanced Real-time System)
- **Singleton Pattern**: `useWebSocket` composable with shared connection state across components
- **Multi-Protocol Support**: Chat messaging, image generation, video generation, notifications
- **Connection Management**: Auto-reconnection with exponential backoff, heartbeat monitoring
- **Message Normalization**: Unified message format handling different content types
- **State Persistence**: Messages saved to localStorage for offline viewing
- **Type Safety**: Comprehensive TypeScript interfaces for all message types

#### Component System
- **Global Components**: `SvgIcon` (auto-registered), `BabeButton` (standardized button variants)
- **Naming Conventions**: PascalCase for components, kebab-case for events
- **Composition API**: All components use `<script setup>` with TypeScript
- **Props Pattern**: `defineProps` with `withDefaults` for type-safe prop definitions
- **Responsive Design**: Desktop/Mobile layouts with breakpoint-aware components

#### Modal Management System
- **Centralized Utilities**: `authModal.ts`, `subscriptionModal.ts`, `consumptionModal.ts`, `messageQuotaModal.ts`
- **Consistent API**: `showLoginModal('login'|'register')`, `showSubscriptionModal()`
- **State Integration**: Modals automatically integrate with auth store and routing

#### Internationalization (i18n)
- **Dynamic Language Detection**: Browser preference → saved setting → fallback to zh-CN
- **API Integration**: Language headers automatically sent with all requests
- **Persistent Settings**: User language choice saved across sessions
- **Type Safety**: TypeScript interfaces for translation keys

#### Theming System
- **CSS Custom Properties**: Dynamic theming via CSS variables
- **System Integration**: Automatic dark/light mode detection
- **Persistent Settings**: Theme preference saved and restored
- **UnoCSS Integration**: Atomic CSS with theme-aware utilities

#### Asset Management
- **SVG Icon System**: Auto-registered SVG icons with `createSvgIconsPlugin`
- **Optimized Bundling**: Assets categorized by type (js, css, images) with hash-based naming
- **CDN Integration**: Static assets proxied through development server

### Development Guidelines

#### Coding Style & Conventions
- **Indentation**: 2 spaces
- **Semicolons**: End lines with semicolons
- **Quotes**: Prefer double quotes for strings
- **Components**: PascalCase folders with `index.vue` entry (e.g., `src/components/MyWidget/index.vue`)
- **Composables**: `useXxx.ts` pattern (e.g., `src/composables/useScroll.ts`)
- **Stores**: `xxxStore.ts` or domain folders under `src/stores/`
- **Feature Colocation**: Keep feature assets colocated (e.g., `views/Feature/`), share-only code in `utils/`

### Type Checking
```bash
npm run lint              # Type check with vue-tsc
npx vue-tsc --noEmit      # Run type check without emit
```

### Testing Guidelines
- No test runner is currently configured
- If adding tests, prefer Vitest + Vue Test Utils
- Place tests under `src/__tests__/` and name `*.spec.ts`
- Aim for 80%+ coverage on new/changed code

### Commit & PR Guidelines
- Use Conventional Commits: `feat(scope): message`, `fix(scope): message`, `refactor`, `style`, etc.
- PRs must include: clear description, linked issues, screenshots/gifs for UI changes
- Ensure dev server runs, build succeeds, and no TypeScript errors before requesting review

### Security Guidelines
- **Never commit secrets** to the repository
- Only use `VITE_` prefix for client-safe environment variables
- API proxy configuration is in `vite.config.ts` (`/api`)

### Internationalization
- **Supported Languages**: zh-CN, en-US, vi-VN, pt-PT, ja-JP, hi-IN
- **Fallback Chain**: Browser preference → saved setting → fallback to vi-VN
- Language headers are automatically sent with all API requests

### Component Development
- **Composition API Exclusively**: Use `<script setup>` syntax
- **TypeScript Integration**: Proper type definitions for props, emits, and reactive data
- **Reactive Patterns**: Use `ref`, `computed`, and `watch` effectively
- **Performance**: Consider `v-show` vs `v-if`, use `computed` for expensive calculations
- **Styling**: Prefer UnoCSS utility classes (e.g., `text-lg`, `bg-primary`, `flex gap-3`) before adding custom CSS

#### API Integration
- **Centralized HTTP Client**: All requests through `src/utils/http.ts`
- **TypeScript Interfaces**: Define request/response types in corresponding API modules
- **Error Handling**: Rely on HTTP interceptors for consistent error management
- **Authentication**: Tokens automatically managed by interceptors

#### WebSocket Usage
- **Singleton Pattern**: Use `useWebSocket()` composable for shared connection state
- **Message Types**: Understand different message phases (start, progress, complete)
- **Error Handling**: Implement proper error states and retry logic
- **Performance**: Messages automatically persisted to localStorage

#### State Management Best Practices
- **Store Composition**: Use composition API style stores for better type inference
- **Reactivity**: Use `storeToRefs()` when destructuring to maintain reactivity
- **Side Effects**: Handle async operations in store actions, not components
- **Persistence**: Use pinia-plugin-persistedstate for critical user data

#### Environment Configuration
- **Development Proxy**: API calls proxied to backend during development
- **WebSocket URLs**: Configurable WebSocket endpoints with auto-detection
- **Feature Flags**: Environment-specific feature toggles
- **Build Optimization**: Different build configurations for development/production

## Environment Variables

Key environment variables in `.env.development`:
- `VITE_API_BASE_URL` - Backend API base URL
- `VITE_WS_BASE_URL` - WebSocket server URL (use "auto" for automatic detection)
- `VITE_APP_PORT` - Development server port (default: 5173)
- `VITE_API_TIMEOUT` - HTTP request timeout (default: 30000ms)
- `VITE_WS_HEARTBEAT_INTERVAL` - WebSocket heartbeat interval
- `VITE_WS_RECONNECT_INTERVAL` - WebSocket reconnection delay
- `VITE_WS_MAX_RECONNECT_ATTEMPTS` - Maximum reconnection attempts
- `VITE_APP_DEBUG` - Enable debug logging
- `VITE_APP_CLIENT_ID` - Client identifier for API requests

## 使用准则概览
- 用 Unocss 必须使用Unocss来编写样式
- 回复语言必须使用简体中文。
- 接到需求后先整理详细的 to-do 列表，发送用户确认;若用户提出修改意见，需重新整理并确认。
- 需求确认后，请用户确认需求，并给出详细需求描述。
- 开发过程中若有任何不确定之处，必须主动向用户提问
- 如果用户没有要求测试，则严禁启动开发服务器和打包测试
- 默认用户已经启动服务器，地址：http://localhost:5173/，严禁私自启动服务器
