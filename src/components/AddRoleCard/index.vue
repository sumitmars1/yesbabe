<template>
  <div 
    class="h-[324px] rounded-2xl overflow-hidden bg-roleCardBackground max-w-[248px] relative cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-400 hover:border-purple-500 transition-colors duration-300"
    @click="handleClick"
  >
    <div class="flex flex-col items-center justify-center h-full w-full">
      <div class="w-16 h-16 rounded-full bg-gray-700 flex items-center justify-center mb-4">
        <svg-icon iconClass="add" :size="32" class="text-gray-300" />
      </div>
      <div class="text-lg font-bold text-gray-300">{{ t('components.addRoleCard.createNewRole') }}</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const router = useRouter();

const handleClick = () => {
  router.push("/create");
};
</script>

<style scoped>
/* 可以根据需要添加额外的样式 */
</style>