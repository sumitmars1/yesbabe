<template>
  <div
    class="w-full text-primary"
    :class="{
      'border-btnBorder border-1px border-b-solid pb-thirdMargin':
        !globalStore.isMobile,
    }"
  >
    <!-- 风格选择tabs -->
    <div class="flex items-center w-full relative">
      <div class="text-lg font-bold flex items-center w-1/5 whitespace-nowrap">
        {{ $route.path === "/create/models" ? t('components.createStep.myAI') : t('components.createStep.createAI') }}
      </div>
      <div
        class="flex items-center w-1/5 justify-end ml-auto"
        v-show="$route.path !== '/create/models'"
      >
        <span>{{ t('components.createStep.stepCountFormat', { 
          current: CreateTypeList.length > 0 ? currentStepIndex : 0, 
          total: CreateTypeList.length > 0 ? CreateTypeList.length : 0 
        }) }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { storeToRefs } from "pinia";
import { useCreateStore } from "@/stores/create";
import { NTabs, NTabPane } from "naive-ui";
import { useI18n } from "vue-i18n";
const { t } = useI18n();
const createStore = useCreateStore();
const { currentStepIndex, CreateTypeList, styleList, selectedStyleId } =
  storeToRefs(createStore);
import { useGlobalStore } from "@/stores/global/global";
const globalStore = useGlobalStore();

// 处理风格切换
const handleStyleChange = async (styleId: string | number) => {
  // 确保传入的是数字类型
  const id = typeof styleId === "string" ? parseInt(styleId) : styleId;
  await createStore.switchStyle(id);
};
</script>

<style scoped lang="scss">
:deep(.n-tabs-tab__label) {
  font-size: 18px !important;
  font-weight: 700;
}

:deep(.v-x-scroll) {
  height: v-bind('globalStore.isMobile ? "64px" : "50px"');
}

:deep(.n-tabs.n-tabs--top .n-tab-pane) {
  padding: 0;
}

:deep(.n-tabs-nav--bar-type.n-tabs-nav--top.n-tabs-nav) {
  height: 64px;
  display: flex;
  align-items: center;
}

:deep(.n-tabs-nav-scroll-wrapper) {
  height: 100%;
  display: flex;
  align-items: center;
}

@media (max-width: 768px) {
  :deep(.n-tabs-tab__label) {
    font-size: 16px !important;
  }
}
</style>
