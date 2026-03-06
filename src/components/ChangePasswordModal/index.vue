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
      :title="t('components.changePasswordModal.title')"
      class="max-w-[400px] w-[90vw]"
      :bordered="false"
    >
      <div class="space-y-4">
        <!-- 显示错误信息 -->
        <div v-if="errorMessage" class="text-red-500 text-sm text-center">
          {{ errorMessage }}
        </div>
        
        <!-- 当前密码 -->
        <n-input
          size="large"
          type="password"
          show-password-on="click"
          v-model:value="oldPassword"
          :placeholder="t('components.changePasswordModal.currentPasswordPlaceholder')"
          :disabled="isLoading"
        />
        
        <!-- 新密码 -->
        <n-input
          size="large"
          type="password"
          show-password-on="click"
          v-model:value="newPassword"
          :placeholder="t('components.changePasswordModal.newPasswordPlaceholder')"
          :disabled="isLoading"
        />
        
        <!-- 确认新密码 -->
        <n-input
          size="large"
          type="password"
          show-password-on="click"
          v-model:value="confirmPassword"
          :placeholder="t('components.changePasswordModal.confirmPasswordPlaceholder')"
          :disabled="isLoading"
        />

        <!-- 验证码 -->
        <div class="flex gap-2">
          <n-input
            size="large"
            v-model:value="verificationCode"
            :placeholder="t('components.authForm.verificationCodePlaceholder')"
            :disabled="isLoading || !isCodeSent"
          />
          <BabeButton
            :disabled="isLoading || countdown > 0"
            @click="handleSendCode"
            class="whitespace-nowrap min-w-[120px]"
          >
            {{ countdown > 0 ? `${countdown}s` : t('components.authForm.sendCode') }}
          </BabeButton>
        </div>
        
        <!-- 提交按钮 -->
        <BabeButton
          type="primary"
          block
          round
          @click="handleChangePassword"
          :loading="isLoading"
          :disabled="isLoading"
        >
          {{ isLoading ? t('components.changePasswordModal.changing') : t('components.changePasswordModal.confirmChange') }}
        </BabeButton>
      </div>
    </n-modal>
  </n-config-provider>
</template>

<script setup lang="ts">
import { ref, watch, onUnmounted } from "vue";
import { useAuthStore } from "@/stores/auth";
import { resetPassword } from "@/api/auth";
import type { ResetPassword } from "@/api/auth/type";
import { NModal, NInput, NConfigProvider } from "naive-ui";
import BabeButton from "@/components/BabeButton/index.vue";
import { useI18n } from "vue-i18n";
import { useVerificationCode } from '@/composables/useVerificationCode';
import { useRouter } from 'vue-router';
import { showLoginModal } from '@/utils/authModal';

const props = defineProps<{ show: boolean }>();
const emit = defineEmits(["update:show"]);

const { t } = useI18n();
const authStore = useAuthStore();
const router = useRouter();
const message = (window as any).$message;

const oldPassword = ref("");
const newPassword = ref("");
const confirmPassword = ref("");
const verificationCode = ref("");
const isLoading = ref(false);
const errorMessage = ref("");
const isCodeSent = ref(false); // 标记验证码是否已发送

const { 
  isLoading: isSendingCode, 
  countdown, 
  sendCode, 
  stopCountdown 
} = useVerificationCode();

const validatePasswordComplexity = (password: string) => {
  // 检查密码长度是否在6-16位之间
  if (password.length < 6 || password.length > 16) {
    return {
      valid: false,
      message: t('components.authForm.passwordLength')
    };
  }

  return {
    valid: true,
    message: ""
  };
};

watch(
  () => props.show,
  (newValue) => {
    if (!newValue) {
      oldPassword.value = "";
      newPassword.value = "";
      confirmPassword.value = "";
      verificationCode.value = "";
      errorMessage.value = "";
      isCodeSent.value = false; // 重置验证码发送状态
      stopCountdown();
    }
  }
);

onUnmounted(() => {
  stopCountdown();
  isCodeSent.value = false; // 组件卸载时重置状态
});

const handleSendCode = async () => {
  if (!oldPassword.value) {
    errorMessage.value = t('components.changePasswordModal.currentPasswordRequired');
    return;
  }
  
  // 发送验证码前需要验证旧密码，这里假设后端发送验证码时会校验（或者这里仅做非空校验）
  // 实际上通常发送验证码只需要邮箱，这里我们使用 reset 类型
  const success = await sendCode(authStore.userInfo.email, "reset");
  if (success) {
    isCodeSent.value = true; // 发送成功后设置状态为true
  }
};

const handleChangePassword = async () => {
  errorMessage.value = "";
  
  if (!oldPassword.value) {
    errorMessage.value = t('components.changePasswordModal.currentPasswordRequired');
    return;
  }
  
  if (!newPassword.value || !confirmPassword.value) {
    errorMessage.value = t('components.changePasswordModal.newPasswordRequired');
    return;
  }
  
  if (newPassword.value !== confirmPassword.value) {
    errorMessage.value = t('components.changePasswordModal.passwordMismatch');
    return;
  }

  if (!verificationCode.value) {
    errorMessage.value = t('components.authForm.completeVerificationCode');
    return;
  }
  
  const passwordValidation = validatePasswordComplexity(newPassword.value);
  if (!passwordValidation.valid) {
    errorMessage.value = passwordValidation.message;
    return;
  }

  isLoading.value = true;
  try {
    const resetData: ResetPassword = {
      email: authStore.userInfo.email,
      old_password: oldPassword.value,
      new_password: newPassword.value,
      code: verificationCode.value,
    };
    
    await resetPassword(resetData);
    message.success(t('components.changePasswordModal.changeSuccess'));
    emit("update:show", false);

    // 修改成功后退出登录
    authStore.logout();
    router.push('/');
    showLoginModal('login');
    
  } catch (error: any) {
    // 显示后端错误信息
    if (error.response && error.response.data && error.response.data.detail) {
      errorMessage.value = error.response.data.detail;
    } else {
      console.error(error);
    }
  } finally {
    isLoading.value = false;
  }
};


</script>

<style scoped lang="scss">
/* 修改密码模态框样式 */
</style>
