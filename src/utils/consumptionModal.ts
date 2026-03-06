import { createApp } from 'vue';
import { createDiscreteApi } from 'naive-ui';
import ConsumptionModalComponent from '@/components/ConsumptionModal/index.vue';
import { createI18nInstance } from '@/utils/i18n';

// 定义回调函数接口
interface ConsumptionModalCallbacks {
  onOk?: () => void;
  onCancel?: () => void;
}

// 定义组件实例接口
interface ConsumptionModalInstance {
  show: (callbacks?: ConsumptionModalCallbacks) => void;
  hide: () => void;
}

const createConsumptionModal = () => {
  // 创建容器元素
  const container = document.createElement('div');
  document.body.appendChild(container);

  // 使用 ConsumptionModalComponent 作为根组件
  const app = createApp(ConsumptionModalComponent);
  
  // 配置 i18n
  const i18n = createI18nInstance();
  app.use(i18n);
  
  // 为独立应用配置 naive-ui 的 message 实例
  const { message } = createDiscreteApi(['message']);
  app.config.globalProperties.$message = message;

  let componentInstance: ConsumptionModalInstance | null = null;

  // 保存原始 mount 方法
  const originalMount = app.mount;

  // 重写 mount 方法以获取组件实例
  app.mount = (selectorOrElement: string | Element) => {
    const instance = originalMount.call(app, selectorOrElement);
    componentInstance = instance as unknown as ConsumptionModalInstance;
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
    show: (callbacks?: ConsumptionModalCallbacks) => {
      if (componentInstance) {
        componentInstance.show(callbacks);
      } else {
        console.error('Consumption modal component not mounted yet.');
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

let modalInstance: ReturnType<typeof createConsumptionModal> | null = null;

// 初始化消费模态框（在应用启动时调用）
export const initConsumptionModal = () => {
  if (!modalInstance) {
    modalInstance = createConsumptionModal();
  }
};

// 公共方法：显示消费模态框
export const showConsumptionModal = (callbacks?: ConsumptionModalCallbacks) => {
  if (!modalInstance) {
    console.error('Consumption modal not initialized. Please call initConsumptionModal() first.');
    return;
  }
  modalInstance.show(callbacks);
};

// 公共方法：隐藏消费模态框
export const hideConsumptionModal = () => {
  if (modalInstance) {
    modalInstance.hide();
  }
};

// 公共方法：销毁消费模态框
export const destroyConsumptionModal = () => {
  if (modalInstance) {
    modalInstance.destroy();
    modalInstance = null;
  }
};