import { ref, onUnmounted } from 'vue'

export interface TypewriterOptions {
  speed?: number // 打字速度，毫秒/字符
  delay?: number // 开始延迟，毫秒
  onComplete?: () => void // 完成回调
  onProgress?: (displayedText: string, progress: number) => void // 进度回调
}

const DEFAULT_SPEED = 50

export function useTypewriter() {
  const displayedText = ref('')
  const isTyping = ref(false)
  const progress = ref(0)

  let timeoutId: number | null = null
  let currentIndex = 0
  let targetText = ''
  let options: TypewriterOptions = {}

  const clearTimer = () => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId)
      timeoutId = null
    }
  }

  const finishTyping = () => {
    clearTimer()
    displayedText.value = targetText
    progress.value = 1
    isTyping.value = false
    options.onProgress?.(displayedText.value, progress.value)
    options.onComplete?.()
  }

  const scheduleNext = (delay?: number) => {
    const actualDelay = typeof delay === 'number' ? delay : options.speed ?? DEFAULT_SPEED
    if (actualDelay <= 0) {
      typeNextCharacter()
      return
    }
    timeoutId = window.setTimeout(() => {
      timeoutId = null
      typeNextCharacter()
    }, actualDelay)
  }

  const updatePrefixState = (startIndex: number) => {
    const totalLength = targetText.length
    currentIndex = Math.max(0, Math.min(startIndex, totalLength))
    displayedText.value = targetText.slice(0, currentIndex)
    progress.value = totalLength === 0 ? 1 : currentIndex / totalLength
  }

  const prepareTyping = (text: string, opts: TypewriterOptions, startIndex: number, initialDelay?: number) => {
    clearTimer()
    targetText = text
    options = {
      speed: DEFAULT_SPEED,
      delay: 0,
      ...opts
    }

    updatePrefixState(startIndex)

    if (currentIndex >= targetText.length) {
      finishTyping()
      return
    }

    isTyping.value = true
    scheduleNext(initialDelay ?? options.delay ?? 0)
  }

  const getSharedPrefixLength = (a: string, b: string) => {
    const max = Math.min(a.length, b.length)
    let i = 0
    for (; i < max; i++) {
      if (a[i] !== b[i]) break
    }
    return i
  }

  const startTyping = (text: string, opts: TypewriterOptions = {}) => {
    prepareTyping(text, opts, 0, opts.delay ?? 0)
  }

  const typeTo = (text: string, opts: TypewriterOptions = {}) => {
    const previous = displayedText.value
    const nextText = text ?? ''
    const sharedPrefix = getSharedPrefixLength(previous, nextText)
    prepareTyping(nextText, opts, sharedPrefix, opts.delay ?? 0)
  }

  const typeNextCharacter = () => {
    if (currentIndex >= targetText.length) {
      finishTyping()
      return
    }

    currentIndex += 1
    displayedText.value = targetText.slice(0, currentIndex)
    progress.value = targetText.length === 0 ? 1 : currentIndex / targetText.length

    options.onProgress?.(displayedText.value, progress.value)

    if (currentIndex >= targetText.length) {
      finishTyping()
      return
    }

    scheduleNext(options.speed)
  }

  const stopTyping = () => {
    clearTimer()
    isTyping.value = false
  }

  const completeTyping = () => {
    finishTyping()
  }

  const reset = () => {
    stopTyping()
    displayedText.value = ''
    progress.value = 0
    currentIndex = 0
    targetText = ''
  }

  onUnmounted(() => {
    stopTyping()
  })

  return {
    displayedText,
    isTyping,
    progress,
    startTyping,
    typeTo,
    stopTyping,
    completeTyping,
    reset
  }
}

/**
 * 创建多个打字机实例管理器
 */
export function useMultipleTypewriters() {
  const typewriters = new Map<string, ReturnType<typeof useTypewriter>>()

  const getTypewriter = (id: string) => {
    if (!typewriters.has(id)) {
      typewriters.set(id, useTypewriter())
    }
    return typewriters.get(id)!
  }

  const removeTypewriter = (id: string) => {
    const typewriter = typewriters.get(id)
    if (typewriter) {
      typewriter.stopTyping()
      typewriters.delete(id)
    }
  }

  const clearAll = () => {
    typewriters.forEach(typewriter => {
      typewriter.stopTyping()
    })
    typewriters.clear()
  }

  onUnmounted(() => {
    clearAll()
  })

  return {
    getTypewriter,
    removeTypewriter,
    clearAll
  }
}
