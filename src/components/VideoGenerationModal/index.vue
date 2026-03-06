<script setup lang="ts">
import { ref } from "vue";
import { useThemeStore } from "@/stores/themeStore";
import { darkTheme, NModal, NConfigProvider } from "naive-ui";
import BabeButton from '@/components/BabeButton/index.vue';
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const themeStore = useThemeStore();

// 控制模态框显示
const showModal = ref(false);

// 暴露方法给父组件
const show = () => {
  showModal.value = true;
};

const hide = () => {
  showModal.value = false;
};

// 处理关闭
const handleClose = () => {
  hide();
};

// 处理确定按钮点击
const handleConfirm = () => {
  emit('confirm');
  hide();
};

// 定义事件
const emit = defineEmits<{
  confirm: [];
}>();

// 暴露方法
defineExpose({
  show,
  hide,
});
</script>

<template>
  <n-config-provider :theme="themeStore.themeName === 'dark' ? darkTheme : undefined" :theme-overrides="{
    common: {
      ...themeStore.naiveOverridesTheme.common,
      borderRadius: '25px',
    },
    Card: {
      borderRadius: '25px',
      headerPadding: '20px 0',
      contentPadding: '20px',
    },
  }">
    <n-modal :show="showModal" preset="card" :style="{ width: '90%', maxWidth: '400px' }" :bordered="false"
      :mask-closable="true" @update:show="handleClose" class="video-generation-modal">
      <template #header>
        <div class="text-center text-lg font-semibold text-primary">
          {{ t('components.videoGenerationModal.title') }}
        </div>
      </template>
      <div class="flex flex-col gap-5">
        <!-- 视频图标和价格信息 -->
        <div
          class="flex items-center justify-center gap-4 py-5 mb-5 bg-[var(--second-background)] border border-[var(--btn-border)] rounded-16">
          <div
            class="flex items-center justify-center w-12 h-12 bg-gradient-to-br from-[var(--c-app-color)] to-[#9b8aff] rounded-full shadow-[0_4px_12px_rgba(117,98,255,0.3)]">
            <svg class="w-6 h-6 text-white ml-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
          <div class="text-center">
            <div class="text-sm text-[var(--c-text-secondary)] mb-1">{{
              t('components.videoGenerationModal.generateVideoNeeds') }}</div>
            <div class="flex items-center gap-1.5 text-xl font-semibold text-[var(--c-text-primary)]">
              <!-- <span class="text-base filter drop-shadow-[0_2px_4px_rgba(255,215,0,0.3)]">💎</span> -->
              <svg-icon iconClass="diamond" class="mr-1" :size="24"></svg-icon>
              <span class="text-[var(--c-app-color)] font-bold">20</span>
              <span class="text-base text-[var(--c-text-secondary)]">{{ t('premium.purchaseDiamonds.diamonds') }}</span>
            </div>
          </div>
        </div>

        <!-- 确认按钮 -->
        <div class="flex justify-center">
          <BabeButton variant="primary" size="medium"
            class="px-8 h-11 text-base font-semibold rounded-22 shadow-[0_4px_12px_rgba(117,98,255,0.25)] transition-all duration-300"
            @click="handleConfirm">
            {{ t('components.videoGenerationModal.generateNow') }}
          </BabeButton>
        </div>
      </div>
    </n-modal>
  </n-config-provider>
</template>
