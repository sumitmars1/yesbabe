import { defineStore } from "pinia";
import { ref } from "vue";
import type { HomeListData } from "@/api/home/type";

/**
 * AIGenerator 页面 UI 相关的轻量状态
 * - 持久化当前用户手动选择的模型（仅在内存中，避免路由切换后丢失）
 */
export const useAIGeneratorUIStore = defineStore("aigeneratorUI", () => {
  const selectedModelId = ref<number | null>(null);
  const selectedModel = ref<HomeListData | null>(null);

  const setSelectedModel = (model: HomeListData) => {
    selectedModelId.value = model.id;
    selectedModel.value = model;
  };

  const clearSelectedModel = () => {
    selectedModelId.value = null;
    selectedModel.value = null;
  };

  return {
    selectedModelId,
    selectedModel,
    setSelectedModel,
    clearSelectedModel,
  };
});

