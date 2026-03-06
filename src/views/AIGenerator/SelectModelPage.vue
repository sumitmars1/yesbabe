<template>
  <div class="text-primary bg-background min-h-screen px-cardXPadding pb-20">
    <!-- 性别筛选 -->
    <!-- <div class="mb-4 flex items-center justify-between">
      <span class="title-16">{{ t("generator.selectModel") }}</span>
      <n-select v-model:value="sexValue" :options="sexOptions" @update:value="handleSexChange"
        style="min-width: 100px" />
    </div> -->

    <!-- 导航分类 -->
    <div class="">
      <n-tabs v-model:value="navName" @update:value="handleNavChange" type="line">
        <n-tab-pane v-for="nav in navList" :key="nav.id" :name="nav.name">
          <!-- 加载骨架屏 -->
          <template v-if="loading">
            <div class="grid grid-cols-2 gap-4 mb-6 pt-4">
              <div v-for="i in 4" :key="i" class="flex flex-col items-center">
                <div class="w-full rounded-lg mb-2" style="aspect-ratio: 9/16">
                  <n-skeleton class="w-full h-full rounded-lg" :sharp="false" />
                </div>
              </div>
            </div>
          </template>

          <!-- 模型列表 -->
          <template v-else >
            <div v-if="modelList.length !== 0" class="">
              <n-infinite-scroll v-if="modelList.length > 0" :on-load="handleLoad" :distance="10">
                <div class="grid grid-cols-2 gap-4 mb-6 pt-1">
                  <CreateCard v-for="model in modelList" :key="model?.id" border-radius="20px" type="IMAGE"
                    :image="baseURL + model?.head_image" width="w-full" aspectRatio="9/16" :name="model.name"
                    :isSelected="selectedModelId === model.id" @click="selectModel(model.id)">
                  </CreateCard>
                </div>
              </n-infinite-scroll>
            </div>
            <!-- 无数据提示 -->
            <div v-else class="pt-20">
              <n-empty :description="t('generator.noData')" />
            </div>
          </template>
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 底部确认按钮（固定在底部） -->
    <div class="fixed bottom-0 left-0 right-0 bg-background p-4 border-t border-border z-50">
      <BabeButton type="primary" block @click="confirmSelection" :disabled="!selectedModelId" :loading="confirming">
        {{ t("generator.confirm") }}
      </BabeButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from "vue";
import { useRouter, useRoute } from "vue-router";
import { useI18n } from "vue-i18n";
import { NSkeleton, NInfiniteScroll, NEmpty, useMessage } from "naive-ui";
import CreateCard from "@/views/Creator/Compoent/CreateCard.vue";
import { getHomeList, getNavs } from "@/api/home";
import { getCurrentCompanion } from "@/api/chat";
import type { HomeListData, NavItem } from "@/api/home/type";
import { useImageGeneratorModelStore } from "@/stores/imageGenerator/model";

const baseURL = import.meta.env.VITE_API_BASE_URL;
const { t } = useI18n();
const router = useRouter();
const route = useRoute();
const message = useMessage();
const imageModelStore = useImageGeneratorModelStore();

// 状态
const navList = ref<NavItem[]>([]);
const navName = ref<string>("");
const navId = ref<number>();
const sexValue = ref<"man" | "girl">("girl");
const modelList = ref<HomeListData[]>([]);
const selectedModelId = ref<number | null>(null);
const loading = ref(false);
const confirming = ref(false);
const pageParams = ref({ size: 20, page: 1 });
const hasMore = ref(true);

// 性别选项
const sexOptions = computed(() => [
  { label: t("generator.female"), value: "girl" },
  { label: t("generator.male"), value: "man" },
]);

// 从路由参数或 store 获取当前选中的模型ID
onMounted(async () => {
  const currentId = route.query.currentModelId || imageModelStore.currentModel?.id;
  if (currentId) {
    selectedModelId.value = Number(currentId);
  }

  // 加载导航列表
  await loadNavList();
});

// 加载导航列表
const loadNavList = async () => {
  try {
    const { data } = await getNavs();
    navList.value = data || [];
    if (navList.value.length > 0) {
      navName.value = navList.value[0].name;
      navId.value = navList.value[0].id;
      await loadModelList();
    }
  } catch (error) {
    console.error("获取导航列表失败:", error);
  }
};

// 加载模型列表
const loadModelList = async (isLoadMore = false) => {
  try {
    loading.value = true;
    const { data } = await getHomeList({
      ...pageParams.value,
      nav_id: navId.value,
      sex: sexValue.value,
    });

    const items = data?.items || [];
    if (isLoadMore) {
      modelList.value = [...modelList.value, ...items];
    } else {
      modelList.value = items;
    }

    hasMore.value = typeof data?.has_next === 'boolean'
      ? data.has_next
      : items.length === pageParams.value.size;
  } catch (error) {
    console.error("获取模型列表失败:", error);
  } finally {
    loading.value = false;
  }
};

// 处理无限滚动加载
const handleLoad = async () => {
  if (!hasMore.value || loading.value) return;
  pageParams.value.page += 1;
  await loadModelList(true);
};

// 处理性别变化
const handleSexChange = async (value: "man" | "girl") => {
  sexValue.value = value;
  selectedModelId.value = null;
  pageParams.value = { size: 20, page: 1 };
  hasMore.value = true;
  modelList.value = [];
  await loadModelList();
};

// 处理导航变化
const handleNavChange = async (value: string) => {
  const currentNav = navList.value.find((nav) => nav.name === value);
  if (currentNav) {
    navId.value = currentNav.id;
    selectedModelId.value = null;
    pageParams.value = { size: 20, page: 1 };
    hasMore.value = true;
    modelList.value = [];
    await loadModelList();
  }
};

// 选择模型
const selectModel = async (modelId: number) => {
  selectedModelId.value = modelId;
  confirming.value = true;
  
  try {
    // 调用 companion/current 接口获取模型详细信息
    const { data } = await getCurrentCompanion(modelId);
    
    // 写入独立的图像生成模型 store
    imageModelStore.setCurrentModel(data);
    
    // 返回到图像生成页面
    router.push({
      name: 'AIGenerator',
    });
  } catch (error) {
    console.error("获取模型信息失败:", error);
  } finally {
    confirming.value = false;
  }
};

// 确认选择
const confirmSelection = async () => {
  if (!selectedModelId.value) return;

  confirming.value = true;
  try {
    // 通过路由参数返回选中的模型ID
    router.push({
      name: 'AIGenerator',
      query: { selectedModelId: selectedModelId.value.toString() }
    });
  } catch (error) {
    console.error("确认选择失败:", error);
  } finally {
    confirming.value = false;
  }
};
</script>

<style scoped lang="scss">
/* 统一覆盖为 16px */
:deep(.n-tabs-tab__label) {
  font-size: 16px !important;
}

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

.title-16 {
  font-size: 16px;
  font-weight: 700;
}
</style>
