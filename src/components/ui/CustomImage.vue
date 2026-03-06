<script setup lang="ts">
import { ref, computed, useAttrs, onUnmounted } from 'vue'
import { NImage } from 'naive-ui'
import SvgIcon from '@/components/SvgIcon/index.vue'

defineOptions({
  inheritAttrs: false
})

interface Props {
  src?: string
  preview?: boolean
  imageArray?: string[]
}

const props = withDefaults(defineProps<Props>(), {
  preview: true,
  imageArray: () => []
})

const showPreview = ref(false)
const currentIndex = ref(0)
const thumbnailRef = ref() // ref to n-image component

const previewList = computed(() => {
  if (props.imageArray && props.imageArray.length > 0) {
    return props.imageArray
  }
  return props.src ? [props.src] : []
})

const currentPreviewSrc = computed(() => {
  if (previewList.value.length === 0) return ''
  return previewList.value[currentIndex.value]
})

const handleThumbnailClick = (e: MouseEvent) => {
  if (!props.preview) return
  if (props.src && previewList.value.length > 0) {
    const idx = previewList.value.findIndex(url => url === props.src)
    currentIndex.value = idx !== -1 ? idx : 0
  } else {
    currentIndex.value = 0
  }
  showPreview.value = true
  document.body.style.overflow = 'hidden'
}

const closePreview = () => {
  showPreview.value = false
  document.body.style.overflow = ''
}

const prevImage = () => {
  currentIndex.value = (currentIndex.value - 1 + previewList.value.length) % previewList.value.length
}

const nextImage = () => {
  currentIndex.value = (currentIndex.value + 1) % previewList.value.length
}

defineExpose({
  thumbnailRef
})

const attrs = useAttrs()

onUnmounted(() => {
  document.body.style.overflow = ''
})
</script>

<template>
  <n-image
    v-bind="attrs"
    :src="src"
    :preview-disabled="true"
    @click="handleThumbnailClick"
    ref="thumbnailRef"
    :class="[attrs.class, props.preview ? 'cursor-pointer' : '']"
  >
    <template #placeholder>
      <slot name="placeholder">
        <div class="image-loading-placeholder"></div>
      </slot>
    </template>
    <template #error v-if="$slots.error">
      <slot name="error" />
    </template>
  </n-image>

  <Teleport to="body">
    <Transition name="fade">
      <div
        v-if="showPreview"
        class="fixed inset-0 z-[9999] flex items-center justify-center bg-black/90 backdrop-blur-sm"
        @click="closePreview"
      >
        <!-- Close Button -->
        <div
          class="absolute top-8 right-8 text-white/70 hover:text-white z-[10001] p-2 cursor-pointer transition-colors bg-white/10 rounded-full"
          @click.stop="closePreview"
        >
          <svg-icon icon-class="close" class="text-2xl" />
        </div>

        <!-- Navigation -->
        <div
          v-if="previewList.length > 1"
          class="absolute left-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-[10001] w-[36px] h-[36px] flex items-center justify-center cursor-pointer transition-colors bg-white/10 rounded-full hover:bg-white/20"
          @click.stop="prevImage"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke-width="1.5" 
            stroke="currentColor" 
            class="w-5 h-5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </div>
        
        <div
          v-if="previewList.length > 1"
          class="absolute right-4 top-1/2 -translate-y-1/2 text-white/70 hover:text-white z-[10001] w-[36px] h-[36px] flex items-center justify-center cursor-pointer transition-colors bg-white/10 rounded-full hover:bg-white/20"
          @click.stop="nextImage"
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke-width="1.5" 
            stroke="currentColor" 
            class="w-5 h-5"
          >
            <path stroke-linecap="round" stroke-linejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </div>

        <!-- Image -->
        <img
          :src="currentPreviewSrc"
          class="max-w-full max-h-full object-contain select-none cursor-zoom-out h-full w-full p-4"
          @click="closePreview"
          draggable="false"
        />
        
        <!-- Counter -->
         <div v-if="previewList.length > 1" class="absolute bottom-8 left-1/2 -translate-x-1/2 text-white text-base font-medium tracking-wider bg-black/50 px-4 py-1 rounded-full">
          {{ currentIndex + 1 }} / {{ previewList.length }}
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from,
.fade-leave-to {
  opacity: 0;
}

/* 图片加载占位符样式 */
.image-loading-placeholder {
  position: relative;
  overflow: hidden;
  width: 100%;
  height: 100%;
  min-height: 100%;
  background-color: var(--card-background, #f3f4f6);
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
    rgba(255, 255, 255, 0.4),
    transparent
  );
  animation: shimmer 1.5s infinite;
}

@keyframes shimmer {
  0% {
    left: -100%;
  }
  100% {
    left: 100%;
  }
}

:deep([data-theme="dark"]) .image-loading-placeholder {
  background-color: var(--card-background, #1f2937);
}

:deep([data-theme="dark"]) .image-loading-placeholder::before {
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.1),
    transparent
  );
}
</style>
