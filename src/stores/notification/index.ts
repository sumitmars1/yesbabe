import { defineStore } from "pinia";
import { ref, computed } from "vue";
import type { UnreadNotificationItem } from "@/types/notification";
import {
  getNotifications,
  getUnreadCount,
  markNotificationRead,
  markAllNotificationsRead,
  deleteNotification,
  clearAllNotifications
} from "@/api/notification";
import type { GetNotificationsRequest } from "@/api/notification/types";

export const useNotificationStore = defineStore(
  "notification",
  () => {
    // 状态
    const notifications = ref<UnreadNotificationItem[]>([]);
    const isLoading = ref(false);
    const showPanel = ref(false);
    const lastUpdateTime = ref<Date | null>(null);

    // 计算属性
    const unreadCount = computed(() => {
      return notifications.value.filter(n => n.status === 'unread').length;
    });

    const hasUnread = computed(() => unreadCount.value > 0);

    // 按时间倒序排列的通知列表
    const sortedNotifications = computed(() => {
      return [...notifications.value].sort((a, b) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
    });

    // 设置通知列表
    const setNotifications = (newNotifications: UnreadNotificationItem[]) => {
      notifications.value = newNotifications;
      lastUpdateTime.value = new Date();
    };

    // 添加新通知
    const addNotification = (notification: UnreadNotificationItem) => {
      // 检查是否已存在相同ID的通知
      const existingIndex = notifications.value.findIndex(n => n.id === notification.id);
      if (existingIndex === -1) {
        notifications.value.unshift(notification);
        lastUpdateTime.value = new Date();
      }
    };

    // 标记通知为已读
    const markAsRead = async (notificationId: number) => {
    
    };

    // 标记所有通知为已读
    const markAllAsRead = async () => {
      try {
        setLoading(true);
        // 调用API标记所有已读
        await markAllNotificationsRead();
        
        // 更新本地状态
        const now = new Date().toISOString();
        notifications.value.forEach(notification => {
          if (notification.status === 'unread') {
            notification.status = 'read';
            notification.read_at = now;
          }
        });
      } catch (error) {
        console.error('标记所有通知已读失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    };

    // 删除通知
    const removeNotification = async (notificationId: number) => {
      try {
        setLoading(true);
        // 调用API删除通知
        await deleteNotification(notificationId.toString());
        
        // 更新本地状态
        const index = notifications.value.findIndex(n => n.id === notificationId);
        if (index !== -1) {
          notifications.value.splice(index, 1);
        }
      } catch (error) {
        console.error('删除通知失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    };

    // 清空所有通知
    const clearNotifications = async () => {
      try {
        setLoading(true);
        // 调用API清空所有通知
        await clearAllNotifications();
        
        // 更新本地状态
        notifications.value = [];
        lastUpdateTime.value = new Date();
      } catch (error) {
        console.error('清空通知失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    };

    // 显示/隐藏通知面板
    const togglePanel = () => {
      showPanel.value = !showPanel.value;
    };

    const openPanel = () => {
      showPanel.value = true;
    };

    const closePanel = () => {
      showPanel.value = false;
    };

    // 设置加载状态
    const setLoading = (loading: boolean) => {
      isLoading.value = loading;
    };

    // 获取指定类型的通知
    const getNotificationsByType = (type: string) => {
      return notifications.value.filter(n => n.type === type);
    };

    // 获取最近的通知（限制数量）
    const getRecentNotifications = (limit: number = 10) => {
      return sortedNotifications.value.slice(0, limit);
    };

    // 从服务器获取通知列表
    const fetchNotifications = async (params?: GetNotificationsRequest) => {
      try {
        setLoading(true);
        const response = await getNotifications(params);
        if (response.data) {
          // 转换API数据格式为本地格式
          const apiNotifications = response.data.notifications.map(item => ({
            id: parseInt(item.id),
            title: item.title,
            content: item.content,
            type: (item.type === 'announcement' ? 'admin' : item.type) as 'system' | 'user' | 'admin',
            status: item.status as 'read' | 'unread',
            created_at: item.created_at,
            read_at: item.read_at || '',
            additional_data: item.additional_data || {}
          }));
          setNotifications(apiNotifications);
          return response.data;
        }
      } catch (error) {
        console.error('获取通知列表失败:', error);
        throw error;
      } finally {
        setLoading(false);
      }
    };

    // 从服务器获取未读数量
    const fetchUnreadCount = async () => {
      try {
        const response = await getUnreadCount();
        if (response.data) {
          return response.data.unread_count;
        }
        return 0;
      } catch (error) {
        console.error('获取未读数量失败:', error);
        return 0;
      }
    };

    return {
      // 状态
      notifications,
      isLoading,
      showPanel,
      lastUpdateTime,
      // 计算属性
      unreadCount,
      hasUnread,
      sortedNotifications,
      // 方法
      setNotifications,
      addNotification,
      markAsRead,
      markAllAsRead,
      removeNotification,
      clearNotifications,
      togglePanel,
      openPanel,
      closePanel,
      setLoading,
      getNotificationsByType,
      getRecentNotifications,
      fetchNotifications,
      fetchUnreadCount,
    };
  },
  {
    persist: true
  }
);