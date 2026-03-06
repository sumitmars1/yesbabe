<template>
  <div
    class="w-full aspect-[9/16] rounded-2xl overflow-hidden bg-cardBackground relative cursor-pointer flex flex-col items-center justify-center border-2 border-dashed border-gray-300 hover:border-appColor hover:bg-hoverBackground dark:hover:bg-hoverBackground transition-all duration-300 group shadow-border hover:shadow-lg transform hover:scale-[1.02]"
    @click="handleClick"
  >
    <div class="flex flex-col items-center justify-center h-full w-full p-6">
      <!-- 加号图标 -->
      <div class="w-20 h-20 rounded-full bg-gradient-to-br from-primary-100 to-primary-200 dark:from-primary-800 dark:to-primary-700 flex items-center justify-center mb-4 shadow-inner group-hover:scale-110 transition-transform duration-300">
        <svg-icon 
          iconClass="Plus" 
          :size="32" 
          class="text-primary dark:text-primary group-hover:text-primary-600 dark:group-hover:text-primary-200 transition-colors duration-300" 
        />
      </div>
      
      <!-- 文本内容 -->
      <div class="text-center">
        <div class="text-base font-bold text-primary dark:text-primary group-hover:text-primary-800 dark:group-hover:text-primary-200 transition-colors duration-300">
          {{ t('components.addAICard.createNewAIC') }}
        </div>
      </div>
      
      <!-- 装饰元素 -->
      <div class="absolute top-4 right-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
        <div class="w-8 h-8 rounded-full bg-gradient-to-br from-primary-300 to-primary-500"></div>
      </div>
      <div class="absolute bottom-4 left-4 opacity-20 group-hover:opacity-40 transition-opacity duration-300">
        <div class="w-6 h-6 rounded-full bg-gradient-to-br from-primary-200 to-primary-400"></div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useRouter } from "vue-router";
import { useI18n } from 'vue-i18n';
import SvgIcon from "@/components/SvgIcon/index.vue";

const { t } = useI18n();

const router = useRouter();

const handleClick = () => {
  router.push("/create/style");
};
</script>

<style scoped>
/* 自定义样式增强 */
.group:hover .shadow-inner {
  box-shadow: inset 0 2px 4px 0 rgba(0, 0, 0, 0.1);
}

/* 优化移动端响应式 */
@media (max-width: 768px) {
  .transform.hover\:scale-\[1\.02\]:hover {
    transform: scale(1.01);
  }
}

/* 卡片背景样式 */
.bg-cardBackground {
  background: linear-gradient(135deg, var(--c-background) 0%, var(--c-secondary-background) 100%);
}

/* 确保固定尺寸 */
.w-160px {
  width: 160px;
}

.h-210px {
  height: 210px;
}
</style>