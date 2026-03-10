import { defineStore } from "pinia";
import { ref, computed } from "vue";
import {
  getVipPrice,
  getVipMaxDiscountPercentByOneMonthStandard,
} from "@/api/premium";
import type { VipPriceItem } from "@/api/premium/types";

const DEFAULT_FALLBACK_DISCOUNT = 76;

export const usePremiumStore = defineStore("premium", () => {
  // State
  const vipPrices = ref<VipPriceItem[]>([]);
  const loading = ref(false);
  const loaded = ref(false);

  // Getters
  /**
   * 最大折扣百分比（以1个月价格为基准计算12个月套餐的折扣）
   */
  const maxDiscountPercent = computed(() => {
    return (
      getVipMaxDiscountPercentByOneMonthStandard(vipPrices.value, 12) ||
      DEFAULT_FALLBACK_DISCOUNT
    );
  });

  /**
   * 获取指定月份套餐的折扣百分比
   */
  const getDiscountPercentByMonth = computed(() => {
    return (month: number) => {
      return (
        getVipMaxDiscountPercentByOneMonthStandard(vipPrices.value, month) || 0
      );
    };
  });

  /**
   * 1个月套餐的当前价格
   */
  const oneMonthPrice = computed(() => {
    return vipPrices.value.find((plan) => plan.month === 1)?.current_price ?? "";
  });

  /**
   * 按月份排序的套餐列表（1个月、3个月、12个月）
   */
  const sortedVipPrices = computed(() => {
    const order = [1, 3, 12];
    return [...vipPrices.value].sort(
      (a, b) => order.indexOf(a.month) - order.indexOf(b.month)
    );
  });

  /**
   * 是否已经加载过价格数据
   */
  const isLoaded = computed(() => loaded.value);

  // Actions
  /**
   * 加载 VIP 价格数据
   */
  const loadVipPrices = async () => {
    // 如果已经加载过，不再重复请求
    if (loaded.value && vipPrices.value.length > 0) {
      return;
    }

    loading.value = true;
    try {
      const { data } = await getVipPrice();
      vipPrices.value = data || [];
      loaded.value = true;
    } catch (error) {
      console.error("Failed to load VIP prices:", error);
      vipPrices.value = [];
    } finally {
      loading.value = false;
    }
  };

  /**
   * 强制刷新 VIP 价格数据
   */
  const refreshVipPrices = async () => {
    loaded.value = false;
    await loadVipPrices();
  };

  /**
   * 重置状态
   */
  const reset = () => {
    vipPrices.value = [];
    loading.value = false;
    loaded.value = false;
  };

  return {
    // State
    vipPrices,
    loading,
    loaded,
    // Getters
    maxDiscountPercent,
    getDiscountPercentByMonth,
    oneMonthPrice,
    sortedVipPrices,
    isLoaded,
    // Actions
    loadVipPrices,
    refreshVipPrices,
    reset,
  };
});
