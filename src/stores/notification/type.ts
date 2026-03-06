// 通知中心相关类型定义

export interface NotificationState {
  notifications: UnreadNotificationItem[];
  isLoading: boolean;
  showPanel: boolean;
  lastUpdateTime: Date | null;
}

export interface NotificationActions {
  setNotifications: (notifications: UnreadNotificationItem[]) => void;
  addNotification: (notification: UnreadNotificationItem) => void;
  markAsRead: (notificationId: number) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: number) => void;
  clearNotifications: () => void;
  togglePanel: () => void;
  openPanel: () => void;
  closePanel: () => void;
  setLoading: (loading: boolean) => void;
}

export interface NotificationGetters {
  unreadCount: number;
  hasUnread: boolean;
  sortedNotifications: UnreadNotificationItem[];
}

// 通知操作类型
export type NotificationOperation = 'read' | 'delete' | 'readAll' | 'deleteAll';

// 通知面板配置
export interface NotificationPanelConfig {
  maxHeight: string;
  maxItems: number;
  showTimestamp: boolean;
  showActions: boolean;
  autoClose: boolean;
  autoCloseDelay: number;
}

// 通知铃铛配置
export interface NotificationBellConfig {
  showBadge: boolean;
  maxBadgeCount: number;
  animateOnNew: boolean;
  soundEnabled: boolean;
}

// 重新导出通知相关类型
export type { UnreadNotificationItem } from '@/types/notification';