import http from "@/utils/http";
import {
  GetNotificationsRequest,
  MarkNotificationReadRequest,
  DeleteNotificationRequest,
  NotificationsResponse,
  UnreadCountResponse,
  NotificationItem,
  ApiResponse
} from "./types";

/**
 * 获取通知列表
 * GET /notifications
 */
export const getNotifications = (params?: GetNotificationsRequest) => {
  return http.request<ApiResponse<NotificationsResponse>>({
    method: "get",
    url: "/notifications",
    params: {
      page: 1,
      page_size: 20,
      status: 'all',
      type: 'all',
      ...params
    }
  });
};

/**
 * 获取未读通知数量
 * GET /notifications/unread-count
 */
export const getUnreadCount = () => {
  return http.request<ApiResponse<UnreadCountResponse>>({
    method: "get",
    url: "/notifications/unread-count"
  });
};

/**
 * 标记通知为已读
 * POST /notifications/mark-read
 */
export const markNotificationsRead = (data: MarkNotificationReadRequest) => {
  return http.request<ApiResponse<{ success: boolean }>>({
    method: "post",
    url: "/notifications/mark-read",
    data
  });
};

/**
 * 标记单个通知为已读
 * POST /notifications/{id}/mark-read
 */
export const markNotificationRead = (notificationId: string) => {
  return http.request<ApiResponse<{ success: boolean }>>({
    method: "post",
    url: `/notifications/${notificationId}/mark-read`
  });
};

/**
 * 标记所有通知为已读
 * POST /notifications/mark-all-read
 */
export const markAllNotificationsRead = () => {
  return http.request<ApiResponse<{ success: boolean }>>({
    method: "post",
    url: "/notifications/mark-all-read"
  });
};

/**
 * 删除通知
 * DELETE /notifications
 */
export const deleteNotifications = (data: DeleteNotificationRequest) => {
  return http.request<ApiResponse<{ success: boolean }>>({
    method: "delete",
    url: "/notifications",
    data
  });
};

/**
 * 删除单个通知
 * DELETE /notifications/{id}
 */
export const deleteNotification = (notificationId: string) => {
  return http.request<ApiResponse<{ success: boolean }>>({
    method: "delete",
    url: `/notifications/${notificationId}`
  });
};

/**
 * 清空所有通知
 * DELETE /notifications/clear-all
 */
export const clearAllNotifications = () => {
  return http.request<ApiResponse<{ success: boolean }>>({
    method: "delete",
    url: "/notifications/clear-all"
  });
};

/**
 * 获取通知详情
 * GET /notifications/{id}
 */
export const getNotificationDetail = (notificationId: string) => {
  return http.request<ApiResponse<NotificationItem>>({
    method: "get",
    url: `/notifications/${notificationId}`
  });
};