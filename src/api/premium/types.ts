// Pro价格项接口
export interface VipPriceItem {
  id: number;
  month: number;
  original_price: string;
  current_price: string;
}

// API响应类型
export type VipPriceResponse = VipPriceItem[];

// 计算折扣的辅助接口
export interface PlanWithDiscount {
  id: number;
  title: string;
  price: string;
  discount: string;
  originalPrice: string;
  month: number;
}

// Token价格项接口
export interface TokenPriceItem {
  id: number;
  original_number: number;
  current_number: number;
  original_price: string;
  current_price: string;
  discount: number;
}

// Token价格API响应类型
export type TokenPriceResponse = TokenPriceItem[];

// 购买钻石接口响应类型 (测试接口用)
export interface PurchaseTokenResponse {
  code: number;
  message: string;
  data: {
    token_id: number;
    tokens_added: number;
    new_balance: number;
  };
}

// 开通Pro接口响应类型 (测试接口用)
export interface PurchaseVipResponse {
  code: number;
  message: string;
  data: {
    vip_id: number;
    vip_end_time: string;
  };
}

// 支付方式枚举
export enum PaymentMethod {
  VNBANKQR = 'VNBANKQR',
  VNZALO = 'VNZALO',
  VNMOMO = 'VNMOMO',
  VNVTPAY = 'VNVTPAY',
  UPI = 'UPI',
  PIX = 'PIX',
  ONLINE = 'ONLINE',
  CARD = 'CARD'
}

// 创建VIP订单请求参数
export interface CreateVipOrderRequest {
  vip_id: number;
  pay_method: PaymentMethod | string;
  back_url?: string;
  coupon_id?: number;
}

// 创建Token订单请求参数
export interface CreateTokenOrderRequest {
  token_id: number;
  pay_method: PaymentMethod | string;
  back_url?: string;
  coupon_id?: number;
}

// 支付订单响应
export interface PaymentOrderResponse {
  code: number;
  message: string;
  data: {
    order_id: string;
    provider?: string;
    amount?: number;
    final_amount?: number;
    discount_amount?: number;
    status?: string;
    payment_url?: string;
    pay_url?: string;
    coupon_free?: boolean;
    currency?: string;
    benefits_granted?: boolean;
  };
}

// 越南/印度订单查询响应
export interface OrderQueryResponse {
  code: number;
  message: string;
  data: {
    provider_response?: {
      code: number;
      data: {
        isPaid: number;
        payAmount: string;
        paidAt: string;
      };
    };
    local_status: string;
    order_id: string;
    amount: number;
    order_type: string;
    created_at: string;
    currency?: string;
    completed_at?: string | null;
    remote_status?: string;
    remote_status_desc?: string;
  };
}

export interface UsOrderQueryResponse {
  code: number;
  message: string;
  data: {
    order_id: string;
    local_status: string;
    remote_status: string;
    remote_status_desc: string;
    amount: number;
    currency: string;
    order_type: string;
    created_at: string;
    completed_at: string | null;
  };
}

export type HieasyOrderQueryResponse = UsOrderQueryResponse;

// 巴西订单查询响应
export interface BrOrderQueryResponse {
  code: number;
  message: string;
  data: {
    order_id: string;
    status: string;
    amount: string;
    currency: string;
    order_type: string;
    created_at: string;
    completed_at?: string | null;
  };
}

// 统一订单查询响应（供前端回调逻辑使用）
export interface UnifiedOrderQueryResponse {
  code: number;
  message: string;
  data: {
    local_status: string;
    order_id: string;
    amount: number;
    order_type: string;
    created_at?: string;
    currency?: string;
    provider_response?: OrderQueryResponse["data"]["provider_response"];
  };
}
