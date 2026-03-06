import http from "@/utils/http";
import type {
  CouponTemplate,
  UserCoupon,
  ApplicableCoupon,
  ClaimCouponRequest,
  RedeemCouponRequest,
  CouponClaimResponse,
  CouponStatus,
  OrderType,
} from "./types";

// API 基础路径
const COUPON_BASE_URL = "/pay/coupon";

// 是否使用 mock 数据
const USE_MOCK_DATA = false;

/**
 * 获取可领取的优惠券列表
 * 浏览当前用户可以领取的优惠券列表。已按用户语言（地区）自动过滤，已达领取上限的模板不会返回。
 */
export const getAvailableCoupons = () => {
  // Mock 数据
  if (USE_MOCK_DATA) {
    return Promise.resolve({
      data: {
        code: 200,
        message: "success",
        data: [
          {
            template_id: 1,
            name: "新用户首单8折",
            description: "新用户专享，订阅VIP立享8折优惠",
            discount_type: "percentage",
            discount_value: "20",
            max_discount: "100000",
            currency: null,
            min_amount: "0",
            applicable_type: "vip",
            validity_type: "days_after_claim",
            validity_days: 7,
            valid_start: null,
            valid_end: null,
            remaining: 980,
          },
          {
            template_id: 2,
            name: "越南春节满减",
            description: "满200,000₫减50,000₫",
            discount_type: "fixed",
            discount_value: "50000",
            max_discount: null,
            currency: "VND",
            min_amount: "200000",
            applicable_type: "all",
            validity_type: "fixed_date",
            validity_days: null,
            valid_start: "2026-02-01T00:00:00",
            valid_end: "2026-02-28T23:59:59",
            remaining: -1,
          },
          {
            template_id: 3,
            name: "钻石充值立减",
            description: "钻石充值满100减20",
            discount_type: "fixed",
            discount_value: "20000",
            max_discount: null,
            currency: "VND",
            min_amount: "100000",
            applicable_type: "token",
            validity_type: "days_after_claim",
            validity_days: 30,
            valid_start: null,
            valid_end: null,
            remaining: 500,
          },
        ] as CouponTemplate[],
      },
    }) as any;
  }

  return http.request<{ data: CouponTemplate[] }>({
    method: "get",
    url: `${COUPON_BASE_URL}/available`,
  });
};

/**
 * 手动领取优惠券
 * 用户在「券中心」点击「领取」按钮时调用
 * @param template_id 优惠券模板ID
 */
export const claimCoupon = (data: ClaimCouponRequest) => {
  // Mock 数据
  if (USE_MOCK_DATA) {
    return Promise.resolve({
      data: {
        code: 200,
        message: "success",
        data: {
          coupon_id: 42 + data.template_id,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    }) as any;
  }

  return http.request<{ data: CouponClaimResponse }>({
    method: "post",
    url: `${COUPON_BASE_URL}/claim`,
    data,
  });
};

/**
 * 兑换码领取优惠券
 * 用户输入兑换码文本，点击「兑换」按钮
 * @param code 兑换码
 */
export const redeemCoupon = (data: RedeemCouponRequest) => {
  // Mock 数据
  if (USE_MOCK_DATA) {
    return Promise.resolve({
      data: {
        code: 200,
        message: "success",
        data: {
          coupon_id: 100,
          valid_from: new Date().toISOString(),
          valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        },
      },
    }) as any;
  }

  return http.request<{ data: CouponClaimResponse }>({
    method: "post",
    url: `${COUPON_BASE_URL}/redeem`,
    data,
  });
};

/**
 * 获取我的优惠券列表
 * 查看当前用户已领到的所有优惠券（券包），支持按状态筛选
 * @param status 筛选状态: available, used, expired，不传=全部
 */
export const getMyCoupons = (status?: CouponStatus) => {
  // Mock 数据
  if (USE_MOCK_DATA) {
    const mockCoupons: UserCoupon[] = [
      {
        coupon_id: 42,
        template_id: 1,
        name: "新用户首单8折",
        description: "新用户专享，订阅VIP立享8折优惠",
        discount_type: "percentage",
        discount_value: "20",
        max_discount: "100000",
        currency: null,
        min_amount: "0",
        applicable_type: "vip",
        status: "available",
        valid_from: new Date().toISOString(),
        valid_until: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
        claimed_at: new Date().toISOString(),
        used_at: null,
        used_order_id: null,
        discount_applied: null,
      },
      {
        coupon_id: 43,
        template_id: 2,
        name: "越南春节满减",
        description: "满200,000₫减50,000₫",
        discount_type: "fixed",
        discount_value: "50000",
        max_discount: null,
        currency: "VND",
        min_amount: "200000",
        applicable_type: "all",
        status: "used",
        valid_from: "2026-02-01T00:00:00",
        valid_until: "2026-02-15T00:00:00",
        claimed_at: "2026-02-01T00:00:00",
        used_at: "2026-02-10T00:00:00",
        used_order_id: "VN1707123456",
        discount_applied: "50000",
      },
      {
        coupon_id: 44,
        template_id: 3,
        name: "钻石充值立减",
        description: "钻石充值满100减20",
        discount_type: "fixed",
        discount_value: "20000",
        max_discount: null,
        currency: "VND",
        min_amount: "100000",
        applicable_type: "token",
        status: "expired",
        valid_from: "2026-01-01T00:00:00",
        valid_until: "2026-01-15T00:00:00",
        claimed_at: "2026-01-01T00:00:00",
        used_at: null,
        used_order_id: null,
        discount_applied: null,
      },
    ];

    let filteredCoupons = mockCoupons;
    if (status) {
      filteredCoupons = mockCoupons.filter((c) => c.status === status);
    }

    return Promise.resolve({
      data: {
        code: 200,
        message: "success",
        data: filteredCoupons,
      },
    }) as any;
  }

  return http.request<{ data: UserCoupon[] }>({
    method: "get",
    url: `${COUPON_BASE_URL}/mine`,
    params: status ? { status } : undefined,
  });
};

/**
 * 查询订单可用券（含折扣预览）
 * 用户在下单页面，选择商品后，调用此接口查询「这笔订单能用哪些券」，并展示每张券能省多少钱
 * @param order_type 订单类型: vip 或 token
 * @param product_id 商品ID（VIP套餐ID 或 钻石套餐ID）
 */
export const getApplicableCoupons = (order_type: OrderType, product_id: number) => {
  // Mock 数据
  if (USE_MOCK_DATA) {
    const mockApplicableCoupons: ApplicableCoupon[] = [];

    if (order_type === "vip") {
      mockApplicableCoupons.push({
        coupon_id: 42,
        name: "新用户首单8折",
        discount_type: "percentage",
        discount_value: "20",
        discount_preview: "60000",
        final_amount_preview: "240000",
        valid_until: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    if (order_type === "token") {
      mockApplicableCoupons.push({
        coupon_id: 45,
        name: "钻石充值满减",
        discount_type: "fixed",
        discount_value: "20000",
        discount_preview: "20000",
        final_amount_preview: "80000",
        valid_until: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    return Promise.resolve({
      data: {
        code: 200,
        message: "success",
        data: mockApplicableCoupons,
      },
    }) as any;
  }

  return http.request<{ data: ApplicableCoupon[] }>({
    method: "get",
    url: `${COUPON_BASE_URL}/applicable`,
    params: { order_type, product_id },
  });
};

/**
 * 格式化折扣显示文本（优惠券模板）
 * @param coupon 优惠券模板
 * @returns 格式化的折扣文本
 */
export const formatDiscountText = (coupon: CouponTemplate | UserCoupon): string => {
  if (coupon.discount_type === "fixed") {
    return `-${coupon.discount_value}`;
  } else {
    const discountValue = parseFloat(coupon.discount_value);
    const discountPercent = 100 - discountValue;
    if (coupon.max_discount) {
      return `${discountPercent}% OFF (max ${coupon.max_discount})`;
    }
    return `${discountPercent}% OFF`;
  }
};

/**
 * 格式化可用券折扣预览文本
 * @param coupon 可用券
 * @returns 格式化的折扣文本
 */
export const formatApplicableDiscountText = (coupon: ApplicableCoupon): string => {
  if (coupon.discount_type === "fixed") {
    return `-${coupon.discount_value}`;
  } else {
    const discountValue = parseFloat(coupon.discount_value);
    const discountPercent = 100 - discountValue;
    return `${discountPercent}% OFF`;
  }
};

/**
 * 格式化优惠券有效期
 * @param coupon 优惠券模板
 * @returns 格式化的时间文本
 */
export const formatValidityText = (coupon: CouponTemplate): string => {
  if (coupon.validity_type === "days_after_claim" && coupon.validity_days) {
    return `${coupon.validity_days} days`;
  } else if (coupon.validity_type === "fixed_date") {
    if (coupon.valid_start && coupon.valid_end) {
      const start = new Date(coupon.valid_start).toLocaleDateString();
      const end = new Date(coupon.valid_end).toLocaleDateString();
      return `${start} - ${end}`;
    }
  }
  return "";
};

/**
 * 解析优惠券适用类型文本
 * @param applicable_type 适用类型
 * @returns 文本
 */
export const getApplicableTypeText = (
  applicable_type: "all" | "vip" | "token"
): string => {
  switch (applicable_type) {
    case "all":
      return "All";
    case "vip":
      return "VIP";
    case "token":
      return "Tokens";
    default:
      return "";
  }
};

/**
 * 检查优惠券是否即将过期（24小时内）
 * @param valid_until 过期时间
 * @returns 是否即将过期
 */
export const isExpiringSoon = (valid_until: string): boolean => {
  const now = new Date();
  const expiry = new Date(valid_until);
  const diffMs = expiry.getTime() - now.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  return diffHours > 0 && diffHours <= 24;
};

/**
 * 计算优惠券剩余有效时间
 * @param valid_until 过期时间
 * @returns 剩余时间文本
 */
export const getRemainingTime = (valid_until: string): string => {
  const now = new Date();
  const expiry = new Date(valid_until);
  const diffMs = expiry.getTime() - now.getTime();

  if (diffMs <= 0) {
    return "Expired";
  }

  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const hours = Math.floor((diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));

  if (days > 0) {
    return `${days}d ${hours}h`;
  } else if (hours > 0) {
    return `${hours}h`;
  } else {
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}m`;
  }
};
