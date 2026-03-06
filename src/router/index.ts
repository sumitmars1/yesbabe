import { ChildCareFilled } from "@vicons/material";
import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";
import { nextTick } from "vue";
import Style from "@/views/Creator/Style.vue";
import { useAuthStore } from "@/stores/auth";
import { showLoginModal } from "@/utils/authModal";
import { SUPPORTED_LANGUAGES, setLanguage, type SupportedLanguage } from "@/utils/i18n";
import { hasRegionRestrictionOverlay } from "@/utils/htmlResponse";

const showLoginModalWithRegionGuard = (initialView: "login" | "register" = "login") => {
  if (hasRegionRestrictionOverlay() || document.getElementById("region-restriction-overlay")) {
    return;
  }

  let cancelled = false;
  const onRegionRestricted = () => {
    cancelled = true;
  };

  window.addEventListener("region-restriction:shown", onRegionRestricted, { once: true });

  setTimeout(() => {
    window.removeEventListener("region-restriction:shown", onRegionRestricted);
    if (cancelled) return;
    if (hasRegionRestrictionOverlay() || document.getElementById("region-restriction-overlay")) {
      return;
    }
    showLoginModal(initialView);
  }, 150);
};

const routes: RouteRecordRaw[] = [
  {
    path: '/profile',
    name: 'Profile',
    component: () => import('@/views/Profile/index.vue'),
    meta: { headerName: 'header.profile', headerType: 'MobileDefault' },
  },
  {
    path: "/profile/purchased-collections",
    name: "ProfilePurchasedCollections",
    component: () => import("@/views/Profile/PurchasedCollectionsPage.vue"),
    meta: {
      requiresAuth: true,
      headerName: "profilePage.purchasedCollections",
      headerType: "MobileDefault",
    },
  },
  {
    path: "/profile/consumption-details",
    name: "ConsumptionDetails",
    component: () => import("@/views/Profile/ConsumptionDetail.vue"),
    meta: {
      requiresAuth: true,
      headerName: "components.consumptionDetailModal.title",
      headerType: "MobileDefault",
    },
  },
  {
    path: "/",
    name: "Home",
    component: () => import("@/views/HomeView.vue"),
    meta: { headerName: 'menu.home' },
  },
  {
    path: "/chat",
    name: "Chat",
    component: () => import("@/views/Chat/index.vue"),
    meta: { requiresAuth: true, headerName: 'menu.chat', headerType: 'MobileDefault' },
  },
  {
    path: "/chat/ai",
    name: "ChatAI",
    component: () => import("@/views/Chat/index.vue"),
    meta: { requiresAuth: true, headerType: 'Chat', headerName: 'menu.chat' },
  },
  {
    path: "/chat/profile/:id",
    name: "ChatProfile",
    component: () => import("@/views/Chat/index.vue"),
    meta: { requiresAuth: true, headerType: 'Chat', headerName: 'profile.userProfile' },
  },
  {
    path: "/chat/collections/:id",
    name: "ChatCollections",
    component: () => import("@/views/Collection/CollectionList.vue"),
    meta: { requiresAuth: true, headerType: 'CollectionHeader', headerName: 'collection.collections' },
  },
  {
    path: "/chat/collections/:companionId/files/:collectionId",
    name: "ChatCollectionFiles",
    component: () => import("@/views/Collection/CollectionFilesPage.vue"),
    meta: { requiresAuth: true, headerType: 'CollectionHeader', headerName: 'collection.collectionFiles' },
  },
  // {
  //   path: "/chat/profile/:id",
  //   name: "ChatProfile",
  //   component: () => import("@/views/Chat/index.vue"),
  //   meta: { requiresAuth: true, headerType: 'Chat' },
  // },
  {
    path: "/premium",
    name: "Premium",
    component: () => import("@/views/Premium/index.vue"),
    meta: { headerName: 'header.subscription', headerType: 'Premium' },
    redirect: "/premium/pro", // 默认重定向到pro页面
    children: [
      {
        path: "pro",
        name: "PremiumPro",
        component: () => import("@/views/Premium/Premium.vue"),
        meta: { requiresAuth: true, headerName: 'header.pro', headerType: 'Premium' },
      },
      {
        path: "diamonds",
        name: "PremiumDiamonds",
        component: () => import("@/views/Premium/PurchaseDiamonds.vue"),
        meta: { requiresAuth: true, headerName: 'header.buyDiamonds', headerType: 'Premium' },
      },
    ]
  },
  {
    path: "/terms-of-service",
    name: "TermsOfService",
    component: () => import("@/views/TermsOfService/index.vue"),
    meta: { headerName: 'menu.termsOfService' },
  },
  {
    path: "/ja/terms-of-service",
    name: "TermsOfServiceJP",
    component: () => import("@/views/TermsOfService/index.vue"),
    meta: { headerName: 'menu.termsOfService', lang: 'ja-JP' },
  },
  {
    path: "/faq",
    name: "FAQ",
    component: () => import("@/views/FAQ/index.vue"),
    meta: { headerName: 'menu.faq' },
  },
  {
    path: "/create",
    name: "Create",
    component: () => import("@/views/Creator/index.vue"),
    meta: { requiresAuth: true, headerType: 'Create' },
    redirect: "/create/style", // 添加默认重定向
    children: [
      {
        path: "style",
        component: Style,
      },
      {
        path: "race",
        component: () => import("@/views/Creator/StepOptions.vue"),
      },
      {
        path: "body",
        component: () => import("@/views/Creator/StepOptions.vue"),
      },
      {
        path: "hair",
        component: () => import("@/views/Creator/StepOptions.vue"),
      },
      {
        path: "personality",
        component: () => import("@/views/Creator/StepOptions.vue"),
      },
      {
        path: "relationship",
        component: () => import("@/views/Creator/StepOptions.vue"),
      },
      {
        path: "models",
        component: () => import("@/views/Creator/CreatedModels.vue"),
      },
    ],
  },
  {
    path: "/ai-generator",
    name: "AIGenerator",
    component: () => import("@/views/AIGenerator/index.vue"),
    meta: {
      requiresAuth: true,
      headerName: 'menu.generator',
      headerType: 'MobileDefault'
    },
  },
  {
    path: "/ai-generator/result",
    name: "AIGeneratorResult",
    component: () => import("@/views/AIGenerator/result.vue"),
    meta: {
      headerName: 'menu.generator',
      headerType: 'MobileDefault'
    },
  },
  {
    path: "/ai-generator/select-model",
    name: "AIGeneratorSelectModel",
    component: () => import("@/views/AIGenerator/SelectModelPage.vue"),
    meta: {
      requiresAuth: true,
      headerName: 'generator.selectModel',
      headerType: 'MobileDefault'
    },
  },
  {
    path: "/my-roles",
    name: "MyRoles",
    component: () => import("@/views/MyRoles/index.vue"),
    meta: {
      headerName: 'myRoles.title',
      requiresAuth: true
    },
  },
  {
    path: "/coupon",
    name: "Coupon",
    component: () => import("@/views/Coupon/index.vue"),
    meta: {
      headerName: 'coupon.title',
      headerType: 'MobileDefault',
      requiresAuth: true
    },
  },
];

const router = createRouter({
  history: createWebHistory(),
  routes,
});
/**
 * 路由守卫：处理登录验证、加载条和滚动
 */

router.beforeEach(async (to, from, next) => {
  const metaLang = to.meta.lang as SupportedLanguage | undefined;
  if (metaLang && SUPPORTED_LANGUAGES[metaLang] && localStorage.getItem('user_selected_language') !== metaLang) {
    setLanguage(metaLang);
  }

  const authStore = useAuthStore();

  // 开始加载条（使用 header 中的 loading bar）
  if (window.$headerLoadingBar) {
    window.$headerLoadingBar.start()
  }

  // 处理创建流程页面的刷新重定向
  // 只在真正的页面刷新时（from.matched.length === 0）重定向回风格页面
  // 从其他创建页面正常跳转时不重定向
  const createPaths = ['/create/race', '/create/body', '/create/hair', '/create/personality', '/create/relationship'];
  if (createPaths.includes(to.path) && from.matched.length === 0) {
    // 停止加载条
    if (window.$headerLoadingBar) {
      window.$headerLoadingBar.finish()
    }
    return next('/create/style');
  }

  // 检查目标路由是否需要认证
  if (to.matched.some(record => record.meta.requiresAuth)) {
    // 如果用户有 token 但没有 userInfo，等待用户信息加载完成
    // 这可以防止页面刷新时因为 userInfo 还未加载而误判为未登录
    if (authStore.isLoggedIn && !authStore.userInfo && !authStore.isTokenBeingVerified) {
      try {
        // 等待用户信息加载完成
        await authStore.fetchUserInfo();
        await authStore.handleGetAccountInfo();
      } catch (error) {
        // 如果获取用户信息失败（token 可能已过期），清除登录状态
        console.error('获取用户信息失败:', error);
        // 静默登出，不刷新页面
        await authStore.logoutSilently(false);
        // 显示登录模态框
        if (window.$headerLoadingBar) {
          window.$headerLoadingBar.finish()
        }
        showLoginModalWithRegionGuard('login');
        return next(false);
      }
    }

    // 如果需要认证但用户未登录
    if (!authStore.isLoggedIn) {
      // 停止加载条
      if (window.$headerLoadingBar) {
        window.$headerLoadingBar.finish()
      }
      // 显示登录模态框
      showLoginModalWithRegionGuard('login');
      // 阻止导航
      return next(false);
    } else {
      // 如果用户已登录，则允许访问
      next();
    }
  } else {
    // 如果路由不需要认证，则直接允许访问
    next();
  }
});

router.afterEach(() => {
  // 切换路由后滚动到顶部
  // PC端滚动整个window
  window.scrollTo(0, 0);
  
  // 移动端需要滚动固定定位的内容容器
  nextTick(() => {
    const mobileContent = document.querySelector('.mobile-content');
    if (mobileContent) {
      mobileContent.scrollTop = 0;
    }
  });
  
  // 完成加载条
  setTimeout(() => {
    if (window.$headerLoadingBar) {
      window.$headerLoadingBar.finish()
    }
  }, 200); // 增加少量延迟以确保用户体验更流畅
});
export default router;
