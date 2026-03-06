<template>
  <n-config-provider
    :theme="themeStore.themeName === 'dark' ? darkTheme : undefined"
    :theme-overrides="{
      common: {
        ...themeStore.naiveOverridesTheme.common,
        heightLarge: '50px',
        borderRadius: isMobile ? '16px' : '25px',
      },
    }"
  >
    <n-modal
      v-model:show="showModal"
      :mask-closable="true"
      preset="card"
      :class="modalClass"
      :title="t('components.consumptionDetailModal.title')"
      :style="modalStyle"
      :transform-origin="isMobile ? 'center' : 'mouse'"
    >
      <ConsumptionDetailContent v-if="showModal" />
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from "vue";
import { useI18n } from "vue-i18n";
import { NModal, NConfigProvider, darkTheme } from "naive-ui";
import { useThemeStore } from "@/stores/themeStore";
import { throttle } from "@/utils/throttle";
import ConsumptionDetailContent from "./ConsumptionDetailContent.vue";

const { t } = useI18n();
const themeStore = useThemeStore();

const props = defineProps<{
  show: boolean;
}>();

const emit = defineEmits<{
  "update:show": [value: boolean];
}>();

const isMobile = ref(false);

const showModal = computed({
  get: () => props.show,
  set: (value) => emit("update:show", value),
});

const modalClass = computed(() => {
  return isMobile.value ? "mobile-consumption-modal" : "w-950px consumption-detail-modal";
});

const modalStyle = computed(() => {
  if (isMobile.value) {
    return {
      width: "95vw",
      maxWidth: "450px",
      margin: "10px auto",
      maxHeight: "90vh",
    };
  }
  return {
    width: "950px",
    height: "85vh",
    maxHeight: "85vh",
  };
});

const checkDevice = () => {
  isMobile.value =
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
};

const handleResize = throttle(() => {
  checkDevice();
}, 300);

onMounted(() => {
  checkDevice();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
:deep(.mobile-consumption-modal) {
  margin: 10px !important;
}

:deep(.mobile-consumption-modal .n-card) {
  margin: 0;
  border-radius: 16px;
  max-height: 90vh;
  height: 90vh;
  display: flex;
  flex-direction: column;
}
</style>
