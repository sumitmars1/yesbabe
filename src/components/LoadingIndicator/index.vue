<template>
  <div class="loading-container">
    <div class="loading-content">
      <div class="loading-spinner">
        <div class="petal"></div>
        <div class="petal"></div>
        <div class="petal"></div>
        <div class="petal"></div>
      </div>
      <p class="loading-text">{{ text }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { withDefaults } from 'vue';

interface Props {
  text?: string;
}

withDefaults(defineProps<Props>(), {
  text: '加载中...'
});
</script>

<style scoped lang="scss">
.loading-container {
  width: 100%;
  min-height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  position: relative;
  animation: spin 1.2s linear infinite;
}

.petal {
  position: absolute;
  width: 12px;
  height: 12px;
  background: var(--app-color, #6366f1);
  border-radius: 50%;
}

.petal:nth-child(1) {
  top: 0;
  left: 50%;
  transform: translateX(-50%);
  opacity: 1;
}

.petal:nth-child(2) {
  top: 50%;
  right: 0;
  transform: translateY(-50%);
  opacity: 0.7;
}

.petal:nth-child(3) {
  bottom: 0;
  left: 50%;
  transform: translateX(-50%);
  opacity: 0.5;
}

.petal:nth-child(4) {
  top: 50%;
  left: 0;
  transform: translateY(-50%);
  opacity: 0.3;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.loading-text {
  font-size: 14px;
  color: var(--text-primary);
  margin: 0;
}

/* 暗色模式适配 */
:deep([data-theme="dark"]) .loading-text {
  color: rgba(255, 255, 255, 0.8);
}
</style>
