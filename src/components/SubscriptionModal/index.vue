<script setup lang="ts">
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import { useThemeStore } from "@/stores/themeStore";
import { useGlobalStore } from "@/stores/global/global";
import { darkTheme, NModal, NConfigProvider } from "naive-ui";
import BabeButton from "@/components/BabeButton/index.vue";
import { useI18n } from "vue-i18n";
import { formatVipDiscountPercentByOneMonthStandard, getVipPrice } from "@/api/premium";
import type { VipPriceItem } from "@/api/premium/types";
import { showPaymentModal } from "@/utils/paymentModal";
import { useCurrency } from "@/composables/useCurrency";

// Define the types for our props
type SubscriptionMode = "redirect" | "inline";

interface Props {
  mode?: SubscriptionMode;
}

const props = withDefaults(defineProps<Props>(), {
  mode: "redirect",
});

const { t } = useI18n();
const { currencySymbol, formatCurrency } = useCurrency();
const themeStore = useThemeStore();
const globalStore = useGlobalStore();
const router = useRouter();

// 控制模态框显示
const showModal = ref(false);
const loading = ref(false);
const vipPrices = ref<VipPriceItem[]>([]);
const selectedPlan = ref(0);

const oneMonthCurrentPrice = computed(() => {
  return vipPrices.value.find((plan) => plan.month === 1)?.current_price ?? "";
});

// 每月赠送的钻石数量（基础值）
const DIAMONDS_PER_MONTH = 100;

// 计算每月钻石数量（固定值）
const monthlyDiamondsPerMonth = computed(() => {
  return DIAMONDS_PER_MONTH;
});

// 计算选中套餐的总钻石数量
const monthlyDiamondsTotal = computed(() => {
  if (vipPrices.value.length === 0) return DIAMONDS_PER_MONTH;
  const plan = vipPrices.value[selectedPlan.value];
  if (!plan) return DIAMONDS_PER_MONTH;
  return plan.month * DIAMONDS_PER_MONTH;
});

// 格式化钻石数量文本，高亮显示数字
const formatMonthlyDiamondsText = (amount: number, total: number) => {
  const text = t("subscriptionModal.monthlyDiamonds", { amount, total });
  // 使用占位符替换，避免数字相同时的冲突问题
  const amountPlaceholder = `__AMOUNT_${Date.now()}__`;
  const totalPlaceholder = `__TOTAL_${Date.now()}__`;
  
  return text
    .replace(String(amount), amountPlaceholder)
    .replace(String(total), totalPlaceholder)
    .replace(amountPlaceholder, `<span class="diamond-number">${amount}</span>`)
    .replace(totalPlaceholder, `<span class="diamond-number">${total}</span>`);
};

// 暴露方法给父组件
const show = () => {
  showModal.value = true;
  if (props.mode === "inline") {
    loadVipPrices();
  }
};

const hide = () => {
  showModal.value = false;
};

// 处理关闭
const handleClose = () => {
  hide();
};

// 加载Pro价格数据
const loadVipPrices = async () => {
  loading.value = true;
  try {
    const { data } = await getVipPrice();
    vipPrices.value = data || [];
    // 按月份排序（1个月、3个月、12个月）
    vipPrices.value.sort((a, b) => {
      const order = [1, 3, 12];
      return order.indexOf(a.month) - order.indexOf(b.month);
    });
    if (vipPrices.value.length > 0) {
      selectedPlan.value = 0;
    }
  } catch (error) {
    console.error(t("premium.premium.failedToLoadPrice"), error);
  } finally {
    loading.value = false;
  }
};

// 获取当前选中的VIP价格（仅在inline模式下使用）
const selectedVipPrice = computed(() => {
  if (props.mode === "redirect" || vipPrices.value.length === 0) {
    return { current_price: "0.00" };
  }
  return vipPrices.value[selectedPlan.value] || { current_price: "0.00" };
});

// 计算折扣百分比
const getDiscountPercent = (plan: VipPriceItem) => {
  return formatVipDiscountPercentByOneMonthStandard(
    oneMonthCurrentPrice.value,
    plan.current_price,
    plan.month
  );
};

// 处理升级按钮点击 - 根据模式决定行为
const handleUpgrade = async () => {
  if (props.mode === "redirect") {
    // 重定向模式：跳转到Pro页面，并记录当前路由用于返回
    hide();

    // 获取当前路由路径和查询参数，安全地检查 currentRoute 是否存在
    let currentPath = "/";
    try {
      currentPath =
        router.currentRoute.value?.fullPath ||
        window.location.pathname + window.location.search;
    } catch (error) {
      // 如果 router.currentRoute 不可用，使用 window.location 作为备选
      currentPath = window.location.pathname + window.location.search;
    }

    // 跳转到Pro页面，将当前路由作为返回参数
    try {
      if (router && router.push) {
        router.push({
          path: "/premium/pro",
          query: {
            returnTo: currentPath,
          },
        });
      } else {
        // 如果 router.push 不可用，使用 window.location 进行跳转
        const queryString = currentPath.includes("?")
          ? `?returnTo=${encodeURIComponent(currentPath)}`
          : `?returnTo=${encodeURIComponent(currentPath)}`;
        window.location.href = "/premium/pro" + queryString;
      }
    } catch (error) {
      console.error("路由跳转失败，使用 window.location 跳转:", error);
      // 最后的备选方案
      window.location.href =
        "/premium/pro?returnTo=" + encodeURIComponent(currentPath);
    }
  } else {
    // 内联模式：显示支付选项
    if (vipPrices.value.length === 0) {
      const message = (window as any).$message;
      message.warning(t("premium.premium.waitForPackage"));
      return;
    }

    const selectedVipPlan = vipPrices.value[selectedPlan.value];
    if (!selectedVipPlan) {
      const message = (window as any).$message;
      message.warning(t("premium.premium.selectPackage"));
      return;
    }

    // 显示支付弹窗，传递Pro套餐ID和当前路由用于返回
    let currentPath = "/";
    try {
      currentPath =
        router.currentRoute.value?.fullPath ||
        window.location.pathname + window.location.search;
    } catch (error) {
      // 如果 router.currentRoute 不可用，使用 window.location 作为备选
      currentPath = window.location.pathname + window.location.search;
    }

    showPaymentModal(
      selectedVipPlan.current_price,
      t("premium.premium.membershipPayment"),
      `${t("premium.premium.subscribe")} ${selectedVipPlan.month} ${t(
        "premium.premium.vipMembership"
      )}`,
      selectedVipPlan.id,
      0, // tokenId
      0, // tokensCount
      currentPath, // 返回路径
      () => {
        // 支付成功后关闭订阅弹窗
        hide();
      }
    );
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
    <n-modal
      :show="showModal"
      preset="card"
      :style="{ width: '90%', maxWidth: '400px', maxHeight: '550px' }"
      :bordered="false"
      :mask-closable="true"
      @update:show="handleClose"
      class="subscription-modal"
    >
      <template #header>
        <div class="text-center text-lg font-semibold text-primary">
          {{ t("subscriptionModal.title") }}
        </div>
      </template>
      <div class="overflow-auto max-h-[480px]">
        <div class="bg-secondBackground rounded-lg card mb-6">
          <div class="text-base font-semibold text-primary mb-2">
            {{ t("subscriptionModal.proBenefits") }}
          </div>
          <div class="space-y-2 text-xs">
            <div class="flex items-center space-x-2">
              <svg
                class="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span class="text-sm text-secondary">{{
                t("subscriptionModal.createAI")
              }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <svg
                class="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span class="text-sm text-secondary">{{
                t("subscriptionModal.unlimitedChat")
              }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <svg
                class="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span class="text-sm text-secondary" v-html="formatMonthlyDiamondsText(monthlyDiamondsPerMonth, monthlyDiamondsTotal)"></span>
            </div>
            <div class="flex items-center space-x-2">
              <svg
                class="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span class="text-sm text-secondary">{{
                t("subscriptionModal.generateImagesAndVideos")
              }}</span>
            </div>
            <div class="flex items-center space-x-2">
              <svg
                class="w-4 h-4 text-green-500"
                fill="currentColor"
                viewBox="0 0 20 20"
              >
                <path
                  fill-rule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clip-rule="evenodd"
                ></path>
              </svg>
              <span class="text-sm text-secondary">{{
                t("subscriptionModal.unlockPrivateThemes")
              }}</span>
            </div>
          </div>
        </div>
        <!-- 显示套餐选择（仅在inline模式下） -->
        <div
          v-if="mode === 'inline'"
          class="max-w-800px text-center mx-auto mb-secondMargin"
        >
          <!-- 骨架屏 -->
          <template v-if="loading && vipPrices.length === 0">
            <div class="flex flex-col gap-3">
              <div
                v-for="i in 3"
                :key="`skeleton-${i}`"
                class="transition-all relative rounded-lg w-full"
              >
                <n-skeleton class="rounded-lg" size="medium" height="48px" />
              </div>
            </div>
          </template>

          <!-- 加载中但有缓存数据 -->
          <template v-else-if="loading && vipPrices.length > 0">
            <div class="flex flex-col gap-3">
              <div
                v-for="i in 3"
                :key="`skeleton-${i}`"
                class="transition-all relative rounded-lg w-full"
              >
                <n-skeleton class="rounded-lg" size="medium" height="48px" />
              </div>
            </div>
          </template>

          <!-- 已加载完成 -->
          <template v-else-if="vipPrices.length > 0">
            <div class="flex flex-col gap-3 px-1">
              <div
                v-for="(plan, index) in vipPrices"
                :key="plan.id"
                class="transition-all cursor-pointer relative rounded-xl hover:translate-y-[-2px] w-full"
                :class="[
                  selectedPlan === index
                    ? 'shadow-activeBorder bg-[#F2EBFF] dark:bg-[#19172B]'
                    : 'shadow-border bg-background',
                ]"
                @click="selectedPlan = index"
              >
                <div
                  class="flex items-center w-full card px-4 py-3 min-h-48px relative box-border"
                >
                  <div
                    v-if="getDiscountPercent(plan)"
                    class="text-xs leading-2.5 text-black bg-#FFEB3B rounded-full inline-block px-2 py-1 absolute -top-2 right-3"
                  >
                    <span class="discount-badge">{{
                      getDiscountPercent(plan)
                    }}</span>
                  </div>
                  <div class="flex items-center justify-between w-full gap-4">
                    <div class="text-[18px] leading-none font-bold min-w-0">
                      <span
                        >{{ plan.month }}
                        {{ t("premium.priceCard.months") }}</span
                      >
                    </div>
                    <div class="flex items-baseline gap-1 leading-none flex-shrink-0">
                      <span class="text-sm font-semibold"
                        >{{ currencySymbol }}{{ formatCurrency((parseFloat(plan.current_price) / plan.month).toFixed(2)) }}</span
                      >
                      <span class="text-sm opacity-70">/</span>
                      <div class="text-sm opacity-70">
                        {{ t("premium.priceCard.perMo") }}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </template>

          <!-- 无套餐可用 -->
          <div v-else class="text-center py-4 text-secondary">
            {{ t("premium.premium.noPackagesAvailable") }}
          </div>
        </div>

        <div class="flex flex-col items-center px-4">
          <div class="flex space-x-3 w-full max-w-[240px] mb-secondMargin">
            <!-- <BabeButton
              variant="default"
              size="medium"
              class="flex-1"
              @click="handleClose"
            >
              {{ t("subscriptionModal.later") }}
            </BabeButton> -->
            <BabeButton
              variant="primary"
              size="medium"
              class="flex-1"
              :loading="mode === 'inline' && loading"
              :disabled="
                mode === 'inline' && (loading || vipPrices.length === 0)
              "
              @click="handleUpgrade"
            >
              {{
                mode === "inline"
                  ? loading || vipPrices.length === 0
                    ? t("premium.premium.loading")
                    : `${t("premium.premium.pay")} ${currencySymbol}${
                        formatCurrency(selectedVipPrice.current_price)
                      }`
                  : t("subscriptionModal.upgradeNow")
              }}
            </BabeButton>
          </div>
        </div>
        <div class="text-xs opacity-60 mb-thirdMargin">
          <div class="text-center mb-2">
            <span class="tips mr-2">
              {{ t("premium.premium.noHiddenFees") }}</span
            >
            <span class="tips"> {{ t("premium.premium.unsubscribe") }} </span>
          </div>
          <div class="tips text-center">
            {{ t("premium.premium.bankStatement") }}
          </div>
        </div>
      </div>
    </n-modal>
  </n-config-provider>
</template>

<style scoped>
.subscription-modal :deep(.n-card) {
  border-radius: 25px;
}

.subscription-modal :deep(.n-card-header) {
  padding: 20px 0;
}

.subscription-modal :deep(.n-card__content) {
  padding: 20px;
}

.tips::before {
  content: "•";
  color: #a5d63f;
  margin-right: 2px;
}

/* 移动端套餐卡片样式 */
.shadow-activeBorder {
  box-shadow: 0 0 0 2px #8b5cf6;
  transform: scale(1.02);
}

.shadow-border {
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.2s ease;
}

.shadow-border:hover {
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
  transform: translateY(-2px);
}

.discount-badge {
  @apply bg-yellow-500 text-black px-2 py-1 rounded-full text-xs;
  font-weight: 600;
  white-space: nowrap;
}

/* 横向布局套餐卡片样式 */
.plan-card {
  min-height: 120px;
}

.plan-card.selected {
  border: 2px solid #8b5cf6;
  background: linear-gradient(135deg, #f2ebff 0%, #e8e0ff 100%);
}

.dark .plan-card.selected {
  background: linear-gradient(135deg, #19172b 0%, #2d2a4e 100%);
}

/* 响应式调整 */
@media (max-width: 640px) {
  .plan-card {
    min-height: 100px;
  }
}

/* 钻石数字高亮样式 - 使用 :deep 穿透 scoped 作用域 */
:deep(.diamond-number) {
  font-weight: 800 !important;
  font-size: 1.05em;
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

/* 骨架屏样式适配 */
:deep(.n-skeleton) {
  --n-color-start: rgba(125, 125, 125, 0.06);
  --n-color-end: rgba(125, 125, 125, 0.12);
  background-color: transparent;
}

:deep(.n-skeleton.n-skeleton--text) {
  height: 16px;
  margin-top: 8px;
}
</style>
