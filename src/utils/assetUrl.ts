/**
 * 静态资源URL处理工具
 * 用于在开发环境中处理远程静态资源URL
 */

/**
 * 将远程静态资源URL转换为本地开发服务器URL
 * @param url 原始URL
 * @returns 处理后的URL
 */
export function handleAssetUrl(url: string | undefined | null): string {
  if (!url) return '';
  
  // 检查URL是否为远程服务器上的资源
  const remoteBaseUrl = import.meta.env.VITE_WS_ASSETS_URL;
  
  // 如果是开发环境且URL包含远程服务器地址，则替换为本地地址
  if (import.meta.env.DEV && url.startsWith(remoteBaseUrl)) {
    // 移除远程服务器基础URL，保留路径部分
    return url.replace(remoteBaseUrl, '');
  }
  
  return url;
}

/**
 * 将相对路径转换为完整的资源URL
 * @param path 相对路径（如 /s/covers/girls/1/video.mp4）
 * @returns 完整的URL（如 https://yesbabeabc.com/s/covers/girls/1/video.mp4）
 */
export function getFullAssetUrl(path: string | undefined | null): string {
  if (!path) return '';
  
  // 如果已经是完整URL，直接返回
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  // 获取基础URL
  const baseUrl = import.meta.env.VITE_WS_ASSETS_URL || import.meta.env.VITE_API_BASE_URL;
  
  // 确保 path以/开头
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  
  // 拼接完整URL
  return `${baseUrl}${normalizedPath}`;
}