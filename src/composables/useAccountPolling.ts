import { ref, onUnmounted } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { hasHtmlResponseOverlay } from "@/utils/htmlResponse";

export function useAccountPolling() {
  const authStore = useAuthStore()
  const isPolling = ref(false)
  let pollingTimer: NodeJS.Timeout | null = null
  let delayTimer: NodeJS.Timeout | null = null

  // 开始轮询
  const startPolling = (immediate = false) => {
    if (hasHtmlResponseOverlay()) {
      stopPolling()
      return
    }

    if (isPolling.value || !authStore.isLoggedIn) return

    isPolling.value = true

    const executeAndSchedule = () => {
      if (hasHtmlResponseOverlay()) {
        stopPolling()
        return
      }

      if (!authStore.isLoggedIn) {
        stopPolling()
        return
      }
      // 首次执行
      refreshAccountInfo()

      // 每20秒轮询一次
      pollingTimer = setInterval(() => {
        if (hasHtmlResponseOverlay()) {
          stopPolling()
          return
        }

        if (authStore.isLoggedIn) {
          refreshAccountInfo()
        } else {
          stopPolling()
        }
      }, 20000)
    }

    if (immediate) {
      // 立即执行，不延迟
      executeAndSchedule()
    } else {
      // 延迟20秒后开始执行
      delayTimer = setTimeout(() => {
        executeAndSchedule()
      }, 20000)
    }
  }

  // 停止轮询
  const stopPolling = () => {
    if (delayTimer) {
      clearTimeout(delayTimer)
      delayTimer = null
    }
    if (pollingTimer) {
      clearInterval(pollingTimer)
      pollingTimer = null
    }
    isPolling.value = false
  }

  // 刷新账户信息和用户信息
  const refreshAccountInfo = async () => {
    if (hasHtmlResponseOverlay()) {
      stopPolling()
      return
    }

    try {
      // 同时更新用户信息（包含Pro状态）和账户信息（包含钻石数量）
      await Promise.all([
        authStore.fetchUserInfo(),
        authStore.handleGetAccountInfo()
      ])
    } catch (error) {
      console.error('轮询获取账户信息失败:', error)
    }
  }

  const handleHtmlResponse = () => {
    stopPolling()
  }

  if (typeof window !== "undefined") {
    window.addEventListener("html-response:shown", handleHtmlResponse)
  }

  // 组件卸载时清理定时器
  onUnmounted(() => {
    if (typeof window !== "undefined") {
      window.removeEventListener("html-response:shown", handleHtmlResponse)
    }
    stopPolling()
  })

  return {
    isPolling,
    startPolling,
    stopPolling
  }
}
