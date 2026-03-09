<template>
  <div class="page-padding ">
    <div class="mb-secondMargin">
      <div v-if="filteredCarouselList.length === 0" class="carousel-container">
        <n-skeleton class="w-full h-full rounded-lg" :sharp="false" />
      </div>
      <n-carousel v-else show-arrow autoplay effect="fade" mousewheel draggable touchable class="carousel-container"
        :interval="5000" :show-dots="true">
        <!-- 第一张：Create AI - 居中布局，粉红背景 -->
        <n-carousel-item @click="handleCarouselClick(0)">
          <div class="carousel-item-layout carousel-item-bg w-full h-full cursor-pointer" style="background-color: #FF2E70;">
            <!-- 背景图片 -->
            <img src="@/assets/banner/create_ai.png" alt="Create AI" class="carousel-bg-image" />
            <!-- 文字 - 居中上方 -->
            <div class="carousel-text-overlay">
              <div class="carousel-title carousel-title-shadow font-semibold text-white leading-[1.4]">{{ getCarouselTitle(0) }}</div>
              <div class="carousel-desc carousel-desc-shadow font-semibold text-white leading-[1.4]">{{ getCarouselDesc(0) }}</div>
            </div>
          </div>
        </n-carousel-item>

        <!-- 第二张：First Purchase - 左右布局，紫色背景 -->
        <n-carousel-item @click="handleCarouselClick(1)">
          <div class="carousel-item-layout carousel-item-split-center w-full h-full cursor-pointer" style="background-color: #6F50FA;">
            <!-- 左侧图片 -->
            <div class="carousel-image-box-left">
              <img src="@/assets/banner/first_purchase.png" alt="First Purchase" class="w-full h-full object-contain" />
            </div>
            <!-- 右侧文字 -->
            <div class="flex flex-col justify-center items-start gap-[0.8vh] pl-[3vw]">
              <div class="carousel-title carousel-title-shadow font-semibold text-white leading-[1.4]">{{ getCarouselTitle(1) }}</div>
              <i18n-t keypath="home.carousel.desc2" tag="div" class="carousel-desc carousel-desc-shadow font-semibold text-white leading-[1.4]">
                <template #percent>
                  <span style="color: #FFEB3B;">{{ vipMaxDiscountPercent }}%</span>
                </template>
              </i18n-t>
            </div>
          </div>
        </n-carousel-item>

        <!-- 第三张：Private Theme - 居中布局，紫色背景 -->
        <n-carousel-item @click="handleCarouselClick(2)">
          <div class="carousel-item-layout carousel-item-bg w-full h-full cursor-pointer" style="background-color: #8E50FA;">
            <!-- 背景图片 -->
            <img src="@/assets/banner/private_theme.png" alt="Private Theme" class="carousel-bg-image" />
            <!-- 文字 - 居中上方 -->
            <div class="carousel-text-overlay">
              <div class="carousel-title carousel-title-shadow font-semibold text-white leading-[1.4]">{{ getCarouselTitle(2) }}</div>
              <div class="carousel-desc carousel-desc-shadow font-semibold text-white leading-[1.4]">{{ getCarouselDesc(2) }}</div>
            </div>
          </div>
        </n-carousel-item>
      </n-carousel>
    </div>
    <!-- 外层骨架屏：在请求 /index/navs 期间立即显示 -->
    <div v-if="initialLoading && homeList.length === 0"
      class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4 mb-4">
      <div v-for="i in 12" :key="i" class="role-card-skeleton h-[324px] rounded-2xl overflow-hidden max-w-[248px]">
        <div class="h-[240px] mb-3 rounded-t-2xl overflow-hidden">
          <n-skeleton class="w-full h-full" :sharp="false" />
        </div>
        <div class="px-3 space-y-2">
          <div class="flex justify-between items-center">
            <n-skeleton text style="width: 40%" />
            <n-skeleton circle style="width: 20px; height: 20px" />
          </div>
          <n-skeleton text :repeat="2" />
        </div>
      </div>
    </div>

    <n-tabs v-model:value="panelsValue" @update:value="handleTabChange" ref="tabsRef">
      <n-tab-pane v-for="nav in navList" :key="nav.id" :name="nav.name">
        <n-infinite-scroll :distance="10" @load="handleLoad">
          <!-- 骨架屏加载状态 -->
          <div v-if="loading && homeList.length === 0"
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            <div v-for="i in 12" :key="i"
              class="role-card-skeleton h-[324px] rounded-2xl overflow-hidden max-w-[248px]">
              <!-- 角色卡片骨架屏 -->
              <div class="h-[240px] mb-3 rounded-t-2xl overflow-hidden">
                <n-skeleton class="w-full h-full" :sharp="false" />
              </div>
              <div class="px-3 space-y-2">
                <div class="flex justify-between items-center">
                  <n-skeleton text style="width: 40%" />
                  <n-skeleton circle style="width: 20px; height: 20px" />
                </div>
                <n-skeleton text :repeat="2" />
              </div>
            </div>
          </div>

          <!-- 数据列表 -->

          <div v-else
            class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-4">
            <RoleCard v-for="item in homeList" :key="item.id" :role-data="item" @click="handleChatWithRole(item)" />

            <!-- 无数据提示 -->
            <n-empty v-if="!loading && homeList.length === 0" class="col-span-full py-8"
              :description="t('home.noData')" />
          </div>

          <!-- 底部加载更多状态 -->
          <div v-if="loading && homeList.length > 0" class="flex justify-center py-4">
            <n-spin size="small" />
          </div>
        </n-infinite-scroll>
      </n-tab-pane>
      <template #suffix>
        <n-select :theme-overrides="homeSelectDarkOverrides" @update:value="handleSexChange" v-model:value="sexValue"
          :options="sexOptions" :style="{ width: selectWidth }">
        </n-select>
      </template>
    </n-tabs>
  </div>
</template>
<script setup lang="ts">
import RoleCard from "@/components/RoleCard/index.vue";
import { Male, Female } from "@vicons/ionicons5";
import { NIcon } from "naive-ui";
import type { Component } from "vue";
import { h, ref, onMounted, onBeforeUnmount, computed, nextTick } from "vue";
import { useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import {
  getNavs,
  getHomeList,
  getNewList,
  getHotList,
  getCarousels,
} from "@/api/home";
import type {
  NavItem,
  HomeListResponse,
  HomeListData,
  HomeListQuery,
  NewListQuery,
  HotListQuery,
  CarouselItem,
} from "@/api/home/type";
import {
  getVipPrice,
  getVipMaxDiscountPercentByOneMonthStandard,
} from "@/api/premium";
import type { VipPriceItem } from "@/api/premium/types";

const { t, locale } = useI18n();

// VIP折扣相关
const vipPrices = ref<VipPriceItem[]>([]);
const vipMaxDiscountPercent = ref<number>(76);

// 根据语言动态计算select宽度
const selectWidth = computed(() => {
  // 中文：90px，英文：130px
  return locale.value === 'zh-CN' ? '90px' : '130px';
});

function renderIcon(icon: Component) {
  return () => {
    return h(NIcon, null, {
      default: () => h(icon),
    });
  };
}

// 轮播图数据
const carouselList = ref<CarouselItem[]>([]);
const isMobileView = ref(false);
let mediaQueryMatcher: MediaQueryList | null = null;
const handleMediaQueryChange = () => {
  updateDeviceMode();
};

const updateDeviceMode = () => {
  if (typeof window === "undefined") {
    return;
  }

  if (!mediaQueryMatcher) {
    mediaQueryMatcher = window.matchMedia("(max-width: 768px)");
  }

  isMobileView.value = mediaQueryMatcher.matches;
};

const filteredCarouselList = computed(() => {
  if (!carouselList.value.length) {
    return [] as CarouselItem[];
  }

  const sortedList = [...carouselList.value].map((item) => ({
    ...item,
    car_url: item.car_url.trim(),
  })).sort((a, b) => a.sort_order - b.sort_order);

  const mobileItems = sortedList.filter((item) => /app|mobile/i.test(item.name));
  const desktopItems = sortedList.filter((item) => /pc|desktop/i.test(item.name));

  if (isMobileView.value) {
    if (mobileItems.length) {
      return mobileItems.slice(0, 3);
    }
    if (desktopItems.length) {
      return desktopItems.slice(0, 3);
    }
  }

  if (desktopItems.length) {
    return desktopItems.slice(0, 3);
  }

  if (mobileItems.length) {
    return mobileItems.slice(0, 3);
  }

  return sortedList.slice(0, 3);
});

const handleCarouselClick = (index: number) => {
  // 根据轮播图索引跳转到对应页面
  const routes = ['ai-generator', '/premium/diamonds', '/premium/pro'];
  if (index >= 0 && index < routes.length) {
    router.push(routes[index]);
  }
};

const handleCarouselButtonClick = (item: CarouselItem) => {
  if (item.click_to_url) {
    window.location.href = item.click_to_url;
  }
};

// 加载VIP折扣
const loadVipDiscount = async () => {
  try {
    const { data } = await getVipPrice();
    vipPrices.value = data || [];
    vipMaxDiscountPercent.value =
      getVipMaxDiscountPercentByOneMonthStandard(vipPrices.value, 12) || 76;
  } catch {
    vipMaxDiscountPercent.value = 76;
  }
};

// 获取轮播图标题
const getCarouselTitle = (index: number): string => {
  const titles = [
    t('home.carousel.title1'),
    t('home.carousel.title2'),
    t('home.carousel.title3')
  ];
  return titles[index] || "";
};

// 获取轮播图描述
const getCarouselDesc = (index: number): string => {
  const descs = [
    t('home.carousel.desc1'),
    t('home.carousel.desc2'),
    t('home.carousel.desc3')
  ];
  return descs[index] || "";
};

// 导航数据
const navList = ref<NavItem[]>([]);
const defaultNav = computed(() => {
  return navList.value[0]?.name || "";
});
const panelsValue = ref("");
const currentNavId = ref<number>(0);

// 角色数据
const homeList = ref<HomeListData[]>([]);

// 分页参数
const pageParams = ref({
  size: 20,
  page: 1,
});

// 加载状态
const loading = ref(false);
// 初始加载阶段（并行请求轮播和导航时，立即显示角色骨架屏）
const initialLoading = ref(true);
const hasMore = ref(true);

// 筛选选择
const sexOptions = [
  { label: t('home.filter.newest'), value: "newest" },
  { label: t('home.filter.hottest'), value: "hottest" },
  { label: t('home.filter.recommend'), value: "recommend" },
];
const sexValue = ref<"newest" | "hottest" | "recommend">("newest");
const handleSexChange = (value: "newest" | "hottest" | "recommend") => {
  console.log(value);
  sexValue.value = value;
  // 重置分页参数
  pageParams.value = { size: 20, page: 1 };
  hasMore.value = true;
  // 清空当前列表数据
  homeList.value = [];
  // 加载对应的数据
  loadListData(false);
};
// 处理标签页切换
const handleTabChange = async (value: string) => {
  panelsValue.value = value;
  const currentNav = navList.value.find((nav) => nav.name === value);
  if (currentNav) {
    currentNavId.value = currentNav.id;
    // 重置分页参数
    pageParams.value = { size: 20, page: 1 };
    hasMore.value = true;
    // 清空当前列表数据
    homeList.value = [];
    // 加载对应的数据
    await loadListData(false);
  }
};

// 加载列表数据
const loadListData = async (isLoadMore = false) => {
  if (loading.value) return;

  loading.value = true;

  try {
    const queryParams: any = {
      nav_id: currentNavId.value,
      ...pageParams.value,
    };

    // 根据选中的选项设置sort_type参数
    queryParams.sort_type = sexValue.value;

    let { data } = await getHomeList(queryParams);
    homeList.value = isLoadMore
      ? [...homeList.value, ...(data.items || [])]
      : data.items || [];
    // 判断是否还有更多数据
    hasMore.value = data.has_next;
  } catch (error) {
    console.error("加载列表数据失败:", error);
  } finally {
    loading.value = false;
  }
};

// 加载更多
// 处理无限滚动加载
const handleLoad = async () => {
  if (!hasMore.value || loading.value) return false;

  pageParams.value.page += 1;
  await loadListData(true);

  return hasMore.value;
};

import { TabsInst } from "naive-ui";
const tabsRef = ref<TabsInst>();
// 获取路由信息
const route = useRoute();

// 加载初始数据
const loadData = async () => {
  try {
    initialLoading.value = true;
    // 并行请求：轮播图与导航
    const queryParams = Object.keys(route.query).length > 0 ? route.query : undefined;
    const [carouselRes, navRes] = await Promise.all([
      getCarousels(),
      getNavs(queryParams),
    ]);

    carouselList.value = carouselRes?.data || [];
    navList.value = navRes?.data || [];

    // 设置默认选中第一个导航并拉取列表
    if (navList.value.length > 0) {
      panelsValue.value = navList.value[0].name;
      currentNavId.value = navList.value[0].id;
      nextTick(() => {
        tabsRef.value.syncBarPosition();
      });
      // 结束初始阶段（此时开始列表请求，内部骨架屏接力显示）
      initialLoading.value = false;
      await loadListData();
    }
  } catch (error) {
    console.error("加载数据失败:", error);
  } finally {
    // 确保不残留初始阶段状态
    initialLoading.value = false;
  }
};
// import { useAuthStore } from "@/stores/auth";

onMounted(() => {
  if (typeof window !== "undefined") {
    mediaQueryMatcher = window.matchMedia("(max-width: 768px)");
    if (mediaQueryMatcher.addEventListener) {
      mediaQueryMatcher.addEventListener("change", handleMediaQueryChange);
    } else if (mediaQueryMatcher.addListener) {
      mediaQueryMatcher.addListener(handleMediaQueryChange);
    }
    updateDeviceMode();
  }

  loadData();
  loadVipDiscount();
  // 取消首页的账户信息请求，避免触发账户轮询
});

onBeforeUnmount(() => {
  if (mediaQueryMatcher) {
    if (mediaQueryMatcher.removeEventListener) {
      mediaQueryMatcher.removeEventListener("change", handleMediaQueryChange);
    } else if (mediaQueryMatcher.removeListener) {
      mediaQueryMatcher.removeListener(handleMediaQueryChange);
    }
    mediaQueryMatcher = null;
  }
});

import { useThemeStore } from "@/stores/themeStore";
const themeStore = useThemeStore();
const homeSelectDarkOverrides = computed(() => {
  return themeStore.themeName === "dark"
    ? {
      peers: {
        InternalSelection: {
          border: "1px solid #3C3A42",
          color: "transparent",
        },
      },
    }
    : undefined;
});

import { useChatStore } from "@/stores/chat";
const chatStore = useChatStore();
import { useAuthStore } from "@/stores/auth";
const authStore = useAuthStore();
import { showLoginModal } from "@/utils/authModal";
import { useRouter } from "vue-router";
const router = useRouter();
const handleChatWithRole = (roleData: HomeListData) => {
  // 检查用户是否已登录
  if (!authStore.isLoggedIn) {
    // 未登录时弹出登录窗口
    showLoginModal('login');
    return;
  }

  const companionId = roleData.id;
  chatStore
    .ensureCurrentChatByCompanionId(companionId, {
      name: roleData.name,
      t_head_image: roleData.t_head_image || "",
      liked: roleData.liked,
    })
    .catch(() => { });

  router.push({
    name: "ChatAI",
    query: {
      companionId,
    },
  });
};
</script>
<style scoped lang="scss">
:deep(.n-tabs.n-tabs--bar-type .n-tabs-tab.n-tabs-tab--active) {
  font-weight: 700;
  color: var(--c-text-primary);
}

:deep(.n-tabs-tab__label) {
  font-size: 16px;
  color: var(--c-tabs-text);
  font-weight: 700;
}

:deep(.n-tabs.n-tabs--bar-type .n-tabs-tab.n-tabs-tab--active .n-tabs-tab__label) {
  color: var(--c-text-primary) !important;
}

/* Home-only select: now styled via theme-overrides inline prop */

.carousel-container {
  height: 200px;
  border-radius: 8px;
  overflow: hidden;
}

@media (max-width: 768px) {
  .carousel-container {
    height: auto;
    aspect-ratio: 812 / 240;
  }

  .carousel-item {
    background-size: contain;
    background-repeat: no-repeat;
  }
}

.carousel-item {
  width: 100%;
  height: 100%;
  background-size: cover;
  background-position: center;
  display: flex;
  align-items: center;
  position: relative;
}

/* 轮播图图片容器 - 1:1 比例，高度为外层 80% */
.carousel-image-box {
  height: 80%;
  aspect-ratio: 1 / 1;
  border-radius: 8px;
  overflow: hidden;
}

/* 居中布局的图片容器 */
.carousel-image-box-center {
  height: 70%;
  max-width: 60%;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

/* 左右布局的左侧图片容器 */
.carousel-image-box-left {
  height: 80%;
  max-width: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-left: 4vw;
}

/* 居中布局 - 垂直排列，文字在上，图片在下 */
.carousel-item-center {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding-top: 2vh;
}

/* 左右布局 - 图片在左，文字在右 */
.carousel-item-split {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: flex-start;
}

/* 左右布局居中 - 图片在左，文字在右，整体居中 */
.carousel-item-split-center {
  display: flex;
  flex-direction: row;
  align-items: center;
  justify-content: center;
}

/* 背景图片布局 - 图片作为背景，文字覆盖在上 */
.carousel-item-bg {
  position: relative;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: flex-start;
  padding-top: 4vh;
  overflow: hidden;
}

/* 背景图片样式 - 占据 1/4 宽度，撑满高度，居中裁剪 */
.carousel-bg-image {
  position: absolute;
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  height: 100%;
  width: 25%;
  object-fit: cover;
  object-position: center;
}

/* 文字覆盖层 */
.carousel-text-overlay {
  position: relative;
  z-index: 10;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.8vh;
}

/* 标题文字阴影 */
.carousel-title-shadow {
  text-shadow: 0px 1px 3px rgba(0, 0, 0, 0.5);
}

/* 描述文字阴影 */
.carousel-desc-shadow {
  text-shadow: 0px 1px 3px rgba(0, 0, 0, 0.5);
}

/* 轮播图标题字体 - 响应式 */
.carousel-title {
  font-size: clamp(21px, 2.7vw, 36px);
}

/* 轮播图描述字体 - 响应式 */
.carousel-desc {
  font-size: clamp(18px, 2.25vw, 30px);
}

/* 移动端适配 */
@media (max-width: 768px) {

  .carousel-image-box {
    height: 70%;
  }

  .carousel-image-box-center {
    height: 60%;
    max-width: 80%;
  }

  .carousel-image-box-left {
    height: 55%;
    max-width: 45%;
    padding-left: 2vw;
  }

  .carousel-bg-image {
    height: 100%;
    width: 40%;
  }

  .carousel-item-bg {
    padding-top: 3vh;
  }

  .carousel-title {
    font-size: clamp(19px, 4.2vw, 32px);
  }

  .carousel-desc {
    font-size: clamp(15px, 3.7vw, 24px);
  }

  .carousel-item-split {
    justify-content: center;
  }
}

/* 轮播图箭头按钮样式 */
:deep(.n-carousel .n-carousel__arrow) {
  opacity: 0;
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
}

/* 轮播图指示器居中 */
:deep(.n-carousel .n-carousel__dots) {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  justify-content: center;
  display: flex;
  gap: 8px;
  z-index: 10;
  pointer-events: none;
}

/* 轮播图小圆点样式优化 - 响应式缩放 */
:deep(.n-carousel .n-carousel__dot) {
  width: clamp(4px, 1vw, 10px);
  height: clamp(4px, 1vw, 10px);
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.4);
  border: clamp(1px, 0.2vw, 2px) solid rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
}

:deep(.n-carousel .n-carousel__dot:hover) {
  background-color: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.n-carousel .n-carousel__dot--active) {
  background-color: rgba(255, 255, 255, 0.9);
  border-color: #ffffff;
  transform: scale(1.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* 暗色主题下的小圆点样式 */
:deep([data-theme="dark"] .n-carousel .n-carousel__dot) {
  background-color: rgba(0, 0, 0, 0.4);
  border-color: rgba(0, 0, 0, 0.6);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
  width: clamp(4px, 1vw, 10px);
  height: clamp(4px, 1vw, 10px);
  border-width: clamp(1px, 0.2vw, 2px);
}

:deep([data-theme="dark"] .n-carousel .n-carousel__dot:hover) {
  background-color: rgba(0, 0, 0, 0.6);
  border-color: rgba(0, 0, 0, 0.8);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

:deep([data-theme="dark"] .n-carousel .n-carousel__dot--active) {
  background-color: rgba(0, 0, 0, 0.9);
  border-color: #000000;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3);
}

.carousel-content {
  position: relative;
  z-index: 1;
}

.carousel-content h3 {
  font-size: 24px;
  margin-bottom: 16px;
}

.carousel-actions {
  margin-top: 16px;
}

/* 骨架屏样式 */
.role-card-skeleton {
  background-color: var(--bg-roleCardBackground);
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

:deep(.n-skeleton) {
  --n-color-start: rgba(125, 125, 125, 0.06);
  --n-color-end: rgba(125, 125, 125, 0.12);
  background-color: transparent;
}

:deep(.n-skeleton.n-skeleton--text) {
  height: 16px;
  margin-top: 8px;
}

:deep(.n-skeleton.n-skeleton--text:first-child) {
  width: 70%;
}

:deep(.n-skeleton.n-skeleton--text:last-child) {
  width: 90%;
}

/* 暗色模式适配 */
:deep([data-theme="dark"] .n-skeleton) {
  --n-color-start: rgba(255, 255, 255, 0.06);
  --n-color-end: rgba(255, 255, 255, 0.12);
}

/* Select组件样式优化 - 支持动态宽度 */
/* Restore original select label overflow behavior */
:deep(.n-base-selection .n-base-selection-label) {
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: clip !important;
}

:deep(.n-base-select-option) {
  white-space: nowrap !important;
  padding: 8px 16px !important;
  font-size: 14px !important;
}

:deep(.n-base-select-option__content) {
  white-space: nowrap !important;
  overflow: visible !important;
  text-overflow: clip !important;
}
</style>
