<template>
  <VideoContent :content="content" :message-type="MessageType.video_hidden" :is-self="isSelf" :hidden="true" />
</template>

<script setup lang="ts">
import VideoContent from '../parts/VideoContent.vue';
import { MessageType } from '@/utils/websocket';

defineProps<{
  content: any;
  messageType: string;
  isSelf: boolean;
}>();
</script>

<style scoped>
</style>
