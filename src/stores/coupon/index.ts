import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getAvailableCoupons,
  claimCoupon,
  redeemCoupon,
  getMyCoupons,
  getApplicableCoupons,
} from "@/api/coupon";
import type {
  CouponTemplate,
  UserCoupon,
  ApplicableCoupon,
  CouponStatus,
  OrderType,
} from "@/api/coupon/types";

export const useCouponStore = defineStore("coupon", () => {
  // 可领取的优惠券列表
  const availableCoupons = ref<CouponTemplate[]>([]);
  // 我的优惠券列表
  const myCoupons = ref<UserCoupon[]>([]);
  // 当前订单可用优惠券
  const applicableCoupons = ref<ApplicableCoupon[]>([]);
  // 加载状态
  const loading = ref(false);
  const claimLoading = ref(false);
  // 错误信息
  const error = ref<string | null>(null);

  // 计算属性
  const availableCount = computed(() => availableCoupons.value.length);
  const myAvailableCount = computed(
    () => myCoupons.value.filter((c) => c.status === "available").length
  );

  /**
   * 获取可领取的优惠券列表
   */
  const fetchAvailableCoupons = async () => {
    loading.value = true;
    error.value = null;
    try {
      const res = await getAvailableCoupons();
      availableCoupons.value = (res as any).data || [];
    } catch (err: any) {
      console.error("Failed to fetch available coupons:", err);
      error.value = err.response?.data?.message || "Failed to load coupons";
    } finally {
      loading.value = false;
    }
  };

  /**
   * 手动领取优惠券
   * @param template_id 优惠券模板ID
   */
  const claim = async (template_id: number): Promise<boolean> => {
    claimLoading.value = true;
    error.value = null;
    try {
      await claimCoupon({ template_id });
      // 领取成功后刷新列表
      await Promise.all([fetchAvailableCoupons(), fetchMyCoupons()]);
      return true;
    } catch (err: any) {
      console.error("Failed to claim coupon:", err);
      error.value = err.response?.data?.message || "Failed to claim coupon";
      return false;
    } finally {
      claimLoading.value = false;
    }
  };

  /**
   * 兑换优惠券
   * @param code 兑换码
   */
  const redeem = async (code: string): Promise<boolean> => {
    claimLoading.value = true;
    error.value = null;
    try {
      await redeemCoupon({ code });
      // 兑换成功后刷新列表
      await Promise.all([fetchAvailableCoupons(), fetchMyCoupons()]);
      return true;
    } catch (err: any) {
      console.error("Failed to redeem coupon:", err);
      error.value = err.response?.data?.message || "Invalid or expired redemption code";
      return false;
    } finally {
      claimLoading.value = false;
    }
  };

  /**
   * 获取我的优惠券列表
   * @param status 筛选状态
   */
  const fetchMyCoupons = async (status?: CouponStatus) => {
    loading.value = true;
    error.value = null;
    try {
      const res = await getMyCoupons(status);
      myCoupons.value = (res as any).data || [];
    } catch (err: any) {
      console.error("Failed to fetch my coupons:", err);
      error.value = err.response?.data?.message || "Failed to load coupons";
    } finally {
      loading.value = false;
    }
  };

  /**
   * 查询订单可用优惠券
   * @param order_type 订单类型
   * @param product_id 商品ID
   */
  const fetchApplicableCoupons = async (
    order_type: OrderType,
    product_id: number
  ): Promise<ApplicableCoupon[]> => {
    loading.value = true;
    error.value = null;
    try {
      const res = await getApplicableCoupons(order_type, product_id);
      applicableCoupons.value = (res as any).data || [];
      return applicableCoupons.value;
    } catch (err: any) {
      console.error("Failed to fetch applicable coupons:", err);
      error.value = err.response?.data?.message || "Failed to load applicable coupons";
      return [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 清除可用优惠券列表
   */
  const clearApplicableCoupons = () => {
    applicableCoupons.value = [];
  };

  /**
   * 获取最佳优惠券（折扣最大的）
   */
  const getBestCoupon = (): ApplicableCoupon | null => {
    if (!applicableCoupons.value.length) return null;
    return applicableCoupons.value.reduce((best, c) => {
      const currentDiscount = parseFloat(c.discount_preview);
      const bestDiscount = parseFloat(best.discount_preview);
      return currentDiscount > bestDiscount ? c : best;
    });
  };

  return {
    // State
    availableCoupons,
    myCoupons,
    applicableCoupons,
    loading,
    claimLoading,
    error,
    // Computed
    availableCount,
    myAvailableCount,
    // Actions
    fetchAvailableCoupons,
    claim,
    redeem,
    fetchMyCoupons,
    fetchApplicableCoupons,
    clearApplicableCoupons,
    getBestCoupon,
  };
});
