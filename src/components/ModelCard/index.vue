<template>
  <div class="w-full aspect-[9/16] rounded-2xl overflow-hidden bg-roleCardBackground relative cursor-pointer"
    @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" @touchstart="handleTouchStart"
    @touchend="handleTouchEnd" @touchcancel="handleTouchCancel">
    <BottomOverlay>
      <div class="h-full mb-3 relative">
        <!-- 最新标识 -->
        <div v-if="showLatestBadge"
          class="absolute top-2 right-2 z-20 px-2 py-1 bg-gradient-to-r from-[#FF4A7A] to-[#FF6B95] text-white text-xs font-bold rounded-lg shadow-lg">
          {{ t('modelCard.latest') }}
        </div>

        <!-- 图片容器 - 添加过渡效果 -->
        <div
          class="w-full h-full absolute top-0 left-0 z-10 transition-all duration-300 ease-in-out media-protected"
          :class="{
            'opacity-100 scale-100': !isHovered || !modelData.cover_video_url,
            'opacity-0 scale-95': isHovered && modelData.cover_video_url,
            'pointer-events-none': isHovered && modelData.cover_video_url
          }">
          <n-image object-fit="cover" width="100%" height="100%" preview-disabled
            :src="modelData.head_image || modelData.cover_video_url" class="w-full h-full" />
        </div>

        <div v-if="modelData.cover_video_url"
          class="w-full h-full overflow-hidden absolute top-0 left-0 z-10 transition-all duration-300 ease-in-out media-protected"
          :class="{
            'opacity-100 scale-100': isHovered,
            'opacity-0 scale-105': !isHovered,
            'pointer-events-none': !isHovered
          }">
          <video
            ref="videoRef"
            width="100%"
            height="100%"
            loop
            muted
            controlsList="nodownload nofullscreen noremoteplayback"
            style="object-fit: cover"
            class="w-full h-full"
            @contextmenu.prevent
            @dragstart.prevent
            @selectstart.prevent
            @play="isVideoPlaying = true"
            @pause="isVideoPlaying = false"
            @ended="isVideoPlaying = false"
            @error="handleVideoError">
            <source :src="modelData.cover_video_url" type="video/mp4" />
            {{ t('modelCard.unsupportedVideo') }}
          </video>
          <div class="media-protection-overlay"></div>
        </div>
      </div>
      <template #footer>
        <div :style="{ transform: 'translateY(-10px)' }">
          <div class="flex justify-between items-center mb-2">
            <div class="truncate text-base font-bold">{{ modelData.name }}</div>
            <div class="flex items-center cursor-pointer select-none" @click.stop="handleLikeClick">
              <!-- <svg-icon :iconClass="isLiked ? 'heart-filled' : 'heart'" :size="20"
                :class="{ 'text-pink fill-pink': isLiked, 'like-animation': isAnimating }"
                :style="{ transition: 'all 0.3s ease' }" />
              <span v-if="displayLikeCount" class="text-base ml-1 font-600" :class="{ 'text-pink': isLiked }">{{
                displayLikeCount }}</span> -->
            </div>
          </div>
          <div
            class="text-xs font-600 overflow-hidden leading-tight transition-all duration-300 ease-in-out text-white opacity-70"
            :style="{
              lineHeight: '1.2em',
              maxHeight: isHovered ? '3.6em' : '1.2em',
            }">
            <div v-if="modelData.age || modelData.description">
              <span v-if="modelData.age">{{ modelData.age }}</span>
              <span v-if="modelData.age && modelData.description">, </span>
              <span v-if="modelData.description">{{ modelData.description }}</span>
            </div>
          </div>
        </div>
      </template>
    </BottomOverlay>
  </div>
</template>

<script setup lang="ts">
import { ref, defineProps, computed, onMounted, nextTick } from "vue";
import { useI18n } from 'vue-i18n';
import BottomOverlay from "@/components/BottomOverlay/index.vue";
import SvgIcon from "@/components/SvgIcon/index.vue";
import { useGlobalStore } from "@/stores/global/global";
import { useAuthStore } from "@/stores/auth";
import { showLoginModal } from "@/utils/authModal";
import { useMediaProtection } from "@/utils/mediaProtection";

const { t } = useI18n();

// AI模型数据接口
interface AIModelData {
  id: number;
  name: string;
  head_image?: string;
  cover_video_url?: string;
  age?: string;
  description?: string;
  interaction_number?: number;
}

const props = defineProps<{
  modelData: AIModelData;
  showLatestBadge?: boolean;
}>();

// 全局状态
const globalStore = useGlobalStore();

// 悬停状态
const isHovered = ref(false);
// 视频元素引用
const videoRef = ref<HTMLVideoElement>();
// 长按定时器
const longPressTimer = ref<NodeJS.Timeout | null>(null);
// 长按状态
const isLongPressed = ref(false);
// 点赞状态
const isLiked = ref(false);
// 点赞数
const likeCount = ref(0);

// 初始化点赞状态和点赞数
isLiked.value = false;
likeCount.value = props.modelData.interaction_number || 0;

// 使用媒体保护功能
const { protectElement } = useMediaProtection();

// 在组件挂载后为视频元素添加保护
onMounted(async () => {
  await nextTick();
  if (videoRef.value) {
    protectElement(videoRef.value);
  }
});

// 视频播放状态
const isVideoPlaying = ref(false);
// 播放请求Promise
const playPromise = ref<Promise<void> | null>(null);

// 播放视频的通用方法
const playVideo = async () => {
  if (!videoRef.value) return;

  try {
    // 如果已经在播放，先停止
    if (isVideoPlaying.value) {
      stopVideo();
      // 等待一小段时间让停止操作完成
      await new Promise(resolve => setTimeout(resolve, 50));
    }

    // 使用setTimeout确保DOM更新完成
    playPromise.value = new Promise((resolve, reject) => {
      setTimeout(async () => {
        try {
          if (videoRef.value) {
            // 确保视频已加载
            if (videoRef.value.readyState < 2) {
              videoRef.value.load();
              await new Promise(resolve => {
                if (videoRef.value) {
                  videoRef.value.addEventListener('loadeddata', resolve, { once: true });
                }
              });
            }

            const promise = videoRef.value.play();
            if (promise) {
              await promise;
            }
            isVideoPlaying.value = true;
            resolve();
          }
        } catch (error) {
          // 忽略AbortError和其他播放错误
          isVideoPlaying.value = false;
          resolve(); // 不要reject，避免未处理的Promise错误
        }
      }, 50);
    });

    await playPromise.value;
  } catch (error) {
    // 忽略所有播放错误
    isVideoPlaying.value = false;
  }
};

// 停止视频的通用方法
const stopVideo = () => {
  if (videoRef.value && isVideoPlaying.value) {
    try {
      videoRef.value.pause();
      videoRef.value.currentTime = 0;
    } catch (error) {
      // 忽略停止时的错误
    } finally {
      isVideoPlaying.value = false;
      playPromise.value = null;
    }
  }
};

// 防抖定时器
let mouseEnterTimer: NodeJS.Timeout | null = null;
let mouseLeaveTimer: NodeJS.Timeout | null = null;

// 鼠标进入事件 (桌面端)
const handleMouseEnter = () => {
  if (!globalStore.isMobile) {
    // 清除之前的定时器
    if (mouseLeaveTimer) {
      clearTimeout(mouseLeaveTimer);
      mouseLeaveTimer = null;
    }

    // 防抖处理
    if (mouseEnterTimer) {
      clearTimeout(mouseEnterTimer);
    }

    mouseEnterTimer = setTimeout(() => {
      isHovered.value = true;
      playVideo();
      mouseEnterTimer = null;
    }, 100);
  }
};

// 鼠标离开事件 (桌面端)
const handleMouseLeave = () => {
  if (!globalStore.isMobile) {
    // 清除之前的定时器
    if (mouseEnterTimer) {
      clearTimeout(mouseEnterTimer);
      mouseEnterTimer = null;
    }

    // 防抖处理
    if (mouseLeaveTimer) {
      clearTimeout(mouseLeaveTimer);
    }

    mouseLeaveTimer = setTimeout(() => {
      isHovered.value = false;
      stopVideo();
      mouseLeaveTimer = null;
    }, 100);
  }
};

// 触摸开始事件 (移动端长按)
const handleTouchStart = () => {
  if (globalStore.isMobile && props.modelData.cover_video_url) {
    longPressTimer.value = setTimeout(() => {
      isLongPressed.value = true;
      isHovered.value = true;
      playVideo();
    }, 500); // 500ms长按触发
  }
};

// 触摸结束事件 (移动端)
const handleTouchEnd = () => {
  if (globalStore.isMobile) {
    if (longPressTimer.value) {
      clearTimeout(longPressTimer.value);
      longPressTimer.value = null;
    }
    if (isLongPressed.value) {
      isLongPressed.value = false;
      isHovered.value = false;
      stopVideo();
    }
  }
};

// 触摸取消事件 (移动端)
const handleTouchCancel = () => {
  handleTouchEnd();
};

// 视频错误处理
const handleVideoError = (event: Event) => {
  console.warn('视频播放错误:', event);
  isVideoPlaying.value = false;
  playPromise.value = null;
};

// 控制动画的响应式变量
const isAnimating = ref(false);

// 处理点赞点击事件
const handleLikeClick = () => {
  // 检查用户是否已登录
  const authStore = useAuthStore();
  if (!authStore.isLoggedIn) {
    // 未登录则显示登录模态框
    showLoginModal('login');
    return;
  }
  
  isLiked.value = !isLiked.value;
  likeCount.value = isLiked.value ? likeCount.value + 1 : likeCount.value - 1;

  // 触发动画
  isAnimating.value = true;
  setTimeout(() => {
    isAnimating.value = false;
  }, 300);
};

// 格式化点赞数
const displayLikeCount = computed(() => {
  const num = likeCount.value;

  // 点赞数为0时不显示数字
  if (num === 0) return "";

  // 500赞："500"
  if (num < 1000) return num.toString();

  // 1000赞："1k"
  if (num < 10000) return Math.floor(num / 1000) + "k";

  // 10000赞："10K"
  if (num < 100000) return Math.floor(num / 1000) + "K";

  // 10万赞："100K"
  if (num < 1000000) return Math.floor(num / 1000) + "K";

  // 100万赞："1m"
  if (num < 500000000) return Math.floor(num / 1000000) + "m";

  // 5亿赞："500m"
  return Math.floor(num / 1000000) + "m";
});
</script>

<style scoped>
@keyframes like-animation {
  0% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.2);
  }

  100% {
    transform: scale(1);
  }
}

.like-animation {
  animation: like-animation 0.3s ease;
}
</style>