<template>
  <div
    class="bg-background text-primary mx-auto mx-auto max-w-680px"
    :class="globalStore.isMobile ? 'page-padding ' : ''"
  >
    <div
      class="flex relative"
      :class="{
        'h-280px': globalStore.isMobile,
        'justify-between h-360px': !globalStore.isMobile,
      }"
    >
      <div
        class="text-center z-10"
        :class="{
          'flex flex-col justify-center': !globalStore.isMobile,
          '': globalStore.isMobile,
        }"
      >
        <div class="text-sm pt-thirdMargin text-primary text-left">
          <div class="mb-2 flex items-center">
            <n-icon size="18" class="mr-1">
              <CheckmarkCircleSharp />
            </n-icon>
            <span>{{ t('premium.premium.createAIGirlfriend') }}</span>
          </div>
          <div class="mb-2 flex items-center">
            <n-icon size="18" class="mr-1">
              <CheckmarkCircleSharp />
            </n-icon>
            <span>{{ t('premium.premium.unlimitedCommunication') }}</span>
          </div>
          <div class="mb-2 flex items-center">
            <n-icon size="18" class="mr-1">
              <CheckmarkCircleSharp />
            </n-icon>
            <span v-html="formatMonthlyDiamondsText(monthlyDiamondsPerMonth, monthlyDiamondsTotal)"></span>
          </div>
          <div class="mb-2 flex items-center">
            <n-icon size="18" class="mr-1">
              <CheckmarkCircleSharp />
            </n-icon>
            <span>{{ t('premium.premium.generateImagesAndVideos') }}</span>
          </div>
          <div class="mb-2 flex items-center">
            <n-icon size="18" class="mr-1">
              <CheckmarkCircleSharp />
            </n-icon>
            <span>{{ t('premium.premium.unlockPrivateThemes') }}</span>
          </div>
        </div>
      </div>
      <div
        :class="{
          'absolute right-0 top-0 ': !globalStore.isMobile,
          'absolute right-0 top-0': globalStore.isMobile,
        }"
      >
        <div :class="!globalStore.isMobile ? 'h-400px' : 'h-320px'">
          <img
            class="h-full w-full object-contain"
            :src="PremiumBg"
            alt="Girl"
          />
          <div
            class="absolute inset-0 bg-gradient-to-t from-background to-transparent opacity-100"
          ></div>
        </div>
      </div>
    </div>
    <div
      class="max-w-800px text-center mx-auto"
      :class="[
        { 'flex flex-col ': globalStore.isMobile },
        { 'grid grid-cols-3 gap-3 ': !globalStore.isMobile },
        globalStore.isMobile ? 'mb-thirdMargin' : 'mb-firstMargin',
      ]"
    >
      <!-- 价格卡片 -->
      <template v-if="loading && vipPrices.length === 0">
        <!-- 骨架屏 -->
        <PriceCard
          v-for="i in 3"
          :key="`skeleton-${i}`"
          :id="i"
          :month="i === 0 ? 1 : i === 1 ? 3 : 12"
          original-price="0"
          current-price="0"
          :is-selected="false"
          :is-loading="true"
        />
      </template>

      <!-- 加载中但有缓存数据 -->
      <template v-else-if="loading && vipPrices.length > 0">
        <PriceCard
          v-for="(plan, index) in vipPrices"
          :key="plan.id"
          :id="plan.id"
          :month="plan.month"
          :original-price="plan.original_price"
          :current-price="plan.current_price"
          :one-month-price="oneMonthCurrentPrice"
          :is-selected="selectedPlan === index"
          :is-loading="true"
          @select-plan="selectedPlan = index"
        />
      </template>

      <!-- 已加载完成 -->
      <template v-else>
        <PriceCard
          v-for="(plan, index) in vipPrices"
          :key="plan.id"
          :id="plan.id"
          :month="plan.month"
          :original-price="plan.original_price"
          :current-price="plan.current_price"
          :one-month-price="oneMonthCurrentPrice"
          :is-selected="selectedPlan === index"
          :is-loading="false"
          @select-plan="selectedPlan = index"
        />
      </template>
    </div>
    <div class="flex flex-col items-center px-6">
      <BabeButton 
        class="w-full font-bold max-w-[240px] mb-secondMargin"
        :loading="paymentLoading"
        :disabled="loading || vipPrices.length === 0"
        @click="handleVipPayment"
      >
        {{ t('premium.premium.pay') }} {{ currencySymbol }}{{ formatCurrency(selectedVipPrice.current_price) }}
      </BabeButton>
    </div>
    <div
      class="text-xs opacity-50"
      :class="globalStore.isMobile ? 'mb-thirdMargin' : 'mb-firstMargin'"
    >
      <div class="text-center mb-thirdMargin">
        <span class="tips mr-2"> {{ t('premium.premium.noHiddenFees') }}</span>
        <span class="tips"> {{ t('premium.premium.unsubscribe') }} </span>
      </div>
      <div class="tips text-center">
        {{ t('premium.premium.bankStatement') }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import PriceCard from './PriceCard.vue';
import { CheckmarkCircleSharp } from '@vicons/ionicons5';
import PremiumBg from '@/assets/p_images/pay.png';
import { useGlobalStore } from '@/stores/global/global';
import { usePremiumStore } from '@/stores/premiumStore';
import { useAuthStore } from '@/stores/auth';
import { showPaymentModal } from '@/utils/paymentModal';
import { useI18n } from 'vue-i18n';
import { useRoute } from 'vue-router';
import { useCurrency } from '@/composables/useCurrency';

const { t } = useI18n();
const { currencySymbol, formatCurrency } = useCurrency();
const route = useRoute();
const globalStore = useGlobalStore();
const premiumStore = usePremiumStore();
const authStore = useAuthStore();
const selectedPlan = ref(0);
const paymentLoading = ref(false);
const message = (window as any).$message;

const vipPrices = computed(() => premiumStore.vipPrices);
const loading = computed(() => premiumStore.loading);

const oneMonthCurrentPrice = computed(() => {
  return vipPrices.value.find((plan) => plan.month === 1)?.current_price ?? '';
});

// 每月赠送的钻石数量（基础值）
const DIAMONDS_PER_MONTH = 100;

// 计算每月钻石数量（固定值）
const monthlyDiamondsPerMonth = computed(() => DIAMONDS_PER_MONTH);

// 计算选中套餐的总钻石数量
const monthlyDiamondsTotal = computed(() => {
  const plan = vipPrices.value[selectedPlan.value];
  if (!plan) return DIAMONDS_PER_MONTH;
  return plan.month * DIAMONDS_PER_MONTH;
});

// 格式化钻石数量文本，高亮显示数字
const formatMonthlyDiamondsText = (amount: number, total: number) => {
  const text = t('premium.premium.monthlyDiamonds', { amount, total });
  // 使用占位符替换，避免数字相同时的冲突问题
  const amountPlaceholder = `__AMOUNT_${Date.now()}__`;
  const totalPlaceholder = `__TOTAL_${Date.now()}__`;
  
  return text
    .replace(String(amount), amountPlaceholder)
    .replace(String(total), totalPlaceholder)
    .replace(amountPlaceholder, `<span class="diamond-number">${amount}</span>`)
    .replace(totalPlaceholder, `<span class="diamond-number">${total}</span>`);
};

// 计算最大折扣（从全局 store 获取）
const maxDiscount = computed(() => {
  return t("menu.discountPercentOff", { percent: premiumStore.maxDiscountPercent });
});

// 计算选中的Pro套餐
const selectedVipPrice = computed(() => {
  if (vipPrices.value.length === 0) return { current_price: "0.00" };
  return vipPrices.value[selectedPlan.value] || { current_price: "0.00" };
});

// 处理Pro支付
const handleVipPayment = () => {
  if (vipPrices.value.length === 0) {
    message.warning(t('premium.premium.waitForPackage'));
    return;
  }

  const selectedVipPlan = vipPrices.value[selectedPlan.value];
  if (!selectedVipPlan) {
    message.warning(t('premium.premium.selectPackage'));
    return;
  }

  // 获取返回路径参数，如果存在则传递给支付弹窗
  const returnTo = route.query.returnTo as string;

  // 显示支付弹窗，传递Pro套餐ID和返回路径
  showPaymentModal(
    selectedVipPlan.current_price,
    t('premium.premium.membershipPayment'),
    `${t('premium.premium.subscribe')} ${selectedVipPlan.month} ${t(
      'premium.premium.vipMembership'
    )}`,
    selectedVipPlan.id,
    0, // tokenId
    0, // tokensCount
    returnTo // 返回路径
  );
};

onMounted(() => {
  premiumStore.loadVipPrices();
});
</script>

<style scoped>
/* 使用 UnoCSS 原子类进行样式定义 */
.n-button {
  @apply rounded-lg;
}

.n-button.primary {
  @apply bg-purple-500 hover:bg-purple-600;
}

.n-button.default {
  @apply bg-gray-700 hover:bg-gray-600;
}

.price-card {
  @apply bg-gray-800 p-4 rounded-lg shadow-md;
}

.discount-badge {
  @apply bg-yellow-500 text-black px-2 py-1 rounded-full;
}

.tips::before {
  content: "•";
  color: #a5d63f;
  margin-right: 2px;
}

/* 钻石数字高亮样式 - 使用 :deep 穿透 scoped 作用域 */
:deep(.diamond-number) {
  font-weight: 800 !important;
  font-size: 1.05em;
  color: #a855f7;
  background: linear-gradient(135deg, #a855f7 0%, #ec4899 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  display: inline-block;
  padding: 0 2px;
}

.dark :deep(.diamond-number) {
  background: linear-gradient(135deg, #c084fc 0%, #f472b6 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}
</style>
