<template>
    <div
        class="w-full min-w-0 rounded-lg cursor-pointer overflow-hidden transition-all duration-300 transform  relative aspect-[9/16]">
        <!-- 图片模式 -->
        <CustomImage v-if="!isVideo" lazy :src="actualMediaUrl" :image-array="props.imageArray" object-fit="cover"
            class="w-full h-full cursor-pointer" width="100%" height="100%"
            :alt="t('components.aiResultCard.aiGeneratedImage')" @error="handleMediaError" @load="handleMediaLoad">
            <!-- 图片加载中的占位符 -->
            <template #placeholder>
                <div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div class="flex flex-col items-center space-y-3">
                        <n-spin size="medium" />
                        <span class="text-sm text-gray-500 dark:text-gray-400">
                            {{ t('components.aiResultCard.imageLoading') }}
                        </span>
                    </div>
                </div>
            </template>

            <!-- 图片加载失败的占位符 -->
            <template #error>
                <div class="w-full h-full flex items-center justify-center bg-gray-100 dark:bg-gray-800">
                    <div class="flex flex-col items-center space-y-3">
                        <n-icon size="32" class="text-gray-400">
                            <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path
                                    d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"
                                    fill="currentColor" />
                                <path d="M12 2L10.59 3.41L13.17 6L10.59 8.59L12 10L16 6L12 2Z" fill="currentColor"
                                    opacity="0.6" />
                            </svg>
                        </n-icon>
                        <span class="text-sm text-gray-500 dark:text-gray-400 text-center px-4">
                            {{ t('components.aiResultCard.imageLoadFailed') }}
                        </span>
                        <n-button size="small" text @click="retryLoadMedia">
                            {{ t('components.aiResultCard.retry') }}
                        </n-button>
                    </div>
                </div>
            </template>
        </CustomImage>

        <!-- 生成视频时的覆盖层：仅背景模糊 + 进度信息 -->
        <div v-if="!isVideo && props.videoLoading === true"
            class="generation-overlay absolute inset-0 flex items-center justify-center backdrop-blur-md">
            <div class="generation-overlay__content">
                <BlobsColorCircle :size="26" mode="blobs" :speed="6"
                    :colors="['#E8D5FF', '#C084FC', '#8B5FFF', '#5D4AFF']" :primaryIndex="0" />
                <div class="generation-overlay__text">
                    <div class="generation-overlay__title">{{ t('chatItem.generatingVideo') }}</div>
                    <div v-if="props.videoProgress !== undefined && props.videoProgress !== null"
                        class="generation-overlay__desc">
                        <template v-if="typeof props.videoProgress === 'number'">
                            {{ `${props.videoProgress.toFixed(1)}%` }}
                        </template>
                        <template v-else>
                            {{ props.videoProgress }}
                        </template>
                    </div>
                </div>
            </div>
        </div>

        <!-- 视频模式 -->
        <div v-else class="relative w-full h-full">
            <VideoPlayer :src="mediaLoadError ? null : actualMediaUrl" :loading="isLoadingMedia" :error="mediaLoadError"
                :show-retry="Boolean(props.result?.uu_id)" @retry="retryLoadMedia" @loadeddata="handleMediaLoad"
                @error="handleMediaError" />
        </div>
        <!-- 顶部右侧：视频生成进度（非加载中时才显示，避免与覆盖层重复） -->
        <div v-if="typeof props.videoProgress === 'number' && props.videoProgress < 100 && props.videoLoading !== true"
            class="absolute top-2 right-2 z-10">
            <n-tag size="small" round type="info">{{ `${props.videoProgress.toFixed(1)}%` }}</n-tag>
        </div>
        <div class="z-10 absolute bottom-3 left-1/2 transform -translate-x-1/2 px-4 py-2"
            v-if="canGenerateComputed && props.videoLoading !== true">
            <BabeButton size="small" :loading="false" :disabled="false" @click="handleGenerateVideo">
                {{ t('components.aiResultCard.generateVideo') }}
            </BabeButton>
        </div>
        <!-- 视频生成确认对话框 -->
        <VideoGenerationModal ref="videoModalRef" @confirm="handleVideoConfirm" />
    </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed, h, Fragment, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import { useMessage } from "naive-ui";
import { GenerateResponse } from "@/api/AIGenerator/type";
import { NModal } from "naive-ui";
import type { ImageRenderToolbar } from "naive-ui";
import BabeButton from "@/components/BabeButton/index.vue";
import { getGeneratedImage } from "@/api/chat";
import VideoPlayer from "@/components/VideoPlayer/index.vue";
import BlobsColorCircle from "@/components/BlobsColorCircle/index.vue";
import CustomImage from "@/components/ui/CustomImage.vue";
import VideoGenerationModal from "@/components/VideoGenerationModal/index.vue";
import { useVideoWebSocket } from "@/composables/useVideoWebSocket";
import { MessageType } from "@/utils/websocket";
import { useImageGeneratorModelStore } from "@/stores/imageGenerator/model";

const { t } = useI18n();
const message = useMessage();
const imageModelStore = useImageGeneratorModelStore();

// 视频WebSocket（/api/ws/video）：发送图生视频请求
const {
    initWebSocket: initVideoWebSocket,
    disconnect: disconnectVideoWebSocket,
    isConnected: isVideoWsConnected,
    sendGenerateVideoMessage,
    onEvent,
    removeEventListener,
} = useVideoWebSocket();

const showPreview = ref(false);

const props = defineProps<{
    result: GenerateResponse;
    videoLoading?: boolean;
    canGenerate?: boolean;
    videoProgress?: number | string;
    imageArray?: string[];
}>();
const normalizedFileType = computed(() => (props.result?.file_type ?? "").toString().toLowerCase());
const isVideo = computed(() => normalizedFileType.value === "video");
const canGenerateComputed = computed(() => props.canGenerate !== false && !isVideo.value);

const emit = defineEmits<{
    (e: "generateVideo", data: GenerateResponse): void;
    (e: "videoStart", data: { fileId: string; message?: string }): void;
    (e: "videoProgress", data: { fileId: string; progress?: number; message?: string }): void;
    (e: "videoComplete", data: { fileId: string; success: boolean; error?: string }): void;
}>();

// 视频生成模态框引用
const videoModalRef = ref<InstanceType<typeof VideoGenerationModal> | null>(null);

// 当前活跃的视频生成任务ID
const activeVideoFileId = ref<string | null>(null);

// 处理生成视频按钮点击 - 只打开确认弹窗
const handleGenerateVideo = () => {
    if (props.videoLoading) {
        return;
    }
    // 显示确认对话框
    videoModalRef.value?.show();
};

// 处理视频生成确认 - 点击确认后才建立WebSocket连接并发送请求
const handleVideoConfirm = async () => {
    const fileId = props.result?.uu_id;
    if (!fileId) {
        console.error("无法获取file_id");
        return;
    }

    // 获取当前选中的模型ID作为companion_id
    const companionId = imageModelStore.currentModel?.id;
    if (!companionId) {
        message.error("缺少模型信息，无法生成视频");
        return;
    }

    try {
        // 标记活跃任务，UI进入loading状态
        activeVideoFileId.value = fileId;
        // 通知父组件开始生成（用于更新loading状态）
        emit("videoStart", { fileId });

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

        if (!isVideoWsConnected.value) {
            emit("videoComplete", { fileId, success: false, error: "视频连接未建立" });
            activeVideoFileId.value = null;
            return;
        }

        // 发送视频生成请求
        const ok = sendGenerateVideoMessage(fileId);
        if (!ok) {
            emit("videoComplete", { fileId, success: false, error: "发送请求失败" });
            activeVideoFileId.value = null;
        }
    } catch (e) {
        console.error("发送生成视频请求失败:", e);
        emit("videoComplete", { fileId, success: false, error: "请求异常" });
        activeVideoFileId.value = null;
    }
};

// 监听视频WebSocket事件
const handleVideoWsEvent = (m: any) => {
    const type = (m.type || m.message_type) as string;
    const fileId = activeVideoFileId.value || m.content?.file_id;

    if (!fileId) return;

    // 任务开始
    if (type === MessageType.image_to_video_start) {
        const text = m.content?.message as string | undefined;
        emit("videoStart", { fileId, message: text });
        return;
    }

    // 任务进度
    if (type === MessageType.image_to_video_progress) {
        let progress: number | undefined;
        const text = m.content?.message as string | undefined;
        const rawProgress = m.content?.progress as unknown;
        if (typeof rawProgress === "number") {
            progress = rawProgress;
        } else if (typeof text === 'string') {
            const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
            if (match) progress = parseFloat(match[1]);
        }
        emit("videoProgress", { fileId, progress, message: text });
        return;
    }

    // 任务完成
    if (type === MessageType.image_to_video_complete) {
        const success = m.content?.success !== false;
        emit("videoComplete", { fileId, success });
        activeVideoFileId.value = null;
        // 任务结束，断开WebSocket连接
        disconnectVideoWebSocket();
        return;
    }

    // 任务错误
    if (type === MessageType.image_to_video_error) {
        const errorMessage = m.content?.message || "视频生成失败";
        emit("videoComplete", { fileId, success: false, error: errorMessage });
        activeVideoFileId.value = null;
        // 异常结束，断开WebSocket连接
        disconnectVideoWebSocket();
        return;
    }

    // 配额耗尽
    if (type === MessageType.message_chat_exhausted_error) {
        emit("videoComplete", { fileId, success: false, error: "免费消息配额已用完" });
        activeVideoFileId.value = null;
        // 异常结束，断开WebSocket连接
        disconnectVideoWebSocket();
        return;
    }

    // 余额不足（钻石不足）
    if (type === MessageType.insufficient_balance_error) {
        emit("videoComplete", { fileId, success: false, error: "余额不足" });
        activeVideoFileId.value = null;
        // 异常结束，断开WebSocket连接
        disconnectVideoWebSocket();
        return;
    }

    // 全局错误（兜底）
    if (type === MessageType.error) {
        const errorMessage = m.content?.message || "操作失败，请稍后重试";
        emit("videoComplete", { fileId, success: false, error: errorMessage });
        activeVideoFileId.value = null;
        // 异常结束，断开WebSocket连接
        disconnectVideoWebSocket();
    }
};

const isLoadingMedia = ref(false);
const actualMediaUrl = ref<string>("");
const mediaLoadError = ref(false);
let objectUrl: string | null = null;

const resetVideoState = () => {
    mediaLoadError.value = false;
};

const renderPreviewToolbar: ImageRenderToolbar = ({ nodes }) =>
    h(Fragment, null, [
        nodes.rotateCounterclockwise,
        nodes.rotateClockwise,
        nodes.resizeToOriginalSize,
        nodes.zoomOut,
        nodes.zoomIn,
        nodes.close,
    ]);

const generateMediaUrl = async (filename: string) => {
    if (!filename) return;
    isLoadingMedia.value = true;
    mediaLoadError.value = false;
    actualMediaUrl.value = "";

    try {
        const url = getGeneratedImage(filename);
        actualMediaUrl.value = url;
        resetVideoState();
        if (objectUrl) {
            URL.revokeObjectURL(objectUrl);
            objectUrl = null;
        }
    } catch (error) {
        console.error("生成媒体URL失败:", error);
        mediaLoadError.value = true;
        isLoadingMedia.value = false;
    }
};

const handleMediaLoad = () => {
    mediaLoadError.value = false;
    isLoadingMedia.value = false;
};

const handleMediaError = () => {
    mediaLoadError.value = true;
    isLoadingMedia.value = false;
};

const retryLoadMedia = async () => {
    if (props.result?.uu_id) {
        await generateMediaUrl(props.result.uu_id);
    }
};

watch(
    () => props.result.uu_id,
    async (newValue) => {
        if (!newValue) {
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
                objectUrl = null;
            }
            resetVideoState();
            actualMediaUrl.value = "";
            mediaLoadError.value = false;
            return;
        }
        await generateMediaUrl(newValue);
    },
    { immediate: true }
);

onMounted(() => {
    // 监听视频WebSocket事件
    onEvent(handleVideoWsEvent);
});

onBeforeUnmount(() => {
    if (objectUrl) {
        URL.revokeObjectURL(objectUrl);
        objectUrl = null;
    }
    // 移除WebSocket事件监听
    removeEventListener(handleVideoWsEvent);
    // 如果还有活跃任务，断开连接
    if (activeVideoFileId.value) {
        disconnectVideoWebSocket();
    }
});
</script>

<style scoped>
/* 覆盖层仅背景模糊，容器已有 rounded + overflow-hidden */

.generation-overlay__content {
    display: inline-flex;
    align-items: center;
    gap: 10px;
}

.generation-overlay__text {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
}

.generation-overlay__title {
    font-size: 14px;
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: 0.2px;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.25);
    color: #fff;
}

.generation-overlay__desc {
    font-size: 12px;
    opacity: 0.95;
    margin-top: 2px;
    font-variant-numeric: tabular-nums;
    text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
    color: #fff;
}
</style>
