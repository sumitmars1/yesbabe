/**
 * 时间格式化工具类
 * 将ISO 8601格式的时间转换为相对时间描述
 */

/**
 * 将ISO时间字符串转换为相对时间描述
 * @param isoTimeString ISO 8601格式的时间字符串
 * @param t i18n翻译函数
 * @returns 相对时间描述（刚刚、X分钟前、X小时前、X天前等）
 */
export function formatRelativeTime(isoTimeString: string, t?: (key: string, params?: any) => string): string {
  const now = new Date();
  const targetTime = new Date(isoTimeString);
  
  // 计算时间差（毫秒）
  const timeDiff = now.getTime() - targetTime.getTime();
  
  // 如果时间差为负数，说明是未来时间，返回"刚刚"
  if (timeDiff < 0) {
    return t ? t('time.justNow') : '刚刚';
  }
  
  // 转换为秒
  const seconds = Math.floor(timeDiff / 1000);
  
  // 小于1分钟
  if (seconds < 60) {
    return t ? t('time.justNow') : '刚刚';
  }
  
  // 转换为分钟
  const minutes = Math.floor(seconds / 60);
  
  // 小于1小时
  if (minutes < 60) {
    return t ? t('time.minutesAgo', { n: minutes }) : `${minutes}分钟前`;
  }
  
  // 转换为小时
  const hours = Math.floor(minutes / 60);
  
  // 小于1天
  if (hours < 24) {
    return t ? t('time.hoursAgo', { n: hours }) : `${hours}小时前`;
  }
  
  // 转换为天数
  const days = Math.floor(hours / 24);
  
  // 小于等于7天
  if (days <= 7) {
    return t ? t('time.daysAgo', { n: days }) : `${days}天前`;
  }
  
  // 超过7天，返回"7天前"
  return t ? t('time.daysAgo', { n: 7 }) : '7天前';
}

/**
 * 格式化时间为具体日期（备用函数）
 * @param isoTimeString ISO 8601格式的时间字符串
 * @returns 格式化的日期字符串
 */
export function formatDateTime(isoTimeString: string): string {
  const date = new Date(isoTimeString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
}
