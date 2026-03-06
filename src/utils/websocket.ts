import { ref, computed } from "vue";
import { generateFingerprintHeader, getChannelCodeFromUrl } from "@/utils/fingerprint";
import { getCurrentLanguage } from "@/utils/i18n";
export enum MessageType {
  // 基础/通用
  message = "message",
  error = "error",
  ping = "ping",
  pong = "pong",

  // 文本聊天（按文档）
  text_start = "text_start",
  text_progress = "text_progress",
  // 渐进式打码的文本进度
  text_progress_hidden = "text_progress_hidden",
  text_complete = "text_complete",
  text_error = "text_error",

  // 文生图（聊天端）
  text_to_image_start = "text_to_image_start",
  text_to_image_progress = "text_to_image_progress",
  text_to_image_complete = "text_to_image_complete",
  text_to_image_error = "text_to_image_error",

  // 文生图（菜单端）
  menu_text_to_image_start = "menu_text_to_image_start",
  menu_text_to_image_progress = "menu_text_to_image_progress",
  menu_text_to_image_complete = "menu_text_to_image_complete",
  menu_text_to_image_error = "menu_text_to_image_error",

  // 文生视频（聊天端）
  text_to_video_start = "text_to_video_start",
  text_to_video_progress = "text_to_video_progress",
  text_to_video_complete = "text_to_video_complete",
  text_to_video_error = "text_to_video_error",

  // 图生视频（独立 /api/ws/video）
  image_to_video = "image_to_video",
  image_to_video_start = "image_to_video_start",
  image_to_video_progress = "image_to_video_progress",
  image_to_video_complete = "image_to_video_complete",
  image_to_video_error = "image_to_video_error",

  // 兼容旧类型（保留以避免其他地方出错）
  stream_start = "stream_start",
  stream_chunk = "stream_chunk",
  stream_complete = "stream_complete",
  // 旧：image/video_generation_* 映射到新的文档类型
  image_generation_start = "text_to_image_start",
  image_generation_progress = "text_to_image_progress",
  image_generation_complete = "text_to_image_complete",
  video_generation_start = "text_to_video_start",
  video_generation_progress = "text_to_video_progress",
  video_generation_complete = "text_to_video_complete",

  // 客户端请求（发送方）
  user_generate_image = "user_generate_image",
  menu_text_to_image = "menu_text_to_image", // 菜单端发送文生图请求
  
  // 混合媒体类型
  mixed = "mixed",
  // 系统/配额
  message_exhausted_error = "message_exhausted_error",
  message_chat_exhausted_error = "message_chat_exhausted_error",
  insufficient_balance_error = "insufficient_balance_error",

  // 隐藏内容（配额耗尽/非PRO）
  message_text_hidden = "message_text_hidden",
  message_image_hidden = "message_image_hidden",
  message_video_hidden = "message_video_hidden",

  text_hidden = "text_hidden",
  image_hidden = "image_hidden",
  video_hidden = "video_hidden",
  collection_marketing = "collection_marketing",
  collection_purchase_success = "collection_purchase_success",
  collection_purchase_error = "collection_purchase_error",
  collection_image = "collection_image",
  collection_video = "collection_video",
  purchase_collection = "purchase_collection",
}
export interface GenerateVideoData {
  file_id: string;
}

export interface WebSocketMessage {
  // 统一后的字段（已按文档规范归一到 type + content）
  type: MessageType | string;
  content?: any;
  sender_id?: number | null;
  recipient_id?: number | null;
  timestamp?: string;
  // 允许透传原始字段，供需要时取用
  raw?: any;
  // 结构化后的消息
  normalized?: NormalizedServerMessage | null;
}

// 流式消息相关接口
export interface StreamStartData {
  message_id?: number;
  response_id?: number;
  [key: string]: any;
}

export interface StreamChunkData {
  message: string;
  chunk: string;
  is_vip: boolean;
  message_id: number;
  response_id: number;
  file_id?: string;
}

export interface StreamCompleteData {
  full_content: string;
  message_id: number;
  response_id: number;
}

export interface StreamErrorData {
  error: string;
  message_id: number;
  response_id: number;
}

// 文生图相关接口（按文档）
export interface TextToImageStartData {
  message: string;
  image_url?: string | null;
  file_type?: string;
  success?: boolean;
  message_id?: number;
  [key: string]: any;
}

export interface TextToImageProgressData {
  message: string;
  image_url?: string | null;
  progress?: number;
  message_id?: number;
  [key: string]: any;
}

export interface TextToImageCompleteData {
  message: string;
  success: boolean;
  image_url?: string;
  file_type?: string;
  message_id?: number;
  [key: string]: any;
}

// 文生视频相关接口（按文档）
export interface TextToVideoStartData {
  message: string;
  video_url?: string | null;
  file_type?: string;
  file_id?: string;
  message_id?: number;
  [key: string]: any;
}

export interface TextToVideoProgressData {
  message: string;
  video_url?: string | null;
  message_id?: number;
  [key: string]: any;
}

export interface TextToVideoCompleteData {
  message: string;
  success: boolean;
  video_url?: string;
  file_type?: string;
  file_id?: string;
  message_id?: number;
  [key: string]: any;
}

// 错误数据接口
export interface ErrorData {
  message: string;
  error_code?: string;
  [key: string]: any;
}

export interface NormalizedMessageMeta {
  timestamp?: string;
  senderId?: number | null;
  recipientId?: number | null;
  rawType: string;
  raw: any;
}

export interface NormalizedMessageBase<K extends string> {
  kind: K;
  meta: NormalizedMessageMeta;
}

export interface NormalizedTextPayload {
  text?: string;
  chunk?: string;
  success?: boolean;
  messageId?: string | number;
  responseId?: string | number;
  uniqueId?: string | number;
  isVip?: boolean;
  raw: any;
}

export interface NormalizedTextMessage extends NormalizedMessageBase<"text"> {
  phase: "start" | "progress" | "complete";
  payload: NormalizedTextPayload;
}

export interface NormalizedImagePayload {
  message?: string;
  imageUrl?: string | null;
  progress?: number;
  success?: boolean;
  fileType?: string | null;
  messageId?: string | number;
  uniqueId?: string | number;
  source: "chat" | "menu";
  raw: any;
}

export interface NormalizedImageMessage extends NormalizedMessageBase<"image"> {
  phase: "start" | "progress" | "complete";
  payload: NormalizedImagePayload;
}

export interface NormalizedVideoPayload {
  message?: string;
  videoUrl?: string | null;
  progress?: number;
  success?: boolean;
  fileType?: string | null;
  fileId?: string | number | null;
  messageId?: string | number;
  uniqueId?: string | number;
  mode: "text_to_video" | "image_to_video";
  raw: any;
}

export interface NormalizedVideoMessage extends NormalizedMessageBase<"video"> {
  phase: "start" | "progress" | "complete";
  payload: NormalizedVideoPayload;
}

export interface NormalizedErrorMessage extends NormalizedMessageBase<"error"> {
  context: "text" | "image" | "menu-image" | "video" | "global" | "quota" | "unknown";
  payload: ErrorData & { raw: any };
}

export interface NormalizedRegularMessage extends NormalizedMessageBase<"regular"> {
  payload: {
    text?: string;
    content: any;
  };
}

export interface NormalizedSystemMessage extends NormalizedMessageBase<"system"> {
  systemType: "ping" | "pong" | "quota_exhausted" | "auth_failed" | "companion_not_found" | "unknown";
  payload?: any;
}

export type NormalizedServerMessage =
  | NormalizedTextMessage
  | NormalizedImageMessage
  | NormalizedVideoMessage
  | NormalizedErrorMessage
  | NormalizedRegularMessage
  | NormalizedSystemMessage;

const PERCENTAGE_PATTERN = /(-?\d+(?:\.\d+)?)/;

const isObject = (value: unknown): value is Record<string, any> =>
  typeof value === "object" && value !== null;

const coerceId = (value: any): string | number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number") return value;
  if (typeof value === "string" && value.trim() !== "") return value;
  return undefined;
};

const extractProgress = (value: any): number | undefined => {
  if (value === null || value === undefined) return undefined;
  if (typeof value === "number" && !Number.isNaN(value)) {
    if (value <= 1 && value >= 0) {
      return Number((value * 100).toFixed(1));
    }
    return Number(value.toFixed(1));
  }
  if (typeof value === "string") {
    const match = value.match(PERCENTAGE_PATTERN);
    if (match) {
      const parsed = Number.parseFloat(match[1]);
      if (!Number.isNaN(parsed)) {
        return parsed > 1 && parsed <= 100 ? parsed : Number((parsed * 100).toFixed(1));
      }
    }
  }
  return undefined;
};

const extractText = (payload: any): string | undefined => {
  if (payload === null || payload === undefined) return undefined;
  if (typeof payload === "string") return payload;
  if (isObject(payload)) {
    if (typeof payload.chunk === "string") return payload.chunk;
    if (typeof payload.message === "string") return payload.message;
    if (typeof payload.full_content === "string") return payload.full_content;
    if (typeof payload.content === "string") return payload.content;
  }
  return undefined;
};

const ensureErrorPayload = (payload: any): ErrorData & { raw: any } => {
  if (isObject(payload)) {
    return {
      message: typeof payload.message === "string" ? payload.message : "未知错误",
      error_code: typeof payload.error_code === "string" ? payload.error_code : payload.error_code,
      raw: payload,
    };
  }
  if (typeof payload === "string") {
    return { message: payload, raw: payload };
  }
  return { message: "发生未知错误", raw: payload };
};

const extractUniqueId = (...sources: any[]): string | number | undefined => {
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
      const coerced = coerceId(current);
      if (coerced !== undefined) return coerced;
      continue;
    }
    if (typeof current !== "object" || visited.has(current)) {
      continue;
    }
    visited.add(current);
    const direct = coerceId((current as any).unique_id ?? (current as any).uniqueId);
    if (direct !== undefined) return direct;
    const nestedKeys = ["data", "payload", "content"];
    for (const key of nestedKeys) {
      if (Object.prototype.hasOwnProperty.call(current, key)) {
        const nested = (current as any)[key];
        if (nested !== undefined && nested !== null) {
          queue.push(nested);
        }
      }
    }
  }
  return undefined;
};

const resolvePayload = (raw: any) => {
  if (!raw) return undefined;
  if (Object.prototype.hasOwnProperty.call(raw, "content")) {
    return raw.content;
  }
  if (Object.prototype.hasOwnProperty.call(raw, "data")) {
    return raw.data;
  }
  if (Object.prototype.hasOwnProperty.call(raw, "payload")) {
    return raw.payload;
  }
  return undefined;
};

const normalizeServerMessage = (raw: any): NormalizedServerMessage | null => {
  if (!raw) return null;
  const rawTypeValue =
    (typeof raw.type === "string" && raw.type) ||
    (typeof raw.message_type === "string" && raw.message_type) ||
    (typeof raw.event === "string" && raw.event) ||
    "";
  const rawType = rawTypeValue.toLowerCase();
  const payload = resolvePayload(raw);
  const meta: NormalizedMessageMeta = {
    timestamp: raw.timestamp ?? raw.time ?? raw.created_at,
    senderId: raw.sender_id ?? raw.from ?? null,
    recipientId: raw.recipient_id ?? raw.to ?? null,
    rawType: rawTypeValue || "",
    raw,
  };
  const uniqueId = extractUniqueId(payload, raw);

  if (!rawType) {
    return null;
  }

  if (rawType === MessageType.ping) {
    return { kind: "system", systemType: "ping", payload, meta };
  }
  if (rawType === MessageType.pong) {
    return { kind: "system", systemType: "pong", payload, meta };
  }
  if (rawType === MessageType.message_exhausted_error) {
    return { kind: "system", systemType: "quota_exhausted", payload, meta };
  }

  if (
    rawType === MessageType.message_text_hidden ||
    rawType === MessageType.text_hidden
  ) {
    const text = extractText(payload);
    return {
      kind: "regular",
      payload: {
        text,
        content: payload ?? raw.content ?? raw.data ?? raw,
      },
      meta,
    };
  }

  if (rawType === MessageType.message) {
    const text = extractText(payload);
    return {
      kind: "regular",
      payload: {
        text,
        content: payload ?? raw.content ?? raw.data ?? raw,
      },
      meta,
    };
  }

  if (
    rawType === MessageType.text_start ||
    rawType === MessageType.stream_start
  ) {
    return {
      kind: "text",
      phase: "start",
      payload: {
        uniqueId,
        text: extractText(payload),
        messageId: coerceId(payload?.message_id ?? payload?.id),
        responseId: coerceId(payload?.response_id),
        isVip: payload?.is_vip,
        raw: payload,
      },
      meta,
    };
  }

  if (
    rawType === MessageType.text_progress ||
    rawType === MessageType.text_progress_hidden ||
    rawType === MessageType.stream_chunk
  ) {
    return {
      kind: "text",
      phase: "progress",
      payload: {
        uniqueId,
        text: extractText(payload),
        chunk:
          typeof payload?.chunk === "string"
            ? payload.chunk
            : extractText(payload),
        messageId: coerceId(payload?.message_id ?? payload?.id),
        responseId: coerceId(payload?.response_id),
        raw: payload,
      },
      meta,
    };
  }

  if (
    rawType === MessageType.text_complete ||
    rawType === MessageType.stream_complete
  ) {
    return {
      kind: "text",
      phase: "complete",
      payload: {
        uniqueId,
        text: extractText(payload),
        success: payload?.success ?? true,
        messageId: coerceId(payload?.message_id ?? payload?.id),
        responseId: coerceId(payload?.response_id),
        raw: payload,
      },
      meta,
    };
  }

  if (
    rawType === MessageType.message_image_hidden ||
    rawType === MessageType.image_hidden
  ) {
    const progress =
      extractProgress(payload?.progress) ?? extractProgress(payload?.message) ?? 100;
    return {
      kind: "image",
      phase: "complete",
      payload: {
        uniqueId,
        message: extractText(payload),
        imageUrl: payload?.image_url ?? payload?.url ?? payload?.imageUrl ?? null,
        success: payload?.success ?? true,
        fileType: payload?.file_type ?? payload?.fileType ?? null,
        progress,
        messageId: coerceId(payload?.message_id ?? payload?.id),
        source: "chat",
        raw: payload,
      },
      meta,
    };
  }

  if (
    rawType === MessageType.text_to_image_start ||
    rawType === MessageType.menu_text_to_image_start ||
    rawType === MessageType.image_generation_start
  ) {
    return {
      kind: "image",
      phase: "start",
      payload: {
        uniqueId,
        message: extractText(payload),
        imageUrl: payload?.image_url ?? null,
        success: payload?.success,
        fileType: payload?.file_type ?? null,
        messageId: coerceId(payload?.message_id ?? payload?.id),
        source: rawType.startsWith("menu_") ? "menu" : "chat",
        raw: payload,
      },
      meta,
    };
  }

  if (
    rawType === MessageType.text_to_image_progress ||
    rawType === MessageType.menu_text_to_image_progress ||
    rawType === MessageType.image_generation_progress
  ) {
    const progress =
      extractProgress(payload?.progress) ?? extractProgress(payload?.message);
    return {
      kind: "image",
      phase: "progress",
      payload: {
        uniqueId,
        message: extractText(payload),
        imageUrl: payload?.image_url ?? null,
        progress,
        success: payload?.success,
        fileType: payload?.file_type ?? null,
        messageId: coerceId(payload?.message_id ?? payload?.id),
        source: rawType.startsWith("menu_") ? "menu" : "chat",
        raw: payload,
      },
      meta,
    };
  }

  if (
    rawType === MessageType.text_to_image_complete ||
    rawType === MessageType.menu_text_to_image_complete ||
    rawType === MessageType.image_generation_complete
  ) {
    const progress =
      extractProgress(payload?.progress) ?? extractProgress(payload?.message) ?? 100;
    return {
      kind: "image",
      phase: "complete",
      payload: {
        uniqueId,
        message: extractText(payload),
        imageUrl: payload?.image_url ?? payload?.url ?? null,
        success: payload?.success ?? true,
        fileType: payload?.file_type ?? null,
        progress,
        messageId: coerceId(payload?.message_id ?? payload?.id),
        source: rawType.startsWith("menu_") ? "menu" : "chat",
        raw: payload,
      },
      meta,
    };
  }

  if (
    rawType === MessageType.message_video_hidden ||
    rawType === MessageType.video_hidden
  ) {
    const progress =
      extractProgress(payload?.progress) ?? extractProgress(payload?.message) ?? 100;
    return {
      kind: "video",
      phase: "complete",
      payload: {
        uniqueId,
        message: extractText(payload),
        videoUrl: payload?.video_url ?? payload?.url ?? payload?.videoUrl ?? null,
        success: payload?.success ?? true,
        fileType: payload?.file_type ?? payload?.fileType ?? null,
        fileId: coerceId(payload?.file_id ?? payload?.id),
        messageId: coerceId(payload?.message_id ?? payload?.id),
        progress,
        mode: "text_to_video",
        raw: payload,
      },
      meta,
    };
  }

  if (
    rawType === MessageType.text_to_video_start ||
    rawType === MessageType.video_generation_start
  ) {
    return {
      kind: "video",
      phase: "start",
      payload: {
        uniqueId,
        message: extractText(payload),
        videoUrl: payload?.video_url ?? null,
        success: payload?.success,
        fileType: payload?.file_type ?? null,
        fileId: coerceId(payload?.file_id),
        messageId: coerceId(payload?.message_id ?? payload?.id),
        mode: "text_to_video",
        raw: payload,
      },
      meta,
    };
  }

  if (
    rawType === MessageType.text_to_video_progress ||
    rawType === MessageType.video_generation_progress
  ) {
    const progress =
      extractProgress(payload?.progress) ?? extractProgress(payload?.message);
    return {
      kind: "video",
      phase: "progress",
      payload: {
        uniqueId,
        message: extractText(payload),
        videoUrl: payload?.video_url ?? null,
        success: payload?.success,
        fileType: payload?.file_type ?? null,
        fileId: coerceId(payload?.file_id),
        messageId: coerceId(payload?.message_id ?? payload?.id),
        progress,
        mode: "text_to_video",
        raw: payload,
      },
      meta,
    };
  }

  if (
    rawType === MessageType.text_to_video_complete ||
    rawType === MessageType.video_generation_complete
  ) {
    const progress =
      extractProgress(payload?.progress) ?? extractProgress(payload?.message) ?? 100;
    return {
      kind: "video",
      phase: "complete",
      payload: {
        uniqueId,
        message: extractText(payload),
        videoUrl: payload?.video_url ?? payload?.url ?? null,
        success: payload?.success ?? true,
        fileType: payload?.file_type ?? null,
        fileId: coerceId(payload?.file_id),
        messageId: coerceId(payload?.message_id ?? payload?.id),
        progress,
        mode: "text_to_video",
        raw: payload,
      },
      meta,
    };
  }

  if (
    rawType === MessageType.image_to_video_start ||
    rawType === MessageType.image_to_video_progress ||
    rawType === MessageType.image_to_video_complete
  ) {
    const phase: NormalizedVideoMessage["phase"] =
      rawType === MessageType.image_to_video_start
        ? "start"
        : rawType === MessageType.image_to_video_progress
          ? "progress"
          : "complete";
    const progress =
      extractProgress(payload?.progress) ?? extractProgress(payload?.message) ?? (phase === "complete" ? 100 : undefined);
    return {
      kind: "video",
      phase,
      payload: {
        uniqueId,
        message: extractText(payload),
        videoUrl: payload?.video_url ?? null,
        success: payload?.success,
        fileType: payload?.file_type ?? null,
        fileId: coerceId(payload?.file_id ?? payload?.id),
        messageId: coerceId(payload?.message_id ?? payload?.id),
        progress,
        mode: "image_to_video",
        raw: payload,
      },
      meta,
    };
  }

  if (rawType === MessageType.text_error || rawType === "stream_error") {
    return {
      kind: "error",
      context: "text",
      payload: ensureErrorPayload(payload),
      meta,
    };
  }

  if (
    rawType === MessageType.text_to_image_error ||
    rawType === MessageType.image_generation_start + "_error"
  ) {
    return {
      kind: "error",
      context: "image",
      payload: ensureErrorPayload(payload),
      meta,
    };
  }

  if (rawType === MessageType.menu_text_to_image_error) {
    return {
      kind: "error",
      context: "menu-image",
      payload: ensureErrorPayload(payload),
      meta,
    };
  }

  if (
    rawType === MessageType.text_to_video_error ||
    rawType === MessageType.image_to_video_error
  ) {
    return {
      kind: "error",
      context: "video",
      payload: ensureErrorPayload(payload),
      meta,
    };
  }

  if (rawType === MessageType.error) {
    return {
      kind: "error",
      context: "global",
      payload: ensureErrorPayload(payload),
      meta,
    };
  }

  return {
    kind: "regular",
    payload: {
      text: extractText(payload),
      content: payload ?? raw,
    },
    meta,
  };
};

export interface WebSocketConfig {
  url: string;
  token?: string;
  companion_id?: number;
  file_id?: string; // 添加file_id参数，用于视频WebSocket连接
  heartbeatInterval?: number;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

export class WebSocketManager {
  private ws: WebSocket | null = null;
  private config: WebSocketConfig;
  private heartbeatTimer: number | null = null;
  private reconnectTimer: number | null = null;
  private reconnectAttempts = 0;
  private isManualClose = false;
  private connectPromise: Promise<void> | null = null;
  // 使用全局消息实例
  private get message() {
    return (window as any).$message;
  }

  // 响应式状态
  public isConnected = ref(false);
  public isConnecting = ref(false);
  public connectionStatus = computed(() => {
    if (this.isConnecting.value) return "connecting";
    if (this.isConnected.value) return "connected";
    return "disconnected";
  });

  // 事件回调（支持多监听者）
  private onMessageCallbacks: Array<(message: WebSocketMessage) => void> = [];
  private onConnectedCallbacks: Array<() => void> = [];
  private onDisconnectedCallbacks: Array<() => void> = [];
  private onErrorCallbacks: Array<(error: Event) => void> = [];
  private onAuthFailedCallbacks: Array<() => void> = [];
  private onCompanionNotFoundCallbacks: Array<() => void> = [];

  constructor(config: WebSocketConfig) {
    this.config = {
      heartbeatInterval: 30000,
      reconnectInterval: 5000,
      maxReconnectAttempts: 5,
      ...config,
    };
  }

  /**
   * 连接WebSocket
   */
  connect(): Promise<void> {
    // 复用进行中的连接请求
    if (this.connectPromise) return this.connectPromise;

    // 已连接
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      return Promise.resolve();
    }

    // 正在连接：等待连接完成
    if (this.ws && this.ws.readyState === WebSocket.CONNECTING) {
      this.connectPromise = new Promise((resolve, reject) => {
        const onOk = () => {
          cleanup();
          resolve();
        };
        const onErr = (e: Event) => {
          cleanup();
          reject(e);
        };
        const cleanup = () => {
          this.onConnectedCallbacks = this.onConnectedCallbacks.filter((cb) => cb !== onOk);
          this.onErrorCallbacks = this.onErrorCallbacks.filter((cb) => cb !== onErr);
          this.connectPromise = null;
        };
        this.onConnected(onOk);
        this.onError(onErr);
      });
      return this.connectPromise;
    }

    this.isConnecting.value = true;
    this.isManualClose = false;

    this.connectPromise = new Promise((resolve, reject) => {
      // 构建WebSocket URL
      const url = new URL(this.config.url);
      if (this.config.token) {
        url.searchParams.set("token", this.config.token);
      }
      if (this.config.companion_id) {
        url.searchParams.set("companion_id", this.config.companion_id.toString());
      }
      if (this.config.file_id) {
        url.searchParams.set("file_id", this.config.file_id);
        console.log('视频WebSocket连接将携带file_id参数:', this.config.file_id);
      }

      const getAcceptLanguage = () => {
        const language = getCurrentLanguage();
        const languageMap: { [key: string]: string } = {
          "zh-CN": "zh",
          "en-US": "en",
          "vi-VN": "vi",
          "pt-PT": "pt",
          "ja-JP": "ja",
          "hi-IN": "hi"
        };
        return languageMap[language] || languageMap["en-US"] || "en";
      };

      url.searchParams.set("user_agent", navigator.userAgent);
      url.searchParams.set("accept_language", getAcceptLanguage());
      url.searchParams.set("referer", window.location.href);
      const fingerprintHeader = generateFingerprintHeader();
      url.searchParams.set("x_fingerprint", encodeURIComponent(fingerprintHeader));
      const channelCode = getChannelCodeFromUrl();
      if (channelCode) url.searchParams.set("channel_code", channelCode);

      try {
        this.ws = new WebSocket(url.toString());

        this.ws.onopen = () => {
          console.log("WebSocket连接已建立");
          this.isConnected.value = true;
          this.isConnecting.value = false;
          this.reconnectAttempts = 0;
          this.startHeartbeat();
          this.onConnectedCallbacks.forEach((cb) => cb());
          // 连接完成，清理进行中的Promise
          this.connectPromise = null;
          resolve();
        };

        this.ws.onmessage = (event) => {
          try {
            const raw = JSON.parse(event.data);
            const normalizedPayload = normalizeServerMessage(raw);
            const rawTypeValue =
              (typeof raw.type === "string" && raw.type) ||
              (typeof raw.message_type === "string" && raw.message_type) ||
              normalizedPayload?.meta.rawType ||
              "";
            const contentValue = Object.prototype.hasOwnProperty.call(raw, "content")
              ? raw.content
              : Object.prototype.hasOwnProperty.call(raw, "data")
                ? raw.data
                : normalizedPayload && "payload" in normalizedPayload
                  ? (normalizedPayload as any).payload
                  : undefined;

            const normalized: WebSocketMessage = {
              type: rawTypeValue,
              content: contentValue,
              sender_id: raw.sender_id ?? null,
              recipient_id: raw.recipient_id ?? null,
              timestamp: raw.timestamp,
              raw,
              normalized: normalizedPayload,
            };
            console.log("收到WebSocket消息:", normalized);
            if (
              normalizedPayload?.kind === "system" &&
              normalizedPayload.systemType === "ping"
            ) {
              this.sendPong();
              return;
            }
            if (
              normalized.type === MessageType.pong ||
              normalized.type === "pong" ||
              normalizedPayload?.kind === "system" && normalizedPayload.systemType === "pong"
            ) {
              console.log("收到心跳响应");
              return;
            }
            this.onMessageCallbacks.forEach((cb) => cb(normalized));
          } catch (error) {
            console.error("解析WebSocket消息失败:", error);
          }
        };

        this.ws.onclose = (event) => {
          console.log("WebSocket连接已关闭:", event.code, event.reason);
          this.isConnected.value = false;
          this.isConnecting.value = false;
          this.stopHeartbeat();
          if (this.connectPromise) this.connectPromise = null;
          if (event.code === 1008) {
            this.onAuthFailedCallbacks.forEach((cb) => cb());
            return;
          }
          if (event.code === 1007) {
            this.onCompanionNotFoundCallbacks.forEach((cb) => cb());
            return;
          }
          if (!this.isManualClose) {
            this.onDisconnectedCallbacks.forEach((cb) => cb());
            this.attemptReconnect();
          }
        };

        this.ws.onerror = (error) => {
          console.error("WebSocket错误:", error);
          this.isConnecting.value = false;
          this.onErrorCallbacks.forEach((cb) => cb(error));
          if (this.connectPromise) this.connectPromise = null;
          reject(error);
        };
      } catch (error) {
        this.isConnecting.value = false;
        console.error("创建WebSocket连接失败:", error);
        if (this.connectPromise) this.connectPromise = null;
        reject(error);
      }
    });

    return this.connectPromise;
  }

  /**
   * 断开WebSocket连接
   */
  disconnect(): void {
    this.isManualClose = true;
    this.stopHeartbeat();
    this.stopReconnect();
    if (this.connectPromise) {
      this.connectPromise = null;
    }

    if (this.ws) {
      this.ws.close(1000, "用户主动断开连接");
      this.ws = null;
    }

    this.isConnected.value = false;
    this.isConnecting.value = false;
    console.log("WebSocket连接已手动断开");
  }

  /**
   * 发送消息
   */
  sendMessage(content: string): boolean {
    if (!this.isConnected.value || !this.ws || this.ws.readyState !== WebSocket.OPEN) {
      console.warn("WebSocket状态异常:", {
        isConnected: this.isConnected.value,
        wsExists: !!this.ws,
        readyState: this.ws?.readyState,
        expectedState: WebSocket.OPEN
      });
      this.message.error("聊天连接未建立，无法发送消息");
      return false;
    }

    try {
      // 检查是否是生成视频请求（通过特定的file_id格式判断）
      // 这里我们需要一个更好的方式来识别生成视频请求
      // 暂时通过内容格式来判断
      let messageType: string = "message";
      let messageContent: string | object = content;
      // 如果内容看起来像是file_id（通常是数字或特定格式），且来自生成视频按钮
      // 我们需要一个更明确的方式来标识这是生成视频请求
      // 这里先保持原有逻辑，后续可以优化
      const message: WebSocketMessage = {
        type: messageType as any,
        content: messageContent,
      };

      this.ws.send(JSON.stringify(message));
      console.log("发送消息:", message);
      return true;
    } catch (error) {
      console.error("发送消息失败:", error);
      this.message.error("发送消息失败");
      return false;
    }
  }

  /**
   * 发送自定义结构的消息
   */
  sendStructuredMessage(type: string, payload?: Record<string, any>): boolean {
    if (!this.isConnected.value || !this.ws) {
      this.message.error("聊天连接未建立，无法发送消息");
      return false;
    }

    if (!type) {
      console.error("发送自定义消息失败: 缺少消息类型");
      return false;
    }

    try {
      const message = {
        type,
        ...(payload ? payload : {}),
      };
      this.ws.send(JSON.stringify(message));
      console.log("发送自定义消息:", message);
      return true;
    } catch (error) {
      console.error("发送自定义消息失败:", error);
      this.message.error("发送消息失败");
      return false;
    }
  }

  /**
   * 发送生成视频请求
   */
  sendGenerateVideoMessage(fileId: string): boolean {
    if (!this.isConnected.value || !this.ws) {
      this.message.error("聊天连接未建立，无法发送消息");
      return false;
    }

    try {
      const message = {
        type: MessageType.image_to_video,
        content: {
          file_id: fileId,
        },
      } as const;

      this.ws.send(JSON.stringify(message));
      console.log("发送生成视频请求:", message);
      return true;
    } catch (error) {
      console.error("发送生成视频请求失败:", error);
      this.message.error("发送生成视频请求失败");
      return false;
    }
  }

  /**
   * 发送生成图片请求
   */
  sendGenerateImageMessage(prompt: string, batchSize?: number, ruleId?: number): boolean {
    if (!this.isConnected.value || !this.ws) {
      this.message.error("聊天连接未建立，无法发送消息");
      return false;
    }

    try {
      const content: any = { prompt };
      if (batchSize && batchSize > 1) {
        content.batch_size = batchSize;
      }
      
      // 将 rule_id 添加到 content 对象中
      if (ruleId) {
        content.rule_id = ruleId;
      }

      const message: any = {
        type: MessageType.menu_text_to_image,
        content,
      };

      this.ws.send(JSON.stringify(message));
      console.log("发送菜单端图片生成请求:", message);
      return true;
    } catch (error) {
      console.error("发送菜单端图片生成请求失败:", error);
      this.message.error("发送菜单端图片生成请求失败");
      return false;
    }
  }

  /**
   * 发送合集购买请求
   */
  sendPurchaseCollection(collectionId: number): boolean {
    if (!this.isConnected.value || !this.ws) {
      this.message.error("聊天连接未建立，无法发送消息");
      return false;
    }
    if (collectionId === undefined || collectionId === null) {
      console.error("发送合集购买请求失败: 缺少合集ID");
      return false;
    }

    return this.sendStructuredMessage(MessageType.purchase_collection, {
      collection_id: collectionId,
    });
  }

  /**
   * 发送心跳响应
   */
  private sendPong(): void {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) return;

    try {
      const pongMessage: WebSocketMessage = {
        type: MessageType.pong,
      };
      this.ws.send(JSON.stringify(pongMessage));
      console.log("发送心跳响应");
    } catch (error) {
      console.error("发送心跳响应失败:", error);
    }
  }

  /**
   * 开始心跳检测
   */
  private startHeartbeat(): void {
    this.stopHeartbeat();

    if (this.config.heartbeatInterval && this.config.heartbeatInterval > 0) {
      this.heartbeatTimer = window.setInterval(() => {
        // 服务器会主动发送ping，客户端只需要响应pong
        // 这里可以添加额外的连接检查逻辑
        if (!this.isConnected.value) {
          this.stopHeartbeat();
        }
      }, this.config.heartbeatInterval);
    }
  }

  /**
   * 停止心跳检测
   */
  private stopHeartbeat(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
      this.heartbeatTimer = null;
    }
  }

  /**
   * 尝试重连
   */
  private attemptReconnect(): void {
    if (this.isManualClose || !this.config.maxReconnectAttempts) return;

    if (this.reconnectAttempts >= this.config.maxReconnectAttempts) {
      console.log("达到最大重连次数，停止重连");
      // this.message.error("聊天连接重连失败，请刷新页面重试");
      return;
    }

    this.reconnectAttempts++;
    console.log(`第${this.reconnectAttempts}次重连尝试...`);

    this.reconnectTimer = window.setTimeout(() => {
      this.connect().catch(() => {
        // 重连失败，继续下一次尝试
        this.attemptReconnect();
      });
    }, this.config.reconnectInterval);
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
   * 设置事件回调
   */
  onMessage(callback: (message: WebSocketMessage) => void): void {
    if (!this.onMessageCallbacks.includes(callback)) {
      this.onMessageCallbacks.push(callback);
    }
  }

  onConnected(callback: () => void): void {
    if (!this.onConnectedCallbacks.includes(callback)) {
      this.onConnectedCallbacks.push(callback);
    }
  }

  onDisconnected(callback: () => void): void {
    if (!this.onDisconnectedCallbacks.includes(callback)) {
      this.onDisconnectedCallbacks.push(callback);
    }
  }

  onError(callback: (error: Event) => void): void {
    if (!this.onErrorCallbacks.includes(callback)) {
      this.onErrorCallbacks.push(callback);
    }
  }

  onAuthFailed(callback: () => void): void {
    if (!this.onAuthFailedCallbacks.includes(callback)) {
      this.onAuthFailedCallbacks.push(callback);
    }
  }

  onCompanionNotFound(callback: () => void): void {
    if (!this.onCompanionNotFoundCallbacks.includes(callback)) {
      this.onCompanionNotFoundCallbacks.push(callback);
    }
  }

  /**
   * 更新配置
   */
  updateConfig(newConfig: Partial<WebSocketConfig>): void {
    this.config = { ...this.config, ...newConfig };
  }

  /**
   * 获取当前状态
   */
  getStatus() {
    return {
      isConnected: this.isConnected.value,
      isConnecting: this.isConnecting.value,
      reconnectAttempts: this.reconnectAttempts,
      readyState: this.ws?.readyState,
    };
  }

  /**
   * 获取配置信息
   */
  getConfig(): WebSocketConfig {
    return this.config;
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.disconnect();
    this.onMessageCallbacks = [];
    this.onConnectedCallbacks = [];
    this.onDisconnectedCallbacks = [];
    this.onErrorCallbacks = [];
    this.onAuthFailedCallbacks = [];
    this.onCompanionNotFoundCallbacks = [];
  }
}

/**
 * 创建WebSocket管理器实例
 */
export function createWebSocketManager(
  config: WebSocketConfig
): WebSocketManager {
  return new WebSocketManager(config);
}

/**
 * 获取环境变量中的WebSocket配置
 */
export function getWebSocketConfig(): Omit<
  WebSocketConfig,
  "token" | "companion_id"
> {
  let wsUrl = import.meta.env.VITE_WS_BASE_URL;
  
  // 如果环境变量没有配置完整 URL，动态构建
  if (!wsUrl || wsUrl === "auto") {
    // 检测是否为本地开发环境
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // 本地开发环境使用固定的生产域名
      wsUrl = "wss://yesbabeabc.com/api/ws/chat";
    } else {
      // 非本地环境根据当前页面协议自动选择 WebSocket 协议
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      const path = "/api/ws/chat";
      wsUrl = `${protocol}//${host}${path}`;
    }
  } else {
    // 如果配置了 URL 但协议不匹配，自动修正协议
    try {
      const url = new URL(wsUrl);
      // 本地开发环境特殊处理
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        // 本地开发时强制使用 wss://yesbabeabc.com
        if (!wsUrl.includes('yesbabeabc.com')) {
          wsUrl = "wss://yesbabeabc.com/api/ws/chat";
        } else {
          // 已经是 yesbabeabc.com，确保使用 wss
          url.protocol = "wss:";
          wsUrl = url.toString();
        }
      } else {
        // 非本地环境根据当前协议自动调整
        const expectedProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        if (url.protocol !== expectedProtocol) {
          url.protocol = expectedProtocol;
          wsUrl = url.toString();
        }
      }
    } catch {
      // URL 解析失败，使用动态构建
      if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
        wsUrl = "wss://yesbabeabc.com/api/ws/chat";
      } else {
        const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
        const host = window.location.host;
        const path = "/api/ws/chat";
        wsUrl = `${protocol}//${host}${path}`;
      }
    }
  }
  
  return {
    url: wsUrl,
    heartbeatInterval:
      Number(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL) || 30000,
    reconnectInterval:
      Number(import.meta.env.VITE_WS_RECONNECT_INTERVAL) || 5000,
    maxReconnectAttempts:
      Number(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS) || 5,
  };
}

/**
 * 获取图片生成功能的WebSocket配置（菜单端）
 * 优先读取 VITE_WS_IMAGE_URL，其次回退到通用 BASE_URL 推断 /image
 */
export function getImageWebSocketConfig(): Omit<
  WebSocketConfig,
  "token" | "companion_id"
> {
  // 显式配置
  const explicit = (import.meta as any).env?.VITE_WS_IMAGE_URL as string | undefined;
  if (explicit) {
    let url = explicit;
    // 自动修正协议
    try {
      const urlObj = new URL(url);
      const expectedProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      if (urlObj.protocol !== expectedProtocol) {
        urlObj.protocol = expectedProtocol;
        url = urlObj.toString();
      }
    } catch {
      // URL 解析失败，使用动态构建
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      url = `${protocol}//${host}/api/ws/image`;
    }
    
    return {
      url,
      heartbeatInterval: Number(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL) || 30000,
      reconnectInterval: Number(import.meta.env.VITE_WS_RECONNECT_INTERVAL) || 5000,
      maxReconnectAttempts: Number(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS) || 5,
    };
  }

  // 基于 BASE_URL 推断（将路径替换为 /api/ws/image 或在末尾追加 /image）
  const base = import.meta.env.VITE_WS_BASE_URL;
  let url: string;
  
  if (!base || base === "auto") {
    // 检测是否为本地开发环境
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      // 本地开发环境使用固定的生产域名
      url = "wss://yesbabeabc.com/api/ws/image";
    } else {
      // 非本地环境动态构建
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      url = `${protocol}//${host}/api/ws/image`;
    }
  } else {
    // 有配置基础 URL，基于它构建图片生成 URL
    try {
      const u = new URL(base);
      // 自动修正协议
      const expectedProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      u.protocol = expectedProtocol;
      
      // 将末尾路径替换为 /api/ws/image（适配常见配置）
      if (u.pathname.includes("/api/ws")) {
        u.pathname = "/api/ws/image";
      } else {
        // 否则在末尾追加 /image
        if (!u.pathname.endsWith("/")) u.pathname += "/";
        u.pathname += "image";
      }
      url = u.toString();
    } catch {
      // 使用默认值
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      url = `${protocol}//${host}/api/ws/image`;
    }
  }

  return {
    url,
    heartbeatInterval: Number(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL) || 30000,
    reconnectInterval: Number(import.meta.env.VITE_WS_RECONNECT_INTERVAL) || 5000,
    maxReconnectAttempts: Number(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS) || 5,
  };
}

/**
 * 获取图生视频功能的WebSocket配置（/api/ws/video）
 */
export function getVideoWebSocketConfig(): Omit<
  WebSocketConfig,
  "token" | "companion_id" | "file_id"
> {
  const explicit = (import.meta as any).env?.VITE_WS_VIDEO_URL as string | undefined;
  if (explicit) {
    let url = explicit;
    try {
      const urlObj = new URL(url);
      const expectedProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      if (urlObj.protocol !== expectedProtocol) {
        urlObj.protocol = expectedProtocol;
        url = urlObj.toString();
      }
    } catch {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      url = `${protocol}//${host}/api/ws/video`;
    }
    return {
      url,
      heartbeatInterval: Number(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL) || 30000,
      reconnectInterval: Number(import.meta.env.VITE_WS_RECONNECT_INTERVAL) || 5000,
      maxReconnectAttempts: Number(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS) || 5,
    };
  }

  const base = import.meta.env.VITE_WS_BASE_URL;
  let url: string;

  if (!base || base === "auto") {
    if (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1') {
      url = "wss://yesbabeabc.com/api/ws/video";
    } else {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      url = `${protocol}//${host}/api/ws/video`;
    }
  } else {
    try {
      const u = new URL(base);
      const expectedProtocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      u.protocol = expectedProtocol;
      if (u.pathname.includes("/api/ws")) {
        u.pathname = "/api/ws/video";
      } else {
        if (!u.pathname.endsWith("/")) u.pathname += "/";
        u.pathname += "video";
      }
      url = u.toString();
    } catch {
      const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
      const host = window.location.host;
      url = `${protocol}//${host}/api/ws/video`;
    }
  }

  return {
    url,
    heartbeatInterval: Number(import.meta.env.VITE_WS_HEARTBEAT_INTERVAL) || 30000,
    reconnectInterval: Number(import.meta.env.VITE_WS_RECONNECT_INTERVAL) || 5000,
    maxReconnectAttempts: Number(import.meta.env.VITE_WS_MAX_RECONNECT_ATTEMPTS) || 5,
  };
}

// 单例 WebSocketManager（跨模块共享）
let sharedWebSocketManager: WebSocketManager | null = null;

export function getSharedWebSocketManager(config: WebSocketConfig): WebSocketManager {
  if (!sharedWebSocketManager) {
    sharedWebSocketManager = new WebSocketManager(config);
    return sharedWebSocketManager;
  }
  sharedWebSocketManager.updateConfig(config);
  return sharedWebSocketManager;
}

export function resetSharedWebSocketManager(): void {
  if (sharedWebSocketManager) {
    sharedWebSocketManager.destroy();
    sharedWebSocketManager = null;
  }
}
