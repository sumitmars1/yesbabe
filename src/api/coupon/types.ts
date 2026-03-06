// 优惠券模板（可领取列表返回）
export interface CouponTemplate {
  template_id: number;
  name: string;
  description: string | null;
  discount_type: 'fixed' | 'percentage';
  discount_value: string;
  max_discount: string | null;
  currency: string | null;
  min_amount: string;
  applicable_type: 'all' | 'vip' | 'token';
  validity_type: 'fixed_date' | 'days_after_claim';
  validity_days: number | null;
  valid_start: string | null;
  valid_end: string | null;
  remaining: number | null;
}

// 用户优惠券（我的券包返回）
export interface UserCoupon {
  coupon_id: number;
  template_id: number;
  name: string;
  description: string | null;
  discount_type: 'fixed' | 'percentage';
  discount_value: string;
  max_discount: string | null;
  currency: string | null;
  min_amount: string;
  applicable_type: 'all' | 'vip' | 'token';
  status: 'available' | 'used' | 'expired' | 'cancelled';
  valid_from: string;
  valid_until: string;
  claimed_at: string;
  used_at: string | null;
  used_order_id: string | null;
  discount_applied: string | null;
}

// 可用券预览（下单页返回）
export interface ApplicableCoupon {
  coupon_id: number;
  name: string;
  discount_type: 'fixed' | 'percentage';
  discount_value: string;
  discount_preview: string;
  final_amount_preview: string;
  valid_until: string;
}

// 领取优惠券请求
export interface ClaimCouponRequest {
  template_id: number;
}

// 兑换优惠券请求
export interface RedeemCouponRequest {
  code: string;
}

// 领取/兑换响应
export interface CouponClaimResponse {
  coupon_id: number;
  valid_from: string;
  valid_until: string;
}

// 优惠券状态筛选
export type CouponStatus = 'available' | 'used' | 'expired';

// 订单类型
export type OrderType = 'vip' | 'token';
