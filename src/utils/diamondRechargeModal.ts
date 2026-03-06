import { createApp } from 'vue';
import DiamondRechargeModal from '@/components/DiamondRechargeModal/index.vue';
import { createI18nInstance } from '@/utils/i18n';
import router from '@/router';

// 定义回调函数接口
interface DiamondRechargeModalCallbacks {
  onOk?: () => void;
  onCancel?: () => void;
}

// 定义组件实例接口
interface DiamondRechargeModalInstance {
  show: (callbacks?: DiamondRechargeModalCallbacks) => void;
  hide: () => void;
}

const createDiamondRechargeModal = () => {
  // 创建容器元素
  const container = document.createElement('div');
  document.body.appendChild(container);

  // 使用 DiamondRechargeModal 作为根组件
  const app = createApp(DiamondRechargeModal);

  // 配置 i18n
  const i18n = createI18nInstance();
  app.use(i18n);

  let componentInstance: DiamondRechargeModalInstance | null = null;

  // 保存原始 mount 方法
  const originalMount = app.mount;

  // 重写 mount 方法以获取组件实例
  app.mount = (selectorOrElement: string | Element) => {
    const instance = originalMount.call(app, selectorOrElement);
    componentInstance = instance as unknown as DiamondRechargeModalInstance;
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
    show: (callbacks?: DiamondRechargeModalCallbacks) => {
      if (componentInstance) {
        componentInstance.show(callbacks);
      } else {
        console.error('Diamond recharge component not mounted yet.');
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

let modalInstance: ReturnType<typeof createDiamondRechargeModal> | null = null;

// 公共方法：显示钻石充值模态框
export const showDiamondRechargeModal = (callbacks?: DiamondRechargeModalCallbacks) => {
  if (!modalInstance) {
    modalInstance = createDiamondRechargeModal();
  }
  
  // 如果没有提供 onOk 回调，使用默认的路由跳转逻辑
  const finalCallbacks: DiamondRechargeModalCallbacks = {
    onOk: callbacks?.onOk || (() => {
      router.push('/premium/diamonds');
    }),
    onCancel: callbacks?.onCancel
  };
  
  modalInstance.show(finalCallbacks);
};

// 公共方法：隐藏钻石充值模态框
export const hideDiamondRechargeModal = () => {
  if (modalInstance) {
    modalInstance.hide();
  }
};

// 公共方法：销毁钻石充值模态框
export const destroyDiamondRechargeModal = () => {
  if (modalInstance) {
    modalInstance.destroy();
    modalInstance = null;
  }
};