<template>
  <TextContent :content="content" :is-self="isSelf" :hidden="true" />
</template>

<script setup lang="ts">
import TextContent from '../parts/TextContent.vue';
import { MessageType } from '@/utils/websocket';

defineProps<{
  content: any;
  messageType: string;
  isSelf: boolean;
}>();
</script>

<style scoped>
</style>
