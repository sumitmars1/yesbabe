<template>
  <div class="text-primary" :class="{}">
    <div
      class="text-lg text-center mb-firstMargin"
      v-if="!globalStore.isMobile"
    >
      {{ t('creator.style.selectYourFavoriteStyle') }}
    </div>
    
    <!-- 内容列表：自适应网格，移动端不溢出 -->
    <div class="max-w-6xl mx-auto sm:px-4">
      <div class="grid gap-2 sm:gap-3 md:gap-4 justify-items-start [grid-template-columns:repeat(auto-fill,minmax(144px,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(176px,1fr))]">
        <div v-for="item in styleList" :key="item?.id" class="w-full max-w-[176px]">
          <CreateCard
            border-radius="20px"
            type="IMAGE"
            :image="baseURL + item?.image_url"
            class="w-full"
            width="w-full"
            aspectRatio="9/16"
            :name="item.name"
            :isSelected="selectedStyleId === item.id"
            @click="() => handleSelectStyle(item)"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { storeToRefs } from "pinia";
import CreateCard from "./Compoent/CreateCard.vue";
import { useCreateStore } from "@/stores/create";
import { useGlobalStore } from "@/stores/global/global";
import { useCreatorLoading } from "@/composables/useCreatorLoading";
import { useRouter } from "vue-router";

const { t } = useI18n();
const baseURL = import.meta.env.VITE_API_BASE_URL;
const createStore = useCreateStore();
const globalStore = useGlobalStore();
const router = useRouter();
const { startCreatorLoading, stopCreatorLoading } = useCreatorLoading();

const {
  CreateTypeList,
  categoryData,
  styleList,
  selectedStyleId,
} = storeToRefs(createStore);

const {
  updateFormField,
  isFieldSelected,
  getCategoryData,
  setStyleList,
} = createStore;

// 处理风格选择（不触发跳转）
const handleSelectStyle = (item: any) => {
  // 更新选中的风格ID
  selectedStyleId.value = item.id;
  // 更新表单中的风格字段（使用name字段）
  updateFormField('style', item.name);
};

// 组件挂载时获取风格列表
onMounted(async () => {
  startCreatorLoading();
  try {
    await setStyleList();
  } catch (error) {
    console.error('加载风格列表失败:', error);
  } finally {
    stopCreatorLoading();
  }
});
</script>

<style scoped lang="scss">
/* 暗色模式适配已由 LoadingIndicator 组件处理 */
</style>
