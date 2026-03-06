<template>
  <div class="flex bg-background">
    <!-- 左侧 Generator 区域 -->
    <div
      class="w-full md:w-450px md:max-w-450px flex-shrink-0"
      :class="{
        'h-full': !globalStore.isMobile,
      }"
    >
      <n-scrollbar class="">
        <generator-view
          ref="generatorRef"
          @generate-complete="handleGenerateComplete"
          @video-generate-requested="onVideoRequested"
          @video-generate-start="onVideoStart"
          @video-generate-progress="onVideoProgress"
          @video-generate-complete="onVideoComplete"
          @init-finished="handleGeneratorReady"
        />
      </n-scrollbar>
    </div>
    <div
      class="hidden md:block w-0.5px bg-divider mr-1px flex-shrink-0"
      :class="{
        'h-full': !globalStore.isMobile,
      }"
      v-if="!globalStore.isMobile && isGeneratorReady"
    ></div>
    <div
      class="hidden md:block flex-1"
      v-if="!globalStore.isMobile && isGeneratorReady"
      :class="{
        'h-full': !globalStore.isMobile,
      }"
    >
      <n-scrollbar class="">
        <result-view
          ref="resultRef"
          :results="generationResults"
          @request-generate-video="handleRequestGenerateVideo"
          @video-generate-start="onVideoStart"
          @video-generate-progress="onVideoProgress"
          @video-generate-complete="onVideoComplete"
          :video-loading-map="videoLoadingMap"
          :video-done-map="videoDoneMap"
          :video-progress-map="videoProgressMap"
        />
      </n-scrollbar>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from "vue";
import { useRouter } from "vue-router";
import { NScrollbar } from "naive-ui";
import GeneratorView from "./generator.vue";
import ResultView from "./result.vue";
import { useGlobalStore } from "@/stores/global/global";
const globalStore = useGlobalStore();
const router = useRouter();
const generationResults = ref([]);
const isGeneratorReady = ref(false);
const generatorRef = ref<InstanceType<typeof GeneratorView> | null>(null);
const resultRef = ref<InstanceType<typeof ResultView> | null>(null);
const videoLoadingMap = ref<Record<string, boolean>>({});
const videoDoneMap = ref<Record<string, boolean>>({});
const videoProgressMap = ref<Record<string, number | string>>({});

// 处理生成完成事件
const handleGenerateComplete = (results: any) => {
  generationResults.value = results;

  // 移动端跳转到结果页面
  if (window.innerWidth < 768) {
    router.push({ name: "AIGeneratorResult" });
  }
};

// 注意：AIResultCard 现在自己处理视频生成逻辑，不再通过 generator.vue 的弹窗
// 保留此函数占位以防止意外调用，但不再打开弹窗
const handleRequestGenerateVideo = (payload: { fileId: string }) => {
  console.log('AIResultCard 自行处理视频生成:', payload.fileId);
};

// 处理生成视频开始/完成，更新按钮状态
const onVideoRequested = ({ fileId }: { fileId: string }) => {
  videoLoadingMap.value = { ...videoLoadingMap.value, [fileId]: true };
  videoProgressMap.value = { ...videoProgressMap.value, [fileId]: 0 };
};

const onVideoStart = ({ fileId, message }: { fileId: string; message?: string }) => {
  videoLoadingMap.value = { ...videoLoadingMap.value, [fileId]: true };
  if (typeof message === "string" && message.trim().length > 0) {
    videoProgressMap.value = { ...videoProgressMap.value, [fileId]: message };
  }
};

const onVideoComplete = async ({ fileId, success }: { fileId: string; success: boolean }) => {
  videoLoadingMap.value = { ...videoLoadingMap.value, [fileId]: false };
  if (success) {
    videoDoneMap.value = { ...videoDoneMap.value, [fileId]: true };
    videoProgressMap.value = { ...videoProgressMap.value, [fileId]: 100 };

    try {
      await resultRef.value?.refreshHistory();
    } catch (error) {
      console.error('刷新历史数据失败:', error);
    }
    return;
  }

  videoProgressMap.value = { ...videoProgressMap.value, [fileId]: 0 };
};

const onVideoProgress = ({ fileId, progress, message }: { fileId: string; progress?: number; message?: string }) => {
  if (typeof progress === "number") {
    videoProgressMap.value = { ...videoProgressMap.value, [fileId]: progress };
    return;
  }
  if (typeof message === "string" && message.trim().length > 0) {
    videoProgressMap.value = { ...videoProgressMap.value, [fileId]: message };
  }
};

const handleGeneratorReady = () => {
  isGeneratorReady.value = true;
};
</script>

<style scoped>
/* 确保容器占满可用高度 */
.h-full {
  height: calc(100vh - 64px); /* 减去Header高度 */
}

/* 确保在移动端时左侧占满宽度 */
@media (max-width: 767px) {
  .w-full {
    width: 100% !important;
  }
}

/* 分隔线样式 */
.bg-divider {
  background-color: var(--divider-color, rgba(128, 128, 128, 0.2));
}

/* 确保滚动区域独立 */
.n-scrollbar {
  overflow: hidden;
}
</style>
