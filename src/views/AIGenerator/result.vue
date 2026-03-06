<template>
    <div class="text-primary page-padding bg-background min-h-screen">
        <!-- 生成进度显示 -->
        <div class="mb-firstMargin" v-if="isGenerating || currentSession || displayResults.length > 0">
            <div class="mb-secondMargin">
                <div class="text-lg font-semibold mb-thirdMargin flex items-center">
                    <n-spin v-if="isGenerating" size="small" class="mr-2" />
                    {{ generationStatus }}
                </div>
                <div class="text-sm" v-if="isGenerating">
                    {{ t("generator.result.generatingMessage") }}
                </div>
                <div class="text-sm" v-else-if="currentSession?.status === 'completed'">
                    {{ t("generator.result.allImagesCompleted") }}
                </div>
                <div class="text-sm" v-else-if="currentSession?.status === 'failed'">
                    {{ t("generator.result.generationFailedMessage") }}
                </div>
                <div class="text-sm" v-else>
                    {{ t("generator.result.findYourImages") }}
                </div>
                <!-- <div>
                    {{ currentProgressMessage }}
                </div> -->
            </div>
            <!-- 错误提示 -->
            <transition name="fade">
                <div v-if="showError" class="mb-4">
                    <n-alert type="error" :show-icon="true" closable @close="showError = false">
                        <template #header>
                            {{ t("generator.result.generationFailed") }}
                        </template>
                        <div class="flex justify-between items-center">
                            <span>{{ errorMessage }}</span>
                            <n-button size="small" type="error" @click="handleRetryGeneration" class="ml-2">
                                {{ t("generator.result.retry") }}
                            </n-button>
                        </div>
                    </n-alert>
                </div>
            </transition>
            <!-- 增强的进度条 -->
            <div class="mb-4" v-if="showProgressBar">
                <!-- <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600">
                        {{ t("generator.result.completedCount", {
                            completed: currentProgress.completed, total:
                                currentProgress.total
                        }) }}
                    </span>
                    <span class="text-sm text-gray-600"
                        v-if="remainingCount > 0 && currentSession?.status !== 'completed'">
                        {{ t("generator.result.remainingCount", { remaining: remainingCount }) }}
                    </span>
                    <span class="text-sm text-gray-600" v-else-if="currentSession?.status === 'completed'">
                        {{ t("generator.result.allCompleted") }}
                    </span>
                </div> -->
                <n-progress type="line" :percentage="extractedProgressPercentage" indicator-placement="inside"
                    :processing="true" status="info" :show-indicator="true" class="progress-bar-enhanced" />
            </div>
        </div>
        <!-- 结果展示区域 -->
        <div v-if="isLoadingHistory || hasDisplayResults" class="mb-6" ref="resultsContainer">
            <transition name="fade" mode="out-in">
                <!-- 加载状态 -->
                <div v-if="isLoadingHistory" key="history-loading"
                    class="flex justify-center items-center py-12 text-gray-500">
                    <n-spin size="large" />
                    <span class="ml-3">{{ t("generator.result.loading") }}</span>
                </div>

                <!-- 图片网格 -->
                <div v-else key="history-results"
                    class="grid grid-cols-2 sm:grid-cols-[repeat(auto-fill,minmax(220px,1fr))] gap-3 mb-6">
                    <!-- 显示当前会话的结果和历史结果 -->
                    <AIResultCard v-for="(result, index) in displayResults" :key="`result-${result.id || index}`"
                        :result="result" :index="index" :video-loading="Boolean(props.videoLoadingMap?.[result.uu_id])"
                        :can-generate="canGenerateVideoForResult(result)"
                        :video-progress="props.videoProgressMap?.[result.uu_id]" :image-array="allImageUrls"
                        @generateVideo="onGenerateVideo" @videoStart="onVideoStartFromCard"
                        @videoProgress="onVideoProgressFromCard" @videoComplete="onVideoCompleteFromCard" />
                </div>
            </transition>

            <!-- 分页组件 -->
            <div v-if="!isLoadingHistory && totalCount > pageSize" class="flex justify-center">
                <n-pagination v-model:page="currentPage" :page-size="pageSize"
                    :page-count="Math.ceil(totalCount / pageSize)" show-quick-jumper @update:page="handlePageChange">
                    <template #prefix="{ itemCount }">
                        {{ t("generator.result.pagination.totalImages", { total: totalCount }) }}
                    </template>
                </n-pagination>
            </div>
        </div>

        <!-- 空状态 -->
        <div v-else-if="showEmptyState" class="flex flex-col items-center justify-center h-96 max-w-md mx-auto">
            <!-- <svg-icon iconClass="photo" :size="64" class="text-primary opacity-50 mb-6" /> -->
            <p class="text-primary text-lg font-medium mb-2">
                {{ t("infinityScroll.noData") }}
            </p>
        </div>
    </div>
</template>

<script setup lang="ts">
import { computed, onMounted, onBeforeUnmount, ref, watch, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { NProgress, NButton, NSpin, NAlert, NPagination } from "naive-ui";
import { createDiscreteApi } from "naive-ui";
import AIResultCard from "@/components/AIResultCard/index.vue";
import { useImageGeneratorStore } from "@/stores/imageGenerator";
// 暂时注释掉自动恢复功能
// import { resumeImageGeneration, hasUnfinishedGeneration } from "./index";
import { GenerateResponse } from "@/api/AIGenerator/type";
import { getGeneratedImage } from "@/api/chat";
const emit = defineEmits<{
    (e: 'request-generate-video', payload: { fileId: string; result: GenerateResponse }): void;
    (e: 'refresh-history'): void;
    (e: 'video-generate-start', payload: { fileId: string; message?: string }): void;
    (e: 'video-generate-progress', payload: { fileId: string; progress?: number; message?: string }): void;
    (e: 'video-generate-complete', payload: { fileId: string; success: boolean; error?: string }): void;
}>();

// 对外暴露刷新历史数据的方法
defineExpose({
    refreshHistory: () => handleGetImageHistory(1, pageSize.value)
});

// 创建全局消息API
const { message } = createDiscreteApi(['message']);
const { t } = useI18n();
const imageGeneratorStore = useImageGeneratorStore();

interface GenerationResult {
    image: string;
    description: string;
}

const props = defineProps<{
    results?: GenerationResult[];
    videoLoadingMap?: Record<string, boolean>;
    videoDoneMap?: Record<string, boolean>;
    videoProgressMap?: Record<string, number | string>;
}>();

const normalizeFileType = (value?: string | null) => {
    if (!value) return "";
    return String(value).toLowerCase();
};

const normalizeIdentifier = (value: unknown) => {
    if (value === null || typeof value === "undefined") return null;
    return String(value);
};

// 从store获取生成状态
const isGenerating = computed(() => imageGeneratorStore.isGenerating);
const progress = computed(() => imageGeneratorStore.progress);
const remainingCount = computed(() => imageGeneratorStore.remainingCount);
// const completedResults = computed(() => imageGeneratorStore.completedResults);
const currentSession = computed(() => imageGeneratorStore.currentSession);

// 错误处理状态
const errorMessage = ref<string>("");
const showError = ref<boolean>(false);

// 分页状态
const currentPage = ref<number>(1);
const pageSize = ref<number>(10); // 每页显示10张图片
const totalCount = ref<number>(0);
const isLoadingHistory = ref<boolean>(false);
const resultsContainer = ref<HTMLElement | null>(null);

const historyItems = ref<GenerateResponse[]>([]);

// 进度条显示控制
const showProgressBar = computed(() => {
    // 只有在真正生成中时才显示进度条
    if (!currentSession.value) return false;

    // 只在状态为 running 时显示进度条
    // completed 或 failed 状态都不再显示，避免loading状态不消失
    return currentSession.value.status === 'running';
});

// 计算进度百分比（带动画效果）
const progressPercentage = computed(() => {
    if (!currentSession.value) return 0;
    const { completedCount, totalCount } = currentSession.value;
    return totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
});

// 生成状态描述
const generationStatus = computed(() => {
    if (!currentSession.value) return t("generator.generationResults");
    switch (currentSession.value.status) {
        case 'running':
            return t("generator.result.generating");
        case 'completed':
            return t("generator.result.completed");
        case 'failed':
            return t("generator.result.failed");
        case 'idle':
            return t("generator.result.preparing");
        default:
            return t("generator.generationResults"); // 使用存在的翻译key
    }
});

// 计算当前进度显示
const currentProgress = computed(() => {
    if (!currentSession.value) return { completed: 0, total: 0 };
    const { completedCount, totalCount, tasks } = currentSession.value;
    // 计算正在处理中的任务数量
    const processingCount = tasks.filter(task => task.status === 'processing').length;
    // 显示的“已完成”数量应该包括真正完成的和正在处理的
    const displayCompleted = completedCount + processingCount;
    return { completed: displayCompleted, total: totalCount };
});

// 统一显示结果：只使用历史数据，不再手动插入当前会话结果
const displayResults = computed(() => {
    // 直接返回历史结果，避免重复显示
    return historyItems.value;
});

const allImageUrls = computed(() => {
    return displayResults.value
        .filter(item => normalizeFileType(item.file_type) !== 'video')
        .map(item => item.uu_id ? getGeneratedImage(item.uu_id) : '')
        .filter(url => !!url);
});

const hasDisplayResults = computed(() => displayResults.value.length > 0);
const showEmptyState = computed(() => {
    if (isLoadingHistory.value) return false;
    if (isGenerating.value) return false;
    if (currentSession.value) return false;
    return !hasDisplayResults.value;
});

const videoLinkedImageKeys = computed(() => {
    const relatedKeys = new Set<string>();

    displayResults.value.forEach((item) => {
        if (normalizeFileType(item.file_type) === "video") {
            const linked = normalizeIdentifier(item.image_id);
            if (linked) {
                relatedKeys.add(linked);
            }
        }
    });

    return relatedKeys;
});

const hasRelatedVideo = (result: GenerateResponse) => {
    if (!result) return false;
    if (normalizeFileType(result.file_type) === "video") return true;

    const identifiers: string[] = [];
    const uuId = normalizeIdentifier(result.uu_id);
    const id = normalizeIdentifier(result.id);
    const imageId = normalizeIdentifier(result.image_id);

    if (uuId) identifiers.push(uuId);
    if (id) identifiers.push(id);
    if (imageId) identifiers.push(imageId);

    return identifiers.some((identifier) => videoLinkedImageKeys.value.has(identifier));
};

const canGenerateVideoForResult = (result: GenerateResponse) => {
    if (!result) return false;
    // 允许图片无限次生成视频，移除相关限制
    // 移除 hasRelatedVideo 的检查
    // 移除 videoDoneMap 的检查
    if ((result as any).can_generate_video === false) return false;
    return true;
};

// 获取当前进度消息，直接显示后端返回的内容，不做任何处理
const currentProgressMessage = computed(() => {
    if (!currentSession.value) return '';

    // 直接返回后端存储的进度消息
    return currentSession.value.currentProgressMessage || '';
});

// 提取进度百分数的计算属性（优先使用后端推送的实时进度）
const extractedProgressPercentage = computed(() => {
    // 优先使用后端推送的实时进度百分比
    if (currentSession.value?.currentProgressPercentage !== undefined &&
        currentSession.value.currentProgressPercentage !== null) {
        const backendProgress = currentSession.value.currentProgressPercentage;
        console.log('✅ 使用后端推送的实时进度:', backendProgress + '%');
        // 确保在 0-100 范围内
        return Math.min(Math.max(backendProgress, 0), 100);
    }

    // 降级方案：基于完成数量计算进度
    if (currentSession.value && currentSession.value.totalCount > 0) {
        const { completedCount, failedCount, totalCount, status } = currentSession.value;
        const processedCount = completedCount + failedCount;
        const progress = Math.round((processedCount / totalCount) * 100);

        console.log('⚠️ 使用降级方案计算进度:', {
            completedCount,
            failedCount,
            totalCount,
            processedCount,
            progress: progress + '%',
            status
        });

        // 如果进度为100%但状态还不是completed，显示95%避免进度条满了但还在loading
        if (progress === 100 && status === 'running') {
            console.log('⚠️ 进度100%但还在运行中，显示95%');
            return 95;
        }
        return progress;
    }

    console.log('⚠️ 无进度数据，返回0');
    return 0;
});

// 暂时注释掉恢复功能
// const hasUnfinished = computed(() => hasUnfinishedGeneration());

// const handleResumeGeneration = async () => {
//   try {
//     const resumed = await resumeImageGeneration();
//     if (resumed) {
//       console.log('手动恢复生成成功');
//     }
//   } catch (error) {
//     console.error('手动恢复生成失败:', error);
//   }
// };

// 处理生成视频事件
const handleGenerateVideo = (index: number, data: GenerationResult) => {
    console.log('生成视频:', index, data);
    // 这里可以添加生成视频的逻辑
};

// 接收子项触发的视频生成请求
// 注意：AIResultCard 现在自己处理视频生成逻辑，这里只需要更新UI状态
const onGenerateVideo = (result: GenerateResponse) => {
    // 不再转发到父组件，避免重复弹窗
    // AIResultCard 会在 handleVideoConfirm 中自行处理
    console.log('AIResultCard 开始生成视频:', result.uu_id);
};

// 处理AIResultCard的视频生成开始事件
const onVideoStartFromCard = ({ fileId, message }: { fileId: string; message?: string }) => {
    // 向上抛出给父组件，保持与原有逻辑一致
    // 使用 emit 名称与 generator.vue 中 emit 的名称一致
    // 由父组件 index.vue 处理
    emit('video-generate-start', { fileId, message });
};

// 处理AIResultCard的视频生成进度事件
const onVideoProgressFromCard = ({ fileId, progress, message }: { fileId: string; progress?: number; message?: string }) => {
    // 向上抛出给父组件
    emit('video-generate-progress', { fileId, progress, message });
};

// 处理AIResultCard的视频生成完成事件
const onVideoCompleteFromCard = ({ fileId, success, error }: { fileId: string; success: boolean; error?: string }) => {
    // 向上抛出给父组件
    emit('video-generate-complete', { fileId, success, error });
};

// 错误处理和重试功能
const handleRetryGeneration = async () => {
    try {
        showError.value = false;
        errorMessage.value = "";

        const retried = await imageGeneratorStore.retryLastGeneration();
        if (retried) {
            message.success(t("generator.result.restartGeneration"));
        } else {
            message.warning(t("generator.result.noRetriableTask"));
        }
    } catch (error) {
        console.error("重试生成失败:", error);
    }
};

// 监听生成状态变化，处理错误提示
watch(
    () => currentSession.value?.status,
    (newStatus, oldStatus) => {
        if (newStatus === 'failed' && oldStatus !== 'failed') {
            showError.value = true;
            // 尝试获取后端返回的原始错误信息
            const task = currentSession.value?.tasks[0];
            const backendError = task?.error;
            errorMessage.value = backendError || t('generator.result.imageGenerationFailed');
            message.error(errorMessage.value);
        } else if (newStatus === 'completed' && oldStatus === 'running') {
            showError.value = false;
            errorMessage.value = '';
            message.success(t('generator.result.imageGenerationCompleted'));
        } else if (newStatus === 'running') {
            showError.value = false;
            errorMessage.value = '';
        }
    },
    { immediate: true }
);

// 监听WebSocket连接状态
watch(
    () => imageGeneratorStore.isWebSocketConnected,
    (connected) => {
        if (!connected && isGenerating.value) {
            showError.value = true;
            errorMessage.value = t('generator.result.networkDisconnectedDesc');
            message.error(t('generator.result.networkDisconnected'));
        }
    }
);

import { getImageHistory } from "@/api/AIGenerator";
const extractTotalCount = (payload: any, fetched: number, page: number, size: number) => {
    if (payload && typeof payload === "object") {
        if (typeof payload.total === "number") return payload.total;
        if (typeof payload.totalCount === "number") return payload.totalCount;
        if (typeof payload.total_count === "number") return payload.total_count;
        if (typeof payload.count === "number") return payload.count;
        if (typeof payload.item_count === "number") return payload.item_count;
    }
    if (page === 1 && fetched < size) {
        return fetched;
    }
    const estimate = Math.max(totalCount.value, (page - 1) * size + fetched);
    return estimate;
};
const isCanceledRequest = (error: unknown): boolean => {
    if (!error || typeof error !== "object") return false;
    const err = error as { code?: string; name?: string; message?: string };
    if (err.code === "ERR_CANCELED") return true;
    if (err.name === "CanceledError" || err.name === "AbortError") return true;
    if (typeof err.message === "string" && err.message.toLowerCase() === "canceled") {
        return true;
    }
    return false;
};
const handleGetImageHistory = async (
    page: number = currentPage.value,
    size: number = pageSize.value
) => {
    currentPage.value = page;
    isLoadingHistory.value = true;
    try {
        const res = await getImageHistory({ size, page });
        const responseData = res.data as any;
        const rawItems: GenerateResponse[] = Array.isArray(responseData)
            ? responseData
            : Array.isArray(responseData?.items)
                ? responseData.items
                : [];

        const computedTotal = extractTotalCount(responseData, rawItems.length, page, size);
        totalCount.value = computedTotal;

        historyItems.value = rawItems;
        return rawItems;
    } catch (error) {
        if (isCanceledRequest(error)) {
            console.debug(t('generator.result.requestCanceled'));
            return historyItems.value;
        }
        console.error("获取图片历史失败:", error);
        message.error(t('generator.result.fetchHistoryFailed'));
        throw error;
    } finally {
        isLoadingHistory.value = false;
    }
};

// 2s 节流刷新历史：避免一次生成多张时收到多次 complete 事件导致频繁请求
// 方案：监听会话完成/失败计数变化与状态，2s 内合并为一次刷新；当全部完成或失败时做一次最终刷新
const historyRefreshTimer = ref<number | null>(null);
const isHistoryRefreshing = ref(false);

const scheduleHistoryRefresh = (immediate = false) => {
    // 防止并发刷新
    if (isHistoryRefreshing.value && !immediate) {
        return;
    }

    // 若要求立即刷新（如检测到全部完成），清理定时器后直接请求
    if (immediate) {
        if (historyRefreshTimer.value) {
            clearTimeout(historyRefreshTimer.value);
            historyRefreshTimer.value = null;
        }
        void refreshHistoryAfterGeneration();
        return;
    }

    // 已有定时器则复用，2s 内只触发一次
    if (historyRefreshTimer.value) return;
    historyRefreshTimer.value = window.setTimeout(() => {
        historyRefreshTimer.value = null;
        void refreshHistoryAfterGeneration();
    }, 2000);
};

const refreshHistoryAfterGeneration = async () => {
    // 防止并发刷新
    if (isHistoryRefreshing.value) {
        return;
    }

    isHistoryRefreshing.value = true;
    try {
        await handleGetImageHistory(1, pageSize.value);
    } catch (error) {
        console.error(t('generator.result.refreshHistoryFailed'), error);
    } finally {
        isHistoryRefreshing.value = false;
    }
};

// 监听完成/失败计数变化：每次 complete（成功或失败）来到时触发一次节流刷新
watch(
    () => [currentSession.value?.completedCount, currentSession.value?.failedCount],
    (newVal, oldVal) => {
        // 无会话或计数未变化时忽略
        if (!currentSession.value) return;
        if (!oldVal) {
            // 初次挂载时 oldVal 为空，不触发
            return;
        }
        const [completedNew = 0, failedNew = 0] = newVal || [];
        const [completedOld = 0, failedOld = 0] = oldVal || [];
        if (completedNew === completedOld && failedNew === failedOld) return;

        // 如果已经全部完成，只触发一次立即刷新，避免后续状态变化监听器重复请求
        const total = currentSession.value.totalCount || 0;
        const isFullyCompleted = completedNew + failedNew >= total && total > 0;

        if (isFullyCompleted) {
            // 全部完成时，只做一次立即刷新，并设置标记防止状态监听器重复请求
            scheduleHistoryRefresh(true);
            return;
        }

        // 有新的完成或失败，做一次节流刷新
        scheduleHistoryRefresh(false);
    }
);

// 添加防重复请求标记
const isFinalRefreshScheduled = ref(false);

// 监听状态变化：当状态进入 completed/failed 时做一次最终刷新
const shouldRefreshForStatus = (status?: string | null) => {
    if (!status) return false;
    if (!currentSession.value) return false;
    if (status === "completed") return true;
    if (status === "failed") {
        const hasSuccess = (currentSession.value.completedCount || 0) > 0;
        return hasSuccess;
    }
    return false;
};

watch(
    () => currentSession.value?.status,
    (newStatus, oldStatus) => {
        if (!shouldRefreshForStatus(newStatus)) return;

        // 检查是否已经由完成计数监听器处理过
        const total = currentSession.value?.totalCount || 0;
        const processed = (currentSession.value?.completedCount || 0) + (currentSession.value?.failedCount || 0);
        const isFullyProcessed = processed >= total && total > 0;

        // 如果已经全部处理完成，说明计数监听器已经处理过，不再重复请求
        if (isFullyProcessed && isFinalRefreshScheduled.value) {
            return;
        }

        // 设置防重复标记（防止计数监听器后续重复处理）
        isFinalRefreshScheduled.value = true;

        // 立即刷新一次
        scheduleHistoryRefresh(true);

        // 重置防重复标记（延迟一段时间，防止短时间内再次触发）
        setTimeout(() => {
            isFinalRefreshScheduled.value = false;
        }, 3000);
    }
);

onBeforeUnmount(() => {
    if (historyRefreshTimer.value) {
        clearTimeout(historyRefreshTimer.value);
        historyRefreshTimer.value = null;
    }
});

// 处理分页变化
const scrollToResultsTop = () => {
    if (typeof window === "undefined") return;
    const target = resultsContainer.value;
    const top = target
        ? target.getBoundingClientRect().top + window.scrollY - 80
        : 0;
    const safeTop = top > 0 ? top : 0;
    window.scrollTo({ top: safeTop, behavior: "smooth" });
};

const handlePageChange = async (page: number) => {
    currentPage.value = page;
    await handleGetImageHistory(page, pageSize.value);
    await nextTick();
    scrollToResultsTop();
};

onMounted(async () => {
    // 将历史数据请求延后到浏览器空闲时或短暂延时，降低优先级
    const fetchHistory = () => {
        void handleGetImageHistory(1, pageSize.value);
    };

    if (typeof window !== 'undefined' && 'requestIdleCallback' in window) {
        (window as any).requestIdleCallback(fetchHistory, { timeout: 2000 });
    } else {
        setTimeout(fetchHistory, 500);
    }
});
</script>

<style scoped>
/* 进度条增强样式 */
.progress-bar-enhanced {
    transition: all 0.3s ease;
}

.progress-bar-enhanced :deep(.n-progress-graph-line-fill) {
    transition: width 0.5s cubic-bezier(0.4, 0, 0.2, 1);
}

/* 淡入淡出动画 */
.fade-enter-active,
.fade-leave-active {
    transition: opacity 0.3s ease, transform 0.3s ease;
}

.fade-enter-from {
    opacity: 0;
    transform: translateY(-10px);
}

.fade-leave-to {
    opacity: 0;
    transform: translateY(-10px);
}

/* 加载状态动画 */
@keyframes pulse {

    0%,
    100% {
        opacity: 1;
    }

    50% {
        opacity: 0.5;
    }
}

.generating-pulse {
    animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite;
}
</style>
