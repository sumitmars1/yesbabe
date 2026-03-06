<template>
  <div class="collection-mobile-root text-primary">
    <div
      class="collection-body page-padding"
    >
      <div v-if="currentView === 'list'" class="collection-list-view">
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

      <CollectionFilesView
        v-else-if="currentView === 'files'"
        :collection="currentCollectionDetail"
        :files="collectionFiles"
        :total-files="totalFiles"
        :loading="loadingFiles"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref, watch, nextTick, onUnmounted } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { useI18n } from 'vue-i18n';
import { useMessage } from 'naive-ui';
import { ChevronLeftFilled } from '@vicons/material';
import { useGlobalStore } from '@/stores/global/global';
import { useChatStore } from '@/stores/chat';
import CollectionCard from '@/components/Collection/CollectionCard.vue';
import PurchasedCollectionCard from '@/components/Collection/PurchasedCollectionCard.vue';
import CollectionFilesView from '@/components/Collection/CollectionFilesView.vue';
import { getCollections, getCollectionFiles, purchaseCollection } from '@/api/collection';
import type { Collection, CollectionDetail, CollectionFile } from '@/api/collection/types';
import type { MessageItem } from '@/types/chat';

const route = useRoute();
const router = useRouter();
const { t } = useI18n();
const message = useMessage();
const globalStore = useGlobalStore();
const chatStore = useChatStore();

const companionId = computed(() => {
  const idParam = route.params.id ?? route.query.id;
  const parsedId = Number(idParam);
  return Number.isFinite(parsedId) && parsedId > 0 ? parsedId : undefined;
});

const fromPage = computed(() => (route.query.from as string) || '');

const preservedChat = ref<MessageItem | null>(chatStore.currentChat ? { ...chatStore.currentChat } : null);

watch(
  () => chatStore.currentChat,
  (val) => {
    if (val) {
      preservedChat.value = { ...val };
    }
  },
  { immediate: true }
);

const currentView = ref<'list' | 'files'>('list');
const collections = ref<Collection[]>([]);
const companionName = ref('');
const loading = ref(false);

const currentCollectionDetail = ref<CollectionDetail | null>(null);
const collectionFiles = ref<CollectionFile[]>([]);
const totalFiles = ref(0);
const loadingFiles = ref(false);

const purchasingId = ref<number | null>(null);

const purchasedCollections = computed(() =>
  collections.value.filter((c) => c.is_purchased)
);

const unpurchasedCollections = computed(() =>
  collections.value.filter((c) => !c.is_purchased)
);

// Header相关状态
const isLiked = ref(false);
const likeCount = ref(0);

const pageTitle = computed(() => {
  if (currentView.value === 'files') {
    return currentCollectionDetail.value?.title || t('collection.collectionFiles');
  }
  return companionName.value
    ? t('collection.collectionsOf', { name: companionName.value })
    : t('collection.collections');
});

const headerTitle = computed(() => {
  if (currentView.value === 'files') {
    return currentCollectionDetail.value?.title || '';
  }
  return companionName.value
    ? t('collection.collectionsOf', { name: companionName.value })
    : t('collection.collections');
});

const headerSubtitle = computed(() => {
  if (currentView.value === 'list') {
    return ''; // 合集列表页面不显示副标题
  }
  return ''; // 文件列表页面的副标题由CollectionHeader组件处理
});

const resetState = () => {
  currentView.value = 'list';
  collections.value = [];
  companionName.value = '';
  currentCollectionDetail.value = null;
  collectionFiles.value = [];
  totalFiles.value = 0;
  purchasingId.value = null;
};

const loadCollections = async () => {
  if (!companionId.value) return;

  loading.value = true;
  try {
    const { data } = await getCollections(companionId.value);
    collections.value = data.collections;
    companionName.value = data.companion_name;
  } catch (error) {
    console.error('加载合集列表失败:', error);
  } finally {
    loading.value = false;
  }
};

const loadCollectionFiles = async (collectionId: number) => {
  loadingFiles.value = true;
  try {
    const { data } = await getCollectionFiles(collectionId);
    currentCollectionDetail.value = data.collection;
    collectionFiles.value = data.files;
    totalFiles.value = data.total_files;
    currentView.value = 'files';
  } catch (error) {
    console.error('加载合集文件失败:', error);
  } finally {
    loadingFiles.value = false;
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
  loadCollectionFiles(collection.id);
};

const handleCollectionClick = (collection: Collection) => {
  console.log('Collection clicked:', collection);
};


// Header返回处理
const handleHeaderBack = async () => {
  if (currentView.value === 'files') {
    // 从文件列表返回到合集列表
    currentView.value = 'list';
    currentCollectionDetail.value = null;
    collectionFiles.value = [];
    totalFiles.value = 0;
    return;
  }
  // 从合集列表返回到聊天页面
  if (fromPage.value === 'chat') {
    if (companionId.value) {
      chatStore
        .ensureCurrentChatByCompanionId(
          companionId.value,
          preservedChat.value ?? {
            name: companionName.value || '',
          }
        )
        .catch(() => {});
    }
    
    // 使用 replace 替换当前路由，避免历史记录堆积
    await router.replace({ name: 'ChatAI' });
    
    // 等待路由切换完成后，触发聊天页面滚动到底部
    await nextTick();
    // 通过事件总线或其他方式通知聊天页面滚动到底部
    // 这里使用延迟确保DOM完全渲染
    setTimeout(() => {
      window.dispatchEvent(new CustomEvent('chat-scroll-to-bottom'));
    }, 100);
    return;
  }
  if (window.history.length > 1) {
    router.back();
    return;
  }
  router.push({ name: 'Chat' });
};

// 点赞状态变化处理
const handleLikeChange = (newIsLiked: boolean, newLikeCount: number) => {
  isLiked.value = newIsLiked;
  likeCount.value = newLikeCount;

  // 同步更新到chatStore
  if (chatStore.currentChat && chatStore.currentChat.companion_id === companionId.value) {
    chatStore.currentChat.liked = newIsLiked;
  }

  // 同步更新到currentCompanion
  if (chatStore.currentCompanion && chatStore.currentCompanion.id === companionId.value) {
    chatStore.currentCompanion.liked = newIsLiked;
    chatStore.currentCompanion.interaction_number = newLikeCount;
  }
};

const handleBack = () => {
  handleHeaderBack();
};

// 通知Header组件更新数据
const notifyHeaderUpdate = () => {
  window.dispatchEvent(new CustomEvent('collection-header-update', {
    detail: {
      view: currentView.value,
      title: currentCollectionDetail.value?.title || '',
      files: totalFiles.value,
      name: companionName.value,
      isLiked: isLiked.value,
      likeCount: likeCount.value
    }
  }));
};

// 监听Header返回事件
const handleHeaderBackEvent = () => {
  handleHeaderBack();
};

// 监听Header点赞事件
const handleHeaderLikeEvent = (event: CustomEvent) => {
  const { isLiked: newIsLiked, likeCount: newLikeCount } = event.detail;
  handleLikeChange(newIsLiked, newLikeCount);
};

onMounted(async () => {
  if (!companionId.value) {
    message.error(t('collection.loadError'));
    handleBack();
    return;
  }
  await loadCollections();

  // 检查是否有collectionId参数，如果有则直接加载文件详情
  const collectionIdParam = route.query.collectionId;
  if (collectionIdParam) {
    const collectionId = Number(collectionIdParam);
    if (Number.isFinite(collectionId) && collectionId > 0) {
      await loadCollectionFiles(collectionId);
    }
  }

  // 初始化点赞状态
  if (chatStore.currentCompanion && chatStore.currentCompanion.id === companionId.value) {
    isLiked.value = chatStore.currentCompanion.liked || false;
    likeCount.value = chatStore.currentCompanion.interaction_number || 0;
  } else if (chatStore.currentChat && chatStore.currentChat.companion_id === companionId.value) {
    isLiked.value = chatStore.currentChat.liked || false;
  }
  
  // 通知Header组件初始数据
  notifyHeaderUpdate();
  
  // 监听Header事件
  window.addEventListener('collection-header-back', handleHeaderBackEvent);
  window.addEventListener('collection-like-change', handleHeaderLikeEvent as EventListener);
});

onUnmounted(() => {
  // 移除事件监听
  window.removeEventListener('collection-header-back', handleHeaderBackEvent);
  window.removeEventListener('collection-like-change', handleHeaderLikeEvent as EventListener);
});

watch(
  () => [currentView.value, currentCollectionDetail.value, totalFiles.value, companionName.value, isLiked.value, likeCount.value],
  () => {
    notifyHeaderUpdate();
  }
);

watch(
  () => companionId.value,
  async (newId, oldId) => {
    if (newId === oldId) return;
    resetState();
    if (newId) {
      await loadCollections();
    }
  }
);
</script>

<style scoped>
.collection-mobile-root {
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
