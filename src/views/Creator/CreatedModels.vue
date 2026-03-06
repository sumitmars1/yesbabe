<template>
  <div class="">
    <!-- 加载状态 -->
    <LoadingIndicator v-if="isCreatorLoading" :text="t('creator.loading')" />
    
    <!-- AI模型列表 - 动态响应式布局，整体居中但内容左对齐 -->
    <div v-else class="max-w-6xl mx-auto sm:px-4">
      <!-- 卡片容器 - 自适应网格，限制卡片最大宽度避免过宽 -->
      <div class="grid gap-2 sm:gap-3 md:gap-4 justify-items-start [grid-template-columns:repeat(auto-fill,minmax(144px,1fr))] sm:[grid-template-columns:repeat(auto-fill,minmax(160px,1fr))] md:[grid-template-columns:repeat(auto-fill,minmax(176px,1fr))]">
        <!-- 新增AI卡片 - 始终显示 -->
        <div class="w-full max-w-[176px]">
          <AddAICard />
        </div>
        
        <!-- 已创建的AI模型卡片 -->
        <div 
          v-for="model in aiModels"
          :key="model.id"
          class="w-full max-w-[176px]"
        >
          <ModelCard
            :model-data="model"
            :show-latest-badge="isLatestModel(model)"
            @click="handleModelClick(model)"
          />
        </div>
      </div>
    </div>
    
    <!-- 无数据提示 - 单独显示 -->
    <div 
      v-if="!isCreatorLoading && aiModels.length === 0" 
      class="w-full py-8 text-center"
    >
      <n-empty :description="t('createdModels.noModels')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import AddAICard from "@/components/AddAICard/index.vue";
import ModelCard from "@/components/ModelCard/index.vue";
import LoadingIndicator from "@/components/LoadingIndicator/index.vue";
import { useChatStore } from "@/stores/chat";
import { useCreateStore } from "@/stores/create";
import { useMenuStore } from "@/stores/menu";
import { useAuthStore } from "@/stores/auth";
import { useCreatorLoading } from "@/composables/useCreatorLoading";
import { storeToRefs } from "pinia";

interface AIModelData {
  id: number;
  name: string;
  head_image?: string;
  cover_video_url?: string;
  age?: string;
  description?: string;
  interaction_number?: number;
}

const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const chatStore = useChatStore();
const createStore = useCreateStore();
const menuStore = useMenuStore();
const authStore = useAuthStore();
const { isCreatorLoading, startCreatorLoading, stopCreatorLoading } = useCreatorLoading();
const { createdAIList } = storeToRefs(createStore);
const aiModels = createdAIList;
const isFetchingModels = ref(false);

// 判断是否为最新创建的AI模型（第一个）
const isLatestModel = (model: AIModelData) => {
  return aiModels.value.length > 0 && aiModels.value[0].id === model.id;
};

const fetchCreatedAIModels = async () => {
  if (isFetchingModels.value) return;

  try {
    isFetchingModels.value = true;
    startCreatorLoading();

    await createStore.fetchCreatedAIList();
    await menuStore.checkCreatedAIStatus();
  } catch (error) {
    console.error(`${t('createdModels.fetchFailed')}`, error);
    await createStore.checkAndRedirectToCreate();
  } finally {
    isFetchingModels.value = false;
    stopCreatorLoading();
  }
};

const handleModelClick = (model: AIModelData) => {
  const chatData = {
    id: model.id,
    name: model.name,
    lastMessage: model.description || t('createdModels.startChatting'),
    time: new Date().toISOString(),
    isSelf: false,
    companion_id: model.id,
    content: model.description || t('createdModels.startChatting'),
    cover_video_url: model.cover_video_url || "",
    message_response_created_at: new Date().toISOString(),
    t_head_image: model.head_image || "",
    user_id: 0,
    message_response_id: 0,
  };

  chatStore.ensureCurrentChatByCompanionId(model.id, chatData).catch(() => {});

  router.push({
    path: "/chat/ai",
  });
};

watch(
  () => route.path,
  (path) => {
    if (path !== "/create/models") {
      return;
    }

    if (!authStore.isLoggedIn) {
      router.push("/create/style");
      return;
    }

    fetchCreatedAIModels();
  },
  { immediate: true }
);

watch(
  () => authStore.isLoggedIn,
  (isLoggedIn) => {
    if (route.path === "/create/models" && isLoggedIn) {
      fetchCreatedAIModels();
    }
  }
);

onMounted(() => {
  if (!authStore.isLoggedIn) {
    router.push("/create/style");
    return;
  }

  fetchCreatedAIModels();
});
</script>

<style scoped lang="scss">
@media (max-width: 640px) {
  .page-padding {
    padding-left: 0;
    padding-right: 0;
  }
}

@media (max-width: 320px) {
  .w-32 {
    width: 100px;
  }
  
  .h-44 {
    height: 140px;
  }
}
</style>
