<template>
  <component
    :is="isVideo ? VideoContent : ImageContent"
    :content="content"
    message-type="mixed"
    :is-self="isSelf"
  />
</template>

<script setup lang="ts">
import { computed } from 'vue';
import VideoContent from '../parts/VideoContent.vue';
import ImageContent from '../parts/ImageContent.vue';

const props = defineProps<{
  content: any;
  messageType: string;
  isSelf: boolean;
}>();

const isVideo = computed(() => {
  const v = props.content as any;
  const asStr = typeof v === 'string' ? v : (v?.url || v?.video_url || v?.image_url || '');
  return /\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)$/i.test(asStr || '');
});
</script>

<style scoped>
</style>
