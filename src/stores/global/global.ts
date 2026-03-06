import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useChatStore } from "../chat/index";
import { useRoute } from "vue-router";
export const useGlobalStore = defineStore("global", () => {
  // 侧边栏折叠状态
  const route = useRoute();
  const sidebarCollapsed = ref(false);
  // 移动端抽屉显示状态
  const mobileDrawerVisible = ref(false);
  // 底部栏显示状态
  const footerVisible = ref(true);
  // 响应式宽度控制
  const screenWidth = ref(window.innerWidth);
  // 监听窗口大小变化
  if (typeof window !== "undefined") {
    window.addEventListener("resize", () => {
      screenWidth.value = window.innerWidth;
      // 根据宽度自动控制侧边栏
      if (screenWidth.value < 768) {
        sidebarCollapsed.value = true;
        // 移动端切换时关闭抽屉
        mobileDrawerVisible.value = false;
      } else {
        // 桌面端时关闭移动端抽屉
        mobileDrawerVisible.value = false;
      }
    });
  }
  // 计算属性：是否移动端
  const isMobile = computed(() => screenWidth.value < 768);
  const showHeader = computed(() => {
    const chatStore = useChatStore();
    return !(
      isMobile.value &&
      (route.path === "/chat/ai" ||
        route.name === "ChatProfile" ||
        route.name === "ChatCollections" ||
        route.name === "ChatCollectionFiles")
    );
  });

  // 计算属性：是否显示底部菜单栏
  const showFooter = computed(() => {
    // 在移动端访问个人中心页面时隐藏底部菜单栏
    return !(
      (isMobile.value && (route.path === "/profile" || route.path === "/profile/purchased-collections")) ||
      route.path === "/chat/ai" ||
      route.name === "ChatProfile" ||
      route.name === "ChatCollections" ||
      route.name === "ChatCollectionFiles"
    );
  });
  return {
    sidebarCollapsed,
    mobileDrawerVisible,
    footerVisible,
    screenWidth,
    isMobile,
    showHeader,
    showFooter,
    toggleSidebar: () => {
      if (isMobile.value) {
        mobileDrawerVisible.value = !mobileDrawerVisible.value;
      } else {
        sidebarCollapsed.value = !sidebarCollapsed.value;
      }
    },
  };
});
