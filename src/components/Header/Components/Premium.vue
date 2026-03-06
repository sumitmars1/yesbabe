<template>
  <div
    class="relative h-64px"
    :class="
      globalStore.isMobile
        ? ''
        : 'max-w-680px mx-auto px-pageXPadding box-border'
    "
  >
    <n-tabs
      v-model:value="activeTab"
      @update:value="handleTabChange"
      style="height: 64px"
    >
      <n-tab-pane name="pro" :tab="$t('header.pro')">
        <slot name="pro"></slot>
      </n-tab-pane>
      <n-tab-pane name="purchaseDiamonds" :tab="$t('header.buyDiamonds')" v-if="authStore.isLoggedIn && authStore.userInfo?.is_vip">
        <slot name="diamonds"></slot>
      </n-tab-pane>

    </n-tabs>
  </div>
</template>

<script setup lang="ts">
import { ref, watch } from "vue";
import { useRouter, useRoute } from "vue-router";
import { NTabs, NTabPane } from "naive-ui";
import { useGlobalStore } from "@/stores/global/global";
import { useAuthStore } from "@/stores/auth";
import { showLoginModal } from "@/utils/authModal";

const router = useRouter();
const route = useRoute();
const globalStore = useGlobalStore();
const authStore = useAuthStore();

// 当前激活的标签页
const activeTab = ref<string>("pro");



// 根据当前路由设置激活的标签页
watch(
  () => route.path,
  (newPath) => {
    if (newPath === "/premium" || newPath === "/premium/pro") {
      activeTab.value = "pro";
    } else if (newPath === "/premium/diamonds") {
      activeTab.value = "purchaseDiamonds";
    }
  },
  { immediate: true }
);

// 处理标签页切换
const handleTabChange = (value: string) => {
  if (value === "pro") {
    router.push("/premium/pro");
  } else if (value === "purchaseDiamonds") {
    router.push("/premium/diamonds");
  }
};



// 定义组件 props
const props = defineProps({
  showSuffix: {
    type: Boolean,
    default: true,
  },
});
</script>

<style scoped lang="scss">
:deep(.n-tabs-tab__label) {
  font-size: 18px !important;
  font-weight: 700;
}
:deep(.v-x-scroll) {
  // padding:25px 0;
  height: v-bind('globalStore.isMobile ? "64px" : "auto"');
}
:deep(.n-tabs.n-tabs--top .n-tab-pane) {
  padding: 0;
}

/* .premium-header {
  padding: 16px;
  background: #000;
  color: #fff;
}

:deep(.n-tabs .n-tabs-nav) {
  background: transparent;
}

:deep(.n-tabs .n-tab) {
  color: #fff;
  font-weight: 500;
}

:deep(.n-tabs .n-tab.n-tab--active) {
  color: #fff;
  background: rgba(255, 255, 255, 0.1);
}

:deep(.n-tabs .n-tab:hover) {
  color: #fff;
  background: rgba(255, 255, 255, 0.05);
} */
</style>
