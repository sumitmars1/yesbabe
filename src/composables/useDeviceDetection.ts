import { ref, computed } from 'vue';

/**
 * 设备检测组合函数
 * 用于检测用户设备类型和浏览器信息，为滚动优化提供基础
 */
export function useDeviceDetection() {
  // 获取用户代理字符串
  const userAgent = navigator.userAgent;

  // 检测是否为iOS设备
  const isIOS = computed(() => {
    return /iPad|iPhone|iPod/.test(userAgent) && !(window as any).MSStream;
  });

  // 检测是否为iOS Safari浏览器
  const isIOSSafari = computed(() => {
    return isIOS.value && /Safari/.test(userAgent) && !/CriOS|FxiOS/.test(userAgent);
  });

  // 检测是否为Android设备
  const isAndroid = computed(() => {
    return /Android/.test(userAgent);
  });

  // 检测是否为Android Chrome
  const isAndroidChrome = computed(() => {
    return isAndroid.value && /Chrome/.test(userAgent) && !/Edge/.test(userAgent);
  });

  // 检测是否为移动设备
  const isMobile = computed(() => {
    return isIOS.value || isAndroid.value || /Mobile/.test(userAgent);
  });

  // 检测是否为桌面设备
  const isDesktop = computed(() => {
    return !isMobile.value;
  });

  // 检测是否支持触摸
  const isTouchDevice = computed(() => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0;
  });

  // 检测是否支持现代滚动API
  const supportsScrollBehavior = computed(() => {
    return 'scrollBehavior' in document.documentElement.style;
  });

  // 检测是否支持IntersectionObserver
  const supportsIntersectionObserver = computed(() => {
    return 'IntersectionObserver' in window;
  });

  // 获取设备类型字符串
  const deviceType = computed(() => {
    if (isIOSSafari.value) return 'ios-safari';
    if (isIOS.value) return 'ios-other';
    if (isAndroidChrome.value) return 'android-chrome';
    if (isAndroid.value) return 'android-other';
    if (isDesktop.value) return 'desktop';
    return 'unknown';
  });

  // 获取推荐的滚动策略
  const scrollStrategy = computed(() => {
    if (isDesktop.value) return 'desktop';
    if (isIOSSafari.value) return 'ios-webkit';
    if (isAndroid.value) return 'android-standard';
    return 'fallback';
  });

  return {
    // 设备检测
    isIOS,
    isIOSSafari,
    isAndroid,
    isAndroidChrome,
    isMobile,
    isDesktop,
    isTouchDevice,
    
    // 功能支持检测
    supportsScrollBehavior,
    supportsIntersectionObserver,
    
    // 综合信息
    deviceType,
    scrollStrategy,
    userAgent,
  };
}