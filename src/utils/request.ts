/**
 * 带指纹信息的请求工具函数
 * 自动处理channel_code参数和指纹信息
 */

import http from '@/utils/http';
import { getChannelCodeFromUrl } from '@/utils/fingerprint';
import type { AxiosRequestConfig } from 'axios';

/**
 * 带指纹信息的请求函数
 * 自动完成以下功能：
 * 1. 解析URL中的channel_code参数
 * 2. 拼接channel_code到请求URL
 * 3. 自动添加指纹信息到请求头（通过HTTP拦截器）
 * 4. 发起请求并返回结果
 * 
 * @param config - Axios请求配置
 * @returns Promise<T> - 请求结果
 */
export async function fetchWithFingerprint<T = any>(
  config: AxiosRequestConfig
): Promise<T> {
  // 获取URL中的channel_code参数
  const channelCode = getChannelCodeFromUrl();
  
  // 如果存在channel_code，则添加到请求参数中
  if (channelCode && config.url) {
    const url = new URL(config.url, window.location.origin);
    url.searchParams.set('channel_code', channelCode);
    
    // 如果是相对路径，只保留pathname和search部分
    if (config.url.startsWith('/')) {
      config.url = url.pathname + url.search;
    } else {
      config.url = url.toString();
    }
  }
  
  // 使用现有的http实例发起请求（会自动添加X-Fingerprint请求头）
  return http.request<T>(config);
}

/**
 * GET请求的便捷方法
 * @param url - 请求URL
 * @param params - 查询参数
 * @param config - 额外的请求配置
 * @returns Promise<T> - 请求结果
 */
export function getWithFingerprint<T = any>(
  url: string,
  params?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return fetchWithFingerprint<T>({
    method: 'get',
    url,
    params,
    ...config
  });
}

/**
 * POST请求的便捷方法
 * @param url - 请求URL
 * @param data - 请求数据
 * @param config - 额外的请求配置
 * @returns Promise<T> - 请求结果
 */
export function postWithFingerprint<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return fetchWithFingerprint<T>({
    method: 'post',
    url,
    data,
    ...config
  });
}

/**
 * PUT请求的便捷方法
 * @param url - 请求URL
 * @param data - 请求数据
 * @param config - 额外的请求配置
 * @returns Promise<T> - 请求结果
 */
export function putWithFingerprint<T = any>(
  url: string,
  data?: any,
  config?: AxiosRequestConfig
): Promise<T> {
  return fetchWithFingerprint<T>({
    method: 'put',
    url,
    data,
    ...config
  });
}

/**
 * DELETE请求的便捷方法
 * @param url - 请求URL
 * @param config - 额外的请求配置
 * @returns Promise<T> - 请求结果
 */
export function deleteWithFingerprint<T = any>(
  url: string,
  config?: AxiosRequestConfig
): Promise<T> {
  return fetchWithFingerprint<T>({
    method: 'delete',
    url,
    ...config
  });
}