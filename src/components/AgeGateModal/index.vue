<script setup lang="ts">
import { ref, watch } from "vue";
import { NModal, NCheckbox } from "naive-ui";
import BabeButton from "@/components/BabeButton/index.vue";
import { useThemeStore } from "@/stores/themeStore";
import { darkTheme } from "naive-ui";

interface Props {
  show?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
});

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "confirm"): void;
}>();

const agreed = ref(false);
const themeStore = useThemeStore();

watch(
  () => props.show,
  (val) => {
    if (val) {
      agreed.value = false;
    }
  }
);

const handleUpdateShow = (val: boolean) => {
  if (val) {
    emit("update:show", true);
  }
};

const handleConfirm = () => {
  if (!agreed.value) return;
  emit("confirm");
  emit("update:show", false);
};
</script>

<template>
  <n-config-provider
    :theme="themeStore.themeName === 'dark' ? darkTheme : undefined"
    :theme-overrides="{
      common: {
        borderRadius: '24px',
      },
      Checkbox: {
        borderRadius: '6px',
      }
    }"
  >
    <n-modal
      :show="props.show"
      :style="{ width: '90%', maxWidth: '400px', padding: '0' }"
      :bordered="false"
      :mask-closable="false"
      :close-on-esc="false"
      :closable="false"
      :auto-focus="false"
      :trap-focus="true"
      :block-scroll="true"
      @update:show="handleUpdateShow"
      class="age-gate-modal"
    >
      <div class="relative overflow-hidden rounded-[24px] bg-white dark:bg-[#1A1A1A] shadow-2xl">
        <!-- 装饰背景 -->
        <div class="absolute top-0 left-0 w-full h-[140px] bg-gradient-to-b from-red-50 to-transparent dark:from-red-900/20 pointer-events-none"></div>
        
        <div class="relative px-8 pt-10 pb-8 flex flex-col items-center">
          <!-- 18+ 徽章 -->
          <div class="w-20 h-20 rounded-full bg-red-500 text-white flex items-center justify-center shadow-lg shadow-red-500/30 mb-6 relative z-10">
            <div class="text-center leading-none">
              <span class="block text-[28px] font-900 tracking-tighter">18</span>
              <span class="block text-[10px] font-bold uppercase tracking-wider opacity-90 mt-[-2px]">Plus</span>
            </div>
            <!-- 圆环装饰 -->
            <div class="absolute inset-0 rounded-full border-2 border-white/20"></div>
          </div>

          <!-- 标题 -->
          <h2 class="text-2xl font-800 text-gray-900 dark:text-white mb-3 text-center tracking-tight">
            年齢確認
          </h2>

          <!-- 正文 -->
          <p class="text-[15px] leading-relaxed text-gray-500 dark:text-gray-400 text-center mb-8">
            当サイトには、18歳未満の方の閲覧が禁止されているコンテンツが含まれています。
          </p>

          <!-- 确认框 -->
          <div 
            class="w-full bg-gray-50 dark:bg-white/5 rounded-xl border border-gray-100 dark:border-white/10 p-4 mb-6 cursor-pointer transition-all duration-200 hover:bg-gray-100 dark:hover:bg-white/10"
            @click="agreed = !agreed"
          >
            <div class="flex items-start gap-3">
              <n-checkbox 
                v-model:checked="agreed" 
                @click.stop 
                size="large"
                class="mt-[2px]"
              />
              <div class="text-sm font-medium text-gray-700 dark:text-gray-200 select-none leading-normal">
                私は18歳以上であり、<br class="hidden sm:block" />成人向けコンテンツの閲覧に同意します
              </div>
            </div>
          </div>

          <!-- 按钮 -->
          <BabeButton 
            class="w-full" 
            :disabled="!agreed" 
            @click="handleConfirm"
            variant="primary"
            round
          >
            確認して進む
          </BabeButton>
        </div>
      </div>
    </n-modal>
  </n-config-provider>
</template>

<style scoped>
/* 可以在这里添加额外的样式微调 */
</style>
