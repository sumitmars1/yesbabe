<template>
  <div class="">
    <div
      v-if="type === 'BUTTON'"
      class="box-border whitespace-nowrap block w-full text-center mx-1 card rounded-lg text-sm font-medium cursor-pointer select-none transition-all duration-200 hover:translate-y-[-1.5px]"
      :class="[
        width,
        height,
        {
          'shadow-activeBorder text-appColor  ': props.isSelected,
          'shadow-border text-primary': !props.isSelected,
        },
      ]"
      @click="$emit('click')"
    >
      {{ props.name }}
    </div>
    <div
      v-if="type === 'IMAGE'"
      class="rounded-xl mx-2px overflow-hidden hover:translate-y-[-1.5px] duration-200 l"
      :class="[{ 'shadow-activeBorder': props.isSelected }]"
      :style="aspectRatioStyle"
    >
      <BottomOverlay
        class="cursor-pointer inset-0 select-none  box-border overflow-hidden transition-all duration-200 rounded-xl"
        :style="aspectRatioStyle"
        @click="$emit('click')"
      >
        <n-image
          v-show="imageLoaded && !imageError"
          object-fit="cover"
          :on-load="handleImageLoad"
          :on-error="handleImageError"
          preview-disabled
          class="block select-none image-optimized"
          :class="[width, height]"
          width="100%"
          height="100%"
          :src="props.image"
        ></n-image>
        <div
          v-show="!imageLoaded"
          :style="{
            backgroundColor: 'var(--card-background)',
            ...aspectRatioStyle,
          }"
          :class="[width, height]"
          class="flex items-center justify-center image-loading-placeholder"
        >
          <!-- 暂时去掉三个点加载动画 -->
        </div>
        <!-- 图片加载失败时的错误状态 -->
        <div
          v-show="imageError"
          :style="{
            backgroundColor: 'var(--card-background)',
            ...aspectRatioStyle,
          }"
          :class="[width, height]"
          class="flex items-center justify-center image-error-placeholder"
        >
          <div class="image-error-content">
            <div class="error-icon">⚠️</div>
            <p class="error-text">加载失败</p>
          </div>
        </div>
        <template #footer>
          <!-- PC端：使用 popover -->
          <n-popover
            v-if="!globalStore.isMobile && props.name && isTextTruncated"
            trigger="hover"
            placement="bottom"
          >
            <template #trigger>
              <div
                ref="textRef"
                class="text-sm text-white text-center truncate"
              >
                {{ props.name }}
              </div>
            </template>
            {{ props.name }}
          </n-popover>
          <!-- 移动端或文字未截断：直接显示文字 -->
          <div
            v-else-if="props.name"
            ref="textRef"
            class="text-sm text-white text-center truncate"
          >
            {{ props.name }}
          </div>
          <div v-else class="text-sm text-white text-center"></div>
        </template>
      </BottomOverlay>
    </div>
    <div
      v-if="type === 'AVATAR'"
      class="flex items-center bg-background cursor-pointer rounded-xl transition-all duration-200 hover:translate-y-[-1.5px] large-card w-full box-border"
      :class="[
        {
          'shadow-activeBorder': props.isSelected,
          'shadow-border': !props.isSelected,
        },
      ]"
      @click="$emit('click')"
    >
      <div class="mr-4 flex items-center">
        <n-avatar
          object-fit="cover"
          preview-disabled
          width="32px"
          height="32px"
          :src="props.image"
          class="image-optimized"
        >
        </n-avatar>
      </div>
      <div class="flex flex-col">
        <div class="text-primary text-base font-bold">
          {{ props.name }}
        </div>
        <div
          v-if="props.showDescription"
          class="text-sm h-10 w-full line-clamp-2 opacity-70"
        >
          {{ props.description }}
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, withDefaults, nextTick, onMounted } from "vue";
import { CardType } from "@/stores/create/type";
import { useGlobalStore } from "@/stores/global/global";

const globalStore = useGlobalStore();

// 图片加载状态
const imageLoaded = ref(false);
const imageError = ref(false);

// 图片加载完成处理函数
const handleImageLoad = () => {
  imageLoaded.value = true;
  imageError.value = false;
};

// 图片加载失败处理函数
const handleImageError = () => {
  imageLoaded.value = true; // 也标记为已加载（停止显示loading）
  imageError.value = true;
};

// 文字引用
const textRef = ref(null);

// 判断文字是否被截断
const isTextTruncated = ref(false);

// 监听文字是否被截断
onMounted(() => {
  nextTick(() => {
    if (textRef.value) {
      const element = textRef.value;
      isTextTruncated.value = element.scrollWidth > element.clientWidth;
    }
  });
});
const props = withDefaults(
  defineProps<{
    type: CardType;
    name?: string;
    image?: string;
    description?: string;
    isSelected?: boolean;
    borderRadius?: string;
    width?: string;
    height?: string;
    aspectRatio?: string;
    size?: string;
    showDescription?: boolean;
  }>(),
  {
    type: "BUTTON",
    borderRadius: "12px",
    width: "",
    height: "",
    aspectRatio: "",
    size: "default",
    showDescription: true,
  }
);

defineEmits(['click']);

const emptyRef = ref(null);
// 计算这个dom的宽度，并返回宽度
// onMounted(async () => {
//   setTimeout(() => {
//     console.log("emptyRef", emptyRef.value.$el.offsetWidth);
//   },100);
// });
const claculateWidth = computed(() => {
  if (emptyRef.value) {
    return emptyRef.value.$el.offsetWidth + "px";
  } else {
    console.log("n-empty 组件未渲染");
  }
});

// 处理width类名，如果是max-w-xxx格式则裁剪成w-xxx
const processedWidth = computed(() => {
  if (!props.width) return "";
  if (props.width.startsWith("max-w-")) {
    return props.width.replace("max-w-", "");
  }
  if (props.width.startsWith("w-")) {
    return props.width.replace("w-", "");
  }
  return props.width;
});

// 处理height类名，如果是max-h-xxx格式则裁剪成h-xxx
const processedHeight = computed(() => {
  if (!props.height) return "";
  if (props.height.startsWith("max-h-")) {
    return props.height.replace("max-h-", "");
  }
  if (props.height.startsWith("h-")) {
    return props.height.replace("h-", "");
  }
  return props.height;
});

// 处理宽高比样式
const aspectRatioStyle = computed(() => {
  if (!props.aspectRatio) return {};

  // 将 "9/16" 格式转换为 "9/16" 或 "0.5625"
  const ratio = props.aspectRatio;

  return {
    aspectRatio: ratio
  };
});
</script>
<style scoped lang="scss">
// .btn-custom {
//   border: var(--btn-border);
//   box-shadow: 0 0 0 1px var(--btn-border);

//   &.active {
//     color: var(--c-app-color);
//     box-shadow: var(--active-border);
//   }
// }

/* 点击效果 */
.btn:active {
  transform: translateY(1px);
}

/* 图片加载占位符样式 */
.image-loading-placeholder {
  position: relative;
  overflow: hidden;
  width: 100%;
  min-height: 100%;
}

.image-loading-placeholder::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

.image-loading-spinner {
  display: flex;
  gap: 4px;
  align-items: center;
  justify-content: center;
}

.loading-dot {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background-color: var(--app-color, #6366f1);
  opacity: 0.3;
  animation: loading-pulse 1.4s ease-in-out infinite;
}

.loading-dot:nth-child(1) {
  animation-delay: -0.32s;
}

.loading-dot:nth-child(2) {
  animation-delay: -0.16s;
}

.loading-dot:nth-child(3) {
  animation-delay: 0;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

@keyframes loading-pulse {
  0%, 80%, 100% {
    transform: scale(0.8);
    opacity: 0.3;
  }
  40% {
    transform: scale(1.2);
    opacity: 1;
  }
}

/* 图片加载错误状态样式 */
.image-error-placeholder {
  background-color: var(--card-background);
  border: 1px dashed var(--border-color, #e5e7eb);
  width: 100%;
  min-height: 100%;
}

.image-error-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  opacity: 0.6;
}

.error-icon {
  font-size: 24px;
  opacity: 0.5;
}

.error-text {
  font-size: 12px;
  color: var(--text-secondary);
  margin: 0;
}

/* 暗色模式适配 */
:deep([data-theme="dark"]) .image-loading-placeholder::before {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.05),
    transparent
  );
}

:deep([data-theme="dark"]) .loading-dot {
  background-color: var(--app-color, #818cf8);
}

:deep([data-theme="dark"]) .image-error-placeholder {
  border-color: var(--border-color-dark, #374151);
}

:deep([data-theme="dark"]) .error-text {
  color: var(--text-secondary-dark, rgba(255, 255, 255, 0.6));
}
</style>
