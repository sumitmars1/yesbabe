<template>
  <VideoContent :content="content" :message-type="resolvedType" :is-self="isSelf" />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VideoContent from '../parts/VideoContent.vue';
import { MessageType } from '@/utils/websocket';

const props = defineProps<{
  content: any;
  messageType: string;
  isSelf: boolean;
  videoLoadingMap?: Record<string, boolean>;
  videoDoneMap?: Record<string, boolean>;
  videoProgressMap?: Record<string, number>;
}>();

const resolvedType = computed(() => {
  const t = String(props.messageType || '').toLowerCase();
  return t === MessageType.video_generation_complete ? MessageType.text_to_video_complete : t;
});
</script>

<style scoped>
</style>
