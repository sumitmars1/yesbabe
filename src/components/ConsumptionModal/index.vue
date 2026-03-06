<template>
  <n-config-provider
    :theme="themeStore.themeName === 'dark' ? darkTheme : undefined"
    :theme-overrides="{
      common: {
        ...themeStore.naiveOverridesTheme.common,
        heightLarge: '50px',
        borderRadius: '25px',
      },
    }"
  >
    <n-modal
      v-model:show="showModal"
      :mask-closable="false"
      preset="card"
      class="w-320px rounded-lg"
    >
      <div class="flex flex-col items-center justify-center relative h-120px">
        <div class="absolute -top-10 left-12 opacity-10">
          <svg-icon iconClass="diamond" :size="180" class="select-none"></svg-icon>
        </div>
        <div class="relative z-10 flex flex-col items-center">
          <div class="text-lg font-bold mb-2 text-center">{{ t('components.consumptionModal.insufficientBalance') }}</div>
        <div class="text-sm opacity-70 mb-6 text-center">{{ t('components.consumptionModal.goToBuy') }}</div>
        </div>
      </div>
      <div class="flex justify-center w-full gap-3">
        <BabeButton type="default" class="flex-1" @click="handleNegativeClick"
          >{{ t('common.cancel') }}</BabeButton
        >
        <BabeButton type="primary" class="flex-1" @click="handlePositiveClick"
          >{{ t('components.consumptionModal.buyDiamonds') }}</BabeButton
        >
      </div>
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref } from "vue";
import { useI18n } from "vue-i18n";
import { NModal } from "naive-ui";
import BabeButton from "@/components/BabeButton/index.vue";
import { useThemeStore } from "@/stores/themeStore";
const { t } = useI18n();
const themeStore = useThemeStore();
import { darkTheme } from "naive-ui";

// 定义回调函数接口
interface ConsumptionModalCallbacks {
  onOk?: () => void;
  onCancel?: () => void;
}

const showModal = ref(false);
let currentCallbacks: ConsumptionModalCallbacks | undefined;

const emit = defineEmits(["ok", "cancel"]);

const handlePositiveClick = () => {
  if (currentCallbacks?.onOk) {
    currentCallbacks.onOk();
  }
  emit("ok");
  hide();
};

const handleNegativeClick = () => {
  if (currentCallbacks?.onCancel) {
    currentCallbacks.onCancel();
  }
  emit("cancel");
  hide();
};

const show = (callbacks?: ConsumptionModalCallbacks) => {
  currentCallbacks = callbacks;
  showModal.value = true;
};

const hide = () => {
  showModal.value = false;
  currentCallbacks = undefined;
};

defineExpose({
  show,
  hide,
});
</script>
