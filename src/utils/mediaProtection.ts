/**
 * 媒体保护工具函数
 * 用于防止用户通过右键、拖拽等方式保存图片和视频
 */

// 阻止默认事件的通用函数
export const preventDefault = (event: Event): void => {
  event.preventDefault();
  event.stopPropagation();
};

// 阻止右键菜单
export const preventContextMenu = (event: MouseEvent): void => {
  preventDefault(event);
};

// 阻止拖拽开始
export const preventDragStart = (event: DragEvent): void => {
  preventDefault(event);
};

// 阻止选择文本
export const preventSelectStart = (event: Event): void => {
  preventDefault(event);
};

// 阻止键盘快捷键保存
export const preventKeyboardSave = (event: KeyboardEvent): void => {
  // 阻止 Ctrl+S (保存)
  if ((event.ctrlKey || event.metaKey) && event.key === 's') {
    preventDefault(event);
    return;
  }
  
  // 阻止 Ctrl+P (打印)
  if ((event.ctrlKey || event.metaKey) && event.key === 'p') {
    preventDefault(event);
    return;
  }
  
  // 注意：我们不再阻止 Ctrl+C (复制)、Ctrl+V (粘贴)、Ctrl+X (剪切)、Ctrl+A (全选) 等常用操作
  // 这些是用户正常操作所需的功能，不应该被阻止
};

// 为媒体元素添加保护事件监听器
export const addMediaProtection = (element: HTMLElement): void => {
  if (!element) return;
  
  // 阻止右键菜单
  element.addEventListener('contextmenu', preventContextMenu, { passive: false });
  
  // 阻止拖拽
  element.addEventListener('dragstart', preventDragStart, { passive: false });
  
  // 阻止选择
  element.addEventListener('selectstart', preventSelectStart, { passive: false });
  
  // 阻止鼠标按下选择
  element.addEventListener('mousedown', (event: MouseEvent) => {
    if (event.button === 2) { // 右键
      preventDefault(event);
    }
  }, { passive: false });
  
  // 阻止触摸长按（移动端）
  element.addEventListener('touchstart', (event: TouchEvent) => {
    // 如果是长按（超过500ms），阻止默认行为
    let touchTimer: NodeJS.Timeout;
    touchTimer = setTimeout(() => {
      preventDefault(event);
    }, 500);
    
    element.addEventListener('touchend', () => {
      clearTimeout(touchTimer);
    }, { once: true });
    
    element.addEventListener('touchcancel', () => {
      clearTimeout(touchTimer);
    }, { once: true });
  }, { passive: false });
};

// 移除媒体元素的保护事件监听器
export const removeMediaProtection = (element: HTMLElement): void => {
  if (!element) return;
  
  element.removeEventListener('contextmenu', preventContextMenu);
  element.removeEventListener('dragstart', preventDragStart);
  element.removeEventListener('selectstart', preventSelectStart);
};

// 为整个文档添加全局保护
export const addGlobalMediaProtection = (): void => {
  // 阻止全局右键菜单（仅针对媒体元素）
  document.addEventListener('contextmenu', (event: MouseEvent) => {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.closest('.media-protected'))) {
      preventDefault(event);
    }
  }, { passive: false });
  
  // 阻止全局拖拽（仅针对媒体元素）
  document.addEventListener('dragstart', (event: DragEvent) => {
    const target = event.target as HTMLElement;
    if (target && (target.tagName === 'IMG' || target.tagName === 'VIDEO' || target.closest('.media-protected'))) {
      preventDefault(event);
    }
  }, { passive: false });
  
  // 阻止键盘快捷键
  document.addEventListener('keydown', preventKeyboardSave, { passive: false });
};

// 移除全局保护
export const removeGlobalMediaProtection = (): void => {
  document.removeEventListener('contextmenu', preventContextMenu);
  document.removeEventListener('dragstart', preventDragStart);
  document.removeEventListener('keydown', preventKeyboardSave);
};

// Vue 3 组合式函数：使用媒体保护
export const useMediaProtection = () => {
  const protectElement = (element: HTMLElement) => {
    addMediaProtection(element);
  };
  
  const unprotectElement = (element: HTMLElement) => {
    removeMediaProtection(element);
  };
  
  return {
    protectElement,
    unprotectElement,
    addGlobalMediaProtection,
    removeGlobalMediaProtection
  };
};