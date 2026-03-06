<template>
  <div class="aspect-[9/16] rounded-2xl overflow-hidden bg-roleCardBackground max-w-[248px] relative cursor-pointer"
    @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave" @touchstart="handleTouchStart"
    @touchend="handleTouchEnd" @touchcancel="handleTouchCancel">
    <!-- Top-right icons container -->
    <div class="absolute top-2 right-2 z-20 flex items-center gap-2">
      <!-- Level Badge -->
      <div
        v-if="shouldShowLevelBadge"
        class="w-6 h-6 rounded-full bg-[#7562ff] flex items-center justify-center text-white text-[10px] font-bold border border-white/20 shadow-sm backdrop-blur-sm bg-opacity-60 leading-none"
      >
        {{ badgeLevel }}
      </div>
      <!-- Chat Icon -->
      <div class="w-6 h-6 rounded-full bg-black bg-op-20 backdrop-blur-sm flex items-center justify-center">
        <svg-icon iconClass="Chat2" :size="14" class="text-white" />
      </div>
    </div>
    <BottomOverlay>
      <div class="h-full mb-3 relative">
        <!-- 图片容器 - 添加过渡效果 -->
        <div
          class="w-full h-full absolute top-0 left-0 z-10 transition-all duration-300 ease-in-out media-protected"
          :class="{
            'opacity-100 scale-100': !isHovered || !roleData.cover_video_url,
            'opacity-0 scale-95': isHovered && roleData.cover_video_url,
            'pointer-events-none': isHovered && roleData.cover_video_url
          }">
          <n-image object-fit="cover" width="100%" height="100%" preview-disabled
            :src="roleData.head_image || roleData.cover_video_url" class="w-full h-full" />
        </div>
        <!-- 视频容器 - 改进的过渡效果 -->
        <div v-if="roleData.cover_video_url"
          class="w-full h-full overflow-hidden absolute top-0 left-0 z-10 transition-all duration-300 ease-in-out media-protected"
          :class="{
            'opacity-100 scale-100': isHovered,
            'opacity-0 scale-105': !isHovered,
            'pointer-events-none': !isHovered
          }">
          <video ref="videoRef" width="100%" height="100%" loop muted controlsList="nodownload nofullscreen noremoteplayback" style="object-fit: cover" class="w-full h-full"
            @contextmenu.prevent
            @dragstart.prevent
            @selectstart.prevent>
            <source :src="roleData.cover_video_url" type="video/mp4" />
            {{ t('roleCard.unsupportedVideo') }}
          </video>
          <div class="media-protection-overlay"></div>
        </div>
      </div>
      <template #footer>
        <div
          class="transition-all duration-300 ease-in-out"
          :style="{
            transform: `translateY(${isHovered ? '-14px' : '-10px'})`,
          }">
          <div class="flex justify-between items-center mb-1">
            <div class="truncate font-bold text-[14px] text-white opacity-100">{{ roleData.name }}</div>
            <div class="flex items-center cursor-pointer select-none" @click.stop="handleLikeClick">
              <svg-icon :iconClass="isLiked ? 'heart-filled' : 'heart'" :size="18"
                class="block"
                :class="{ 'text-pink fill-pink': isLiked, 'like-animation': isAnimating }"
                :style="{ transition: 'all 0.3s ease' }" />
              <span v-if="displayLikeCount" class="ml-1 text-[12px] font-bold leading-[12px]" :class="{ 'text-pink': isLiked }">{{
                displayLikeCount }}</span>
            </div>
          </div>
          <div
            class="text-[12px] overflow-hidden leading-tight transition-all duration-300 ease-in-out text-white opacity-70"
            :style="{
              lineHeight: '1.2em',
              maxHeight: isHovered ? '200px' : '3.6em',
              display: '-webkit-box',
              WebkitLineClamp: isHovered ? 'unset' : 3,
              WebkitBoxOrient: 'vertical',
            }">
            <div v-if="roleData.age || roleData.description">
              <span v-if="roleData.age">{{ roleData.age }}</span>
              <span v-if="roleData.age && roleData.description">, </span>
              <span v-if="roleData.description">{{ roleData.description }}</span>
            </div>
          </div>
        </div>
      </template>
    </BottomOverlay>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, nextTick } from "vue";
import BottomOverlay from "@/components/BottomOverlay/index.vue";
import SvgIcon from "@/components/SvgIcon/index.vue";
import { HomeListData } from "@/api/home/type";
import { likeCompanion, cancelLikeCompanion } from "@/api/home/index";
import { useGlobalStore } from "@/stores/global/global";
import { useAuthStore } from "@/stores/auth";
import { showLoginModal } from "@/utils/authModal";
import { useMediaProtection } from "@/utils/mediaProtection";
import { useI18n } from 'vue-i18n';

const { t } = useI18n();

const props = defineProps<{
  roleData: HomeListData;
}>();

const badgeLevel = computed(() => {
  const raw = (props.roleData.level ?? "").toString().trim().toUpperCase();
  const compact = raw.replace(/\s+/g, "");
  if (!compact) return "";
  if (/^V?2$/i.test(compact)) return "V2";
  return "";
});

const shouldShowLevelBadge = computed(() => badgeLevel.value === "V2");

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
isLiked.value = props.roleData.liked || false;
likeCount.value = props.roleData.interaction_number || 0;

// 使用媒体保护功能
const { protectElement } = useMediaProtection();

// 在组件挂载后为视频元素添加保护
onMounted(async () => {
  await nextTick();
  if (videoRef.value) {
    protectElement(videoRef.value);
  }
});

// 播放视频的通用方法
const playVideo = () => {
  setTimeout(() => {
    if (videoRef.value) {
      videoRef.value.play().catch(console.error);
    }
  }, 50);
};

// 停止视频的通用方法
const stopVideo = () => {
  if (videoRef.value) {
    videoRef.value.pause();
    videoRef.value.currentTime = 0;
  }
};

// 鼠标进入事件 (桌面端)
const handleMouseEnter = () => {
  if (!globalStore.isMobile) {
    isHovered.value = true;
    playVideo();
  }
};

// 鼠标离开事件 (桌面端)
const handleMouseLeave = () => {
  if (!globalStore.isMobile) {
    isHovered.value = false;
    stopVideo();
  }
};

// 触摸开始事件 (移动端长按)
const handleTouchStart = () => {
  if (globalStore.isMobile && props.roleData.cover_video_url) {
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

// 控制动画的响应式变量
const isAnimating = ref(false);

// 处理点赞点击事件
const handleLikeClick = async () => {
  // 检查用户是否已登录
  const authStore = useAuthStore();
  if (!authStore.isLoggedIn) {
    // 未登录则显示登录模态框
    showLoginModal('login');
    return;
  }

  const previousLikedState = isLiked.value;
  const previousLikeCount = likeCount.value;
  
  // 乐观更新UI
  isLiked.value = !isLiked.value;
  likeCount.value = isLiked.value ? likeCount.value + 1 : likeCount.value - 1;

  // 触发动画
  isAnimating.value = true;
  setTimeout(() => {
    isAnimating.value = false;
  }, 300);
  
  try {
    // 调用相应的点赞API
    if (isLiked.value) {
      await likeCompanion(props.roleData.id);
    } else {
      await cancelLikeCompanion(props.roleData.id);
    }
  } catch (error) {
    // 如果API调用失败，回滚UI状态
    isLiked.value = previousLikedState;
    likeCount.value = previousLikeCount;
    console.error('点赞操作失败:', error);
  }
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
