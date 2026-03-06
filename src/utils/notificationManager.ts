import { ref, computed } from 'vue';
import type { 
  NotificationMessage, 
  NotificationConnectionStatus, 
  NotificationWebSocketConfig 
} from '@/types/notification';

/**
 * 通知WebSocket管理器
 * 基于现有WebSocketManager架构，专门处理站内通知
 */
export class NotificationManager {
  private ws: WebSocket | null = null;
  private config: NotificationWebSocketConfig;
  private reconnectTimer: NodeJS.Timeout | null = null;
  private heartbeatTimer: NodeJS.Timeout | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts: number;
  private reconnectInterval: number;
  private heartbeatInterval: number;

  // 响应式状态
  public readonly isConnected = ref(false);
  public readonly isConnecting = ref(false);
  public readonly connectionStatus = ref<NotificationConnectionStatus>('disconnected');
  public readonly error = ref<string | null>(null);

  // 事件回调
  private onMessageCallback?: (message: NotificationMessage) => void;
  private onConnectedCallback?: () => void;
  private onDisconnectedCallback?: () => void;
  private onErrorCallback?: (error: Event) => void;
  private onAuthFailedCallback?: () => void;

  constructor(config: NotificationWebSocketConfig) {
    this.config = config;
    this.maxReconnectAttempts = config.maxReconnectAttempts || 10;
    this.reconnectInterval = config.reconnectInterval || 1000;
    this.heartbeatInterval = config.heartbeatInterval || 30000;
  }

  /**
   * 建立WebSocket连接
   */
  async connect(): Promise<void> {
    if (this.isConnected.value || this.isConnecting.value) {
      console.log('通知WebSocket已连接或正在连接中');
      return;
    }

    try {
      this.isConnecting.value = true;
      this.connectionStatus.value = 'connecting';
      this.error.value = null;

      console.log('正在建立通知WebSocket连接:', this.config.url);
      
      this.ws = new WebSocket(this.config.url);
      this.setupEventListeners();

    } catch (error) {
      console.error('通知WebSocket连接失败:', error);
      this.handleConnectionError(error as Error);
    }
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    console.log('断开通知WebSocket连接');
    
    this.stopReconnect();
    this.stopHeartbeat();
    
    if (this.ws) {
      this.ws.close(1000, '主动断开连接');
      this.ws = null;
    }
    
    this.updateConnectionState(false, 'disconnected');
  }

  /**
   * 设置WebSocket事件监听器
   */
  private setupEventListeners(): void {
    if (!this.ws) return;

    this.ws.onopen = () => {
      console.log('通知WebSocket连接已建立');
      this.updateConnectionState(true, 'connected');
      this.reconnectAttempts = 0;
      this.startHeartbeat();
      this.onConnectedCallback?.();
    };

    this.ws.onmessage = (event) => {
      try {
        console.log('收到原始WebSocket消息:', event.data);
        const message = JSON.parse(event.data) as NotificationMessage;
        console.log('解析后的通知消息:', message);
        
        // 处理不同类型的消息
        if (message.type === 'notification' || 
            message.type === 'unread_notifications' ||
            (message.code && message.message && message.data)) {
          console.log('消息类型匹配，调用回调函数');
          this.onMessageCallback?.(message);
        } else {
          console.log('消息类型不匹配，忽略消息:', message);
        }
      } catch (error) {
        console.error('解析通知消息失败:', error, '原始数据:', event.data);
      }
    };

    this.ws.onclose = (event) => {
      console.log('通知WebSocket连接已关闭:', event.code, event.reason);
      this.updateConnectionState(false, 'disconnected');
      this.stopHeartbeat();
      this.onDisconnectedCallback?.();

      // 根据关闭码决定是否重连
      if (event.code !== 1000 && event.code !== 1001) {
        this.handleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.error('通知WebSocket错误:', error);
      this.error.value = '通知连接出现错误';
      this.onErrorCallback?.(error);
    };
  }

  /**
   * 更新连接状态
   */
  private updateConnectionState(connected: boolean, status: NotificationConnectionStatus): void {
    this.isConnected.value = connected;
    this.isConnecting.value = false;
    this.connectionStatus.value = status;
  }

  /**
   * 处理连接错误
   */
  private handleConnectionError(error: Error): void {
    this.error.value = error.message;
    this.updateConnectionState(false, 'failed');
    this.handleReconnect();
  }

  /**
   * 处理重连逻辑
   */
  private handleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.log('通知WebSocket重连次数已达上限');
      this.connectionStatus.value = 'failed';
      return;
    }

    this.reconnectAttempts++;
    this.connectionStatus.value = 'reconnecting';
    
    const delay = Math.min(
      this.reconnectInterval * Math.pow(2, this.reconnectAttempts - 1),
      30000 // 最大延迟30秒
    );

    console.log(`通知WebSocket将在${delay}ms后进行第${this.reconnectAttempts}次重连`);
    
    this.reconnectTimer = setTimeout(() => {
      this.connect();
    }, delay);
  }

  /**
   * 停止重连
   */
  private stopReconnect(): void {
    if (this.reconnectTimer) {
      clearTimeout(this.reconnectTimer);
      this.reconnectTimer = null;
    }
    this.reconnectAttempts = 0;
  }

  /**
   * 开始心跳
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();
    
    this.heartbeatTimer = setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({ type: 'ping' }));
      }
    }, this.heartbeatInterval);
  }

  /**
   * 停止心跳
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<NotificationWebSocketConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 设置事件回调
   */
  onMessage(callback: (message: NotificationMessage) => void): void {
    this.onMessageCallback = callback;
  }

  onConnected(callback: () => void): void {
    this.onConnectedCallback = callback;
  }

  onDisconnected(callback: () => void): void {
    this.onDisconnectedCallback = callback;
  }

  onError(callback: (error: Event) => void): void {
    this.onErrorCallback = callback;
  }

  onAuthFailed(callback: () => void): void {
    this.onAuthFailedCallback = callback;
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isConnected: this.isConnected.value,
      isConnecting: this.isConnecting.value,
      connectionStatus: this.connectionStatus.value,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws?.readyState,
      error: this.error.value
    };
  }
}

/**
 * 创建通知WebSocket管理器实例
 */
export function createNotificationManager(config: NotificationWebSocketConfig): NotificationManager {
  return new NotificationManager(config);
}