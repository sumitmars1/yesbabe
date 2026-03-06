import { createApp, ref } from 'vue'
import MessageQuotaModal from '@/components/MessageQuotaModal/index.vue'
import { createI18nInstance } from '@/utils/i18n'

const isModalVisible = ref(false)

/**
 * 显示消息配额用完弹窗
 */
export const showMessageQuotaModal = () => {
  // 如果已经显示了弹窗，则不重复显示
  if (isModalVisible.value) {
    return
  }
  
  isModalVisible.value = true
  
  // 创建一个临时的 div 元素
  const div = document.createElement('div')
  document.body.appendChild(div)
  
  // 创建 Vue 应用实例
  const app = createApp(MessageQuotaModal, {
    show: true,
    'onUpdate:show': (value: boolean) => {
      if (!value) {
        isModalVisible.value = false
        // 延迟销毁，确保动画完成
        setTimeout(() => {
          app.unmount()
          document.body.removeChild(div)
        }, 300)
      }
    }
  })
  
  // 为应用实例安装 i18n 插件
  const i18n = createI18nInstance()
  app.use(i18n)
  
  app.mount(div)
}

/**
 * 隐藏消息配额用完弹窗
 */
export const hideMessageQuotaModal = () => {
  isModalVisible.value = false
}