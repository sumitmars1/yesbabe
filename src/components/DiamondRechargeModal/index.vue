<script setup lang="ts">
import { ref } from "vue";
import { useThemeStore } from "@/stores/themeStore";
import { darkTheme, NModal, NConfigProvider } from "naive-ui";
import BabeButton from "@/components/BabeButton/index.vue";
import { useI18n } from "vue-i18n";
import diamondIcon from "@/assets/images/diamond-1.png";

const { t } = useI18n();
const themeStore = useThemeStore();

// 定义回调函数接口
interface DiamondRechargeModalCallbacks {
  onOk?: () => void;
  onCancel?: () => void;
}

// 控制模态框显示
const showModal = ref(false);
let currentCallbacks: DiamondRechargeModalCallbacks | undefined;

// 暴露方法给父组件
const show = (callbacks?: DiamondRechargeModalCallbacks) => {
  currentCallbacks = callbacks;
  showModal.value = true;
};

const hide = () => {
  showModal.value = false;
  currentCallbacks = undefined;
};

// 处理关闭
const handleClose = () => {
  if (currentCallbacks?.onCancel) {
    currentCallbacks.onCancel();
  }
  hide();
};

// 处理去充值按钮点击
const handleRecharge = () => {
  if (currentCallbacks?.onOk) {
    currentCallbacks.onOk();
  }
  hide();
};

// 暴露方法
defineExpose({
  show,
  hide,
});
</script>

<template>
  <n-config-provider
    :theme="themeStore.themeName === 'dark' ? darkTheme : undefined"
    :theme-overrides="{
      common: {
        ...themeStore.naiveOverridesTheme.common,
        borderRadius: '25px',
      },
    }"
  >
    <n-modal
      :show="showModal"
      preset="card"
      :style="{ width: '90%', maxWidth: '400px', maxHeight: '400px' }"
      :bordered="false"
      :mask-closable="true"
      @update:show="handleClose"
      class="diamond-recharge-modal"
    >
      <template #header>
        <div class="text-center text-lg font-semibold text-primary">
          {{ t("diamondRechargeModal.title") }}
        </div>
      </template>
      <div>
        <!-- 钻石图标 -->
        <div class="flex justify-center mb-4">
          <div class="w-16 h-16 flex items-center justify-center rounded-full bg-gradient-to-br from-blue-400 to-purple-500">
            <svg class="w-10 h-10 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
            </svg>
          </div>
        </div>

        <!-- 提示信息 -->
        <!-- <div class="text-center mb-6">
          <div class="text-base font-medium text-primary mb-2">
            {{ t("diamondRechargeModal.insufficientBalance") }}
          </div>
          <div class="text-sm text-secondary">
            {{ t("diamondRechargeModal.needDiamonds") }}
          </div>
        </div> -->

        <!-- 提示文本 -->
        <div class="bg-secondBackground rounded-lg p-4 mb-6">
          <div class="flex items-center space-x-2">
            <svg class="w-5 h-5 text-blue-500 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clip-rule="evenodd"></path>
            </svg>
            <div class="text-xs text-secondary">
              {{ t("diamondRechargeModal.tip") }}
            </div>
          </div>
        </div>

        <!-- 按钮 -->
        <div class="flex space-x-3">
          <BabeButton
            variant="default"
            size="medium"
            class="flex-1"
            @click="handleClose"
          >
            {{ t("diamondRechargeModal.cancel") }}
          </BabeButton>
          <BabeButton
            variant="primary"
            size="medium"
            class="flex-1"
            @click="handleRecharge"
          >
            {{ t("diamondRechargeModal.goRecharge") }}
          </BabeButton>
        </div>
      </div>
    </n-modal>
  </n-config-provider>
</template>

<style scoped>
.diamond-recharge-modal :deep(.n-card) {
  border-radius: 25px;
}

.diamond-recharge-modal :deep(.n-card-header) {
  padding: 20px 0;
}

.diamond-recharge-modal :deep(.n-card__content) {
  padding: 20px;
}
</style>