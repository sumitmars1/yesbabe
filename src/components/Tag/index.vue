<template>
  <div>
    <div
      style="background-color: rgba(0, 0, 0, 0.2)"
      class="px-1 py-[2px] rounded-full relative inline-flex items-center"
    >
      <span class="mr-1">{{ content }}</span>
      <svg-icon class="w-5" iconClass="arrow-left" size="18" />
    </div>
  </div>
</template>
<script setup lang="ts">
import { computed } from "vue";
const props = defineProps<{
  content: string;
}>();
</script>
