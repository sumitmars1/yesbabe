<template>
  <div>
    <div class="inline-block media-protected relative p-0 chat-content rounded-lg" :style="{
      borderRadius,
      overflow: 'hidden',
      width: '240px',
      aspectRatio: '9/16',
      background: 'var(--chat-content-background)',
    }">
      <CustomImage ref="imageRef" :src="processedContent"
        :class="{
          'blur': hidden,
          'opacity-100': imageLoaded,
          'opacity-0': !imageLoaded,
          'blur-2xl scale-105': !hidden && !imageLoaded,
          'blur-0 scale-100': !hidden && imageLoaded,
        }" width="240px"
        class="aspect-[9/16] transition-all duration-700 ease-in-out" @contextmenu.prevent @dragstart.prevent
        @selectstart.prevent @error="handleImageError" @load="handleImageLoad">
        <template #placeholder>
          <div class="w-[240px] aspect-[9/16] bg-gray-100 dark:bg-gray-800 rounded-lg" />
        </template>
      </CustomImage>

      <!-- 加载状态层 (Spinner Layer) -->
      <!-- <div v-if="!imageLoaded"
        class="absolute inset-0 z-[20] flex flex-col items-center justify-center pointer-events-none">
        <div class="flex flex-col items-center space-y-3">
          <n-spin size="medium" />
          <span class="text-sm text-gray-500 dark:text-gray-400 bg-white/50 dark:bg-black/50 px-2 py-1 rounded">{{
            t("components.aiResultCard.imageLoading")
          }}</span>
        </div>
      </div> -->

      <!-- 生成视频覆盖层：仅当 videoLoadingMap/Progress 指示时显示 -->
      <div v-if="isVideoGenerating" class="generation-overlay backdrop-blur-md" :style="{ borderRadius }">
        <div class="generation-overlay__content">
          <BlobsColorCircle class="flex-shrink-0" :size="26" mode="blobs" :speed="6" :colors="['#E8D5FF', '#C084FC', '#8B5FFF', '#5D4AFF']"
            :primaryIndex="0" />
          <div class="generation-overlay__text">
            <div class="generation-overlay__title">
              {{ t("chatItem.generatingVideo") }}
            </div>
            <div class="generation-overlay__desc">
              {{ currentVideoProgressMessage || t("chatItem.waitingInQueue")}}
            </div>
          </div>
        </div>
      </div>

      <!-- 付费遮罩 -->
      <div v-if="hidden"
        class="absolute inset-0 z-[1000] flex flex-col items-center justify-center p-5 text-center text-white">
        <div class="flex flex-col items-center gap-4">
          <div class="text-sm font-semibold">
            {{ t("chatItem.maskedImagePlaceholder") }}
          </div>
          <div class="flex items-center justify-center">
            <svg-icon iconClass="lock" :size="20" />
          </div>
          <BabeButton type="primary" size="large" @click="handleUpgradeClick"
            class="min-w-[120px] h-10 font-semibold rounded-20">
            <svg-icon iconClass="Huangguan" :size="16" class="mr-1" />
            {{ t("chatItem.openPro") }}
          </BabeButton>
        </div>
      </div>
    </div>

    <!-- 生成视频按钮（在消息下方） -->
    <div v-if="
      showGenerateVideoButton ||
      (currentFileId && props.videoLoadingMap?.[currentFileId])
    " class="flex mt-1 mb-2 text-xs" :class="isSelf ? 'justify-end' : 'justify-start'">
      <div class="text-primary opacity-60 flex items-center duration-300" :class="isVideoGenerating
        ? 'cursor-not-allowed'
        : 'cursor-pointer hover:opacity-100'
        " @click="handleGenerateVideo">
        <svg-icon iconClass="Video" size="14" class="cursor-pointer transition-transform mr-1 hover:scale-110" />
        <span>{{ t("chatItem.createAIVideo") }}</span>
      </div>
    </div>

    <!-- 视频生成确认对话框 -->
    <VideoGenerationModal ref="videoModalRef" @confirm="handleVideoConfirm" />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, nextTick, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useMessage, NModal } from "naive-ui";
import { getGeneratedImage } from "@/api/chat";
import { useMediaProtection } from "@/utils/mediaProtection";
import BlobsColorCircle from "@/components/BlobsColorCircle/index.vue";
import { showSubscriptionModal } from "@/utils/subscriptionModal";
import VideoGenerationModal from "@/components/VideoGenerationModal/index.vue";
import { MessageType } from "@/utils/websocket";
import { useVideoWebSocket } from "@/composables/useVideoWebSocket";
import { useChatStore } from "@/stores/chat";
import { useWebSocket } from "@/composables/useWebSocket";
import CustomImage from "@/components/ui/CustomImage.vue";

const props = defineProps<{
  content: any;
  messageType: string;
  isSelf: boolean;
  hidden?: boolean;
  videoLoadingMap?: Record<string, boolean>;
  videoDoneMap?: Record<string, boolean>;
  videoProgressMap?: Record<string, string | number>;
}>();

const emit = defineEmits<{
  generateVideo: [fileId: string];
}>();

const { t } = useI18n();
const message = useMessage();
const chatStore = useChatStore();
const { addMessage } = useWebSocket();

// 视频WebSocket（/api/ws/video）：与result.vue保持一致
const {
  initWebSocket: initVideoWebSocket,
  disconnect: disconnectVideoWebSocket,
  isConnected: isVideoWsConnected,
  sendGenerateVideoMessage: sendVideoMessage,
  onEvent: onVideoEvent,
  removeEventListener: removeVideoEvent,
} = useVideoWebSocket();

const showPreview = ref(false);
const imageRef = ref<any>(null);
const { protectElement } = useMediaProtection();
const imageLoadError = ref(false);
const imageLoaded = ref(false);
const actualMediaUrl = ref<string>("");
const processedContent = ref<string>("");

const borderRadius = computed(() =>
  props.isSelf ? "16px 0px 16px 16px" : "0px 16px 16px 16px"
);
const hidden = computed(() => !!props.hidden);

const currentFileId = computed(() => {
  const v = props.content as any;
  if (typeof v === "string" && v.startsWith("generate_image:"))
    return v.replace("generate_image:", "");
  if (v && typeof v === "object")
    return v.file_id || v.id || v.image_url || null;
  return null;
});

const currentVideoProgressMessage = computed(() => {
  const fid = currentFileId.value;
  if (!fid) return "";
  const progressEntry = props.videoProgressMap
    ? props.videoProgressMap[fid]
    : undefined;
  if (progressEntry === undefined || progressEntry === null) return "";
  return String(progressEntry);
});

const isVideoGenerating = computed(() => {
  const fid = currentFileId.value;
  if (!fid) return false;
  if (props.videoDoneMap && props.videoDoneMap[fid] === true) return false;
  if (props.videoLoadingMap && props.videoLoadingMap[fid] === true) return true;
  const p = props.videoProgressMap ? props.videoProgressMap[fid] : undefined;
  if (typeof p === "string") return p.trim().length > 0;
  return typeof p === "number" && p > 0 && p < 100;
});

// 视频生成模态框引用
const videoModalRef = ref<InstanceType<typeof VideoGenerationModal> | null>(
  null
);

// 判断是否显示生成视频按钮
const showGenerateVideoButton = computed(() => {
  // 检查类型是否为图像生成完成
  const isImageGenerationComplete =
    props.messageType === MessageType.text_to_image_complete ||
    props.messageType === MessageType.image_generation_complete;

  // 只要是图片内容就显示按钮（允许重新生成视频）
  return isImageGenerationComplete;
});

// 处理生成视频按钮点击
const handleGenerateVideo = () => {
  if (isVideoGenerating.value) {
    return;
  }
  // 显示确认对话框
  videoModalRef.value?.show();
};

// 处理视频生成确认 - 与result.vue保持一致的流程
const handleVideoConfirm = async () => {
  const fileId = currentFileId.value;

  if (isVideoGenerating.value) {
    message.warning("视频生成中，请稍后");
    return;
  }

  if (!fileId) {
    console.error("无法提取file_id", {
      content: props.content,
      type: props.messageType,
    });
    return;
  }

  try {
    // 先发出加载事件，确保 UI 立即进入 loading
    if (props.videoLoadingMap) {
      props.videoLoadingMap[fileId] = true;
    }
    if (props.videoDoneMap) {
      props.videoDoneMap[fileId] = false;
    }

    // 获取当前 companionId 并初始化 WebSocket 连接
    const companionId = chatStore.currentChat?.companion_id;
    if (!companionId) {
      console.warn("缺少 companion_id，无法建立视频WebSocket连接");
      if (props.videoLoadingMap) {
        props.videoLoadingMap[fileId] = false;
      }
      message.error("视频生成失败：缺少必要参数");
      return;
    }

    // 如果未连接，先建立连接
    if (!isVideoWsConnected.value) {
      await initVideoWebSocket(companionId);
      // 等待连接建立（给一点时间让连接完成）
      let waitCount = 0;
      while (!isVideoWsConnected.value && waitCount < 50) {
        await new Promise(resolve => setTimeout(resolve, 100));
        waitCount++;
      }
    }

    // 发送视频生成请求
    const ok = sendVideoMessage(fileId);
    if (!ok) {
      // 发送失败，回滚 loading 状态
      if (props.videoLoadingMap) {
        props.videoLoadingMap[fileId] = false;
      }
      message.error("视频生成失败");
    }
  } catch (e) {
    // 异常也回滚 loading 状态
    if (props.videoLoadingMap) {
      props.videoLoadingMap[fileId] = false;
    }
    message.error("视频生成失败");
  }
};

// 处理图生视频的 WebSocket 事件（/api/ws/video）
const handleVideoWsEvent = (m: any) => {
  // 文档约定：正常消息使用 type，错误消息可能使用 message_type
  const type = (m.type || m.message_type) as string;
  const incomingFileId = m.content?.file_id as string | undefined;

  // 有的后端实现（参见文档示例）在 start/progress 阶段可能不返回 file_id
  // 因此这里的匹配规则：
  // - 如果消息携带 file_id，则必须与当前图片的 file_id 匹配
  // - 如果未携带 file_id，则在当前条目处于"正在生成中"时也认为是当前任务的事件
  const matchesCurrent = incomingFileId
    ? incomingFileId === currentFileId.value
    : isVideoGenerating.value && !!currentFileId.value;
  if (!matchesCurrent) return;

  // 任务开始：展示服务端返回的提示文案（content.message）
  if (type === "image_to_video_start") {
    const text =m.content?.message as string;
    const fid = incomingFileId || currentFileId.value;
    if (fid && props.videoLoadingMap) props.videoLoadingMap[fid] = true;
    if (fid && props.videoDoneMap) props.videoDoneMap[fid] = false;
    if (fid && props.videoProgressMap) props.videoProgressMap[fid] = text;
    return;
  }

  // 任务进度：实时展示服务端的 message 文案
  if (type === "image_to_video_progress") {
    const text = m.content?.message;
    const fid = incomingFileId || currentFileId.value;
    if (fid && props.videoLoadingMap) props.videoLoadingMap[fid] = true;
    if (fid && props.videoDoneMap) props.videoDoneMap[fid] = false;
    if (fid && props.videoProgressMap && text) props.videoProgressMap[fid] = text;
    return;
  }

  // 任务完成：将视频作为新消息添加到聊天中
  if (type === "image_to_video_complete") {
    const success = m.content?.success !== false;
    const fid = incomingFileId || currentFileId.value;
    if (fid && props.videoLoadingMap) props.videoLoadingMap[fid] = false;
    if (fid && props.videoDoneMap && success) props.videoDoneMap[fid] = true;
    if (fid && props.videoProgressMap) props.videoProgressMap[fid] = "";

    // 任务结束，断开WebSocket连接
    disconnectVideoWebSocket();

    if (success) {
      const videoUrl = m.content?.video_url;
      if (videoUrl) {
        // 创建新的视频消息
        const newVideoMessage = {
          id: m.content?.message_id || `video_${Date.now()}`,
          type: MessageType.image_to_video_complete,
          content: {
            ...m.content,
            file_id: m.content.file_id || fid,
            video_url: videoUrl,
            file_type: m.content.file_type || "VIDEO",
          },
          isSelf: false,
          time: new Date().toISOString(),
          isLoading: false,
          isTyping: false,
          hasError: false,
        };

        // 添加新消息到聊天列表
        addMessage(newVideoMessage);
      }
    } else {
      if (fid && props.videoDoneMap) props.videoDoneMap[fid] = false;
      message.error(m.content?.message || "视频生成失败");
    }
    return;
  }

  // 配额耗尽：告知用户并恢复按钮/加载状态
  if (type === MessageType.message_chat_exhausted_error) {
    const fid = incomingFileId || currentFileId.value;
    if (fid && props.videoLoadingMap) props.videoLoadingMap[fid] = false;
    if (fid && props.videoDoneMap) props.videoDoneMap[fid] = false;
    if (fid && props.videoProgressMap) props.videoProgressMap[fid] = "";
    // 异常结束，断开WebSocket连接
    disconnectVideoWebSocket();
    message.error((m.content?.message as string) || "免费消息配额已用完");
    return;
  }

  // 任务错误：恢复初始状态并提示失败
  if (type === "image_to_video_error") {
    console.error("视频生成错误:", m.content);
    const fid = incomingFileId || currentFileId.value;
    if (fid && props.videoLoadingMap) props.videoLoadingMap[fid] = false;
    if (fid && props.videoDoneMap) props.videoDoneMap[fid] = false;
    if (fid && props.videoProgressMap) props.videoProgressMap[fid] = "";
    // 异常结束，断开WebSocket连接
    disconnectVideoWebSocket();
    const errorMessage = m.content?.message || "视频生成失败";
    message.error(errorMessage);
    return;
  }

  // 全局错误（兜底）
  if (type === "error") {
    console.error("全局错误:", m.content);
    const fid = incomingFileId || currentFileId.value;
    if (fid && props.videoLoadingMap) props.videoLoadingMap[fid] = false;
    if (fid && props.videoDoneMap) props.videoDoneMap[fid] = false;
    if (fid && props.videoProgressMap) props.videoProgressMap[fid] = "";
    // 异常结束，断开WebSocket连接
    disconnectVideoWebSocket();
    const errorMessage = m.content?.message || "操作失败，请稍后重试";
    message.error(errorMessage);
  }
};

const extractImageRaw = (content: any, messageType: string): string => {
  const t = String(messageType || "").toLowerCase();
  if (t === "text_to_image_complete" || t === "image_generation_complete") {
    // 如果image_url已经是完整URL（http(s)://或/s/开头），直接返回
    if (content?.image_url) {
      const url = content.image_url;
      if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/s/")
      ) {
        return url;
      }
      // 否则使用旧格式（generate_image:前缀）
      return `generate_image:${url}`;
    }
    return content?.message || "";
  }
  if (t === "image_hidden" || t === "message_image_hidden") {
    const url =
      content?.image_url ??
      content?.url ??
      content?.file_id ??
      content?.content;
    if (typeof url === "string" && url.length > 0) {
      // 如果已经是完整URL，直接返回
      if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/s/")
      ) {
        return url;
      }
      return url.startsWith("generate_image:") ? url : `generate_image:${url}`;
    }
    return "";
  }
  // generic
  if (typeof content === "string") return content;
  if (typeof content === "object" && content)
    return content.image_url || content.url || content.message || "";
  return "";
};

const processMediaLink = async (
  filename: string,
  messageType?: string
): Promise<string> => {
  // 如枟已经是完整URL（http(s)://或/s/开头），直接返回
  if (
    filename.startsWith("http://") ||
    filename.startsWith("https://") ||
    filename.startsWith("/s/")
  ) {
    return filename;
  }

  // 处理旧格式：generate_image:前缀
  if (filename.startsWith("generate_image:")) {
    const actual = filename.split(":")[1] || "";
    try {
      const url = getGeneratedImage(actual);
      actualMediaUrl.value = url;
      return url;
    } catch (e) {
      console.error("生成图片URL失败", e);
      return "图片生成失败";
    }
  }
  return filename;
};

const updateProcessed = async () => {
  const raw = extractImageRaw(props.content, props.messageType);
  if (!raw) {
    processedContent.value = "";
    return;
  }
  processedContent.value = await processMediaLink(raw, props.messageType);
};

watch(() => [props.content, props.messageType], () => {
  imageLoaded.value = false;
  updateProcessed();
}, {
  immediate: true,
  deep: true,
});
watch(actualMediaUrl, (u) => {
  if (u) processedContent.value = u;
});

const handleImageLoad = async () => {
  imageLoadError.value = false;
  imageLoaded.value = true;

  await nextTick();
  const el = (imageRef.value as any)?.$el || imageRef.value; // n-image wrapper handling
  if (el) protectElement(el);
};
const handleImageError = () => {
  imageLoadError.value = true;
};

const handleUpgradeClick = () => {
  try {
    showSubscriptionModal("inline");
  } catch (e) { }
};

onMounted(() => {
  if (imageRef.value) {
    const el = (imageRef.value as any)?.$el || imageRef.value;
    if (el) protectElement(el);
  }

  // 监听视频WebSocket事件
  onVideoEvent(handleVideoWsEvent);
});

onBeforeUnmount(() => {
  removeVideoEvent(handleVideoWsEvent);
});
</script>

<style scoped>
.generation-overlay {
  position: absolute;
  inset: 0;
  z-index: 1000;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 12px;
  text-align: center;
  background: transparent;
  color: white;
}

.generation-overlay__content {
  display: inline-flex;
  align-items: center;
  gap: 10px;
  padding: 0;
}

.generation-overlay__title {
  font-size: 14px;
  font-weight: 600;
  line-height: 1.2;
  letter-spacing: 0.2px;
  color: white;
  /* text-shadow: 0 1px 2px rgba(255, 255, 255, 0.8); */
}

.generation-overlay__desc {
  font-size: 12px;
  opacity: 0.95;
  margin-top: 2px;
  font-variant-numeric: tabular-nums;
  color: white;
  /* text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2); */
}
</style>
