import { ref, watch, nextTick, effectScope, type Ref } from "vue";
import { useI18n } from "vue-i18n";
import { getHistoryMessagesWithConfig } from "@/api/chat"; // 引入历史消息API
import { HistoryMessage } from "@/types/chat"; // 引入历史消息类型
import { getFullAssetUrl } from "@/utils/assetUrl"; // 引入资源URL处理工具

import {
  WebSocketMessage,
  getSharedWebSocketManager,
  getWebSocketConfig,
  resetSharedWebSocketManager,
  MessageType,
  NormalizedSystemMessage,
  NormalizedRegularMessage,
  NormalizedTextMessage,
  NormalizedImageMessage,
  NormalizedVideoMessage,
  NormalizedErrorMessage,
} from "@/utils/websocket";
import { useAuthStore } from "@/stores/auth";
import { useChatStore } from "@/stores/chat";
import router from "@/router/index";
import {
  ChatMessage,
  ChatType,
  StreamStartContent,
  StreamChunkContent,
  StreamCompleteContent,
  UserMessageContent,
  ImageGenerationStartContent,
  ImageGenerationProgressContent,
  ImageGenerationCompleteContent,
  VideoGenerationStartContent,
  VideoGenerationProgressContent,
  VideoGenerationCompleteContent,
  CollectionMessageContent,
  CollectionAssetGroup,
  CollectionAssetType,
  CollectionPurchaseSuccessContent,
} from "@/types/chat";
import { showSubscriptionModal } from "@/utils/subscriptionModal";
import { showMessageQuotaModal } from "@/utils/messageQuotaModal";
import { showDiamondRechargeModal } from "@/utils/diamondRechargeModal";

export function useWebSocket() {
  const authStore = useAuthStore();
  const chatStore = useChatStore();
  const { t } = useI18n();

  // 单例：模块级共享状态与管理器
  // 注意：这些变量在模块作用域内只会初始化一次
  // 并在多次 useWebSocket() 调用之间共享。
  //
  // 聊天消息列表
  const messages = singleton.messages ?? (singleton.messages = ref<ChatMessage[]>([]));

  // 历史消息相关状态
  const historyPage = singleton.historyPage ?? (singleton.historyPage = ref(1));
  const hasMoreHistory = singleton.hasMoreHistory ?? (singleton.hasMoreHistory = ref(true));
  const isLoadingHistory = singleton.isLoadingHistory ?? (singleton.isLoadingHistory = ref(false));
  const lastHistoryCompanionId =
    singleton.lastHistoryCompanionId ?? (singleton.lastHistoryCompanionId = ref<number | null>(null));
  const historyLimit = 20;

  // 连接状态
  const isConnected = singleton.isConnected ?? (singleton.isConnected = ref(false));
  const isConnecting = singleton.isConnecting ?? (singleton.isConnecting = ref(false));
  const connectionStatus = singleton.connectionStatus ??
    (singleton.connectionStatus = ref<"connected" | "connecting" | "disconnected">("disconnected"));

  // 错误信息
  const error = singleton.error ?? (singleton.error = ref<string | null>(null));

  // AI回复状态
  const isReplying = singleton.isReplying ?? (singleton.isReplying = ref(false));

  // WebSocket 管理器与控制标记
  let wsManager = singleton.wsManager ?? null;
  const isInitializing = singleton.isInitializing ?? (singleton.isInitializing = ref(false));
  let eventsBound = singleton.eventsBound ?? false;
  singleton.eventsBound = eventsBound;

  // 全局独立的侦听作用域，避免随组件卸载而失效
  if (!singleton.scope) {
    singleton.scope = effectScope(true);
    singleton.scope.run(() => {
      // 监听聊天对象变化，重新建立连接（全局持久）
      watch(
        () => chatStore.currentChat?.id,
        async (newChatId, oldChatId) => {
          if (newChatId !== oldChatId) {
            console.log('检测到聊天对象变更，正在重新建立连接:', { oldChatId, newChatId });
            clearMessages();
            disconnect();

            // 等待足够长的时间，确保WebSocket完全关闭
            console.log('等待WebSocket连接完全关闭...');
            await new Promise(resolve => setTimeout(resolve, 300));
            if (newChatId) await initWebSocket();
          }
        }
      );

      // 监听用户登录状态变化（全局持久）
      watch(
        () => authStore.isLoggedIn,
        async (isLoggedIn, wasLoggedIn) => {
          if (isLoggedIn && !wasLoggedIn) {
            if (chatStore.currentChat?.id) await initWebSocket();
          } else if (!isLoggedIn && wasLoggedIn) {
            disconnect();
            clearMessages();
          }
        }
      );
    });
  }

  /**
   * 初始化WebSocket连接
   */
  const initWebSocket = async () => {
    // 防止重复初始化
    if (isInitializing.value) {
      console.log("WebSocket正在初始化中，跳过重复调用");
      return;
    }

    if (!authStore.token) {
      console.warn("用户未登录，无法建立WebSocket连接");
      return;
    }

    if (!chatStore.currentChat?.id) {
      console.warn("未选择聊天对象，无法建立WebSocket连接");
      return;
    }

    // 如果已有活跃连接但companion_id不匹配，先断开旧连接
    if (
      wsManager &&
      isConnected.value &&
      wsManager.getStatus().readyState === WebSocket.OPEN &&
      wsManager.getConfig().companion_id !== chatStore.currentChat.companion_id
    ) {
      console.log("检测到companion_id不匹配，断开旧连接:", {
        currentCompanionId: wsManager.getConfig().companion_id,
        expectedCompanionId: chatStore.currentChat.companion_id
      });

      // 手动断开连接并同步状态
      wsManager.disconnect();

      // 同步重置所有相关状态
      isConnected.value = false;
      isConnecting.value = false;
      connectionStatus.value = "disconnected";
      isReplying.value = false;

      // 清理管理器引用
      wsManager = null;
      singleton.wsManager = null;
    }

    // 如果已有活跃连接且为同一聊天对象，复用连接
    if (
      wsManager &&
      isConnected.value &&
      wsManager.getStatus().readyState === WebSocket.OPEN &&
      wsManager.getConfig().companion_id === chatStore.currentChat.companion_id
    ) {
      console.log("WebSocket连接已存在且匹配，无需重复创建", {
        currentCompanionId: wsManager.getConfig().companion_id,
        expectedCompanionId: chatStore.currentChat.companion_id,
        readyState: wsManager.getStatus().readyState
      });
      return;
    }

    // 在创建新连接前，先完全重置共享管理器
    console.log("重置共享WebSocket管理器，确保创建全新实例");
    resetSharedWebSocketManager();

    // 设置初始化标志
    isInitializing.value = true;

    try {
      // 如果存在旧连接，先断开
      if (wsManager) {
        console.log("断开旧的WebSocket连接");
        wsManager.disconnect();
        wsManager = null;
      }

      // 重置消息和历史记录状态
      messages.value = [];
      historyPage.value = 1;
      hasMoreHistory.value = true;
      isLoadingHistory.value = false;

      // 首先加载历史消息
      await loadHistoryMessages();

      // 获取WebSocket配置
      const config = getWebSocketConfig();

      // 获取或创建共享 WebSocket 管理器
      wsManager = getSharedWebSocketManager({
        ...config,
        token: authStore.token,
        companion_id: chatStore.currentChat.companion_id,
      });
      singleton.wsManager = wsManager;

      // 设置事件监听（只绑定一次）
      setupWebSocketEvents();

      // 建立连接
      await wsManager.connect();
      console.log("WebSocket连接建立成功");
    } catch (err) {
      console.error("初始化WebSocket失败:", err);
      error.value = "连接聊天服务失败";
    } finally {
      // 无论成功还是失败，都要重置初始化标志
      isInitializing.value = false;
    }
  };

  /**
   * 设置WebSocket事件监听
   */
  const setupWebSocketEvents = () => {
    if (!wsManager) return;

    // 每个管理器仅绑定一次
    singleton.boundManagers = singleton.boundManagers || new Set();
    if (singleton.boundManagers.has(wsManager)) return;

    const manager = wsManager; // 捕获当前实例，避免后续变量变化为 null 导致报错

    // 使用全局作用域监听 manager 的响应式状态
    if (singleton.scope) {
      singleton.scope.run(() => {
        watch(
          () => manager.isConnected.value,
          (connected) => {
            isConnected.value = connected || false;
          }
        );

        watch(
          () => manager.isConnecting.value,
          (connecting) => {
            isConnecting.value = connecting || false;
          }
        );

        watch(
          () => manager.connectionStatus.value,
          (status) => {
            connectionStatus.value = status || "disconnected";
          }
        );
      });
    }

    // 监听消息
    manager.onMessage((message: WebSocketMessage) => {
      handleIncomingMessage(message);
    });

    // 监听连接建立
    manager.onConnected(() => {
      console.log("WebSocket连接已建立");
      error.value = null;
    });

    // 监听连接断开
    manager.onDisconnected(() => {
      console.log("WebSocket连接已断开");
      // 重置所有合集购买状态，防止loading状态卡住
      resetAllCollectionPurchasingStates();
    });

    // 监听错误
    manager.onError((err) => {
      console.error("WebSocket错误:", err);
      error.value = "聊天连接出现错误";
      // 重置所有合集购买状态，防止loading状态卡住
      resetAllCollectionPurchasingStates();
    });

    // 监听身份认证失败
    manager.onAuthFailed(() => {
      console.log("身份认证失败，准备跳转到登录页");
      handleAuthFailed();
    });

    // 监听companion_id错误
    manager.onCompanionNotFound(() => {
      console.log("AI角色不存在，准备跳转到首页");
      handleCompanionNotFound();
    });

    singleton.boundManagers.add(manager);
  };

  /**
   * 统一处理接收到的消息
   */
  const handleIncomingMessage = (wsMessage: WebSocketMessage) => {
    console.log("处理接收到的消息:", wsMessage);

    const normalized = wsMessage.normalized;
    const incomingTypeRaw =
      (typeof wsMessage.type === "string" && wsMessage.type) ||
      (typeof normalized?.meta?.rawType === "string" && normalized?.meta?.rawType) ||
      "";
    const incomingType = incomingTypeRaw.toLowerCase();

    // 特殊处理聊天配额耗尽错误
    if (incomingType === MessageType.message_chat_exhausted_error) {
      handleChatExhaustedError(wsMessage);
      return;
    }

    // 特殊处理余额不足错误
    if (incomingType === MessageType.insufficient_balance_error) {
      handleInsufficientBalanceError(wsMessage);
      return;
    }

    if (incomingType === MessageType.collection_marketing) {
      handleCollectionMarketing(wsMessage);
      return;
    }

    if (incomingType === MessageType.collection_purchase_error || incomingType === "collection_purchase_error") {
      handleCollectionPurchaseError(wsMessage);
      return;
    }

    if (incomingType === MessageType.collection_purchase_success) {
      handleCollectionPurchaseSuccess(wsMessage);
      return;
    }

    if (
      incomingType === MessageType.collection_image ||
      incomingType === MessageType.collection_video
    ) {
      handleCollectionMediaResponse(wsMessage, incomingType as MessageType);
      return;
    }

    if (normalized) {
      switch (normalized.kind) {
        case "system":
          handleSystemNotification(normalized);
          return;
        case "regular":
          handleRegularIncoming(normalized, wsMessage);
          return;
        case "text":
          handleTextIncoming(normalized, wsMessage);
          return;
        case "image":
          handleImageIncoming(normalized, wsMessage);
          return;
        case "video":
          handleVideoIncoming(normalized, wsMessage);
          return;
        case "error":
          handleErrorIncoming(normalized, wsMessage);
          return;
      }
    }

    handleLegacyFallback(wsMessage);
  };

  const createLocalMessageId = (): string =>
    `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  const toKey = (
    value: string | number | null | undefined
  ): string | undefined => (value === null || value === undefined ? undefined : String(value));

  const extractUniqueIdentifier = (...sources: Array<unknown>): string | undefined => {
    const visited = new Set<any>();
    const queue: any[] = [];
    for (const source of sources) {
      if (source !== undefined && source !== null) {
        queue.push(source);
      }
    }
    while (queue.length > 0) {
      const current = queue.shift();
      if (typeof current === "string" || typeof current === "number") {
        const key = toKey(current);
        if (key) return key;
        continue;
      }
      if (typeof current !== "object" || visited.has(current)) {
        continue;
      }
      visited.add(current);
      const directKey = toKey((current as any).unique_id ?? (current as any).uniqueId);
      if (directKey) return directKey;
      const nestedKeys = ["raw", "data", "payload", "content"];
      for (const nestedKey of nestedKeys) {
        if (Object.prototype.hasOwnProperty.call(current, nestedKey)) {
          const nested = (current as any)[nestedKey];
          if (nested !== undefined && nested !== null) {
            queue.push(nested);
          }
        }
      }
    }
    return undefined;
  };

  const findMessageIndexByIdentifiers = (identifiers: {
    uniqueId?: string | number | null;
    fileId?: string | number | null;
  }): number => {
    const uniqueKey = toKey(identifiers.uniqueId);
    const fileKey = toKey(identifiers.fileId);
    return messages.value.findIndex((msg) => {
      const idKey = toKey(msg.id as any);
      const msgUniqueKey = toKey((msg as any).unique_id);
      if (uniqueKey && (msgUniqueKey === uniqueKey || idKey === uniqueKey)) {
        return true;
      }
      if (fileKey && idKey === fileKey) {
        return true;
      }
      return false;
    });
  };

  /**
   * 统一的消息覆盖逻辑函数
   * 基于 unique_id 查找并覆盖现有消息，如果没有找到则添加新消息
   */
  const updateOrAddMessage = (
    newMessage: ChatMessage,
    uniqueId?: string | number | null
  ): void => {
    // 如果有 unique_id，尝试查找并覆盖现有消息
    if (uniqueId) {
      const targetIndex = findMessageIndexByIdentifiers({
        uniqueId: uniqueId
      });

      if (targetIndex !== -1) {
        // 覆盖现有消息，保持一些原有属性
        const existing = messages.value[targetIndex];
        const stableUniqueId = uniqueId ? String(uniqueId) : existing.unique_id;
        const updatedMessage: ChatMessage = {
          ...existing,
          ...newMessage,
          // 确保标识符一致
          id: existing.id || newMessage.id,
          unique_id: stableUniqueId,
          // 使用最新的时间戳
          time: newMessage.time || existing.time,
          // 保留已有的 response_id，避免后续覆盖时把 TTS 依赖字段冲掉
          response_id: newMessage.response_id ?? existing.response_id,
        };

        // 更新消息列表
        messages.value[targetIndex] = updatedMessage;
        saveMessageToStorage(updatedMessage);
        console.log(`成功覆盖具有 unique_id ${uniqueId} 的消息`);
        return;
      }
    }

    // 没有找到现有消息或没有 unique_id，直接添加新消息
    addMessage(newMessage);
    saveMessageToStorage(newMessage);
    if (uniqueId) {
      console.log(`创建新的消息，unique_id: ${uniqueId}`);
    } else {
      console.log(`创建新的无 unique_id 消息`);
    }
  };

  const findLatestStreamingMessageIndex = (): number => {
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const msg = messages.value[i];
      if (msg.isSelf) continue;
      if (
        msg.type === MessageType.stream_start ||
        msg.type === MessageType.stream_chunk ||
        msg.type === MessageType.text_start ||
        msg.type === MessageType.text_progress
      ) {
        if (msg.isLoading || msg.isTyping) {
          return i;
        }
      }
    }
    return -1;
  };

  const findLatestActiveMediaMessageIndex = (
    candidateTypes: MessageType[]
  ): number => {
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const msg = messages.value[i];
      if (msg.isSelf) continue;
      if (!candidateTypes.includes(msg.type)) continue;
      if (msg.isLoading || msg.isTyping) {
        return i;
      }
    }
    return -1;
  };

  const COLLECTION_MESSAGE_TYPES = new Set<MessageType>([
    MessageType.collection_marketing,
    MessageType.collection_purchase_success,
    MessageType.collection_purchase_error,
    MessageType.collection_image,
    MessageType.collection_video,
  ]);

  const toNumberOrUndefined = (value: any): number | undefined => {
    if (value === null || value === undefined) return undefined;
    if (typeof value === "number" && !Number.isNaN(value)) return value;
    if (typeof value === "string" && value.trim() !== "") {
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) return parsed;
    }
    return undefined;
  };

  const parseCollectionFilenames = (value: any): string[] => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.map((item) => String(item)).filter((item) => item.trim().length > 0);
    }
    if (typeof value === "string") {
      return value
        .split("|")
        .map((item) => item.trim())
        .filter((item) => item.length > 0);
    }
    if (typeof value === "object" && value !== null) {
      if (Array.isArray(value.filenames)) {
        return parseCollectionFilenames(value.filenames);
      }
      if (typeof value.content === "string") {
        return parseCollectionFilenames(value.content);
      }
    }
    return [];
  };

  const normalizeCollectionAssetType = (value: any, fallback: CollectionAssetType = "collection_image"): CollectionAssetType => {
    const lowered = typeof value === "string" ? value.toLowerCase() : value;
    if (lowered === MessageType.collection_video) {
      return "collection_video";
    }
    if (lowered === MessageType.collection_image) {
      return "collection_image";
    }
    return fallback;
  };

  const normalizeCollectionAssetGroup = (value: any): CollectionAssetGroup | null => {
    if (!value || typeof value !== "object") return null;
    const filenames = parseCollectionFilenames(value.filenames ?? value.content ?? value.files);
    if (filenames.length === 0) return null;
    const type = normalizeCollectionAssetType(value.type);
    return {
      type,
      filenames,
      fileCount: toNumberOrUndefined(value.fileCount ?? value.file_count) ?? filenames.length,
    };
  };

  const mergeAssetGroups = (
    existing: CollectionAssetGroup[] = [],
    incoming: CollectionAssetGroup[] = []
  ): CollectionAssetGroup[] => {
    const map = new Map<CollectionAssetType, CollectionAssetGroup>();

    existing.forEach((group) => {
      map.set(group.type, {
        type: group.type,
        filenames: [...group.filenames],
        fileCount: group.fileCount,
      });
    });

    incoming.forEach((group) => {
      const current = map.get(group.type);
      if (current) {
        const mergedSet = new Set([...current.filenames, ...group.filenames]);
        const filenames = Array.from(mergedSet);
        map.set(group.type, {
          type: group.type,
          filenames,
          fileCount: group.fileCount ?? filenames.length,
        });
      } else {
        map.set(group.type, {
          type: group.type,
          filenames: [...group.filenames],
          fileCount: group.fileCount ?? group.filenames.length,
        });
      }
    });

    return Array.from(map.values());
  };

  interface NormalizedCollectionMetadata {
    id: number;
    title?: string;
    description?: string;
    coverImage?: string;
    imageCount: number;
    videoCount: number;
    price: number | null;
    discountPrice: number | null;
    purchaseCount: number;
    isFree: boolean;
    isFeatured: boolean;
    companionId?: number;
    createdTime?: string;
  }

  const normalizeCollectionMetadata = (raw: any): NormalizedCollectionMetadata | null => {
    if (!raw || typeof raw !== "object") return null;
    const id = toNumberOrUndefined(raw.id ?? raw.collection_id ?? raw.collectionId);
    if (id === undefined) return null;

    const title = typeof raw.title === "string" ? raw.title : undefined;
    const description = typeof raw.description === "string" ? raw.description : undefined;

    const coverImage =
      typeof raw.cover_image === "string"
        ? raw.cover_image
        : typeof raw.coverImage === "string"
          ? raw.coverImage
          : undefined;

    const imageCount = toNumberOrUndefined(raw.image_count ?? raw.imageCount) ?? 0;
    const videoCount = toNumberOrUndefined(raw.video_count ?? raw.videoCount) ?? 0;
    const price = toNumberOrUndefined(raw.price);
    const discountPrice = toNumberOrUndefined(raw.discount_price ?? raw.discountPrice);
    const purchaseCount = toNumberOrUndefined(raw.purchase_count ?? raw.purchaseCount) ?? 0;
    const isFree =
      raw.is_free !== undefined
        ? Boolean(raw.is_free)
        : raw.isFree !== undefined
          ? Boolean(raw.isFree)
          : price === 0;
    const isFeatured = Boolean(raw.is_featured ?? raw.isFeatured ?? false);
    const companionId = toNumberOrUndefined(raw.companion_id ?? raw.companionId);
    const createdTime =
      typeof raw.created_time === "string"
        ? raw.created_time
        : typeof raw.createdTime === "string"
          ? raw.createdTime
          : undefined;

    return {
      id,
      title,
      description,
      coverImage,
      imageCount,
      videoCount,
      price: price ?? null,
      discountPrice: discountPrice ?? null,
      purchaseCount,
      isFree,
      isFeatured,
      companionId,
      createdTime,
    };
  };

  const extractCollectionMetadataList = (raw: any): NormalizedCollectionMetadata[] => {
    if (!raw || typeof raw !== "object") return [];

    const visited = new Set<number>();
    const results: NormalizedCollectionMetadata[] = [];

    const collect = (input: any) => {
      if (!input) return;
      const items = Array.isArray(input) ? input : [input];
      items.forEach((item) => {
        const normalized = normalizeCollectionMetadata(item);
        if (normalized && !visited.has(normalized.id)) {
          visited.add(normalized.id);
          results.push(normalized);
        }
      });
    };

    const queue: any[] = [raw];

    while (queue.length) {
      const current = queue.shift();
      if (!current || typeof current !== "object") continue;

      collect(current.collections);
      collect(current.collection);

      if (current.data && typeof current.data === "object") {
        queue.push(current.data);
      }
      if (current.payload && typeof current.payload === "object") {
        queue.push(current.payload);
      }
      if (current.result && typeof current.result === "object") {
        queue.push(current.result);
      }
      if (current.content && typeof current.content === "object") {
        queue.push(current.content);
      }
    }

    return results;
  };

  const buildCollectionMarketingContent = (payload: any): CollectionMessageContent | null => {
    if (!payload || typeof payload !== "object") return null;
    const collectionId = toNumberOrUndefined(payload.id ?? payload.collection_id ?? payload.collectionId);
    if (collectionId === undefined) return null;

    const baseGroups: CollectionAssetGroup[] = Array.isArray(payload.assetGroups)
      ? payload.assetGroups
          .map((group: any) => normalizeCollectionAssetGroup(group))
          .filter(Boolean) as CollectionAssetGroup[]
      : [];

    const metadata = normalizeCollectionMetadata({
      ...payload,
      id: collectionId,
    });

    return {
      id: collectionId,
      title: metadata?.title ?? (typeof payload.title === "string" ? payload.title : undefined),
      description: metadata?.description,
      price: metadata?.price ?? toNumberOrUndefined(payload.price) ?? null,
      discountPrice: metadata?.discountPrice ?? null,
      purchaseCount: metadata?.purchaseCount,
      isFree: metadata?.isFree,
      isFeatured: metadata?.isFeatured,
      imageCount: metadata?.imageCount ?? toNumberOrUndefined(payload.image_count ?? payload.imageCount) ?? 0,
      videoCount: metadata?.videoCount ?? toNumberOrUndefined(payload.video_count ?? payload.videoCount) ?? 0,
      coverImage: metadata?.coverImage,
      createdTime: metadata?.createdTime,
      companionId: metadata?.companionId,
      purchased: Boolean(payload.purchased ?? false),
      isPurchasing: Boolean(payload.isPurchasing ?? false),
      assetGroups: baseGroups,
    };
  };

  const normalizePurchasePayload = (
    raw: any,
    explicitType?: CollectionAssetType
  ): CollectionPurchaseSuccessContent | null => {
    if (raw === null || raw === undefined) return null;
    const payload = typeof raw === "object" && raw !== null ? raw : { content: raw };
    const filenames = parseCollectionFilenames(payload.content ?? payload.files ?? payload);
    if (filenames.length === 0) return null;

    const type = normalizeCollectionAssetType(payload.type, explicitType ?? "collection_image");

    const metadataCandidates = extractCollectionMetadataList(payload);
    const primaryMetadata =
      metadataCandidates.find((item) => item.id === toNumberOrUndefined(payload.collection_id ?? payload.collectionId ?? payload.id)) ||
      metadataCandidates[0];

    const coverImage =
      primaryMetadata?.coverImage ??
      (typeof payload.cover_image === "string"
        ? payload.cover_image
        : typeof payload.coverImage === "string"
          ? payload.coverImage
          : undefined);

    const uniqueId = extractUniqueIdentifier(
      payload.unique_id ?? payload.uniqueId,
      payload
    );

    const collectionId = toNumberOrUndefined(payload.collection_id ?? payload.collectionId ?? payload.id);
    const title = primaryMetadata?.title ?? (typeof payload.title === "string" ? payload.title : undefined);
    const description = primaryMetadata?.description;
    const price = primaryMetadata?.price ?? toNumberOrUndefined(payload.price) ?? null;
    const discountPrice = primaryMetadata?.discountPrice ?? null;
    const purchaseCount =
      primaryMetadata?.purchaseCount ?? toNumberOrUndefined(payload.purchase_count ?? payload.purchaseCount) ?? undefined;
    const imageCount =
      primaryMetadata?.imageCount ?? toNumberOrUndefined(payload.image_count ?? payload.imageCount) ?? undefined;
    const videoCount =
      primaryMetadata?.videoCount ?? toNumberOrUndefined(payload.video_count ?? payload.videoCount) ?? undefined;

    return {
      collectionId,
      type,
      uniqueId: uniqueId ?? undefined,
      fileCount: toNumberOrUndefined(payload.file_count ?? payload.fileCount) ?? filenames.length,
      filenames,
      title,
      description,
      price,
      discountPrice,
      purchaseCount,
      imageCount,
      videoCount,
      coverImage,
      isFree: primaryMetadata?.isFree,
      isFeatured: primaryMetadata?.isFeatured,
      companionId: primaryMetadata?.companionId,
      createdTime: primaryMetadata?.createdTime,
    };
  };

  const findCollectionMessageIndex = (criteria: {
    collectionId?: number;
    uniqueId?: string | number | null;
  }): number => {
    const { collectionId, uniqueId } = criteria;
    const uniqueKey = toKey(uniqueId);
    return messages.value.findIndex((msg) => {
      if (!COLLECTION_MESSAGE_TYPES.has(msg.type as MessageType)) return false;
      const content = msg.content as Partial<CollectionMessageContent> | undefined;
      if (collectionId !== undefined && content?.id === collectionId) {
        return true;
      }
      if (uniqueKey) {
        const msgUniqueKey = toKey((msg as any).unique_id);
        const idKey = toKey(msg.id as any);
        if (msgUniqueKey === uniqueKey || idKey === uniqueKey) return true;
      }
      return false;
    });
  };

  // 回退查找：获取最近一个处于购买中，或未购买的合集营销消息索引
  const findLatestPendingCollectionIndex = (): number => {
    // 优先查找 isPurchasing 为 true 的项
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const msg = messages.value[i];
      if (!COLLECTION_MESSAGE_TYPES.has(msg.type as MessageType)) continue;
      const content = msg.content as Partial<CollectionMessageContent> | undefined;
      if (content && content.isPurchasing) return i;
    }
    // 其次查找 purchased === false 的项
    for (let i = messages.value.length - 1; i >= 0; i--) {
      const msg = messages.value[i];
      if (!COLLECTION_MESSAGE_TYPES.has(msg.type as MessageType)) continue;
      const content = msg.content as Partial<CollectionMessageContent> | undefined;
      if (content && content.purchased === false) return i;
    }
    return -1;
  };

  const applyCollectionMetadataUpdate = (
    wsMessage: WebSocketMessage,
    metadata: NormalizedCollectionMetadata
  ) => {
    const timestamp = wsMessage.timestamp || new Date().toISOString();

    const patch: Partial<CollectionMessageContent> = {
      id: metadata.id,
      title: metadata.title,
      description: metadata.description,
      price: metadata.price ?? null,
      discountPrice: metadata.discountPrice ?? null,
      purchaseCount: metadata.purchaseCount,
      isFree: metadata.isFree,
      isFeatured: metadata.isFeatured,
      imageCount: metadata.imageCount,
      videoCount: metadata.videoCount,
      coverImage: metadata.coverImage,
      createdTime: metadata.createdTime,
      companionId: metadata.companionId,
      purchased: true,
      isPurchasing: false,
    };

    let targetIndex = findCollectionMessageIndex({
      collectionId: metadata.id,
    });

    if (targetIndex === -1) {
      targetIndex = findLatestPendingCollectionIndex();
    }

    if (targetIndex !== -1) {
      const currentMessage = messages.value[targetIndex];
      const currentContent = (currentMessage.content as CollectionMessageContent) || {
        id: metadata.id,
        imageCount: 0,
        videoCount: 0,
        purchased: false,
        assetGroups: [],
      };

      const mergedContent: CollectionMessageContent = {
        ...currentContent,
        ...patch,
        imageCount: patch.imageCount ?? currentContent.imageCount ?? 0,
        videoCount: patch.videoCount ?? currentContent.videoCount ?? 0,
        purchaseCount: patch.purchaseCount ?? currentContent.purchaseCount,
        assetGroups: currentContent.assetGroups ?? [],
      };

      const updatedMessage: ChatMessage = {
        ...currentMessage,
        content: mergedContent,
        type: MessageType.collection_marketing,
        time: timestamp,
      };

      messages.value[targetIndex] = updatedMessage;
      saveMessageToStorage(updatedMessage);
      return;
    }

    const fallbackContent: CollectionMessageContent = {
      id: metadata.id,
      title: metadata.title,
      description: metadata.description,
      price: metadata.price ?? null,
      discountPrice: metadata.discountPrice ?? null,
      purchaseCount: metadata.purchaseCount,
      isFree: metadata.isFree,
      isFeatured: metadata.isFeatured,
      imageCount: metadata.imageCount,
      videoCount: metadata.videoCount,
      coverImage: metadata.coverImage,
      createdTime: metadata.createdTime,
      companionId: metadata.companionId,
      purchased: true,
      isPurchasing: false,
      assetGroups: [],
    };

    const newMessage: ChatMessage = {
      id: metadata.id ?? `collection-${metadata.id}-${Date.now()}`,
      content: fallbackContent,
      time: timestamp,
      type: MessageType.collection_marketing,
      avatar: chatStore.currentChat?.t_head_image,
      isSelf: false,
    };

    addMessage(newMessage);
    saveMessageToStorage(newMessage);
  };

  const handleCollectionMarketing = (wsMessage: WebSocketMessage) => {
    const payload = wsMessage.content ?? wsMessage.raw?.data ?? wsMessage.raw;
    const content = buildCollectionMarketingContent(payload);
    if (!content) {
      console.warn("未能解析合集营销消息", wsMessage);
      return;
    }

    const timestamp = wsMessage.timestamp || new Date().toISOString();
    
    // 提取 unique_id 作为唯一标识符
    const uniqueKey = extractUniqueIdentifier(
      payload?.unique_id ?? payload?.uniqueId,
      payload,
      wsMessage.raw
    );
    
    // 只基于 unique_id 查找已存在的消息
    // 不同的 unique_id 代表不同的消息，即使 collectionId 相同也要创建新消息
    let existingIndex = -1;
    if (uniqueKey) {
      existingIndex = messages.value.findIndex((msg) => {
        if (!COLLECTION_MESSAGE_TYPES.has(msg.type as MessageType)) return false;
        const msgUniqueKey = toKey((msg as any).unique_id);
        return msgUniqueKey === uniqueKey;
      });
    }

    if (existingIndex !== -1) {
      const existingMessage = messages.value[existingIndex];
      const existingContent = (existingMessage.content as CollectionMessageContent) || {
        id: content.id,
        imageCount: 0,
        videoCount: 0,
        purchased: false,
        assetGroups: [],
      };

      const mergedContent: CollectionMessageContent = {
        ...existingContent,
        ...content,
        assetGroups: mergeAssetGroups(existingContent.assetGroups, content.assetGroups),
        purchased: content.purchased ?? existingContent.purchased,
        isPurchasing:
          content.isPurchasing !== undefined
            ? content.isPurchasing
            : existingContent.isPurchasing,
      };

      const updatedMessage: ChatMessage = {
        ...existingMessage,
        content: mergedContent,
        type: MessageType.collection_marketing,
        time: timestamp,
        unique_id: uniqueKey,
      };

      messages.value[existingIndex] = updatedMessage;
      saveMessageToStorage(updatedMessage);
      return;
    }

    // 创建新消息
    const chatMessage: ChatMessage = {
      id: uniqueKey ?? `collection-${content.id}-${Date.now()}`,
      unique_id: uniqueKey,
      content,
      time: timestamp,
      type: MessageType.collection_marketing,
      avatar: chatStore.currentChat?.t_head_image,
      isSelf: false,
    };

    addMessage(chatMessage);
    saveMessageToStorage(chatMessage);
  };

  const applyCollectionPurchase = (
    wsMessage: WebSocketMessage,
    normalized: CollectionPurchaseSuccessContent
  ) => {
    const timestamp = wsMessage.timestamp || new Date().toISOString();
    const assetGroup: CollectionAssetGroup = {
      type: normalized.type,
      filenames: normalized.filenames,
      fileCount: normalized.fileCount ?? normalized.filenames.length,
    };

    let targetIndex = findCollectionMessageIndex({
      collectionId: normalized.collectionId,
      uniqueId: normalized.uniqueId,
    });
    if (targetIndex === -1) {
      targetIndex = findLatestPendingCollectionIndex();
    }

    if (targetIndex !== -1) {
      const currentMessage = messages.value[targetIndex];
      const currentContent = (currentMessage.content as CollectionMessageContent) || {
        id: normalized.collectionId ?? Date.now(),
        imageCount: 0,
        videoCount: 0,
        purchased: false,
        assetGroups: [],
      };

      const nextPurchaseCount = normalized.purchaseCount ?? currentContent.purchaseCount;
      const nextDescription = currentContent.description ?? normalized.description;
      const nextDiscountPrice =
        currentContent.discountPrice ??
        normalized.discountPrice ??
        (typeof normalized.price === "number" ? normalized.price : null);
      const nextIsFree =
        normalized.isFree ?? currentContent.isFree ?? (typeof normalized.price === "number" ? normalized.price === 0 : undefined);
      const nextIsFeatured = normalized.isFeatured ?? currentContent.isFeatured;
      const nextCompanionId = currentContent.companionId ?? normalized.companionId;
      const nextCreatedTime = currentContent.createdTime ?? normalized.createdTime;

      const nextImageCount = normalized.type === "collection_image"
        ? Math.max(
            currentContent.imageCount ?? 0,
            normalized.fileCount ?? normalized.filenames.length
          )
        : currentContent.imageCount ?? 0;

      const nextVideoCount = normalized.type === "collection_video"
        ? Math.max(
            currentContent.videoCount ?? 0,
            normalized.fileCount ?? normalized.filenames.length
          )
        : currentContent.videoCount ?? 0;

      const mergedContent: CollectionMessageContent = {
        ...currentContent,
        title: currentContent.title ?? normalized.title,
        description: nextDescription,
        price: currentContent.price ?? normalized.price ?? null,
        discountPrice: nextDiscountPrice ?? currentContent.price ?? null,
        purchaseCount: nextPurchaseCount,
        isFree: typeof nextIsFree === "boolean" ? nextIsFree : currentContent.isFree,
        isFeatured: nextIsFeatured,
        coverImage: currentContent.coverImage ?? normalized.coverImage,
        companionId: nextCompanionId,
        createdTime: nextCreatedTime,
        imageCount: nextImageCount,
        videoCount: nextVideoCount,
        purchased: true,
        isPurchasing: false,
        assetGroups: mergeAssetGroups(currentContent.assetGroups, [assetGroup]),
      };

      const updatedMessage: ChatMessage = {
        ...currentMessage,
        content: mergedContent,
        type: MessageType.collection_marketing,
        time: timestamp,
        unique_id: normalized.uniqueId ?? currentMessage.unique_id,
      };

      messages.value[targetIndex] = updatedMessage;
      saveMessageToStorage(updatedMessage);
      return;
    }

    const fallbackId = normalized.collectionId ?? Date.now();
    const latestIndex = findLatestPendingCollectionIndex();
    if (latestIndex !== -1) {
      const currentMessage = messages.value[latestIndex];
      const currentContent = (currentMessage.content as CollectionMessageContent) || {
        id: fallbackId,
        imageCount: 0,
        videoCount: 0,
        purchased: false,
        assetGroups: [],
      };

      const nextPurchaseCount = normalized.purchaseCount ?? currentContent.purchaseCount;
      const nextDescription = currentContent.description ?? normalized.description;
      const nextDiscountPrice =
        currentContent.discountPrice ??
        normalized.discountPrice ??
        (typeof normalized.price === "number" ? normalized.price : null);
      const nextIsFree =
        normalized.isFree ?? currentContent.isFree ?? (typeof normalized.price === "number" ? normalized.price === 0 : undefined);
      const nextIsFeatured = normalized.isFeatured ?? currentContent.isFeatured;
      const nextCompanionId = currentContent.companionId ?? normalized.companionId;
      const nextCreatedTime = currentContent.createdTime ?? normalized.createdTime;

      const nextImageCount = normalized.type === "collection_image"
        ? Math.max(
            currentContent.imageCount ?? 0,
            normalized.fileCount ?? normalized.filenames.length
          )
        : currentContent.imageCount ?? 0;
      const nextVideoCount = normalized.type === "collection_video"
        ? Math.max(
            currentContent.videoCount ?? 0,
            normalized.fileCount ?? normalized.filenames.length
          )
        : currentContent.videoCount ?? 0;
      const mergedContent: CollectionMessageContent = {
        ...currentContent,
        title: currentContent.title ?? normalized.title,
        description: nextDescription,
        price: currentContent.price ?? normalized.price ?? null,
        discountPrice: nextDiscountPrice ?? currentContent.price ?? null,
        purchaseCount: nextPurchaseCount,
        isFree: typeof nextIsFree === "boolean" ? nextIsFree : currentContent.isFree,
        isFeatured: nextIsFeatured,
        coverImage: currentContent.coverImage ?? normalized.coverImage,
        companionId: nextCompanionId,
        createdTime: nextCreatedTime,
        imageCount: nextImageCount,
        videoCount: nextVideoCount,
        purchased: true,
        isPurchasing: false,
        assetGroups: mergeAssetGroups(currentContent.assetGroups, [assetGroup]),
      };
      const updatedMessage: ChatMessage = {
        ...currentMessage,
        content: mergedContent,
        type: MessageType.collection_marketing,
        time: timestamp,
        unique_id: normalized.uniqueId ?? currentMessage.unique_id,
      };
      messages.value[latestIndex] = updatedMessage;
      saveMessageToStorage(updatedMessage);
      return;
    }

    const fallbackContent: CollectionMessageContent = {
      id: fallbackId,
      title: normalized.title,
      description: normalized.description,
      price: normalized.price ?? null,
      discountPrice:
        normalized.discountPrice ??
        (typeof normalized.price === "number" ? normalized.price : null),
      purchaseCount: normalized.purchaseCount,
      isFree:
        typeof normalized.isFree === "boolean"
          ? normalized.isFree
          : typeof normalized.price === "number"
            ? normalized.price === 0
            : undefined,
      isFeatured: normalized.isFeatured,
      imageCount: normalized.type === "collection_image" ? normalized.fileCount ?? normalized.filenames.length : 0,
      videoCount: normalized.type === "collection_video" ? normalized.fileCount ?? normalized.filenames.length : 0,
      coverImage: normalized.coverImage,
      companionId: normalized.companionId,
      createdTime: normalized.createdTime,
      purchased: true,
      isPurchasing: false,
      assetGroups: [assetGroup],
    };
    const newMessage: ChatMessage = {
      id: normalized.uniqueId ?? `collection-${fallbackId}-${Date.now()}`,
      unique_id: normalized.uniqueId,
      content: fallbackContent,
      time: timestamp,
      type: MessageType.collection_marketing,
      avatar: chatStore.currentChat?.t_head_image,
      isSelf: false,
    };
    addMessage(newMessage);
    saveMessageToStorage(newMessage);
  };

  const handleCollectionPurchaseSuccess = (wsMessage: WebSocketMessage) => {
    const rawPayload = wsMessage.content ?? wsMessage.raw?.data ?? wsMessage.raw ?? {};
    const metadataList = extractCollectionMetadataList(rawPayload);

    if (metadataList.length > 0) {
      metadataList.forEach((metadata) => applyCollectionMetadataUpdate(wsMessage, metadata));
    }

    const normalized = normalizePurchasePayload(rawPayload);
    if (normalized) {
      applyCollectionPurchase(wsMessage, normalized);
    } else if (metadataList.length === 0) {
      console.warn("未能解析合集购买成功消息", wsMessage);
    }
  };

  const handleCollectionPurchaseError = (wsMessage: WebSocketMessage) => {
    const payload = wsMessage.content ?? wsMessage.raw?.data ?? wsMessage.raw ?? {};
    const dataPayload = payload.data ?? payload.payload ?? payload;
    const collectionId = toNumberOrUndefined(
      dataPayload?.collection_id ?? dataPayload?.collectionId ?? payload?.collection_id ?? payload?.collectionId ?? payload?.id
    );
    const uniqueId = extractUniqueIdentifier(
      dataPayload?.unique_id ?? dataPayload?.uniqueId ?? payload?.unique_id ?? payload?.uniqueId,
      dataPayload,
      payload
    );
    const errorMessage = typeof dataPayload?.message === "string" && dataPayload.message.trim().length > 0
      ? dataPayload.message.trim()
      : typeof payload?.message === "string" && payload.message.trim().length > 0
        ? payload.message.trim()
        : t("collectionMessage.purchaseFailed");

    if (collectionId !== undefined) {
      setCollectionPurchasingState(collectionId, false);
    }

    let targetIndex = findCollectionMessageIndex({
      collectionId,
      uniqueId,
    });
    if (targetIndex === -1) {
      targetIndex = findLatestPendingCollectionIndex();
    }

    if (targetIndex !== -1) {
      const currentMessage = messages.value[targetIndex];
      const currentContent = (currentMessage.content as CollectionMessageContent) || null;
      if (currentContent) {
        const nextContent: CollectionMessageContent = {
          ...currentContent,
          isPurchasing: false,
        };
        const updatedMessage: ChatMessage = {
          ...currentMessage,
          content: nextContent,
        };
        messages.value[targetIndex] = updatedMessage;
        saveMessageToStorage(updatedMessage);
      }
    }

    if (errorMessage) {
      window.$message?.error?.(errorMessage);
    }
  };

  const handleCollectionMediaResponse = (wsMessage: WebSocketMessage, explicitType: MessageType) => {
    const normalized = normalizePurchasePayload(
      wsMessage.content ?? wsMessage.raw?.data ?? wsMessage.raw,
      explicitType === MessageType.collection_video ? "collection_video" : "collection_image"
    );
    if (!normalized) {
      console.warn("未能解析合集内容消息", wsMessage);
      return;
    }
    applyCollectionPurchase(wsMessage, normalized);
  };

  /**
   * 处理配额耗尽错误 - 删除text_start消息并显示错误
   */
  const handleQuotaExhausted = (wsMessage: WebSocketMessage) => {
    console.log("处理配额耗尽错误:", wsMessage);

    // 重置回复状态，确保输入框可以重新输入
    isReplying.value = false;

    // 重置所有合集购买状态，防止loading状态卡住
    resetAllCollectionPurchasingStates();

    // 提取 unique_id
    const uniqueKey = extractUniqueIdentifier(
      wsMessage.content,
      wsMessage.raw
    );

    // 提取错误消息内容
    const errorMessage = typeof wsMessage.content === 'object' && wsMessage.content?.message
      ? wsMessage.content.message
      : typeof wsMessage.content?.data?.message === 'string'
        ? wsMessage.content.data.message
        : "免费消息配额已用完，请升级为Pro用户继续使用";

    console.log('配额耗尽错误消息:', errorMessage);

    if (uniqueKey) {
      // 查找具有相同 unique_id 的消息，特别是 text_start 类型的消息
      const targetIndex = findMessageIndexByIdentifiers({
        uniqueId: uniqueKey
      });

      if (targetIndex !== -1) {
        // 直接删除该消息，不显示气泡框
        messages.value.splice(targetIndex, 1);
        console.log(`成功删除具有 unique_id ${uniqueKey} 的 text_start 消息`);
      }
    } else {
      // 如果没有 unique_id，查找最新的 text_start 消息并删除
      const latestStartIndex = findLatestStreamingMessageIndex();
      if (latestStartIndex !== -1) {
        messages.value.splice(latestStartIndex, 1);
        console.log('删除了最新的 streaming 消息');
      }
    }

    // 不显示错误消息弹窗，直接弹出订阅弹窗
    // 弹出开通Pro的弹窗
    try {
      showSubscriptionModal('inline');
    } catch (err) {
      console.error("显示订阅弹窗失败:", err);
    }
  };

  /**
   * 处理聊天配额耗尽错误
   */
  const handleChatExhaustedError = (wsMessage: WebSocketMessage) => {
    console.log("处理聊天配额耗尽错误:", wsMessage);
    handleQuotaExhausted(wsMessage);
  };

  /**
   * 处理余额不足错误 - 显示钻石充值弹窗
   */
  const handleInsufficientBalanceError = (wsMessage: WebSocketMessage) => {
    console.log("处理余额不足错误:", wsMessage);

    // 重置回复状态，确保输入框可以重新输入
    isReplying.value = false;

    // 重置所有合集购买状态，防止loading状态卡住
    resetAllCollectionPurchasingStates();

    // 提取错误消息内容
    const errorMessage = typeof wsMessage.content === 'object' && wsMessage.content?.message
      ? wsMessage.content.message
      : typeof wsMessage.content?.data?.message === 'string'
        ? wsMessage.content.data.message
        : "余额不足，请购买钻石后重试";

    console.log('余额不足错误消息:', errorMessage);

    // 显示错误提示
    // window.$message?.warning?.(errorMessage);

    // 显示钻石充值弹窗
    try {
      showDiamondRechargeModal();
    } catch (err) {
      console.error("显示钻石充值弹窗失败:", err);
    }
  };


  const ensureMessageIdentifiers = (
    target: ChatMessage,
    identifiers: {
      uniqueId?: string | number | null;
    }
  ) => {
    const uniqueKey = toKey(identifiers.uniqueId);
    if (uniqueKey) {
      target.unique_id = uniqueKey;
      if (toKey(target.id as any) !== uniqueKey) {
        target.id = uniqueKey;
      }
    }
  };

  const pickText = (...candidates: Array<unknown>): string | undefined => {
    for (const candidate of candidates) {
      if (typeof candidate === "string" && candidate.trim().length > 0) {
        return candidate;
      }
    }
    return undefined;
  };

  const buildRegularNormalized = (
    wsMessage: WebSocketMessage
  ): NormalizedRegularMessage => ({
    kind: "regular",
    meta: {
      timestamp: wsMessage.timestamp,
      senderId: wsMessage.sender_id ?? null,
      recipientId: wsMessage.recipient_id ?? null,
      rawType: typeof wsMessage.type === "string" ? wsMessage.type : "",
      raw: wsMessage.raw,
    },
    payload: {
      text:
        typeof wsMessage.content === "string"
          ? wsMessage.content
          : wsMessage.content?.message,
      content: wsMessage.content,
    },
  });

  const handleLegacyFallback = (wsMessage: WebSocketMessage) => {
    if (wsMessage.type === MessageType.error && wsMessage.content) {
      const messageText =
        typeof wsMessage.content === "string"
          ? wsMessage.content
          : wsMessage.content?.message ?? "发生未知错误";
      handleErrorIncoming(
        {
          kind: "error",
          context: "unknown",
          payload: {
            message: messageText,
            error_code:
              typeof wsMessage.content === "object"
                ? wsMessage.content?.error_code
                : undefined,
            raw: wsMessage.content,
          },
          meta: {
            timestamp: wsMessage.timestamp,
            senderId: wsMessage.sender_id ?? null,
            recipientId: wsMessage.recipient_id ?? null,
            rawType: typeof wsMessage.type === "string" ? wsMessage.type : "",
            raw: wsMessage.raw,
          },
        },
        wsMessage
      );
      return;
    }

    if (wsMessage.type === MessageType.message || typeof wsMessage.content === "string") {
      handleRegularIncoming(buildRegularNormalized(wsMessage), wsMessage);
      return;
    }

    if (wsMessage.type === MessageType.message_exhausted_error) {
      // 处理配额耗尽错误，删除 text_start 消息
      handleQuotaExhausted(wsMessage);
      return;
    }

    console.warn("未能识别的消息类型，已忽略:", wsMessage);
  };

  const handleSystemNotification = (message: NormalizedSystemMessage) => {
    if (message.systemType === "quota_exhausted") {
      try {
        showSubscriptionModal('inline');
      } catch (err) {
        console.error("显示订阅弹窗失败:", err);
      }
    }
  };

  const handleRegularIncoming = (
    message: NormalizedRegularMessage,
    wsMessage: WebSocketMessage
  ) => {
    const resolvedText = pickText(
      message.payload.text,
      typeof message.payload.content === "string"
        ? message.payload.content
        : message.payload.content?.message,
      typeof message.payload.content === "object"
        ? message.payload.content?.content
        : undefined
    );

    if (!resolvedText) return;

    const incomingTypeRaw =
      (typeof wsMessage.type === "string" && wsMessage.type) ||
      (typeof message.meta.rawType === "string" && message.meta.rawType) ||
      "";
    const incomingType = incomingTypeRaw.toLowerCase();
    const mappedType =
      incomingType === MessageType.message_text_hidden
        ? MessageType.message_text_hidden
        : incomingType === MessageType.text_hidden
          ? MessageType.text_hidden
          : MessageType.message;

    const uniqueKey = extractUniqueIdentifier(
      message.payload.content,
      message.payload.text,
      wsMessage.content,
      wsMessage.raw
    );

    // AI回复完成，设置isReplying为false
    isReplying.value = false;

    const chatMessage: ChatMessage = {
      id: uniqueKey ?? createLocalMessageId(),
      unique_id: uniqueKey,
      content: message.payload.content ?? resolvedText ?? "",
      time: wsMessage.timestamp || new Date().toISOString(),
      type: mappedType,
      avatar: chatStore.currentChat?.t_head_image,
      isSelf: false,
      sender_id: wsMessage.sender_id || undefined,
      recipient_id: wsMessage.recipient_id || undefined,
      isLoading: false,
      isTyping: false,
      hasError: false,
      displayedText: resolvedText ?? (typeof message.payload.content === "string" ? message.payload.content : ""),
      progress: undefined,
    };

    // 使用统一的消息更新逻辑
    updateOrAddMessage(chatMessage, uniqueKey);
  };

  const handleTextIncoming = (
    message: NormalizedTextMessage,
    wsMessage: WebSocketMessage
  ) => {
    const payload = message.payload;
    const incomingTypeRaw =
      (typeof wsMessage.type === "string" && wsMessage.type) ||
      (typeof message.meta?.rawType === "string" && message.meta.rawType) ||
      "";
    const incomingType = incomingTypeRaw.toLowerCase();
    const isHiddenProgress = incomingType === MessageType.text_progress_hidden;

    if (message.phase === "complete" && payload.success === false) {
      isReplying.value = false;
      handleErrorIncoming(
        {
          kind: "error",
          context: "text",
          payload: {
            message:
              pickText(payload.text, payload.raw?.message, "生成失败") || "生成失败",
            error_code: payload.raw?.error_code,
            raw: payload.raw,
          },
          meta: message.meta,
        },
        wsMessage
      );
      return;
    }

    const timestamp = wsMessage.timestamp || new Date().toISOString();
    const uniqueKey = extractUniqueIdentifier(
      payload.uniqueId,
      payload.raw,
      message.meta?.raw,
      wsMessage.raw
    );
    const identifier = uniqueKey ?? timestamp;
    let targetIndex = findMessageIndexByIdentifiers({
      uniqueId: uniqueKey,
    });
    if (targetIndex === -1) {
      targetIndex = findLatestStreamingMessageIndex();
    }
    const chunkText = pickText(payload.chunk, payload.text);

    switch (message.phase) {
      case "start": {
        isReplying.value = true;
        const statusText =
          pickText(payload.text, payload.raw?.message, "正在准备生成内容...") ||
          "正在准备生成内容...";
        const startContent: StreamStartContent = {
          message: statusText,
          unique_id: uniqueKey ?? undefined,
        };
        const startMessage: ChatMessage = {
          id: identifier,
          unique_id: uniqueKey ?? undefined,
          content: startContent,
          time: timestamp,
          type: MessageType.stream_start,
          avatar: chatStore.currentChat?.t_head_image || "/ai-avatar.png",
          isSelf: false,
          isLoading: true,
          isTyping: false,
          hasError: false,
          displayedText: statusText,
        };
        ensureMessageIdentifiers(startMessage, {
          uniqueId: uniqueKey,
        });
        addMessage(startMessage);
        break;
      }
      case "progress": {
        if (!chunkText) return;

        if (targetIndex === -1) {
          const chunkContent: StreamChunkContent = {
            chunk: chunkText,
            is_vip: Boolean(payload.isVip),
            unique_id: uniqueKey ?? undefined,
          };
          const chunkMessage: ChatMessage = {
            id: identifier || createLocalMessageId(),
            unique_id: uniqueKey ?? undefined,
            content: chunkContent,
            time: timestamp,
            type: isHiddenProgress ? MessageType.text_progress_hidden : MessageType.stream_chunk,
            avatar: chatStore.currentChat?.t_head_image || "/ai-avatar.png",
            isSelf: false,
            isLoading: false,
            isTyping: true,
            hasError: false,
            displayedText: chunkText,
          };
          ensureMessageIdentifiers(chunkMessage, {
            uniqueId: uniqueKey,
          });
          addMessage(chunkMessage);
          return;
        }

        const original = messages.value[targetIndex];
        const current = { ...original };
        const previousType = original.type;
        ensureMessageIdentifiers(current, {
          uniqueId: uniqueKey,
        });
        current.type = isHiddenProgress ? MessageType.text_progress_hidden : MessageType.stream_chunk;
        current.isLoading = false;
        current.isTyping = true;
        current.hasError = false;
        const rawChunk =
          typeof payload.raw?.chunk === "string" ? payload.raw.chunk : undefined;
        const shouldAppend = typeof rawChunk === "string" && rawChunk.length > 0;
        const baseDisplayed =
          previousType === MessageType.stream_start ||
          previousType === MessageType.text_start
            ? ""
            : current.displayedText || "";
        const nextDisplayedText = shouldAppend
          ? (() => {
              // 仅在后端返回显式 chunk 时才追加文本，避免进度提示累加展示
              const appended = baseDisplayed + rawChunk!;
              return chunkText && chunkText.startsWith(baseDisplayed)
                ? chunkText
                : appended;
            })()
          : chunkText;
        current.displayedText = nextDisplayedText;
        current.content = {
          chunk: nextDisplayedText,
          is_vip: Boolean(payload.isVip),
          unique_id: uniqueKey ?? current.unique_id,
        } as StreamChunkContent;
        messages.value[targetIndex] = current;
        break;
      }
      case "complete": {
        const finalText =
          pickText(payload.text, payload.raw?.message) ||
          (targetIndex !== -1 ? messages.value[targetIndex].displayedText : "") ||
          "";

        // AI回复完成，设置isReplying为false
        isReplying.value = false;

        // 检测 finalText 中是否包含媒体链接
        const detectMediaType = (text: string): { isMedia: boolean; type: 'image' | 'video' | null; url: string | null } => {
          if (!text || typeof text !== 'string') return { isMedia: false, type: null, url: null };

          // 匹配以 http://, https://, 或 / 开头的 URL（支持相对路径和绝对路径）
          const urlPattern = /((?:https?:\/\/|\/)[^\s]+\.(mp4|jpg|jpeg|png|webp|gif))/i;
          const match = text.match(urlPattern);

          if (match && match[1]) {
            const rawUrl = match[1];
            const ext = rawUrl.split('.').pop()?.toLowerCase();

            // 将相对路径转换为完整URL
            const fullUrl = getFullAssetUrl(rawUrl);

            if (ext === 'mp4') {
              console.log('[Media Detection] 检测到视频链接:', rawUrl, '-> 完整URL:', fullUrl);
              return { isMedia: true, type: 'video', url: fullUrl };
            } else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(ext || '')) {
              console.log('[Media Detection] 检测到图片链接:', rawUrl, '-> 完整URL:', fullUrl);
              return { isMedia: true, type: 'image', url: fullUrl };
            }
          }

          console.log('[Media Detection] 未检测到媒体链接，原始文本:', text);
          return { isMedia: false, type: null, url: null };
        };

        const mediaInfo = detectMediaType(finalText);
        console.log('[stream_complete] finalText:', finalText);
        console.log('[stream_complete] mediaInfo:', mediaInfo);

        if (targetIndex === -1) {
          let completedMessage: ChatMessage;
          
          if (mediaInfo.isMedia && mediaInfo.type && mediaInfo.url) {
            // 创建媒体消息
            if (mediaInfo.type === 'image') {
              const imageContent = {
                message: "",
                image_url: mediaInfo.url,
                success: true,
                file_type: "IMAGE",
                unique_id: uniqueKey ?? undefined,
              };
              completedMessage = {
                id: identifier || createLocalMessageId(),
                unique_id: uniqueKey ?? undefined,
                response_id: payload.responseId as number | undefined,
                content: imageContent,
                time: timestamp,
                type: MessageType.text_to_image_complete,
                avatar: chatStore.currentChat?.t_head_image || "/ai-avatar.png",
                isSelf: false,
                isLoading: false,
                isTyping: false,
                hasError: false,
                displayedText: finalText,
              };
            } else {
              // video
              const videoContent = {
                message: "",
                video_url: mediaInfo.url,
                success: true,
                file_type: "VIDEO",
                unique_id: uniqueKey ?? undefined,
              };
              completedMessage = {
                id: identifier || createLocalMessageId(),
                unique_id: uniqueKey ?? undefined,
                response_id: payload.responseId as number | undefined,
                content: videoContent,
                time: timestamp,
                type: MessageType.text_to_video_complete,
                avatar: chatStore.currentChat?.t_head_image || "/ai-avatar.png",
                isSelf: false,
                isLoading: false,
                isTyping: false,
                hasError: false,
                displayedText: finalText,
                videoUrl: mediaInfo.url,
              };
            }
          } else {
            // 普通文本消息
            const completeContent: StreamCompleteContent = {
              full_content: finalText,
              is_vip: Boolean(payload.isVip),
              unique_id: uniqueKey ?? undefined,
            };
            completedMessage = {
              id: identifier || createLocalMessageId(),
              unique_id: uniqueKey ?? undefined,
              response_id: payload.responseId as number | undefined,
              content: completeContent,
              time: timestamp,
              type: MessageType.stream_complete,
              avatar: chatStore.currentChat?.t_head_image || "/ai-avatar.png",
              isSelf: false,
              isLoading: false,
              isTyping: false,
              hasError: false,
              displayedText: finalText,
            };
          }
          
          // 使用统一的消息更新逻辑
          updateOrAddMessage(completedMessage, uniqueKey);
          return;
        }

        const current = { ...messages.value[targetIndex] };
        ensureMessageIdentifiers(current, {
          uniqueId: uniqueKey,
        });
        
        // 添加 response_id
        if (payload.responseId) {
          current.response_id = payload.responseId as number;
        }
        
        if (mediaInfo.isMedia && mediaInfo.type && mediaInfo.url) {
          // 更新为媒体消息
          if (mediaInfo.type === 'image') {
            current.type = MessageType.text_to_image_complete;
            current.content = {
              message: "",
              image_url: mediaInfo.url,
              success: true,
              file_type: "IMAGE",
              unique_id: uniqueKey ?? current.unique_id,
            };
          } else {
            // video
            current.type = MessageType.text_to_video_complete;
            current.content = {
              message: "",
              video_url: mediaInfo.url,
              success: true,
              file_type: "VIDEO",
              unique_id: uniqueKey ?? current.unique_id,
            };
            current.videoUrl = mediaInfo.url;
          }
        } else {
          // 更新为普通文本消息
          current.type = MessageType.stream_complete;
          current.content = {
            full_content: finalText,
            is_vip: Boolean(payload.isVip),
            unique_id: uniqueKey ?? current.unique_id,
          } as StreamCompleteContent;
        }
        
        current.isLoading = false;
        current.isTyping = false;
        current.hasError = false;
        current.displayedText = finalText;
        messages.value[targetIndex] = current;
        saveMessageToStorage(current);
        break;
      }
    }
  };

  const handleImageIncoming = (
    message: NormalizedImageMessage,
    wsMessage: WebSocketMessage
  ) => {
    const payload = message.payload;
    const timestamp = wsMessage.timestamp || new Date().toISOString();
    const incomingTypeRaw =
      (typeof wsMessage.type === "string" && wsMessage.type) ||
      (typeof message.meta.rawType === "string" && message.meta.rawType) ||
      "";
    const incomingType = incomingTypeRaw.toLowerCase();
    const isHiddenImageMessage =
      incomingType === MessageType.message_image_hidden ||
      incomingType === MessageType.image_hidden;
    const uniqueKey = extractUniqueIdentifier(
      payload.uniqueId,
      payload.raw,
      message.meta?.raw,
      wsMessage.raw
    );
    const identifier = uniqueKey ??
      (typeof payload.imageUrl === "string" ? payload.imageUrl : undefined) ??
      timestamp;
    let targetIndex = findMessageIndexByIdentifiers({
      uniqueId: uniqueKey,
    });

    const baseContent = {
      message: payload.message ?? "",
      image_url: payload.imageUrl ?? null,
      success: payload.success,
      file_type: payload.fileType ?? "IMAGE",
      unique_id: uniqueKey ?? undefined,
    };

    switch (message.phase) {
      case "start": {
        isReplying.value = true;
        let resolvedIndex = targetIndex;
        if (resolvedIndex === -1) {
          resolvedIndex = findLatestActiveMediaMessageIndex([
            MessageType.text_start,
            MessageType.stream_start,
            MessageType.text_to_image_start,
            MessageType.text_to_image_progress,
          ]);
        }

        if (resolvedIndex !== -1) {
          const current = { ...messages.value[resolvedIndex] };
          ensureMessageIdentifiers(current, {
            uniqueId: uniqueKey,
          });
          current.type = MessageType.text_to_image_start;
          current.isLoading = true;
          current.loadingIndicator = "blobs";
          current.hasError = false;
          current.isTyping = false;
          current.displayedText = baseContent.message || "正在生成图像...";
          current.progress = payload.progress ?? 0;
          current.content = baseContent as ImageGenerationStartContent;
          messages.value[resolvedIndex] = current;
        } else {
          const startMessage: ChatMessage = {
            id: identifier || createLocalMessageId(),
            unique_id: uniqueKey ?? undefined,
            content: baseContent as ImageGenerationStartContent,
            time: timestamp,
            type: MessageType.text_to_image_start,
            avatar: chatStore.currentChat?.t_head_image || "/ai-avatar.png",
            isSelf: false,
            isLoading: true,
            loadingIndicator: "blobs",
            hasError: false,
            displayedText: baseContent.message || "正在生成图像...",
            progress: payload.progress ?? 0,
          };
          ensureMessageIdentifiers(startMessage, {
            uniqueId: uniqueKey,
          });
          addMessage(startMessage);
        }
        break;
      }
      case "progress": {
        let resolvedIndex = targetIndex;
        if (resolvedIndex === -1) {
          resolvedIndex = findLatestActiveMediaMessageIndex([
            MessageType.text_start,
            MessageType.text_progress,
            MessageType.stream_start,
            MessageType.stream_chunk,
            MessageType.text_to_image_start,
            MessageType.text_to_image_progress,
          ]);
        }

        if (resolvedIndex === -1) {
          const progressMessage: ChatMessage = {
            id: identifier || createLocalMessageId(),
            unique_id: uniqueKey ?? undefined,
            content: {
              ...baseContent,
              progress: payload.progress,
            } as ImageGenerationProgressContent,
            time: timestamp,
            type: MessageType.text_to_image_progress,
            avatar: chatStore.currentChat?.t_head_image || "/ai-avatar.png",
            isSelf: false,
            isLoading: true,
            loadingIndicator: "blobs",
            hasError: false,
            displayedText: baseContent.message || "正在生成图像...",
            progress: payload.progress ?? 0,
          };
          ensureMessageIdentifiers(progressMessage, {
            uniqueId: uniqueKey,
          });
          addMessage(progressMessage);
          return;
        }

        const current = { ...messages.value[resolvedIndex] };
        ensureMessageIdentifiers(current, {
          uniqueId: uniqueKey,
        });
        current.type = MessageType.text_to_image_progress;
        current.isLoading = true;
        current.loadingIndicator = "blobs";
        current.hasError = false;
        current.displayedText = baseContent.message || current.displayedText;
        current.progress = payload.progress ?? current.progress;
        current.content = {
          ...baseContent,
          progress: payload.progress,
        } as ImageGenerationProgressContent;
        messages.value[resolvedIndex] = current;
        break;
      }
    case "complete": {
        const success = payload.success !== false;
        // AI回复完成，设置isReplying为false
        isReplying.value = false;
        let resolvedIndex = targetIndex;
        if (resolvedIndex === -1) {
          resolvedIndex = findLatestActiveMediaMessageIndex([
            MessageType.text_start,
            MessageType.text_progress,
            MessageType.stream_start,
            MessageType.stream_chunk,
            MessageType.text_to_image_start,
            MessageType.text_to_image_progress,
          ]);
        }

        if (resolvedIndex === -1) {
          const completeMessage: ChatMessage = {
            id: identifier || createLocalMessageId(),
            unique_id: uniqueKey ?? undefined,
            content: baseContent as ImageGenerationCompleteContent,
            time: timestamp,
            type: success
              ? isHiddenImageMessage
                ? MessageType.message_image_hidden
                : MessageType.text_to_image_complete
              : MessageType.error,
            avatar: chatStore.currentChat?.t_head_image || "/ai-avatar.png",
            isSelf: false,
            isLoading: false,
            hasError: !success,
            displayedText:
              baseContent.message || (success ? "图像生成完成" : "图像生成失败"),
            progress: success ? 100 : payload.progress ?? 0,
          };
          // 使用统一的消息更新逻辑
          updateOrAddMessage(completeMessage, uniqueKey);
          if (!success) {
            error.value = completeMessage.displayedText || null;
          }
          return;
        }

        const current = { ...messages.value[resolvedIndex] };
        ensureMessageIdentifiers(current, {
          uniqueId: uniqueKey,
        });
        current.isLoading = false;
        current.hasError = !success;
        current.displayedText =
          baseContent.message || (success ? "图像生成完成" : "图像生成失败");
        current.progress = success ? 100 : payload.progress ?? current.progress;
        current.type = success
          ? isHiddenImageMessage
            ? MessageType.message_image_hidden
            : MessageType.text_to_image_complete
          : MessageType.error;
        current.content = baseContent as ImageGenerationCompleteContent;
        delete current.loadingIndicator;
        messages.value[resolvedIndex] = current;
        saveMessageToStorage(current);
        if (!success) {
          error.value = current.displayedText || null;
        }
        break;
      }
    }
  };

  const handleVideoIncoming = (
    message: NormalizedVideoMessage,
    wsMessage: WebSocketMessage
  ) => {
    const payload = message.payload;
    const timestamp = wsMessage.timestamp || new Date().toISOString();
    const incomingTypeRaw =
      (typeof wsMessage.type === "string" && wsMessage.type) ||
      (typeof message.meta.rawType === "string" && message.meta.rawType) ||
      "";
    const incomingType = incomingTypeRaw.toLowerCase();
    const isHiddenVideoMessage =
      incomingType === MessageType.message_video_hidden ||
      incomingType === MessageType.video_hidden;
    const uniqueKey = extractUniqueIdentifier(
      payload.uniqueId,
      payload.raw,
      message.meta?.raw,
      wsMessage.raw
    );
    const identifier = uniqueKey ??
      toKey(payload.fileId) ??
      timestamp;
    let targetIndex = findMessageIndexByIdentifiers({
      uniqueId: uniqueKey,
      fileId: payload.fileId,
    });

    const baseContent = {
      message: payload.message ?? "",
      success: payload.success,
      video_url: payload.videoUrl ?? null,
      file_type: payload.fileType ?? "VIDEO",
      file_id: payload.fileId ?? undefined,
      mode: payload.mode,
      unique_id: uniqueKey ?? undefined,
    };

    switch (message.phase) {
      case "start": {
        isReplying.value = true;
        let resolvedIndex = targetIndex;
        if (resolvedIndex === -1) {
          resolvedIndex = findLatestActiveMediaMessageIndex([
            MessageType.text_start,
            MessageType.stream_start,
            MessageType.text_to_video_start,
            MessageType.text_to_video_progress,
          ]);
        }

        if (resolvedIndex !== -1) {
          const current = { ...messages.value[resolvedIndex] };
          ensureMessageIdentifiers(current, {
            uniqueId: uniqueKey,
          });
          current.type = MessageType.text_to_video_start;
          current.isLoading = true;
          current.loadingIndicator = "blobs";
          current.hasError = false;
          current.isTyping = false;
          current.displayedText = baseContent.message || "正在生成视频...";
          current.progress = payload.progress ?? 0;
          current.content = baseContent as VideoGenerationStartContent;
          messages.value[resolvedIndex] = current;
        } else {
          const startMessage: ChatMessage = {
            id: identifier || createLocalMessageId(),
            unique_id: uniqueKey ?? undefined,
            content: baseContent as VideoGenerationStartContent,
            time: timestamp,
            type: MessageType.text_to_video_start,
            avatar: chatStore.currentChat?.t_head_image || "/ai-avatar.png",
            isSelf: false,
            isLoading: true,
            loadingIndicator: "blobs",
            hasError: false,
            displayedText: baseContent.message || "正在生成视频...",
            progress: payload.progress ?? 0,
          };
          ensureMessageIdentifiers(startMessage, {
            uniqueId: uniqueKey,
          });
          addMessage(startMessage);
        }
        break;
      }
      case "progress": {
        let resolvedIndex = targetIndex;
        if (resolvedIndex === -1) {
          resolvedIndex = findLatestActiveMediaMessageIndex([
            MessageType.text_start,
            MessageType.text_progress,
            MessageType.stream_start,
            MessageType.stream_chunk,
            MessageType.text_to_video_start,
            MessageType.text_to_video_progress,
          ]);
        }

        if (resolvedIndex === -1) {
          const progressMessage: ChatMessage = {
            id: identifier || createLocalMessageId(),
            unique_id: uniqueKey ?? undefined,
            content: baseContent as VideoGenerationProgressContent,
            time: timestamp,
            type: MessageType.text_to_video_progress,
            avatar: chatStore.currentChat?.t_head_image || "/ai-avatar.png",
            isSelf: false,
            isLoading: true,
            loadingIndicator: "blobs",
            hasError: false,
            displayedText: baseContent.message || "正在生成视频...",
            progress: payload.progress ?? 0,
          };
          ensureMessageIdentifiers(progressMessage, {
            uniqueId: uniqueKey,
          });
          addMessage(progressMessage);
          return;
        }

        const current = { ...messages.value[resolvedIndex] };
        ensureMessageIdentifiers(current, {
          uniqueId: uniqueKey,
        });
        current.type = MessageType.text_to_video_progress;
        current.isLoading = true;
        current.loadingIndicator = "blobs";
        current.hasError = false;
        current.displayedText = baseContent.message || current.displayedText;
        current.progress = payload.progress ?? current.progress;
        current.content = baseContent as VideoGenerationProgressContent;
        messages.value[resolvedIndex] = current;
        break;
      }
      case "complete": {
        const success = payload.success !== false;
        // AI回复完成，设置isReplying为false
        isReplying.value = false;
        let resolvedIndex = targetIndex;
        if (resolvedIndex === -1) {
          resolvedIndex = findLatestActiveMediaMessageIndex([
            MessageType.text_start,
            MessageType.text_progress,
            MessageType.stream_start,
            MessageType.stream_chunk,
            MessageType.text_to_video_start,
            MessageType.text_to_video_progress,
          ]);
        }

        if (resolvedIndex === -1) {
          const completeMessage: ChatMessage = {
            id: identifier || createLocalMessageId(),
            unique_id: uniqueKey ?? undefined,
            content: baseContent as VideoGenerationCompleteContent,
            time: timestamp,
            type: success
              ? isHiddenVideoMessage
                ? MessageType.message_video_hidden
                : MessageType.text_to_video_complete
              : MessageType.error,
            avatar: chatStore.currentChat?.t_head_image || "/ai-avatar.png",
            isSelf: false,
            isLoading: false,
            hasError: !success,
            displayedText:
              baseContent.message || (success ? "视频生成完成" : "视频生成失败"),
            progress: success ? 100 : payload.progress ?? 0,
            videoUrl: payload.videoUrl ?? undefined,
          };
          // 使用统一的消息更新逻辑
          updateOrAddMessage(completeMessage, uniqueKey);
          if (!success) {
            error.value = completeMessage.displayedText || null;
          }
          return;
        }

        const current = { ...messages.value[resolvedIndex] };
        ensureMessageIdentifiers(current, {
          uniqueId: uniqueKey,
        });
        current.isLoading = false;
        current.hasError = !success;
        current.displayedText =
          baseContent.message || (success ? "视频生成完成" : "视频生成失败");
        current.progress = success ? 100 : payload.progress ?? current.progress;
        current.type = success
          ? isHiddenVideoMessage
            ? MessageType.message_video_hidden
            : MessageType.text_to_video_complete
          : MessageType.error;
        current.content = baseContent as VideoGenerationCompleteContent;
        current.videoUrl = payload.videoUrl ?? current.videoUrl;
        delete current.loadingIndicator;
        messages.value[resolvedIndex] = current;
        saveMessageToStorage(current);
        if (!success) {
          error.value = current.displayedText || null;
        }
        break;
      }
    }
  };

  const handleErrorIncoming = (
    message: NormalizedErrorMessage,
    wsMessage: WebSocketMessage
  ) => {
    const errorPayload = message.payload;
    const messageText = errorPayload.message || "发生未知错误";

    // AI回复出错，设置isReplying为false
    isReplying.value = false;

    // 如果是配额耗尽相关错误，弹出订阅弹窗（不创建错误消息）
    if (
      messageText.includes("免费消息配额已用完") ||
      messageText.includes("请升级为Pro用户继续使用")
    ) {
      try {
        showSubscriptionModal('inline');
      } catch (err) {
        console.error("显示订阅弹窗失败:", err);
      }
      // 注意：此处不创建错误消息也不设置 error.value，避免重复提示
      return;
    }

    const rawType = errorPayload.raw?.type ?? wsMessage.raw?.type;
    if (rawType === MessageType.purchase_collection || rawType === "purchase_collection") {
      const collectionId = toNumberOrUndefined(
        errorPayload.raw?.collection_id ?? wsMessage.raw?.collection_id
      );
      if (collectionId !== undefined) {
        setCollectionPurchasingState(collectionId, false);
      }
    }

    const uniqueKey = extractUniqueIdentifier(
      (errorPayload as any)?.uniqueId,
      errorPayload.raw,
      wsMessage.raw
    );

    // 尝试找到并更新正在加载中的消息（特别是文生图消息）
    let targetIndex = findMessageIndexByIdentifiers({
      uniqueId: uniqueKey,
    });

    // 如果通过uniqueKey没找到，根据错误类型智能匹配对应的loading消息
    if (targetIndex === -1) {
      // 根据错误消息的原始类型确定要查找的消息类型
      let searchTypes: MessageType[] = [];

      if (rawType === MessageType.text_to_image_start ||
          rawType === MessageType.text_to_image_progress ||
          rawType === "text_to_image" ||
          messageText.includes("图像") ||
          messageText.includes("图片")) {
        // 文生图相关错误
        searchTypes = [
          MessageType.text_to_image_start,
          MessageType.text_to_image_progress,
        ];
      } else if (rawType === MessageType.text_to_video_start ||
                 rawType === MessageType.text_to_video_progress ||
                 rawType === "text_to_video" ||
                 messageText.includes("视频")) {
        // 视频生成相关错误
        searchTypes = [
          MessageType.text_to_video_start,
          MessageType.text_to_video_progress,
        ];
      } else {
        // 通用文本对话错误
        searchTypes = [
          MessageType.stream_start,
          MessageType.stream_chunk,
          MessageType.text_start,
          MessageType.text_progress,
        ];
      }

      targetIndex = findLatestActiveMediaMessageIndex(searchTypes);
    }

    // 如果找到了正在加载的消息，直接更新它而不是创建新的错误消息
    if (targetIndex !== -1) {
      const current = { ...messages.value[targetIndex] };
      ensureMessageIdentifiers(current, {
        uniqueId: uniqueKey,
      });
      current.isLoading = false;
      current.hasError = true;
      current.displayedText = messageText;
      current.type = MessageType.error;
      current.content = errorPayload;
      // 删除加载指示器
      delete current.loadingIndicator;
      delete current.progress;

      messages.value[targetIndex] = current;
      saveMessageToStorage(current);
    } else {
      // 创建错误消息对象
      const errorChatMessage: ChatMessage = {
        id: uniqueKey || createLocalMessageId(),
        unique_id: uniqueKey ?? undefined,
        content: errorPayload,
        time: wsMessage.timestamp || new Date().toISOString(),
        type: MessageType.error,
        avatar: chatStore.currentChat?.t_head_image || "/ai-avatar.png",
        isSelf: false,
        isTyping: false,
        displayedText: messageText,
        isLoading: false,
        hasError: true,
      };

      // 使用统一的消息更新逻辑（优先使用 unique_id，如果没有 unique_id 则直接添加）
      updateOrAddMessage(errorChatMessage, uniqueKey);
    }

    error.value = messageText;
  };

const saveMessageToStorage = (message: ChatMessage) => {
    if (chatStore.currentChat?.companion_id) {
      nextTick(() => {
        chatStore.saveChatMessage(chatStore.currentChat.companion_id, message);
      });
    }
  };

  /**
   * 发送消息
   */
  const sendMessage = async (content: string): Promise<boolean> => {
    if (!content.trim()) {
      console.warn('消息内容为空，无法发送');
      return false;
    }

    // 如果WebSocket未初始化，先尝试初始化
    if (!wsManager || !isConnected.value) {
      console.log('WebSocket未连接，尝试初始化...');
      if (chatStore.currentChat?.id) {
        try {
          await initWebSocket();
        } catch (error) {
          console.error('初始化WebSocket失败:', error);
          return false;
        }
      } else {
        console.warn('未选择聊天对象，无法初始化WebSocket');
        return false;
      }
    }

    // 再次检查wsManager
    if (!wsManager) {
      console.error('WebSocket管理器不存在，发送失败');
      return false;
    }

    // 发送WebSocket消息
    const success = wsManager.sendMessage(content.trim());

    if (success) {
      // 添加自己发送的消息到列表
      const userMessageContent: UserMessageContent = {
        content: content.trim(),
      };

      const selfMessage: ChatMessage = {
        id: Date.now(),
        content: userMessageContent,
        time: new Date().toISOString(),
        type: MessageType.message,
        avatar: authStore.userInfo?.head_image || "",
        isSelf: true,
        sender_id: authStore.userInfo?.id,
        recipient_id: chatStore.currentChat?.companion_id,
      };

      addMessage(selfMessage);

      // 保存用户发送的消息到localStorage
      if (chatStore.currentChat?.companion_id) {
        // 延迟保存，确保消息已添加到列表
        nextTick(() => {
          chatStore.saveChatMessage(
            chatStore.currentChat.companion_id,
            selfMessage
          );
        });
      }
    }

    return success;
  };

  const findExistingMessageIndex = (message: ChatMessage): number => {
    const uniqueKey = toKey((message as any).unique_id ?? message.id);
    const idKey = toKey(message.id as any);
    return messages.value.findIndex((existing) => {
      const existingUnique = toKey((existing as any).unique_id ?? existing.id);
      if (uniqueKey && existingUnique && uniqueKey === existingUnique) {
        return true;
      }
      const existingId = toKey(existing.id as any);
      if (idKey && existingId && idKey === existingId) {
        return true;
      }
      return false;
    });
  };

  const mergeMessageRecord = (existing: ChatMessage, incoming: ChatMessage): ChatMessage => {
    const merged: ChatMessage = {
      ...existing,
      ...incoming,
    };

    const hasOwn = Object.prototype.hasOwnProperty;

    if ((incoming as any).unique_id === undefined && (existing as any).unique_id !== undefined) {
      (merged as any).unique_id = (existing as any).unique_id;
    }
    if (incoming.id === undefined) {
      merged.id = existing.id;
    }
    if (!hasOwn.call(incoming, "content")) {
      merged.content = existing.content;
    }
    if (!hasOwn.call(incoming, "displayedText")) {
      merged.displayedText = existing.displayedText;
    }
    if (!hasOwn.call(incoming, "isLoading")) {
      merged.isLoading = existing.isLoading;
    }
    if (!hasOwn.call(incoming, "isTyping")) {
      merged.isTyping = existing.isTyping;
    }
    if (!hasOwn.call(incoming, "hasError")) {
      merged.hasError = existing.hasError;
    }
    if (!hasOwn.call(incoming, "progress")) {
      merged.progress = existing.progress;
    }

    return merged;
  };

  /**
   * 添加消息到列表
   */
  const addMessage = (message: ChatMessage) => {
    const existingIndex = findExistingMessageIndex(message);
    if (existingIndex !== -1) {
      const merged = mergeMessageRecord(messages.value[existingIndex], message);
      messages.value.splice(existingIndex, 1, merged);
      return;
    }
    messages.value.push(message);
  };

  /**
   * 加载历史消息
   */
  const lastHistoryRequestAt = singleton.lastHistoryRequestAt ?? (singleton.lastHistoryRequestAt = ref<number>(0));
  singleton.historyRequestId = singleton.historyRequestId ?? 0;
  singleton.historyAbortController = singleton.historyAbortController ?? null;

  const loadHistoryMessages = async () => {
    const companionId = chatStore.currentChat?.companion_id ?? null;
    const isFirstPageRequest = historyPage.value === 1 && messages.value.length === 0;
    const companionChanged = companionId !== lastHistoryCompanionId.value;

    if (companionChanged) {
      lastHistoryRequestAt.value = 0;
      lastHistoryCompanionId.value = companionId;
    }

    const now = Date.now();
    if (!isFirstPageRequest && !companionChanged) {
      if (now - lastHistoryRequestAt.value < 2000) {
        if (isLoadingHistory.value) {
          return;
        }
        if (now > lastHistoryRequestAt.value + 50) {
          return;
        }
      }
    }

    if (
      isLoadingHistory.value ||
      !hasMoreHistory.value ||
      !chatStore.currentChat?.companion_id
    )
      return;

    lastHistoryRequestAt.value = now;

    const parseMaybeJson = (value: any) => {
      if (typeof value === "string") {
        try {
          return JSON.parse(value);
        } catch {
          return value;
        }
      }
      return value;
    };

    const normalizeImageHistoryContent = (rawValue: any) => {
      const value = parseMaybeJson(rawValue);
      if (typeof value === "object" && value !== null) {
        return {
          ...value,
          message: value.message ?? "",
          success: value.success ?? true,
          image_url: value.image_url ?? value.url ?? value.imageUrl ?? "",
          file_type: value.file_type ?? value.fileType ?? "IMAGE",
        };
      }
      return {
        message: "",
        success: true,
        image_url: value,
        file_type: "IMAGE",
      };
    };

    const normalizeVideoHistoryContent = (rawValue: any, fallbackId?: number) => {
      const value = parseMaybeJson(rawValue);
      if (typeof value === "object" && value !== null) {
        return {
          ...value,
          message: value.message ?? "",
          success: value.success ?? true,
          video_url: value.video_url ?? value.url ?? value.videoUrl ?? "",
          file_type: value.file_type ?? value.fileType ?? "VIDEO",
          file_id: value.file_id ?? value.fileId ?? fallbackId,
        };
      }
      return {
        message: "",
        success: true,
        video_url: value,
        file_type: "VIDEO",
        file_id: fallbackId,
      };
    };

    isLoadingHistory.value = true;
    try {
      const requestCompanionId = chatStore.currentChat.companion_id;
      const requestAvatar = chatStore.currentChat?.t_head_image;
      singleton.historyRequestId += 1;
      const requestId = singleton.historyRequestId;

      if (singleton.historyAbortController) {
        singleton.historyAbortController.abort();
      }
      singleton.historyAbortController = new AbortController();

      const res = await getHistoryMessagesWithConfig(
        requestCompanionId,
        historyPage.value,
        historyLimit,
        {
          signal: singleton.historyAbortController.signal,
          headers: {
            repeatSubmit: false,
          },
        }
      );

      if (requestId !== singleton.historyRequestId) return;
      if (chatStore.currentChat?.companion_id !== requestCompanionId) return;

      lastHistoryRequestAt.value = Date.now();
      if (res.data.items && res.data.items.length > 0) {
        const historyChatMessages: ChatMessage[] = [];
        res.data.items.forEach((item: HistoryMessage) => {
          // 用户消息（历史中的原始消息）
          historyChatMessages.push({
            id: item.id,
            content: item.content,
            time: item.created_at,
            type: item.type as ChatType,  // 将 string 类型转换为 ChatType
            isSelf: true,
            avatar: authStore.userInfo?.head_image,
          });

          // AI 回复：根据 response_type 正确映射类型与内容格式
          let aiType: ChatType = MessageType.message;
          let aiContent: any;

          const responseType = (item.response_type || "").toLowerCase();
          const parsedResponse = parseMaybeJson(item.response_content);

          switch (responseType) {
            case MessageType.text_hidden:
            case MessageType.message_text_hidden: {
              aiType = MessageType.text_hidden;
              aiContent = parsedResponse;
              break;
            }
            case MessageType.image_hidden:
            case MessageType.message_image_hidden: {
              aiType = MessageType.image_hidden;
              aiContent = normalizeImageHistoryContent(parsedResponse);
              break;
            }
            case "image": {
              aiType = MessageType.text_to_image_complete;
              aiContent = normalizeImageHistoryContent(parsedResponse);
              break;
            }
            case MessageType.video_hidden:
            case MessageType.message_video_hidden: {
              aiType = MessageType.video_hidden;
              aiContent = normalizeVideoHistoryContent(parsedResponse, item.response_id);
              break;
            }
            case "video": {
              aiType = MessageType.text_to_video_complete;
              aiContent = normalizeVideoHistoryContent(parsedResponse, item.response_id);
              break;
            }
            case MessageType.collection_image:
            case MessageType.collection_video: {
              const normalized = normalizePurchasePayload(
                typeof parsedResponse === "object" && parsedResponse !== null
                  ? { ...parsedResponse, type: responseType }
                  : { content: parsedResponse, type: responseType }
              );

              if (normalized) {
                const assetGroup: CollectionAssetGroup = {
                  type: normalized.type,
                  filenames: normalized.filenames,
                  fileCount: normalized.fileCount ?? normalized.filenames.length,
                };

                aiType = MessageType.collection_marketing;
                aiContent = {
                  id: normalized.collectionId ?? item.response_id ?? item.id,
                  title: normalized.title,
                  description: normalized.description,
                  price: normalized.price ?? null,
                  discountPrice:
                    normalized.discountPrice ??
                    (typeof normalized.price === "number" ? normalized.price : null),
                  purchaseCount: normalized.purchaseCount,
                  isFree:
                    typeof normalized.isFree === "boolean"
                      ? normalized.isFree
                      : typeof normalized.price === "number"
                        ? normalized.price === 0
                        : undefined,
                  isFeatured: normalized.isFeatured,
                  imageCount:
                    normalized.type === "collection_image"
                      ? normalized.fileCount ?? normalized.filenames.length
                      : 0,
                  videoCount:
                    normalized.type === "collection_video"
                      ? normalized.fileCount ?? normalized.filenames.length
                      : 0,
                  coverImage: normalized.coverImage,
                  createdTime: normalized.createdTime,
                  companionId: normalized.companionId,
                  purchased: true,
                  isPurchasing: false,
                  assetGroups: [assetGroup],
                } satisfies CollectionMessageContent;
              } else {
                aiType = MessageType.message;
                aiContent = parsedResponse;
              }
              break;
            }
            case "collection":
            case MessageType.collection_purchase_success: {
              // 检查是否为合集购买成功消息
              // 历史消息：response_type 是 "collection"，需要检查是否包含 collections 数据
              // 实时消息：type 是 "collection_purchase_success"
              const metadataList = extractCollectionMetadataList(parsedResponse);
              const isPurchaseSuccess = 
                parsedResponse?.message === "合集购买成功" || 
                responseType === MessageType.collection_purchase_success ||
                (responseType === "collection" && metadataList.length > 0); // 历史消息中的已购买合集
              
              if (isPurchaseSuccess) {
                const metadata = metadataList[0];
                if (metadata) {
                  aiType = MessageType.collection_marketing;
                  aiContent = {
                    id: metadata.id ?? item.response_id ?? item.id,
                    title: metadata.title,
                    description: metadata.description,
                    price: metadata.price ?? null,
                    discountPrice:
                      metadata.discountPrice ??
                      (typeof metadata.price === "number" ? metadata.price : null),
                    purchaseCount: metadata.purchaseCount,
                    isFree: metadata.isFree,
                    isFeatured: metadata.isFeatured,
                    imageCount: metadata.imageCount,
                    videoCount: metadata.videoCount,
                    coverImage: metadata.coverImage,
                    createdTime: metadata.createdTime,
                    companionId: metadata.companionId,
                    purchased: true,
                    isPurchasing: false,
                    assetGroups: [],
                  } satisfies CollectionMessageContent;
                } else {
                  aiType = MessageType.message;
                  aiContent = parsedResponse;
                }
              } else {
                // 普通合集消息，非购买成功
                aiType = MessageType.message;
                aiContent = parsedResponse;
              }
              break;
            }
            case MessageType.mixed: {
              // 混合资源：直接标记为 mixed，交由前端根据后缀选择图片/视频组件
              aiType = MessageType.mixed;
              aiContent = parsedResponse;
              break;
            }
            default: {
              aiType = MessageType.message;
              aiContent = parsedResponse;
              break;
            }
          }

          historyChatMessages.push({
            id: item.response_id,
            response_id: item.response_id,
            content: aiContent,
            time: item.response_created_at,
            type: aiType,
            isSelf: false,
            avatar: requestAvatar,
          });
        });

        // 按时间排序后添加到消息列表开头
        messages.value.unshift(
          ...historyChatMessages.sort(
            (a, b) => new Date(a.time).getTime() - new Date(b.time).getTime()
          )
        );
        historyPage.value += 1;

        if (res.data.items.length < historyLimit) {
          hasMoreHistory.value = false;
        }
      } else {
        hasMoreHistory.value = false;
      }
    } catch (err) {
      const isCanceled = (err as any)?.code === 'ERR_CANCELED' || (err as any)?.message?.includes('canceled');
      if (!isCanceled) {
        console.error("加载历史消息失败:", err);
      }
    } finally {
      lastHistoryRequestAt.value = Date.now();
      isLoadingHistory.value = false;
    }
  };

  /**
   * 清空消息列表
   */
  const clearMessages = () => {
    if (singleton.historyAbortController) {
      singleton.historyAbortController.abort();
      singleton.historyAbortController = null;
    }
    messages.value = [];
    historyPage.value = 1;
    hasMoreHistory.value = true;
    isLoadingHistory.value = false;
    lastHistoryRequestAt.value = 0;
    lastHistoryCompanionId.value = null;
  };

  /**
   * 断开WebSocket连接
   */
  const disconnect = () => {
    console.log('断开WebSocket连接，当前状态:', {
      wsManagerExists: !!wsManager,
      isConnected: isConnected.value,
      readyState: wsManager?.getStatus()?.readyState
    });

    if (wsManager) {
      wsManager.disconnect();
      wsManager = null;
      singleton.wsManager = null;
    }

    // 重置所有相关状态（确保状态一致性）
    isConnected.value = false;
    isConnecting.value = false;
    connectionStatus.value = "disconnected";
    isReplying.value = false; // 确保断开连接时也重置回复状态

    // 重置所有合集购买状态，防止loading状态卡住
    resetAllCollectionPurchasingStates();

    console.log('WebSocket连接已断开，状态已重置');
  };

  /**
   * 重新连接
   */
  const reconnect = async () => {
    disconnect();
    await initWebSocket();
  };

  // 初始化标志改为在首次有聊天对象时设置，而不是在模块加载时设置
  // 这样可以确保无论何时设置聊天对象，都能正确初始化WebSocket

  // 连接生命周期由模块级全局作用域中的watchers控制

  // 组件不再控制连接的生命周期；连接由全局侦听与方法控制

  /**
   * 处理身份认证失败
   */
  const handleAuthFailed = () => {
    // 清除用户认证信息，使用静默登出避免页面刷新
    authStore.logoutSilently(false);
    // 断开WebSocket连接
    disconnect();
    // 清空消息
    clearMessages();
    // 弹出登录窗口
    import("@/utils/authModal").then(({ showLoginModal }) => {
      showLoginModal("login");
    });
  };

  /**
   * 处理companion_id错误
   */
  const handleCompanionNotFound = () => {
    // 清除当前聊天对象
    chatStore.clearCurrentChat();
    // 断开WebSocket连接
    disconnect();
    // 清空消息
    clearMessages();
    // 跳转到首页
    router.push("/");
  };

  /**
   * 重试发送消息
   */
  const retryMessage = (messageId: number | string) => {
    const targetKey = toKey(messageId);
    const messageIndex = messages.value.findIndex((msg) => {
      const idKey = toKey(msg.id as any);
      const uniqueKey = toKey((msg as any).unique_id);
      return targetKey
        ? idKey === targetKey || uniqueKey === targetKey
        : false;
    });
    if (messageIndex !== -1) {
      const message = messages.value[messageIndex];
      if (message.hasError) {
        // 重置消息状态为加载中
        message.isLoading = true;
        message.hasError = false;
        message.displayedText = "";
        message.isTyping = false;

        // 这里可以添加重新发送消息的逻辑
        // 例如：重新调用发送消息的API
        console.log("重试发送消息:", messageId);
      }
    }
  };

  /**
   * 发送生成视频请求
   */
  const sendGenerateVideoMessage = (fileId: string): boolean => {
    if (!wsManager) {
      return false;
    }
    return wsManager.sendGenerateVideoMessage(fileId);
  };

  const setCollectionPurchasingState = (collectionId: number, isPurchasing: boolean) => {
    const index = findCollectionMessageIndex({ collectionId });
    if (index === -1) return;
    const target = messages.value[index];
    if (!target || !COLLECTION_MESSAGE_TYPES.has(target.type as MessageType)) return;

    const content = (target.content as CollectionMessageContent) || null;
    if (!content) return;

    const nextContent: CollectionMessageContent = {
      ...content,
      isPurchasing,
    };

    const updated: ChatMessage = {
      ...target,
      content: nextContent,
    };

    messages.value[index] = updated;
  };

  // 重置所有合集购买状态
  const resetAllCollectionPurchasingStates = () => {
    messages.value.forEach((message, index) => {
      if (!COLLECTION_MESSAGE_TYPES.has(message.type as MessageType)) return;

      const content = message.content as CollectionMessageContent;
      if (!content || !content.isPurchasing) return;

      const nextContent: CollectionMessageContent = {
        ...content,
        isPurchasing: false,
      };

      const updated: ChatMessage = {
        ...message,
        content: nextContent,
      };

      messages.value[index] = updated;
    });
  };

  const sendPurchaseCollection = (collectionId: number): boolean => {
    if (!wsManager) {
      return false;
    }
    setCollectionPurchasingState(collectionId, true);
    const success = wsManager.sendPurchaseCollection(collectionId);
    if (!success) {
      setCollectionPurchasingState(collectionId, false);
      return false;
    }

    // 设置超时保护：30秒后如果仍在购买状态，自动重置
    setTimeout(() => {
      const index = findCollectionMessageIndex({ collectionId });
      if (index !== -1) {
        const message = messages.value[index];
        const content = message.content as CollectionMessageContent;
        if (content?.isPurchasing) {
          console.warn(`合集 ${collectionId} 购买请求超时，自动重置状态`);
          setCollectionPurchasingState(collectionId, false);
          window.$message?.error?.(t("collection.purchaseTimeout") || "购买请求超时，请重试");
        }
      }
    }, 30000); // 30秒超时

    return success;
  };

  /**
   * 发送生成图片请求
   */
  const sendGenerateImageMessage = (prompt: string, batchSize?: number, ruleId?: number): boolean => {
    if (!wsManager) {
      return false;
    }

    return wsManager.sendGenerateImageMessage(prompt, batchSize, ruleId);
  };

  return {
    // 状态
    messages,
    isConnected,
    isConnecting,
    connectionStatus,
    error,
    hasMoreHistory,
    isLoadingHistory,
    isReplying,

    // 方法
    sendMessage: async (content: string): Promise<boolean> => sendMessage(content),
    sendGenerateVideoMessage,
    sendGenerateImageMessage,
    sendPurchaseCollection,
    resetAllCollectionPurchasingStates,
    addMessage,
    clearMessages,
    loadHistoryMessages,
    disconnect,
    reconnect,
    initWebSocket,
    retryMessage,
  };
}

// 单例容器（模块级）
const singleton: {
  wsManager: any | null;
  messages?: Ref<ChatMessage[]>;
  historyPage?: Ref<number>;
  hasMoreHistory?: Ref<boolean>;
  isLoadingHistory?: Ref<boolean>;
  lastHistoryRequestAt?: Ref<number>;
  lastHistoryCompanionId?: Ref<number | null>;
  historyAbortController?: AbortController | null;
  historyRequestId?: number;
  isConnected?: Ref<boolean>;
  isConnecting?: Ref<boolean>;
  connectionStatus?: Ref<"connected" | "connecting" | "disconnected">;
  error?: Ref<string | null>;
  isInitializing?: Ref<boolean>;
  isReplying?: Ref<boolean>;
  eventsBound?: boolean;
  scope?: ReturnType<typeof effectScope> | null;
  didInitialConnect?: boolean;
  boundManagers?: Set<any>;
} = {
  wsManager: null,
  scope: null,
};
