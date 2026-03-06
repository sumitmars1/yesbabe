import { ref, computed, onMounted, onUnmounted, nextTick } from 'vue';
import { useDeviceDetection } from './useDeviceDetection';

/**
 * 移动端聊天体验优化组合函数
 * 专门处理移动端键盘弹出、视口变化和滚动优化
 * 参考微信聊天体验实现
 */
export function useMobileChatExperience() {
  const { isMobile, isIOSSafari, isAndroid } = useDeviceDetection();
  
  // 响应式状态
  const isKeyboardVisible = ref(false);
  const viewportHeight = ref(window.innerHeight);
  const keyboardHeight = ref(0);
  const chatContainerHeight = ref('calc(100vh - 186px)');
  const inputAreaHeight = ref(72); // 底部输入区域高度（动态测量）
  
  // 原始视口高度（用于计算键盘高度）
  let originalViewportHeight = window.innerHeight;
  let visualViewport: VisualViewport | null = null;
  let resizeTimer: number | null = null;
  let lastMessageObserver: IntersectionObserver | null = null;
  
  // 过去用于阻止默认滚动；已弃用以避免阻塞聊天内容滚动
  // const preventDefaultScroll = (e: TouchEvent) => {
  //   e.preventDefault();
  // };
  
  /**
   * 检测键盘是否弹出
   * 使用Visual Viewport API（现代浏览器）或resize事件（降级方案）
   */
  const detectKeyboard = () => {
    if (!isMobile.value) return;
    
    const currentHeight = window.innerHeight;
    const heightDiff = originalViewportHeight - currentHeight;
    
    // 键盘检测阈值：高度变化超过150px认为是键盘弹出
    const keyboardThreshold = 150;
    
    if (heightDiff > keyboardThreshold) {
      // 键盘弹出
      if (!isKeyboardVisible.value) {
        isKeyboardVisible.value = true;
        keyboardHeight.value = heightDiff;
        updateChatContainerHeight();
        // 添加body类防止Safari整体页面上抬
        document.body.classList.add('keyboard-visible');
        // 不再阻止全局touchmove，避免聊天内容无法滚动
        console.log('键盘弹出，高度变化:', heightDiff);
      }
    } else {
      // 键盘收起
      if (isKeyboardVisible.value) {
        isKeyboardVisible.value = false;
        keyboardHeight.value = 0;
        updateChatContainerHeight();
        // 移除body类
        document.body.classList.remove('keyboard-visible');
        // 不需要恢复全局touchmove拦截
        console.log('键盘收起');
      }
    }
    
    viewportHeight.value = currentHeight;
  };
  
  /**
   * 使用Visual Viewport API检测键盘（现代浏览器）
   */
  const setupVisualViewport = () => {
    if (typeof window !== 'undefined' && 'visualViewport' in window) {
      visualViewport = window.visualViewport as VisualViewport;
      
      const handleViewportChange = () => {
        if (!visualViewport || !isMobile.value) return;
        
        const heightDiff = window.innerHeight - visualViewport.height;
        const keyboardThreshold = 150;
        
        if (heightDiff > keyboardThreshold) {
          if (!isKeyboardVisible.value) {
            isKeyboardVisible.value = true;
            keyboardHeight.value = heightDiff;
            document.body.classList.add('keyboard-visible');
          }
        } else {
          if (isKeyboardVisible.value) {
            isKeyboardVisible.value = false;
            keyboardHeight.value = 0;
            document.body.classList.remove('keyboard-visible');
          }
        }
        
        viewportHeight.value = visualViewport.height;
        updateChatContainerHeight();
      };
      
      visualViewport.addEventListener('resize', handleViewportChange);
      return () => {
        visualViewport?.removeEventListener('resize', handleViewportChange);
      };
    }
    return null;
  };
  
  /**
   * 更新聊天容器高度
   */
  const updateChatContainerHeight = () => {
    if (!isMobile.value) {
      chatContainerHeight.value = 'calc(100vh - 186px)';
      return;
    }
    
    const headerHeight = 64; // 固定头部高度

    if (isKeyboardVisible.value) {
      // 键盘弹出时，使用 VisualViewport 高度并减去头部与输入区高度
      const availableHeight = Math.max(0, viewportHeight.value - headerHeight - inputAreaHeight.value);
      chatContainerHeight.value = `${availableHeight}px`;
    } else {
      if (isIOSSafari.value) {
        // iOS Safari：使用 VisualViewport/动态视口高度换算，避免 100vh/URL栏问题
        const availableHeight = Math.max(0, viewportHeight.value - headerHeight - inputAreaHeight.value);
        chatContainerHeight.value = `${availableHeight}px`;
      } else {
        // 其他平台：使用 window.innerHeight 计算
        const availableHeight = Math.max(0, window.innerHeight - headerHeight - inputAreaHeight.value);
        chatContainerHeight.value = `${availableHeight}px`;
      }
    }
  };
  
  /**
   * 防抖处理resize事件
   */
  const handleResize = () => {
    if (resizeTimer) {
      clearTimeout(resizeTimer);
    }
    
    resizeTimer = window.setTimeout(() => {
      detectKeyboard();
    }, 100);
  };
  
  /**
   * 强制滚动到底部
   * 专门为移动端优化的滚动方法
   */
  const forceScrollToBottom = async (scrollbarRef: any, options: {
    smooth?: boolean;
    delay?: number;
  } = {}) => {
    const { smooth = true, delay = 0 } = options;
    
    const executeScroll = async () => {
      await nextTick();
      
      if (!scrollbarRef?.value) {
        console.warn('scrollbarRef不存在');
        return;
      }
      
      try {
        // 方法1：使用组件的scrollToBottom方法
        if (typeof scrollbarRef.value.scrollToBottom === 'function') {
          await scrollbarRef.value.scrollToBottom({ smooth });
          return;
        }
        
        // 方法2：直接操作滚动容器
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
          
          // iOS Safari额外处理：确保滚动到位
          if (isIOSSafari.value) {
            setTimeout(() => {
              container.scrollTop = Math.max(0, container.scrollHeight - container.clientHeight);
            }, 50);
          }
        }
      } catch (error) {
        console.error('强制滚动失败:', error);
      }
    };
    
    if (delay > 0) {
      setTimeout(executeScroll, delay);
    } else {
      await executeScroll();
    }
  };
  
  /**
   * 获取滚动容器
   */
  const getScrollContainer = (scrollbarRef: any): HTMLElement | null => {
    if (!scrollbarRef?.value) return null;
    
    try {
      // 尝试多种方式获取滚动容器
      if (scrollbarRef.value.$el?.querySelector) {
        const container = scrollbarRef.value.$el.querySelector('.n-scrollbar-container');
        if (container) return container;
      }
      
      if (scrollbarRef.value.containerRef?.value) {
        return scrollbarRef.value.containerRef.value;
      }
      
      return scrollbarRef.value.$el || scrollbarRef.value;
    } catch (error) {
      console.warn('获取滚动容器失败:', error);
      return null;
    }
  };
  
  /**
   * 设置最后一条消息的观察器
   * 用于检测最后一条消息是否在视口中
   */
  const setupLastMessageObserver = (callback: (isVisible: boolean) => void) => {
    if (!isMobile.value) return;
    
    lastMessageObserver = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          callback(entry.isIntersecting);
        });
      },
      {
        root: null,
        rootMargin: '0px',
        threshold: 0.1
      }
    );
    
    return lastMessageObserver;
  };
  
  /**
   * 观察最后一条消息
   */
  const observeLastMessage = (element: HTMLElement) => {
    if (lastMessageObserver && element) {
      lastMessageObserver.observe(element);
    }
  };
  
  /**
   * 停止观察最后一条消息
   */
  const unobserveLastMessage = (element: HTMLElement) => {
    if (lastMessageObserver && element) {
      lastMessageObserver.unobserve(element);
    }
  };
  
  /**
   * 处理输入框焦点事件
   */
  const handleInputFocus = async (scrollbarRef: any) => {
    if (!isMobile.value) return;
    
    // iOS需要延迟处理，等待键盘完全弹出
    const delay = isIOSSafari.value ? 300 : 100;
    
    setTimeout(async () => {
      await forceScrollToBottom(scrollbarRef, { smooth: true });
    }, delay);
  };
  
  /**
   * 处理输入框失焦事件
   */
  const handleInputBlur = () => {
    if (!isMobile.value) return;
    
    // 延迟重置，避免键盘收起时的闪烁
    setTimeout(() => {
      if (!isKeyboardVisible.value) {
        updateChatContainerHeight();
      }
    }, 300);
  };
  
  /**
   * 处理发送消息后的滚动
   */
  const handleMessageSent = async (scrollbarRef: any) => {
    // 立即滚动到底部
    await forceScrollToBottom(scrollbarRef, { smooth: false });
    
    // 稍后再次滚动，确保新消息完全渲染
    setTimeout(async () => {
      await forceScrollToBottom(scrollbarRef, { smooth: true });
    }, 100);
  };
  
  // 计算属性
  const mobileOptimizedHeight = computed(() => {
    return chatContainerHeight.value;
  });
  
  const keyboardState = computed(() => ({
    isVisible: isKeyboardVisible.value,
    height: keyboardHeight.value,
    viewportHeight: viewportHeight.value
  }));
  
  // 生命周期
  onMounted(() => {
    if (!isMobile.value) return;
    
    // 记录初始视口高度
    originalViewportHeight = window.innerHeight;
    viewportHeight.value = originalViewportHeight;
    
    // 设置Visual Viewport API监听（如果支持）
    const cleanupVisualViewport = setupVisualViewport();
    
    // 设置resize事件监听（降级方案）
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    
    // 清理函数
    const cleanup = () => {
      if (cleanupVisualViewport) {
        cleanupVisualViewport();
      }
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
      
    // 清理body类
    document.body.classList.remove('keyboard-visible');
      
      if (resizeTimer) {
        clearTimeout(resizeTimer);
      }
      
      if (lastMessageObserver) {
        lastMessageObserver.disconnect();
      }
    };
    
    // 返回清理函数
    onUnmounted(cleanup);

    // 首次进入时根据当前可视高度刷新容器高度
    updateChatContainerHeight();
  });
  
  return {
    // 状态
    isKeyboardVisible,
    keyboardHeight,
    viewportHeight,
    mobileOptimizedHeight,
    keyboardState,
    inputAreaHeight,
    
    // 方法
    forceScrollToBottom,
    handleInputFocus,
    handleInputBlur,
    handleMessageSent,
    setupLastMessageObserver,
    observeLastMessage,
    unobserveLastMessage,
    updateChatContainerHeight,
    setInputAreaHeight: (h: number) => { inputAreaHeight.value = Math.max(40, Math.min(160, Math.round(h))); updateChatContainerHeight(); },
    
    // 工具方法
    getScrollContainer
  };
}
