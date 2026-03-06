import { createApp, h, defineExpose } from 'vue';
import { createDiscreteApi } from 'naive-ui';
import LoginComponent from '@/components/AuthForm/index.vue'; // 根据你的项目结构调整路径
import { createI18nInstance } from '@/utils/i18n';
import { hasRegionRestrictionOverlay } from '@/utils/htmlResponse';

// 定义初始视图类型
type InitialAuthView = 'login' | 'register';

// 定义组件实例接口，确保暴露的方法与组件一致
interface LoginComponentInstance {
  show: (initialView?: InitialAuthView) => void;
  hide: () => void;
}

const createLoginModal = () => {
  // 创建容器元素
  const container = document.createElement('div');
  document.body.appendChild(container);

  // 使用 LoginComponent 作为根组件
  const app = createApp(LoginComponent);
  
  // 为独立应用配置 i18n 和 naive-ui 的 message 实例
  const i18n = createI18nInstance();
  const { message } = createDiscreteApi(['message']);
  
  app.use(i18n);
  app.config.globalProperties.$message = message;

  let componentInstance: LoginComponentInstance | null = null;

  // 保存原始 mount 方法
  const originalMount = app.mount;

  // 重写 mount 方法以获取组件实例
  app.mount = (selectorOrElement: string | Element) => {
    const instance = originalMount.call(app, selectorOrElement);
    // 先将组件实例转换为 unknown 类型，再转换为 LoginComponentInstance 类型
    componentInstance = instance as unknown as LoginComponentInstance;
    return instance;
  };

  // 挂载到容器
  app.mount(container);

  // 销毁模态框
  const removeModal = () => {
    app.unmount();
    container.remove();
    componentInstance = null;
  };

  return {
    show: (initialView: InitialAuthView = 'login') => {
      if (componentInstance) {
        componentInstance.show(initialView);
      } else {
        console.error('Login component not mounted yet.');
      }
    },
    hide: () => {
      if (componentInstance) {
        componentInstance.hide();
      }
    },
    destroy: removeModal
  };
};

let modalInstance: ReturnType<typeof createLoginModal> | null = null;

// 初始化登录模态框（在应用启动时调用）
export const initLoginModal = () => {
  if (!modalInstance) {
    modalInstance = createLoginModal();
  }

  window.addEventListener(
    'region-restriction:shown',
    () => {
      destroyLoginModal();
    },
    { once: true }
  );
};

// 公共方法：显示登录模态框
export const showLoginModal = (initialView: InitialAuthView = 'login') => {
  if (hasRegionRestrictionOverlay() || document.getElementById('region-restriction-overlay')) {
    return;
  }
  if (!modalInstance) {
    console.error('Login modal not initialized. Please call initLoginModal() first.');
    return;
  }
  modalInstance.show(initialView);
};

// 公共方法：隐藏登录模态框
export const hideLoginModal = () => {
  if (modalInstance) {
    modalInstance.hide();
  }
};

// 公共方法：销毁登录模态框
export const destroyLoginModal = () => {
  if (modalInstance) {
    modalInstance.destroy();
    modalInstance = null;
  }
};
