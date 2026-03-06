<template>
  <div class="flex items-center text-primary w-full box-border justify-between h-full">
    <div class="flex items-center flex-1 min-w-0">
      <svg-icon iconClass="back" :size="24" class="mr-2 cursor-pointer" @click="handleBack"></svg-icon>
      <div class="flex flex-col text-sm min-w-0 max-w-full">
        <span class="font-bold text-lg whitespace-nowrap overflow-hidden text-ellipsis max-w-full block">{{ displayTitle }}</span>
        <span
          v-if="subtitleText"
          class="text-xs text-#8C8C8C mt-1 whitespace-nowrap overflow-hidden text-ellipsis"
        >
          {{ subtitleText }}
        </span>
      </div>
    </div>
    <div v-if="showActions" class="flex items-center">
      <div class="flex items-center mr-3">
        <div class="h-26px w-26px flex items-center justify-center cursor-pointer" @click="handleLikeClick">
          <svg-icon :size="26" :iconClass="isLiked ? 'heart-filled' : 'heart'"
            :class="{ 'text-pink fill-pink': isLiked, 'like-animation': isAnimating }"
            :style="{ transition: 'all 0.3s ease' }" />
        </div>
        <span v-if="displayLikeCount" class="text-base ml-1 font-600" :class="{ 'text-pink': isLiked }">{{ displayLikeCount }}</span>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from "vue";
import { useRoute, useRouter } from "vue-router";
import { useI18n } from "vue-i18n";
import { likeCompanion, cancelLikeCompanion } from "@/api/home/index";
import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chat";
import { showLoginModal } from "@/utils/authModal";
import { createDiscreteApi } from "naive-ui";

const route = useRoute();
const router = useRouter();
const authStore = useAuthStore();
const chatStore = useChatStore();
const { t } = useI18n();

// 内部状态
const isAnimating = ref(false);
const currentView = ref<'list' | 'files'>('list');
const companionId = ref<number>();
const companionName = ref('');
const currentCollectionTitle = ref('');
const totalFiles = ref(0);

// 内部点赞状态
const internalIsLiked = ref(false);
const internalLikeCount = ref(0);

// 计算属性
const displayTitle = computed(() => {
  if (currentView.value === 'files') {
    return currentCollectionTitle.value || t('collection.collectionFiles');
  }
  return companionName.value 
    ? t('collection.collectionsOf', { name: companionName.value })
    : t('collection.collections');
});

const showActions = computed(() => currentView.value === 'list');

const isLiked = computed(() => internalIsLiked.value);

const displayLikeCount = computed(() => {
  const num = internalLikeCount.value;

  // 点赞数为0时不显示数字
  if (num === 0) return "";

  // 500赞："500"
  if (num < 1000) return num.toString();

  // 1000赞："1k"
  if (num < 10000) return Math.floor(num / 1000) + "k";

  // 10000赞："10K"
  if (num < 100000) return Math.floor(num / 1000) + "K";

  // 10万赞："100K"
  if (num < 1000000) return Math.floor(num / 1000) + "K";

  // 100万赞："1m"
  if (num < 500000000) return Math.floor(num / 1000000) + "m";

  // 5亿赞："500m"
  return Math.floor(num / 1000000) + "m";
});

const subtitleText = computed(() => {
  if (currentView.value === 'files') {
    return `${totalFiles.value || 0} ${t('collection.filesCount')}`;
  }
  return '';
});

// 从路由获取数据和判断当前视图
const updateFromRoute = () => {
  // 根据路由名称判断当前视图
  if (route.name === 'ChatCollectionFiles') {
    currentView.value = 'files';
    const companionIdParam = route.params.companionId;
    const parsedId = Number(companionIdParam);
    companionId.value = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : undefined;
  } else {
    currentView.value = 'list';
    const idParam = route.params.id;
    const parsedId = Number(idParam);
    companionId.value = Number.isFinite(parsedId) && parsedId > 0 ? parsedId : undefined;
  }
};

// 监听CollectionsMobile的数据变化
const handleDataUpdate = (event: CustomEvent) => {
  const { view, title, files, name, isLiked, likeCount } = event.detail;
  currentView.value = view || 'list';
  currentCollectionTitle.value = title || '';
  totalFiles.value = files || 0;
  companionName.value = name || '';
  if (isLiked !== undefined) internalIsLiked.value = isLiked;
  if (likeCount !== undefined) internalLikeCount.value = likeCount;
};

onMounted(() => {
  updateFromRoute();
  
  // 初始化点赞状态
  if (chatStore.currentCompanion && chatStore.currentCompanion.id === companionId.value) {
    internalIsLiked.value = chatStore.currentCompanion.liked || false;
    internalLikeCount.value = chatStore.currentCompanion.interaction_number || 0;
  } else if (chatStore.currentChat && chatStore.currentChat.companion_id === companionId.value) {
    internalIsLiked.value = chatStore.currentChat.liked || false;
  }
  
  // 监听数据更新事件
  window.addEventListener('collection-header-update', handleDataUpdate as EventListener);
});

watch(() => [route.params.id, route.params.companionId, route.name], () => {
  updateFromRoute();
});

// 组件卸载时清理
const cleanup = () => {
  window.removeEventListener('collection-header-update', handleDataUpdate as EventListener);
};

if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}

// 返回处理
const handleBack = () => {
  const fromPage = route.query.from as string;

  // 如果当前在文件详情页且是从聊天跳转来的，直接返回聊天
  if (route.name === 'ChatCollectionFiles' && fromPage === 'chat') {
    if (companionId.value) {
      chatStore.ensureCurrentChatByCompanionId(companionId.value).catch(() => {});
    }
    router.push({ name: 'ChatAI' });
    return;
  }

  // 如果当前在文件详情页但不是从聊天来的，返回合集列表
  if (route.name === 'ChatCollectionFiles') {
    const companionIdParam = route.params.companionId;
    router.push(`/chat/collections/${companionIdParam}`);
    return;
  }

  // 如果当前在合集列表页，总是返回聊天页面
  if (route.name === 'ChatCollections') {
    if (companionId.value) {
      chatStore.ensureCurrentChatByCompanionId(companionId.value).catch(() => {});
    }
    router.push({ name: 'ChatAI' });
    return;
  }

  // 兜底逻辑：返回聊天页面
  router.push({ name: 'Chat' });
};

// 点赞处理
const handleLikeClick = async () => {
  // 检查用户是否已登录
  if (!authStore.isLoggedIn) {
    showLoginModal('login');
    return;
  }

  if (!companionId.value) {
    return;
  }

  const { message } = createDiscreteApi(['message']);
  const previousLikedState = internalIsLiked.value;
  const previousLikeCount = internalLikeCount.value;

  // 乐观更新UI
  const newLikedState = !previousLikedState;
  const newLikeCount = newLikedState ? previousLikeCount + 1 : Math.max(0, previousLikeCount - 1);

  // 触发动画
  isAnimating.value = true;
  setTimeout(() => {
    isAnimating.value = false;
  }, 300);

  // 更新内部状态
  internalIsLiked.value = newLikedState;
  internalLikeCount.value = newLikeCount;
  
  // 通知CollectionsMobile组件更新
  window.dispatchEvent(new CustomEvent('collection-like-change', {
    detail: { isLiked: newLikedState, likeCount: newLikeCount }
  }));

  try {
    // 调用相应的点赞API
    if (newLikedState) {
      await likeCompanion(companionId.value);
    } else {
      await cancelLikeCompanion(companionId.value);
    }
    
    // 同步更新chatStore
    if (chatStore.currentChat && chatStore.currentChat.companion_id === companionId.value) {
      chatStore.currentChat.liked = newLikedState;
    }
    if (chatStore.currentCompanion && chatStore.currentCompanion.id === companionId.value) {
      chatStore.currentCompanion.liked = newLikedState;
      chatStore.currentCompanion.interaction_number = newLikeCount;
    }
  } catch (error) {
    // 回滚状态
    internalIsLiked.value = previousLikedState;
    internalLikeCount.value = previousLikeCount;
    
    window.dispatchEvent(new CustomEvent('collection-like-change', {
      detail: { isLiked: previousLikedState, likeCount: previousLikeCount }
    }));
    
    console.error('点赞操作失败:', error);
    message.error(t('header.likeError'));
  }
};
</script>

<style scoped>
@keyframes like-animation {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

.like-animation {
  animation: like-animation 0.3s ease;
}
</style>
