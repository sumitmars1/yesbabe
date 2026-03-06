import { ref, nextTick, onMounted, onUnmounted, watch } from 'vue';
import BScroll from '@better-scroll/core';
import PullUp from '@better-scroll/pull-up';
import PullDown from '@better-scroll/pull-down';
import ScrollBar from '@better-scroll/scroll-bar';

// 注册插件
BScroll.use(PullUp);
BScroll.use(PullDown);
BScroll.use(ScrollBar);

export interface BetterScrollOptions {
  pullUpLoad?: boolean;
  pullDownRefresh?: boolean;
  scrollbar?: boolean;
  click?: boolean;
  bounce?: boolean;
  mouseWheel?: boolean;
  autoScrollToBottom?: boolean;
}

export function useBetterScroll(options: BetterScrollOptions = {}) {
  const scrollRef = ref<HTMLElement>();
  const bScrollInstance = ref<BScroll>();
  const isScrollToBottom = ref(true);
  
  // 滚动状态
  const isPullingUp = ref(false);
  const isPullingDown = ref(false);
  const isScrolling = ref(false);
  
  // 回调函数
  const onPullUpLoad = ref<() => Promise<void>>();
  const onPullDownRefresh = ref<() => Promise<void>>();
  const onScrollToBottom = ref<() => void>();
  const onScroll = ref<(pos: { x: number; y: number }) => void>();

  /**
   * 初始化BetterScroll
   */
  const initBScroll = () => {
    if (!scrollRef.value) return;

    const defaultOptions = {
      click: true,
      bounce: {
        top: true,
        bottom: true
      },
      scrollY: true,
      scrollX: false,
      mouseWheel: {
        speed: 20,
        invert: false,
        easeTime: 300
      },
      pullUpLoad: options.pullUpLoad || false,
      pullDownRefresh: options.pullDownRefresh ? {
        threshold: 50,
        stop: 20
      } : false,
      scrollbar: options.scrollbar ? {
        fade: true,
        interactive: false
      } : false,
      preventDefault: false,
      preventDefaultException: {
        tagName: /^(INPUT|TEXTAREA|BUTTON|SELECT|A)$/
      },
      // 确保滚动能够正常工作
      probeType: 3,
      startY: 0,
      momentum: true,
      deceleration: 0.0006
    };

    try {
      bScrollInstance.value = new BScroll(scrollRef.value, defaultOptions);
      console.log('BetterScroll初始化成功');
      setupEventListeners();
    } catch (error) {
      console.error('BetterScroll初始化失败:', error);
    }
  };

  /**
   * 设置事件监听器
   */
  const setupEventListeners = () => {
    if (!bScrollInstance.value) return;

    // 滚动事件
    bScrollInstance.value.on('scroll', (pos: { x: number; y: number }) => {
      isScrolling.value = true;
      
      // 检查是否滚动到底部
      const { maxScrollY, y } = bScrollInstance.value!;
      const threshold = 50; // 50px的阈值
      isScrollToBottom.value = Math.abs(y - maxScrollY) <= threshold;
      
      onScroll.value?.(pos);
    });

    // 滚动结束事件
    bScrollInstance.value.on('scrollEnd', () => {
      isScrolling.value = false;
    });

    // 上拉加载事件
    if (options.pullUpLoad) {
      bScrollInstance.value.on('pullingUp', async () => {
        isPullingUp.value = true;
        
        try {
          await onPullUpLoad.value?.();
        } catch (error) {
          console.error('上拉加载失败:', error);
        } finally {
          isPullingUp.value = false;
          bScrollInstance.value?.finishPullUp();
          bScrollInstance.value?.refresh();
        }
      });
    }

    // 下拉刷新事件
    if (options.pullDownRefresh) {
      bScrollInstance.value.on('pullingDown', async () => {
        isPullingDown.value = true;
        
        try {
          await onPullDownRefresh.value?.();
        } catch (error) {
          console.error('下拉刷新失败:', error);
        } finally {
          isPullingDown.value = false;
          bScrollInstance.value?.finishPullDown();
          bScrollInstance.value?.refresh();
        }
      });
    }

    // 触底事件
    bScrollInstance.value.on('scrollEnd', () => {
      const { maxScrollY, y } = bScrollInstance.value!;
      if (Math.abs(y - maxScrollY) <= 5) {
        onScrollToBottom.value?.();
      }
    });
  };

  /**
   * 滚动到底部
   */
  const scrollToBottom = (duration: number = 300, easing?: any) => {
    if (!bScrollInstance.value) return;
    
    return new Promise<void>((resolve) => {
      bScrollInstance.value!.scrollTo(0, bScrollInstance.value!.maxScrollY, duration, easing);
      
      if (duration > 0) {
        setTimeout(() => {
          isScrollToBottom.value = true;
          resolve();
        }, duration);
      } else {
        isScrollToBottom.value = true;
        resolve();
      }
    });
  };

  /**
   * 滚动到顶部
   */
  const scrollToTop = (duration: number = 300, easing?: any) => {
    if (!bScrollInstance.value) return;
    
    return new Promise<void>((resolve) => {
      bScrollInstance.value!.scrollTo(0, 0, duration, easing);
      
      if (duration > 0) {
        setTimeout(() => {
          resolve();
        }, duration);
      } else {
        resolve();
      }
    });
  };

  /**
   * 滚动到指定位置
   */
  const scrollTo = (x: number, y: number, duration: number = 300, easing?: any) => {
    if (!bScrollInstance.value) return;
    
    return new Promise<void>((resolve) => {
      bScrollInstance.value!.scrollTo(x, y, duration, easing);
      
      if (duration > 0) {
        setTimeout(() => {
          resolve();
        }, duration);
      } else {
        resolve();
      }
    });
  };

  /**
   * 刷新scroll实例
   */
  const refresh = () => {
    nextTick(() => {
      bScrollInstance.value?.refresh();
    });
  };

  /**
   * 启用/禁用上拉加载
   */
  const togglePullUpLoad = (enable: boolean) => {
    if (!bScrollInstance.value) return;
    
    if (enable) {
      bScrollInstance.value.openPullUp();
    } else {
      bScrollInstance.value.closePullUp();
    }
  };

  /**
   * 完成上拉加载
   */
  const finishPullUp = () => {
    bScrollInstance.value?.finishPullUp();
  };

  /**
   * 完成下拉刷新
   */
  const finishPullDown = () => {
    bScrollInstance.value?.finishPullDown();
  };

  /**
   * 自动滚动到底部（当有新消息时）
   */
  const autoScrollToBottom = (force: boolean = false) => {
    // 如果用户不在底部且不是强制滚动，则不自动滚动
    if (!force && !isScrollToBottom.value && !isScrolling.value) {
      return;
    }
    
    nextTick(() => {
      scrollToBottom(300);
    });
  };

  /**
   * 监听内容变化并自动滚动
   */
  const watchContentChange = (dependencies: any[]) => {
    watch(
      dependencies,
      () => {
        refresh();
        if (options.autoScrollToBottom !== false) {
          autoScrollToBottom();
        }
      },
      { deep: true, flush: 'post' }
    );
  };

  /**
   * 销毁scroll实例
   */
  const destroy = () => {
    if (bScrollInstance.value) {
      bScrollInstance.value.destroy();
      bScrollInstance.value = undefined;
    }
  };

  // 生命周期管理
  onMounted(() => {
    nextTick(() => {
      initBScroll();
    });
  });

  onUnmounted(() => {
    destroy();
  });

  return {
    // DOM引用
    scrollRef,
    
    // 滚动实例
    bScrollInstance,
    
    // 状态
    isScrollToBottom,
    isPullingUp,
    isPullingDown,
    isScrolling,
    
    // 回调设置
    onPullUpLoad,
    onPullDownRefresh,
    onScrollToBottom,
    onScroll,
    
    // 方法
    initBScroll,
    scrollToBottom,
    scrollToTop,
    scrollTo,
    refresh,
    togglePullUpLoad,
    finishPullUp,
    finishPullDown,
    autoScrollToBottom,
    watchContentChange,
    destroy
  };
}