<script setup lang="ts">
import { ref, onMounted, computed } from "vue";
import { useI18n } from "vue-i18n";
import { NTabs, NTabPane, NInput, NButton, NSpin } from "naive-ui";
import { useCouponStore } from "@/stores/coupon";
import CouponCard from "@/components/CouponCard/index.vue";
import SvgIcon from "@/components/SvgIcon/index.vue";
import type { CouponTemplate, UserCoupon, CouponStatus } from "@/api/coupon/types";

const { t } = useI18n();
const couponStore = useCouponStore();

// 当前激活的标签页
const activeTab = ref<string>("available");

// 兑换码输入
const redeemCode = ref("");
const redeemLoading = ref(false);
const showRedeemSuccess = ref(false);

// 加载可领取优惠券
const loadAvailableCoupons = async () => {
  await couponStore.fetchAvailableCoupons();
};

// 加载我的优惠券
const loadMyCoupons = async (status?: CouponStatus) => {
  await couponStore.fetchMyCoupons(status);
};

// 处理标签页切换
const handleTabChange = (value: string) => {
  activeTab.value = value;
  if (value === "available") {
    loadAvailableCoupons();
  } else if (value === "my") {
    loadMyCoupons();
  }
};

// 领取优惠券
const handleClaim = async (template_id: number) => {
  const success = await couponStore.claim(template_id);
  if (success) {
    const message = (window as any).$message;
    message.success(t("coupon.claimSuccess"));
  } else {
    const message = (window as any).$message;
    message.error(couponStore.error || "Failed to claim coupon");
  }
};

// 兑换优惠券
const handleRedeem = async () => {
  if (!redeemCode.value.trim()) return;

  redeemLoading.value = true;
  const success = await couponStore.redeem(redeemCode.value.trim());
  redeemLoading.value = false;

  if (success) {
    const message = (window as any).$message;
    message.success(t("coupon.redeemSuccess"));
    redeemCode.value = "";
    showRedeemSuccess.value = true;
    setTimeout(() => {
      showRedeemSuccess.value = false;
    }, 2000);
  } else {
    const message = (window as any).$message;
    message.error(couponStore.error || "Failed to redeem coupon");
  }
};

// 使用优惠券（跳转到支付页面）
const handleUseCoupon = () => {
  window.location.href = "/premium/pro";
};

// 可用优惠券列表
const availableCoupons = computed(() => couponStore.availableCoupons);

// 我的优惠券列表
const myCoupons = computed(() => couponStore.myCoupons);

onMounted(() => {
  loadAvailableCoupons();
});
</script>

<template>
  <div class="coupon-page">
    <!-- 背景装饰 -->
    <div class="coupon-page__bg">
      <div class="coupon-page__bg-blob coupon-page__bg-blob--1"></div>
      <div class="coupon-page__bg-blob coupon-page__bg-blob--2"></div>
      <div class="coupon-page__bg-grid"></div>
    </div>

    <div class="coupon-page__container">
      <!-- 头部区域 -->
      <header class="coupon-page__header">
        <div class="coupon-page__header-content">
          <div class="coupon-page__icon-wrapper">
            <div class="coupon-page__icon-bg">
              <svg-icon iconClass="Coupon" class="coupon-page__icon" />
            </div>
            <div class="coupon-page__icon-glow"></div>
          </div>
          <h1 class="coupon-page__title">{{ t("coupon.title") }}</h1>
          <p class="coupon-page__subtitle">{{ t("coupon.subtitle") }}</p>
        </div>
      </header>

      <!-- 标签页 -->
      <div class="coupon-page__tabs-wrapper">
        <NTabs
          v-model:value="activeTab"
          type="segment"
          @update:value="handleTabChange"
          class="coupon-page__tabs"
        >
          <NTabPane name="available" :tab="t('coupon.availableCoupons')">
            <div class="coupon-page__content">
              <!-- 兑换码区域 -->
              <div class="coupon-page__redeem">
                <div class="coupon-page__redeem-header">
                  <div class="coupon-page__redeem-icon">
                    <svg-icon iconClass="Coupon" />
                  </div>
                  <div class="coupon-page__redeem-title">{{ t("coupon.redeemCode") }}</div>
                </div>
                <div class="coupon-page__redeem-input">
                  <div class="coupon-page__input-wrapper">
                    <NInput
                      v-model:value="redeemCode"
                      :placeholder="t('coupon.enterCode')"
                      size="large"
                      class="coupon-page__input"
                      @keyup.enter="handleRedeem"
                    >
                      <template #prefix>
                        <svg-icon iconClass="password" class="coupon-page__input-icon" />
                      </template>
                    </NInput>
                  </div>
                  <NButton
                    type="primary"
                    size="large"
                    :loading="redeemLoading"
                    :disabled="!redeemCode.trim()"
                    class="coupon-page__redeem-btn"
                    @click="handleRedeem"
                  >
                    {{ t("coupon.redeem") }}
                  </NButton>
                </div>
                <div v-if="showRedeemSuccess" class="coupon-page__redeem-success">
                  <svg-icon iconClass="checkmark-circle" />
                  {{ t("coupon.redeemSuccess") }}
                </div>
              </div>

              <!-- 优惠券列表 -->
              <div class="coupon-page__section">
                <div class="coupon-page__section-header">
                  <h2 class="coupon-page__section-title">
                    {{ t("coupon.availableList") }}
                  </h2>
                  <span class="coupon-page__section-count">
                    {{ availableCoupons.length }} {{ t("coupon.coupons") }}
                  </span>
                </div>

                <!-- 加载状态 -->
                <div v-if="couponStore.loading" class="coupon-page__loading">
                  <div class="coupon-page__loading-spinner">
                    <NSpin size="large" />
                  </div>
                  <p class="coupon-page__loading-text">{{ t("coupon.loading") }}</p>
                </div>

                <!-- 空状态 -->
                <div v-else-if="availableCoupons.length === 0" class="coupon-page__empty">
                  <div class="coupon-page__empty-illustration">
                    <svg-icon iconClass="Coupon" class="coupon-page__empty-icon" />
                    <div class="coupon-page__empty-glow"></div>
                  </div>
                  <h3 class="coupon-page__empty-title">{{ t("coupon.noCouponsTitle") }}</h3>
                  <p class="coupon-page__empty-desc">{{ t("coupon.noCouponsDesc") }}</p>
                </div>

                <!-- 优惠券网格 -->
                <div v-else class="coupon-page__grid">
                  <CouponCard
                    v-for="coupon in availableCoupons"
                    :key="(coupon as CouponTemplate).template_id"
                    type="available"
                    :data="coupon"
                    :loading="couponStore.claimLoading"
                    @claim="handleClaim"
                  />
                </div>
              </div>
            </div>
          </NTabPane>

          <NTabPane name="my" :tab="t('coupon.myCoupons')">
            <div class="coupon-page__content">
              <!-- 优惠券列表 -->
              <div class="coupon-page__section">
                <!-- 加载状态 -->
                <div v-if="couponStore.loading" class="coupon-page__loading">
                  <div class="coupon-page__loading-spinner">
                    <NSpin size="large" />
                  </div>
                  <p class="coupon-page__loading-text">{{ t("coupon.loading") }}</p>
                </div>

                <!-- 空状态 -->
                <div v-else-if="myCoupons.length === 0" class="coupon-page__empty">
                  <div class="coupon-page__empty-illustration">
                    <svg-icon iconClass="collection" class="coupon-page__empty-icon" />
                    <div class="coupon-page__empty-glow"></div>
                  </div>
                  <h3 class="coupon-page__empty-title">{{ t("coupon.noMyCouponsTitle") }}</h3>
                  <p class="coupon-page__empty-desc">{{ t("coupon.noMyCouponsDesc") }}</p>
                  <NButton 
                    type="primary" 
                    class="coupon-page__empty-action"
                    @click="activeTab = 'available'"
                  >
                    {{ t("coupon.goClaim") }}
                  </NButton>
                </div>

                <!-- 优惠券网格 -->
                <div v-else class="coupon-page__grid">
                  <CouponCard
                    v-for="coupon in myCoupons"
                    :key="(coupon as UserCoupon).coupon_id"
                    type="my"
                    :data="coupon"
                    @use="handleUseCoupon"
                  />
                </div>
              </div>
            </div>
          </NTabPane>
        </NTabs>
      </div>
    </div>
  </div>
</template>

<style scoped lang="scss">
.coupon-page {
  --primary-gradient: linear-gradient(135deg, #7562FF 0%, #B462FF 100%);
  --success-gradient: linear-gradient(135deg, #10B981 0%, #059669 100%);
  --warning-gradient: linear-gradient(135deg, #F59E0B 0%, #D97706 100%);
  --error-gradient: linear-gradient(135deg, #EF4444 0%, #DC2626 100%);
  --card-min-width: 300px;
  
  position: relative;
  min-height: 100vh;
  padding: 0 16px 60px;
  overflow-x: hidden;

  &__bg {
    position: fixed;
    inset: 0;
    pointer-events: none;
    z-index: 0;
    overflow: hidden;
  }

  &__bg-blob {
    position: absolute;
    border-radius: 50%;
    filter: blur(80px);
    opacity: 0.4;

    &--1 {
      width: 600px;
      height: 600px;
      background: linear-gradient(135deg, #7562FF 0%, #B462FF 100%);
      top: -200px;
      right: -200px;
      animation: blob-float 20s ease-in-out infinite;
    }

    &--2 {
      width: 400px;
      height: 400px;
      background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
      bottom: 10%;
      left: -150px;
      animation: blob-float 25s ease-in-out infinite reverse;
    }
  }

  @keyframes blob-float {
    0%, 100% {
      transform: translate(0, 0) scale(1);
    }
    25% {
      transform: translate(30px, -30px) scale(1.05);
    }
    50% {
      transform: translate(-20px, 20px) scale(0.95);
    }
    75% {
      transform: translate(20px, 30px) scale(1.02);
    }
  }

  &__bg-grid {
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 1px 1px, rgba(117, 98, 255, 0.15) 1px, transparent 0);
    background-size: 40px 40px;
    mask-image: linear-gradient(to bottom, transparent 0%, black 20%, black 80%, transparent 100%);
  }

  &__container {
    position: relative;
    z-index: 1;
    max-width: 1200px;
    margin: 0 auto;
    padding-top: 24px;
  }

  &__header {
    text-align: center;
    margin-bottom: 32px;
  }

  &__header-content {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  &__icon-wrapper {
    position: relative;
  }

  &__icon-bg {
    width: 80px;
    height: 80px;
    border-radius: 24px;
    background: var(--primary-gradient);
    display: flex;
    align-items: center;
    justify-content: center;
    position: relative;
    z-index: 1;
    box-shadow: 
      0 8px 32px rgba(117, 98, 255, 0.4),
      inset 0 1px 0 rgba(255, 255, 255, 0.2);

    :deep(svg) {
      width: 40px;
      height: 40px;
      color: white;
    }
  }

  &__icon-glow {
    position: absolute;
    inset: -10px;
    background: var(--primary-gradient);
    border-radius: 32px;
    filter: blur(20px);
    opacity: 0.5;
    z-index: 0;
    animation: icon-pulse 3s ease-in-out infinite;
  }

  @keyframes icon-pulse {
    0%, 100% { opacity: 0.4; transform: scale(1); }
    50% { opacity: 0.7; transform: scale(1.05); }
  }

  &__title {
    font-size: 32px;
    font-weight: 800;
    margin: 0;
    background: linear-gradient(135deg, #1f2937 0%, #4b5563 100%);
    -webkit-background-clip: text;
    -webkit-text-fill-color: transparent;
    background-clip: text;
    letter-spacing: -0.5px;
  }

  &__subtitle {
    font-size: 15px;
    color: var(--c-text-secondary, #6b7280);
    margin: 0;
    max-width: 400px;
    line-height: 1.6;
  }

  &__stats {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 12px;
    margin-bottom: 24px;
  }

  &__stat-card {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 16px;
    background: var(--c-background, #ffffff);
    border-radius: 16px;
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.05),
      0 4px 12px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;

    &:hover {
      transform: translateY(-2px);
      box-shadow: 
        0 4px 6px rgba(0, 0, 0, 0.05),
        0 8px 20px rgba(0, 0, 0, 0.08);
    }
  }

  &__stat-icon {
    width: 44px;
    height: 44px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    :deep(svg) {
      width: 22px;
      height: 22px;
    }

    &--available {
      background: rgba(16, 185, 129, 0.1);
      :deep(svg) { color: #10B981; }
    }

    &--used {
      background: rgba(245, 158, 11, 0.1);
      :deep(svg) { color: #F59E0B; }
    }

    &--expired {
      background: rgba(239, 68, 68, 0.1);
      :deep(svg) { color: #EF4444; }
    }
  }

  &__stat-info {
    display: flex;
    flex-direction: column;
    gap: 2px;
  }

  &__stat-value {
    font-size: 24px;
    font-weight: 800;
    color: var(--c-text-primary, #1f2937);
    line-height: 1;
  }

  &__stat-label {
    font-size: 12px;
    font-weight: 500;
    color: var(--c-text-secondary, #6b7280);
  }

  &__tabs-wrapper {
    background: var(--c-background, #ffffff);
    border-radius: 20px;
    padding: 24px;
    box-shadow: 
      0 1px 3px rgba(0, 0, 0, 0.05),
      0 10px 30px -5px rgba(0, 0, 0, 0.08);
  }

  &__tabs {
    :deep(.n-tabs-nav) {
      margin-bottom: 24px;
    }

    :deep(.n-tabs-tab) {
      font-weight: 600;
      padding: 10px 24px;
    }

    :deep(.n-tabs-bar) {
      background: var(--primary-gradient);
    }

    :deep(.n-tab-pane) {
      padding: 0;
    }
  }

  &__content {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  &__redeem {
    background: linear-gradient(135deg, rgba(117, 98, 255, 0.05) 0%, rgba(180, 98, 255, 0.05) 100%);
    border: 1px solid rgba(117, 98, 255, 0.15);
    border-radius: 16px;
    padding: 20px;
  }

  &__redeem-header {
    display: flex;
    align-items: center;
    gap: 10px;
    margin-bottom: 16px;
  }

  &__redeem-icon {
    width: 36px;
    height: 36px;
    border-radius: 10px;
    background: var(--primary-gradient);
    display: flex;
    align-items: center;
    justify-content: center;

    :deep(svg) {
      width: 20px;
      height: 20px;
      color: white;
    }
  }

  &__redeem-title {
    font-size: 15px;
    font-weight: 700;
    color: var(--c-text-primary, #1f2937);
  }

  &__redeem-input {
    display: flex;
    gap: 12px;
  }

  &__input-wrapper {
    flex: 1;
    position: relative;
  }

  &__input {
    :deep(.n-input__input) {
      font-size: 15px;
    }

    :deep(.n-input__border) {
      border-color: rgba(117, 98, 255, 0.2);
    }

    &:hover :deep(.n-input__border) {
      border-color: rgba(117, 98, 255, 0.4);
    }

    &:focus-within :deep(.n-input__border) {
      border-color: #7562FF;
      box-shadow: 0 0 0 3px rgba(117, 98, 255, 0.1);
    }
  }

  &__input-icon {
    width: 18px;
    height: 18px;
    color: var(--c-text-secondary, #9ca3af);
  }

  &__redeem-btn {
    background: var(--primary-gradient) !important;
    border: none !important;
    box-shadow: 0 4px 14px rgba(117, 98, 255, 0.35) !important;
    transition: all 0.3s ease !important;

    &:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 6px 20px rgba(117, 98, 255, 0.45) !important;
    }

    &:active:not(:disabled) {
      transform: translateY(0);
    }
  }

  &__redeem-success {
    display: flex;
    align-items: center;
    gap: 8px;
    margin-top: 12px;
    padding: 10px 14px;
    background: rgba(16, 185, 129, 0.1);
    border-radius: 10px;
    font-size: 13px;
    font-weight: 600;
    color: #10B981;
    animation: success-slide 0.3s ease;

    :deep(svg) {
      width: 18px;
      height: 18px;
    }
  }

  @keyframes success-slide {
    from {
      opacity: 0;
      transform: translateY(-10px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  &__section {
    display: flex;
    flex-direction: column;
    gap: 16px;
  }

  &__section-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
  }

  &__section-title {
    display: flex;
    align-items: center;
    gap: 8px;
    font-size: 16px;
    font-weight: 700;
    color: var(--c-text-primary, #1f2937);
    margin: 0;
  }

  &__section-icon {
    width: 20px;
    height: 20px;
    color: #F59E0B;
  }

  &__section-count {
    font-size: 13px;
    font-weight: 600;
    color: var(--c-text-secondary, #6b7280);
    background: var(--second-background, #f3f4f6);
    padding: 4px 12px;
    border-radius: 20px;
  }

  &__loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    gap: 16px;
  }

  &__loading-spinner {
    position: relative;

    &::before {
      content: '';
      position: absolute;
      inset: -20px;
      background: var(--primary-gradient);
      border-radius: 50%;
      filter: blur(30px);
      opacity: 0.3;
      animation: spinner-glow 2s ease-in-out infinite;
    }
  }

  @keyframes spinner-glow {
    0%, 100% { opacity: 0.2; transform: scale(0.9); }
    50% { opacity: 0.4; transform: scale(1.1); }
  }

  &__loading-text {
    font-size: 14px;
    color: var(--c-text-secondary, #6b7280);
    margin: 0;
  }

  &__empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    text-align: center;
  }

  &__empty-illustration {
    position: relative;
    margin-bottom: 24px;
  }

  &__empty-icon {
    width: 80px;
    height: 80px;
    color: var(--c-text-secondary, #d1d5db);
    position: relative;
    z-index: 1;
  }

  &__empty-glow {
    position: absolute;
    inset: 0;
    background: var(--primary-gradient);
    border-radius: 50%;
    filter: blur(40px);
    opacity: 0.15;
    transform: scale(1.2);
  }

  &__empty-title {
    font-size: 18px;
    font-weight: 700;
    color: var(--c-text-primary, #1f2937);
    margin: 0 0 8px;
  }

  &__empty-desc {
    font-size: 14px;
    color: var(--c-text-secondary, #6b7280);
    margin: 0 0 20px;
    max-width: 300px;
    line-height: 1.6;
  }

  &__empty-action {
    background: var(--primary-gradient) !important;
    border: none !important;
    box-shadow: 0 4px 14px rgba(117, 98, 255, 0.35) !important;
  }

  // 网格布局
  &__grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(var(--card-min-width), 1fr));
    gap: 16px;
    padding: 8px 4px;
    
    // 确保hover时不会被遮挡
    :deep(.coupon-card) {
      height: 100%;
    }
  }
}

// 移动端适配
@media (max-width: 768px) {
  .coupon-page {
    --card-min-width: 300px;
    padding: 0 12px 40px;

    &__container {
      padding-top: 16px;
    }

    &__title {
      font-size: 26px;
    }

    &__stats {
      grid-template-columns: repeat(3, 1fr);
      gap: 8px;
    }

    &__stat-card {
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 12px 8px;
      gap: 8px;
    }

    &__stat-icon {
      width: 36px;
      height: 36px;

      :deep(svg) {
        width: 18px;
        height: 18px;
      }
    }

    &__stat-value {
      font-size: 18px;
    }

    &__stat-label {
      font-size: 11px;
    }

    &__tabs-wrapper {
      padding: 16px;
      border-radius: 16px;
    }

    &__tabs {
      :deep(.n-tabs-tab) {
        padding: 8px 16px;
        font-size: 13px;
      }
    }

    &__redeem {
      padding: 16px;
    }

    &__redeem-input {
      flex-direction: column;
    }

    &__redeem-btn {
      width: 100%;
    }

    &__grid {
      grid-template-columns: 1fr;
      gap: 12px;
      padding: 4px;
    }
  }
}

// 平板适配
@media (min-width: 769px) and (max-width: 1024px) {
  .coupon-page {
    --card-min-width: 320px;
    
    &__grid {
      grid-template-columns: repeat(2, 1fr);
    }
  }
}

// 暗黑模式
:deep([data-theme="dark"]) {
  .coupon-page {
    &__title {
      background: linear-gradient(135deg, #f3f4f6 0%, #d1d5db 100%);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
    }

    &__tabs-wrapper,
    &__stat-card,
    &__redeem {
      background: #1E1E24;
      box-shadow: 
        0 1px 3px rgba(0, 0, 0, 0.2),
        0 10px 30px -5px rgba(0, 0, 0, 0.4);
    }

    &__stat-card:hover {
      box-shadow: 
        0 4px 6px rgba(0, 0, 0, 0.3),
        0 8px 20px rgba(0, 0, 0, 0.5);
    }

    &__section-count {
      background: #2D2D35;
      color: #9CA3AF;
    }

    &__redeem {
      border-color: rgba(117, 98, 255, 0.2);
      background: linear-gradient(135deg, rgba(117, 98, 255, 0.08) 0%, rgba(180, 98, 255, 0.08) 100%);
    }

    &__empty-icon {
      color: #4B5563;
    }

    &__bg-grid {
      background-image: 
        radial-gradient(circle at 1px 1px, rgba(117, 98, 255, 0.1) 1px, transparent 0);
    }

    &__grid {
      :deep(.coupon-card) {
        box-shadow: 
          0 1px 3px rgba(0, 0, 0, 0.3),
          0 4px 12px rgba(0, 0, 0, 0.2);
      }
    }
  }
}
</style>
