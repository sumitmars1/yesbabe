<script setup lang="ts">
import { computed, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useThemeStore } from "@/stores/themeStore";
import { darkTheme } from "naive-ui";
import BabeButton from "@/components/BabeButton/index.vue";
import { NCheckbox } from "naive-ui";
import { createVipOrder, createTokenOrder } from "@/api/premium";
import { useCurrency } from "@/composables/useCurrency";
import SvgIcon from "@/components/SvgIcon/index.vue";
import CouponSelector from "@/components/CouponSelector/index.vue";
import { getCurrencyByLocale, trackInitiateCheckout } from "@/utils/facebookPixel";
import {
  getPaymentMethodOptions,
  type PaymentScene,
  type PaymentMethodOption,
} from "@/utils/paymentMethods";
import type { ApplicableCoupon } from "@/api/coupon/types";

const { t: $t, locale } = useI18n();
const { currencySymbol, formatCurrency } = useCurrency();

const themeStore = useThemeStore();

const PAYMENT_PENDING_ORDER_ID_KEY = "payment_pending_order_id";

// 获取当前页面完整URL作为支付回调地址，兜底使用 yesbabe.ai
const getBackUrl = () => {
  try {
    const url = new URL(window.location.href);
    url.searchParams.set("pay_callback", "1");
    return url.toString();
  } catch {
    return "https://yesbabe.ai";
  }
};

// 控制模态框显示
const showModal = ref(false);

// 支付信息
const paymentInfo = ref({
  amount: "0.00",
  title: "",
  description: "",
  vipId: 0, // Pro套餐ID
  tokenId: 0, // 钻石套餐ID
  tokensCount: 0, // 钻石数量（用于备选显示）
  returnTo: "" // 返回路径
});

// 选中的优惠券
const selectedCoupon = ref<ApplicableCoupon | null>(null);

// 实际支付金额（考虑优惠券）
const finalAmount = computed(() => {
  if (selectedCoupon.value) {
    return selectedCoupon.value.final_amount_preview;
  }
  return paymentInfo.value.amount;
});

// 成功回调
let successCallback: (() => void) | null = null;

// 暴露方法给父组件
const show = (amount: string, title: string = "", description: string = "", vipId: number = 0, tokenId: number = 0, tokensCount: number = 0, returnTo: string = "", onSuccess?: () => void) => {
  paymentInfo.value = {
    amount,
    title: title || $t('paymentModal.defaultTitle'),
    description,
    vipId,
    tokenId,
    tokensCount,
    returnTo
  };
  successCallback = onSuccess || null;
  selectedCoupon.value = null; // 重置优惠券选择
  selectedPaymentMethod.value = null;
  showModal.value = true;
};

const hide = () => {
  showModal.value = false;
  // 清理成功回调，避免内存泄漏
  successCallback = null;
  selectedCoupon.value = null;
};

// 处理关闭
const handleClose = () => {
  hide();
};

const paymentScene = computed<PaymentScene>(() => {
  return paymentInfo.value.vipId > 0 ? "vip" : "tokens";
});

const paymentMethods = computed(() => {
  return getPaymentMethodOptions(locale.value, paymentScene.value);
});

const shouldShowPaymentMethods = computed(() => {
  return paymentMethods.value.length > 0;
});

const selectedPaymentMethod = ref<PaymentMethodOption["value"] | null>(null);
const isProcessing = ref(false);
const lastPayClickAt = ref(0);
const PAY_CLICK_COOLDOWN_MS = 3000;

watchEffect(() => {
  const options = paymentMethods.value;
  if (!options.length) {
    selectedPaymentMethod.value = null;
    return;
  }

  const current = selectedPaymentMethod.value;
  const exists = current && options.some((item) => item.value === current);
  if (!exists) selectedPaymentMethod.value = options[0].value;
});

// 处理优惠券选择
const handleCouponSelect = (coupon: ApplicableCoupon | null) => {
  selectedCoupon.value = coupon;
};

// 处理支付
const handlePayment = async () => {
  const method = selectedPaymentMethod.value;
  const message = (window as any).$message;
  if (!method) {
    message?.warning?.($t("paymentModal.pleaseSelectPaymentMethod"));
    return;
  }
  if (isProcessing.value) return;
  const now = Date.now();
  if (now - lastPayClickAt.value < PAY_CLICK_COOLDOWN_MS) {
    message?.info?.($t("paymentModal.pleaseWait"));
    return;
  }
  lastPayClickAt.value = now;

  try {
    isProcessing.value = true;
    let paymentUrl = '';
    const backUrl = getBackUrl();

    try {
      const checkoutCurrency = getCurrencyByLocale(locale.value);
      const checkoutValue = Number(finalAmount.value);
      if (Number.isFinite(checkoutValue) && checkoutValue >= 0) {
        trackInitiateCheckout({ value: checkoutValue, currency: checkoutCurrency });
      }
    } catch {}

    // 根据类型调用不同的接口，传递优惠券ID
    if (paymentInfo.value.vipId > 0) {
      // Pro订阅
      const response = await createVipOrder({
        vip_id: paymentInfo.value.vipId,
        pay_method: method,
        back_url: backUrl,
        coupon_id: selectedCoupon.value?.coupon_id
      });
      
      // 检查是否是全额抵扣
      const data = response.data;
      if (data.provider === 'coupon_free' || data.coupon_free) {
        // 全额抵扣，直接跳转成功页
        const message = (window as any).$message;
        message.success($t('coupon.paymentSuccess'));
        hide();
        // 触发成功回调
        if (successCallback) {
          successCallback();
        }
        try {
          localStorage.setItem(PAYMENT_PENDING_ORDER_ID_KEY, data.order_id);
        } catch {}
        // 跳转到成功页面
        window.location.href = `/pay/success?order_id=${data.order_id}`;
        return;
      }
      
      paymentUrl = data.payment_url || data.pay_url;
      if (data.order_id) {
        try {
          localStorage.setItem(PAYMENT_PENDING_ORDER_ID_KEY, data.order_id);
        } catch {}
      }
      
    } else if (paymentInfo.value.tokenId > 0) {
      // 钻石购买
      const response = await createTokenOrder({
        token_id: paymentInfo.value.tokenId,
        pay_method: method,
        back_url: backUrl,
        coupon_id: selectedCoupon.value?.coupon_id
      });
      
      // 检查是否是全额抵扣
      const data = response.data;
      if (data.provider === 'coupon_free' || data.coupon_free) {
        // 全额抵扣，直接跳转成功页
        const message = (window as any).$message;
        message.success($t('coupon.paymentSuccess'));
        hide();
        // 触发成功回调
        if (successCallback) {
          successCallback();
        }
        try {
          localStorage.setItem(PAYMENT_PENDING_ORDER_ID_KEY, data.order_id);
        } catch {}
        // 跳转到成功页面
        window.location.href = `/pay/success?order_id=${data.order_id}`;
        return;
      }
      
      paymentUrl = data.payment_url || data.pay_url;
      if (data.order_id) {
        try {
          localStorage.setItem(PAYMENT_PENDING_ORDER_ID_KEY, data.order_id);
        } catch {}
      }
    }
    
    if (paymentUrl) {
      // 关闭弹窗
      hide();
      // 跳转到支付页面
      window.location.href = paymentUrl;
    } else {
      throw new Error("NO_PAYMENT_URL");
    }
    
  } catch (error) {
    const message = (window as any).$message;
    const backendMessage = (error as any)?.response?.data?.message;
    if (!backendMessage && message?.error) {
      const errorCode = String((error as any)?.code || "");
      const errorMessage = String((error as any)?.message || "");
      const normalizedMessage = errorMessage.toLowerCase();

      if (errorCode === "ECONNABORTED" || normalizedMessage.includes("timeout")) {
        message.error($t("paymentModal.timeout"));
      } else if (normalizedMessage.includes("network error")) {
        message.error($t("paymentModal.networkError"));
      } else if (errorMessage === "NO_PAYMENT_URL") {
        message.error($t("paymentModal.noPaymentUrl"));
      } else {
        message.error($t("paymentModal.paymentFailed"));
      }
    }
    console.error("Payment initiation failed:", error);
  } finally {
    isProcessing.value = false;
  }
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
    <n-modal :show="showModal" @update:show="handleClose" :mask-closable="true">
      <n-card
        class="payment-card max-w-380px bg-background text-primary"
        role="dialog"
        aria-modal="true"
        :closable="true"
        @close="handleClose"
        :bordered="false"
      >
        <div class="payment-content text-center px-6 py-4 text-primary">
          <div class="text-2xl mb-4 font-bold">{{ paymentInfo.title }}</div>
          
          <!-- 支付金额显示 -->
          <div class="text-3xl font-bold mb-6 text-purple-500">
            {{ currencySymbol }}{{ formatCurrency(finalAmount) }}
          </div>
          
          <!-- 优惠券选择器 -->
          <div v-if="paymentInfo.vipId > 0 || paymentInfo.tokenId > 0" class="mb-4">
            <CouponSelector
              :order-type="paymentInfo.vipId > 0 ? 'vip' : 'token'"
              :product-id="paymentInfo.vipId > 0 ? paymentInfo.vipId : paymentInfo.tokenId"
              :amount="paymentInfo.amount"
              @select="handleCouponSelect"
            />
          </div>
          
          <!-- 支付描述 -->
          <div v-if="paymentInfo.description" class="text-sm mb-6 text-secondary">
            {{ paymentInfo.description }}
          </div>
          
          <!-- 支付方式选择 -->
          <div v-if="shouldShowPaymentMethods" class="mb-6 w-full max-w-[320px] mx-auto text-left">
            <div class="text-sm mb-2 text-secondary">{{ $t('paymentModal.selectPaymentMethod') || 'Select Payment Method' }}</div>
            <div class="flex flex-wrap gap-3 justify-center">
              <div
                v-for="option in paymentMethods"
                :key="option.value"
                class="payment-method-item flex-[1_1_120px] max-w-[220px] px-3 py-2 rounded-3 border border-white/12 bg-white/5 transition-colors cursor-pointer"
                :class="selectedPaymentMethod === option.value ? 'border-purple-500/60 bg-purple-500/10' : ''"
                @click="!isProcessing && (selectedPaymentMethod = option.value)"
              >
                <div class="flex items-center gap-2">
                  <n-checkbox
                    :checked="selectedPaymentMethod === option.value"
                    :disabled="isProcessing"
                    @update:checked="(checked) => checked && (selectedPaymentMethod = option.value)"
                  />
                  <SvgIcon
                    :icon-class="option.iconClass"
                    :size="18"
                    class="text-primary"
                  />
                  <span class="leading-none text-sm font-medium">{{ option.label }}</span>
                </div>
              </div>
            </div>
          </div>

          <!-- 支付按钮 -->
          <BabeButton 
            class="w-full font-bold max-w-[240px] mx-auto"
            variant="primary"
            :loading="isProcessing"
            :disabled="!selectedPaymentMethod"
            @click="handlePayment"
          >
            {{ $t('paymentModal.payNow') || 'Pay Now' }}
          </BabeButton>
        </div>
      </n-card>
    </n-modal>
  </n-config-provider>
</template>

<style scoped>
.payment-card {
  color: white;
}

:deep(.payment-method-item .n-checkbox__label) {
  padding: 0;
}

@media (max-width: 440px) {
  .payment-card {
    width: calc(100% - 40px);
    margin: 0 auto;
  }
}
</style>
