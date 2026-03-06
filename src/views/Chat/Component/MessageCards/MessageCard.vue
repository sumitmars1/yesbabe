<template>
  <component
    :is="resolvedComponent"
    v-bind="componentProps"
    @purchase="onPurchase"
    @send-suggestion="onSendSuggestion"
  />
</template>

<script setup lang="ts">
// 统一的消息卡片分发组件：根据消息的类型选择具体卡片组件
// 注：复用内容组件（Text/Image/Video）与 CollectionMessage，避免重复实现
import { computed } from 'vue';
import { MessageType } from '@/utils/websocket';
import { useAuthStore } from '@/stores/auth';
import { storeToRefs } from 'pinia';

// 具体类型卡片（轻薄包装，内部依赖内容组件渲染）
import TextCard from './cards/TextCard.vue';
import HiddenTextCard from './cards/HiddenTextCard.vue';
import ImageCard from './cards/ImageCard.vue';
import HiddenImageCard from './cards/HiddenImageCard.vue';
import VideoCard from './cards/VideoCard.vue';
import HiddenVideoCard from './cards/HiddenVideoCard.vue';
import MixedCard from './cards/MixedCard.vue';
import CollectionMessage from './cards/CollectionMessage.vue';

const props = defineProps<{
  type: string;        // 原始消息类型
  content: any;        // 消息内容
  isSelf: boolean;     // 是否自己发送
  responseId?: number; // 消息回复ID，用于TTS等功能
  // 生成视频相关状态映射（透传给内容组件）
  videoLoadingMap?: Record<string, boolean>;
  videoDoneMap?: Record<string, boolean>;
  videoProgressMap?: Record<string, string | number>;
  // 文本流式渲染相关
  isLoading?: boolean;
  isTyping?: boolean;
  typingText?: string;
  loadingIndicator?: 'default' | 'blobs';
}>();

const emit = defineEmits<{
  (e: 'purchase', collectionId: number): void;
  (e: "send-suggestion", text: string): void;
}>();

// 获取用户VIP状态
const authStore = useAuthStore();
const { userInfo } = storeToRefs(authStore);
const isVip = computed(() => userInfo.value?.is_vip || false);

// 归一类型：将旧流式与兼容类型折叠到最终展示类型
const normalizedType = computed(() => {
  const t = String(props.type || '').toLowerCase();
  switch (t) {
    // 文本（用户消息/流式/完成）
    case MessageType.message:
    case MessageType.text_start:
    case MessageType.stream_start:
    case MessageType.text_progress:
    case MessageType.text_progress_hidden:
    case MessageType.stream_chunk:
    case MessageType.text_complete:
    case MessageType.stream_complete:
      return 'text';
    case MessageType.text_hidden:
    case MessageType.message_text_hidden:
      // VIP用户可以直接查看隐藏内容
      return isVip.value ? 'text' : 'text_hidden';
    // 图片
    case MessageType.text_to_image_complete:
    case MessageType.image_generation_complete:
      return 'image';
    case MessageType.image_hidden:
    case MessageType.message_image_hidden:
      // VIP用户可以直接查看隐藏内容
      return isVip.value ? 'image' : 'image_hidden';

    // 视频
    case MessageType.text_to_video_complete:
    case MessageType.video_generation_complete:
    case MessageType.image_to_video_complete:
      return 'video';
    case MessageType.video_hidden:
    case MessageType.message_video_hidden:
      // VIP用户可以直接查看隐藏内容
      return isVip.value ? 'video' : 'video_hidden';

    // 混合资源（直接展示后缀判断）
    case MessageType.mixed:
      return 'mixed';
    // 合集（交由 CollectionMessage 处理）
    case MessageType.collection_marketing:
    case MessageType.collection_purchase_success:
    case MessageType.collection_image:
    case MessageType.collection_video:
      return t; // 保留原样供 isCollection 判断
    default:
      return 'text';
  }
});

const isCollection = computed(() => {
  const t = normalizedType.value;
  return (
    t === MessageType.collection_marketing ||
    t === MessageType.collection_purchase_success ||
    t === MessageType.collection_image ||
    t === MessageType.collection_video
  );
});

const resolvedComponent = computed(() => {
  console.log('normalizedType.value', normalizedType.value);
  switch (normalizedType.value) {
    case 'text':
      return TextCard;
    case 'text_hidden':
      return HiddenTextCard;
    case 'image':
      return ImageCard;
    case 'image_hidden':
      return HiddenImageCard;
    case 'video':
      return VideoCard;
    case 'video_hidden':
      return HiddenVideoCard;
    case 'mixed':
      return MixedCard;
    // 合集类型
    case MessageType.collection_marketing:
    case MessageType.collection_purchase_success:
    case MessageType.collection_image:
    case MessageType.collection_video:
      return CollectionMessage;
    default:
      // 未知类型退回文本
      return TextCard;
  }
});

// 透传原始 messageType，便于内部精确提取字段
const resolvedMessageType = computed(() => props.type);

const onPurchase = (id: number) => emit('purchase', id);
const onSendSuggestion = (text: string) => emit("send-suggestion", text);

const componentProps = computed(() => {
  const base = {
    content: props.content,
    messageType: resolvedMessageType.value,
    isSelf: props.isSelf,
    responseId: props.responseId,
    videoLoadingMap: props.videoLoadingMap,
    videoDoneMap: props.videoDoneMap,
    videoProgressMap: props.videoProgressMap,
    isLoading: props.isLoading,
    isTyping: props.isTyping,
    typingText: props.typingText,
  };

  if (resolvedComponent.value === TextCard) {
    return {
      ...base,
      loadingIndicator: props.loadingIndicator ?? 'default',
    };
  }

  return base;
});
</script>

<style scoped>
</style>
