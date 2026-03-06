<template>
  <div class="faq-view">
    <FAQ />
  </div>
</template>

<script setup lang="ts">
import FAQ from '@/components/FAQ/index.vue';
</script>

<style scoped>
.faq-view {
  padding: 20px;
  max-width: 800px;
  margin: 0 auto;
  min-height: 100vh;
}

@media (max-width: 768px) {
  .faq-view {
    padding: 16px;
  }
}
</style>