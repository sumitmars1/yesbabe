<template>
  <ImageContent :content="content" :message-type="MessageType.image_hidden" :is-self="isSelf" :hidden="true" />
</template>

<script setup lang="ts">
import ImageContent from '../parts/ImageContent.vue';
import { MessageType } from '@/utils/websocket';

defineProps<{
  content: any;
  messageType: string;
  isSelf: boolean;
}>();
</script>

<style scoped>
</style>
