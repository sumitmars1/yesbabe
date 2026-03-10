import http from "@/utils/http";
import { AxiosPromise } from "axios";
import { getCurrentLanguage as getCurrentLanguageFromI18n } from "@/utils/i18n";
import type { 
  VipPriceItem,
  VipPriceResponse, 
  TokenPriceResponse, 
  PurchaseTokenResponse, 
  PurchaseVipResponse,
  CreateVipOrderRequest,
  CreateTokenOrderRequest,
  PaymentOrderResponse,
  OrderQueryResponse,
  BrOrderQueryResponse,
  UsOrderQueryResponse,
  UnifiedOrderQueryResponse
} from "./types";

const PAYMENT_BACK_URL = "https://yesbabe.ai";

type PaymentRegion = "vn" | "hi" | "br" | "us";

const isPortugueseLanguage = (language: string) => {
  return String(language).toLowerCase().startsWith("pt");
};

const isIndiaPaymentLanguage = (language: string) => {
  return language === "hi-IN";
};

const isEnglishPaymentLanguage = (language: string) => {
  return language === "en-US";
};

const getPaymentRegion = (): PaymentRegion => {
  const language = getCurrentLanguageFromI18n();
  if (isPortugueseLanguage(language)) return "br";
  if (isIndiaPaymentLanguage(language)) return "hi";
  if (isEnglishPaymentLanguage(language)) return "us";
  return "vn";
};

const getQueryPaymentRegion = (order_id: string): PaymentRegion => {
  if (order_id.startsWith("VN_")) return "vn";
  if (order_id.startsWith("HI_") || order_id.startsWith("IN_")) return "hi";
  if (order_id.startsWith("BR_")) return "br";
  if (order_id.startsWith("US_")) return "us";
  return getPaymentRegion();
};

/**
 * 获取Pro价格数据
 * @returns Promise<VipPriceResponse>
 */
export const getVipPrice = () => {
  return http.request<AxiosPromise<VipPriceResponse>>({
    method: "get",
    url: "/system/vip_price",
  });
};

/**
 * 计算折扣百分比
 * @param originalPrice 原价
 * @param currentPrice 现价
 * @returns 折扣百分比字符串，如 "-72%"
 */
export const calculateDiscount = (originalPrice: string, currentPrice: string): string => {
  const original = parseFloat(originalPrice);
  const current = parseFloat(currentPrice);
  
  if (original <= 0 || current <= 0) return "0%";
  
  const discountPercent = Math.round(((original - current) / original) * 100);
  return `-${discountPercent}%`;
};

export const calculateVipDiscountPercentNumberByOneMonthStandard = (
  oneMonthCurrentPrice: string,
  planCurrentPrice: string,
  planMonth: number
): number => {
  if (planMonth <= 1) return 0;

  const oneMonthPrice = parseFloat(oneMonthCurrentPrice);
  const current = parseFloat(planCurrentPrice);

  if (Number.isNaN(oneMonthPrice) || Number.isNaN(current)) return 0;
  if (oneMonthPrice <= 0 || current <= 0) return 0;

  const baselineTotal = oneMonthPrice * planMonth;
  if (baselineTotal <= 0) return 0;
  if (current >= baselineTotal) return 0;

  const discountNum = Math.round(((baselineTotal - current) / baselineTotal) * 100);
  return discountNum > 0 ? discountNum : 0;
};

export const formatVipDiscountPercentByOneMonthStandard = (
  oneMonthCurrentPrice: string,
  planCurrentPrice: string,
  planMonth: number
): string | null => {
  const discountNum = calculateVipDiscountPercentNumberByOneMonthStandard(
    oneMonthCurrentPrice,
    planCurrentPrice,
    planMonth
  );
  return discountNum > 0 ? `-${discountNum}%` : null;
};

export const getVipDiscountPercentByOneMonthStandard = (
  vipPrices: VipPriceItem[],
  targetMonth: number
): number => {
  if (!Array.isArray(vipPrices) || vipPrices.length === 0) return 0;
  if (targetMonth <= 1) return 0;

  const oneMonthPrice = vipPrices.find((plan) => plan.month === 1)?.current_price;
  const targetPlan = vipPrices.find((plan) => plan.month === targetMonth);

  if (!oneMonthPrice || !targetPlan) return 0;

  return calculateVipDiscountPercentNumberByOneMonthStandard(
    oneMonthPrice,
    targetPlan.current_price,
    targetMonth
  );
};

export const getVipMaxDiscountPercentByOneMonthStandard = (
  vipPrices: VipPriceItem[],
  targetMonth = 12
): number => {
  if (!Array.isArray(vipPrices) || vipPrices.length === 0) return 0;

  const targetDiscount = getVipDiscountPercentByOneMonthStandard(
    vipPrices,
    targetMonth
  );
  if (targetDiscount > 0) return targetDiscount;

  const oneMonthPrice = vipPrices.find((plan) => plan.month === 1)?.current_price;
  if (!oneMonthPrice) return 0;

  const discounts = vipPrices.map((plan) =>
    calculateVipDiscountPercentNumberByOneMonthStandard(
      oneMonthPrice,
      plan.current_price,
      plan.month
    )
  );

  return Math.max(...discounts, 0);
};

/**
 * 根据月份生成标题
 * @param month 月份数
 * @returns 标题字符串
 */
export const generatePlanTitle = (month: number): string => {
  if (month === 1) return "1 Month";
  if (month === 3) return "3 Month";
  if (month === 12) return "12 Month";
  return `${month} Month${month > 1 ? 's' : ''}`;
};

/**
 * 获取Token价格数据
 * @returns Promise<TokenPriceResponse>
 */
export const getTokenPrice = () => {
  return http.request<AxiosPromise<TokenPriceResponse>>({
    method: "get",
    url: "/system/token_price",
  });
};

/**
 * 计算token增加的百分比
 * @param originalNumber 原始token数量
 * @param currentNumber 当前token数量
 * @returns token增加的百分比
 */
export const calculateTokenIncrease = (originalNumber: number, currentNumber: number): number => {
  if (originalNumber <= 0) return 0;
  
  const increasePercent = Math.round(((currentNumber - originalNumber) / originalNumber) * 100);
  return increasePercent;
};

/**
 * 格式化token增加百分比显示
 * @param originalNumber 原始token数量
 * @param currentNumber 当前token数量
 * @returns 格式化的百分比字符串，如 "+50%TOKENS"
 */
export const formatTokenIncrease = (originalNumber: number, currentNumber: number): string => {
  const increase = calculateTokenIncrease(originalNumber, currentNumber);
  return increase > 0 ? `+${increase}%TOKENS` : '';
};

/**
 * 开通Pro (测试接口)
 * @param vip_id Pro套餐ID
 * @returns Promise<PurchaseVipResponse>
 */
export const testAddVip = (vip_id: number): Promise<PurchaseVipResponse> => {
  return http.request<PurchaseVipResponse>({
    method: "post",
    url: "/pay/test_add_vip",
    data: { vip_id },
  });
};

/**
 * 购买Token (测试接口)
 * @param token_id Token套餐ID
 * @returns Promise<PurchaseTokenResponse>
 */
export const testAddTokens = (token_id: number): Promise<PurchaseTokenResponse> => {
  return http.request<PurchaseTokenResponse>({
    method: "post",
    url: "/pay/test_add_tokens",
    data: { token_id },
  });
};

/**
 * 创建VIP支付订单
 * @param data 订单参数
 * @returns Promise<PaymentOrderResponse>
 */
export const createVipOrder = (data: CreateVipOrderRequest) => {
  const region = getPaymentRegion();

  return http.request<PaymentOrderResponse>({
    method: "post",
    url: `/pay/${region}/create_vip`,
    data: {
      ...data,
      back_url: data.back_url || PAYMENT_BACK_URL,
    }
  });
};

/**
 * 创建Token支付订单
 * @param data 订单参数
 * @returns Promise<PaymentOrderResponse>
 */
export const createTokenOrder = (data: CreateTokenOrderRequest) => {
  const region = getPaymentRegion();

  return http.request<PaymentOrderResponse>({
    method: "post",
    url: `/pay/${region}/create_tokens`,
    data: {
      ...data,
      back_url: data.back_url || PAYMENT_BACK_URL,
    }
  });
};

/**
 * 查询订单状态
 * @param order_id 订单号
 * @returns Promise<UnifiedOrderQueryResponse>
 */
export const queryOrder = async (order_id: string): Promise<UnifiedOrderQueryResponse> => {
  const region = getQueryPaymentRegion(order_id);

  if (region === "br") {
    const response = await http.request<BrOrderQueryResponse>({
      method: "post",
      url: "/pay/br/query",
      params: { order_id }
    });

    const amountNumber = Number(response.data.amount);
    return {
      code: response.code,
      message: response.message,
      data: {
        local_status: response.data.status,
        order_id: response.data.order_id,
        amount: Number.isFinite(amountNumber) ? amountNumber : 0,
        order_type: response.data.order_type,
        created_at: response.data.created_at,
        currency: response.data.currency
      }
    };
  }

  if (region === "us") {
    const response = await http.request<UsOrderQueryResponse>({
      method: "get",
      url: "/pay/us/query",
      params: { mch_order_id: order_id }
    });

    return {
      code: response.code,
      message: response.message,
      data: {
        local_status: response.data.local_status,
        order_id: response.data.order_id,
        amount: response.data.amount,
        order_type: response.data.order_type,
        created_at: response.data.created_at,
        currency: response.data.currency
      }
    };
  }

  const response = await http.request<OrderQueryResponse>({
    method: "get",
    url: `/pay/${region}/query`,
    params: { mch_order_id: order_id }
  });

  return {
    code: response.code,
    message: response.message,
    data: {
      local_status: response.data.local_status,
      order_id: response.data.order_id,
      amount: response.data.amount,
      order_type: response.data.order_type,
      created_at: response.data.created_at,
      provider_response: response.data.provider_response
    }
  };
};

export const syncOrder = async (order_id: string) => {
  const region = getQueryPaymentRegion(order_id);
  if (region === "br") {
    return http.request({
      method: "post",
      url: "/pay/br/sync",
      params: { order_id }
    });
  }
  return http.request({
    method: "post",
    url: `/pay/${region}/sync`,
    params: { mch_order_id: order_id }
  });
};

export const cancelOrder = async (order_id: string, cancel_reason: string) => {
  const region = getQueryPaymentRegion(order_id);
  if (region === "br") {
    return Promise.reject(new Error("Cancel is not supported for this payment region"));
  }
  return http.request({
    method: "post",
    url: `/pay/${region}/cancel`,
    data: { mch_order_id: order_id, cancel_reason }
  });
};
