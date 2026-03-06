// 统一使用 MessageType 枚举，同时保持向后兼容
import { MessageType } from '@/utils/websocket'
export type ChatType = MessageType
// 流式消息内容类型
export interface StreamStartContent {
  message: string;
  is_vip?: boolean;
  unique_id?: string;
}

export interface StreamChunkContent {
  chunk: string;
  is_vip: boolean;
  unique_id?: string;
}

export interface StreamCompleteContent {
  full_content: string;
  is_vip: boolean;
  unique_id?: string;
}

export interface StreamErrorContent {
  error: string;
  is_vip: boolean;
  unique_id?: string;
}

// 图像生成内容类型
export interface ImageGenerationStartContent {
  message: string;
  image_url?: string | null;
  file_type?: string;
  success?: boolean;
  unique_id?: string;
}

export interface ImageGenerationProgressContent {
  message: string;
  progress?: number;
  image_url?: string | null;
  file_type?: string;
  success?: boolean;
  unique_id?: string;
}

export interface ImageGenerationCompleteContent {
  message: string;
  success: boolean;
  image_url?: string;
  file_type?: string;
  progress?: number;
  unique_id?: string;
}

// 视频生成内容类型
export interface VideoGenerationStartContent {
  message: string;
  file_id?: string;
  video_url?: string | null;
  file_type?: string;
  mode?: string;
  unique_id?: string;
}

export interface VideoGenerationProgressContent {
  message: string;
  video_url?: string | null;
  file_id?: string;
  progress?: number;
  file_type?: string;
  mode?: string;
  unique_id?: string;
}

export interface VideoGenerationCompleteContent {
  message: string;
  success: boolean;
  video_url?: string;
  file_type?: string;
  file_id?: string;
  progress?: number;
  mode?: string;
  unique_id?: string;
}

// 错误内容类型
export interface ErrorContent {
  message: string;
  error_code?: string;
}

// 用户发送的消息内容
export interface UserMessageContent {
  content: string;
}

// AI机器人消息内容格式（保持向后兼容）
// export interface AIMessageContent {
//   message: string;
//   is_vip: boolean;
// }

// 聊天消息项（用于实际聊天显示）
export interface ChatMessage {
  id?: number | string;  // 用户消息使用id（来自历史消息的id），AI消息使用unique_id
  content: any;
  time: string;
  type: ChatType;
  avatar?: string;
  isSelf: boolean;
  // AI消息相关字段
  isTyping?: boolean;
  displayedText?: string;
  isLoading?: boolean;
  hasError?: boolean;
  sender_id?: number;
  recipient_id?: number;
  unique_id?: string;  // AI消息的唯一标识符
  message_id?: number; // 消息ID
  response_id?: number; // 回复ID，用于TTS等功能
  progress?: number;
  imageUrl?: string;
  videoUrl?: string;
  collectionId?: number;
  loadingIndicator?: "default" | "blobs";
}

export type CollectionAssetType = "collection_image" | "collection_video";

export interface CollectionAssetGroup {
  type: CollectionAssetType;
  filenames: string[];
  fileCount?: number;
}

export interface CollectionMessageContent {
  id: number;
  title?: string;
  description?: string;
  price?: number | null;
  discountPrice?: number | null;
  purchaseCount?: number;
  isFree?: boolean;
  isFeatured?: boolean;
  imageCount: number;
  videoCount: number;
  coverImage?: string;
  createdTime?: string;
  companionId?: number;
  purchased: boolean;
  isPurchasing?: boolean;
  assetGroups: CollectionAssetGroup[];
}

export interface CollectionPurchaseSuccessContent {
  collectionId?: number;
  type: CollectionAssetType;
  uniqueId?: string;
  fileCount?: number;
  filenames: string[];
  title?: string;
  description?: string;
  price?: number | null;
  discountPrice?: number | null;
  purchaseCount?: number;
  imageCount?: number;
  videoCount?: number;
  coverImage?: string;
  isFree?: boolean;
  isFeatured?: boolean;
  companionId?: number;
  createdTime?: string;
}

// 历史消息接口
export interface HistoryMessage {
  id: number;
  type: string;
  content: string;
  additional_data: any;
  is_processed_by_third_party: boolean;
  created_at: string;
  updated_at: string;
  response_id: number;
  response_type: string;
  response_content: string;
  response_additional_data: any;
  response_is_from_third_party: boolean;
  response_created_at: string;
}

// MessageItem接口（用于消息列表显示）
export interface MessageItem {
  id: number;
  name: string;
  cover_video_url: string;
  head_image: string;
  t_head_image:string;
  s_head_image:string;
  user_id: number;
  companion_id: number;
  message_response_id: number;
  content: string;
  s_content?: string;
  description?: string;
  message_response_created_at: string;
  // 聊天相关字段
  time?: string;
  type?: ChatType;
  avatar?: string;
  isSelf?: boolean;
  lastMessage?: string;
  liked?: boolean; // 点赞状态
  // 未读消息相关字段
  unread_count?: number; // 未读消息数量
  is_read?: boolean; // 是否已读
  last_read_time?: string; // 最后阅读时间

}
