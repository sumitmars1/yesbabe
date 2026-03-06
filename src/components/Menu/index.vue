<template>
  <div
    class="flex flex-col h-full box-border"
    :class="{
      'justify-between pb-6': !globalStore.isMobile,
      'mb-10  pt-6': globalStore.isMobile,
    }"
  >
    <!-- 主菜单部分 -->
    <n-menu
      v-model:value="activeMenuKey"
      :collapsed="collapsed"
      :indent="16"
      :collapsed-width="52"
      :collapsed-icon-size="22"
      :options="menuStore.menuOptions"
      @update:value="handleMenuClick"
    />

    <!-- 底部菜单按钮区域 -->
    <div
      class="border-t-[rgba(239,239,245,0.2)] border-t-solid border-t-0.5 border-b-0 border-l-0 border-r-0 px-4"
      v-if="!collapsed || globalStore.isMobile"
    >
      <!-- 社交媒体图标 -->
      <div class="flex gap-6 my-6 max-w-200px">
        <svg-icon
          iconClass="discord"
          size="22"
          :color="themeStore.themeName === 'dark' ? '#ffffff' : '#333333'"
          class="cursor-pointer transition-transform duration-200 hover:scale-110"
        />
        <svg-icon
          iconClass="x"
          size="22"
          :color="themeStore.themeName === 'dark' ? '#ffffff' : '#333333'"
          class="cursor-pointer transition-transform duration-200 hover:scale-110"
        />
        <svg-icon
          iconClass="douying"
          size="22"
          :color="themeStore.themeName === 'dark' ? '#ffffff' : '#333333'"
          class="cursor-pointer transition-transform duration-200 hover:scale-110"
        />
      </div>

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
        <div class="py-1 mb-2 underline">{{ t("menu.termsOfService") }}</div>
        <!-- <router-link to="/faq" class="py-1 underline block">FAQ</router-link> -->
        <div
          class="py-1 mb-2 underline"
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
import { computed, watch, ref } from "vue";
import { useRoute } from "vue-router";
import { NIcon, NSelect } from "naive-ui";
import { useThemeStore } from "@/stores/themeStore";
import { useGlobalStore } from "@/stores/global/global";
import { useI18n } from "vue-i18n";
import {
  LANGUAGE_OPTIONS,
  switchLanguage,
  getCurrentLanguage,
  type SupportedLanguage,
} from "@/utils/i18n";

const menuStore = useMenuStore();
const route = useRoute();
const themeStore = useThemeStore();
const globalStore = useGlobalStore();
const { t, locale } = useI18n();

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
    // 当currentMenuKey为空字符串时，表示当前路由与菜单路由不匹配，不应该有选中状态
    return (
      menuStore.currentMenuKey ||
      (menuStore.currentMenuKey === "" ? "" : menuStore.activeKey)
    );
  },
  set: (value) => {
    // 当用户点击菜单项时，更新store中的activeKey
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
    // 刷新页面以确保所有组件都使用新语言
    window.location.reload();
  }
});

// 主题相关
const currentTheme = computed(() => themeStore.themeName);
const themeOptions = computed(() => [
  { label: t("menu.lightMode"), value: "light" },
  { label: t("menu.darkMode"), value: "dark" },
]);

// 处理菜单点击事件
const handleMenuClick = (key) => {
  emit("menu-click", key);
};

// 处理主题变更
const handleThemeChange = (value) => {
  if (value !== themeStore.themeName) {
    themeStore.toggleTheme();
  }
};
</script>
