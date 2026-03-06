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
      v-model:show="visible"
      preset="card"
      :style="{ width: '90%', maxWidth: '400px' }"
      :bordered="false"
      :mask-closable="false"
      class="message-quota-modal"
    >
    <template #header>
      <div class="text-center">
        <h3 class="text-lg font-semibold text-primary">{{ t('messageQuotaModal.title') }}</h3>
      </div>
    </template>
    
    <div class="">
      <div class="text-center text-secondary">
        <p>{{ t('messageQuotaModal.description') }}</p>
      </div>
      
      <div class="bg-secondBackground rounded-lg card mb-secondMargin">
        <h4 class="text-base font-medium text-primary mb-3">{{ t('messageQuotaModal.proBenefitsTitle') }}</h4>
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-sm text-secondary">{{ t('messageQuotaModal.benefits.monthlyDiamonds') }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-sm text-secondary">{{ t('messageQuotaModal.benefits.voiceCall') }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-sm text-secondary">{{ t('messageQuotaModal.benefits.createPersonalizedAI') }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-sm text-secondary">{{ t('messageQuotaModal.benefits.unlimitedChat') }}</span>
          </div>
          <div class="flex items-center space-x-2">
            <svg class="w-4 h-4 text-green-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"></path>
            </svg>
            <span class="text-sm text-secondary">{{ t('messageQuotaModal.benefits.generateImages') }}</span>
          </div>
        </div>
      </div>
      
      <div class="flex space-x-3">
        <BabeButton
          variant="default"
          size="medium"
          class="flex-1"
          @click="handleCancel"
        >
          {{ t('messageQuotaModal.later') }}
        </BabeButton>
        <BabeButton
          variant="primary"
          size="medium"
          class="flex-1"
          @click="handleUpgrade"
        >
          {{ t('messageQuotaModal.upgrade') }}
        </BabeButton>
      </div>
    </div>
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import { NModal, NConfigProvider, darkTheme } from 'naive-ui'
import { useThemeStore } from '@/stores/themeStore'
import BabeButton from '@/components/BabeButton/index.vue'

interface Props {
  show?: boolean
}

interface Emits {
  (e: 'update:show', value: boolean): void
}

const props = withDefaults(defineProps<Props>(), {
  show: false
})

const emit = defineEmits<Emits>()
const router = useRouter()
const themeStore = useThemeStore()
const { t } = useI18n()

const visible = ref(props.show)

// 监听 props.show 变化
watch(() => props.show, (newVal) => {
  visible.value = newVal
})

// 监听 visible 变化，同步到父组件
watch(visible, (newVal) => {
  emit('update:show', newVal)
})

const handleCancel = () => {
  visible.value = false
}

const handleUpgrade = () => {
  visible.value = false
  router.push('/premium/pro')
}
</script>

<style scoped>
.message-quota-modal :deep(.n-card) {
  border-radius: 25px;
}

.message-quota-modal :deep(.n-card-header) {
  padding: 20px 20px 0;
}

.message-quota-modal :deep(.n-card__content) {
  padding: 20px;
}
</style>