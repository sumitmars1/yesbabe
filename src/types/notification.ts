/**
 * 通知相关类型定义
 */

// 通知类型枚举
export enum NotificationType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error'
}

// 通知消息数据结构
export interface NotificationData {
  id: string;
  title: string;
  content: string;
  notificationType: NotificationType;
  timestamp: string;
  duration?: number; // 显示持续时间（毫秒），undefined表示不自动关闭
  action?: {
    text: string;
    handler: () => void;
  };
}

// 未读通知项数据结构（来自服务器）
export interface UnreadNotificationItem {
  id: number;
  title: string;
  content: string;
  type: 'system' | 'user' | 'admin';
  status: 'unread' | 'read';
  created_at: string;
  read_at: string | null;
  additional_data: any;
}

// 未读通知数据结构
export interface UnreadNotificationsData {
  type: 'unread_notifications';
  notifications: UnreadNotificationItem[];
  total: number;
}

// 服务器响应结构
export interface NotificationServerResponse {
  code: number;
  message: string;
  data: UnreadNotificationsData;
}

// WebSocket通知消息结构
export interface NotificationMessage {
  type: 'notification' | 'unread_notifications';
  // 支持服务器直接发送的未读通知响应
  code?: number;
  message?: string;
  data?: NotificationData | UnreadNotificationsData;
}

// 通知连接状态
export type NotificationConnectionStatus = 
  | 'disconnected' 
  | 'connecting' 
  | 'connected' 
  | 'reconnecting' 
  | 'failed';

// 通知WebSocket配置
export interface NotificationWebSocketConfig {
  url: string;
  token: string;
  maxReconnectAttempts?: number;
  reconnectInterval?: number;
  heartbeatInterval?: number;
}