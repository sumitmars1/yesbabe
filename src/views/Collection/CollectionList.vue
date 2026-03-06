<template>
  <div class="collection-list-page text-primary">
    <div class="collection-body page-padding">
      <div v-if="loading" class="flex items-center justify-center py-20">
        <n-spin size="large" />
      </div>

      <div v-else-if="!collections.length" class="flex flex-col items-center justify-center py-20 text-center">
        <svg-icon iconClass="folder-open" :size="64" class="text-secondary mb-4" />
        <p class="text-secondary">{{ t('collection.noCollections') }}</p>
      </div>

      <div v-else class="collection-grid">
        <CollectionCard
          v-for="collection in unpurchasedCollections"
          :key="collection.id"
          :collection="collection"
          :loading="purchasingId === collection.id"
          @purchase="handlePurchase"
          @click="handleCollectionClick"
        />

        <PurchasedCollectionCard
          v-for="collection in purchasedCollections"
          :key="collection.id"
          :collection="collection"
          @click="handleViewFiles"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useMessage } from 'naive-ui';
import { useGlobalStore } from '@/stores/global/global';
import { useChatStore } from '@/stores/chat';
import CollectionCard from '@/components/Collection/CollectionCard.vue';
import PurchasedCollectionCard from '@/components/Collection/PurchasedCollectionCard.vue';
import { getCollections, purchaseCollection } from '@/api/collection';
import type { Collection } from '@/api/collection/types';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const message = useMessage();
const globalStore = useGlobalStore();
const chatStore = useChatStore();

const companionId = computed(() => {
  const idParam = route.params.id;
  const parsedId = Number(idParam);
  return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : undefined;
});

const collections = ref<Collection[]>([]);
const companionName = ref('');
const loading = ref(false);
const purchasingId = ref<number | null>(null);

const purchasedCollections = computed(() =>
  collections.value.filter((c) => c.is_purchased)
);

const unpurchasedCollections = computed(() =>
  collections.value.filter((c) => !c.is_purchased)
);

const loadCollections = async () => {
  if (!companionId.value) return;

  loading.value = true;
  try {
    const { data } = await getCollections(companionId.value);
    collections.value = data.collections;
    companionName.value = data.companion_name;
    
    // 通知Header组件更新数据
    window.dispatchEvent(new CustomEvent('collection-header-update', {
      detail: {
        view: 'list',
        name: companionName.value,
      }
    }));
  } catch (error) {
    console.error('加载合集列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const handlePurchase = async (collectionId: number) => {
  purchasingId.value = collectionId;
  try {
    await purchaseCollection(collectionId);
    message.success(t('collection.purchaseSuccess'));
    const target = collections.value.find((c) => c.id === collectionId);
    if (target) {
      target.is_purchased = true;
    }
    await loadCollections();
  } catch (error) {
    console.error('购买失败:', error);
  } finally {
    purchasingId.value = null;
  }
};

const handleViewFiles = (collection: Collection) => {
  // 跳转到文件详情页面
  router.push({
    path: `/chat/collections/${companionId.value}/files/${collection.id}`,
  });
};

const handleCollectionClick = (collection: Collection) => {
  // 未购买的合集点击事件，可以预留用于未来功能扩展
  console.log('Collection clicked:', collection);
};

onMounted(async () => {
  if (!companionId.value) {
    message.error(t('collection.loadError'));
    router.back();
    return;
  }
  await loadCollections();
});

watch(
  () => companionId.value,
  async (newId, oldId) => {
    if (newId === oldId) return;
    collections.value = [];
    companionName.value = '';
    if (newId) {
      await loadCollections();
    }
  }
);
</script>

<style scoped>
.collection-list-page {
  min-height: 100vh;
  background: var(--c-soild-background);
}

.collection-body {
  max-width: 960px;
  margin: 0 auto;
}

.collection-grid {
  display: grid;
  gap: 1rem;
  grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  justify-items: stretch;
}

.collection-grid > * {
  width: 100%;
}

@media (max-width: 1024px) {
  .collection-grid {
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  }
}

@media (max-width: 640px) {
  .collection-body {
    padding-left: 16px;
    padding-right: 16px;
    padding-bottom: 24px;
  }

  .collection-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 0.75rem;
  }
}
</style>
