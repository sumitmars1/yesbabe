import { createApp } from 'vue';
import SubscriptionModal from '@/components/SubscriptionModal/index.vue';
import { createI18nInstance } from '@/utils/i18n';

// Define the type for subscription mode
type SubscriptionMode = 'redirect' | 'inline';

// 定义组件实例接口
interface SubscriptionModalProps {
  mode?: SubscriptionMode;
}

interface SubscriptionModalInstance {
  show: () => void;
  hide: () => void;
}

const createSubscriptionModal = (mode: SubscriptionMode = 'redirect') => {
  // 创建容器元素
  const container = document.createElement('div');
  document.body.appendChild(container);

  // 使用 SubscriptionModal 作为根组件 with the specified mode
  const app = createApp(SubscriptionModal, { mode });

  // 配置 i18n
  const i18n = createI18nInstance();
  app.use(i18n);

  let componentInstance: SubscriptionModalInstance | null = null;

  // 保存原始 mount 方法
  const originalMount = app.mount;

  // 重写 mount 方法以获取组件实例
  app.mount = (selectorOrElement: string | Element) => {
    const instance = originalMount.call(app, selectorOrElement);
    // 先将组件实例转换为 unknown 类型，再转换为 SubscriptionModalInstance 类型
    componentInstance = instance as unknown as SubscriptionModalInstance;
    return instance;
  };

  // 挂载到容器
  app.mount(container);

  // 销毁模态框
  const removeModal = () => {
    if (app) {
      app.unmount();
    }
    container.remove();
    componentInstance = null;
  };

  return {
    show: () => {
      if (componentInstance) {
        componentInstance.show();
      } else {
        console.error('Subscription component not mounted yet.');
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

// Store modal instance with its mode
let modalInstance: ReturnType<typeof createSubscriptionModal> | null = null;
let currentMode: SubscriptionMode = 'redirect';

// 公共方法：显示订阅模态框
export const showSubscriptionModal = (mode: SubscriptionMode = 'redirect') => {
  if (!modalInstance || currentMode !== mode) {
    // Destroy existing instance if it's different mode
    if (modalInstance) {
      modalInstance.destroy();
    }
    modalInstance = createSubscriptionModal(mode);
    currentMode = mode;
  }
  modalInstance.show();
};

// 公共方法：隐藏订阅模态框
export const hideSubscriptionModal = () => {
  if (modalInstance) {
    modalInstance.hide();
  }
};

// 公共方法：销毁订阅模态框
export const destroySubscriptionModal = () => {
  if (modalInstance) {
    modalInstance.destroy();
    modalInstance = null;
    currentMode = 'redirect';
  }
};