<template>
  <div class="collection-files-page text-primary">
    <div class="collection-files-body" :class="{ 'mobile-body': globalStore.isMobile }">
      <CollectionFilesView
        :collection="collectionDetail"
        :files="files"
        :total-files="totalFiles"
        :loading="loading"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useMessage } from 'naive-ui';
import { useGlobalStore } from '@/stores/global/global';
import CollectionFilesView from '@/components/Collection/CollectionFilesView.vue';
import { getCollectionFiles } from '@/api/collection';
import type { CollectionDetail, CollectionFile } from '@/api/collection/types';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const message = useMessage();
const globalStore = useGlobalStore();

const companionId = ref<number>();
const collectionId = ref<number>();
const collectionDetail = ref<CollectionDetail | null>(null);
const files = ref<CollectionFile[]>([]);
const totalFiles = ref(0);
const loading = ref(false);

const loadCollectionFiles = async () => {
  if (!collectionId.value) return;

  loading.value = true;
  try {
    const { data } = await getCollectionFiles(collectionId.value);
    collectionDetail.value = data.collection;
    files.value = data.files;
    totalFiles.value = data.total_files;
    
    // 通知Header组件更新数据
    window.dispatchEvent(new CustomEvent('collection-header-update', {
      detail: {
        view: 'files',
        title: collectionDetail.value?.title || '',
        files: totalFiles.value,
      }
    }));
  } catch (error) {
    console.error('加载合集文件失败:', error);
    // 加载失败，返回合集列表
    if (companionId.value) {
      router.replace(`/chat/collections/${companionId.value}`);
    }
  } finally {
    loading.value = false;
  }
};

const parseRouteParams = () => {
  const companionIdParam = route.params.companionId;
  const collectionIdParam = route.params.collectionId;
  
  const parsedCompanionId = Number(companionIdParam);
  const parsedCollectionId = Number(collectionIdParam);
  
  if (Number.isFinite(parsedCompanionId) && parsedCompanionId > 0) {
    companionId.value = parsedCompanionId;
  }
  
  if (Number.isFinite(parsedCollectionId) && parsedCollectionId > 0) {
    collectionId.value = parsedCollectionId;
  }
};

onMounted(async () => {
  parseRouteParams();
  
  if (!companionId.value || !collectionId.value) {
    message.error(t('collection.loadError'));
    router.back();
    return;
  }
  
  await loadCollectionFiles();
});

watch(
  () => [route.params.companionId, route.params.collectionId],
  () => {
    parseRouteParams();
    if (companionId.value && collectionId.value) {
      loadCollectionFiles();
    }
  }
);
</script>

<style scoped>
.collection-files-page {
  min-height: 100vh;
  background: var(--c-soild-background);
}

.collection-files-body {
  max-width: 1200px;
  margin: 0 auto;
}

/* 移动端优化 */
.collection-files-body.mobile-body {
  max-width: 100%;
  height: calc(100vh - 64px); /* 减去Header高度 */
  padding: 16px;
  box-sizing: border-box;
  overflow: hidden;
}
</style>
