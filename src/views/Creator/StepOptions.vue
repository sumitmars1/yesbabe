<template>
  <div>
    <div v-for="cat in categories" :key="cat" class="mb-firstMargin">
      <div class="text-lg mb-thirdMargin">{{ cat }}</div>

      <div v-if="useGridLayout" class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-3">
        <CreateCard
          v-for="item in getOptions(cat)"
          :key="item.id || item.name"
          :type="item.image_url ? 'AVATAR' : 'BUTTON'"
          :image="item.image_url ? baseURL + item.image_url : undefined"
          :name="item.name"
          :description="item.desc"
          :isSelected="isSelected(cat, item.name)"
          @click="() => onSelect(cat, item)"
        />
      </div>

      <div v-else class="overflow-x-auto scrollbar-hide horizontal-scroll">
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
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from "vue";
import { useRoute } from "vue-router";
import CreateCard from "./Compoent/CreateCard.vue";
import { useCreateStore } from "@/stores/create";

const createStore = useCreateStore();
const route = useRoute();
const baseURL = import.meta.env.VITE_API_BASE_URL;

const currentTitle = computed(() => {
  const item = createStore.CreateTypeList.find(i => i.router_path === route.path);
  return item?.title || '';
});

const categories = computed(() => createStore.categoryMap[currentTitle.value]?.categories || []);

const useGridLayout = computed(() => /personality|relationship/i.test(currentTitle.value));

const getOptions = (categoryName: string) => {
  return createStore.categoryData[categoryName] || [];
};

const isSelected = (categoryName: string, value: string) => {
  const field = createStore.getFormFieldByCategoryName(categoryName);
  return field ? createStore.isFieldSelected(field, value) : false;
};

const onSelect = (categoryName: string, item: any) => {
  const field = createStore.getFormFieldByCategoryName(categoryName);
  if (!field) return;
  createStore.updateFormField(field, item.name);
};
</script>

<style scoped>
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}
.scrollbar-hide::-webkit-scrollbar { display: none; }
.horizontal-scroll { scroll-behavior: smooth; }
.horizontal-scroll:hover { cursor: grab; }
.horizontal-scroll:active { cursor: grabbing; }
</style>

