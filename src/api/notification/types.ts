/**
 * 获取通知列表请求参数
 */
export interface GetNotificationsRequest {
  /**
   * 页码，从1开始
   */
  page?: number;
  /**
   * 每页数量，默认20
   */
  page_size?: number;
  /**
   * 通知状态过滤
   */
  status?: 'read' | 'unread' | 'all';
  /**
   * 通知类型过滤
   */
  type?: 'system' | 'user' | 'announcement' | 'all';
}

/**
 * 标记通知已读请求参数
 */
export interface MarkNotificationReadRequest {
  /**
   * 通知ID列表
   */
  notification_ids: string[];
}

/**
 * 删除通知请求参数
 */
export interface DeleteNotificationRequest {
  /**
   * 通知ID列表
   */
  notification_ids: string[];
}

/**
 * 获取未读通知数量响应
 */
export interface UnreadCountResponse {
  /**
   * 未读通知数量
   */
  unread_count: number;
}

/**
 * 通知列表响应
 */
export interface NotificationsResponse {
  /**
   * 通知列表
   */
  notifications: NotificationItem[];
  /**
   * 总数量
   */
  total: number;
  /**
   * 当前页码
   */
  page: number;
  /**
   * 每页数量
   */
  page_size: number;
  /**
   * 是否还有更多
   */
  has_more: boolean;
}

/**
 * 通知项数据结构
 */
export interface NotificationItem {
  /**
   * 通知ID
   */
  id: string;
  /**
   * 通知标题
   */
  title: string;
  /**
   * 通知内容
   */
  content: string;
  /**
   * 通知类型
   */
  type: 'system' | 'user' | 'announcement';
  /**
   * 通知状态
   */
  status: 'read' | 'unread';
  /**
   * 创建时间
   */
  created_at: string;
  /**
   * 已读时间
   */
  read_at?: string;
  /**
   * 附加数据
   */
  additional_data?: Record<string, any>;
}

/**
 * API响应基础结构
 */
export interface ApiResponse<T = any> {
  /**
   * 响应码
   */
  code: number;
  /**
   * 响应消息
   */
  message: string;
  /**
   * 响应数据
   */
  data: T;
}