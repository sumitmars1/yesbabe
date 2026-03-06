<template>
  <div
    class="flex flex-col h-full box-border bg-menuBackground"
    :class="{
      'justify-between pb-6': !globalStore.isMobile,
      'mb-10 pt-6': globalStore.isMobile,
    }"
  >
    <!-- 自定义主菜单部分 -->
    <div class="flex flex-col page-padding">
      <div
        v-for="item in menuStore.menuOptions"
        :key="item.key"
        class="flex items-center cursor-pointer py-10px px-12px transition-all rounded-full mb-2"
        :class="{
          'bg-menuItemBackground text-menuItemText hover:bg-menuItemHoverBackground dark:hover:text-white hover:text-appColor':
            activeMenuKey !== item.key,
          'text-white bg-menuItemActiveBackground': activeMenuKey === item.key,
          'menu-item-collapsed': collapsed && !globalStore.isMobile,
        }"
        @click="handleMenuClick(item.key, item.routerPath)"
        @mouseenter="hoveredKey = item.key"
        @mouseleave="hoveredKey = null"
      >
        <div class="flex items-center">
          <div class="relative w-24px h-24px">
            <svg-icon
              :iconClass="item.iconName"
              :size="collapsed && !globalStore.isMobile ? 24 : 24"
              :color="getIconColor(item.key)"
            />
            <!-- 在折叠状态下，将徽章显示在图标上方 -->
            <div
              v-if="
                item.key === 'chat' &&
                totalUnreadCount > 0 &&
                collapsed &&
                !globalStore.isMobile
              "
              class="absolute -top-2 -right-1"
            >
              <n-badge
                :value="totalUnreadCount > 99 ? '99+' : totalUnreadCount"
                :color="'#FF4A7A'"
                :offset="[0, 0]"
                dot
              />
            </div>
          </div>
          <!-- 文本标签 -->
          <div
            v-if="!collapsed || globalStore.isMobile"
            class="menu-label ml-2 whitespace-nowrap"
          >
            {{ item.labelName }}
          </div>
        </div>
        <!-- 未读消息徽章 - 跟在label后面，与折扣按钮保持一致的位置 -->
        <div
          class="ml-3"
          v-if="
            item.key === 'chat' &&
            totalUnreadCount > 0 &&
            (!collapsed || globalStore.isMobile)
          "
        >
          <n-badge
            :value="totalUnreadCount > 99 ? '99+' : totalUnreadCount"
            :color="'#FF4A7A'"
            :offset="[12, -1]"
          />
        </div>
        <!-- 折扣按钮 -->
        <div
          class="ml-3"
          v-if="item.key === 'premium' && !globalStore.sidebarCollapsed"
        >
          <n-button
            style="height: 24px; font-size: 12px"
            color="#FF4A7A"
            text-color="white"
            size="small"
            >{{ vipDiscountLabel }}</n-button
          >
        </div>
      </div>
    </div>

    <!-- 底部菜单按钮区域 -->
    <div
      class="border-t-[rgba(239,239,245,0.2)] border-t-solid border-t-0.5 border-b-0 border-l-0 border-r-0 page-padding"
      v-if="!collapsed || globalStore.isMobile"
    >
      <!-- 社交媒体图标 -->
      <!-- <div class="flex gap-6 my-6 max-w-200px">
        <svg-icon
          iconClass="discord"
          size="22"
          :color="themeStore.themeName === 'dark' ? '#ffffff' : '#000000'"
          class="cursor-pointer transition-transform duration-200 hover:scale-110"
        />
        <svg-icon
          iconClass="x"
          size="22"
          :color="themeStore.themeName === 'dark' ? '#ffffff' : '#000000'"
          class="cursor-pointer transition-transform duration-200 hover:scale-110"
        />
        <svg-icon
          iconClass="douying"
          size="22"
          :color="themeStore.themeName === 'dark' ? '#ffffff' : '#000000'"
          class="cursor-pointer transition-transform duration-200 hover:scale-110"
        />
      </div> -->

      <!-- 语言和主题切换选择框 -->
      <div class="gap-2 mb-6">
        <n-config-provider>
          <n-select
            v-model:value="language"
            :options="languageOptions"
            size="small"
            class="w-125px min-w-0 mb-2"
          />
          <n-select
            v-model:value="currentTheme"
            :options="themeOptions"
            size="small"
            class="w-125px min-w-0"
            @update:value="handleThemeChange"
          />
        </n-config-provider>
      </div>
      <div
        class="text-[#909399] cursor-pointer whitespace-nowrap overflow-hidden text-ellipsis"
      >
        <div
          class="py-1 mb-2 underline hover:text-black dark:hover:text-white transition-colors duration-200"
          @click="
            () => {
              if (globalStore.isMobile) {
                globalStore.toggleSidebar();
              }
              $router.push('/terms-of-service');
            }
          "
        >
          {{ t("menu.termsOfService") }}
        </div>
        <div
          class="py-1 mb-2 underline hover:text-black dark:hover:text-white transition-colors duration-200"
          @click="
            () => {
              if (globalStore.isMobile) {
                globalStore.toggleSidebar();
              }
              $router.push('/faq');
            }
          "
        >
          {{ t("menu.faq") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useMenuStore } from "@/stores/menu";
import { computed, watch, ref, onMounted } from "vue";
import { useRoute, useRouter } from "vue-router";
import { NSelect, NConfigProvider, NBadge } from "naive-ui";
import { useThemeStore } from "@/stores/themeStore";
import { useGlobalStore } from "@/stores/global/global";
import { useI18n } from "vue-i18n";
import { useChatStore } from "@/stores/chat";
import {
  getVipPrice,
  getVipMaxDiscountPercentByOneMonthStandard,
} from "@/api/premium";
import type { VipPriceItem } from "@/api/premium/types";
import {
  LANGUAGE_OPTIONS,
  switchLanguage,
  getCurrentLanguage,
  type SupportedLanguage,
} from "@/utils/i18n";

const menuStore = useMenuStore();
const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();
const globalStore = useGlobalStore();
const chatStore = useChatStore();
const { t, locale } = useI18n();

const vipPrices = ref<VipPriceItem[]>([]);
const vipMaxDiscountPercent = ref<number>(75);

// 定义props和emits
const props = defineProps({
  collapsed: {
    type: Boolean,
    default: false,
  },
});

const emit = defineEmits(["menu-click"]);

// 计算属性：确保菜单选中状态与路由同步
const activeMenuKey = computed({
  get: () => {
    // 优先使用currentMenuKey（基于当前路由计算）
    if (menuStore.currentMenuKey) {
      return menuStore.currentMenuKey;
    }
    // 如果currentMenuKey为空，使用activeKey作为回退
    return menuStore.activeKey;
  },
  set: (value) => {
    if (value) {
      menuStore.activeKey = value;
    }
  },
});

// 语言相关
const language = ref<SupportedLanguage>(getCurrentLanguage());
const languageOptions = LANGUAGE_OPTIONS;

// 监听语言变化
watch(language, (newLanguage) => {
  if (newLanguage !== locale.value) {
    switchLanguage({ global: { locale } }, newLanguage);
    window.location.reload();
  }
});

// 主题相关
const currentTheme = computed(() => themeStore.themeName);
const themeOptions = computed(() => [
  { label: t("menu.lightMode"), value: "light" },
  { label: t("menu.darkMode"), value: "dark" },
]);

// 悬停状态追踪
const hoveredKey = ref<string | null>(null);

// 未读消息相关（现在直接从 message_list 接口获取，无需额外请求）
// 总未读数通过从 chatStore 获取当前聊天列表的未读数计算得出
const totalUnreadCount = computed(() => {
  // 这里可以手动计算或通过其他方式获取
  // 由于 CustomMenu 在聊天页面外，而 message_list 只在聊天页面调用
  // 暂时设为 0，或者可以考虑从 localStorage 缓存中获取
  return 0;
});

const vipDiscountLabel = computed(() => {
  return t("menu.discountPercentOff", { percent: vipMaxDiscountPercent.value });
});

// 获取图标颜色
const getIconColor = (key: string) => {
  if (activeMenuKey.value === key) {
    return "#ffffff"; // 选中状态颜色
  } else if (hoveredKey.value === key) {
    // hover状态下根据主题返回不同颜色
    return themeStore.themeName === "dark" ? "#ffffff" : "var(--c-app-color)"; // dark模式白色，light模式appColor
  }
  return themeStore.themeName === "dark" ? "" : "#000000"; // dark模式白色，light模式appColor
};

// 处理菜单点击事件
const handleMenuClick = (key: string, routerPath: string) => {
  emit("menu-click", key);
  // 移动端点击后关闭抽屉
  if (globalStore.isMobile) {
    globalStore.toggleSidebar();
  }
  router.push(routerPath);
};

// 处理主题变更
const handleThemeChange = (value: string) => {
  if (value !== themeStore.themeName) {
    themeStore.toggleTheme();
  }
};

const loadVipDiscount = async () => {
  try {
    const { data } = await getVipPrice();
    vipPrices.value = data || [];
    vipMaxDiscountPercent.value =
      getVipMaxDiscountPercentByOneMonthStandard(vipPrices.value, 12) || 75;
  } catch {
    vipMaxDiscountPercent.value = 75;
  }
};

onMounted(() => {
  loadVipDiscount();
});
</script>

<style scoped>
:root {
  --hover-bg-color: #e2e1e8;
  --hover-text-color: #000000;
  --active-bg-color: #7263f6;
}

[data-theme="dark"] {
  --hover-bg-color: #575768;
  --hover-text-color: white;
  --active-bg-color: #7948ea;
}

.custom-menu {
  @apply flex flex-col;
}

.menu-item {
  @apply flex items-center px-4 py-3 mx-2 cursor-pointer transition-all duration-200;
  @apply text-gray-700 dark:text-gray-200;
  border-radius: 9999px;
  margin-bottom: 14px;
}

.menu-item:hover {
  background-color: var(--hover-bg-color) !important;
  color: #ffffff !important;
}

.menu-item:hover .menu-label {
  color: #ffffff !important;
}

.menu-item-active {
  background-color: var(--active-bg-color) !important;
  color: white !important;
}

.menu-item-active .menu-label {
  color: white !important;
}

.menu-item-active:hover {
  background-color: var(--active-bg-color) !important;
}

.menu-item-collapsed {
  @apply justify-center px-2 mx-1;
}

.menu-icon {
  @apply flex items-center justify-center;
  @apply min-w-6 min-h-6;
}

.menu-label {
  @apply ml-3 text-sm font-medium transition-colors duration-200;
}

.menu-item-collapsed .menu-label {
  @apply hidden;
}
</style>
