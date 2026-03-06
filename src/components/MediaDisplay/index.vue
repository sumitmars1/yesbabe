<template>
  <div class="media-display media-protected" :class="containerClass" :style="containerStyle">
    <!-- 视频文件显示 -->
    <div
      v-if="isVideoFile(src)"
      class="overflow-hidden"
      :class="[
        mediaClass,
        mode === 'avatar' ? 'rounded-full' : 'w-full h-full'
      ]"
      :style="mode === 'avatar' ? {
        width: avatarSize + 'px',
        height: avatarSize + 'px',
        ...mediaStyle
      } : {
        width: '100%',
        height: '100%',
        ...mediaStyle
      }"
    >
      <video
        ref="videoRef"
        :width="mode === 'avatar' ? avatarSize : width"
        :height="mode === 'avatar' ? avatarSize : height"
        autoplay
        loop
        muted
        controlsList="nodownload nofullscreen noremoteplayback"
        style="object-fit: cover"
        class="w-full h-full"
        @contextmenu.prevent
        @dragstart.prevent
        @selectstart.prevent
      >
        <source :src="src" type="video/mp4" />
        {{ t('mediaDisplay.unsupportedVideo') }}
      </video>
      <div class="media-protection-overlay"></div>
    </div>
    
    <!-- 图片文件显示 -->
    <template v-else>
      <!-- 圆形头像模式 -->
      <div
        v-if="mode === 'avatar'"
        class="overflow-hidden"
        :class="[mediaClass, 'rounded-full']"
        :style="{
          width: avatarSize + 'px',
          height: avatarSize + 'px',
          ...mediaStyle
        }"
      >
        <CustomImage
          ref="avatarImageRef"
          object-fit="cover"
          :preview="preview"
          :src="src || fallbackSrc"
          width="100%"
          height="100%"
          class="image-optimized"
          @contextmenu.prevent
          @dragstart.prevent
          @selectstart.prevent
        >
          <!-- 加载占位符 -->
          <template #placeholder v-if="showPlaceholder">
            <n-empty
              :style="{
                width: '100%',
                height: '100%',
              }"
            >
              <svg-icon
                icon-class="loading"
                class="animate-[spin_2s_linear_infinite]"
              />
            </n-empty>
          </template>
        </CustomImage>
        <div class="media-protection-overlay" @contextmenu.prevent @dragstart.prevent @selectstart.prevent></div>
      </div>
      
      <!-- 普通图片模式 -->
      <div class="relative">
        <CustomImage
          ref="imageRef"
          object-fit="cover"
          :preview="preview"
          :src="src || fallbackSrc"
          :width="width"
          :height="height"
          :class="[mediaClass, 'image-optimized']"
          :style="mediaStyle"
          @contextmenu.prevent
          @dragstart.prevent
          @selectstart.prevent
        >
          <!-- 加载占位符 -->
          <template #placeholder v-if="showPlaceholder">
            <n-empty
              :style="{
                width: '100%',
                height: height || '100%',
              }"
            >
              <svg-icon
                icon-class="loading"
                class="animate-[spin_2s_linear_infinite]"
              />
            </n-empty>
          </template>
        </CustomImage>
        <div class="media-protection-overlay" @contextmenu.prevent @dragstart.prevent @selectstart.prevent></div>
      </div>
    </template>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, onMounted, nextTick, watch } from 'vue';
import { useI18n } from 'vue-i18n';
import { useMediaProtection } from '@/utils/mediaProtection';
import CustomImage from '@/components/ui/CustomImage.vue';

const { t } = useI18n();

interface Props {
  src?: string;
  fallbackSrc?: string;
  mode?: 'image' | 'avatar';
  width?: string | number;
  height?: string | number;
  avatarSize?: number;
  preview?: boolean;
  showPlaceholder?: boolean;
  containerClass?: string;
  mediaClass?: string;
  containerStyle?: Record<string, any>;
  mediaStyle?: Record<string, any>;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'image',
  width: '100%',
  height: '100%',
  avatarSize: 120,
  preview: true,
  showPlaceholder: true,
  fallbackSrc: 'https://picsum.photos/200'
});

// 媒体元素引用
const videoRef = ref<HTMLVideoElement>();
const imageRef = ref<any>();
const avatarImageRef = ref<any>();

// 使用媒体保护功能
const { protectElement } = useMediaProtection();

// 在组件挂载后启用保护
onMounted(async () => {
  await nextTick();
  
  if (videoRef.value) {
    protectElement(videoRef.value);
  }
  if (imageRef.value?.thumbnailRef?.$el) {
    protectElement(imageRef.value.thumbnailRef.$el);
  }
  if (avatarImageRef.value?.thumbnailRef?.$el) {
    protectElement(avatarImageRef.value.thumbnailRef.$el);
  }
});

// 监听src变化，重新应用保护
watch(() => props.src, async () => {
  await nextTick();
  
  if (videoRef.value) {
    protectElement(videoRef.value);
  }
  if (imageRef.value?.thumbnailRef?.$el) {
    protectElement(imageRef.value.thumbnailRef.$el);
  }
  if (avatarImageRef.value?.thumbnailRef?.$el) {
    protectElement(avatarImageRef.value.thumbnailRef.$el);
  }
});

// 判断是否为视频文件
const isVideoFile = (url?: string): boolean => {
  if (!url) return false;
  
  // 检查URL中是否包含video关键字
  if (url.includes('video')) return true;
  
  // 检查文件扩展名
  const videoExtensions = ['.mp4', '.webm', '.ogg', '.avi', '.mov', '.wmv', '.flv', '.mkv'];
  const lowerUrl = url.toLowerCase();
  
  return videoExtensions.some(ext => lowerUrl.includes(ext));
};
</script>

<style scoped>
.media-display {
  display: inline-block;
}

.media-protected {
  position: relative;
  user-select: none;
  -webkit-user-select: none;
  -moz-user-select: none;
  -ms-user-select: none;
}

.media-protection-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 1;
  pointer-events: none;
  background: transparent;
}

.media-protected img,
.media-protected video {
  pointer-events: none;
  -webkit-user-drag: none;
  -khtml-user-drag: none;
  -moz-user-drag: none;
  -o-user-drag: none;
  user-drag: none;
}

.media-protected::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 2;
  pointer-events: none;
  background: transparent;
}
</style>