<template>
  <div class="chat-root">
    <n-config-provider :theme-overrides="({
      common: {
        ...themeStore.naiveOverridesTheme.common,
        borderRadius: '0',
      },
    } as GlobalThemeOverrides)">
      <!-- 聊天内容区域 - 自适应高度 -->
      <ChatHeader class="h-64px page-padding border-b-btnBorder border-b-solid border-1px"
        v-if="!globalStore.isMobile && chatStore.currentChat?.id">
      </ChatHeader>
      <div class="flex-1 overflow-hidden chat-container" :class="{
        'keyboard-visible': globalStore.isMobile && keyboardState.isVisible,
        'mobile-input-focused': globalStore.isMobile && isInputFocused,
      }" :style="{
        '--chat-height': globalStore.isMobile ? mobileOptimizedHeight : 'calc(100vh - 186px)',
        '--input-area-h': `${measuredInputHeight}px`
      }">
        <!-- 有聊天对象时显示聊天内容 -->
        <template v-if="chatStore.currentChat?.id">
          <InfinityScroll ref="scrollbarRef" :height="infinityScrollHeight" load-direction="up"
            :has-more="hasMoreHistory" :is-loading="isLoadingHistory" :is-empty="messages.length === 0"
            :auto-load="true" @load-more="handleLoadMore" @scroll="handleInfinityScroll">
            <div class="scroll-content" ref="messageContainerRef">
              <div class="page-padding">
                <div v-for="(item, index) in messagesWithTimeDisplay" :key="item.key" class="chat-item-row mb-2">
                  <!-- 时间显示在消息上方中间（参考微信） -->
                  <div v-if="item.shouldShowTime" class="flex justify-center mt-3 mb-3">
                    <div class="px-3 py-1 text-xs text-gray-500">
                      {{ formatMessageTime(item.time) }}
                    </div>
                  </div>
                  <!-- 消息内容 -->
                  <ChatItem :chat="item" :videoLoadingMap="videoLoadingMap" :videoDoneMap="videoDoneMap"
                    :videoProgressMap="videoProgressMap" @retry="handleRetryMessage"
                    @purchase-collection="handleCollectionPurchase"
                    @send-suggestion="handleSendSuggestion"
                  ></ChatItem>
                </div>
              </div>
            </div>

            <template #empty>
              <div class="text-center text-gray-500 mt-10">
                <p>{{ t('chat.startChat') }}</p>
              </div>
            </template>
          </InfinityScroll>
        </template>

        <!-- 没有选择聊天对象时的空状态 -->
        <template v-else>
          <div class="h-[calc(100vh_-_186px)] flex items-center justify-center bg-background">
            <!-- 提示信息 -->
            <p class="text-xs text-gray-400 text-center">
              {{ t('chat.quickTip') }}
            </p>
          </div>
        </template>
      </div>

      <!-- 聊天输入框 - 仅在有聊天对象时显示 -->
      <div v-if="chatStore.currentChat?.id" class="bg-background input-area" :class="{
        'fixed bottom-0.5px left-0 right-0': globalStore.isMobile,
        'keyboard-visible': globalStore.isMobile && keyboardState.isVisible,
      }" ref="inputAreaRef">
        <div class="flex flex-col input-container">
          <!-- 输入框和发送按钮区域 - 统一容器 -->
          <div class="input-with-buttons-row">
            <!-- 多行文本输入框 -->
            <el-input ref="inputInstRef" v-model="inputMessage" type="textarea"
              :autosize="{ minRows: 1, maxRows: globalStore.isMobile ? 2 : 3 }"
              :placeholder="isReplying ? t('chat.isReplying') : t('chat.sayMessage')" class="flex-1 chat-input"
              :disabled="!isConnected || isReplying || !chatStore.currentChat?.id"
              @focus="handleInputFocusEvent" @blur="handleInputBlurEvent" @input="handleTextareaInput"
              @keydown="handleInputKeydown" resize="none">
            </el-input>

            <!-- 发送按钮 - 嵌入在输入框右侧 -->
            <BabeButton size="medium"
              :disabled="!isConnected || !inputMessage.trim() || isReplying || !chatStore.currentChat?.id"
              @click="handleSendMessage" class="send-button-wrapper">
              <template #icon v-if="shouldShowPrice">
                <div class="flex items-center mr-1">
                  <span class="text-sm mr-1 font-semibold">{{ selectedFunction.price }}</span>
                  <svg-icon iconClass="diamond" :size="16" class="diamond-icon" />
                </div>
              </template>
              <n-icon size="20">
                <SendSharp />
              </n-icon>
            </BabeButton>
          </div>
          <!-- 功能按钮组 - 统一的功能操作区 -->
          <div class="function-buttons-row ">
            <!-- 图片按钮 -->
            <div class="function-btn-wrapper">
              <n-button text :disabled="isReplying" @click="() => handleSelect('show_me')"
                :class="['function-btn', { 'function-btn-active': selectedFunction.type === 'show_me' }]">
                <n-icon size="16" :class="isReplying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'">
                  <ImageOutline />
                </n-icon>
                <!-- 取消按钮 - 内嵌在按钮内 -->
                <div v-if="selectedFunction.type === 'show_me'" @click.stop="handleCancelSelection" class="cancel-icon">
                  <n-icon size="12">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                        stroke-width="32" d="M368 368L144 144M368 144L144 368" />
                    </svg>
                  </n-icon>
                </div>
              </n-button>
            </div>

            <!-- 视频按钮 -->
            <!-- <div class="function-btn-wrapper">
              <n-button text :disabled="isReplying" @click="() => handleSelect('send_me')"
                :class="['function-btn', { 'function-btn-active': selectedFunction.type === 'send_me' }]">
                <n-icon size="16" :class="isReplying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'">
                  <VideocamOutline />
                </n-icon>
                <div v-if="selectedFunction.type === 'send_me'" @click.stop="handleCancelSelection" class="cancel-icon">
                  <n-icon size="12">
                    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
                      <path fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"
                        stroke-width="32" d="M368 368L144 144M368 144L144 368" />
                    </svg>
                  </n-icon>
                </div>
              </n-button>
            </div> -->

            <!-- 文档按钮 -->
            <!-- <n-button text :disabled="isReplying" @click="() => handleSelect('can_see')" class="function-btn">
              <n-icon size="16" :class="isReplying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'">
                <DocumentTextOutline />
              </n-icon>
            </n-button> -->
          </div>
        </div>
      </div>
    </n-config-provider>
  </div>
</template>
<script setup lang="ts">
import { GlobalThemeOverrides, useMessage, useDialog } from "naive-ui";
import { ref, reactive, computed, nextTick, watch, onMounted, onUnmounted, h } from "vue";
import { useI18n } from "vue-i18n";
import ChatItem from "./ChatItem.vue";
import { SendSharp, AddCircleOutline, HeartOutline, ImageOutline, VideocamOutline, DocumentTextOutline } from "@vicons/ionicons5";
import BabeButton from "@/components/BabeButton/index.vue";
import SvgIcon from "@/components/SvgIcon/index.vue";
import { useChatStore } from "@/stores/chat";
import { useGlobalStore } from "@/stores/global/global";
import { useThemeStore } from "@/stores/themeStore";
import { useWebSocket } from "@/composables/useWebSocket";
import { MessageType } from "@/utils/websocket";
import { ChatMessage } from "@/types/chat";
import { useRouter, onBeforeRouteLeave } from "vue-router";
import { formatRelativeTime } from "@/utils/timeFormat";
import ChatHeader from "@/components/Header/Components/Chat.vue";
import { useScrollManager } from "@/composables/useScrollManager";
import { useDeviceDetection } from "@/composables/useDeviceDetection";
import { useMobileChatExperience } from "@/composables/useMobileChatExperience";
import { useVideoWebSocket } from "@/composables/useVideoWebSocket";
import InfinityScroll from "@/components/InfinityScroll/index.vue";
import { throttle } from "@/utils/throttle";
import { showSubscriptionModal } from "@/utils/subscriptionModal";
import { showDiamondRechargeModal } from "@/utils/diamondRechargeModal";

// Stores
const globalStore = useGlobalStore();
const chatStore = useChatStore();
const themeStore = useThemeStore();
const router = useRouter();
const { t, locale } = useI18n();
const dialog = useDialog();
type DisplayMessage = ChatMessage & { shouldShowTime: boolean; key: string };

const formatMessageTime = (time: string) => {
  return formatRelativeTime(time, t);
};

// WebSocket功能
const {
  messages,
  isConnected,
  isConnecting,
  connectionStatus,
  error,
  sendMessage,
  sendGenerateVideoMessage,
  reconnect,
  retryMessage,
  loadHistoryMessages,
  hasMoreHistory,
  isLoadingHistory,
  sendPurchaseCollection,
  resetAllCollectionPurchasingStates,
  isReplying,
} = useWebSocket();

// 设备检测
const { isIOSSafari, isAndroid } = useDeviceDetection();

// 滚动管理
const { scrollToBottom, debouncedScrollToBottom, cleanup, debugScrollbarRef, getScrollContainer } =
  useScrollManager();

// 移动端聊天体验优化
const {
  mobileOptimizedHeight,
  forceScrollToBottom,
  handleInputFocus,
  handleInputBlur,
  handleMessageSent,
  keyboardState,
  setInputAreaHeight
} = useMobileChatExperience();

// 视频WebSocket功能
const { onEvent: onVideoEvent } = useVideoWebSocket();

// 动态计算 InfinityScroll 高度
const infinityScrollHeight = computed(() => {
  if (globalStore.isMobile) {
    return mobileOptimizedHeight.value;
  }

  // 桌面端动态高度计算
  // 基础固定高度：ChatHeader(64px) + 其他固定间距(92px) + 输入区域当前高度
  // 当输入区域为1行时，总高度应该是226px
  const baseFixedHeight = 136; // ChatHeader(64px) + 其他固定间距(92px)
  const currentInputHeight = measuredInputHeight.value || 85; // 输入区域当前高度，默认70px（1行）
  const totalOffsetHeight = baseFixedHeight + currentInputHeight;

  return `calc(100vh - ${totalOffsetHeight}px)`;
});

// 输入框聚焦状态
const isInputFocused = ref(false);

// 输入框内容
const inputMessage = ref("");

// 当前选中的功能类型及其价格
const selectedFunction = ref<{
  type: 'show_me' | 'send_me' | 'can_see' | null;
  price: number;
}>({
  type: null,
  price: 0
});

// 计算是否应该显示价格和钻石图标
const shouldShowPrice = computed(() => {
  // 只有当选择了 show_me 或 send_me，且输入框有内容时才显示
  return (
    (selectedFunction.value.type === 'show_me' || selectedFunction.value.type === 'send_me') &&
    inputMessage.value.trim().length > 0
  );
});

// 预设文本映射
const presetTextMap: Record<string, string> = {
  'show_me': '',
  'send_me': '',
  'can_see': ''
};

// 初始化预设文本（在mounted时从i18n获取）
const initPresetTexts = () => {
  presetTextMap['show_me'] = t('chat.showMe') + ' ';
  presetTextMap['send_me'] = t('chat.sendMe') + ' ';
  presetTextMap['can_see'] = t('chat.canSee') + ' ';
};

// 输入区域引用
const inputAreaRef = ref<HTMLElement | null>(null);
const measuredInputHeight = ref(85); // 输入区域1行时的初始高度

// 滚动容器引用
const scrollbarRef = ref();

// 消息内容容器引用
const messageContainerRef = ref<HTMLElement | null>(null);
const message = useMessage();

// 文本域输入处理相关
const textareaHeight = ref(0);
const previousTextareaHeight = ref(0);

const scrollState = reactive({
  autoStick: true,
  historySnapshot: null as null | {
    previousHeight: number;
    previousTop: number;
  },
});

const HISTORY_LOAD_DELAY_MS = 160;
const HISTORY_LOAD_TOP_THRESHOLD = 48;
const historyLoadCooldown = ref(false);
let historyLoadTimer: number | null = null;

// 视频生成状态管理
const videoLoadingMap = ref<Record<string, boolean>>({});
const videoDoneMap = ref<Record<string, boolean>>({});
const videoProgressMap = ref<Record<string, string | number>>({});

// ResizeObserver相关变量
let resizeObserver: ResizeObserver | null = null;
let throttledScrollToBottom: ((...args: any[]) => void) | null = null;
//

/**
 * 处理输入框聚焦事件
 */
const handleInputFocusEvent = async () => {
  // 设置聚焦状态
  isInputFocused.value = true;

  if (!globalStore.isMobile) return;

  // 延迟一小段时间后滚动到底部，确保键盘完全弹出
  const delay = isIOSSafari.value ? 300 : 100;
  setTimeout(async () => {
    // 只滚动聊天内容区域，而不是整个页面
    if (globalStore.isMobile) {
      await forceScrollToBottom(scrollbarRef, { smooth: true });
    } else {
      await scrollbarRef.value?.scrollToBottom({
        smooth: true,
      });
    }
  }, delay);
};

/**
 * 处理输入框失焦事件
 */
const handleInputBlurEvent = () => {
  // 清除聚焦状态
  isInputFocused.value = false;

  if (globalStore.isMobile) {
    handleInputBlur();
  }
};

/**
 * 处理文本域输入事件，实现向上扩展行数和动态调整布局
 */
const handleTextareaInput = () => {
  nextTick(() => {
    // 获取文本域的实际高度
    const textarea = inputInstRef.value?.$el?.querySelector('textarea');
    if (textarea) {
      previousTextareaHeight.value = textareaHeight.value;
      textareaHeight.value = textarea.offsetHeight;

      // 强制检测输入区域高度变化（包括减少时）
      const currentInputAreaHeight = inputAreaRef.value?.offsetHeight || 85;
      const previousHeight = measuredInputHeight.value;

      // 只要高度发生变化就调整布局（包括减少）
      if (textareaHeight.value !== previousTextareaHeight.value ||
        currentInputAreaHeight !== previousHeight) {
        adjustLayoutForTextarea();
      }
    }
  });
};

/**
 * 根据文本域高度调整布局
 */
const adjustLayoutForTextarea = () => {
  // 更新输入区域高度
  const inputAreaHeight = inputAreaRef.value?.offsetHeight || 0;
  measuredInputHeight.value = inputAreaHeight;

  // 同步给移动端高度优化逻辑
  setInputAreaHeight(inputAreaHeight);

  // 动态调整InfinityScroll高度
  adjustInfinityScrollHeight();

  // 如果文本域高度增加，向上扩展效果
  if (textareaHeight.value > previousTextareaHeight.value) {
    handleTextareaExpand();
  }
};

/**
 * 动态调整InfinityScroll组件高度
 */
const adjustInfinityScrollHeight = () => {
  if (!scrollbarRef.value) return;

  // 强制重新计算布局
  nextTick(() => {
    if (scrollbarRef.value) {
      // 触发InfinityScroll的重新布局
      scrollbarRef.value.updateLayout?.();
    }
  });
};

/**
 * 处理文本域向上扩展效果
 */
const handleTextareaExpand = () => {
  // 向上扩展效果：保持聊天内容在可视区域内
  if (scrollState.autoStick) {
    // 如果当前是自动滚动到底部状态，保持底部位置
    nextTick(() => {
      if (globalStore.isMobile) {
        forceScrollToBottom(scrollbarRef, { smooth: false });
      } else {
        scrollbarRef.value?.scrollToBottom({ smooth: false });
      }
    });
  }
};

// 更强的滚动到底部保障（区分 iOS/Android）
const ensureScrollToBottom = async (smooth = true) => {
  scrollState.autoStick = true;
  // 首次强制滚动
  await scrollToBottom(scrollbarRef, { smooth, force: true });

  if (isAndroid.value) {
    // Android：多次尝试，兼容渲染/布局时序
    requestAnimationFrame(() => {
      scrollToBottom(scrollbarRef, { smooth, force: true });
    });
    setTimeout(() => {
      scrollToBottom(scrollbarRef, { smooth, force: true });
    }, 140);
  }

  if (isIOSSafari.value) {
    // iOS Safari：使用多次帧/定时器回补，避免初次渲染未完成导致失败
    requestAnimationFrame(() => {
      scrollToBottom(scrollbarRef, { smooth, force: true });
    });
    setTimeout(() => {
      scrollToBottom(scrollbarRef, { smooth, force: true });
    }, 200);
    setTimeout(() => {
      scrollToBottom(scrollbarRef, { smooth, force: true });
    }, 450);
  }
};

// 多次尝试锚定底部，直到真正触底或达到重试上限
const anchorToBottom = async (
  { smooth = true, maxTries = 6, interval = 90 }: { smooth?: boolean; maxTries?: number; interval?: number } = {}
) => {
  for (let i = 0; i < maxTries; i++) {
    await ensureScrollToBottom(smooth);
    const container = getScrollContainer(scrollbarRef);
    if (container) {
      const threshold = 20;
      const atBottom = container.scrollTop + container.clientHeight >= container.scrollHeight - threshold;
      if (atBottom) return;
    }
    await new Promise((r) => setTimeout(r, interval));
  }
};

// 移除动态底部内边距，改由容器高度控制，避免重复留白

// 处理InfinityScroll的加载更多事件
const handleLoadMore = () => {
  if (historyLoadCooldown.value) {
    return;
  }
  if (historyLoadTimer) {
    clearTimeout(historyLoadTimer);
    historyLoadTimer = null;
  }
  if (hasMoreHistory.value && !isLoadingHistory.value) {
    const container = getScrollContainer(scrollbarRef);
    if (container) {
      scrollState.historySnapshot = {
        previousHeight: container.scrollHeight,
        previousTop: container.scrollTop,
      };
    }
    scrollState.autoStick = false;
    historyLoadCooldown.value = true;
    historyLoadTimer = window.setTimeout(() => {
      loadHistoryMessages();
      historyLoadTimer = null;
      window.setTimeout(() => {
        historyLoadCooldown.value = false;
      }, HISTORY_LOAD_DELAY_MS);
    }, HISTORY_LOAD_DELAY_MS);
  }
};

// 处理InfinityScroll的滚动事件
const handleInfinityScroll = (scrollData: {
  scrollTop: number;
  scrollHeight: number;
  clientHeight: number;
  isAtTop: boolean;
  isAtBottom: boolean;
}) => {
  scrollState.autoStick = scrollData.isAtBottom;
  if (
    scrollData.isAtTop &&
    hasMoreHistory.value &&
    !isLoadingHistory.value &&
    scrollData.scrollTop <= HISTORY_LOAD_TOP_THRESHOLD
  ) {
    handleLoadMore();
  }
};

// 下拉菜单选项
const options = computed(() => [
  {
    label: t('chat.showMe'),
    key: "show_me",
    icon: () => h(ImageOutline, { style: { width: '16px', height: '16px' } })
  },
  {
    label: t('chat.sendMe'),
    key: "send_me",
    icon: () => h(VideocamOutline, { style: { width: '16px', height: '16px' } })
  },
  {
    label: t('chat.canSee'),
    key: "can_see",
    icon: () => h(DocumentTextOutline, { style: { width: '16px', height: '16px' } })
  },
]);

// 连接状态显示
const connectionStatusType = computed(() => {
  switch (connectionStatus.value) {
    case "connected":
      return "success";
    case "connecting":
      return "warning";
    case "disconnected":
      return "error";
    default:
      return "default";
  }
});

const connectionStatusText = computed(() => {
  switch (connectionStatus.value) {
    case "connected":
      return t('chat.connectionStatus.connected');
    case "connecting":
      return t('chat.connectionStatus.connecting');
    case "disconnected":
      return t('chat.connectionStatus.disconnected');
    default:
      return t('chat.connectionStatus.unknown');
  }
});

// 格式化消息时间函数已移至ChatItem.vue组件

const chatScopeKey = computed(() => {
  const scope = chatStore.currentChat?.id ?? chatStore.currentChat?.companion_id;
  return scope !== undefined && scope !== null ? String(scope) : "unknown-chat";
});

const resolveMessageKey = (message: ChatMessage, index: number): string => {
  const source = message.id ?? message.message_id ?? message.response_id;
  if (source !== undefined && source !== null) {
    return `${chatScopeKey.value}-${String(source)}`;
  }

  const content = message.content as Record<string, unknown> | undefined;
  const fallbackKey =
    (message as any).unique_id ??
    content?.message_id ??
    content?.file_id ??
    content?.id ??
    content?.image_url ??
    content?.video_url ??
    message.time;

  return `${chatScopeKey.value}-${String(fallbackKey ?? `message-${index}`)}`;
};

/**
 * 判断是否是用户发送新消息导致的消息数量变化
 */
const isUserSendingNewMessage = (newLen: number, oldLen: number): boolean => {
  // 如果消息数量增加1且最后一条消息是用户发送的，则认为是用户发送新消息
  if (newLen === oldLen + 1 && messages.value.length > 0) {
    const lastMessage = messages.value[messages.value.length - 1];
    return lastMessage.isSelf === true;
  }
  return false;
};

// 按5分钟分组的消息列表
const messagesWithTimeDisplay = computed<DisplayMessage[]>(() => {
  if (!messages.value || messages.value.length === 0) {
    return [];
  }

  const result: DisplayMessage[] = [];
  let currentGroup: ChatMessage[] = [];
  let currentGroupStartTime = 0;

  const groupMessagesByTime = (message: ChatMessage, index: number) => {
    const messageTime = new Date(message.time).getTime();

    // 第一条消息开始新分组
    if (index === 0 || currentGroup.length === 0) {
      if (currentGroup.length > 0) {
        result.push(...processMessageGroup(currentGroup));
      }
      currentGroup = [message];
      currentGroupStartTime = messageTime;
    } else {
      const timeDiffInMinutes = Math.floor(
        (messageTime - currentGroupStartTime) / (1000 * 60)
      );

      // 时间间隔超过5分钟，开始新分组
      if (timeDiffInMinutes >= 5) {
        result.push(...processMessageGroup(currentGroup));
        currentGroup = [message];
        currentGroupStartTime = messageTime;
      } else {
        // 同一分组内
        currentGroup.push(message);
      }
    }
  };

  messages.value.forEach((message, index) => {
    groupMessagesByTime(message, index);
  });

  // 处理最后一个分组，标记为最后一组
  if (currentGroup.length > 0) {
    result.push(...processMessageGroup(currentGroup, true));
  }

  return result;
});

// 处理消息分组，为每组的第一条消息标记显示时间
const processMessageGroup = (group: ChatMessage[], isLastGroup: boolean = false): DisplayMessage[] => {
  if (group.length === 0) return [];

  const result: DisplayMessage[] = [];

  group.forEach((message, index) => {
    const enrichedMessage: DisplayMessage = {
      ...message,
      key: resolveMessageKey(message, group.indexOf(message)),
      // 每组的第一条消息显示时间
      shouldShowTime: index === 0,
    };

    result.push(enrichedMessage);
  });

  return result;
};

/**
 * 发送消息
 */
const handleSendMessage = async () => {
  const content = inputMessage.value.trim();

  // 添加详细的调试信息
  console.log('发送消息调试信息:', {
    content,
    isConnected: isConnected.value,
    isReplying: isReplying.value,
    currentChat: chatStore.currentChat,
    companionId: chatStore.currentChat?.companion_id
  });

  if (!content) {
    console.warn('消息内容为空，无法发送');
    return;
  }

  if (!chatStore.currentChat?.id) {
    console.warn('未选择聊天对象，无法发送消息');
    return;
  }

  if (isReplying.value) {
    console.warn('正在回复中，无法发送新消息');
    return;
  }

  // 发送消息（现在sendMessage会处理WebSocket初始化）
  const success = await sendMessage(content);

  if (success) {
    // 清空输入框
    inputMessage.value = "";

    // 重置选中的功能类型，恢复默认价格
    selectedFunction.value = { type: null, price: 0 };

    // 发送消息后强制滚动到底部，清除历史快照状态
    scrollState.autoStick = true;
    scrollState.historySnapshot = null;

    // 发送消息后滚动到底部 - 移动端使用优化的滚动方法
    if (globalStore.isMobile) {
      await handleMessageSent(scrollbarRef);
    } else {
      await scrollbarRef.value?.scrollToBottom({
        smooth: true,
      });
    }
  } else {
    console.error('发送消息失败');
  }
};

const handleSendSuggestion = async (text: string) => {
  const normalized = String(text ?? "").trim().replace(/^(?:%{3}\s*)+/, "").trim();
  if (!normalized) return;
  if (isReplying.value) return;
  selectedFunction.value = { type: null, price: 0 };
  inputMessage.value = normalized;
  await nextTick();
  await handleSendMessage();
};

/**
 * 处理重试消息
 */
const handleRetryMessage = (messageId: string | number) => {
  retryMessage(messageId);
};

const handleCollectionPurchase = (payload: { collectionId: number; messageId?: string | number; responseId?: string | number }) => {
  if (!payload?.collectionId) {
    return;
  }
  sendPurchaseCollection(payload.collectionId);
};

/**
 * 处理视频生成事件
 */
const handleVideoGenerationStart = (fileId: string) => {
  videoLoadingMap.value = { ...videoLoadingMap.value, [fileId]: true };
  videoProgressMap.value = { ...videoProgressMap.value, [fileId]: 0 };
  videoDoneMap.value = { ...videoDoneMap.value, [fileId]: false };
};

const handleVideoGenerationProgress = (fileId: string, progress: string | number) => {
  videoProgressMap.value = { ...videoProgressMap.value, [fileId]: progress };
};

const handleVideoGenerationComplete = (fileId: string, success: boolean) => {
  videoLoadingMap.value = { ...videoLoadingMap.value, [fileId]: false };
  if (success) {
    videoDoneMap.value = { ...videoDoneMap.value, [fileId]: true };
    videoProgressMap.value = { ...videoProgressMap.value, [fileId]: 100 };
  } else {
    videoProgressMap.value = { ...videoProgressMap.value, [fileId]: 0 };
  }
};

const resetAllVideoGenerationStates = () => {
  const loadingEntries = { ...videoLoadingMap.value };
  let loadingChanged = false;
  Object.keys(loadingEntries).forEach((key) => {
    if (loadingEntries[key]) {
      loadingEntries[key] = false;
      loadingChanged = true;
    }
  });
  if (loadingChanged) {
    videoLoadingMap.value = loadingEntries;
  }

  const progressEntries = { ...videoProgressMap.value };
  let progressChanged = false;
  Object.keys(progressEntries).forEach((key) => {
    if (typeof progressEntries[key] === "number" && progressEntries[key] !== 0) {
      progressEntries[key] = 0;
      progressChanged = true;
    }
  });
  if (progressChanged) {
    videoProgressMap.value = progressEntries;
  }
};

/**
 * 处理输入框键盘事件，防止删除预设文本
 */
const handleInputKeydown = (event: KeyboardEvent) => {
  // 处理 Enter 发送消息 (非 Shift+Enter)
  if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
    event.preventDefault();
    handleSendMessage();
    return;
  }

  const functionType = selectedFunction.value.type;

  // 只对 show_me 和 send_me 类型进行锁定保护
  if (functionType !== 'show_me' && functionType !== 'send_me') {
    return;
  }

  const presetText = presetTextMap[functionType];
  if (!presetText) return;

  const textarea = inputInstRef.value?.$el?.querySelector('textarea');
  if (!textarea) return;

  const cursorPosition = textarea.selectionStart;
  const selectedLength = textarea.selectionEnd - textarea.selectionStart;

  // 防止删除预设文本
  if (event.key === 'Backspace' || event.key === 'Delete') {
    // 如果光标在预设文本范围内，或者选中了预设文本的一部分
    if (event.key === 'Backspace' && cursorPosition <= presetText.length) {
      event.preventDefault();
      return;
    }
    if (event.key === 'Delete' && cursorPosition < presetText.length) {
      event.preventDefault();
      return;
    }
    // 如果选中的内容包含预设文本
    if (selectedLength > 0 && cursorPosition < presetText.length) {
      event.preventDefault();
      return;
    }
  }

  // 防止在预设文本前面插入内容
  if (cursorPosition < presetText.length && event.key.length === 1) {
    event.preventDefault();
    // 将光标移到预设文本后面
    setTimeout(() => {
      textarea.setSelectionRange(presetText.length, presetText.length);
    }, 0);
  }
};

/**
 * 取消当前选择
 */
const handleCancelSelection = () => {
  // 清空输入框
  inputMessage.value = '';
  // 重置选择状态
  selectedFunction.value = { type: null, price: 0 };
  // 聚焦输入框
  inputInstRef.value?.focus();
};

/**
 * 处理下拉菜单选择
 */
const inputInstRef = ref(null);
const handleSelect = async (value: string) => {
  console.log(value);

  // 初始化预设文本（确保i18n已加载）
  if (!presetTextMap['show_me']) {
    initPresetTexts();
  }

  // 根据选择的功能类型设置价格和文本
  switch (value) {
    case "show_me":
      // 如果已经是选中状态，不重复设置
      if (selectedFunction.value.type === 'show_me') {
        inputInstRef.value?.focus();
        return;
      }
      inputMessage.value = presetTextMap['show_me'];
      selectedFunction.value = { type: 'show_me', price: 2 };
      break;
    case "send_me":
      // 如果已经是选中状态，不重复设置
      if (selectedFunction.value.type === 'send_me') {
        inputInstRef.value?.focus();
        return;
      }
      inputMessage.value = presetTextMap['send_me'];
      selectedFunction.value = { type: 'send_me', price: 20 };
      break;
    case "can_see":
      inputMessage.value = presetTextMap['can_see'];
      selectedFunction.value = { type: 'can_see', price: 0 };
      break;
    default:
      console.log(t('chat.unknownOperation'), value);
      selectedFunction.value = { type: null, price: 0 };
  }

  // 聚焦输入框并将光标移到末尾
  await nextTick();
  inputInstRef.value?.focus();
  const textarea = inputInstRef.value?.$el?.querySelector('textarea');
  if (textarea) {
    const textLength = inputMessage.value.length;
    textarea.setSelectionRange(textLength, textLength);
  }
};

// 监听消息数量变化，自动滚动到底部
watch(
  () => messages.value.length,
  async (newLen, oldLen) => {
    await nextTick();
    if (typeof oldLen === "number" && newLen > oldLen && scrollState.autoStick) {
      const container = getScrollContainer(scrollbarRef);
      // 只有在加载历史消息且有历史快照时才维持滚动位置
      // 新消息发送时应该直接滚动到底部
      if (container && !isLoadingHistory.value && scrollState.historySnapshot && !isUserSendingNewMessage(newLen, oldLen)) {
        const delta = container.scrollHeight - scrollState.historySnapshot.previousHeight;
        container.scrollTop = scrollState.historySnapshot.previousTop + delta;
        scrollState.historySnapshot = null;
        return;
      }

      // 新消息发送或历史消息加载完成时滚动到底部
      if (globalStore.isMobile) {
        if (isIOSSafari.value) {
          setTimeout(async () => {
            await forceScrollToBottom(scrollbarRef, { smooth: true });
          }, 100);
        } else {
          await forceScrollToBottom(scrollbarRef, { smooth: true });
        }
      } else {
        await scrollbarRef.value?.scrollToBottom({
          smooth: true,
        });
      }
    }

    if (!isLoadingHistory.value && historyLoadTimer) {
      clearTimeout(historyLoadTimer);
      historyLoadTimer = null;
    }
    if (!isLoadingHistory.value) {
      historyLoadCooldown.value = false;
    }
  }
);

// 监听消息内容变化（如打字效果、加载状态等），自动滚动到底部
watch(
  () =>
    messages.value.map((msg, idx) => ({
      key: resolveMessageKey(msg, idx),
      displayedText: msg.displayedText,
      isLoading: msg.isLoading,
      isTyping: msg.isTyping,
    })),
  async () => {
    await nextTick();
    if (!scrollState.autoStick) {
      return;
    }
    if (globalStore.isMobile) {
      if (isIOSSafari.value) {
        setTimeout(async () => {
          await forceScrollToBottom(scrollbarRef, { smooth: true });
        }, 100);
      } else {
        await forceScrollToBottom(scrollbarRef, { smooth: true });
      }
    } else {
      await scrollbarRef.value?.scrollToBottom({
        smooth: true,
      });
    }
  },
  { deep: true }
);

// 监听聊天对象变化
watch(
  () => chatStore.currentChat?.companion_id,
  async (newCompanionId, oldCompanionId) => {
    if (newCompanionId && newCompanionId !== oldCompanionId) {
      scrollState.autoStick = true;
      scrollState.historySnapshot = null;
      console.log('聊天对象变化，重新加载历史记录', {
        newCompanionId,
        oldCompanionId,
        currentChat: chatStore.currentChat,
        isConnected: isConnected.value
      });

      // 检查 WebSocket 连接状态，如果未连接则尝试重连
      if (!isConnected.value) {
        console.warn('聊天对象变化时检测到WebSocket未连接，尝试重连');
        try {
          await reconnect();
          // 等待一段时间让连接建立
          await new Promise(resolve => setTimeout(resolve, 1000));
        } catch (error) {
          console.error('WebSocket重连失败:', error);
        }
      }

      await loadHistoryMessages();
      await nextTick();

      if (globalStore.isMobile) {
        if (isIOSSafari.value) {
          setTimeout(() => {
            anchorToBottom({ smooth: false, maxTries: 3, interval: 60 });
          }, 100);

          setTimeout(() => {
            anchorToBottom({ smooth: false, maxTries: 3, interval: 80 });
          }, 400);

          setTimeout(() => {
            anchorToBottom({ smooth: true, maxTries: 2, interval: 100 });
          }, 800);
        } else {
          await forceScrollToBottom(scrollbarRef, { smooth: false });
          setTimeout(async () => {
            await forceScrollToBottom(scrollbarRef, { smooth: true });
          }, 200);
        }
      } else {
        await scrollbarRef.value?.scrollToBottom({ smooth: false });
      }
    }
  },
  { immediate: false }
);

//

// 组件挂载时加载当前聊天对象的历史记录并滚动到底部
onMounted(async () => {
  console.log('Chat组件挂载');

  // 初始化预设文本
  initPresetTexts();

  // 检查当前聊天对象状态
  console.log('挂载时聊天对象状态:', {
    currentChat: chatStore.currentChat,
    isConnected: isConnected.value
  });

  // 不在这里初始化视频WebSocket，避免与 ChatItem 组件冲突
  // 视频WebSocket将在需要时由 ChatItem 组件负责初始化

  // 监听视频生成事件
  onVideoEvent((payload) => {
    // 根据文档，正常消息使用type字段，错误消息使用message_type字段
    const type = payload.type || (payload as any).message_type;
    const { content } = payload;

    console.log('[Chat.vue] onVideoEvent 收到事件:', {
      type,
      content,
      payload
    });

    switch (type) {
      case 'text_to_image_progress':
        console.log('[Chat.vue] 收到 text_to_image_progress 事件（图片生成进度）:', content);
        break;
      case 'image_to_video_start':
        if (content?.file_id) {
          handleVideoGenerationStart(content.file_id);
        } else {
          // 使用 unique_id 查找对应的消息
          const uniqueId = (payload as any).unique_id || (payload as any).uniqueId;
          if (uniqueId) {
            const targetMessage = messages.value.find(msg =>
              (msg as any).unique_id === uniqueId ||
              (msg as any).id === uniqueId ||
              msg.content?.file_id === uniqueId ||
              msg.content?.id === uniqueId
            );
            if (targetMessage) {
              const fileId = targetMessage.content?.file_id ||
                             targetMessage.content?.id ||
                             targetMessage.id ||
                             (targetMessage as any).message_id;
              if (fileId) {
                handleVideoGenerationStart(fileId as string);
              }
            }
          }
        }
        break;
      case 'image_to_video_progress':
        if (content?.file_id) {
          handleVideoGenerationProgress(content.file_id, content.message);
        } else {
          // 使用 unique_id 查找对应的消息
          const uniqueId = (payload as any).unique_id || (payload as any).uniqueId;
          if (uniqueId && content?.message) {
            console.log('[Chat.vue] 尝试通过 unique_id 查找消息:', uniqueId);
            // 在消息列表中查找具有相同 unique_id 的消息
            const targetMessage = messages.value.find(msg =>
              (msg as any).unique_id === uniqueId ||
              (msg as any).id === uniqueId ||
              msg.content?.file_id === uniqueId ||
              msg.content?.id === uniqueId
            );

            if (targetMessage) {
              console.log('[Chat.vue] 找到匹配消息，提取 file_id:', targetMessage);
              // 从消息内容中提取 file_id
              const fileId = targetMessage.content?.file_id ||
                             targetMessage.content?.id ||
                             targetMessage.id ||
                             (targetMessage as any).message_id;
              if (fileId) {
                handleVideoGenerationProgress(fileId as string, content.message);
                console.log('[Chat.vue] 成功更新进度:', { fileId, message: content.message });
              } else {
                console.warn('[Chat.vue] 找到消息但无法提取 file_id:', targetMessage);
              }
            } else {
              console.warn('[Chat.vue] 未找到匹配 unique_id 的消息:', uniqueId);
            }
          } else {
            console.warn('[Chat.vue] image_to_video_progress 事件缺少 file_id 且没有 unique_id:', content);
          }
        }
        break;
      case 'image_to_video_complete':
        if (content?.file_id) {
          const success = content?.success !== false;
          handleVideoGenerationComplete(content.file_id, success);
        } else {
          // 使用 unique_id 查找对应的消息
          const uniqueId = (payload as any).unique_id || (payload as any).uniqueId;
          if (uniqueId) {
            const targetMessage = messages.value.find(msg =>
              (msg as any).unique_id === uniqueId ||
              (msg as any).id === uniqueId ||
              msg.content?.file_id === uniqueId ||
              msg.content?.id === uniqueId
            );
            if (targetMessage) {
              const fileId = targetMessage.content?.file_id ||
                             targetMessage.content?.id ||
                             targetMessage.id ||
                             (targetMessage as any).message_id;
              if (fileId) {
                const success = content?.success !== false;
                handleVideoGenerationComplete(fileId as string, success);
              }
            }
          }
        }
        break;
      case 'image_to_video_error':
        if (content?.file_id) {
          console.error('视频生成错误:', content);
          handleVideoGenerationComplete(content.file_id, false);

          // 显示错误提示
          const errorMessage = content?.message || '视频生成失败';
          message.error(errorMessage);
        } else {
          // 使用 unique_id 查找对应的消息
          const uniqueId = (payload as any).unique_id || (payload as any).uniqueId;
          if (uniqueId) {
            const targetMessage = messages.value.find(msg =>
              (msg as any).unique_id === uniqueId ||
              (msg as any).id === uniqueId ||
              msg.content?.file_id === uniqueId ||
              msg.content?.id === uniqueId
            );
            if (targetMessage) {
              const fileId = targetMessage.content?.file_id ||
                             targetMessage.content?.id ||
                             targetMessage.id ||
                             (targetMessage as any).message_id;
              if (fileId) {
                handleVideoGenerationComplete(fileId as string, false);

                // 显示错误提示
                const errorMessage = content?.message || '视频生成失败';
                message.error(errorMessage);
              }
            }
          }
        }
        break;
      case MessageType.insufficient_balance_error:
        // 处理余额不足错误
        if (content?.file_id) {
          handleVideoGenerationComplete(content.file_id, false);
        } else{
          resetAllVideoGenerationStates();
        }
        
        // 重置所有合集卡片的加载状态
        resetAllCollectionPurchasingStates();

        // 显示余额不足弹窗
        try {
          showDiamondRechargeModal();
        } catch (e) {
          console.error("显示余额不足弹窗失败:", e);
        }
        break;
      case MessageType.message_chat_exhausted_error:
        if (content?.file_id) {
          handleVideoGenerationComplete(content.file_id, false);
        } else {
          resetAllVideoGenerationStates();
        }
        
        // 重置所有合集卡片的加载状态
        resetAllCollectionPurchasingStates();

        // 重置回复状态，确保输入框可以重新输入
        isReplying.value = false;
        // 显示订阅弹窗
        try {
          showSubscriptionModal('inline');
        } catch (e) {
          console.error("显示订阅弹窗失败:", e);
        }
        break;
      case 'error':
        console.error('全局错误:', content);

        // 显示错误提示
        const errorMessage = content?.message || '操作失败，请稍后重试';
        message.error(errorMessage);
        break;
    }
  });

  if (globalStore.isMobile && !chatStore.currentChat?.companion_id) {
    router.push({ path: "/chat" });
  }
  if (chatStore.currentChat?.companion_id) {
    // 检查 WebSocket 连接状态，如果未连接则尝试重连
    if (!isConnected.value) {
      console.warn('检测到聊天对象存在但WebSocket未连接，尝试重连');
      try {
        await reconnect();
        // 等待一段时间让连接建立
        await new Promise(resolve => setTimeout(resolve, 1000));
      } catch (error) {
        console.error('WebSocket重连失败:', error);
      }
    }

    await loadHistoryMessages();
    // 等待DOM完全渲染
    await nextTick();

    if (globalStore.isMobile) {
      // iOS Safari初次进入时的特殊处理
      if (isIOSSafari.value) {
        // 第一次：立即无动画滚动，确保基础定位
        setTimeout(() => {
          anchorToBottom({ smooth: false, maxTries: 3, interval: 80 });
        }, 200);

        // 第二次：最终平滑滚动
        setTimeout(() => {
          anchorToBottom({ smooth: true, maxTries: 3, interval: 100 });
        }, 1000);
      } else {
        // 其他移动端平台：使用优化的滚动方法
        setTimeout(async () => {
          await forceScrollToBottom(scrollbarRef, { smooth: false });
        }, 100);

        // 补偿滚动
        setTimeout(async () => {
          await forceScrollToBottom(scrollbarRef, { smooth: true });
        }, 300);
      }
    } else {
      // 桌面端正常处理
      setTimeout(async () => {
        await scrollbarRef.value?.scrollToBottom({
          smooth: false,
        });
      }, 100);
    }
  }

  // 监nfrom合集页面返回的滚动事件
  const handleChatScrollToBottom = async () => {
    await nextTick();
    scrollState.autoStick = true;
    if (globalStore.isMobile) {
      if (isIOSSafari.value) {
        setTimeout(() => {
          anchorToBottom({ smooth: false, maxTries: 4, interval: 80 });
        }, 100);
        setTimeout(() => {
          anchorToBottom({ smooth: true, maxTries: 3, interval: 100 });
        }, 500);
      } else {
        setTimeout(async () => {
          await forceScrollToBottom(scrollbarRef, { smooth: false });
        }, 100);
        setTimeout(async () => {
          await forceScrollToBottom(scrollbarRef, { smooth: true });
        }, 300);
      }
    } else {
      setTimeout(async () => {
        await scrollbarRef.value?.scrollToBottom({ smooth: true });
      }, 100);
    }
  };

  window.addEventListener('chat-scroll-to-bottom', handleChatScrollToBottom);

  // 在 onUnmounted 中清理监听器
  onUnmounted(() => {
    window.removeEventListener('chat-scroll-to-bottom', handleChatScrollToBottom);
  });

  // 初始化ResizeObserver和节流函数
  if (messageContainerRef.value) {
    // 创建节流的滚动到底部函数（移动端更敏感，iOS禁用平滑）
    const throttleMs = globalStore.isMobile ? 200 : 1000;
    throttledScrollToBottom = throttle(() => {
      if (!scrollState.autoStick) {
        return;
      }
      nextTick(() => {
        if (!scrollState.autoStick) {
          return;
        }
        if (globalStore.isMobile) {
          if (isIOSSafari.value) {
            anchorToBottom({ smooth: false, maxTries: 4, interval: 80 });
          } else {
            ensureScrollToBottom(true);
          }
        } else {
          scrollbarRef.value?.scrollToBottom({ smooth: true });
        }
      });
    }, throttleMs);

    // 创建ResizeObserver实例
    resizeObserver = new ResizeObserver(() => {
      if (throttledScrollToBottom) {
        throttledScrollToBottom();
      }
    });

    // 开始观察消息容器
    resizeObserver.observe(messageContainerRef.value);
    console.log("ResizeObserver已初始化并开始观察");
  }

  //

  // 监听输入区域高度变化，动态同步到移动端高度计算与CSS变量
  if (inputAreaRef.value) {
    const resizeInput = new ResizeObserver(() => {
      const h = inputAreaRef.value?.offsetHeight || 85;
      measuredInputHeight.value = h;
      // 同步给移动端高度优化逻辑
      setInputAreaHeight(h);
    });
    resizeInput.observe(inputAreaRef.value);
  } else {
    // 首次测量（防御）
    const h = inputAreaRef.value?.offsetHeight || 85;
    measuredInputHeight.value = h;
    setInputAreaHeight(h);
  }

  // iOS 初次进入再补两帧锚定，覆盖工具栏动画影响
  if (globalStore.isMobile && isIOSSafari.value) {
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        anchorToBottom({ smooth: false, maxTries: 3, interval: 60 });
      });
    });
  }
});

// 组件卸载时清理滚动管理器和ResizeObserver
onUnmounted(() => {
  // 清理ResizeObserver
  if (resizeObserver) {
    resizeObserver.disconnect();
    resizeObserver = null;
    console.log("ResizeObserver已清理");
  }

  if (historyLoadTimer) {
    clearTimeout(historyLoadTimer);
    historyLoadTimer = null;
  }

  // 清理节流函数
  throttledScrollToBottom = null;

  // 清理滚动管理器
  cleanup();
});

// iOS Safari：消息变更后强制锚定底部，避免未渲染完成导致未触底
watch(
  () => messages.value?.length,
  async (newLen, oldLen) => {
    await nextTick();
    if (!scrollState.autoStick) {
      return;
    }
    if (typeof oldLen === "number" && newLen > oldLen) {
      // 如果是用户发送新消息，强制清除历史快照并滚动到底部
      if (isUserSendingNewMessage(newLen, oldLen)) {
        scrollState.historySnapshot = null;
      }

      if (globalStore.isMobile) {
        await anchorToBottom({ smooth: !isIOSSafari.value, maxTries: isIOSSafari.value ? 8 : 4, interval: 100 });
      } else {
        await scrollbarRef.value?.scrollToBottom({ smooth: true });
      }
    }
  }
);

// 历史消息加载完成后，针对 iOS 再次延迟锚定
watch(
  () => isLoadingHistory.value,
  async (loading, prev) => {
    if (prev && !loading) {
      await nextTick();
      const container = getScrollContainer(scrollbarRef);
      if (scrollState.historySnapshot && container) {
        const delta = container.scrollHeight - scrollState.historySnapshot.previousHeight;
        container.scrollTop = scrollState.historySnapshot.previousTop + delta;
      }
      scrollState.historySnapshot = null;
      historyLoadCooldown.value = false;

      if (scrollState.autoStick && globalStore.isMobile && isIOSSafari.value) {
        setTimeout(() => anchorToBottom({ smooth: false, maxTries: 6, interval: 120 }), 200);
        setTimeout(() => anchorToBottom({ smooth: false, maxTries: 4, interval: 120 }), 1000);
      }
    }

    if (loading && scrollState.historySnapshot) {
      scrollState.autoStick = false;
    }
  }
);

// 监听输入消息内容变化，确保删除内容时也能检测到高度变化
watch(
  () => inputMessage.value,
  () => {
    // 延迟一点时间让 DOM 更新完成
    setInterval(() => {
      const currentInputAreaHeight = inputAreaRef.value?.offsetHeight || 85;
      const previousHeight = measuredInputHeight.value;

      // 如果检测到高度变化，强制更新
      if (currentInputAreaHeight !== previousHeight) {
        measuredInputHeight.value = currentInputAreaHeight;
        setInputAreaHeight(currentInputAreaHeight);
      }
    });
  }
);

// iOS Safari：键盘弹出时再次锚定底部
watch(
  () => keyboardState.value.isVisible,
  async (visible) => {
    if (globalStore.isMobile && visible && scrollState.autoStick) {
      await nextTick();
      await anchorToBottom({ smooth: !isIOSSafari.value, maxTries: isIOSSafari.value ? 8 : 3, interval: 80 });
    }
  }
);
</script>

<style scoped lang="scss">
/* 功能按钮专用背景色变量 */
.function-btn {
  --function-btn-bg-light: #ffffff;
  --function-btn-bg-dark: #292929;
}

.chat-root {
  height: 100%;
  display: flex;
  flex-direction: column;
  min-height: 0;
}

/* 确保容器在父布局限定高度下可正确收缩 */
.chat-container {
  min-height: 0;
}

.message-time {
  color: #9ca3af;
  font-size: 12px;
  margin: 4px 0;
  opacity: 0.7;
}

/* 输入框统一容器样式 */
.input-container {
  padding: 8px;
  box-shadow: var(--border);
  border-radius: 8px;
  background-color: var(--c-background);
  transition: box-shadow 0.2s;
  position: relative;
  z-index: 20;
}

/* 聚焦时容器边框高亮 - 使用主题色边框覆盖 shadow-border */
.input-container:focus-within {
  box-shadow: var(--active-border);
}

/* 输入框和发送按钮同一行 */
.input-with-buttons-row {
  display: flex;
  align-items: flex-end;
  /* 改为底部对齐，支持多行文本域 */
  gap: 8px;
}

/* Element Plus 输入框样式覆盖 */
.chat-input {
  --el-input-border: none;
  --el-input-hover-border: none;
  --el-input-focus-border: none;
  flex: 1;
  min-height: 30px;
  /* 最小高度确保单行显示 */
}

.chat-input :deep(.el-input__wrapper) {
  border: none !important;
  box-shadow: none !important;
  background-color: transparent;
  align-items: flex-start;
  /* 文本域内容顶部对齐 */
  padding: 8px 12px;
  min-height: 40px;
}

.chat-input :deep(.el-textarea__inner) {
  color: var(--c-text-primary);
  resize: none;
  /* 禁用手动调整大小 */
  line-height: 1.5;
  padding: 0;
  border: none;
  background: transparent;
  font-size: 14px;
  font-family: inherit;
  outline: none;
  /* 移除聚焦时的轮廓 */
  box-shadow: none;
  /* 移除阴影 */
  scrollbar-width: none;
  /* Firefox 隐藏滚动条 */
  -ms-overflow-style: none;
  /* IE/Edge 隐藏滚动条 */
}

/* Webkit 内核浏览器（Chrome/Safari）隐藏滚动条 */
.chat-input :deep(.el-textarea__inner::-webkit-scrollbar) {
  display: none;
  width: 0;
  height: 0;
}

.chat-input :deep(.el-textarea__inner::placeholder) {
  color: rgba(128, 128, 128, 0.5);
  /* 更淡的灰色 */
}

.chat-input :deep(.el-input__wrapper:hover) {
  box-shadow: none !important;
}

.chat-input :deep(.el-input__wrapper.is-focus) {
  box-shadow: none !important;
}

/* 发送按钮嵌入输入框右侧 */
.send-button-wrapper {
  flex-shrink: 0;
  align-self: flex-end;
  /* 底部对齐 */
  margin-bottom: 1px;
  /* 微调对齐 */
}

.send-button-wrapper .diamond-icon {
  color: var(--c-text-primary);
}

.send-button-wrapper:deep(.n-button) {
  display: flex;
  align-items: center;
  gap: 8px;
}

/* 功能按钮行 */
.function-buttons-row {
  display: flex;
  gap: 8px;
  margin-top: 8px;
  align-items: center;
}


/* 功能按钮包装容器 */
.function-btn-wrapper {
  position: relative;
  display: inline-block;
}

/* 功能按钮统一样式 */
.function-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 6px 12px;
  border-radius: 100px;
  transition: all 0.2s;
  background-color: var(--function-btn-bg-light);
  box-shadow: var(--border);
  border: none;
  position: relative;
  z-index: 1;
  min-width: 48px;
}

/* 功能按钮选中状态 - 参考 PurchaseDiamonds.vue */
.function-btn-active {
  box-shadow: var(--active-border) !important;
  background-color: #F2EBFF !important;
}

:root.dark .function-btn-active {
  background-color: #19172B !important;
}

.function-btn-active .n-icon {
  color: var(--c-primary) !important;
}

/* 取消图标样式 - 内嵌在按钮右上角 */
.cancel-icon {
  position: absolute;
  top: -4px;
  right: -4px;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 18px;
  height: 18px;
  border-radius: 50%;
  background-color: #FF413B;
  cursor: pointer;
  transition: all 0.2s;
  z-index: 2;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
}

.cancel-icon .n-icon {
  color: white !important;
}

.cancel-icon:hover {
  transform: scale(1.15);
  box-shadow: 0 3px 6px rgba(255, 65, 59, 0.3);
}

.cancel-icon:active {
  transform: scale(0.95);
}

/* 深色主题下使用特定背景色 */
:root.dark .function-btn {
  background-color: var(--function-btn-bg-dark);
}

/* 调整图标颜色 */
.function-btn .n-icon {
  color: var(--c-text-primary) !important;
}

.function-btn:hover {
  background-color: var(--c-hover-background);
}

.function-btn:active {
  transform: scale(0.98);
}

.function-btn .btn-text {
  font-size: 13px;
  font-weight: 500;
}

/* 移动端键盘自适应布局 */
@media (max-width: 768px) {

  /* 聊天容器动态高度 */
  .chat-container {
    height: var(--chat-height, auto);
    transition: height 0.3s ease;
    position: relative;
    /* 为底部固定输入区预留空间 */
    padding-bottom: calc(var(--input-area-h, 140px) + env(safe-area-inset-bottom));
  }

  /* 输入框区域固定定位 */
  .input-area {
    position: fixed;
    bottom: 0;
    left: 0;
    right: 0;
    z-index: 1000;
    background-color: var(--c-background);
    padding: 8px;
    padding-top: 0px;
    padding-bottom: calc(8px + env(safe-area-inset-bottom));
    transition: transform 0.3s ease;
  }

  /* 移动端输入容器紧凑布局 */
  .input-container {
    gap: 6px;
  }

  /* 移动端 Element Plus 输入框样式 */
  .chat-input {
    --el-input-border: none;
    --el-input-hover-border: none;
    --el-input-focus-border: none;
    min-height: 36px;
    /* 移动端最小高度 */
  }

  .chat-input :deep(.el-input__wrapper) {
    border: none !important;
    box-shadow: none !important;
    background-color: transparent;
    padding: 6px 10px;
    min-height: 36px;
  }

  .chat-input :deep(.el-textarea__inner) {
    font-size: 16px;
    /* 移动端字体大小优化 */
    line-height: 1.4;
    outline: none;
    /* 移除聚焦时的轮廓 */
    box-shadow: none;
    /* 移除阴影 */
    scrollbar-width: none;
    /* Firefox 隐藏滚动条 */
    -ms-overflow-style: none;
    /* IE/Edge 隐藏滚动条 */
  }

  .chat-input :deep(.el-textarea__inner::placeholder) {
    color: rgba(128, 128, 128, 0.5);
    /* 移动端更淡的灰色 */
  }

  /* 移动端 Webkit 内核浏览器隐藏滚动条 */
  .chat-input :deep(.el-textarea__inner::-webkit-scrollbar) {
    display: none;
    width: 0;
    height: 0;
  }

  /* 移动端功能按钮行样式调整 */
  .function-buttons-row {
    // margin-top: 6px;
    // padding:  0 6px;
  }

  .function-btn {
    padding: 6px 8px;
    flex: 1;
    justify-content: center;
    min-width: 44px;
  }

  /* 移动端功能按钮容器样式调整 */
  .function-btn-content {
    gap: 3px;
  }

  /* 移动端价格字体大小调整 */
  .function-btn-content span.text-sm {
    font-size: 12px !important;
  }

  .function-btn .btn-text {
    font-size: 12px;
  }

  /* 移动端发送按钮适配 */
  .send-button-wrapper {
    align-self: flex-end;
    margin-bottom: 1px;
  }

  .send-button-wrapper:deep(.n-button) {
    gap: 6px;
  }
}

/* 移动端滚动容器优化 */
.mobile-scroll-container {
  height: 100vh;
  /* iOS Safari 优化 */
  -webkit-overflow-scrolling: touch;
  /* 防止iOS回弹效果 */
  overscroll-behavior-y: contain;
  /* Android 优化 */
  overscroll-behavior: contain;
  /* 确保滚动平滑 */
  scroll-behavior: smooth;
}

/* iOS Safari 专用优化 */
@supports (-webkit-touch-callout: none) {
  .mobile-scroll-container {
    /* 启用硬件加速 */
    transform: translateZ(0);
    /* 优化滚动性能 */
    will-change: scroll-position;
  }

  /* 防止iOS Safari的bounce效果 */
  .mobile-scroll-container :deep(.n-scrollbar-container) {
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }
}

/* Android Chrome 专用优化 */
@media screen and (-webkit-min-device-pixel-ratio: 0) {
  .mobile-scroll-container {
    /* Android滚动优化 */
    overscroll-behavior: contain;
    scroll-snap-type: none;
  }
}

/* 触摸设备通用优化 */
@media (hover: none) and (pointer: coarse) {
  .mobile-scroll-container {
    /* 触摸滚动优化 */
    touch-action: pan-y;
    /* 防止意外的水平滚动 */
    overscroll-behavior-x: none;
  }

  /* 优化滚动条在移动端的显示 */
  .mobile-scroll-container :deep(.n-scrollbar-rail) {
    opacity: 0;
    transition: opacity 0.3s ease;
  }

  .mobile-scroll-container:hover :deep(.n-scrollbar-rail) {
    opacity: 1;
  }
}

/* 让列表最后一条消息去掉底部外边距，使顶部/底部留白一致 */
.page-padding>.chat-item-row:last-child {
  margin-bottom: 0;
}

/* 微调列表容器底部内边距，减少约 8px 视觉空白 */

/* 最后一条消息的时间行去掉底部间距 */
.page-padding>.chat-item-row:last-child :deep(.message-time-row) {
  margin-bottom: 0 !important;
}
</style>
