<template>
  <div class="bg-background text-primary mx-auto mx-auto max-w-680px pt-10"
    :class="globalStore.isMobile ? 'page-padding ' : 'py-pageYPadding'">
    <div class="bg-background rounded-lg">
      <!-- Diamond Cards Grid -->
      <div class="mb-firstMargin">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="grid gap-5" :class="{
          'grid-cols-3': !globalStore.isMobile,
          'grid-cols-2': globalStore.isMobile,
        }">
          <div v-for="i in 6" :key="i" class="relative text-primary rounded-xl large-card transition-all duration-200"
            :class="{
              'py-8': !globalStore.isMobile,
            }" style="background-color: var(--bg-background); box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);">
            <!-- Diamond Icon Skeleton -->
            <div class="flex justify-center mb-3">
              <div class="skeleton-circle" :style="{
                width: globalStore.isMobile ? '42px' : '54px',
                height: globalStore.isMobile ? '42px' : '54px'
              }"></div>
            </div>

            <!-- Token Amount Skeleton -->
            <div class="text-center font-bold mb-1">
              <div class="skeleton-text" style="width: 120px; margin: 0 auto; height: 16px;"></div>
            </div>

            <!-- Price Skeleton -->
            <div class="text-center text-primary text-xs opacity-50 flex items-center justify-center">
              <div class="skeleton-text" style="width: 80px; height: 14px;"></div>
            </div>
          </div>
        </div>

        <!-- 数据展示 -->
        <div v-else class="grid gap-5" :class="{
          'grid-cols-3': !globalStore.isMobile,
          'grid-cols-2': globalStore.isMobile,
        }">
          <div v-for="(plan, index) in diamondPlans" :key="plan.id"
            class="relative  text-primary rounded-xl large-card cursor-pointer transition-all duration-200 hover:translate-y-[-2px]"
            :class="{
              'shadow-activeBorder bg-[#F2EBFF] dark:bg-[#19172B]': selectedPlan?.id === plan.id,
              'shadow-border bg-background': selectedPlan?.id !== plan.id,
              'py-8': !globalStore.isMobile,
            }" @click="
              selectedPlan = tokenPlans.find((p) => p.id === plan.id) || null
              ">
            <div v-if="plan.discount > 0"
              class="absolute -top-3 left-1/2 -translate-x-1/2 bg-yellow-400 text-black text-xs font-bold small-card rounded-full">
              <span class="whitespace-nowrap">
                +{{ plan.discount }} %</span>
              <!-- {{ plan.formattedDiscount }} -->
            </div>

            <!-- Diamond Icon -->
            <div class="flex justify-center">
              <n-image :src="plan.image" alt="diamond icon" class="object-contain" preview-disabled
                :width="globalStore.isMobile ? 42 : 54" :height="globalStore.isMobile ? 42 : 54"></n-image>
            </div>
            <div class="text-center mb-1 text-gray-500 text-sm" v-if="plan.original_number !== plan.current_number">
              <span class="line-through mr-1">
                {{ formatNumber(plan.original_number) }}
              </span>
              <span>
                {{ t('premium.purchaseDiamonds.diamonds') }}
              </span>
            </div>
            <!-- Token Amount -->
            <div class="text-center font-bold mb-1">
              {{ formatNumber(plan.current_number) }} {{ t('premium.purchaseDiamonds.diamonds') }}
            </div>

            <!-- Original Amount (if different) -->
            <!-- <div
              class="text-center text-xs text-gray-500 line-through mb-1"
            >
              {{ plan.original_number.toLocaleString() }}钻石
            </div> -->
            <!-- Price -->
            <div class="text-center text-primary text-xs opacity-50 flex items-center justify-center  ">
              <!-- <div class="text-center text-xs text-gray-500 line-through mr-1">
                {{ currencySymbol }}{{ formatCurrency(plan.original_price) || '0' }}
              </div> -->
              <div>
                {{ currencySymbol }}{{ formatCurrency(plan.current_price) || '0' }}
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Button -->
      <div class="text-center">
        <BabeButton block style="max-width: 240px" :disabled="isLoading || !selectedPlan" :loading="isPaying"
          @click="handlePayment">
          {{
            isLoading
              ? t('premium.purchaseDiamonds.loading')
              : selectedPlan
                ? `${t('premium.purchaseDiamonds.pay')} ${currencySymbol}${formatCurrency(selectedPlan.current_price) || '0'}`
                : t('premium.purchaseDiamonds.selectPackage')
          }}
        </BabeButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useGlobalStore } from '@/stores/global/global';
import {
  getTokenPrice,
  formatTokenIncrease,
  testAddTokens
} from '@/api/premium/index';
import type { TokenPriceItem } from '@/api/premium/types';
import { useAuthStore } from '@/stores/auth';
import { showPaymentModal } from '@/utils/paymentModal';
import { useI18n } from 'vue-i18n';
import { useCurrency } from '@/composables/useCurrency';
const { t } = useI18n();
const { currencySymbol, formatCurrency, formatNumber } = useCurrency();
const globalStore = useGlobalStore();
const authStore = useAuthStore();
const message = (window as any).$message;

// 钻石图片资源
import diamond1 from "@/assets/images/diamond-1.png";
import diamond2 from "@/assets/images/diamond-2.png";
import diamond3 from "@/assets/images/diamond-3.png";
import diamond4 from "@/assets/images/diamond-4.png";
import diamond5 from "@/assets/images/diamond-5.png";
import diamond6 from "@/assets/images/diamond-6.png";

// 钻石图片映射
const diamondImages = [
  diamond1,
  diamond2,
  diamond3,
  diamond4,
  diamond5,
  diamond6,
];

// 响应式数据
const tokenPlans = ref<TokenPriceItem[]>([]);
const selectedPlan = ref<TokenPriceItem | null>(null);
const isLoading = ref(true);
const isPaying = ref(false);

// 计算属性：为每个计划添加图片和格式化的折扣信息
const diamondPlans = computed(() => {
  return tokenPlans.value.map((plan, index) => ({
    ...plan,
    image: diamondImages[index % diamondImages.length],
    formattedDiscount: formatTokenIncrease(
      plan.original_number,
      plan.current_number
    ),
    discountPercent: Math.round(
      ((plan.current_number - plan.original_number) / plan.original_number) *
      100
    ),
  }));
});

// 获取token价格数据
const fetchTokenPlans = async () => {
  try {
    isLoading.value = true;
    const response = await getTokenPrice();
    // 确保价格字段是字符串类型
    tokenPlans.value = (response.data || []).map(plan => ({
      ...plan,
      original_price: String(plan.original_price || '0'),
      current_price: String(plan.current_price || '0')
    }));
    // 设置默认选中第一个计划
    if (tokenPlans.value.length > 0) {
      selectedPlan.value = tokenPlans.value[0];
    }
  } catch (error) {
    console.error(t('premium.purchaseDiamonds.failedToLoadPrice'), error);
  } finally {
    isLoading.value = false;
  }
};

// 处理支付
const handlePayment = async () => {
  if (!selectedPlan.value) {
    message.warning(t('premium.purchaseDiamonds.pleaseSelectPackage'));
    return;
  }

  try {
    isPaying.value = true;
    // 显示支付弹窗，传递钻石套餐ID和钻石数量
    showPaymentModal(
      selectedPlan.value.current_price || '0',
      t('premium.purchaseDiamonds.diamondPayment'),
      `${t('premium.purchaseDiamonds.purchase')} ${formatNumber(selectedPlan.value.current_number)} ${t(
        'premium.purchaseDiamonds.diamonds'
      )}`,
      0, // vipId设为0表示不是Pro订阅
      selectedPlan.value.id, // 传递钻石套餐ID
      selectedPlan.value.current_number // 传递钻石数量作为备选信息
    );
  } finally {
    isPaying.value = false;
  }
};

// 组件挂载时获取数据
onMounted(() => {
  fetchTokenPlans();
});
</script>

<style scoped lang="scss">
/* 骨架屏样式 */
.skeleton-circle,
.skeleton-text {
  background: linear-gradient(90deg,
      rgba(125, 125, 125, 0.06) 25%,
      rgba(125, 125, 125, 0.12) 50%,
      rgba(125, 125, 125, 0.06) 75%);
  background-size: 200% 100%;
  animation: skeleton-loading 1.5s infinite;
}

.skeleton-circle {
  border-radius: 50%;
}

.skeleton-text {
  border-radius: 4px;
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

/* 暗色模式适配 */
:global([data-theme="dark"]) .skeleton-circle,
:global([data-theme="dark"]) .skeleton-text {
  background: linear-gradient(90deg,
      rgba(125, 125, 125, 0.08) 25%,
      rgba(125, 125, 125, 0.15) 50%,
      rgba(125, 125, 125, 0.08) 75%);
  background-size: 200% 100%;
}
</style>
