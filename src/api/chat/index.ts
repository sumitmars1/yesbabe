import http from '@/utils/http';
import { CompanionInfo } from './types';
import { MessageItem } from '@/types/chat';
import type { AxiosRequestConfig, AxiosResponse } from 'axios';
/**
 * 获取当前聊天用户信息
 * @param companionId 聊天伴侣ID
 */
export const getCurrentCompanion = (companionId: number) => {
    return http.request<AxiosResponse<CompanionInfo>>({
        method: "get",
        url: `/companion/current`,
        params: {
            companion_id: companionId
        }
    });
};

export const getCurrentCompanionWithConfig = (
  companionId: number,
  config?: AxiosRequestConfig
) => {
  return http.request<AxiosResponse<CompanionInfo>>({
    method: "get",
    url: `/companion/current`,
    params: {
      companion_id: companionId,
    },
    ...(config || {}),
  });
};

/**
 * 获取消息列表
 * @param params 查询参数
 */
export const getMessageList = (params?: { page?: number; pageSize?: number }) => {
    return http.request<AxiosResponse<MessageItem[]>>({
        method: "get",
        url: "/message/message_list",
        params
    });
};

/**
 * 获取历史聊天记录
 * @param companion_id 角色ID
 * @param page 页码(从1开始)
 * @param size 每页数量
 */
export const getHistoryMessages = (companion_id: number, page: number, size: number) => {
    return http.request<AxiosResponse<any>>({
        method: 'get',
        url: '/message/history',
        params: {
            companion_id,
            page,
            size
        }
    });
};

export const getHistoryMessagesWithConfig = (
  companion_id: number,
  page: number,
  size: number,
  config?: AxiosRequestConfig
) => {
  return http.request<AxiosResponse<any>>({
    method: "get",
    url: "/message/history",
    params: {
      companion_id,
      page,
      size,
    },
    ...(config || {}),
  });
};

/**
 * 获取生成的图片或视频
 * @param filename 文件名
 */
export const getGeneratedImage = (filename: string) => {
    const prefix = import.meta.env.VITE_API_PREFIX || '';
    return `${prefix}/gen_image/file/${filename}`;
};

/**
 * 获取合集文件的直链
 * @param filename 文件名
 */
export const getCollectionImageUrl = (filename: string) => {
    const prefix = import.meta.env.VITE_API_PREFIX || '';
    return `${prefix}/gen_image/collection/?filename=${encodeURIComponent(filename)}`;
};

/**
 * 获取合集文件
 * @param filename 文件名
 */
export const getCollectionFile = (filename: string) => {
    return http.request<Blob>({
        method: 'get',
        url: `/gen_image/collection/`,
        params: {
            filename,
        },
        responseType: 'blob',
        headers: {
            repeatSubmit: false // Disable request deduplication for media files
        },
    });
};

/**
 * 获取默认推荐的AI模型列表（用于新用户初始化）
 * @param limit 获取数量，默认5个
 */
export const getDefaultCompanions = (limit: number = 5) => {
    return http.request<AxiosResponse<MessageItem[]>>({
        method: "get",
        url: "/companion/default",
        params: {
            limit
        }
    });
};

/**
 * 文字转语音流式接口
 * @param responseId 消息回复ID
 * @returns 音频流 Blob
 */
export const getTextToSpeech = (responseId: number) => {
    return http.request<Blob>({
        method: 'get',
        url: '/message/tts/stream',
        params: {
            response_id: responseId,
            token: '文转语音'
        },
        responseType: 'blob',
        headers: {
            repeatSubmit: false
        }
    });
};
