<template>
  <n-config-provider
    :theme-overrides="{
      common: {
        heightLarge: '46px',
        borderRadius: '25px',
      },
    }"
  >
    <n-modal
      :show="show"
      @update:show="(val) => emit('update:show', val)"
      preset="card"
      :title="t('deleteAccountModal.title')"
      class="max-w-[500px] w-[90vw]"
      :bordered="false"
    >
      <div class="text-warning mb-4">
        <p class="text-red-500 font-bold">{{ t('deleteAccountModal.warning') }}</p>
        <p>{{ t('deleteAccountModal.accountAssets', { tokens: tokensText }) }}</p>
      </div>

      <n-form ref="formRef" :model="formValue" :rules="rules" size="large">
        <n-form-item :label="t('deleteAccountModal.reason')" path="reason">
          <n-select
            v-model:value="formValue.reason"
            :options="reasonOptions"
            :placeholder="t('deleteAccountModal.selectReason')"
            @update:value="handleReasonChange"
          />
        </n-form-item>

        <n-form-item v-if="showOtherReasonInput" path="otherReason">
          <n-input
            v-model:value="formValue.otherReason"
            type="textarea"
            :placeholder="t('deleteAccountModal.otherReason')"
          />
        </n-form-item>

        <n-form-item :label="t('deleteAccountModal.password')" path="password">
          <n-input
            type="password"
            show-password-on="click"
            v-model:value="formValue.password"
            :placeholder="t('deleteAccountModal.enterPassword')"
          />
        </n-form-item>

        <n-form-item :label="t('deleteAccountModal.confirmation')" path="confirmation">
          <n-input
            v-model:value="formValue.confirmation"
            :placeholder="t('deleteAccountModal.enterConfirmation')"
          />
        </n-form-item>
      </n-form>

      <BabeButton
        type="primary"
        block
        round
        @click="handleConfirmDelete"
        :loading="isLoading"
      >
        {{ t('deleteAccountModal.confirmDelete') }}
      </BabeButton>
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, reactive, computed, watch } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { deleteAccount } from '@/api/auth';
import { NModal, NInput, NConfigProvider, NForm, NFormItem, NSelect } from 'naive-ui';
import BabeButton from '@/components/BabeButton/index.vue';
import type { FormInst, FormRules } from 'naive-ui';
import { useI18n } from 'vue-i18n';
import { useCurrency } from "@/composables/useCurrency";

const props = defineProps<{ show: boolean }>();
const emit = defineEmits(['update:show', 'success']);

const { t } = useI18n();
const { formatNumber } = useCurrency();
const authStore = useAuthStore();
const message = (window as any).$message;
const formRef = ref<FormInst | null>(null);

const isLoading = ref(false);
const showOtherReasonInput = ref(false);

const formValue = reactive({
  reason: null,
  otherReason: '',
  password: '',
  confirmation: '',
});

const accountInfo = computed(() => authStore.accountInfo);
const tokensText = computed(() => formatNumber(accountInfo.value?.tokens ?? 0));

const reasonOptions = [
  { label: t('deleteAccountModal.reasons.notNeeded'), value: 'not_needed' },
  { label: t('deleteAccountModal.reasons.featureLack'), value: 'feature_lack' },
  { label: t('deleteAccountModal.reasons.privacy'), value: 'privacy' },
  { label: t('deleteAccountModal.reasons.other'), value: 'other' },
];

const rules: FormRules = {
  reason: [{ required: true, message: t('deleteAccountModal.validation.selectReason'), trigger: 'blur' }],
  otherReason: [
    {
      validator: (_rule, value) => {
        if (showOtherReasonInput.value && !value) {
          return new Error(t('deleteAccountModal.validation.enterOtherReason'));
        }
        return true;
      },
      trigger: ['input', 'blur'],
    },
  ],
  password: [{ required: true, message: t('deleteAccountModal.validation.enterPassword'), trigger: 'blur' }],
  confirmation: [
    {
      validator: (_rule, value) => {
        if (!value) {
          return new Error(t('deleteAccountModal.validation.enterConfirmation'));
        }
        if (value !== 'DELETE MY ACCOUNT') {
          return new Error(t('deleteAccountModal.validation.confirmationText'));
        }
        return true;
      },
      trigger: 'blur',
    },
  ],
};

watch(() => props.show, (newValue) => {
  if (!newValue) {
    formRef.value?.restoreValidation();
    Object.assign(formValue, {
      reason: null,
      otherReason: '',
      password: '',
      confirmation: '',
    });
    showOtherReasonInput.value = false;
  }
});

const handleReasonChange = (value: string) => {
  showOtherReasonInput.value = value === 'other';
};

const handleConfirmDelete = () => {
  formRef.value?.validate(async (errors) => {
    if (!errors) {
      isLoading.value = true;
      try {
        const reason = formValue.reason === 'other' ? formValue.otherReason : formValue.reason;
        await deleteAccount({
          password: formValue.password,
          confirmation: formValue.confirmation,
          reason: reason,
        });
        message.success(t('deleteAccountModal.success'));
        emit('success');
        emit('update:show', false);
      } catch (error: any) {
        console.error('删除账户失败:', error);
      } finally {
        isLoading.value = false;
      }
    }
  });
};
</script>
