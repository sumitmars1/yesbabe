import { ref, nextTick } from 'vue';
import { useDeviceDetection } from './useDeviceDetection';

/**
 * 滚动管理组合函数
 * 提供统一的滚动到底部功能，针对不同设备和浏览器进行优化
 */
export function useScrollManager() {
  const { scrollStrategy, isIOSSafari, isAndroid, isDesktop } = useDeviceDetection();
  
  // 防抖控制
  const isScrolling = ref(false);
  const scrollDebounceTimer = ref<number | null>(null);
  
  /**
   * 检查是否已经滚动到底部
   * @param container 滚动容器元素
   * @returns 是否在底部
   */
  const isAtBottom = (container: HTMLElement): boolean => {
    const threshold = 10; // 10px的容差
    return container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
  };

  /**
   * 获取滚动容器元素
   * @param scrollbarRef Naive UI scrollbar组件引用
   * @returns 实际的滚动容器元素
   */
  const getScrollContainer = (scrollbarRef: any): HTMLElement | null => {
    if (!scrollbarRef?.value) return null;
    
    try {
      // 方法1：尝试通过$el获取容器
      if (scrollbarRef.value.$el && typeof scrollbarRef.value.$el.querySelector === 'function') {
        const naiveContainer = scrollbarRef.value.$el.querySelector('.n-scrollbar-container');
        if (naiveContainer) return naiveContainer;
      }
      
      // 方法2：尝试直接访问内部容器
      if (scrollbarRef.value.containerRef?.value) {
        return scrollbarRef.value.containerRef.value;
      }
      
      // 方法3：尝试通过组件实例获取
      if (scrollbarRef.value.scrollbarInstRef?.value) {
        const container = scrollbarRef.value.scrollbarInstRef.value.$el?.querySelector('.n-scrollbar-container');
        if (container) return container;
      }
      
      // 方法4：降级方案 - 直接使用$el
      if (scrollbarRef.value.$el) {
        return scrollbarRef.value.$el;
      }
      
      // 方法5：最终降级方案
      return scrollbarRef.value;
    } catch (error) {
      console.warn('获取滚动容器失败:', error);
      return null;
    }
  };

  /**
   * iOS Safari专用滚动实现
   * 使用WebKit优化和防bounce机制
   */
  const scrollToBottomIOS = async (container: HTMLElement, smooth = true): Promise<void> => {
    return new Promise((resolve) => {
      // 防止bounce效果：确保不会滚动到完全底部
      const targetScrollTop = Math.max(0, container.scrollHeight - container.clientHeight - 1);
      
      if (smooth) {
        // 使用requestAnimationFrame实现平滑滚动
        const startScrollTop = container.scrollTop;
        const distance = targetScrollTop - startScrollTop;
        const duration = 300; // 300ms动画
        const startTime = performance.now();
        
        const animateScroll = (currentTime: number) => {
          const elapsed = currentTime - startTime;
          const progress = Math.min(elapsed / duration, 1);
          
          // 使用easeOutCubic缓动函数
          const easeProgress = 1 - Math.pow(1 - progress, 3);
          container.scrollTop = startScrollTop + distance * easeProgress;
          
          if (progress < 1) {
            requestAnimationFrame(animateScroll);
          } else {
            resolve();
          }
        };
        
        requestAnimationFrame(animateScroll);
      } else {
        container.scrollTop = targetScrollTop;
        resolve();
      }
    });
  };

  /**
   * Android浏览器专用滚动实现
   * 使用标准API和overscroll控制
   */
  const scrollToBottomAndroid = async (container: HTMLElement, smooth = true): Promise<void> => {
    try {
      // 计算正确的滚动位置
      const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
      
      if (container.scrollTo) {
        container.scrollTo({
          top: maxScrollTop,
          behavior: smooth ? 'smooth' : 'auto'
        });
      } else {
        // 降级方案
        container.scrollTop = maxScrollTop;
      }
    } catch (error) {
      console.warn('Android滚动失败，使用降级方案:', error);
      container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
    }
  };

  /**
   * 桌面端滚动实现
   * 使用Naive UI的scrollTo方法
   */
  const scrollToBottomDesktop = async (scrollbarRef: any, smooth = true): Promise<void> => {
    try {
      // 优先使用Naive UI的scrollTo方法
      if (scrollbarRef?.value?.scrollTo && typeof scrollbarRef.value.scrollTo === 'function') {
        await scrollbarRef.value.scrollTo({
          position: 'bottom',
          behavior: smooth ? 'smooth' : 'auto'
        });
        return;
      }
      
      // 降级方案1：尝试使用scrollToBottom方法
      if (scrollbarRef?.value?.scrollToBottom && typeof scrollbarRef.value.scrollToBottom === 'function') {
        await scrollbarRef.value.scrollToBottom({ behavior: smooth ? 'smooth' : 'auto' });
        return;
      }
      
      // 降级方案2：直接操作容器
      const container = getScrollContainer(scrollbarRef);
      if (container) {
        // 计算正确的滚动位置：总高度减去可视高度
        const maxScrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
        
        if (smooth && container.scrollTo) {
          container.scrollTo({
            top: maxScrollTop,
            behavior: 'smooth'
          });
        } else {
          container.scrollTop = maxScrollTop;
        }
      }
    } catch (error) {
      console.warn('桌面端滚动失败，使用最终降级方案:', error);
      try {
        const container = getScrollContainer(scrollbarRef);
        if (container) {
          // 计算正确的滚动位置
          container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
        }
      } catch (fallbackError) {
        console.error('所有滚动方案都失败了:', fallbackError);
      }
    }
  };

  /**
   * 通用滚动到底部函数
   * 根据设备类型选择最优的滚动策略
   */
  const scrollToBottom = async (scrollbarRef: any, options: {
    smooth?: boolean;
    force?: boolean;
    delay?: number;
  } = {}): Promise<void> => {
    const { smooth = true, force = false, delay = 0 } = options;
    
    // 防抖控制
    if (isScrolling.value && !force) {
      return;
    }
    
    // 清除之前的防抖定时器
    if (scrollDebounceTimer.value) {
      clearTimeout(scrollDebounceTimer.value);
    }
    
    return new Promise((resolve) => {
      const executeScroll = async () => {
        isScrolling.value = true;
        
        try {
          // 等待DOM更新
          await nextTick();
          
          const container = getScrollContainer(scrollbarRef);
          if (!container) {
            console.warn('未找到滚动容器');
            return;
          }
          
          // 检查是否需要滚动
          if (!force && isAtBottom(container)) {
            return;
          }
          
          // 根据设备类型选择滚动策略
          switch (scrollStrategy.value) {
            case 'ios-webkit':
              await scrollToBottomIOS(container, smooth);
              break;
            case 'android-standard':
              await scrollToBottomAndroid(container, smooth);
              break;
            case 'desktop':
              await scrollToBottomDesktop(scrollbarRef, smooth);
              break;
            default:
              // 降级方案
              container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
          }
        } catch (error) {
          console.error('滚动到底部失败:', error);
          // 最终降级方案
          const container = getScrollContainer(scrollbarRef);
          if (container) {
            container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
          }
        } finally {
          isScrolling.value = false;
          resolve();
        }
      };
      
      if (delay > 0) {
        scrollDebounceTimer.value = window.setTimeout(executeScroll, delay);
      } else {
        executeScroll();
      }
    });
  };

  /**
   * 防抖滚动函数
   * 在短时间内多次调用时，只执行最后一次
   */
  const debouncedScrollToBottom = (scrollbarRef: any, options: {
    smooth?: boolean;
    force?: boolean;
    debounceMs?: number;
  } = {}): Promise<void> => {
    const { debounceMs = 100, ...scrollOptions } = options;
    
    return scrollToBottom(scrollbarRef, {
      ...scrollOptions,
      delay: debounceMs
    });
  };

  /**
   * 调试函数：打印scrollbarRef的结构
   * 用于诊断Naive UI组件的内部结构
   */
  const debugScrollbarRef = (scrollbarRef: any) => {
    if (!scrollbarRef?.value) {
      console.log('scrollbarRef is null or undefined');
      return;
    }
    
    console.log('scrollbarRef.value:', scrollbarRef.value);
    console.log('scrollbarRef.value keys:', Object.keys(scrollbarRef.value));
    console.log('scrollbarRef.value.$el:', scrollbarRef.value.$el);
    console.log('scrollbarRef.value.containerRef:', scrollbarRef.value.containerRef);
    console.log('scrollbarRef.value.scrollbarInstRef:', scrollbarRef.value.scrollbarInstRef);
    
    if (scrollbarRef.value.$el) {
      console.log('$el type:', typeof scrollbarRef.value.$el);
      console.log('$el querySelector:', typeof scrollbarRef.value.$el.querySelector);
    }
  };

  /**
   * 清理函数
   * 组件卸载时调用，清理定时器
   */
  const cleanup = () => {
    if (scrollDebounceTimer.value) {
      clearTimeout(scrollDebounceTimer.value);
      scrollDebounceTimer.value = null;
    }
    isScrolling.value = false;
  };

  return {
    scrollToBottom,
    debouncedScrollToBottom,
    isAtBottom,
    isScrolling,
    cleanup,
    
    // 调试信息
    scrollStrategy,
    getScrollContainer,
    debugScrollbarRef,
  };
}