<script setup lang="ts">
import { computed } from "vue";
import { useI18n } from "vue-i18n";
import { NButton } from "naive-ui";
import SvgIcon from "@/components/SvgIcon/index.vue";
import type { CouponTemplate, UserCoupon, ApplicableCoupon } from "@/api/coupon/types";
import { getRemainingTime, isExpiringSoon } from "@/api/coupon";
import { useCurrency } from "@/composables/useCurrency";

const { t } = useI18n();
const { currencySymbol, formatCurrency } = useCurrency();

interface Props {
  type: "available" | "my" | "applicable";
  data: CouponTemplate | UserCoupon | ApplicableCoupon;
  selected?: boolean;
  loading?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  selected: false,
  loading: false,
});

const emit = defineEmits<{
  (e: "claim", template_id: number): void;
  (e: "select", coupon: ApplicableCoupon): void;
  (e: "use"): void;
}>();

const isApplicable = computed(() => props.type === "applicable");
const isAvailable = computed(() => props.type === "available");
const isMyCoupon = computed(() => props.type === "my");

const isPercentageDiscount = computed(() => {
  const coupon = props.data as any;
  return coupon.discount_type === "percentage";
});

const discountText = computed(() => {
  const coupon = props.data as any;
  if (props.type === "applicable") {
    if (coupon.discount_type === "fixed") {
      return currencySymbol.value + formatCurrency(coupon.discount_preview);
    } else {
      // discount_value 是减去的百分比，如 "20" 表示减 20%
      return coupon.discount_value;
    }
  }
  if (props.type === "available") {
    if (coupon.discount_type === "fixed") {
      return currencySymbol.value + formatCurrency(coupon.discount_value);
    } else {
      // discount_value 是减去的百分比，如 "20" 表示减 20%
      return coupon.discount_value;
    }
  }
  if (props.type === "my") {
    if (coupon.discount_type === "fixed") {
      return currencySymbol.value + formatCurrency(coupon.discount_value);
    } else {
      // discount_value 是减去的百分比，如 "20" 表示减 20%
      return coupon.discount_value;
    }
  }
  return "";
});

const applicableTypeText = computed(() => {
  const coupon = props.data as any;
  switch (coupon.applicable_type) {
    case "vip": return t("coupon.applicableType.vip");
    case "token": return t("coupon.applicableType.token");
    case "all": return t("coupon.applicableType.all");
    default: return "";
  }
});

const validityText = computed(() => {
  const coupon = props.data as any;
  if (props.type === "applicable") {
    return getRemainingTime(coupon.valid_until);
  }
  if (props.type === "my") {
    return getRemainingTime(coupon.valid_until);
  }
  return "";
});

const expiringSoon = computed(() => {
  const coupon = props.data as any;
  if (props.type === "applicable") {
    return isExpiringSoon(coupon.valid_until);
  }
  if (props.type === "my") {
    return isExpiringSoon(coupon.valid_until);
  }
  return false;
});

const couponDescription = computed(() => {
  return (props.data as any).description || "";
});

const remainingText = computed(() => {
  const coupon = props.data as any;
  if (props.type === "available") {
    if (coupon.remaining === -1) return t("coupon.unlimited");
    return `${coupon.remaining} ${t("coupon.remaining")}`;
  }
  return "";
});

const statusText = computed(() => {
  const coupon = props.data as any;
  if (props.type === "my") {
    switch (coupon.status) {
      case "available": return t("coupon.status.available");
      case "used": return t("coupon.status.used");
      case "expired": return t("coupon.status.expired");
      case "cancelled": return t("coupon.status.cancelled");
      default: return "";
    }
  }
  return "";
});

const discountPreview = computed(() => {
  return (props.data as any).discount_preview || "";
});

const handleClaim = () => {
  if (props.type === "available") {
    emit("claim", (props.data as CouponTemplate).template_id);
  }
};

const handleSelect = () => {
  if (props.type === "applicable") {
    emit("select", props.data as ApplicableCoupon);
  }
};

const handleUse = () => {
  if (props.type === "my" && (props.data as UserCoupon).status === "available") {
    emit("use");
  }
};

const getApplicableTypeColor = () => {
  const coupon = props.data as any;
  switch (coupon.applicable_type) {
    case "vip": return "#FF6B6B";
    case "token": return "#4ECDC4";
    case "all": return "#A78BFA";
    default: return "#A78BFA";
  }
};

const getStatusColor = () => {
  const coupon = props.data as any;
  if (props.type !== "my") return "";
  switch (coupon.status) {
    case "available": return "#10B981";
    case "used": return "#6B7280";
    case "expired": return "#EF4444";
    case "cancelled": return "#EF4444";
    default: return "#6B7280";
  }
};

// 生成优惠券序列号
const serialNumber = computed(() => {
  const id = (props.data as any).coupon_id || (props.data as any).template_id || 0;
  return `NO.${String(id).padStart(6, '0')}`;
});
</script>

<template>
  <div
    class="coupon-card"
    :class="{
      'coupon-card--selected': selected,
      'coupon-card--expiring': expiringSoon,
      'coupon-card--disabled': isMyCoupon && (data as UserCoupon).status !== 'available',
      'coupon-card--used': isMyCoupon && (data as UserCoupon).status === 'used',
      'coupon-card--expired': isMyCoupon && (data as UserCoupon).status === 'expired',
      'coupon-card--clickable': isApplicable,
    }"
    @click="isApplicable && handleSelect()"
  >
    <!-- 顶部折扣区域 -->
    <div class="coupon-card__header" :style="{ '--accent-color': getApplicableTypeColor() }">
      <!-- 锯齿装饰 - 底部 -->
      <div class="coupon-card__sawtooth coupon-card__sawtooth--bottom">
        <div v-for="i in 12" :key="i" class="coupon-card__sawtooth-item"></div>
      </div>
      
      <div class="coupon-card__discount">
        <div class="coupon-card__discount-wrapper">
          <span class="coupon-card__discount-value">{{ discountText }}</span>
          <span class="coupon-card__discount-percent" v-if="isPercentageDiscount">% OFF</span>
        </div>
        <div class="coupon-card__discount-type" v-if="applicableTypeText">
          {{ applicableTypeText }}
        </div>
      </div>
      
      <!-- 指示器 -->
      <div class="coupon-card__indicator">
        <div 
          v-if="isMyCoupon" 
          class="coupon-card__status-badge"
          :style="{ '--status-color': getStatusColor() }"
        >
          <span class="coupon-card__status-dot"></span>
          {{ statusText }}
        </div>
        <div v-else-if="expiringSoon" class="coupon-card__urgent-badge">
          <span class="coupon-card__urgent-dot"></span>
          {{ t("coupon.expiringSoon") }}
        </div>
        <div v-else-if="isApplicable" class="coupon-card__radio" :class="{ 'coupon-card__radio--checked': selected }">
          <svg-icon v-if="selected" iconClass="Check" class="coupon-card__radio-icon" />
        </div>
      </div>
      
      <!-- 序列号 -->
      <div class="coupon-card__serial">{{ serialNumber }}</div>
      
      <!-- 票券纹理 -->
      <div class="coupon-card__ticket-texture"></div>
    </div>

    <!-- 中间虚线分隔 -->
    <div class="coupon-card__divider">
      <div class="coupon-card__divider-hole coupon-card__divider-hole--left"></div>
      <div class="coupon-card__divider-hole coupon-card__divider-hole--right"></div>
    </div>

    <!-- 内容区域 -->
    <div class="coupon-card__body">
      <h3 class="coupon-card__name">{{ data.name }}</h3>
      <p v-if="couponDescription" class="coupon-card__desc">{{ couponDescription }}</p>
      
      <!-- 适用范围标签 -->
      <div class="coupon-card__tags" v-if="!isMyCoupon">
        <span 
          class="coupon-card__tag" 
          :style="{ '--tag-color': getApplicableTypeColor() }"
        >
          {{ applicableTypeText }}
        </span>
      </div>
    </div>

    <!-- 底部信息 -->
    <div class="coupon-card__footer">
      <template v-if="isAvailable">
        <div class="coupon-card__meta">
          <div v-if="validityText" class="coupon-card__meta-item">
            <svg-icon iconClass="CountDown" class="coupon-card__meta-icon" />
            <span>{{ validityText }}</span>
          </div>
          <div v-if="remainingText && (data as any).remaining !== -1" class="coupon-card__meta-item">
            <svg-icon iconClass="Profile" class="coupon-card__meta-icon" />
            <span>{{ remainingText }}</span>
          </div>
        </div>
      </template>

      <template v-if="isMyCoupon">
        <div class="coupon-card__meta">
          <div v-if="validityText && (data as UserCoupon).status === 'available'" class="coupon-card__meta-item">
            <svg-icon iconClass="CountDown" class="coupon-card__meta-icon" />
            <span>{{ t("coupon.validUntil") }} {{ validityText }}</span>
          </div>
          <div v-else-if="(data as UserCoupon).status === 'used'" class="coupon-card__meta-item coupon-card__meta-item--success">
            <svg-icon iconClass="checkmark-circle" class="coupon-card__meta-icon" />
            <span>{{ t("coupon.alreadyUsed") }}</span>
          </div>
          <div v-else-if="(data as UserCoupon).status === 'expired'" class="coupon-card__meta-item coupon-card__meta-item--error">
            <svg-icon iconClass="close" class="coupon-card__meta-icon" />
            <span>{{ t("coupon.alreadyExpired") }}</span>
          </div>
        </div>
      </template>

      <template v-if="isApplicable">
        <div class="coupon-card__preview">
          <span class="coupon-card__save-amount">
            {{ t("coupon.save") }} {{ currencySymbol }}{{ formatCurrency(discountPreview) }}
          </span>
        </div>
      </template>
    </div>

    <!-- 操作按钮 -->
    <div class="coupon-card__action">
      <template v-if="isAvailable">
        <NButton
          type="primary"
          :loading="loading"
          :disabled="loading"
          class="coupon-card__btn coupon-card__btn--claim"
          @click.stop="handleClaim"
        >
          {{ t("coupon.claim") }}
        </NButton>
      </template>
      
      <template v-if="isMyCoupon && (data as UserCoupon).status === 'available'">
        <NButton
          type="primary"
          class="coupon-card__btn coupon-card__btn--use"
          @click.stop="handleUse"
        >
          {{ t("coupon.useNow") }}
        </NButton>
      </template>

      <template v-if="isMyCoupon && (data as UserCoupon).status !== 'available'">
        <div class="coupon-card__btn coupon-card__btn--disabled">
          {{ statusText }}
        </div>
      </template>
    </div>

    <!-- 装饰纹理 -->
    <div class="coupon-card__texture"></div>
  </div>
</template>

<style scoped lang="scss">
.coupon-card {
  --card-radius: 16px;
  --accent-color: #A78BFA;
  --notch-size: 10px;
  
  position: relative;
  display: flex;
  flex-direction: column;
  background: var(--c-background, #ffffff);
  border-radius: var(--card-radius);
  overflow: hidden;
  transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
  isolation: isolate;

  &:hover {
    transform: translateY(-2px);
  }

  &--clickable {
    cursor: pointer;
  }

  &--selected {
    box-shadow: 0 0 0 2px var(--accent-color);
  }

  &--expiring {
    --accent-color: #F59E0B;

    .coupon-card__header {
      background: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
    }
  }

  &--disabled {
    opacity: 0.75;
    filter: grayscale(0.3);
    
    &:hover {
      transform: none;
    }

    .coupon-card__header {
      background: linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%);
    }
  }

  &--used, &--expired {
    --accent-color: #9CA3AF;
    
    .coupon-card__header {
      background: linear-gradient(135deg, #9CA3AF 0%, #6B7280 100%);
    }
  }

  // 头部折扣区域
  &__header {
    position: relative;
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 18px 20px 24px;
    background: linear-gradient(135deg, #7562FF 0%, #B462FF 100%);
    color: #fff;
    overflow: hidden;

    // 光泽
    &::before {
      content: '';
      position: absolute;
      inset: 0;
      background: 
        radial-gradient(circle at 30% 20%, rgba(255, 255, 255, 0.2) 0%, transparent 50%),
        radial-gradient(circle at 70% 80%, rgba(0, 0, 0, 0.1) 0%, transparent 50%);
      pointer-events: none;
    }
  }

  // 锯齿装饰 - 底部
  &__sawtooth {
    position: absolute;
    left: 0;
    right: 0;
    display: flex;
    justify-content: space-between;
    padding: 0 8px;

    &--bottom {
      bottom: -6px;
    }
  }

  &__sawtooth-item {
    width: 12px;
    height: 12px;
    background: var(--c-background, #ffffff);
    border-radius: 50%;
    box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.1);
  }

  &__discount {
    position: relative;
    z-index: 1;
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  &__discount-wrapper {
    display: flex;
    align-items: baseline;
    gap: 2px;
    line-height: 1;
  }

  &__discount-value {
    font-size: 36px;
    font-weight: 800;
    text-shadow: 0 2px 8px rgba(0, 0, 0, 0.25);
  }

  &__discount-currency {
    font-size: 16px;
    font-weight: 600;
    opacity: 0.9;
  }

  &__discount-percent {
    font-size: 12px;
    font-weight: 600;
    opacity: 0.9;
    margin-left: 2px;
  }

  &__discount-type {
    font-size: 11px;
    font-weight: 500;
    opacity: 0.85;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  // 指示器
  &__indicator {
    position: relative;
    z-index: 1;
  }

  &__status-badge {
    display: flex;
    align-items: center;
    gap: 6px;
    font-size: 12px;
    font-weight: 600;
    color: var(--status-color);
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.95);
    border-radius: 20px;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &__status-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: var(--status-color);
    animation: pulse 2s ease-in-out infinite;
  }

  @keyframes pulse {
    0%, 100% { opacity: 1; transform: scale(1); }
    50% { opacity: 0.6; transform: scale(0.9); }
  }

  &__urgent-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    background: rgba(255, 255, 255, 0.95);
    color: #92400E;
    border-radius: 20px;
    backdrop-filter: blur(8px);
    box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
  }

  &__urgent-dot {
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #F59E0B;
    animation: pulse 1.5s ease-in-out infinite;
  }

  // 序列号
  &__serial {
    position: absolute;
    bottom: 10px;
    right: 16px;
    font-size: 10px;
    font-weight: 600;
    letter-spacing: 1px;
    opacity: 0.6;
    font-family: 'Courier New', monospace;
    z-index: 1;
  }

  // 票券纹理
  &__ticket-texture {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.08;
    background-image: repeating-linear-gradient(
      45deg,
      transparent,
      transparent 10px,
      rgba(255, 255, 255, 0.6) 10px,
      rgba(255, 255, 255, 0.6) 20px
    );
  }

  // 中间锯齿分隔
  &__divider {
    position: relative;
    height: 6px;
    margin: 0;
    overflow: hidden;
  }

  &__divider-dots {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0 8px;
    margin-top: -6px;
  }

  &__divider-dot {
    width: 12px;
    height: 12px;
    border-radius: 50%;
    background: var(--c-background, #ffffff);
    box-shadow: inset 0 0 2px rgba(0, 0, 0, 0.1);
  }

  // 内容区域
  &__body {
    flex: 1;
    padding: 16px 20px;
    display: flex;
    flex-direction: column;
    gap: 8px;
    position: relative;
    z-index: 1;
    background: linear-gradient(180deg, rgba(117, 98, 255, 0.03) 0%, rgba(180, 98, 255, 0.02) 100%);
  }

  &__name {
    font-size: 15px;
    font-weight: 700;
    color: var(--c-text-primary, #1f2937);
    margin: 0;
    line-height: 1.4;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }

  &__desc {
    font-size: 12px;
    color: var(--c-text-secondary, #6b7280);
    margin: 0;
    line-height: 1.5;
    overflow: hidden;
    text-overflow: ellipsis;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }

  &__tags {
    display: flex;
    gap: 8px;
    flex-wrap: wrap;
    margin-top: auto;
    padding-top: 4px;
  }

  &__tag {
    font-size: 11px;
    font-weight: 600;
    padding: 4px 10px;
    border-radius: 4px;
    background: color-mix(in srgb, var(--tag-color) 8%, transparent);
    color: var(--tag-color);
    border: 1px solid color-mix(in srgb, var(--tag-color) 20%, transparent);
  }

  // 底部信息
  &__footer {
    padding: 0 20px 12px;
    display: flex;
    align-items: center;
    justify-content: space-between;
    min-height: 32px;
    position: relative;
    z-index: 1;
  }

  &__meta {
    display: flex;
    align-items: center;
    gap: 16px;
    flex-wrap: wrap;
  }

  &__meta-item {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 12px;
    color: var(--c-text-secondary, #6b7280);

    &--success {
      color: #10B981;
    }

    &--error {
      color: #EF4444;
    }
  }

  &__meta-icon {
    width: 14px;
    height: 14px;
    flex-shrink: 0;
  }

  &__preview {
    padding-top: 4px;
  }

  &__save-amount {
    font-size: 14px;
    font-weight: 700;
    background: linear-gradient(135deg, #10B981 0%, #059669 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
  }

  // 操作按钮
  &__action {
    padding: 0 20px 16px;
    position: relative;
    z-index: 1;
  }

  // 操作按钮
  &__action {
    padding: 0 20px 16px;
    position: relative;
    z-index: 1;
    background: linear-gradient(180deg, rgba(117, 98, 255, 0.02) 0%, rgba(180, 98, 255, 0.04) 100%);
  }

  &__action {
    :deep(.n-button) {
      border: none !important;
      outline: none !important;

      &::after {
        display: none !important;
      }

      &:focus,
      &:focus-visible,
      &:active {
        outline: none !important;
        border: none !important;
        box-shadow: none !important;
      }

      .n-button__border {
        border: none !important;
      }

      .n-button__state-border {
        display: none !important;
      }
    }
  }

  &__btn {
    width: 100%;
    height: 40px;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;

    &--claim {
      background: linear-gradient(135deg, #7562FF 0%, #B462FF 100%) !important;
      box-shadow: 0 4px 14px rgba(117, 98, 255, 0.35) !important;
      transition: all 0.3s ease !important;

      &:hover:not(:disabled) {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(117, 98, 255, 0.5) !important;
      }

      &:active:not(:disabled) {
        transform: translateY(0);
      }
    }

    &--use {
      background: linear-gradient(135deg, #10B981 0%, #059669 100%) !important;
      box-shadow: 0 4px 14px rgba(16, 185, 129, 0.4) !important;
      transition: all 0.3s ease !important;

      &:hover {
        transform: translateY(-2px);
        box-shadow: 0 6px 20px rgba(16, 185, 129, 0.5) !important;
      }
    }

    &--disabled {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 6px;
      height: 40px;
      font-size: 14px;
      font-weight: 600;
      color: var(--c-text-secondary, #6b7280);
      background: var(--second-background, #f3f4f6);
      border-radius: 8px;
    }
  }

  // 单选按钮
  &__radio {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 22px;
    height: 22px;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.95);
    border: 2px solid rgba(255, 255, 255, 0.5);
    box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
    transition: all 0.3s ease;

    &--checked {
      background: linear-gradient(135deg, #7562FF 0%, #B462FF 100%);
      border-color: transparent;
    }
  }

  &__radio-icon {
    width: 14px;
    height: 14px;
    color: #fff;
  }

  // 装饰纹理
  &__texture {
    position: absolute;
    inset: 0;
    pointer-events: none;
    opacity: 0.015;
    background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
  }
}

// 暗黑模式
:deep([data-theme="dark"]) {
  .coupon-card {
    background: #1E1E24;

    &:hover {
      box-shadow: none;
    }

    &__sawtooth-item {
      background: var(--c-background, #1E1E24);
      box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.1);
    }

    &__divider-dot {
      background: var(--c-background, #1E1E24);
      box-shadow: inset 0 0 2px rgba(255, 255, 255, 0.1);
    }

    &__body {
      background: linear-gradient(180deg, rgba(117, 98, 255, 0.05) 0%, rgba(180, 98, 255, 0.03) 100%);
    }

    &__action {
      background: linear-gradient(180deg, rgba(117, 98, 255, 0.03) 0%, rgba(180, 98, 255, 0.05) 100%);
    }

    &__name {
      color: #F3F4F6;
    }

    &__desc,
    &__meta-item {
      color: #9CA3AF;
    }

    &__save-amount {
      background: linear-gradient(135deg, #34D399 0%, #10B981 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &__btn--disabled {
      background: #2D2D35;
      color: #6B7280;
    }

    &__radio {
      background: rgba(30, 30, 36, 0.95);
      border-color: rgba(255, 255, 255, 0.2);
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.3);

      &--checked {
        background: linear-gradient(135deg, #7562FF 0%, #B462FF 100%);
        border-color: transparent;
      }
    }

    &__texture {
      opacity: 0.02;
      background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23ffffff' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
    }
  }
}
</style>
