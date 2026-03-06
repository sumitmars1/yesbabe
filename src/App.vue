<template>
  <n-config-provider
    :theme="themeStore.themeName === 'dark' ? darkTheme : undefined"
    :theme-overrides="themeStore.naiveOverridesTheme"
  >
    <n-loading-bar-provider>
      <n-dialog-provider>
        <n-message-provider :duration="5000">
          <n-notification-provider>
            <AgeGateModal
              v-model:show="showAgeGateModal"
              @confirm="handleAgeGateConfirm"
            />
            <DesktopLayout v-if="!globalStore.isMobile" />
            <MobileLayout v-else />
            <CookieConsent />
          </n-notification-provider>
        </n-message-provider>
      </n-dialog-provider>
    </n-loading-bar-provider>
  </n-config-provider>
</template>
<script setup lang="ts">
import { darkTheme, NSpin } from "naive-ui";
import { ref, onMounted, watch, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
// import AuthForm from "@/components/AuthForm/index.vue";
import DesktopLayout from "@/layouts/DesktopLayout.vue";
import MobileLayout from "@/layouts/MobileLayout.vue";
import AgeGateModal from "@/components/AgeGateModal/index.vue";
import CookieConsent from "@/components/CookieConsent/index.vue";
import { useThemeStore } from "@/stores/themeStore";
const themeStore = useThemeStore();
import { createDiscreteApi } from "naive-ui";
const isAuthInitializing = ref(true); // Track if authentication is being initialized
const { message } = createDiscreteApi(["message"]);
window["$message"] = message;

type AgeGateSessionState = {
  confirmed: boolean;
  confirmedAt: number;
};

const AGE_GATE_SESSION_KEY = "jp_age_gate_confirmed_v1";

const showAgeGateModal = ref(false);
const { locale } = useI18n();

const isJapaneseLocale = (val: string) => {
  return String(val).toLowerCase().startsWith("ja");
};

const readAgeGateSessionState = (): AgeGateSessionState | null => {
  try {
    const raw = sessionStorage.getItem(AGE_GATE_SESSION_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as AgeGateSessionState;
    if (typeof parsed !== "object" || parsed === null) return null;
    if (typeof parsed.confirmed !== "boolean") return null;
    if (typeof parsed.confirmedAt !== "number") return null;
    return parsed;
  } catch {
    return null;
  }
};

const isAgeGateConfirmedInSession = () => {
  return readAgeGateSessionState()?.confirmed === true;
};

const syncAgeGateVisibility = () => {
  if (!isJapaneseLocale(locale.value)) {
    showAgeGateModal.value = false;
    return;
  }
  if (!isAgeGateConfirmedInSession()) {
    showAgeGateModal.value = true;
  }
};

const handleAgeGateConfirm = () => {
  try {
    const payload: AgeGateSessionState = {
      confirmed: true,
      confirmedAt: Date.now(),
    };
    sessionStorage.setItem(AGE_GATE_SESSION_KEY, JSON.stringify(payload));
  } catch {
  }
  showAgeGateModal.value = false;
};

// 创建 loadingBar 的函数，在主题初始化后调用
let loadingBar: any;
const createLoadingBar = () => {
  const { loadingBar: bar } = createDiscreteApi(["loadingBar"], {
    configProviderProps: {
      theme: themeStore.themeName === "dark" ? darkTheme : undefined,
      themeOverrides: themeStore.naiveOverridesTheme
    },
    loadingBarProviderProps: {
      to: ".header",
      loadingBarStyle: {
        loading: {
          backgroundColor: themeStore.naiveOverridesTheme?.LoadingBar?.colorLoading ?? "#7562FF",
          height: "1.5px"
        },
        error: {
          backgroundColor: themeStore.naiveOverridesTheme?.LoadingBar?.colorError ?? "#ff4757",
          height: "1.5px"
        }
      }
    }
  });
  return bar;
};

// 导入通知WebSocket composable
import { useNotificationWebSocket } from "@/composables/useNotificationWebSocket";
// 导入支付回调处理 composable
import { usePaymentCallback } from "@/composables/usePaymentCallback";
// 开发环境引入 vconsole
// if (import.meta.env.DEV) {
//   import("vconsole").then(({ default: VConsole }) => {
//     new VConsole();
//   });
// }
import { useAuthStore } from "@/stores/auth";
const authStore = useAuthStore();

// 初始化通知WebSocket
const notificationWebSocket = useNotificationWebSocket();

// 初始化支付回调处理
const paymentCallback = usePaymentCallback();

// Authentication initialization promise
let authInitPromise: Promise<void> | null = null;
let hasHandledPageShow = false;

const initializeAuth = async () => {
  // 如果已经登录，在应用启动时立即获取用户信息
  // 这样可以确保页面渲染时已有最新的账户数据
  if (authStore.isLoggedIn && !authStore.userInfo) {
    try {
      // 并行获取用户信息和账户信息
      await Promise.all([
        authStore.fetchUserInfo(),
        authStore.handleGetAccountInfo()
      ]);

      // 获取用户信息后，检查是否有支付回调
      await paymentCallback.checkPaymentCallback();

      // 如果有支付回调结果，显示通知
      if (paymentCallback.lastCheckResult.value) {
        paymentCallback.showPaymentResult();
      }
    } catch (error) {
      // 获取用户信息失败，可能是token已过期或无效
      // 不需要显示错误，路由守卫会处理这种情况
      console.error('应用初始化时获取用户信息失败:', error);
    }
  }
};

onMounted(async () => {
  try {
    // 存储认证初始化 promise
    authInitPromise = initializeAuth();

    // 并行执行主题初始化和认证初始化
    // 这样可以更快地获取用户数据，提升用户体验
    const [themeInitResult] = await Promise.allSettled([
      themeStore.initTheme(),
      authInitPromise
    ]);

    // 检查主题初始化结果
    if (themeInitResult.status === 'rejected') {
      console.error('主题初始化失败:', themeInitResult.reason);
    }

    // 创建并设置 loadingBar（主题初始化后才能创建）
    loadingBar = createLoadingBar();
    window["$headerLoadingBar"] = loadingBar;

    // 监听主题变化，重新创建 loadingBar
    watch(
      () => themeStore.themeName,
      () => {
        loadingBar = createLoadingBar();
        window["$headerLoadingBar"] = loadingBar;
      }
    );
  } finally {
    // Authentication initialization complete
    isAuthInitializing.value = false;
  }

  syncAgeGateVisibility();

  // 通知WebSocket会自动根据登录状态进行连接管理
  console.log('通知系统已初始化');

  const handlePageShow = async (event: PageTransitionEvent) => {
    if (!authStore.isLoggedIn) return
    const navigationEntry = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined
    const isBackForward = navigationEntry?.type === 'back_forward'
    if (!event.persisted && !isBackForward) return
    if (!hasHandledPageShow) {
      hasHandledPageShow = true
      return
    }
    try {
      await Promise.all([
        authStore.fetchUserInfo(),
        authStore.handleGetAccountInfo()
      ])
      await paymentCallback.checkPaymentCallback()
      if (paymentCallback.lastCheckResult.value) {
        paymentCallback.showPaymentResult()
      }
    } catch (error) {
      console.error('回跳刷新账户信息失败:', error)
    }
  }

  window.addEventListener('pageshow', handlePageShow)

  onUnmounted(() => {
    window.removeEventListener('pageshow', handlePageShow)
  })
});

watch(
  () => locale.value,
  () => {
    syncAgeGateVisibility();
  },
  { immediate: true }
);

// Function to wait for authentication initialization to complete
const waitForAuthInit = async () => {
  if (authInitPromise) {
    await authInitPromise;
  }
};
// 全局变量
import { useGlobalStore } from "@/stores/global/global";
const globalStore = useGlobalStore();

import { NConfigProvider, NMessageProvider, NNotificationProvider, NLoadingBarProvider } from "naive-ui";
</script>
<style scoped>
/* :deep(.n-scrollbar-content){
  height: 100%;
} */
/* 移动端分辨率兼容 */
.relative {
  /* 安全区域适配 */
  padding-top: env(safe-area-inset-top);
  padding-bottom: env(safe-area-inset-bottom);
  padding-left: env(safe-area-inset-left);
  padding-right: env(safe-area-inset-right);

  /* 确保内容区域占满整个视口 */
  min-height: 100vh;
  min-height: 100dvh; /* 动态视口高度，更适合移动端 */
}

/* 防止移动端双击缩放 */
* {
  touch-action: manipulation;
}

/* 移动端优化 */
@media screen and (max-width: 768px) {
  .relative {
    /* 移动端特定的安全区域处理 */
    padding-top: max(env(safe-area-inset-top), 0px);
    padding-bottom: max(env(safe-area-inset-bottom), 0px);
  }
}

/* 高分辨率屏幕适配 */
@media (-webkit-min-device-pixel-ratio: 2), (min-resolution: 192dpi) {
  .relative {
    /* 高分辨率屏幕的字体渲染优化 */
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
  }
}

/* 横屏适配 */
@media screen and (orientation: landscape) and (max-height: 500px) {
  .relative {
    /* 横屏时减少垂直内边距 */
    padding-top: max(env(safe-area-inset-top), 8px);
    padding-bottom: max(env(safe-area-inset-bottom), 8px);
  }
}
.dialog-card {
  max-width: 400px;
}
@media (max-width: 440px) {
  .dialog-card {
    width: calc(100% - 40px);
    margin: 0 auto;
  }
}
</style>
