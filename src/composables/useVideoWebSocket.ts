import { ref } from "vue";
import { useAuthStore } from "@/stores/auth";
import {
  createWebSocketManager,
  getVideoWebSocketConfig,
  type WebSocketMessage,
  MessageType,
} from "@/utils/websocket";
import { showSubscriptionModal } from "@/utils/subscriptionModal";

// 单例模式，避免多个组件创建多个连接
let sharedVideoWSManager: ReturnType<typeof createWebSocketManager> | null =
  null;
const sharedIsConnected = ref(false);
const sharedIsConnecting = ref(false);
const sharedListeners: Array<(m: WebSocketMessage) => void> = [];

export function useVideoWebSocket() {
  const authStore = useAuthStore();

  const initWebSocket = async (companionId?: number) => {
    // 防止重复初始化
    if (sharedIsConnected.value || sharedIsConnecting.value) {
      console.log("视频WebSocket已连接或正在连接中，跳过重复初始化");
      return;
    }

    if (!authStore.token) {
      console.warn("用户未登录，无法建立视频WebSocket连接");
      return;
    }

    if (!companionId) {
      console.warn("缺少companion_id参数，无法建立视频WebSocket连接");
      return;
    }

    sharedIsConnecting.value = true;
    const cfg = getVideoWebSocketConfig();

    if (!sharedVideoWSManager) {
      // 在配置中添加companion_id参数
      const configWithCompanionId = {
        ...cfg,
        token: authStore.token,
        companion_id: companionId, // 添加companion_id到WebSocket连接参数
      };

      sharedVideoWSManager = createWebSocketManager(configWithCompanionId);
      sharedVideoWSManager.onConnected(() => {
        sharedIsConnected.value = true;
        sharedIsConnecting.value = false;
        console.log("视频WebSocket连接成功，companion_id:", companionId);
      });
      sharedVideoWSManager.onDisconnected(() => {
        sharedIsConnected.value = false;
        sharedIsConnecting.value = false;
        console.log("视频WebSocket连接断开");
      });
      sharedVideoWSManager.onMessage((m: WebSocketMessage) => {
        const incomingType = String(
          m.type || (m as any).message_type || "",
        ).toLowerCase();

        // 注意：不在这里处理错误，让上层组件统一处理并重置loading状态
        // 聊天配额耗尽和余额不足错误都会转发给上层处理

        // 使用标准化后的type继续分发，便于监听方统一处理
        const normalizedMessage = {
          ...m,
          type: m.type || incomingType || undefined,
        };

        sharedListeners.forEach((cb) => cb(normalizedMessage));
      });
    } else {
      // 更新配置，包括新的companion_id
      const configWithCompanionId = {
        ...cfg,
        token: authStore.token,
        companion_id: companionId,
      };
      sharedVideoWSManager.updateConfig(configWithCompanionId);
    }

    try {
      await sharedVideoWSManager.connect();
    } catch (error) {
      console.error("视频WebSocket连接失败:", error);
      sharedIsConnecting.value = false;
    }
  };

  const sendGenerateVideoMessage = (fileId: string): boolean => {
    console.log(
      "发送图生视频请求，fileId:",
      fileId,
      sharedVideoWSManager,
      sharedIsConnected,
    );
    if (!sharedVideoWSManager || !sharedIsConnected.value) {
      console.error("视频WebSocket未连接，无法发送请求");
      return false;
    }
    try {
      return (sharedVideoWSManager as any).sendGenerateVideoMessage(fileId);
    } catch (e) {
      return false;
    }
  };

  const onEvent = (cb: (m: WebSocketMessage) => void) => {
    if (!sharedListeners.includes(cb)) {
      sharedListeners.push(cb);
    }
  };

  // 清理监听器函数
  const removeEventListener = (cb: (m: WebSocketMessage) => void) => {
    const index = sharedListeners.indexOf(cb);
    if (index > -1) {
      sharedListeners.splice(index, 1);
    }
  };

  // 断开WebSocket连接
  const disconnect = () => {
    if (sharedVideoWSManager) {
      sharedVideoWSManager.disconnect();
      sharedIsConnected.value = false;
      sharedIsConnecting.value = false;
      console.log("视频WebSocket已手动断开");
    }
  };

  return {
    initWebSocket,
    disconnect,
    isConnected: sharedIsConnected,
    isConnecting: sharedIsConnecting,
    sendGenerateVideoMessage,
    onEvent,
    removeEventListener,
  };
}
