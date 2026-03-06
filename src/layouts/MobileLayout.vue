<template>
  <div class="mobile-root">
    <Header />
    <main class="mobile-content" :style="contentStyles">
      <router-view />
    </main>
    <Footer v-show="global.showFooter" />

    <n-drawer
      v-model:show="global.mobileDrawerVisible"
      :height="'80vh'"
      placement="bottom"
      :show-mask="true"
      :to="null"
    >
      <div class="drawer-handle" @click="global.mobileDrawerVisible = false"></div>
      <div class="h-full">
        <CustomMenu :collapsed="false" />
      </div>
    </n-drawer>
  </div>
</template>

<script setup lang="ts">
import Header from "@/components/Header/index.vue";
import Footer from "@/components/Footer/index.vue";
import CustomMenu from "@/components/CustomMenu/index.vue";
import { useGlobalStore } from "@/stores/global/global";
import { useRoute } from "vue-router";
import { computed } from "vue";
const global = useGlobalStore();
const route = useRoute();

// Chat 详情页（聊天窗口）内部自行管理滚动，避免与外层双滚动
const isChatDetail = computed(() => route.name === "ChatAI" || route.name === "ChatProfile");

// 根据是否展示 Footer 动态计算内容区 bottom，防止隐藏 Footer 时仍保留底部 64px 空隙
const contentBottom = computed(() =>
  global.showFooter ? "calc(var(--app-footer-h) + env(safe-area-inset-bottom))" : "env(safe-area-inset-bottom)"
);

const contentStyles = computed(() => ({
  top: "calc(var(--app-header-h) + env(safe-area-inset-top))",
  bottom: contentBottom.value,
  left: 0,
  right: 0,
  overflowY: isChatDetail.value ? "hidden" : "auto",
  position: "fixed",
}));
</script>

<style scoped>
.mobile-root {
  --app-header-h: 64px;
  --app-footer-h: 64px;
}

.mobile-content {
  -webkit-overflow-scrolling: touch;
  background: var(--c-background);
}

.n-drawer.n-drawer--bottom-placement {
  border-top-left-radius: 16px;
  border-top-right-radius: 16px;
}
.drawer-handle {
  width: 40px;
  height: 5px;
  background-color: #dcdcdc;
  border-radius: 4px;
  position: absolute;
  top: 10px;
  left: 50%;
  transform: translateX(-50%);
  cursor: pointer;
}
.drawer-handle:hover {
  background-color: #c0c0c0;
}
</style>
