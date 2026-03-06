import { createApp } from 'vue';
import PaymentModal from '@/components/PaymentModal/index.vue';
import { createI18nInstance } from '@/utils/i18n';

// 定义组件实例接口
interface PaymentModalInstance {
  show: (amount: string, title?: string, description?: string, vipId?: number, tokenId?: number, tokensCount?: number, returnTo?: string, onSuccess?: () => void) => void;
  hide: () => void;
}

const createPaymentModal = () => {
  // 创建容器元素
  const container = document.createElement('div');
  document.body.appendChild(container);

  // 使用 PaymentModal 作为根组件
  const app = createApp(PaymentModal);

  // 配置 i18n
  const i18n = createI18nInstance();
  app.use(i18n);

  let componentInstance: PaymentModalInstance | null = null;
  let successCallback: (() => void) | null = null;

  // 保存原始 mount 方法
  const originalMount = app.mount;

  // 重写 mount 方法以获取组件实例
  app.mount = (selectorOrElement: string | Element) => {
    const instance = originalMount.call(app, selectorOrElement);
    // 先将组件实例转换为 unknown 类型，再转换为 PaymentModalInstance 类型
    componentInstance = instance as unknown as PaymentModalInstance;
    return instance;
  };

  // 挂载到容器
  app.mount(container);

  // 销毁模态框
  const removeModal = () => {
    app.unmount();
    container.remove();
    componentInstance = null;
    successCallback = null;
  };

  return {
    show: (amount: string, title?: string, description?: string, vipId?: number, tokenId?: number, tokensCount?: number, returnTo?: string, onSuccess?: () => void) => {
      if (componentInstance) {
        componentInstance.show(amount, title, description, vipId, tokenId, tokensCount, returnTo, onSuccess);
      } else {
        console.error('Payment component not mounted yet.');
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

let modalInstance: ReturnType<typeof createPaymentModal> | null = null;

// 公共方法：显示支付模态框
export const showPaymentModal = (amount: string, title?: string, description?: string, vipId?: number, tokenId?: number, tokensCount?: number, returnTo?: string, onSuccess?: () => void) => {
  if (!modalInstance) {
    modalInstance = createPaymentModal();
  }
  modalInstance.show(amount, title, description, vipId, tokenId, tokensCount, returnTo, onSuccess);
};

// 公共方法：隐藏支付模态框
export const hidePaymentModal = () => {
  if (modalInstance) {
    modalInstance.hide();
  }
};

// 公共方法：销毁支付模态框
export const destroyPaymentModal = () => {
  if (modalInstance) {
    modalInstance.destroy();
    modalInstance = null;
  }
};