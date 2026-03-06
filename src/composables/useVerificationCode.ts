import { ref } from 'vue';
import { SendEmailCode } from '@/api/auth';
import type { SendEmailCodeRequest } from '@/api/auth/type';

export function useVerificationCode() {
  const isLoading = ref(false);
  const errorMessage = ref('');
  const countdown = ref(0);
  let countdownTimer: NodeJS.Timeout | null = null;

  const startCountdown = () => {
    countdown.value = 60;
    countdownTimer = setInterval(() => {
      countdown.value--;
      if (countdown.value <= 0) {
        if (countdownTimer) clearInterval(countdownTimer);
      }
    }, 1000);
  };

  const sendCode = async (email: string, type: 'register' | 'reset', password?: string) => {
    isLoading.value = true;
    errorMessage.value = '';
    try {
      const requestData: SendEmailCodeRequest = { 
        email, 
        email_type: type,
        ...(password && { password }) // 如果提供了密码，则添加到请求数据中
      };
      await SendEmailCode(requestData);
      startCountdown();
      return true;
    } catch (error) {
      errorMessage.value = '发送验证码失败，请稍后再试。';
      console.error('Failed to send verification code:', error);
      return false;
    } finally {
      isLoading.value = false;
    }
  };

  const stopCountdown = () => {
    if (countdownTimer) {
      clearInterval(countdownTimer);
      countdownTimer = null;
    }
    countdown.value = 0;
  };

  return {
    isLoading,
    errorMessage,
    countdown,
    sendCode,
    stopCountdown,
  };
}