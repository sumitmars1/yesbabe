<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useThemeStore } from "@/stores/themeStore";
import BabeButton from "@/components/BabeButton/index.vue";

const CONSENT_STORAGE_KEY = "cookie_consent_accepted";

interface Props {
  show?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  show: false,
});

const emit = defineEmits<{
  (e: "update:show", value: boolean): void;
  (e: "accept"): void;
  (e: "decline"): void;
}>();

const { t } = useI18n();
const themeStore = useThemeStore();
const isVisible = ref(false);

onMounted(() => {
  // 检查是否已经同意过
  const hasConsent = localStorage.getItem(CONSENT_STORAGE_KEY);
  if (!hasConsent) {
    // 延迟显示，避免页面加载时立即弹出
    setTimeout(() => {
      isVisible.value = true;
    }, 1000);
  }
});

const handleAccept = () => {
  localStorage.setItem(CONSENT_STORAGE_KEY, "accepted");
  isVisible.value = false;
  emit("accept");
  emit("update:show", false);
};

const handleDecline = () => {
  localStorage.setItem(CONSENT_STORAGE_KEY, "declined");
  isVisible.value = false;
  emit("decline");
  emit("update:show", false);
};
</script>

<template>
  <Transition name="slide-up">
    <div
      v-if="isVisible || show"
      class="cookie-consent fixed bottom-0 left-0 right-0 z-[9999] p-4"
    >
      <div
        class="max-w-4xl mx-auto rounded-xl shadow-2xl p-4 md:p-5 flex flex-col md:flex-row items-center justify-between gap-4 backdrop-blur-sm"
        :class="[
          themeStore.themeName === 'dark'
            ? 'bg-[#1A1A1A]/95 border border-white/10'
            : 'bg-white/95 border border-gray-200'
        ]"
      >
        <!-- 文字内容 -->
        <div class="flex-1 text-center md:text-left">
          <h3
            class="text-base font-semibold mb-1"
            :class="themeStore.themeName === 'dark' ? 'text-white' : 'text-gray-900'"
          >
            {{ t('cookieConsent.title') }}
          </h3>
          <p
            class="text-sm leading-relaxed"
            :class="themeStore.themeName === 'dark' ? 'text-gray-400' : 'text-gray-600'"
          >
            {{ t('cookieConsent.description') }}
          </p>
        </div>

        <!-- 按钮组 -->
        <div class="flex items-center gap-3 shrink-0">
          <BabeButton
            type="secondary"
            size="medium"
            round
            @click="handleDecline"
          >
            {{ t('cookieConsent.decline') }}
          </BabeButton>
          <BabeButton
            type="primary"
            size="medium"
            round
            @click="handleAccept"
          >
            {{ t('cookieConsent.accept') }}
          </BabeButton>
        </div>
      </div>
    </div>
  </Transition>
</template>

<style scoped>
.cookie-consent {
  animation: fadeIn 0.3s ease-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.slide-up-enter-active,
.slide-up-leave-active {
  transition: all 0.3s ease;
}

.slide-up-enter-from,
.slide-up-leave-to {
  opacity: 0;
  transform: translateY(100%);
}
</style>
