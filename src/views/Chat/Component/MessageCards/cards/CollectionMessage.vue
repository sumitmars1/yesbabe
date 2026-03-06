<template>
  <div style="border-radius: 0px 16px 16px 16px; " class="chat-content card inline-block p-0 w-[240px]">
    <CollectionCard v-if="!isPurchased" :collection="collectionForCard" :loading="Boolean(content.isPurchasing)"
      in-chat @purchase="handlePurchase" @click="handleCollectionCardClick" />
    <PurchasedCollectionCard v-else :collection="collectionForCard" in-chat @click="handlePurchasedCardClick" />

    <n-config-provider
      :theme="themeStore.themeName === 'dark' ? darkTheme : undefined"
      :theme-overrides="{
        common: {
          ...themeStore.naiveOverridesTheme.common,
          borderRadius: '25px',
        },
      }"
    >
      <n-modal v-model:show="showFilesModal" preset="card"
        :title="collectionForCard.title || t('collection.collectionFiles')" class="collection-message__files-modal"
        :style="{ width: '90vw', maxWidth: '1200px' }" :segmented="{ content: 'soft', footer: 'soft' }"
        @after-leave="handleModalClose">
        <CollectionFilesView :collection="collectionDetail" :files="files" :total-files="totalFiles"
          :loading="filesLoading" />
      </n-modal>
    </n-config-provider>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from "vue";
import { useI18n } from "vue-i18n";
import { useMessage, NModal, NConfigProvider, darkTheme } from "naive-ui";
import { useRouter } from "vue-router";
import { useThemeStore } from "@/stores/themeStore";
import { useGlobalStore } from "@/stores/global/global";
import { getCollectionFiles } from "@/api/collection";
import type { Collection, CollectionDetail, CollectionFile } from "@/api/collection/types";
import type { CollectionMessageContent } from "@/types/chat";
import CollectionCard from "@/components/Collection/CollectionCard.vue";
import PurchasedCollectionCard from "@/components/Collection/PurchasedCollectionCard.vue";
import CollectionFilesView from "@/components/Collection/CollectionFilesView.vue";

const props = defineProps<{
  content: CollectionMessageContent;
}>();

const emit = defineEmits<{
  (event: "purchase", collectionId: number): void;
}>();

const { t } = useI18n();
const message = useMessage();
const router = useRouter();
const themeStore = useThemeStore();
const globalStore = useGlobalStore();

const isPurchased = computed(() => Boolean(props.content.purchased));

const normalizeAmount = (value?: number | null, fallback = 0) =>
  typeof value === "number" && Number.isFinite(value) ? value : fallback;

const collectionForCard = computed<Collection>(() => {
  const basePrice = normalizeAmount(
    props.content.price,
    normalizeAmount(props.content.discountPrice)
  );
  const discountPrice = normalizeAmount(props.content.discountPrice, basePrice);

  return {
    id: props.content.id,
    title: props.content.title ?? "",
    description: props.content.description ?? "",
    cover_image: props.content.coverImage ?? "",
    image_count: normalizeAmount(props.content.imageCount, 0),
    video_count: normalizeAmount(props.content.videoCount, 0),
    price: basePrice,
    discount_price: discountPrice,
    is_free: props.content.isFree ?? basePrice === 0,
    is_featured: props.content.isFeatured ?? false,
    purchase_count: normalizeAmount(props.content.purchaseCount, 0),
    created_time: props.content.createdTime ?? "",
    is_purchased: Boolean(props.content.purchased),
    companion_id: props.content.companionId,
  };
});

const showFilesModal = ref(false);
const filesLoading = ref(false);
const collectionDetail = ref<CollectionDetail | null>(null);
const files = ref<CollectionFile[]>([]);
const totalFiles = ref(0);
const hasLoadedFiles = ref(false);

const handlePurchase = () => {
  if (props.content.isPurchasing) return;
  emit("purchase", props.content.id);
};

const handleCollectionCardClick = () => {
  // 保留点击事件以便未来扩展，例如展示合集详情
};

const handlePurchasedCardClick = async () => {
  const companionId = collectionForCard.value.companion_id;
  const collectionId = collectionForCard.value.id;
  
  // 移动端直接跳转到文件详情页面，桌面端打开弹窗
  if (globalStore.isMobile) {
    if (companionId && collectionId) {
      router.push({
        path: `/chat/collections/${companionId}/files/${collectionId}`,
        query: { from: 'chat' }
      });
    }
  } else {
    showFilesModal.value = true;
    await loadCollectionFiles();
  }
};

const handleModalClose = () => {
  showFilesModal.value = false;
};

const loadCollectionFiles = async (force = false) => {
  const collectionId = collectionForCard.value.id;
  if (!collectionId) return;
  if (filesLoading.value) return;
  if (hasLoadedFiles.value && !force) return;

  filesLoading.value = true;
  try {
    const {
      data: { collection, files: fileList, total_files },
    } = await getCollectionFiles(collectionId);
    collectionDetail.value = collection;
    files.value = fileList;
    totalFiles.value = total_files;
    hasLoadedFiles.value = true;
  } catch (error) {
    console.error("加载合集文件失败:", error);
  } finally {
    filesLoading.value = false;
  }
};

watch(
  () => props.content.id,
  () => {
    hasLoadedFiles.value = false;
    collectionDetail.value = null;
    files.value = [];
    totalFiles.value = 0;
  }
);
</script>

<style scoped>
.collection-message__files-modal :deep(.n-card) {
  border-radius: 25px;
  overflow: hidden;
}

.collection-message__files-modal :deep(.n-card__content) {
  padding: 0;
}

@media (max-width: 768px) {
  .collection-message__files-modal :deep(.n-card) {
    border-radius: 20px;
  }
}
</style>
