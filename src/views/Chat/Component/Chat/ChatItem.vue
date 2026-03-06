<template>
  <div
    v-if="
      chat.content &&
      !(chat.content === 'generate_video_message' && !chat.isSelf) &&
      !shouldHideMessage
    "
    :key="scopedRenderKey"
    :class="chat.isSelf ? 'text-right' : 'text-left'"
    class="w-full"
  >
    <!-- 所有类型统一交由 MessageCard 根据 type 选择卡片 -->
    <div class="">
      <MessageCard
        :type="chat.type"
        :content="chat.content"
        :is-self="chat.isSelf"
        :response-id="chat.response_id"
        :is-loading="chat.isLoading"
        :is-typing="chat.isTyping"
        :typing-text="streamingRawText"
        :loading-indicator="loadingIndicator"
        :video-loading-map="props.videoLoadingMap"
        :video-done-map="props.videoDoneMap"
        :video-progress-map="props.videoProgressMap"
        @purchase="handleCollectionPurchase"
        @send-suggestion="handleSendSuggestion"
      />
    </div>
  </div>

</template>
<script setup lang="ts">
import {
  ChatMessage,
  CollectionMessageContent,
  StreamStartContent,
  StreamChunkContent,
  StreamCompleteContent,
  StreamErrorContent,
  UserMessageContent,
} from "@/types/chat";
import { useI18n } from "vue-i18n";
import { useMessage } from "naive-ui";
import { MessageType } from "@/utils/websocket";
import {
  computed,
  watch,
  onMounted,
  onBeforeUnmount,
  ref,
  nextTick,
} from "vue";
import { NTag, NIcon, NProgress, NButton, NSpin } from "naive-ui";
import { useTypewriter } from "@/composables/useTypewriter";
import MessageCard from "@/views/Chat/Component/MessageCards/MessageCard.vue";
import { useVideoWebSocket } from "@/composables/useVideoWebSocket";
import { useChatStore } from "@/stores/chat";
import { useWebSocket } from "@/composables/useWebSocket";
import { formatTextWithEmojis } from "@/utils/emoji";
const message = useMessage();
const { t } = useI18n();
const chatStore = useChatStore();
const { addMessage } = useWebSocket();

const TEXT_MESSAGE_TYPES = new Set<MessageType>([
  MessageType.message,
  MessageType.text_hidden,
  MessageType.message_text_hidden,
  MessageType.text_progress_hidden,
]);

const MEDIA_RESULT_TYPES = new Set<MessageType>([
  MessageType.text_to_image_complete,
  MessageType.menu_text_to_image_complete,
  MessageType.image_generation_complete,
  MessageType.text_to_video_complete,
  MessageType.video_generation_complete,
  MessageType.image_to_video_complete,
  MessageType.message_image_hidden,
  MessageType.image_hidden,
  MessageType.message_video_hidden,
  MessageType.video_hidden,
]);

const isTextLikeMessage = (type: MessageType | string) => {
  return TEXT_MESSAGE_TYPES.has(type as MessageType);
};

const isMediaResultMessage = (type: MessageType | string) => {
  return MEDIA_RESULT_TYPES.has(type as MessageType);
};


const props = defineProps<{
  chat: ChatMessage;
  videoLoadingMap?: Record<string, boolean>; // 视频生成加载状态
  videoDoneMap?: Record<string, boolean>; // 视频生成完成状态
  videoProgressMap?: Record<string, string | number>; // 视频生成进度
}>();

const emit = defineEmits<{
  retry: [messageId: string | number];
  purchaseCollection: [
    payload: {
      collectionId: number;
      messageId?: string | number;
      responseId?: string | number;
    }
  ];
  "send-suggestion": [text: string];
}>();

const messageKey = computed(() => {
  const primaryKey =
    props.chat.id ?? props.chat.message_id ?? props.chat.response_id;
  if (primaryKey !== undefined && primaryKey !== null) {
    return String(primaryKey);
  }

  const content = props.chat.content as Record<string, unknown> | undefined;
  const fallbackKey =
    content?.message_id ??
    content?.file_id ??
    content?.id ??
    content?.image_url ??
    content?.video_url ??
    props.chat.time;
  return String(
    fallbackKey ??
      `message-${props.chat.time}-${props.chat.isSelf ? "self" : "ai"}`
  );
});

const handleSendSuggestion = (text: string) => {
  const normalized = String(text ?? "").trim();
  if (!normalized) return;
  emit("send-suggestion", normalized);
};

const scopedRenderKey = computed(() => {
  const scope = chatStore.currentChat?.id ?? chatStore.currentChat?.companion_id;
  const scopeKey = scope !== undefined && scope !== null ? String(scope) : "unknown-chat";
  return `${scopeKey}-${messageKey.value}`;
});

// 判断是否应该隐藏消息
const shouldHideMessage = computed(() => {
  // 检查是否为generate_image_to_video类型的消息
  if (typeof props.chat.content === "string") {
    try {
      const parsed = JSON.parse(props.chat.content);
      if (parsed.type === "generate_image_to_video") {
        return true;
      }
    } catch (e) {
      // 如果不是JSON格式，则继续检查其他条件
    }
  } else if (
    typeof props.chat.content === "object" &&
    props.chat.content !== null
  ) {
    // 检查对象是否包含type: generate_image_to_video
    if (props.chat.content.type === "generate_image_to_video") {
      return true;
    }
  }

  return false;
});

const handleCollectionPurchase = (collectionId: number) => {
  const payload = {
    collectionId,
    messageId: props.chat.id ?? props.chat.message_id,
    responseId: props.chat.response_id,
  };
  emit("purchaseCollection", payload);
};


// 打字机效果
const { displayedText, typeTo } = useTypewriter();

// 获取用户消息内容
const getUserMessageContent = (content: any): string => {
  if (typeof content === "object" && content.content) {
    return content.content;
  }
  return typeof content === "string" ? content : "";
};

// 获取流式开始消息
const getStreamStartMessage = (content: any): string => {
  if (typeof content === "object" && content.message) {
    return content.message;
  }
  return t("chatItem.generatingReply");
};

// 文本/媒体内容的提取逻辑已拆分到消息内容组件

// 获取流式错误消息
const getStreamErrorMessage = (content: any): string => {
  if (typeof content === "object" && content.error) {
    return `${t("chatItem.generationError")}${content.error}`;
  }
  return t("chatItem.regenerateError");
};

// 获取图像生成开始消息
const getImageGenerationStartMessage = (content: any): string => {
  if (typeof content === "object" && content.message) {
    return content.message;
  }
  return t("chatItem.imageRequestDetected");
};

// 获取图像生成进度消息
const getImageGenerationProgressMessage = (content: any): string => {
  if (typeof content === "object" && content.message) {
    return content.message;
  }
  return t("chatItem.generatingImage");
};

// 获取通用错误消息
const getErrorMessage = (content: any): string => {
  if (typeof content === "object" && content.message) {
    return content.message;
  }
  return t("chatItem.unknownError");
};



// 图片容器引用
const mediaContainer = ref<HTMLElement | null>(null);

// 图片宽度状态
const imageWidth = ref("240px"); // 默认宽度与内容组件的图片宽度一致

// 监听图片容器宽度变化
onMounted(() => {
  // 使用nextTick确保DOM已更新
  nextTick(() => {
    updateImageContainerWidth();
  });
});

// 监听props.chat变化，当图片加载完成后更新宽度
watch(
  () => props.chat,
  () => {
    // 延迟执行，确保图片已加载
    setTimeout(() => {
      updateImageContainerWidth();
    }, 100);
  },
  { deep: true }
);


// 更新图片容器宽度的函数
const updateImageContainerWidth = () => {
  if (mediaContainer.value) {
    // 获取图片容器的实际宽度
    const containerWidth = mediaContainer.value.offsetWidth;
    if (containerWidth > 0) {
      imageWidth.value = `${containerWidth}px`;
    }
  }
};




// 相关提取与展示逻辑已移至内容组件

// 解析AI消息内容
// const aiMessageContent = computed<AIMessageContent | null>(() => {
//   if (
//     !props.chat.isSelf &&
//     typeof props.chat.content === "object"
//   ) {
//     return props.chat.content as AIMessageContent;
//   }
//   return null;
// });

// 获取实际要显示的文本
const actualText = computed(() => {
  // 处理流式数据块
  if (
    props.chat.type === MessageType.stream_chunk ||
    props.chat.type === MessageType.text_progress ||
    props.chat.type === MessageType.text_progress_hidden
  ) {
    if (typeof props.chat.content === "object" && props.chat.content.chunk) {
      return props.chat.content.chunk;
    }
  }

  if (
    props.chat.type === MessageType.stream_complete ||
    props.chat.type === MessageType.text_complete
  ) {
    if (
      typeof props.chat.content === "object" &&
      props.chat.content.full_content
    ) {
      return props.chat.content.full_content;
    }
  }

  // 处理AI消息
  if (!props.chat.isSelf) {
    if (typeof props.chat.content === "string") {
      try {
        const parsed = JSON.parse(props.chat.content);
        return parsed.message || props.chat.content;
      } catch {
        return props.chat.content;
      }
    } else if (
      typeof props.chat.content === "object" &&
      props.chat.content?.message
    ) {
      return props.chat.content.message;
    }
  }

  // 使用displayedText如果可用
  if (props.chat.displayedText) {
    return props.chat.displayedText;
  }

  return "";
});

const streamingRawText = computed(() => {
  const typedText =
    displayedText.value ||
    (typeof props.chat.displayedText === "string"
      ? props.chat.displayedText
      : "") ||
    (typeof actualText.value === "string" ? actualText.value : "");

  if (props.chat.isTyping) {
    return typedText;
  }

  return (
    (typeof props.chat.displayedText === "string"
      ? props.chat.displayedText
      : "") ||
    (typeof actualText.value === "string" ? actualText.value : "") ||
    ""
  );
});

const streamingDisplayHtml = computed(() =>
  formatTextWithEmojis(streamingRawText.value, {
    lightenParentheses:
      !props.chat.isSelf && streamingRawText.value.includes("("),
  })
);

const loadingIndicator = computed(() => {
  const indicator = props.chat.loadingIndicator;
  if (indicator === "blobs" || indicator === "default") {
    return indicator;
  }
  const t = props.chat.type;
  if (
    t === MessageType.text_to_image_start ||
    t === MessageType.text_to_image_progress ||
    t === MessageType.text_to_video_start ||
    t === MessageType.text_to_video_progress
  ) {
    return "blobs";
  }
  return "default";
});

// 监听消息变化，处理AI消息的打字效果
watch(
  () => props.chat,
  (newChat) => {
    console.log("ChatItem watch triggered:", {
      type: newChat.type,
      isLoading: newChat.isLoading,
      isTyping: newChat.isTyping,
      hasError: newChat.hasError,
      content: newChat.content,
      displayedText: newChat.displayedText,
      actualText: actualText.value,
    });

    // 只对AI消息使用打字机效果，流式消息直接显示
    if (!newChat.isSelf && !newChat.isLoading && !newChat.hasError) {
      if (actualText.value) {
        if (newChat.isTyping) {
          // 流式传输时，启动打字效果
          console.log(
            "Starting typing for streaming content:",
            actualText.value
          );
          typeTo(actualText.value, {
            speed: 30,
            delay: 0,
            onComplete: () => {
              console.log("Typing completed");
            },
          });
        } else {
          // 非流式或流式完成，直接显示
          console.log("Directly displaying content:", actualText.value);
          displayedText.value = actualText.value;
        }
      }
    }
  },
  { immediate: true, deep: true }
);

// 监听流式数据变化，仅对AI消息使用打字效果
watch(
  () => actualText.value,
  (newText, oldText) => {
    console.log("actualText changed:", {
      newText,
      oldText,
      isTyping: props.chat.isTyping,
      type: props.chat.type,
      isLoading: props.chat.isLoading,
    });

    // 只对AI消息使用打字机效果
    if (
      !props.chat.isSelf &&
      props.chat.isTyping &&
      newText &&
      newText !== oldText
    ) {
      // 流式传输时，每次内容更新都重新启动打字效果
      console.log("Starting typing effect for:", newText);
      typeTo(newText, {
        speed: 30, // 30ms/字符，快速显示
        delay: 0,
        onComplete: () => {
          console.log("Typing completed for:", newText);
          // 只有在流式传输完全结束时才设置isTyping为false
          // 这里不设置，让handleStreamComplete来处理
        },
      });
    }
  }
);


// 组件挂载时检查是否需要启动打字效果（仅用于AI消息）
onMounted(async () => {
  console.log("ChatItem mounted:", {
    type: props.chat.type,
    isLoading: props.chat.isLoading,
    isTyping: props.chat.isTyping,
    hasError: props.chat.hasError,
    content: props.chat.content,
    displayedText: props.chat.displayedText,
    actualText: actualText.value,
  });

  // 只对AI消息使用打字机效果
  if (!props.chat.isSelf && !props.chat.isLoading && !props.chat.hasError) {
    if (props.chat.displayedText && !props.chat.isTyping) {
      displayedText.value = props.chat.displayedText;
    } else if (actualText.value && !props.chat.isTyping) {
      displayedText.value = actualText.value;
    }
  }

});

</script>
<style scoped lang="scss">
.text-right {
  text-align: right;
}

.text-left {
  text-align: left;
}

.max-w-70\% {
  max-width: 70%;
}

// 打字光标动画
.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: #18a058;
  font-weight: bold;
  margin-left: 2px;
}

@keyframes blink {
  0%,
  50% {
    opacity: 1;
  }

  51%,
  100% {
    opacity: 0;
  }
}

// 加载状态样式
.space-x-2 > * + * {
  margin-left: 0.5rem;
}

:deep(.emoji-large) {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5em;
  line-height: 1;
  vertical-align: -0.1em;
}

:deep(.ai-meta) {
  opacity: 0.5;
}
</style>
