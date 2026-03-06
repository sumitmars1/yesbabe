import { ref } from 'vue'
import { defineStore } from 'pinia'
import { MessageItem, ChatMessage } from "@/types/chat"
import { CompanionInfo } from "@/api/chat/types"
import { getCurrentCompanionWithConfig } from '@/api/chat/index'
import { showLoginModal } from "@/utils/authModal";

export const useChatStore = defineStore('chat', () => {
    // 当前选中的聊天对象
    const currentChat = ref<MessageItem | null>(null)
    // 当前聊天用户信息
    const currentCompanion = ref<CompanionInfo | null>(null)

    let currentCompanionAbortController: AbortController | null = null
    let onGetCurrentCompanionRequestId = 0
    let ensureChatSwitchRequestId = 0

    // 设置当前聊天对象
    const setCurrentChat = (data: MessageItem) => {
        currentChat.value = data
    }

    const createFallbackChat = (companionId: number): MessageItem => {
        const now = new Date().toISOString()
        return {
            id: companionId,
            name: '',
            cover_video_url: '',
            head_image: '',
            t_head_image: '',
            s_head_image: '',
            user_id: 0,
            companion_id: companionId,
            message_response_id: 0,
            content: '',
            message_response_created_at: now,
            time: now,
            avatar: '',
            isSelf: false,
            lastMessage: '',
            liked: false,
        }
    }

    const setCurrentChatByCompanionId = (companionId: number, seed?: Partial<MessageItem>) => {
        if (!companionId) return
        const base = createFallbackChat(companionId)
        const next: MessageItem = {
            ...base,
            ...(seed || {}),
            id: companionId,
            companion_id: companionId,
        }
        currentChat.value = next
    }

    const ensureCurrentChatByCompanionId = async (companionId: number, seed?: Partial<MessageItem>) => {
        if (!companionId) return

        const existing = currentChat.value
        const shouldReset = !existing || existing.companion_id !== companionId
        if (shouldReset) {
            ensureChatSwitchRequestId += 1
            clearCurrentCompanion()
            setCurrentChatByCompanionId(companionId, seed)
        } else if (seed && currentChat.value) {
            currentChat.value = {
                ...currentChat.value,
                ...seed,
            }
        }

        const switchRequestId = ensureChatSwitchRequestId

        const shouldFetch = currentCompanion.value?.id !== companionId
        if (shouldFetch && currentCompanion.value?.id) {
            clearCurrentCompanion()
        }
        if (!shouldFetch) {
            const chat = currentChat.value
            if (chat && chat.name && chat.t_head_image) return
        }

        const companion = await onGetCurrentCompanion(companionId)
        if (switchRequestId !== ensureChatSwitchRequestId) return
        if (currentChat.value?.companion_id !== companionId) return
        const chat = currentChat.value || createFallbackChat(companionId)
        const contentSeed =
            chat.content || companion.description || companion.greeting || '开始聊天吧！'
        currentChat.value = {
            ...chat,
            id: companion.id,
            companion_id: companion.id,
            name: companion.name,
            t_head_image: companion.t_head_image || '',
            cover_video_url: companion.cover_video_url || '',
            liked: companion.liked || false,
            content: contentSeed,
            lastMessage: contentSeed,
        }
    }

    // 清除当前聊天对象
    const clearCurrentChat = () => {
        currentChat.value = null
    }

    // 获取当前聊天用户信息
    const onGetCurrentCompanion = async (companionId: number) => {
        onGetCurrentCompanionRequestId += 1
        const requestId = onGetCurrentCompanionRequestId

        if (currentCompanionAbortController) {
            currentCompanionAbortController.abort()
        }
        currentCompanionAbortController = new AbortController()

        try {
            const { data } = await getCurrentCompanionWithConfig(companionId, {
                signal: currentCompanionAbortController.signal,
                headers: {
                    repeatSubmit: false,
                },
            })

            if (requestId !== onGetCurrentCompanionRequestId) {
                return Promise.reject(new Error('stale_companion_request'))
            }

            currentCompanion.value = data
            
            // 同步更新currentChat中的liked状态
            if (currentChat.value && currentChat.value.companion_id === companionId) {
                currentChat.value.liked = data.liked || false
            }
            
            return Promise.resolve(data)
        } catch (error: any) {
            // 仅在权限错误时提示登录，其它错误或取消请求不弹窗
            const status = error?.response?.status
            const isCanceled = error?.code === 'ERR_CANCELED' || error?.message?.includes('canceled')
            const isStale = error?.message === 'stale_companion_request'

            if (!isCanceled && !isStale) {
                console.error('获取聊天用户信息失败:', error)
            }
            if (!isCanceled && !isStale && status === 403) {
                showLoginModal('login')
            }
            return Promise.reject(isStale ? new Error('stale_companion_request') : error)
        }
    }

    // // 设置当前聊天用户信息
    // const setCurrentCompanion = (data: CompanionInfo | null) => {
    //     currentCompanion.value = data
    // }

    // 清除当前聊天用户信息
    const clearCurrentCompanion = () => {
        onGetCurrentCompanionRequestId += 1
        if (currentCompanionAbortController) {
            currentCompanionAbortController.abort()
            currentCompanionAbortController = null
        }
        currentCompanion.value = null
    }

    // 最新消息缓存，用于Message.vue组件显示
    const latestMessages = ref<Map<number, ChatMessage>>(new Map())
    
    // 未读消息相关状态（现在通过 message_list 接口获取，无需本地缓存）
    // const unreadCounts = ref<Map<number, number>>(new Map()) // 各个伴侣的未读数量
    // const totalUnreadCount = ref<number>(0) // 总未读数量

    // 保存聊天消息到localStorage
    const saveChatMessage = (companionId: number, message: ChatMessage) => {
        try {
            const storageKey = `chat_messages_${companionId}`
            const existingMessages = localStorage.getItem(storageKey)
            let messages: ChatMessage[] = []
            
            if (existingMessages) {
                messages = JSON.parse(existingMessages)
            }

            const toKey = (value: unknown) => (value === null || value === undefined ? undefined : String(value))
            const matchesMessage = (target: ChatMessage, existing: ChatMessage) => {
                const uniqueTarget = toKey((target as any).unique_id ?? target.id)
                const uniqueExisting = toKey((existing as any).unique_id ?? existing.id)
                if (uniqueTarget && uniqueExisting && uniqueTarget === uniqueExisting) return true

                const targetId = toKey(target.id)
                const existingId = toKey(existing.id)
                if (targetId && existingId && targetId === existingId) return true

                const targetMessageId = toKey(target.message_id)
                const existingMessageId = toKey(existing.message_id)
                if (targetMessageId && existingMessageId && targetMessageId === existingMessageId) return true

                const targetResponseId = toKey(target.response_id)
                const existingResponseId = toKey(existing.response_id)
                if (targetResponseId && existingResponseId && targetResponseId === existingResponseId) return true

                return false
            }

            const existingIndex = messages.findIndex(msg => matchesMessage(message, msg))

            if (existingIndex !== -1) {
                const existingMessage = messages[existingIndex]
                const mergedMessage: ChatMessage = {
                    ...existingMessage,
                    ...message,
                }
                if ((message as any).unique_id === undefined && (existingMessage as any).unique_id !== undefined) {
                    (mergedMessage as any).unique_id = (existingMessage as any).unique_id
                }
                if (message.id === undefined) {
                    mergedMessage.id = existingMessage.id
                }
                if (message.message_id === undefined) {
                    mergedMessage.message_id = existingMessage.message_id
                }
                if (message.response_id === undefined) {
                    mergedMessage.response_id = existingMessage.response_id
                }
                if (!Object.prototype.hasOwnProperty.call(message, 'content')) {
                    mergedMessage.content = existingMessage.content
                }
                if (!Object.prototype.hasOwnProperty.call(message, 'displayedText')) {
                    mergedMessage.displayedText = existingMessage.displayedText
                }

                messages[existingIndex] = mergedMessage
            } else {
                messages.push(message)
            }

            if (messages.length > 1000) {
                messages = messages.slice(-1000)
            }
            localStorage.setItem(storageKey, JSON.stringify(messages))

            const updatedIndex = messages.findIndex(msg => matchesMessage(message, msg))
            const latestEntry = updatedIndex >= 0 ? messages[updatedIndex] : message
            latestMessages.value.set(companionId, latestEntry)
            
            console.log('消息已保存到localStorage:', latestEntry)
        } catch (error) {
            console.error('保存聊天消息失败:', error)
        }
    }
    
    // 获取聊天消息从localStorage
    const getChatMessages = (companionId: number): ChatMessage[] => {
        try {
            const storageKey = `chat_messages_${companionId}`
            const existingMessages = localStorage.getItem(storageKey)
            return existingMessages ? JSON.parse(existingMessages) : []
        } catch (error) {
            console.error('获取聊天消息失败:', error)
            return []
        }
    }

    // 获取最新消息
    const getLatestMessage = (companionId: number): ChatMessage | null => {
        // 先从缓存中获取
        const cachedMessage = latestMessages.value.get(companionId)
        if (cachedMessage) {
            return cachedMessage
        }
        
        // 如果缓存中没有，从localStorage获取最后一条消息
        const messages = getChatMessages(companionId)
        if (messages.length > 0) {
            const latestMsg = messages[messages.length - 1]
            latestMessages.value.set(companionId, latestMsg)
            return latestMsg
        }
        
        return null
    }
    
    // 清除特定聊天对象的消息
    const clearChatMessages = (companionId: number) => {
        try {
            const storageKey = `chat_messages_${companionId}`
            localStorage.removeItem(storageKey)
            console.log('已清除聊天消息:', companionId)
        } catch (error) {
            console.error('清除聊天消息失败:', error)
        }
    }
    
    // 获取未读消息统计（已废弃，现在通过 message_list 接口获取）
    // const fetchUnreadCounts = async () => {
    //     try {
    //         const { data } = await getUnreadMessageCount();
    //         if (data) {
    //             totalUnreadCount.value = data.total_unread || 0;
    //
    //             // 更新各个伴侣的未读数量
    //             unreadCounts.value.clear();
    //             if (data.companions) {
    //                 data.companions.forEach(item => {
    //                     unreadCounts.value.set(item.companion_id, item.unread_count);
    //                 });
    //             }
    //         }
    //     } catch (error) {
    //         console.error('获取未读消息统计失败:', error);
    //     }
    // };
    // 获取指定伴侣的未读数量（已废弃，直接从 message_list 获取）
    // const getUnreadCount = (companionId: number): number => {
    //     return unreadCounts.value.get(companionId) || 0;
    // };

    // 新消息到达时增加未读数量（已废弃，由 WebSocket 直接更新 message_list 数据）
    // const incrementUnreadCount = (companionId: number) => {
    //     // 检查是否在当前聊天窗口
    //     if (currentChat.value && currentChat.value.companion_id === companionId) {
    //         // 在当前聊天窗口，不增加未读数
    //         return;
    //     }
    //
    //     const currentCount = unreadCounts.value.get(companionId) || 0;
    //     unreadCounts.value.set(companionId, currentCount + 1);
    //     totalUnreadCount.value += 1;
    // };

    return {
        currentChat,
        currentCompanion,
        latestMessages,
        // unreadCounts, // 已废弃
        // totalUnreadCount, // 已废弃
        setCurrentChat,
        setCurrentChatByCompanionId,
        ensureCurrentChatByCompanionId,
        clearCurrentChat,
        onGetCurrentCompanion,
        clearCurrentCompanion,
        saveChatMessage,
        getChatMessages,
        getLatestMessage,
        clearChatMessages,
        // fetchUnreadCounts, // 已废弃
        // getUnreadCount, // 已废弃
        // incrementUnreadCount // 已废弃
    }
})
