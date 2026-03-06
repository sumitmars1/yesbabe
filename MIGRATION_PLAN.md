# AI-Chat 项目 Vue 迁移到 React 计划文档

## 1. 项目概述

### 1.1 当前技术栈 (Vue)

| 类别 | 技术 | 版本 |
|------|------|------|
| 框架 | Vue 3 | 3.5.13 |
| 构建工具 | Vite | 6.3.5 |
| UI 框架 | Naive UI + Element Plus | 2.41.0 / 2.11.8 |
| 状态管理 | Pinia | 3.0.2 |
| 路由 | Vue Router | 4.5.1 |
| CSS 方案 | UnoCSS | 66.1.0 |
| HTTP 客户端 | Axios | 1.9.0 |
| 国际化 | Vue I18n | 9.14.4 |
| 实时通信 | 自定义 WebSocket | - |

### 1.2 目标技术栈 (React)

| 类别 | 技术 | 推荐版本 |
|------|------|----------|
| 框架 | React | 19+ |
| 构建工具 | Vite | 6.x |
| UI 组件库 | shadcn/ui | latest |
| 状态管理 | Zustand | 5.x |
| 路由 | React Router | 6.x |
| CSS 方案 | Tailwind CSS | 3.x |
| HTTP 客户端 | Axios + React Query | latest |
| 国际化 | react-i18next | latest |
| 实时通信 | 自定义 WebSocket Hook | - |
| 表单处理 | React Hook Form | latest |
| 工具函数 | lodash-es, dayjs | latest |

---

## 2. 项目结构对比

### 2.1 当前 Vue 项目结构

```
src/
├── api/                    # API 层 (按业务模块划分)
│   ├── AIGenerator/       # AI 图片生成
│   ├── auth/              # 认证相关
│   ├── chat/              # 聊天相关
│   ├── collection/        # 收藏集相关
│   ├── coupon/            # 优惠券相关
│   ├── create/            # 角色创建
│   ├── home/              # 首页相关
│   ├── notification/      # 通知相关
│   ├── premium/           # 订阅付费
│   └── user/              # 用户相关
├── assets/                 # 静态资源
├── components/             # 通用组件 (50+)
├── composables/            # Vue 组合式函数 (14 个)
├── layouts/                # 布局组件
├── locales/                # 国际化文件 (6 种语言)
├── router/                 # 路由配置
├── stores/                 # Pinia Store
├── types/                  # TypeScript 类型定义
├── utils/                  # 工具函数
├── views/                  # 页面组件 (13 个主要视图)
├── App.vue                 # 根组件
└── main.ts                 # 入口文件
```

### 2.2 目标 React 项目结构

```
src/
├── api/                    # API 层 (保持不变)
│   └── ...
├── assets/                 # 静态资源
├── components/             # 通用组件
│   ├── ui/                # shadcn/ui 基础组件
│   └── ...                # 业务组件
├── hooks/                  # 自定义 React Hooks
│   ├── useWebSocket.ts
│   ├── useAuth.ts
│   ├── useChat.ts
│   └── ...
├── layouts/                # 布局组件
├── locales/                # 国际化文件
├── pages/                  # 页面组件 (对应原 views)
├── stores/                 # Zustand Store
├── types/                  # TypeScript 类型定义
├── utils/                  # 工具函数
├── App.tsx                 # 根组件
├── main.tsx                # 入口文件
└── router/                 # 路由配置
```

---

## 3. 迁移清单

### 3.1 核心配置迁移

#### 3.1.1 包管理配置 (package.json)

**需要移除的依赖:**
```json
// 移除 Vue 相关
"vue": "^3.5.13",
"vue-router": "^4.5.1",
"pinia": "^3.0.2",
"pinia-plugin-persistedstate": "^4.2.0",
"vue-i18n": "^9.14.4",
"vue-types": "^6.0.0",
"@vitejs/plugin-vue": "^5.2.3",
"vue-tsc": "^2.2.8",
"@vue/tsconfig": "^0.7.0",

// 移除 UI 框架
"naive-ui": "^2.41.0",
"element-plus": "^2.11.8",
"@element-plus/icons-vue": "^2.3.2",
"@vicons/ionicons5": "^0.13.0",
"@vicons/material": "^0.13.0",

// 移除 CSS 方案
"unocss": "^66.1.0",
"unocss-preset-theme": "^0.14.1",

// 移除自动导入
"unplugin-auto-import": "^19.2.0",
"unplugin-vue-components": "^28.5.0",

// 移除 Vue 特定库
"vue-audio-visual": "^3.0.11",
```

**需要添加的依赖:**
```json
// React 核心
"react": "^18.3.1",
"react-dom": "^18.3.1",

// React 插件
"@vitejs/plugin-react": "^4.3.0",

// UI 组件
"classnames": "^2.5.1",
"class-variance-authority": "^0.7.0",
"clsx": "^2.1.0",
"tailwind-merge": "^2.2.0",
"lucide-react": "^0.400.0",

// 状态管理
"zustand": "^5.0.0",

// 路由
"react-router-dom": "^6.22.0",

// CSS
"tailwindcss": "^3.4.0",
"postcss": "^8.4.35",
"autoprefixer": "^10.4.17",

// 数据请求
"@tanstack/react-query": "^5.28.0",
"@tanstack/react-query-devtools": "^5.28.0",

// 国际化
"react-i18next": "^14.1.0",
"i18next": "^23.10.0",

// 表单处理
"react-hook-form": "^7.51.0",
"@hookform/resolvers": "^3.3.4",
"zod": "^3.22.4",

// 动画
"framer-motion": "^11.0.8",

// 工具
"ahooks": "^3.8.0",
```

#### 3.1.2 Vite 配置迁移 (vite.config.ts)

```typescript
// 当前配置需要修改的部分:
// 1. 移除 Vue 插件
// 2. 移除 SVG Icons 插件 (改用 lucide-react)
// 3. 移除 UnoCSS 插件
// 4. 移除 Auto Import 相关插件
// 5. 添加 React 插件

import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");

  return {
    plugins: [
      react(), // Vue -> React
      // 移除 UnoCSS, 使用 Tailwind CSS
    ],
    resolve: {
      alias: {
        "@": path.resolve(__dirname, "./src"),
      },
      extensions: [".mjs", ".js", ".ts", ".jsx", ".tsx", ".json"], // 移除.vue
    },
    // 其他配置保持不变...
  };
});
```

#### 3.1.3 TypeScript 配置

```typescript
// tsconfig.json 需要调整
{
  "compilerOptions": {
    "target": "ES2020",
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx", // 修改为 React JSX
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
```

### 3.2 入口文件迁移

#### 3.2.1 main.ts -> main.tsx

**当前 Vue 入口:**
```typescript
import { createApp } from "vue";
import App from "./App.vue";
import router from "./router";
import { createPinia } from "pinia";
import { createI18nInstance } from "@/utils/i18n";
import ElementPlus from "element-plus";

const app = createApp(App);
app.use(router);
app.use(createPinia());
app.use(createI18nInstance());
app.use(ElementPlus);
app.mount("#app");
```

**目标 React 入口:**
```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import i18n from './utils/i18n';

import './index.css'; // Tailwind CSS

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <I18nextProvider i18n={i18n}>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <App />
        </BrowserRouter>
      </QueryClientProvider>
    </I18nextProvider>
  </React.StrictMode>
);
```

### 3.3 路由迁移

#### 3.3.1 路由配置对比

**当前 Vue Router:**
```typescript
const routes: RouteRecordRaw[] = [
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile/index.vue'),
    meta: {
      headerName: 'header.profile',
      headerType: 'MobileDefault',
      requiresAuth: true
    },
  },
  // ...
];

router.beforeEach(async (to, from, next) => {
  // 路由守卫逻辑
});
```

**目标 React Router:**
```tsx
const router = createBrowserRouter([
  {
    path: '/profile',
    element: (
      <PrivateRoute>
        <Profile />
      </PrivateRoute>
    ),
    handle: {
      headerName: 'header.profile',
      headerType: 'MobileDefault',
    },
  },
  // ...
]);

// 认证保护组件
function PrivateRoute({ children }: { children: ReactNode }) {
  const { isLoggedIn } = useAuthStore();
  const location = useLocation();

  if (!isLoggedIn) {
    showLoginModal('login');
    return null;
  }

  return children;
}
```

#### 3.3.2 路由迁移清单

| 原路径 | 目标路径 | 组件 | 认证要求 | 备注 |
|--------|----------|------|----------|------|
| `/` | `/` | HomeView | 无 | 首页 |
| `/chat` | `/chat` | Chat | 需要 | 聊天列表 |
| `/chat/ai` | `/chat/ai` | Chat | 需要 | AI 聊天 |
| `/chat/profile/:id` | `/chat/profile/:id` | Chat | 需要 | 用户资料 |
| `/premium` | `/premium` | Premium | 无 | 订阅页 |
| `/premium/pro` | `/premium/pro` | PremiumPro | 需要 | Pro 订阅 |
| `/premium/diamonds` | `/premium/diamonds` | PremiumDiamonds | 需要 | 钻石购买 |
| `/create` | `/create` | Create | 需要 | 角色创建 |
| `/ai-generator` | `/ai-generator` | AIGenerator | 需要 | AI 生成器 |
| `/my-roles` | `/my-roles` | MyRoles | 需要 | 我的角色 |
| `/profile` | `/profile` | Profile | 需要 | 个人中心 |
| `/coupon` | `/coupon` | Coupon | 需要 | 优惠券 |
| `/terms-of-service` | `/terms` | TermsOfService | 无 | 服务条款 |
| `/faq` | `/faq` | FAQ | 无 | 常见问题 |

### 3.4 状态管理迁移

#### 3.4.1 Store 迁移清单

**当前 Pinia Stores:**
- `auth/index.ts` - 认证状态 (token, userInfo, accountInfo)
- `chat/index.ts` - 聊天状态 (currentChat, messages)
- `themeStore.ts` - 主题状态
- `global/global.ts` - 全局 UI 状态
- `create/index.ts` - 角色创建状态
- `aigenerator/index.ts` - AI 生成器状态
- `notification/index.ts` - 通知状态
- `menu/index.ts` - 菜单状态
- `coupon/index.ts` - 优惠券状态
- `imageGenerator/index.ts` - 图片生成器状态

**目标 Zustand Stores:**

```typescript
// stores/auth.ts
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
  accountInfo: AccountInfo | null;
  isLoading: boolean;
  isLoggedIn: boolean;
  // Actions
  setToken: (token: string) => void;
  clearToken: () => void;
  fetchUserInfo: () => Promise<void>;
  logout: (shouldRedirectToHome?: boolean) => Promise<void>;
  logoutSilently: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: localStorage.getItem('token'),
      userInfo: null,
      accountInfo: null,
      isLoading: false,
      isLoggedIn: !!localStorage.getItem('token'),

      setToken: (token) => {
        localStorage.setItem('token', token);
        set({ token, isLoggedIn: true });
      },

      clearToken: () => {
        localStorage.removeItem('token');
        set({ token: null, userInfo: null, accountInfo: null, isLoggedIn: false });
      },

      // ...其他方法
    }),
    {
      name: 'auth-storage',
      partialize: (state) => ({ token: state.token }),
    }
  )
);
```

### 3.5 组件迁移

#### 3.5.1 组件分类

**A 类 - 基础 UI 组件 (优先用 shadcn/ui 替换):**

| 原组件 | shadcn/ui 替代 | 备注 |
|--------|---------------|------|
| BabeButton | Button | 需保留自定义样式 |
| SvgIcon | Lucide Icon / SVG | 改用 lucide-react |
| LoadingIndicator | Spinner | - |
| Tag | Badge | - |
| Upload | Input type="file" + dropzone | - |
| SkeletonLoader | Skeleton | shadcn 内置 |
| CustomImage | Image | 自定义封装 |
| VideoPlayer | Video | 使用 react-player |
| CustomCarousel | Carousel | shadcn 扩展 |
| InfinityScroll | 虚拟列表 | react-virtuoso |
| Dropdown | Dropdown Menu | shadcn |
| Modal/Dialog | Dialog | shadcn |
| Drawer | Drawer | shadcn |
| Tabs | Tabs | shadcn |
| ScrollArea | ScrollArea | shadcn |

**B 类 - 业务组件 (需要完整迁移):**

| 组件路径 | 功能 | 优先级 |
|----------|------|--------|
| Header/index.vue | 顶部导航栏 | P0 |
| SideBar/index.vue | 侧边栏 | P0 |
| Footer/index.vue | 底部导航 | P0 |
| Menu/index.vue | 菜单组件 | P0 |
| CustomMenu/index.vue | 自定义菜单 | P0 |
| RoleCard/index.vue | 角色卡片 | P1 |
| ModelCard/index.vue | 模型卡片 | P1 |
| Collection/CollectionCard.vue | 收藏集卡片 | P1 |
| Notification* | 通知相关 | P1 |
| SubscriptionModal | 订阅弹窗 | P1 |
| PaymentModal | 支付弹窗 | P1 |
| ConsumptionModal | 消费弹窗 | P1 |
| ProfileModal | 资料弹窗 | P1 |
| MessageQuotaModal | 额度弹窗 | P1 |
| DiamondRechargeModal | 钻石充值 | P1 |
| AgeGateModal | 年龄验证 | P2 |
| DeleteAccountModal | 删除账号 | P2 |
| ChangePasswordModal | 修改密码 | P2 |

**C 类 - 聊天相关组件:**

| 组件 | 功能 | 复杂度 |
|------|------|--------|
| Chat/Chat.vue | 聊天主组件 | 高 |
| Chat/ChatItem.vue | 聊天项 | 中 |
| Message/Message.vue | 消息组件 | 高 |
| Message/MessageItem.vue | 消息项 | 高 |
| MessageCards/* | 各类消息卡片 | 高 |
| Profile.vue | 聊天资料页 | 中 |
| CollectionsMobile.vue | 移动端收藏 | 中 |

#### 3.5.2 组件迁移示例

**Vue 组件 (BabeButton):**
```vue
<template>
  <button
    :class="[
      'inline-flex items-center justify-center rounded-md text-sm font-medium',
      'transition-colors focus-visible:outline-none focus-visible:ring-2',
      'disabled:pointer-events-none disabled:opacity-50',
      variantStyles[variant],
      sizeStyles[size],
      className,
    ]"
    :disabled="disabled"
    @click="handleClick"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
interface Props {
  variant?: 'default' | 'primary' | 'link';
  size?: 'default' | 'sm' | 'lg';
  disabled?: boolean;
  className?: string;
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default',
  size: 'default',
  disabled: false,
  className: '',
});

const emit = defineEmits<{
  click: [e: MouseEvent];
}>();

const variantStyles = { ... };
const sizeStyles = { ... };

const handleClick = (e: MouseEvent) => {
  emit('click', e);
};
</script>
```

**React 组件 (Button):**
```tsx
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/utils/cn';

const buttonVariants = cva(
  'inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 disabled:pointer-events-none disabled:opacity-50',
  {
    variants: {
      variant: {
        default: 'bg-primary text-primary-foreground hover:bg-primary/90',
        primary: 'bg-blue-600 text-white hover:bg-blue-700',
        link: 'text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-10 px-4 py-2',
        sm: 'h-9 rounded-md px-3',
        lg: 'h-11 rounded-md px-8',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export { Button, buttonVariants };
```

### 3.6 HTTP 客户端迁移

#### 3.6.1 当前 Axios 封装

当前 `src/utils/http.ts` 已使用 Axios，可大部分保留:

**需要修改的部分:**
1. 移除 Naive UI message 依赖
2. 修改为 React 友好的错误提示方式
3. 移除 Pinia Store 动态导入

**React 版本 HTTP 工具:**
```typescript
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { useAuthStore } from '@/stores/auth';
import { showErrorToast } from '@/components/ui/Toast';

class HttpRequest {
  private instance: AxiosInstance;

  constructor() {
    this.instance = axios.create({
      baseURL: import.meta.env.VITE_API_PREFIX,
      timeout: 50000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors() {
    // 请求拦截器
    this.instance.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      config.headers['Accept-Language'] = this.getAcceptLanguage();
      config.headers['X-Fingerprint'] = this.generateFingerprint();
      return config;
    });

    // 响应拦截器
    this.instance.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          // 处理 401
          useAuthStore.getState().logoutSilently();
        }
        if (error.response?.data?.message) {
          showErrorToast(error.response.data.message);
        }
        return Promise.reject(error);
      }
    );
  }

  public request<T>(config: AxiosRequestConfig): Promise<T> {
    return this.instance.request<T>(config);
  }
}

export const http = new HttpRequest();
```

#### 3.6.2 添加 React Query

```typescript
// hooks/useQuery.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { http } from '@/utils/http';

// 获取用户信息
export function useUserInfo() {
  return useQuery({
    queryKey: ['userInfo'],
    queryFn: () => http.get<UserInfo>('/user/me'),
  });
}

// 获取账户信息
export function useAccountInfo() {
  return useQuery({
    queryKey: ['accountInfo'],
    queryFn: () => http.get<AccountInfo>('/user/account'),
  });
}

// 登录
export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: LoginRequest) =>
      http.post<LoginResponse>('/login/token', data),
    onSuccess: (response) => {
      localStorage.setItem('token', response.access_token);
      queryClient.invalidateQueries({ queryKey: ['userInfo'] });
    },
  });
}
```

### 3.7 WebSocket 迁移

#### 3.7.1 当前 WebSocket Composable

当前 `useWebSocket.ts` 是 Vue Composition API，需改为 React Hook:

**Vue 版本:**
```typescript
export function useWebSocket(options: WebSocketOptions) {
  const ws = ref<WebSocket | null>(null);
  const isConnected = ref(false);
  const message = ref<any>(null);

  const connect = () => {
    ws.value = new WebSocket(options.url);
    ws.value.onmessage = (event) => {
      message.value = JSON.parse(event.data);
    };
  };

  const send = (data: any) => {
    ws.value?.send(JSON.stringify(data));
  };

  return { ws, isConnected, message, connect, send };
}
```

**React 版本:**
```typescript
// hooks/useWebSocket.ts
import { useCallback, useEffect, useRef, useState } from 'react';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (data: any) => void;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (error: Event) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export function useWebSocket(options: UseWebSocketOptions) {
  const [isConnected, setIsConnected] = useState(false);
  const [message, setMessage] = useState<any>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttempts = useRef(0);
  const reconnectTimer = useRef<NodeJS.Timeout>();

  const connect = useCallback(() => {
    wsRef.current = new WebSocket(options.url);

    wsRef.current.onopen = () => {
      setIsConnected(true);
      reconnectAttempts.current = 0;
      options.onOpen?.();
    };

    wsRef.current.onmessage = (event) => {
      const data = JSON.parse(event.data);
      setMessage(data);
      options.onMessage?.(data);
    };

    wsRef.current.onclose = () => {
      setIsConnected(false);
      options.onClose?.();

      // 自动重连
      if (reconnectAttempts.current < (options.maxReconnectAttempts ?? 5)) {
        reconnectTimer.current = setTimeout(() => {
          reconnectAttempts.current += 1;
          connect();
        }, options.reconnectInterval ?? 3000);
      }
    };

    wsRef.current.onerror = (error) => {
      options.onError?.(error);
    };
  }, [options.url, options.reconnectInterval, options.maxReconnectAttempts]);

  const send = useCallback((data: any) => {
    wsRef.current?.send(JSON.stringify(data));
  }, []);

  const disconnect = useCallback(() => {
    if (reconnectTimer.current) {
      clearTimeout(reconnectTimer.current);
    }
    wsRef.current?.close();
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return { isConnected, message, send, disconnect };
}
```

### 3.8 国际化迁移

#### 3.8.1 当前 Vue I18n

```typescript
// 当前实现
import { createI18n } from 'vue-i18n';

const i18n = createI18n({
  legacy: false,
  locale: 'vi-VN',
  messages: { ... }
});
```

#### 3.8.2 目标 react-i18next

```typescript
// utils/i18n.ts
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import zhCN from '@/locales/zh-CN';
import enUS from '@/locales/en-US';
import viVN from '@/locales/vi-VN';
import ptPT from '@/locales/pt-PT';
import jaJP from '@/locales/ja-JP';
import hiIN from '@/locales/hi-IN';

const resources = {
  'zh-CN': { translation: zhCN },
  'en-US': { translation: enUS },
  'vi-VN': { translation: viVN },
  'pt-PT': { translation: ptPT },
  'ja-JP': { translation: jaJP },
  'hi-IN': { translation: hiIN },
};

i18n.use(initReactI18next).init({
  resources,
  lng: localStorage.getItem('language') || 'vi-VN',
  fallbackLng: 'vi-VN',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;

// Hook 使用
export function useTranslation() {
  const { t, i18n } = reactI18next.useTranslation();

  const changeLanguage = (lng: string) => {
    localStorage.setItem('language', lng);
    i18n.changeLanguage(lng);
  };

  return { t, i18n, changeLanguage };
}
```

### 3.9 CSS/Tailwind 迁移

#### 3.9.1 UnoCSS -> Tailwind CSS

**当前 UnoCSS 配置:**
- 使用 CSS 变量定义主题色
- 自定义 spacing, colors, shortcuts

**Tailwind CSS 配置:**
```javascript
// tailwind.config.js
/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        background: 'var(--c-background)',
        primary: 'var(--c-text-primary)',
        secondary: 'var(--c-text-secondary)',
        hoverBackground: 'var(--c-hover-background)',
        // ... 其他语义色
      },
      spacing: {
        'page-x': 'var(--page-x-padding)',
        'page-y': 'var(--page-y-padding)',
        'first': 'var(--first-margin)',
        'second': 'var(--second-margin)',
        // ... 其他间距
      },
      boxShadow: {
        'active-border': 'var(--active-border)',
        'border': 'var(--border)',
        'hover-border': 'var(--hover-border)',
      },
    },
  },
  plugins: [],
};
```

### 3.10 布局组件迁移

#### 3.10.1 DesktopLayout

**Vue 版本:**
```vue
<template>
  <div class="desktop-root">
    <Header />
    <div class="desktop-main">
      <aside class="sidebar" :style="{ width: sidebarWidth }">
        <SideBar />
      </aside>
      <n-scrollbar class="content">
        <router-view />
      </n-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useGlobalStore } from '@/stores/global/global';
const global = useGlobalStore();
const sidebarWidth = computed(() =>
  global.sidebarCollapsed ? '90px' : '280px'
);
</script>
```

**React 版本:**
```tsx
import { useGlobalStore } from '@/stores/global';
import { Outlet } from 'react-router-dom';
import { ScrollArea } from '@/components/ui/ScrollArea';

export function DesktopLayout() {
  const { sidebarCollapsed } = useGlobalStore();

  return (
    <div className="desktop-root">
      <Header />
      <div className="desktop-main">
        <aside
          className="sidebar"
          style={{ width: sidebarCollapsed ? '90px' : '280px' }}
        >
          <SideBar />
        </aside>
        <ScrollArea className="content">
          <Outlet />
        </ScrollArea>
      </div>
    </div>
  );
}
```

#### 3.10.2 MobileLayout

需要处理移动端特有的:
- 底部 Footer
- 抽屉式菜单
- 安全区域适配

---

## 4. 迁移步骤

### 阶段一：环境准备 (Day 1-2)

- [x] 创建新的 React + TypeScript + Vite 项目
- [x] 安装所有必要依赖
- [x] 配置 Tailwind CSS
- [x] 配置 shadcn/ui
- [x] 配置 React Router
- [x] 配置 Zustand
- [x] 配置 React Query
- [x] 配置 react-i18next

### 阶段二：核心工具迁移 (Day 3-4)

- [x] HTTP 客户端迁移
- [x] WebSocket Hook 迁移
- [x] 国际化迁移
- [x] 工具函数迁移
- [x] 类型定义迁移

### 阶段三：状态管理迁移 (Day 5-6)

- [x] Auth Store 迁移
- [x] Chat Store 迁移
- [x] Theme Store 迁移
- [x] Global Store 迁移
- [x] 类型定义迁移

### 阶段四：基础组件迁移 (Day 7-10)

- [x] Button 组件
- [ ] shadcn/ui 基础组件安装
- [x] 自定义基础组件
- [x] Icon 系统 (使用 lucide-react)
- [x] Layout 组件 

### 阶段五：业务组件迁移 (Day 11-20)

按页面模块分批次迁移:

**第一批 (P0):**
- [x] Header
- [x] SideBar / Footer
- [x] Menu
- [x] Loading components

**第二批 (P1):**
- [x] RoleCard / ModelCard
- [x] Collection 相关
- [x] Notification 相关
- [x] 各种 Modal 组件

**第三批 (P2):**
- [x] 聊天相关组件
- [x] 消息卡片组件
- [x] 支付相关组件

### 阶段六：页面迁移 (Day 21-30)

按路由顺序迁移:

1. [x] HomeView (首页)
2. [x] Chat (聊天页)
3. [x] Premium (订阅页)
4. [x] Create (创建页)
5. [x] AIGenerator (AI 生成器)
6. [x] Profile (个人中心)
7. [x] MyRoles (我的角色)
8. [x] 其他页面

### 阶段七：测试与优化 (Day 31-35)

- [ ] 功能测试
- [ ] 性能优化
- [ ] 响应式测试
- [ ] 国际化测试
- [ ] 浏览器兼容性测试

---

## 5. 待确认事项

在开始迁移前，请确认以下事项:

### 5.1 技术选型确认

1. **UI 组件库**: 确定使用 shadcn/ui 还是其他方案 (如 Ant Design, MUI)?
2. **动画库**: 是否需要 framer-motion 或其他动画库?
3. **图表库**: 项目是否需要图表功能 (如 Recharts)?

### 5.2 功能确认

1. **WebSocket**: 聊天/通知的 WebSocket 是否需要全部保留?
2. **Better Scroll**: 是否需要继续使用或改用原生滚动?
3. **媒体播放**: 音视频播放功能的具体需求?

### 5.3 设计确认

1. **主题系统**: 暗黑/明亮模式是否需要保留?
2. **响应式断点**: 是否与现有保持一致?
3. **动画效果**: 是否需要完全复刻现有动画?

---

## 6. 风险与挑战

### 6.1 技术风险

1. **WebSocket 重连机制**: 需要仔细处理重连逻辑
2. **消息状态管理**: 聊天消息的 localStorage 持久化
3. **表单验证**: 复杂表单的验证逻辑迁移

### 6.2 性能风险

1. **首次加载体积**: React + 组件库可能增加包体积
2. **列表渲染性能**: 长列表需要虚拟滚动优化
3. **图片/视频加载**: 需要懒加载和预加载策略

### 6.3 兼容性风险

1. **浏览器支持**: 确保目标浏览器支持
2. **移动端适配**: iOS/Android 特殊处理

---

## 7. 附录

### 7.1 参考资源

- [React 官方文档](https://react.dev)
- [React Router 文档](https://reactrouter.com)
- [Zustand 文档](https://zustand-demo.pmnd.rs)
- [shadcn/ui 文档](https://ui.shadcn.com)
- [Tailwind CSS 文档](https://tailwindcss.com)
- [React Query 文档](https://tanstack.com/query)

### 7.2 代码对照表

| Vue 概念 | React 对应 |
|----------|-----------|
| `ref()` | `useState` |
| `computed()` | `useMemo` |
| `watch()` | `useEffect` |
| `onMounted()` | `useEffect(() => {}, [])` |
| `defineProps` | `props` |
| `defineEmits` | 回调函数 props |
| `slots` | `children` / render props |
| `v-model` | `value + onChange` |
| `v-if/v-show` | 条件渲染 |
| `v-for` | `map()` |
| `@click` | `onClick` |

---

*文档生成时间：2026-02-25*
*项目版本：Vue 3.5.13 → React 18.3+*
