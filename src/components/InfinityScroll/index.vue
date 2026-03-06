<template>
  <div class="infinity-scroll text-white" :class="{ 'is-mobile': globalStore.isMobile }">
    <n-scrollbar
      ref="scrollbarRef"
      :style="{ height: height }"
      @scroll="handleScroll"
      trigger="none"
      :x-scrollable="false"
      :size="!globalStore.isMobile ? 0 : undefined"
    >
      <!-- 顶部加载区域（下拉加载模式时显示） -->
      <div
        v-if="loadDirection === 'up' && showLoadMore && (isLoading || hasMore)"
        class="load-area load-area-top"
        :class="{ 'is-loading': isLoading }"
      >
        <div v-if="isLoading" class="load-content">
          <n-spin size="small" />
          <span class="ml-2">{{ resolvedLoadingText }}</span>
        </div>
        <div
          v-else-if="hasMore"
          class="load-content load-trigger"
          @click="handleLoadMore"
        >
          <SvgIcon name="arrow-down" class="load-icon" />
          <span class="ml-2">{{ resolvedLoadText.loadMore }}</span>
        </div>
      </div>

      <!-- 列表内容 -->
      <div class="scroll-content">
        <slot></slot>
      </div>

      <!-- 底部加载区域（上拉加载模式时显示） -->
      <div
        v-if="loadDirection === 'down' && showLoadMore && (isLoading || hasMore)"
        class="load-area load-area-bottom"
        :class="{ 'is-loading': isLoading }"
      >
        <div v-if="isLoading" class="load-content">
          <n-spin size="small" />
          <span class="ml-2">{{ resolvedLoadText.loading }}</span>
        </div>
        <div
          v-else-if="hasMore"
          class="load-content load-trigger"
          @click="handleLoadMore"
        >
          <SvgIcon name="arrow-up" class="load-icon" />
          <span class="ml-2">{{ resolvedLoadText.loadMore }}</span>
        </div>
      </div>
    </n-scrollbar>

    <!-- 空状态 -->
    <div v-if="isEmpty && !isInitialLoading" class="empty-state backdrop-blur-xs">
      <slot name="empty">
        <div class="empty-content">
          <SvgIcon name="explore" class="empty-icon" />
          <p class="empty-text">{{ resolvedEmptyText }}</p>
        </div>
      </slot>
    </div>

    <!-- 初始加载状态 -->
    <div v-if="isInitialLoading" class="loading-state">
      <n-spin size="medium" />
      <p class="loading-text">{{ resolvedLoadingText }}</p>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, nextTick, onMounted, watch } from "vue";
import { useI18n } from 'vue-i18n';
import { useScrollManager } from "@/composables/useScrollManager";
import { useDeviceDetection } from "@/composables/useDeviceDetection";
import { useGlobalStore } from "@/stores/global/global";
const globalStore = useGlobalStore();
defineOptions({
  name: "InfinityScroll",
});

interface InfinityScrollProps {
  height?: string;
  loadDirection?: "up" | "down";
  loadOffset?: number;
  hasMore?: boolean;
  isEmpty?: boolean;
  isLoading?: boolean;
  isInitialLoading?: boolean;
  loadText?: {
    loadMore: string;
    loading: string;
    finished: string;
  };
  emptyText?: string;
  loadingText?: string;
  autoLoad?: boolean;
}

const { t } = useI18n();

const props = withDefaults(defineProps<InfinityScrollProps>(), {
  height: "100%",
  loadDirection: "down",
  loadOffset: 50,
  hasMore: true,
  isEmpty: false,
  isLoading: false,
  isInitialLoading: false,
  loadText: () => ({
    loadMore: "",
    loading: "",
    finished: "",
  }),
  emptyText: "",
  loadingText: "",
  autoLoad: true,
});

const defaultTexts = computed(() => ({
  loadMore: t('infinityScroll.loadMore'),
  loadText: t('infinityScroll.loadText'),
  loading: t('infinityScroll.loading'),
  loadingText: t('infinityScroll.loadingText'),
  emptyText: t('infinityScroll.emptyText'),
}));

const emit = defineEmits<{
  loadMore: [];
  scroll: [
    {
      scrollTop: number;
      scrollHeight: number;
      clientHeight: number;
      isAtTop: boolean;
      isAtBottom: boolean;
    }
  ];
}>();

const { isMobile } = useDeviceDetection();
const { scrollToBottom, isAtBottom, getScrollContainer } = useScrollManager();

const scrollbarRef = ref();

// 计算属性
const showLoadMore = computed(() => {
  return !props.isEmpty && !props.isInitialLoading;
});

const resolvedLoadText = computed(() => ({
  loadMore: props.loadText?.loadMore || defaultTexts.value.loadText,
  loading: props.loadText?.loading || defaultTexts.value.loading,
  finished: props.loadText?.finished || '',
}));

// 滚动处理
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  const { scrollTop, scrollHeight, clientHeight } = target;

  const isAtTop = scrollTop <= props.loadOffset;
  const isAtBottomValue =
    scrollHeight - scrollTop - clientHeight <= props.loadOffset;

  emit("scroll", {
    scrollTop,
    scrollHeight,
    clientHeight,
    isAtTop,
    isAtBottom: isAtBottomValue,
  });

  // 自动触发加载更多
  if (props.autoLoad && props.hasMore && !props.isLoading) {
    if (props.loadDirection === "down" && isAtBottomValue) {
      handleLoadMore();
    } else if (props.loadDirection === "up" && isAtTop) {
      handleLoadMore();
    }
  }
};

const resolvedLoadTriggerText = computed(() =>
  props.loadDirection === 'down' ? resolvedLoadText.value.loadMore : resolvedLoadText.value.loadMore
);

// 手动加载更多
const handleLoadMore = () => {
  if (!props.hasMore || props.isLoading) return;
  emit("loadMore");
};

const resolvedEmptyText = computed(() => props.emptyText || defaultTexts.value.emptyText);
const resolvedLoadingText = computed(() => props.loadingText || defaultTexts.value.loadingText);

// 滚动到顶部
const scrollToTop = (options?: { smooth?: boolean }) => {
  const container = getScrollContainer(scrollbarRef);
  if (container) {
    if (options?.smooth && container.scrollTo) {
      container.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    } else {
      container.scrollTop = 0;
    }
  }
};

// 滚动到底部
const scrollToBottomMethod = (options?: { smooth?: boolean }) => {
  return scrollToBottom(scrollbarRef, options);
};

// 滚动到指定位置
const scrollTo = (options: {
  top?: number;
  behavior?: "smooth" | "auto";
  position?: "top" | "bottom";
}) => {
  const container = getScrollContainer(scrollbarRef);
  if (container) {
    const behavior = options?.behavior || "auto";
    let targetTop: number;

    if (options?.position === "bottom") {
      targetTop = Math.max(0, container.scrollHeight - container.clientHeight);
    } else if (options?.position === "top") {
      targetTop = 0;
    } else if (typeof options?.top === "number") {
      targetTop = options.top;
    } else {
      targetTop = container.scrollTop;
    }

    if (container.scrollTo) {
      container.scrollTo({
        top: targetTop,
        behavior,
      });
    } else {
      container.scrollTop = targetTop;
    }
  }
};

// 监听加载方向变化，自动滚动到对应位置
watch(
  () => props.loadDirection,
  (newDirection) => {
    nextTick(() => {
      if (newDirection === "up") {
        scrollToBottomMethod({ smooth: false });
      } else {
        scrollToTop({ smooth: false });
      }
    });
  }
);

// 暴露方法给父组件
defineExpose({
  scrollToTop,
  scrollToBottom: scrollToBottomMethod,
  scrollTo,
  scrollbarRef,
  handleLoadMore,
});
</script>

<style scoped lang="scss">
.infinity-scroll {
  position: relative;
  width: 100%;
  height: 100%;
  :deep(.n-scrollbar) {
    width: 100%;
    height: 100%;
  }
  :deep(.n-scrollbar-container) {
    width: 100%;
    height: 100%;
    overflow-y: auto;
    overscroll-behavior: contain;
    -webkit-overflow-scrolling: touch;
  }
  :deep(.n-scrollbar-content) {
    width: 100%;
    min-height: 100%;
  }
  .scroll-content {
    min-height: 100%;
  }
  .load-area {
    display: flex;
    align-items: center;
    justify-content: center;
    padding: 16px;
    color: #999;
    font-size: 14px;

    &.load-area-top {
    }

    &.load-area-bottom {
    }

    .load-content {
      display: flex;
      align-items: center;

      &.load-trigger {
        cursor: pointer;
        color: #7562ff;
        transition: all 0.3s ease;

        &:hover {
          opacity: 0.8;
        }

        .load-icon {
          width: 16px;
          height: 16px;
          transition: transform 0.3s ease;
        }

        &:hover .load-icon {
          transform: translateY(2px);
        }
      }
    }

    &.is-loading .load-content {
      color: #7562ff;
    }
  }

  .empty-state,
  .loading-state {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0);
      z-index: 10;

    .empty-content {
      display: flex;
      flex-direction: column;
      align-items: center;

      .empty-icon {
        width: 64px;
        height: 64px;
        margin-bottom: 16px;
        opacity: 0.5;
        color: #ccc;
      }

      .empty-text {
        color: #999;
        font-size: 14px;
        margin: 0;
      }
    }

    .loading-text {
      margin: 12px 0 0 0;
      color: #999;
      font-size: 14px;
    }
  }

  &.is-mobile {
    .load-area .load-trigger {
      padding: 8px 16px;
      background: #f5f5f5;
      border-radius: 20px;

      &:active {
        background: #e8e8e8;
        transform: scale(0.98);
      }
    }
  }
}


// 暗色主题适配
@media (prefers-color-scheme: dark) {
  .infinity-scroll {
    .load-area {
      border-color: #333;

      &.load-area-top {
        border-bottom-color: #333;
      }

      &.load-area-bottom {
        border-top-color: #333;
      }
    }

    .empty-state,
    .loading-state {
      background: rgba(24, 24, 28, 0.95);
    }
  }
}
</style>
