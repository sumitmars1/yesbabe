<script setup lang="ts">
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { NCollapse, NCollapseItem, NSpin } from "naive-ui";
import { useCouponStore } from "@/stores/coupon";
import { useCurrency } from "@/composables/useCurrency";
import CouponCard from "@/components/CouponCard/index.vue";
import type { ApplicableCoupon, OrderType } from "@/api/coupon/types";

const { t } = useI18n();
const { currencySymbol, formatCurrency } = useCurrency();
const couponStore = useCouponStore();

interface Props {
  orderType: OrderType;
  productId: number;
  amount: string;
}

const props = defineProps<Props>();

const emit = defineEmits<{
  (e: "select", coupon: ApplicableCoupon | null): void;
  (e: "update:discount", discount: string): void;
  (e: "update:finalAmount", finalAmount: string): void;
}>();

// 选中的优惠券
const selectedCoupon = ref<ApplicableCoupon | null>(null);

// 是否展开优惠券列表
const expanded = ref(false);

// 加载可用优惠券
const loadApplicableCoupons = async () => {
  if (props.productId > 0) {
    await couponStore.fetchApplicableCoupons(props.orderType, props.productId);
  }
};

// 可用优惠券列表
const applicableCoupons = computed(() => couponStore.applicableCoupons);

// 折扣金额
const discountAmount = computed(() => {
  if (selectedCoupon.value) {
    return selectedCoupon.value.discount_preview;
  }
  return "0";
});

// 最终金额
const finalAmount = computed(() => {
  if (selectedCoupon.value) {
    return selectedCoupon.value.final_amount_preview;
  }
  return props.amount;
});

// 监听选择变化
watch(selectedCoupon, (newVal) => {
  emit("select", newVal);
  emit("update:discount", discountAmount.value);
  emit("update:finalAmount", finalAmount.value);
});

// 处理优惠券选择
const handleSelectCoupon = (coupon: ApplicableCoupon) => {
  if (selectedCoupon.value?.coupon_id === coupon.coupon_id) {
    // 取消选择
    selectedCoupon.value = null;
  } else {
    selectedCoupon.value = coupon;
  }
};

// 选择不使用优惠券
const handleNoCoupon = () => {
  selectedCoupon.value = null;
};

// 判断是否全选最优优惠券
const selectBestCoupon = () => {
  const bestCoupon = couponStore.getBestCoupon();
  if (bestCoupon) {
    selectedCoupon.value = bestCoupon;
  }
};

// 加载优惠券
watch(
  () => [props.orderType, props.productId],
  () => {
    if (props.productId > 0) {
      loadApplicableCoupons();
    }
  },
  { immediate: true }
);

// 暴露方法
defineExpose({
  loadApplicableCoupons,
  selectBestCoupon,
  selectedCoupon,
  discountAmount,
  finalAmount,
});
</script>

<template>
  <div class="coupon-selector">
    <!-- 优惠券选择头部 -->
    <div class="coupon-selector__header" @click="expanded = !expanded">
      <div class="coupon-selector__label">
        {{ t("coupon.selectCoupon") }}
        <span v-if="applicableCoupons.length > 0" class="coupon-selector__count">
          ({{ applicableCoupons.length }})
        </span>
      </div>
      <div class="coupon-selector__value">
        <span v-if="selectedCoupon" class="coupon-selector__saving">
          {{ t("coupon.save") }} {{ currencySymbol }}{{ formatCurrency(selectedCoupon.discount_preview) }}
        </span>
        <span v-else class="coupon-selector__no-coupon">
          {{ t("coupon.noCoupon") }}
        </span>
        <span class="coupon-selector__arrow" :class="{ 'coupon-selector__arrow--expanded': expanded }">
          ▼
        </span>
      </div>
    </div>

    <!-- 优惠券列表 -->
    <NCollapse :expanded-names="expanded ? ['coupons'] : []">
      <NCollapseItem name="coupons" title="" :display-arrow="false">
        <div class="coupon-selector__content">
          <div v-if="couponStore.loading" class="coupon-selector__loading">
            <NSpin size="medium" />
          </div>

          <div v-else-if="applicableCoupons.length === 0" class="coupon-selector__empty">
            {{ t("coupon.noCoupons") }}
          </div>

          <div v-else class="coupon-selector__list">
            <!-- 不使用优惠券选项 -->
            <div
              class="coupon-selector__option"
              :class="{ 'coupon-selector__option--selected': !selectedCoupon }"
              @click="handleNoCoupon"
            >
              <div class="coupon-selector__radio" :class="{ 'coupon-selector__radio--checked': !selectedCoupon }">
                <span v-if="!selectedCoupon">✓</span>
              </div>
              <div class="coupon-selector__option-text">
                {{ t("coupon.noCoupon") }}
              </div>
            </div>

            <!-- 优惠券卡片 -->
            <CouponCard
              v-for="coupon in applicableCoupons"
              :key="coupon.coupon_id"
              type="applicable"
              :data="coupon"
              :selected="selectedCoupon?.coupon_id === coupon.coupon_id"
              @select="handleSelectCoupon"
            />
          </div>
        </div>
      </NCollapseItem>
    </NCollapse>
  </div>
</template>

<style scoped lang="scss">
.coupon-selector {
  margin-bottom: 16px;

  // 隐藏 Naive UI 默认箭头
  :deep(.n-collapse-item-arrow) {
    display: none !important;
  }

  &__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 12px 16px;
    background: var(--second-background, #f5f5f5);
    border: 1px solid var(--btn-border, #e2e1e8);
    border-radius: 8px;
    cursor: pointer;
  }

  &__label {
    font-size: 14px;
    font-weight: 500;
    color: var(--c-text-primary, #333);
  }

  &__count {
    color: var(--c-text-secondary, #666);
    font-weight: normal;
  }

  &__value {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  &__saving {
    font-size: 14px;
    font-weight: 600;
    color: #16a34a;
  }

  &__no-coupon {
    font-size: 14px;
    color: var(--c-text-secondary, #666);
  }

  &__arrow {
    font-size: 10px;
    color: var(--c-text-secondary, #666);
    transition: transform 0.2s ease;

    &--expanded {
      transform: rotate(180deg);
    }
  }

  &__content {
    padding: 12px 0;
  }

  &__loading,
  &__empty {
    display: flex;
    justify-content: center;
    align-items: center;
    min-height: 80px;
    color: var(--c-text-secondary, #666);
    font-size: 14px;
  }

  &__list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  &__option {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: var(--c-background, #fff);
    border: 1px solid var(--btn-border, #e2e1e8);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.2s ease;

    &:hover {
      background: var(--second-background, #f5f5f5);
    }

    &--selected {
      border: 2px solid #7c3aed;
    }
  }

  &__radio {
    width: 20px;
    height: 20px;
    border-radius: 50%;
    border: 2px solid #d1d5db;
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: 12px;
    color: #fff;
    flex-shrink: 0;
    transition: all 0.2s ease;

    &--checked {
      background: #7c3aed;
      border-color: #7c3aed;
    }
  }

  &__option-text {
    font-size: 14px;
    color: var(--c-text-primary, #333);
  }
}

// 暗黑模式适配
:deep([data-theme="dark"]) {
  .coupon-selector {
    &__header {
      background: var(--second-background, #2a292f);
      border-color: var(--btn-border, #424143);
    }

    &__label {
      color: var(--c-text-primary, #fff);
    }

    &__count,
    &__no-coupon,
    &__arrow {
      color: var(--c-text-secondary, #a8abb2);
    }

    &__loading,
    &__empty {
      color: var(--c-text-secondary, #a8abb2);
    }

    &__option {
      background: var(--c-background, #2a292f);
      border-color: var(--btn-border, #424143);

      &:hover {
        background: var(--c-hover-background, #3a3a3f);
      }
    }

    &__radio {
      border-color: #4b5563;

      &--checked {
        background: #7c3aed;
        border-color: #7c3aed;
      }
    }

    &__option-text {
      color: var(--c-text-primary, #fff);
    }
  }
}
</style>
