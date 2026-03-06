<script setup lang="ts">
import { computed, h, ref, watchEffect } from "vue";
import { useI18n } from "vue-i18n";
import { useThemeStore } from "@/stores/themeStore";
import { darkTheme } from "naive-ui";
import BabeButton from "@/components/BabeButton/index.vue";
import { NSelect } from "naive-ui";
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

const shouldShowPaymentMethodSelect = computed(() => {
  return locale.value === "hi-IN" || locale.value.toLowerCase().startsWith("pt") || paymentMethods.value.length > 1;
});

const renderPaymentLabel = (option: PaymentMethodOption) => {
  return h(
    "div",
    { class: "flex items-center gap-2" },
    [
      h(SvgIcon, {
        iconClass: option.iconClass,
        size: 18,
        className: "text-primary",
      }),
      h("span", { class: "leading-none" }, option.label),
    ]
  );
};

const selectedPaymentMethod = ref<PaymentMethodOption["value"] | null>(null);
const isProcessing = ref(false);

watchEffect(() => {
  const options = paymentMethods.value;
  if (!options.length) {
    selectedPaymentMethod.value = null;
    return;
  }

  const currentValue = selectedPaymentMethod.value;
  const exists = currentValue && options.some((item) => item.value === currentValue);
  if (!exists) selectedPaymentMethod.value = options[0].value;
});

// 处理优惠券选择
const handleCouponSelect = (coupon: ApplicableCoupon | null) => {
  selectedCoupon.value = coupon;
};

// 处理支付
const handlePayment = async () => {
  const method = selectedPaymentMethod.value;
  if (!method) return;

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
      throw new Error('No payment URL received');
    }
    
  } catch (error) {
    console.error('Payment initiation failed:', error);
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
          <div v-if="shouldShowPaymentMethodSelect" class="mb-6 w-full max-w-[240px] mx-auto text-left">
            <div class="text-sm mb-2 text-secondary">{{ $t('paymentModal.selectPaymentMethod') || 'Select Payment Method' }}</div>
            <n-select
              v-model:value="selectedPaymentMethod"
              :options="paymentMethods"
              :render-label="renderPaymentLabel"
              size="large"
              class="payment-select"
            />
          </div>

          <!-- 支付按钮 -->
          <BabeButton 
            class="w-full font-bold max-w-[240px] mx-auto"
            variant="primary"
            :loading="isProcessing"
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

:deep(.n-base-selection) {
  --n-border-radius: 12px !important;
}

:deep(.n-base-selection-label) {
  background-color: rgba(255, 255, 255, 0.05) !important;
}

@media (max-width: 440px) {
  .payment-card {
    width: calc(100% - 40px);
    margin: 0 auto;
  }
}
</style>
