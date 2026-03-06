<script setup lang="ts">
import { ref, h, nextTick, onUnmounted, getCurrentInstance } from "vue";
import { NIcon } from "naive-ui";
import { EyeOutline, EyeOffOutline } from "@vicons/ionicons5";
import {
  MailOutline as MailIcon,
  LockClosedOutline as LockIcon,
  PersonOutline as PersonIcon,
  EyeOutline as EyeIcon,
  EyeOffOutline as EyeOffIcon,
} from "@vicons/ionicons5";
import { LogoGoogle, LogoApple } from "@vicons/ionicons5";
import { useThemeStore } from "@/stores/themeStore";
import { useAuthStore } from "@/stores/auth/index";
import { useI18n } from 'vue-i18n';
import { REGISTER_SOURCE } from "@/constants/registration";
const { t } = useI18n();
const themeStore = useThemeStore();
const authStore = useAuthStore();
import { darkTheme } from "naive-ui";
// 导入API接口
import { useVerificationCode } from '@/composables/useVerificationCode';
import {
  register,
  login,
  resetPassword,
} from "@/api/auth/index";
import type { SendEmailCodeRequest, Register, Login, ResetPassword } from "@/api/auth/type";
import { trackCompleteRegistration } from "@/utils/facebookPixel";
const instance = getCurrentInstance();
// 方式1：立即访问（可能为 undefined）
const message = instance?.appContext.config.globalProperties.$message;

// Define the possible views
type AuthView =
  | "login"
  | "register"
  | "verification"
  | "reset-password"
  | "reset-verification"
  | "reset-new-password";

// Internal state for visibility and current view
const showModal = ref(false);
const currentView = ref<AuthView>("login"); // Default to login
// Reactive state for forms
const loginEmail = ref("");
const loginPassword = ref("");
const registerEmail = ref("");
const registerPassword = ref("");
const registerConfirmPassword = ref("");
const showLoginPassword = ref(false);
const showRegisterPassword = ref(false);
const showRegisterConfirmPassword = ref(false);

// 找回密码相关状态
const resetEmail = ref("");
const newPassword = ref("");
const newConfirmPassword = ref("");
const showNewPassword = ref(false);
const showNewConfirmPassword = ref(false);
const resetVerificationCode = ref(["", "", "", "", "", ""]);
const resetVerificationInputRefs = ref<HTMLInputElement[]>([]);

// 验证码相关状态
const verificationCode = ref(["", "", "", "", "", ""]);
const verificationInputRefs = ref<HTMLInputElement[]>([]);
const isLoading = ref(false);
const errorMessage = ref("");

const { 
  isLoading: isRegisterSending, 
  countdown: registerCountdown, 
  sendCode: sendRegisterCode, 
  stopCountdown: stopRegisterCountdown 
} = useVerificationCode();

const { 
  isLoading: isResetSending, 
  countdown: resetCountdown, 
  sendCode: sendResetCode, 
  stopCountdown: stopResetCountdown 
} = useVerificationCode();

// 清除倒计时
const clearCountdown = () => {
  stopRegisterCountdown();
  stopResetCountdown();
};

// Expose methods to control visibility and set initial view
const show = (initialView: AuthView = "login") => {
  currentView.value = initialView;
  showModal.value = true;
  errorMessage.value = "";
  // 清除倒计时
  clearCountdown();
  // 如果是注册视图，标记为主动注册
  if (initialView === "register") {
    authStore.setRegisterSource(REGISTER_SOURCE.DIRECT);
  }
  // Optional: Clear form data when showing, or based on the view
  if (initialView === "login") {
    loginEmail.value = "";
    loginPassword.value = "";
  } else {
    registerEmail.value = "";
    registerPassword.value = "";
    registerConfirmPassword.value = "";
  }
};

const hide = () => {
  showModal.value = false;
  errorMessage.value = "";
  // 清除倒计时
  clearCountdown();
  // 延迟找回视图，避免关闭时的视觉闪烁
  setTimeout(() => {
    currentView.value = "login"; // Reset view after modal is completely closed
  }, 300); // 等待模态框动画完成
};

// --- Handlers ---
const handleLogin = async () => {
  if (!loginEmail.value || !loginPassword.value) {
    errorMessage.value = t('components.authForm.fillEmailAndPassword');
    return;
  }
  isLoading.value = true;
  errorMessage.value = "";

  try {
    const loginData: Login = {
      username: loginEmail.value,
      password: loginPassword.value,
      grant_type: "password",
      scope: "",
      client_id: null,
      client_secret: null,
    };

    const response = await login(loginData);

    // 登录成功后的处理
    if (response.code === 200 && response.data.access_token) {
      await authStore.handleLoginSuccess(response.data.access_token);
      message.success(t('components.authForm.loginSuccess'));
      console.log("User info loaded:", authStore.userInfo);
    }

    hide(); // 关闭模态框
  } catch (error: any) {
    console.error("Login failed:", error);
    // 不显示后端错误信息，只保留前端校验
  } finally {
    isLoading.value = false;
  }
};

// 验证密码复杂性
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

const handleRegistration = async () => {
  if (
    !registerEmail.value ||
    !registerPassword.value ||
    !registerConfirmPassword.value
  ) {
    errorMessage.value = t('components.authForm.fillAllFields');
    return;
  }

  if (registerPassword.value !== registerConfirmPassword.value) {
    errorMessage.value = t('components.authForm.passwordMismatch');
    return;
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(registerEmail.value)) {
    errorMessage.value = t('components.authForm.invalidEmail');
    return;
  }

  // 验证密码复杂性
  const passwordValidation = validatePasswordComplexity(registerPassword.value);
  if (!passwordValidation.valid) {
    errorMessage.value = passwordValidation.message;
    return;
  }

  errorMessage.value = "";

  // 暂时注释掉验证码发送逻辑
  /*
  try {
    const success = await sendRegisterCode(registerEmail.value, "register", registerPassword.value);
    if (success) {
      // 切换到验证码视图
      currentView.value = "verification";
      // 聚焦第一个验证码输入框
      nextTick(() => {
        if (verificationInputRefs.value[0]) {
          verificationInputRefs.value[0].focus();
        }
      });
    }
  } catch (error: any) {
    console.error("Failed to send verification code:", error);
    // 不显示后端错误信息，只保留前端校验
  }
  */

  // 直接进行注册逻辑
  isLoading.value = true;
  try {
    // 调用注册API
    const registerData: Register = {
      email: registerEmail.value,
      password: registerPassword.value,
      register_source: authStore.registerSource, // 携带注册来源
    };

    const response = await register(registerData);
    console.log("Registration successful:", response);

    // 注册成功后的处理
    if (response.code === 200 && response.data.access_token) {
      // 注册成功，重置注册来源
      authStore.resetRegisterSource();
      // 注册成功且返回了access_token，直接登录
      await authStore.handleLoginSuccess(response.data.access_token);
      message.success(t('components.authForm.registerSuccess'));
      trackCompleteRegistration();
      hide(); // 关闭模态框
    } else {
      // 注册成功但没有返回token，提示用户登录
      switchToLogin();
    }
  } catch (error: any) {
    console.error("Registration failed:", error);
    // 显示后端返回的错误信息，如果有的话
    if (error.response && error.response.data && error.response.data.detail) {
        errorMessage.value = error.response.data.detail;
    } else {
        errorMessage.value = t('components.authForm.registerFailed');
    }
  } finally {
    isLoading.value = false;
  }
};

// 处理验证码输入
const handleVerificationInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  // 只允许输入数字
  if (value && !/^\d$/.test(value)) {
    verificationCode.value[index] = "";
    return;
  }

  // 更新验证码数组
  verificationCode.value[index] = value;

  // 自动聚焦下一个输入框
  if (value && index < 5) {
    nextTick(() => {
      verificationInputRefs.value[index + 1].focus();
    });
  }
};

// 处理验证码框的键盘事件
const handleVerificationKeydown = (index: number, event: KeyboardEvent) => {
  // 处理退格键
  if (event.key === "Backspace") {
    if (!verificationCode.value[index] && index > 0) {
      // 如果当前框为空且不是第一个框，聚焦前一个框
      nextTick(() => {
        verificationInputRefs.value[index - 1].focus();
      });
    }
  }
};

// 验证验证码并完成注册
const verifyCode = async () => {
  const code = verificationCode.value.join("");

  if (code.length !== 6) {
    errorMessage.value = t('components.authForm.completeVerificationCode');
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    // 调用注册API
    const registerData: Register = {
      email: registerEmail.value,
      password: registerPassword.value,
      code: code,
      register_source: authStore.registerSource, // 携带注册来源
    };

    const response = await register(registerData);
    console.log("Registration successful:", response);

    // 注册成功后的处理
    if (response.code === 200 && response.data.access_token) {
      // 注册成功，重置注册来源
      authStore.resetRegisterSource();
      // 注册成功且返回了access_token，直接登录
      await authStore.handleLoginSuccess(response.data.access_token);
      message.success(t('components.authForm.registerSuccess'));
      trackCompleteRegistration();
      hide(); // 关闭模态框
    } else {
      // 注册成功但没有返回token，提示用户登录
      switchToLogin();
    }
  } catch (error: any) {
    console.error("Registration failed:", error);
    // 不显示后端错误信息，只保留前端校验
  } finally {
    isLoading.value = false;
  }
};

// 处理忘记密码
const handleForgotPassword = () => {
  currentView.value = "reset-password";
  errorMessage.value = "";
  resetEmail.value = "";
};

// 处理找回密码邮箱提交
const handleResetPasswordEmail = async () => {
  if (!resetEmail.value) {
    errorMessage.value = t('components.authForm.enterEmail');
    return;
  }

  // 验证邮箱格式
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(resetEmail.value)) {
    errorMessage.value = t('components.authForm.invalidEmail');
    return;
  }

  isLoading.value = true;
  errorMessage.value = "";

  try {
    const success = await sendResetCode(resetEmail.value, "reset");
    if (success) {
      // 切换到找回密码验证码视图
      currentView.value = "reset-verification";
      // 聚焦第一个验证码输入框
      nextTick(() => {
        if (resetVerificationInputRefs.value[0]) {
          resetVerificationInputRefs.value[0].focus();
        }
      });
    }
  } catch (error: any) {
    console.error("Failed to send reset password code:", error);
    // 不显示后端错误信息，只保留前端校验
  } finally {
    isLoading.value = false;
  }
};

// 处理找回密码验证码输入
const handleResetVerificationInput = (index: number, event: Event) => {
  const input = event.target as HTMLInputElement;
  const value = input.value;

  // 只允许输入数字
  if (value && !/^\d$/.test(value)) {
    resetVerificationCode.value[index] = "";
    return;
  }

  // 更新验证码数组
  resetVerificationCode.value[index] = value;

  // 自动聚焦下一个输入框
  if (value && index < 5) {
    nextTick(() => {
      resetVerificationInputRefs.value[index + 1].focus();
    });
  }
};

// 处理找回密码验证码框的键盘事件
const handleResetVerificationKeydown = (
  index: number,
  event: KeyboardEvent
) => {
  // 处理退格键
  if (event.key === "Backspace") {
    if (!resetVerificationCode.value[index] && index > 0) {
      // 如果当前框为空且不是第一个框，聚焦前一个框
      nextTick(() => {
        resetVerificationInputRefs.value[index - 1].focus();
      });
    }
  }
};

// 验证找回密码验证码
const verifyResetCode = async () => {
  const code = resetVerificationCode.value.join("");

  if (code.length !== 6) {
    errorMessage.value = t('components.authForm.completeVerificationCode');
    return;
  }

  // 验证码正确，切换到设置新密码页面
  currentView.value = "reset-new-password";
  errorMessage.value = "";
};

// 处理设置新密码
const handleSetNewPassword = async () => {
  if (!newPassword.value || !newConfirmPassword.value) {
    errorMessage.value = t('components.authForm.fillNewPassword');
    return;
  }

  if (newPassword.value !== newConfirmPassword.value) {
    errorMessage.value = t('components.authForm.passwordMismatch');
    return;
  }

  if (newPassword.value.length < 6 || newPassword.value.length > 16) {
      errorMessage.value = t('components.authForm.passwordLength');
      return;
    }

  const code = resetVerificationCode.value.join("");

  isLoading.value = true;
  errorMessage.value = "";

  try {
    // 调用找回密码API
    const resetData: ResetPassword = {
      email: resetEmail.value,
      new_password: newPassword.value,
      code: code,
    };

    const response = await resetPassword(resetData);
    console.log("Password reset successful:", response);

    // 找回密码成功后的处理
    message.success(t('components.authForm.resetSuccess'));

    // 切换到登录页面
    switchToLogin();
  } catch (error: any) {
    console.error("Password reset failed:", error);
    // 不显示后端错误信息，只保留前端校验
  } finally {
    isLoading.value = false;
  }
};

// 返回到找回密码邮箱输入页面
const backToResetEmail = () => {
  currentView.value = "reset-password";
  errorMessage.value = "";
  // 清空验证码
  resetVerificationCode.value = ["", "", "", "", "", ""];
  // 清除倒计时
  clearCountdown();
};

// 返回到找回密码验证码页面
const backToResetVerification = () => {
  currentView.value = "reset-verification";
  errorMessage.value = "";
  newPassword.value = "";
  newConfirmPassword.value = "";
};

const handleSocialLogin = (provider: "google" | "apple") => {
  console.log(`${provider} login clicked`);
  // Implement social OAuth flow
};

// Toggle between views
const switchToRegister = () => {
  // 用户主动点击注册，标记为主动注册
  authStore.setRegisterSource(REGISTER_SOURCE.DIRECT);
  currentView.value = "register";
  errorMessage.value = "";
  // Optional: Clear login form data
  loginEmail.value = "";
  loginPassword.value = "";
};

const switchToLogin = () => {
  currentView.value = "login";
  errorMessage.value = "";
  // Optional: Clear registration form data
  registerEmail.value = "";
  registerPassword.value = "";
  registerConfirmPassword.value = "";
  // 清空验证码
  verificationCode.value = ["", "", "", "", "", ""];
  // 清空找回密码数据
  resetEmail.value = "";
  newPassword.value = "";
  newConfirmPassword.value = "";
  resetVerificationCode.value = ["", "", "", "", "", ""];
};

// 重新发送验证码
const resendVerificationCode = async () => {
  if (registerCountdown.value > 0) return;
  await sendRegisterCode(registerEmail.value, "register", registerPassword.value);
};

// 重新发送找回密码验证码
const resendResetVerificationCode = async () => {
  if (resetCountdown.value > 0) return;
  await sendResetCode(resetEmail.value, "reset");
};

// 返回到注册页面
const backToRegister = () => {
  currentView.value = "register";
  errorMessage.value = "";
  // 清空验证码
  verificationCode.value = ["", "", "", "", "", ""];
  // 清除倒计时
  clearCountdown();
};

// Handle closing via modal close button or mask click
const handleClose = () => {
  hide();
};

// Expose methods to the parent (functional caller)
// 组件卸载时清除倒计时
onUnmounted(() => {
  clearCountdown();
});

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
        heightLarge: '50px',
        borderRadius: '25px',
      },
    }"
  >
    <n-modal :show="showModal" @update:show="handleClose" :mask-closable="true">
      <n-card
        class="auth-card"
        role="dialog"
        aria-modal="true"
        :closable="true"
        @close="handleClose"
      >
        <template #header>
          <div class="text-left text-xl font-bold">
            {{
              currentView === "login"
                ? t('components.authForm.signIn')
                : currentView === "register"
                ? t('components.authForm.register')
                : currentView === "verification"
                ? t('components.authForm.verification')
                : currentView === "reset-password"
                ? t('components.authForm.forgotPassword')
                : currentView === "reset-verification"
                ? t('components.authForm.verification')
                : currentView === "reset-new-password"
                ? t('components.authForm.setNewPassword')
                : ""
            }}
          </div>
        </template>



        <div v-if="currentView === 'login'">
          <n-space vertical size="large">
            <n-input
              v-model:value="loginEmail"
              type="email"
              round
              :placeholder="t('components.authForm.email')"
              size="large"
              :input-props="{ autocomplete: 'email' }"
              :disabled="isLoading"
            >
              <template #prefix>
                <svg-icon
                  class="pr-2"
                  :size="22"
                  iconClass="email"
                ></svg-icon> </template
            ></n-input>
            <n-input
              v-model:value="loginPassword"
              show-password-on="click"
              :input-props="{ autocomplete: 'current-password' }"
              :type="'password'"
              :placeholder="t('components.authForm.password')"
              size="large"
              :disabled="isLoading"
            >
              <template #prefix>
                <svg-icon
                  class="pr-2"
                  :size="22"
                  iconClass="password"
                ></svg-icon>
              </template>
              <template #password-visible-icon>
                <n-icon
                  :size="24"
                  class="text-primary"
                  :component="EyeOffOutline"
                />
              </template>
              <template #password-invisible-icon>
                <n-icon
                  :size="24"
                  class="text-primary"
                  :component="EyeOutline"
                /> </template
            ></n-input>

            <!-- 错误信息显示 -->
            <div v-if="errorMessage" class="text-red-500 text-sm mt-2 mb-2">
              {{ errorMessage }}
            </div>

            <BabeButton
              type="primary"
              block
              @click="handleLogin"
              :loading="isLoading"
              :disabled="isLoading"
            >
              {{ isLoading ? t('components.authForm.loggingIn') : t('components.authForm.signIn') }}
            </BabeButton>

            <div class="text-left font-semibold">
              <BabeButton
                class='text-appColor font-bold'
                type="text"
                @click="handleForgotPassword"
                :disabled="isLoading"
              >
                {{ t('components.authForm.forgotPassword') }}
              </BabeButton>
            </div>

            <!-- <n-divider>{{ t('components.authForm.or') }}</n-divider> -->
            <!-- <n-space vertical size="medium">
              <BabeButton
                type="default"
                block
                @click="handleSocialLogin('google')"
                :disabled="isLoading"
              >
                <template #icon>
                  <div class="w-6 h-6 mr-4">
                    <svg-icon :size="24" iconClass="google"></svg-icon>
                  </div>
                </template>
                <span class="font-bold"> {{ t('components.authForm.google') }} </span>
              </BabeButton>
              <BabeButton
                type="default"
                block
                @click="handleSocialLogin('apple')"
                :disabled="isLoading"
              >
                <template #icon>
                  <div class="w-6 h-6 mr-4">
                    <svg-icon :size="24" iconClass="apple"></svg-icon>
                  </div>
                </template>
                <span class="font-bold"> {{ t('components.authForm.apple') }} </span>
              </BabeButton>
            </n-space> -->

            <div class="text-center mt-4">
              <n-text>{{ t('components.authForm.dontHaveAccount') }}</n-text>
              <BabeButton
                size="mini"
                type="text"
                class="ml-1 text-appColor font-bold"
                @click="switchToRegister"
                :disabled="isLoading"
              >
                {{ t('components.authForm.createAccount') }}
              </BabeButton>
            </div>
          </n-space>
        </div>

        <div v-else-if="currentView === 'register'">
          <n-space vertical size="large">
            <n-input
              v-model:value="registerEmail"
              type="email"
              :placeholder="t('components.authForm.email')"
              size="large"
              :prefix="() => h(NIcon, null, { default: () => h(MailIcon) })"
              :input-props="{ autocomplete: 'email' }"
              :disabled="isLoading"
            />
            <n-input
              v-model:value="registerPassword"
              :type="showRegisterPassword ? 'text' : 'password'"
              :placeholder="t('components.authForm.password')"
              size="large"
              :prefix="() => h(NIcon, null, { default: () => h(LockIcon) })"
              :suffix="
                () =>
                  h(
                    NIcon,
                    {
                      onClick: () =>
                        (showRegisterPassword = !showRegisterPassword),
                      style: { cursor: 'pointer' },
                    },
                    {
                      default: () =>
                        h(showRegisterPassword ? EyeOffIcon : EyeIcon),
                    }
                  )
              "
              :input-props="{ autocomplete: 'new-password' }"
              :disabled="isLoading"
            />
            <n-input
              v-model:value="registerConfirmPassword"
              :type="showRegisterConfirmPassword ? 'text' : 'password'"
              :placeholder="t('components.authForm.confirmPassword')"
              size="large"
              :prefix="() => h(NIcon, null, { default: () => h(LockIcon) })"
              :suffix="
                () =>
                  h(
                    NIcon,
                    {
                      onClick: () =>
                        (showRegisterConfirmPassword =
                          !showRegisterConfirmPassword),
                      style: { cursor: 'pointer' },
                    },
                    {
                      default: () =>
                        h(showRegisterConfirmPassword ? EyeOffIcon : EyeIcon),
                    }
                  )
              "
              :input-props="{ autocomplete: 'new-password' }"
              :disabled="isLoading"
            />

            <!-- 错误信息显示 -->
            <div v-if="errorMessage" class="text-red-500 text-sm mt-2 mb-4">
              {{ errorMessage }}
            </div>

            <BabeButton
              type="primary"
              block
              @click="handleRegistration"
              :loading="isLoading"
              :disabled="isLoading"
            >
              {{ isLoading ? t('components.authForm.registering') : t('components.authForm.register') }}
            </BabeButton>

            <div class="text-center mt-4">
              <n-text>{{ t('components.authForm.alreadyHaveAccount') }}</n-text>
              <BabeButton
                type="text"
                @click="switchToLogin"
                :disabled="isLoading"
                class='ml-1 text-appColor font-bold'
              >
                {{ t('components.authForm.signIn') }}
              </BabeButton>
            </div>
          </n-space>
        </div>

        <!-- 验证码输入界面 -->
        <div v-else-if="currentView === 'verification'">
          <n-space vertical size="large">
            <div class="text-center mb-4">
              <p class="text-lg font-medium">{{ t('components.authForm.verificationCode') }}</p>
              <p class="text-sm text-gray-500 mt-2">
                {{ t('components.authForm.codeSentTo') }} {{ registerEmail }}
              </p>
            </div>

            <!-- 验证码输入框 -->
            <div class="verification-code-container grid grid-cols-6 gap-2">
              <input
                v-for="(digit, index) in verificationCode"
                :key="index"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="1"
                v-model="verificationCode[index]"
                @input="handleVerificationInput(index, $event)"
                @keydown="handleVerificationKeydown(index, $event)"
                :ref="el => { if (el) verificationInputRefs[index] = el as HTMLInputElement }"
                class="verification-code-input"
                :disabled="isLoading"
              />
            </div>

            <div class="text-center mb-4">
              <span v-if="registerCountdown > 0" class="text-gray-500 text-sm">
                {{ registerCountdown }}{{ t('components.authForm.secondsBeforeResend') }}
              </span>
              <BabeButton
                v-else
                type="text"
                @click="resendVerificationCode"
                :disabled="isRegisterSending"
                class="text-blue-600 hover:text-blue-700 text-sm"
              >
                {{ t('components.authForm.resendCode') }}
              </BabeButton>
            </div>

            <BabeButton
              type="primary"
              block
              @click="verifyCode"
              :loading="isLoading"
              :disabled="isLoading"
            >
              {{ isLoading ? t('components.authForm.verifying') : t('components.authForm.verify') }}
            </BabeButton>

            <div class="text-center mt-4">
              <BabeButton
                type="text"
                @click="backToRegister"
                :disabled="isLoading"
              >
                {{ t('components.authForm.back') }}
              </BabeButton>
            </div>
          </n-space>
        </div>

        <!-- 找回密码邮箱输入界面 -->
        <div v-else-if="currentView === 'reset-password'">
          <n-space vertical size="large">
            <div class="text-center mb-4">
              <p class="text-sm text-gray-500 mt-2">
                {{ t('components.authForm.enterEmailForCode') }}
              </p>
            </div>

            <n-input
              v-model:value="resetEmail"
              type="email"
              :placeholder="t('components.authForm.email')"
              size="large"
              :prefix="() => h(NIcon, null, { default: () => h(MailIcon) })"
              :input-props="{ autocomplete: 'email' }"
              :disabled="isLoading"
            />

            <!-- 错误信息显示 -->
            <div v-if="errorMessage" class="text-red-500 text-sm mt-2 mb-2">
              {{ errorMessage }}
            </div>

            <BabeButton
              type="primary"
              block
              @click="handleResetPasswordEmail"
              :loading="isResetSending"
              :disabled="isResetSending"
            >
              {{ isResetSending ? t('components.authForm.sending') : t('components.authForm.sendCode') }}
            </BabeButton>

            <div class="text-center mt-4">
              <BabeButton
                type="text"
                @click="switchToLogin"
                :disabled="isLoading"
              >
                {{ t('components.authForm.backToLogin') }}
              </BabeButton>
            </div>
          </n-space>
        </div>

        <!-- 找回密码验证码输入界面 -->
        <div v-else-if="currentView === 'reset-verification'">
          <n-space vertical size="large">
            <div class="text-center mb-4">
              <p class="text-lg font-medium">{{ t('components.authForm.verificationCode') }}</p>
              <p class="text-sm text-gray-500 mt-2">
                {{ t('components.authForm.codeSentTo') }} {{ resetEmail }}
              </p>
            </div>

            <!-- 验证码输入框 -->
            <div class="verification-code-container grid grid-cols-6 gap-2">
              <input
                v-for="(digit, index) in resetVerificationCode"
                :key="index"
                type="text"
                inputmode="numeric"
                pattern="[0-9]*"
                maxlength="1"
                v-model="resetVerificationCode[index]"
                @input="handleResetVerificationInput(index, $event)"
                @keydown="handleResetVerificationKeydown(index, $event)"
                :ref="el => { if (el) resetVerificationInputRefs[index] = el as HTMLInputElement }"
                class="verification-code-input"
                :disabled="isLoading"
              />
            </div>

            <div class="text-center mb-4">
              <span v-if="resetCountdown > 0" class="text-gray-500 text-sm">
                {{ resetCountdown }}{{ t('components.authForm.secondsBeforeResend') }}
              </span>
              <BabeButton
                v-else
                type="text"
                @click="resendResetVerificationCode"
                :disabled="isLoading"
                class="text-blue-600 hover:text-blue-700 text-sm"
              >
                {{ t('components.authForm.resendCode') }}
              </BabeButton>
            </div>

            <BabeButton
              block
              @click="verifyResetCode"
              :loading="isLoading"
              :disabled="isLoading"
            >
              {{ isLoading ? t('components.authForm.verifying') : t('components.authForm.verify') }}
            </BabeButton>

            <div class="text-center mt-4">
              <BabeButton
                type="text"
                @click="backToResetEmail"
                :disabled="isLoading"
              >
                {{ t('components.authForm.back') }}
              </BabeButton>
            </div>
          </n-space>
        </div>

        <!-- 设置新密码界面 -->
        <div v-else-if="currentView === 'reset-new-password'">
          <n-space vertical size="large">
            <div class="text-center mb-4">
              <p class="text-lg font-medium">{{ t('components.authForm.setNewPassword') }}</p>
          <p class="text-sm text-gray-500 mt-2">{{ t('components.authForm.pleaseEnterNewPassword') }}</p>
            </div>

            <n-input
              v-model:value="newPassword"
              :type="showNewPassword ? 'text' : 'password'"
              :placeholder="t('components.authForm.newPassword')"
              size="large"
              :prefix="() => h(NIcon, null, { default: () => h(LockIcon) })"
              :suffix="
                () =>
                  h(
                    NIcon,
                    {
                      onClick: () => (showNewPassword = !showNewPassword),
                      style: { cursor: 'pointer' },
                    },
                    {
                      default: () => h(showNewPassword ? EyeOffIcon : EyeIcon),
                    }
                  )
              "
              :input-props="{ autocomplete: 'new-password' }"
              :disabled="isLoading"
            />

            <n-input
              v-model:value="newConfirmPassword"
              :type="showNewConfirmPassword ? 'text' : 'password'"
              :placeholder="t('components.authForm.confirmNewPassword')"
              size="large"
              :prefix="() => h(NIcon, null, { default: () => h(LockIcon) })"
              :suffix="
                () =>
                  h(
                    NIcon,
                    {
                      onClick: () =>
                        (showNewConfirmPassword = !showNewConfirmPassword),
                      style: { cursor: 'pointer' },
                    },
                    {
                      default: () =>
                        h(showNewConfirmPassword ? EyeOffIcon : EyeIcon),
                    }
                  )
              "
              :input-props="{ autocomplete: 'new-password' }"
              :disabled="isLoading"
            />

            <!-- 错误信息显示 -->
            <div v-if="errorMessage" class="text-red-500 text-sm mt-2 mb-4">
              {{ errorMessage }}
            </div>

            <BabeButton
              block
              @click="handleSetNewPassword"
              :loading="isResetSending"
              :disabled="isResetSending"
            >
              {{ isResetSending ? t('components.authForm.resetting') : t('components.authForm.resetPassword') }}
            </BabeButton>

            <div class="text-center mt-4">
              <BabeButton
                text
                @click="backToResetVerification"
                :disabled="isLoading"
              >
                {{ t('components.authForm.back') }}
              </BabeButton>
            </div>
          </n-space>
        </div>
      </n-card>
    </n-modal>
  </n-config-provider>
</template>

<style scoped>
.auth-card {
  max-width: 400px;
}
@media (max-width: 440px) {
  .auth-card {
    width: calc(100% - 40px);
    margin: 0 auto;
  }
}


/* 验证码输入框样式 */
.verification-code-container {
  margin: 20px 0;
}

.verification-code-input {
  max-width: 50px;
  height: 50px;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  text-align: center;
  font-size: 20px;
  font-weight: bold;
  background-color: #f5f5f5;
  transition: all 0.3s;
}

.verification-code-input:focus {
  border-color: #7562ff;
  outline: none;
  box-shadow: 0 0 0 2px rgba(117, 98, 255, 0.2);
}

.verification-code-input:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* 适配暗色主题 */
:deep(.n-config-provider.dark) .verification-code-input {
  background-color: #333;
  border-color: #444;
  color: #fff;
}
</style>
