import { ref, computed, onUnmounted, watch, nextTick } from 'vue';
import { useAuthStore } from '@/stores/auth';
import { useNotificationStore } from '@/stores/notification';
import { NotificationManager } from '@/utils/notificationManager';
import { generateFingerprintHeader, getChannelCodeFromUrl } from '@/utils/fingerprint';
import { getCurrentLanguage } from '@/utils/i18n';
import type { 
  NotificationMessage, 
  NotificationWebSocketConfig,
  NotificationData,
  UnreadNotificationsData,
  UnreadNotificationItem,
  NotificationServerResponse 
} from '@/types/notification';

/**
 * 通知WebSocket连接管理composable
 */
export function useNotificationWebSocket() {
  const authStore = useAuthStore();
  const notificationStore = useNotificationStore();
  
  // 延迟获取notification实例，确保NotificationProvider已挂载
  let notification: any = null;
  const getNotification = async () => {
    if (!notification) {
      // 动态导入useNotification，确保在NotificationProvider挂载后调用
      const { useNotification } = await import('naive-ui');
      notification = useNotification();
    }
    return notification;
  };
  
  // 通知管理器实例
  let notificationManager: NotificationManager | null = null;
  
  // 响应式状态
  const isConnected = ref(false);
  const isConnecting = ref(false);
  const connectionStatus = ref<'disconnected' | 'connecting' | 'connected' | 'reconnecting' | 'failed'>('disconnected');
  const error = ref<string | null>(null);
  const lastNotification = ref<NotificationData | null>(null);
  
  /**
   * 获取Accept-Language值
   */
  const getAcceptLanguage = (): string => {
    const language = getCurrentLanguage();
    const languageMap: { [key: string]: string } = {
      'zh-CN': 'zh',
      'en-US': 'en',
      'vi-VN': 'vi',
      'pt-PT': 'pt',
      'ja-JP': 'ja',
      'hi-IN': 'hi'
    };
    return languageMap[language] || languageMap['en-US'] || 'en';
  };
  
  /**
   * 构建WebSocket连接URL
   */
  const buildWebSocketUrl = (): string => {
    let baseUrl: string;
    
    // 检测是否为本地开发环境
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // 本地开发环境使用固定的生产域名
      baseUrl = 'wss://yesbabeabc.com/api/ws/notification';
    } else {
      // 非本地环境根据当前页面协议自动选择 WebSocket 协议
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const host = window.location.host;
      const path = '/api/ws/notification';
      baseUrl = `${protocol}//${host}${path}`;
    }
    
    const url = new URL(baseUrl);
    
    // 添加token参数
    if (authStore.token) {
      url.searchParams.set('token', authStore.token);
    }
    
    // 添加必需的请求头参数到URL
    // User-Agent
    url.searchParams.set('user_agent', navigator.userAgent);
    
    // Accept-Language
    url.searchParams.set('accept_language', getAcceptLanguage());
    
    // Referer
    url.searchParams.set('referer', window.location.href);
    
    // X-Fingerprint (JSON格式的指纹信息)
    const fingerprintHeader = generateFingerprintHeader();
    url.searchParams.set('x_fingerprint', encodeURIComponent(fingerprintHeader));
    
    // channel_code (渠道追踪参数)
    const channelCode = getChannelCodeFromUrl();
    if (channelCode) {
      url.searchParams.set('channel_code', channelCode);
    }
    
    return url.toString();
  };
  
  /**
   * 创建通知管理器配置
   */
  const createNotificationConfig = (): NotificationWebSocketConfig => {
    return {
      url: buildWebSocketUrl(),
      token: authStore.token || '',
      heartbeatInterval: 30000,
      reconnectInterval: 5000,
      maxReconnectAttempts: 10
    };
  };
  
  /**
   * 处理通知消息
   */
  const handleNotificationMessage = async (message: any) => {
    const notification = await getNotification();
    if (!notification) return;

    // 处理普通通知消息
    if (message.type === 'notification' && message.data) {
      const notificationData = message.data as NotificationData;
      lastNotification.value = notificationData;
      
      try {
        // 显示通知
        notification.create({
          title: notificationData.title,
          content: notificationData.content,
          type: notificationData.notificationType,
          duration: notificationData.duration || 5000,
          closable: true,
          onAfterEnter: () => {
            // 通知显示完成
          },
          onAfterLeave: () => {
            // 通知关闭完成
          }
        });

        // 如果有自定义操作，可以在这里处理
        if (notificationData.action) {
          // 可以添加操作按钮的处理逻辑
        }
      } catch (error) {
        console.error('显示通知失败:', error);
      }
    } else if (message.type === 'unread_notifications' && message.data) {
      // 处理未读消息通知
      const unreadData = message.data as UnreadNotificationsData;
      
      // 更新通知store中的数据
      if (unreadData.notifications && unreadData.notifications.length > 0) {
        
        // 转换数据格式并添加到store
        const formattedNotifications = unreadData.notifications.map(item => ({
          id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
          title: item.title,
          content: item.content,
          type: (item.type as string) === 'announcement' ? 'admin' : (item.type as 'system' | 'user' | 'admin'),
          status: item.status as 'read' | 'unread',
          created_at: item.created_at,
          read_at: item.read_at || '',
          additional_data: item.additional_data || {}
        }));
        
        // 将未读消息添加到store
        notificationStore.setNotifications(formattedNotifications);
      }
      
      // 显示未读消息汇总通知
      if (unreadData.total > 0) {
        notification.info({
          title: '未读消息',
          content: `您有 ${unreadData.total} 条未读消息`,
          duration: 5000,
          closable: true
        });
      }
    } else if (message.code && message.message && message.data) {
      // 处理服务器响应格式的消息
      const serverResponse = message as NotificationServerResponse;
      if (serverResponse.code === 200 && serverResponse.data.type === 'unread_notifications') {
        const unreadData = serverResponse.data;
        
        // 更新通知store中的数据
        if (unreadData.notifications && unreadData.notifications.length > 0) {
          
          // 转换数据格式并添加到store
          const formattedNotifications = unreadData.notifications.map(item => ({
            id: typeof item.id === 'string' ? parseInt(item.id) : item.id,
            title: item.title,
            content: item.content,
            type: (item.type as string) === 'announcement' ? 'admin' : (item.type as 'system' | 'user' | 'admin'),
            status: item.status as 'read' | 'unread',
            created_at: item.created_at,
            read_at: item.read_at || '',
            additional_data: item.additional_data || {}
          }));
          
          // 将未读消息添加到store
          notificationStore.setNotifications(formattedNotifications);
        }
        
        // 显示未读消息汇总通知
        if (unreadData.total > 0) {
          notification.info({
            title: '未读消息',
            content: `您有 ${unreadData.total} 条未读消息`,
            duration: 5000,
            closable: true
          });
        }
      }
    }
  };
  
  /**
   * 连接通知WebSocket
   */
  const connect = async (): Promise<void> => {
    if (!authStore.isLoggedIn || !authStore.token) {
      return;
    }
    
    if (notificationManager?.isConnected.value || notificationManager?.isConnecting.value) {
      return;
    }
    
    try {
      // 创建新的通知管理器实例
      const config = createNotificationConfig();
      notificationManager = new NotificationManager(config);
      
      // 设置事件回调
      notificationManager.onMessage(handleNotificationMessage);
      
      notificationManager.onConnected(() => {
        // 连接成功
      });
      
      notificationManager.onDisconnected(() => {
        // 连接断开
      });
      
      notificationManager.onError((error) => {
        console.error('通知WebSocket连接错误:', error);
      });
      
      notificationManager.onAuthFailed(() => {
        // 认证失败，断开连接
        disconnect();
      });
      
      // 同步状态
      watch(
        () => notificationManager?.isConnected.value,
        (connected) => {
          isConnected.value = connected || false;
        },
        { immediate: true }
      );
      
      watch(
        () => notificationManager?.isConnecting.value,
        (connecting) => {
          isConnecting.value = connecting || false;
        },
        { immediate: true }
      );
      
      watch(
        () => notificationManager?.connectionStatus.value,
        (status) => {
          connectionStatus.value = status || 'disconnected';
        },
        { immediate: true }
      );
      
      watch(
        () => notificationManager?.error.value,
        (err) => {
          error.value = err;
        },
        { immediate: true }
      );
      
      // 建立连接
      await notificationManager.connect();
      
    } catch (err) {
      console.error('建立通知WebSocket连接失败:', err);
      error.value = err instanceof Error ? err.message : '连接失败';
    }
  };
  
  /**
   * 断开通知WebSocket连接
   */
  const disconnect = (): void => {
    if (notificationManager) {
      notificationManager.disconnect();
      notificationManager = null;
    }
    
    // 重置状态
    isConnected.value = false;
    isConnecting.value = false;
    connectionStatus.value = 'disconnected';
    error.value = null;
  };
  
  /**
   * 重新连接
   */
  const reconnect = async (): Promise<void> => {
    disconnect();
    await connect();
  };
  
  /**
   * 监听用户登录状态变化
   */
  watch(
    () => authStore.isLoggedIn,
    async (isLoggedIn) => {
      if (isLoggedIn) {
        // 用户登录后自动连接
        await connect();
      } else {
        // 用户登出后断开连接
        disconnect();
      }
    },
    { immediate: true }
  );
  
  /**
   * 组件卸载时清理
   */
  onUnmounted(() => {
    disconnect();
  });
  
  /**
   * 获取连接状态
   */
  const getStatus = () => {
    return {
      isConnected: isConnected.value,
      isConnecting: isConnecting.value,
      connectionStatus: connectionStatus.value,
      error: error.value,
      managerStatus: notificationManager?.getStatus()
    };
  };
  
  return {
    // 状态
    isConnected: computed(() => isConnected.value),
    isConnecting: computed(() => isConnecting.value),
    connectionStatus: computed(() => connectionStatus.value),
    error: computed(() => error.value),
    lastNotification: computed(() => lastNotification.value),
    
    // 方法
    connect,
    disconnect,
    reconnect,
    getStatus
  };
}
