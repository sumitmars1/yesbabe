<template>
  <ImageContent
    :content="content"
    :message-type="resolvedType"
    :is-self="isSelf"
    :video-loading-map="videoLoadingMap"
    :video-done-map="videoDoneMap"
    :video-progress-map="videoProgressMap"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import ImageContent from '../parts/ImageContent.vue';
import { MessageType } from '@/utils/websocket';

const props = defineProps<{
  content: any;
  messageType: string;
  isSelf: boolean;
  videoLoadingMap?: Record<string, boolean>;
  videoDoneMap?: Record<string, boolean>;
  videoProgressMap?: Record<string, string | number>;
}>();

// 保持与 MediaDisplay 的类型契合，优先使用完成态新类型
const resolvedType = computed(() => {
  const t = String(props.messageType || '').toLowerCase();
  return t === MessageType.image_generation_complete ? MessageType.text_to_image_complete : t;
});
</script>

<style scoped>
</style>
