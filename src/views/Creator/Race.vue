<template>
  <div>
    <div v-for="cat in categories" :key="cat" class="mb-firstMargin">
      <div class="text-lg mb-thirdMargin">{{ cat }}</div>
      <n-scrollbar x-scrollable>
        <div class="flex w-fit py-1">
          <CreateCard
            v-for="item in getOptions(cat)"
            :key="item.id || item.name"
            :type="item.image_url ? 'IMAGE' : 'BUTTON'"
            :image="item.image_url ? baseURL + item.image_url : undefined"
            class="mr-2 last:mr-0"
            :width="item.image_url ? 'w-21' : undefined"
            :height="item.image_url ? 'h-26' : undefined"
            :style="item.image_url ? { width: '86px', height: '106px' } : undefined"
            size="small"
            :name="item.name"
            :isSelected="isSelected(cat, item.name)"
            @click="() => onSelect(cat, item)"
          />
        </div>
      </n-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import CreateCard from "./Compoent/CreateCard.vue";
import { useCreateStore } from "@/stores/create";
import { NScrollbar } from "naive-ui";
import { useRoute } from "vue-router";

const { t } = useI18n();
const createStore = useCreateStore();
const { updateFormField, isFieldSelected, categoryData } = createStore;
const baseURL = import.meta.env.VITE_API_BASE_URL;
const route = useRoute();

const currentTitle = computed(() => {
  const item = createStore.CreateTypeList.find(i => i.router_path === route.path);
  return item?.title || '';
});

const categories = computed(() => createStore.categoryMap[currentTitle.value]?.categories || []);

const getOptions = (categoryName: string) => {
  return categoryData[categoryName] || [];
};

const isSelected = (categoryName: string, value: string) => {
  const field = createStore.getFormFieldByCategoryName(categoryName);
  return field ? isFieldSelected(field, value) : false;
};

const onSelect = (categoryName: string, item: any) => {
  const field = createStore.getFormFieldByCategoryName(categoryName);
  if (!field) return;
  updateFormField(field, item.name);
};
</script>

<style scoped>
/* 隐藏n-scrollbar滚动条 */
:deep(.n-scrollbar-rail) {
  display: none !important;
}

:deep(.n-scrollbar-track) {
  display: none !important;
}

:deep(.n-scrollbar-content) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep(.n-scrollbar-content::-webkit-scrollbar) {
  display: none;
}
</style>
