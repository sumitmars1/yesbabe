import { ref } from 'vue'
import { useI18n } from 'vue-i18n'
import { useAuthStore } from '@/stores/auth'
import { queryOrder } from '@/api/premium/index'
import type { UnifiedOrderQueryResponse } from '@/api/premium/types'
import { getCurrencyByOrderId, trackPurchase } from '@/utils/facebookPixel'

/**
 * 支付回调处理 Composable
 * 用于检测支付成功后的回调，查询订单状态并刷新账户信息
 */
export function usePaymentCallback() {
  const authStore = useAuthStore()
  const { t } = useI18n()
  const isChecking = ref(false)
  const lastCheckResult = ref<{ success: boolean; message: string } | null>(null)
  const PAYMENT_PENDING_ORDER_ID_KEY = 'payment_pending_order_id'

  const getLocalizedStatusMessage = (status: string) => {
    const normalizedStatus = String(status || '').trim()
    const map: Record<string, string> = {
      completed: 'completed',
      pending: 'pending',
      cancelled: 'cancelled',
      failed: 'failed',
      amount_mismatch: 'amountMismatch',
      benefit_failed: 'benefitFailed',
      refunded: 'refunded'
    }
    const key = map[normalizedStatus]
    if (key) return t(`paymentCallback.statusMessages.${key}`)
    return t('paymentCallback.status', { status: normalizedStatus || 'unknown' })
  }

  const sleep = (delay: number) => new Promise(resolve => setTimeout(resolve, delay))

  const refreshAccountInfoSafe = async () => {
    await Promise.all([
      authStore.fetchUserInfo(),
      authStore.handleGetAccountInfo()
    ])
  }

  const shortAccountRefresh = async (orderType?: string) => {
    const delays = [0, 2000]
    for (const delay of delays) {
      if (delay > 0) {
        await sleep(delay)
      }
      try {
        await refreshAccountInfoSafe()
      } catch (error) {
        console.error('短周期刷新账户信息失败:', error)
      }
      if (orderType === 'vip_purchase' && authStore.userInfo?.is_vip) {
        return true
      }
    }
    return false
  }

  const queryOrderWithRetry = async (orderId: string) => {
    const delays = orderId.startsWith('BR_')
      ? [0, 5000, 5000, 5000]
      : Array.from({ length: 10 }, (_, index) => (index === 0 ? 0 : 3000))
    let lastResponse: UnifiedOrderQueryResponse | null = null

    for (let index = 0; index < delays.length; index += 1) {
      const delay = delays[index]
      if (delay > 0) {
        await sleep(delay)
      }

      const response = await queryOrder(orderId)
      lastResponse = response

      if (response.code !== 200) {
        break
      }

      const { local_status } = response.data
      if (local_status === 'completed') {
        break
      }

      if (local_status !== 'pending') {
        break
      }

      if (index < delays.length - 1) {
        try {
          await refreshAccountInfoSafe()
        } catch (error) {
          console.error('支付待确认时刷新账户信息失败:', error)
        }
      }
    }

    return lastResponse
  }

  /**
   * 从 URL 中获取订单号
   * 支持多种可能的参数名：order_id, mch_order_id, orderId
   */
  const getOrderIdFromUrl = (): string | null => {
    const urlParams = new URLSearchParams(window.location.search)
    // 尝试多种可能的参数名
    const orderId = urlParams.get('order_id') ||
      urlParams.get('mch_order_id') ||
      urlParams.get('orderId') ||
      urlParams.get('order')
    if (orderId) return orderId

    const isPaymentCallback = urlParams.get('pay_callback') === '1'
    if (!isPaymentCallback) return null

    try {
      return localStorage.getItem(PAYMENT_PENDING_ORDER_ID_KEY)
    } catch {
      return null
    }
  }

  /**
   * 清理 URL 中的回调参数
   * 避免用户刷新页面时重复触发回调处理
   */
  const clearCallbackParams = () => {
    const url = new URL(window.location.href)
    const params = url.searchParams

    // 删除所有可能的回调参数
    const callbackParams = ['order_id', 'mch_order_id', 'orderId', 'order', 'status', 'code', 'token', 'pay_callback']

    callbackParams.forEach(param => {
      params.delete(param)
    })

    // 更新 URL，不刷新页面
    window.history.replaceState({}, '', url.toString())

    try {
      localStorage.removeItem(PAYMENT_PENDING_ORDER_ID_KEY)
    } catch {}
  }

  /**
   * 检查支付回调并处理
   * @returns 是否成功处理了支付回调
   */
  const checkPaymentCallback = async (): Promise<boolean> => {
    // 如果没有登录或正在检查，直接返回
    if (!authStore.isLoggedIn || isChecking.value) {
      return false
    }

    // 检查 URL 中是否有订单号
    const orderId = getOrderIdFromUrl()
    if (!orderId) {
      return false
    }

    console.log('检测到支付回调，订单号:', orderId)
    isChecking.value = true
    lastCheckResult.value = null

    try {
      const response = await queryOrderWithRetry(orderId)

      if (response && response.code === 200) {
        const { local_status, order_type } = response.data

        console.log('订单状态:', local_status, '订单类型:', order_type)

        if (local_status === 'completed') {
          await refreshAccountInfoSafe()

          trackPurchase({
            value: response.data.amount,
            currency: getCurrencyByOrderId(response.data.order_id),
            orderId: response.data.order_id
          })

          lastCheckResult.value = {
            success: true,
            message: order_type === 'vip_purchase'
              ? t('paymentCallback.successVip')
              : t('paymentCallback.successTokens')
          }

          console.log('支付成功，账户信息已更新')
        } else if (local_status === 'pending') {
          const updated = await shortAccountRefresh(order_type)
          lastCheckResult.value = {
            success: updated && order_type === 'vip_purchase',
            message: updated && order_type === 'vip_purchase'
              ? t('paymentCallback.successVip')
              : t('paymentCallback.pending')
          }
        } else {
          lastCheckResult.value = {
            success: false,
            message: getLocalizedStatusMessage(local_status)
          }
        }
      } else {
        lastCheckResult.value = {
          success: false,
          message: response?.message || t('paymentCallback.queryFailed')
        }
      }
    } catch (error: any) {
      console.error('查询订单状态失败:', error)
      lastCheckResult.value = {
        success: false,
        message: error.response?.data?.message || error.message || t('paymentCallback.queryFailed')
      }
    } finally {
      isChecking.value = false
      // 清理 URL 中的回调参数
      clearCallbackParams()
    }

    return lastCheckResult.value?.success ?? false
  }

  /**
   * 显示支付结果通知
   */
  const showPaymentResult = () => {
    if (!lastCheckResult.value) return

    const message = (window as any).$message
    if (lastCheckResult.value.success) {
      message.success(lastCheckResult.value.message)
    } else {
      message.info(lastCheckResult.value.message)
    }
  }

  return {
    isChecking,
    lastCheckResult,
    checkPaymentCallback,
    showPaymentResult,
    getOrderIdFromUrl,
    clearCallbackParams
  }
}
