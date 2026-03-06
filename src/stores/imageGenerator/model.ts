import { defineStore } from 'pinia'
import { ref } from 'vue'
import type { CompanionInfo, DefaultPrompt } from '@/api/chat/types'

/**
 * 图像生成器模型状态管理
 * 独立于聊天模块，专门管理图像生成时选择的AI模型
 */
export const useImageGeneratorModelStore = defineStore('imageGeneratorModel', () => {
  // 当前选中的模型完整信息（来自 companion/current 接口）
  const currentModel = ref<CompanionInfo | null>(null)
  
  // 当前选中的提示词
  const currentPrompt = ref<DefaultPrompt | null>(null)
  
  // 上次选中的提示词ID（用于避免重复）
  const lastSelectedPromptId = ref<number | null>(null)
  
  // 可编辑的描述文本
  const editableDescription = ref<string>('')
  
  // 设置当前模型
  const setCurrentModel = (model: CompanionInfo | null) => {
    currentModel.value = model
  }
  
  // 设置当前提示词
  const setCurrentPrompt = (prompt: DefaultPrompt | null) => {
    currentPrompt.value = prompt
    if (prompt) {
      lastSelectedPromptId.value = prompt.id
    }
  }
  
  // 设置描述文本
  const setEditableDescription = (description: string) => {
    editableDescription.value = description
  }
  
  // 清除当前模型
  const clearCurrentModel = () => {
    currentModel.value = null
  }
  
  // 清除所有状态
  const clearAll = () => {
    currentModel.value = null
    currentPrompt.value = null
    lastSelectedPromptId.value = null
    editableDescription.value = ''
  }
  
  return {
    currentModel,
    currentPrompt,
    lastSelectedPromptId,
    editableDescription,
    setCurrentModel,
    setCurrentPrompt,
    setEditableDescription,
    clearCurrentModel,
    clearAll,
  }
}, {
  persist: {
    key: 'imageGeneratorModel',
    storage: localStorage
  }
})
