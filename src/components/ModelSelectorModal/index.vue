<template>
  <n-modal v-model:show="visible" preset="card" :title="t('generator.selectModel')"
    style="width: 90%; max-width: 1200px" height="80vh">
    <template #header>
      <div class="flex items-center justify-between w-full">
        <span class="title-16">{{ t("generator.selectModel") }}</span>
        <n-select v-model:value="localSexValue" :options="sexOptions" @update:value="handleSexChange"
          style="min-width: 80px" />
      </div>
    </template>
    <div class="modal-content">
      <n-tabs v-model:value="localNavName" @update:value="handleNavChange" type="line">
        <n-tab-pane v-for="nav in navList" :key="nav.id" :name="nav.name">
          <!-- 加载骨架屏 -->
          <n-scrollbar style="height: 400px">
            <template v-if="loading">
              <div class="flex flex-wrap gap-4 mb-6 pt-4">
                <div v-for="i in skeletonCount" :key="i" class="flex flex-col items-center">
                  <div class="w-180px rounded-lg mb-2" style="aspect-ratio: 9/16">
                    <n-skeleton class="w-full h-full rounded-lg" :sharp="false" />
                  </div>
                </div>
              </div>
            </template>

            <!-- 模型列表 -->
            <template v-else>
              <div v-if="models.length !== 0">
                <n-infinite-scroll v-if="models.length > 0" :on-load="handleLoadMore" :distance="10">
                  <div class="flex flex-wrap gap-4 mb-6 pt-6px">
                    <CreateCard v-for="model in models" :key="model?.id" border-radius="20px" type="IMAGE"
                      :image="baseURL + model?.head_image" width="w-180px" aspectRatio="9/16" :name="model.name"
                      :isSelected="localSelectedId === model.id" @click="localSelectedId = model.id">
                    </CreateCard>
                  </div>
                </n-infinite-scroll>
              </div>
              <!-- 无数据提示 -->
              <div v-else class="pt-20">
                <n-empty :description="t('generator.noData')" />
              </div>
            </template>
          </n-scrollbar>
        </n-tab-pane>
      </n-tabs>
    </div>

    <template #action>
      <div class="flex justify-between">
        <BabeButton type="default" @click="handleCancel">{{
          t("generator.cancel")
        }}</BabeButton>
        <BabeButton type="primary" @click="handleConfirm" :disabled="!localSelectedId" :loading="confirming">
          {{ t("generator.confirm") }}
        </BabeButton>
      </div>
    </template>
  </n-modal>
</template>

<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { NScrollbar, NInfiniteScroll, NSkeleton, NEmpty } from "naive-ui";
import CreateCard from "@/views/Creator/Compoent/CreateCard.vue";
import { getHomeList } from "@/api/home";
import type { HomeListData, NavItem } from "@/api/home/type";
import { useGlobalStore } from "@/stores/global/global";

const baseURL = import.meta.env.VITE_API_BASE_URL;
const { t } = useI18n();
const globalStore = useGlobalStore();

// Props
interface Props {
  show: boolean;
  navList: NavItem[];
  initialNavName?: string;
  initialNavId?: number;
  initialSex?: "man" | "girl";
  currentModelId?: number | null;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
  initialSex: "girl",
  currentModelId: null,
});

// Emits
const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "confirm", modelId: number): void;
  (e: "cancel"): void;
}>();

// 本地状态
const visible = computed({
  get: () => props.show,
  set: (val) => emit("update:show", val),
});

const localNavName = ref<string>(props.initialNavName || "");
const localNavId = ref<number | undefined>(props.initialNavId);
const localSexValue = ref<"man" | "girl">(props.initialSex);
const localSelectedId = ref<number | null>(props.currentModelId);
const models = ref<HomeListData[]>([]);
const loading = ref(false);
const confirming = ref(false);
const pageParams = ref({ size: 20, page: 1 });
const hasMore = ref(true);

// 骨架屏数量
const skeletonCount = computed(() => globalStore.isMobile ? 4 : 6);

// 性别选项
const sexOptions = computed(() => [
  { label: t("generator.female"), value: "girl" },
  { label: t("generator.male"), value: "man" },
]);

// 初始化导航
watch(() => props.navList, (newNavList) => {
  if (newNavList.length > 0 && !localNavName.value) {
    localNavName.value = newNavList[0].name;
    localNavId.value = newNavList[0].id;
  }
}, { immediate: true });

// 监听弹窗显示，加载数据
watch(() => props.show, async (newShow) => {
  if (newShow) {
    localSelectedId.value = props.currentModelId;
    // 重置分页
    pageParams.value = { size: 20, page: 1 };
    hasMore.value = true;
    await loadData();
  }
});

// 加载数据
const loadData = async (isLoadMore = false) => {
  try {
    loading.value = true;
    const { data } = await getHomeList({
      ...pageParams.value,
      nav_id: localNavId.value,
      sex: localSexValue.value,
    });

    const items = data?.items || [];
    if (isLoadMore) {
      models.value = [...models.value, ...items];
    } else {
      models.value = items;
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
const handleLoadMore = async () => {
  if (!hasMore.value || loading.value) return false;
  pageParams.value.page += 1;
  await loadData(true);
  return hasMore.value;
};

// 处理性别变化
const handleSexChange = async (value: "man" | "girl") => {
  localSexValue.value = value;
  localSelectedId.value = null;
  pageParams.value = { size: 20, page: 1 };
  hasMore.value = true;
  models.value = [];
  await loadData();
};

// 处理导航变化
const handleNavChange = async (value: string) => {
  const currentNav = props.navList.find((nav) => nav.name === value);
  if (currentNav) {
    localNavId.value = currentNav.id;
    localSelectedId.value = null;
    pageParams.value = { size: 20, page: 1 };
    hasMore.value = true;
    models.value = [];
    await loadData();
  }
};

// 确认选择
const handleConfirm = async () => {
  if (localSelectedId.value) {
    confirming.value = true;
    try {
      emit("confirm", localSelectedId.value);
    } finally {
      confirming.value = false;
    }
  }
};

// 取消选择
const handleCancel = () => {
  emit("cancel");
  visible.value = false;
  localSelectedId.value = null;
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

/* 弹窗样式 */
.modal-content {
  max-height: 80vh;
  overflow-y: auto;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .modal-content {
    max-height: 50vh;
  }
}
</style>
