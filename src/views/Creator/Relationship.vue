<template>
  <div>
    <div v-for="cat in categories" :key="cat" class=" mb-firstMargin">
      <div class="text-lg mb-thirdMargin">{{ cat }}</div>
      <div class="grid grid-cols-3 gap-4 sm:grid-cols-4 xl:grid-cols-5">
        <CreateCard
          v-for="item in getOptions(cat)"
          :key="item.id || item.name"
          :type="item.image_url ? 'AVATAR' : 'BUTTON'"
          :show-description="false"
          :image="item.image_url ? baseURL + item.image_url : undefined"
          class="mr-3 last:mr-0 w-full h-60px"
          :name="item.name"
          :isSelected="isSelected(cat, item.name)"
          @click="() => onSelect(cat, item)"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import CreateCard from "./Compoent/CreateCard.vue";
import { useCreateStore } from "@/stores/create";
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
const getOptions = (categoryName: string) => categoryData[categoryName] || [];
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
