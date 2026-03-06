<template>
  <div class="custom-carousel w-full h-full relative overflow-hidden">
    <!-- 轮播内容容器 -->
    <div
      class="carousel-track w-full h-full flex transition-transform duration-300 ease-out"
      :style="trackStyle"
    >
      <div
        v-for="(item, index) in items"
        :key="index"
        class="carousel-slide w-full h-full flex-shrink-0 relative flex justify-center items-center"
      >
        <slot :item="item" :index="index" />
      </div>
    </div>

    <!-- 左箭头 -->
    <button
      v-if="showArrow && items.length > 1"
      type="button"
      class="carousel-arrow carousel-arrow-left"
      :class="{ 'opacity-50 cursor-not-allowed': currentIndex === 0 }"
      :disabled="currentIndex === 0"
      @click.stop="prev"
    >
      <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
        <path d="M15.41 7.41L14 6l-6 6 6 6 1.41-1.41L10.83 12z" />
      </svg>
    </button>

    <!-- 右箭头 -->
    <button
      v-if="showArrow && items.length > 1"
      type="button"
      class="carousel-arrow carousel-arrow-right"
      :class="{ 'opacity-50 cursor-not-allowed': currentIndex === items.length - 1 }"
      :disabled="currentIndex === items.length - 1"
      @click.stop="next"
    >
      <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
        <path d="M10 6L8.59 7.41 13.17 12l-4.58 4.59L10 18l6-6z" />
      </svg>
    </button>

    <!-- 指示器点 -->
    <div v-if="showDots && items.length > 1" class="carousel-dots">
      <button
        v-for="(_, index) in items"
        :key="index"
        type="button"
        class="carousel-dot"
        :class="{ 'carousel-dot-active': currentIndex === index }"
        @click.stop="goTo(index)"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, onBeforeUnmount } from "vue";

interface Props {
  items: any[];
  currentIndex?: number;
  showArrow?: boolean;
  showDots?: boolean;
  autoplay?: boolean;
  interval?: number;
}

const props = withDefaults(defineProps<Props>(), {
  items: () => [],
  currentIndex: 0,
  showArrow: true,
  showDots: false,
  autoplay: false,
  interval: 3000,
});

const emit = defineEmits<{
  (event: "update:currentIndex", value: number): void;
  (event: "change", value: number): void;
}>();

const internalIndex = ref(props.currentIndex);
let autoplayTimer: ReturnType<typeof setInterval> | null = null;

const currentIndex = computed({
  get: () => internalIndex.value,
  set: (val) => {
    internalIndex.value = val;
    emit("update:currentIndex", val);
    emit("change", val);
  },
});

const trackStyle = computed(() => ({
  transform: `translateX(-${currentIndex.value * 100}%)`,
}));

const prev = () => {
  if (currentIndex.value > 0) {
    currentIndex.value -= 1;
    resetAutoplay();
  }
};

const next = () => {
  if (currentIndex.value < props.items.length - 1) {
    currentIndex.value += 1;
    resetAutoplay();
  }
};

const goTo = (index: number) => {
  if (index >= 0 && index < props.items.length) {
    currentIndex.value = index;
    resetAutoplay();
  }
};

const startAutoplay = () => {
  if (!props.autoplay || props.items.length <= 1) return;
  stopAutoplay();
  autoplayTimer = setInterval(() => {
    if (currentIndex.value < props.items.length - 1) {
      currentIndex.value += 1;
    } else {
      currentIndex.value = 0;
    }
  }, props.interval);
};

const stopAutoplay = () => {
  if (autoplayTimer) {
    clearInterval(autoplayTimer);
    autoplayTimer = null;
  }
};

const resetAutoplay = () => {
  stopAutoplay();
  startAutoplay();
};

// 监听外部 currentIndex 变化
watch(
  () => props.currentIndex,
  (val) => {
    if (val !== internalIndex.value) {
      internalIndex.value = val;
    }
  }
);

// 监听 autoplay 变化
watch(
  () => props.autoplay,
  (val) => {
    if (val) {
      startAutoplay();
    } else {
      stopAutoplay();
    }
  },
  { immediate: true }
);

// 监听 items 变化，重置索引
watch(
  () => props.items,
  () => {
    if (currentIndex.value >= props.items.length) {
      currentIndex.value = Math.max(0, props.items.length - 1);
    }
  }
);

onMounted(() => {
  if (props.autoplay) {
    startAutoplay();
  }
});

onBeforeUnmount(() => {
  stopAutoplay();
});

defineExpose({
  prev,
  next,
  goTo,
});
</script>

<style scoped>
.custom-carousel {
  position: relative;
}

.carousel-track {
  will-change: transform;
}

.carousel-slide {
  user-select: none;
}

.carousel-arrow {
  position: absolute;
  top: 50%;
  transform: translateY(-50%);
  z-index: 10;
  width: 24px;
  height: 24px;
  border-radius: 12px;
  background: rgba(0, 0, 0, 0.5);
  color: white;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: background 0.2s ease, opacity 0.2s ease;
  backdrop-filter: blur(4px);
}

.carousel-arrow:hover:not(:disabled) {
  background: rgba(0, 0, 0, 0.7);
}

.carousel-arrow-left {
  left: 12px;
}

.carousel-arrow-right {
  right: 12px;
}

.carousel-dots {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  gap: 8px;
  z-index: 10;
}

.carousel-dot {
  width: 8px;
  height: 8px;
  border-radius: 12px;
  background: rgba(255, 255, 255, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  padding: 0;
}

.carousel-dot:hover {
  background: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

.carousel-dot-active {
  background: rgba(255, 255, 255, 0.9);
  border-color: white;
  transform: scale(1.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* Dark mode */
:root.dark .carousel-dot {
  background: rgba(0, 0, 0, 0.4);
  border-color: rgba(0, 0, 0, 0.6);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

:root.dark .carousel-dot:hover {
  background: rgba(0, 0, 0, 0.6);
  border-color: rgba(0, 0, 0, 0.8);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

:root.dark .carousel-dot-active {
  background: rgba(0, 0, 0, 0.9);
  border-color: black;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3);
}
</style>
