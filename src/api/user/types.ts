// 地区检测响应
export interface CheckRegionResponse {
  code: number;
  message: string;
  data: {
    region: string; // 地区代码，如 CN, US, JP 等
  };
}

// 消费明细请求参数
export interface ConsumptionDetailRequest {
  size: number;  // 每页数量
  page: number; // 页码（从1开始）
  category?: string; // 可选的消费类别筛选
}

// 消费明细项
export interface ConsumptionDetailItem {
  id: number;
  app_code: string;
  content_method: string;
  content: string;
  created_at: string;    // 创建时间
  operation_time: string; // 操作时间
}

// 消费类别
export interface ConsumptionCategory {
  name: string;      // 类别名称，如"文字聊天"
  total_amount: number; // 总消费金额
}

// 消费总览数据
export interface CategoryOverview {
  categories: ConsumptionCategory[]; // 消费类别数组
  total_consumption: number;         // 总消费金额
  total_recharge_amount: number;     // 总充值金额
}

// 消费总览响应
export interface ConsumptionOverviewResponse {
  code: number;
  message: string;
  data: {
    category_overview: CategoryOverview;
    items?: ConsumptionDetailItem[]; // 当传入category时返回的具体消费明细
    total?: number; // 当传入category时返回的总数量
  };
}

// 消费明细响应
export interface ConsumptionDetailResponse {
  data: {
    items: ConsumptionDetailItem[];
    total: number;         // 总数量
    has_next: boolean;
  };
  msg: string;
  code: number;
}
