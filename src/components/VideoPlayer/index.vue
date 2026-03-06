<template>
  <div ref="playerWrapperRef" :class="wrapperClass" @mouseenter="handleMouseEnter" @mouseleave="handleMouseLeave"
    @mousemove="handleMouseMove">
    <video v-if="hasSource && !isError" ref="videoElement" :class="videoClass" :style="videoStyle"
      :src="isHlsJsActive ? undefined : (src || undefined)" :loop="loop" :muted="muted" :autoplay="autoplay"
      :preload="isMobileDevice() ? 'metadata' : preload" :poster="poster" :playsinline="playsinline"
      :webkit-playsinline="playsinline" disablepictureinpicture :controlslist="controlsList" @click="togglePlay"
      @loadeddata="handleLoadedData" @loadedmetadata="handleLoadedMetadata" @progress="handleProgress"
      @timeupdate="handleTimeUpdate" @play="handlePlay" @pause="handlePause" @volumechange="handleVolumeChange"
      @error="handleError" @contextmenu.prevent="disableContextMenu ? $event.preventDefault() : undefined" />

    <button v-if="isInlineFullscreen"
      class="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-colors"
      type="button" :aria-label="exitFullscreenLabel" :title="exitFullscreenLabel" @click.stop="exitInlineFullscreen">
      <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
        <path
          d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
      </svg>
    </button>

    <div v-if="isLoading" class="absolute inset-0 flex flex-col items-center justify-center space-y-3">
      <n-spin size="medium" />
      <span class="text-sm">{{ loadingText }}</span>
    </div>

    <div v-else-if="isError" class="absolute inset-0 flex flex-col items-center justify-center space-y-3 ">
      <slot name="error-icon">
        <n-icon size="32">
          <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"
              fill="currentColor" />
            <path d="M12 2L10.59 3.41L13.17 6L10.59 8.59L12 10L16 6L12 2Z" fill="currentColor" opacity="0.6" />
          </svg>
        </n-icon>
      </slot>
      <span class="text-sm text-center px-4">{{ errorText }}</span>
      <BabeButton v-if="showRetry" size="small" secondary @click="emitRetry">
        {{ retryText }}
      </BabeButton>
    </div>

    <transition name="fade-in-up">
      <div v-if="showControls" class="video-controls">
        <div class="controls-row">
          <div class="controls-left">
            <button class="control-button" type="button" :aria-label="playPauseLabel" :title="playPauseLabel"
              @click.stop="togglePlay">
              <span v-if="!isPlaying">
                <SvgIcon iconClass="play" :size="12" />
              </span>
              <span v-else>
                <SvgIcon iconClass="pause" :size="14" />
              </span>
            </button>
            <button class="control-button" type="button" :aria-label="muteToggleLabel" :title="muteToggleLabel"
              @click.stop="toggleMute">
              <span v-if="isMuted">
                <SvgIcon iconClass="mute" :size="14" />
              </span>
              <span v-else>
                <SvgIcon iconClass="unmute" :size="14" />
              </span>
            </button>
            <div class="time-label">
              {{ formattedCurrentTime }} / {{ formattedDuration }}
            </div>
          </div>
          <div class="controls-right">
            <n-dropdown class="w-24" v-if="showQualitySelector" trigger="click" placement="top" :to="dropdownTo"
              :options="qualityMenuItems" :show="isQualityDropdownOpen" @update:show="handleQualityDropdownShowUpdate"
              @select="handleQualitySelect" @click.stop>
              <n-button text @click.stop>{{ qualityButtonText }}</n-button>
            </n-dropdown>
            <button class="control-button" type="button" :aria-label="fullscreenLabel" :title="fullscreenLabel"
              @click.stop="enterFullscreen">
              <SvgIcon iconClass="expand" :size="14" />
            </button>
          </div>
        </div>
        <div class="progress-row">
          <input class="progress-bar" type="range" min="0" max="100" step="0.1" :value="displayedProgress"
            :style="progressBarStyle" :aria-label="progressLabel" @input.stop="handleProgressInput"
            @change.stop="handleProgressChange" @click.stop @pointerdown.stop @touchstart.stop />
        </div>
      </div>
    </transition>
  </div>

  <!-- 自定义全屏模式 -->
  <teleport to="body">
    <transition name="fade-in">
      <div v-if="isCustomFullscreen" ref="fullscreenWrapperRef"
        class="fixed inset-0 z-[9999] bg-black/90 backdrop-blur-sm flex items-center justify-center"
        @click.stop="exitCustomFullscreen" @keydown.esc="exitCustomFullscreen">
        <!-- 退出按钮 -->
        <button
          class="absolute top-6 right-6 z-10 w-10 h-10 rounded-full bg-white/10 backdrop-blur-md text-white flex items-center justify-center hover:bg-white/20 transition-colors"
          type="button" :aria-label="exitFullscreenLabel" :title="exitFullscreenLabel"
          @click.stop="exitCustomFullscreen">
          <svg viewBox="0 0 24 24" class="w-5 h-5 fill-current">
            <path
              d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
          </svg>
        </button>

        <!-- 视频容器 -->
        <div class="relative w-full h-full flex items-center justify-center p-4" @click.stop="togglePlay"
          @mousemove="handleMouseMove" @contextmenu.prevent @dragstart.prevent @selectstart.prevent>
          <video v-if="hasSource && !isError" ref="fullscreenVideoElement"
            class="max-w-full max-h-full object-contain select-none h-full w-full" :style="fullscreenVideoStyle"
            :src="isHlsJsActive ? undefined : (src || undefined)" :loop="loop" :muted="muted" :autoplay="isPlaying"
            :preload="preload" :poster="poster" :playsinline="playsinline" :webkit-playsinline="playsinline"
            :controls="false" controlslist="nodownload nofullscreen noremoteplayback" disablepictureinpicture
            @contextmenu.prevent @loadeddata="handleFullscreenLoadedData"
            @loadedmetadata="handleFullscreenLoadedMetadata" @progress="handleProgress"
            @timeupdate="handleFullscreenTimeUpdate" @play="handleFullscreenPlay" @pause="handleFullscreenPause"
            @volumechange="handleFullscreenVolumeChange" @error="handleFullscreenError"
            @ended="handleFullscreenEnded" />

          <!-- 全屏模式下的加载状态 -->
          <div v-if="isFullscreenLoading" class="absolute inset-0 flex items-center justify-center">
            <n-spin size="large" />
          </div>

          <!-- 全屏模式下的错误状态 -->
          <div v-else-if="isFullscreenError"
            class="absolute inset-0 flex flex-col items-center justify-center text-white">
            <n-icon size="48" class="mb-4">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M21 19V5C21 3.9 20.1 3 19 3H5C3.9 3 3 3.9 3 5V19C3 20.1 3.9 21 5 21H19C20.1 21 21 20.1 21 19ZM8.5 13.5L11 16.51L14.5 12L19 18H5L8.5 13.5Z"
                  fill="currentColor" />
              </svg>
            </n-icon>
            <span class="text-lg mb-4">{{ errorText }}</span>
            <BabeButton @click="exitCustomFullscreen">
              {{ retryText }}
            </BabeButton>
          </div>
        </div>
        <transition name="fade-in-up">
          <div v-if="showControls" class="video-controls" @click.stop @pointerdown.stop @touchstart.stop>
            <div class="controls-row">
              <div class="controls-left">
                <button class="control-button" type="button" :aria-label="playPauseLabel" :title="playPauseLabel"
                  @click.stop="togglePlay">
                  <span v-if="!isPlaying">
                    <SvgIcon iconClass="play" :size="12" />
                  </span>
                  <span v-else>
                    <SvgIcon iconClass="pause" :size="14" />
                  </span>
                </button>
                <button class="control-button" type="button" :aria-label="muteToggleLabel" :title="muteToggleLabel"
                  @click.stop="toggleMute">
                  <span v-if="isMuted">
                    <SvgIcon iconClass="mute" :size="14" />
                  </span>
                  <span v-else>
                    <SvgIcon iconClass="unmute" :size="14" />
                  </span>
                </button>
                <div class="time-label">{{ formattedCurrentTime }} / {{ formattedDuration }}</div>
              </div>
              <div class="controls-right">
                <n-dropdown v-if="showQualitySelector" trigger="click" placement="top" :to="dropdownTo"
                  :options="qualityMenuItems" :show="isFullscreenQualityDropdownOpen"
                  @update:show="handleFullscreenQualityDropdownShowUpdate" @select="handleQualitySelect" @click.stop>
                  <n-button text @click.stop>{{ qualityButtonText }}</n-button>
                </n-dropdown>
                <button class="control-button" type="button" :aria-label="exitFullscreenLabel"
                  :title="exitFullscreenLabel" @click.stop="exitCustomFullscreen">
                  <SvgIcon iconClass="expand" :size="14" />
                </button>
              </div>
            </div>
            <div class="progress-row">
              <input class="progress-bar" type="range" min="0" max="100" step="0.1" :value="displayedProgress"
                :style="progressBarStyle" :aria-label="progressLabel" @input.stop="handleProgressInput"
                @change.stop="handleProgressChange" @click.stop @pointerdown.stop @touchstart.stop />
            </div>
          </div>
        </transition>
      </div>
    </transition>
  </teleport>
</template>

<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick, readonly } from "vue";
import { NButton, NIcon, NSpin, NDropdown } from "naive-ui";
import { useI18n } from "vue-i18n";
import BabeButton from "@/components/BabeButton/index.vue";
import Hls from "hls.js";

const props = withDefaults(defineProps<{
  src?: string | null;
  loop?: boolean;
  muted?: boolean;
  autoplay?: boolean;
  preload?: "auto" | "metadata" | "none";
  playsinline?: boolean;
  controlsList?: string;
  poster?: string;
  disableContextMenu?: boolean;
  loading?: boolean;
  error?: boolean;
  showRetry?: boolean;
  retryText?: string;
  loadingText?: string;
  errorText?: string;
  controlsHideDelay?: number;
}>(), {
  src: null,
  loop: false,
  muted: false,
  autoplay: false,
  preload: "metadata",
  playsinline: true,
  controlsList: "nodownload",
  disableContextMenu: true,
  loading: undefined,
  error: undefined,
  showRetry: false,
  controlsHideDelay: 2500,
});

const emit = defineEmits<{
  (event: "retry"): void;
  (event: "loadeddata", payload: Event): void;
  (event: "loadedmetadata", payload: Event): void;
  (event: "timeupdate", payload: Event): void;
  (event: "play", payload: Event): void;
  (event: "pause", payload: Event): void;
  (event: "volumechange", payload: Event): void;
  (event: "error", payload: Event): void;
}>();

const { t } = useI18n();

const videoElement = ref<HTMLVideoElement | null>(null);
const fullscreenVideoElement = ref<HTMLVideoElement | null>(null);
const playerWrapperRef = ref<HTMLElement | null>(null);
const fullscreenWrapperRef = ref<HTMLElement | null>(null);
const internalLoading = ref(false);
const internalError = ref(false);
const controlsVisible = ref(true);
const controlsHideTimer = ref<number | null>(null);
const isPointerInPlayer = ref(false);
const isQualityDropdownOpen = ref(false);
const isFullscreenQualityDropdownOpen = ref(false);
const isPlaying = ref(false);
const isMuted = ref(props.muted);
const currentTime = ref(0);
const duration = ref(0);
const bufferedEnd = ref(0);
const scrubPercentage = ref<number | null>(null);
const pendingSeekPercentage = ref<number | null>(null);

// 自定义全屏相关状态
const isCustomFullscreen = ref(false);
const isInlineFullscreen = ref(false);
const isFullscreenLoading = ref(false);
const isFullscreenError = ref(false);
const fullscreenVideoStyle = ref({});
const isPortraitVideo = ref(false);
const isExitingCustomFullscreen = ref(false);

const hls = ref<Hls | null>(null);
const isHlsJsActive = ref(false);

const qualityVariants = ref<Array<{ value: number; label: string }>>([]);
const selectedQuality = ref<number>(-1);

const loadingText = computed(() => props.loadingText ?? t("components.videoPlayer.loading"));
const errorText = computed(() => props.errorText ?? t("components.videoPlayer.error"));
const retryText = computed(() => props.retryText ?? t("components.videoPlayer.retry"));

const hasSource = computed(() => typeof props.src === "string" && props.src.length > 0);

const isLoading = computed(() => {
  if (typeof props.loading === "boolean") return props.loading;
  return internalLoading.value;
});

const isError = computed(() => {
  if (typeof props.error === "boolean") return props.error;
  return internalError.value;
});

const showControls = computed(() => {
  if (isMobileDevice()) return true;
  if (!hasSource.value || isError.value) return false;
  if (!isPlaying.value) return true;
  return controlsVisible.value;
});

const wrapperClass = computed(() => [
  "relative w-full h-full card-content flex items-center justify-center",
  isInlineFullscreen.value ? "fixed inset-0 z-[9999] bg-black" : ""
]);

const videoClass = computed(() => "w-full h-full");

const videoStyle = computed<Record<string, string>>(() => {
  const isContainMode = isInlineFullscreen.value || isMobileDevice() || isPortraitVideo.value;
  return {
    objectFit: isContainMode ? "contain" : "cover",
    objectPosition: "center",
    backgroundColor: isContainMode ? "#000" : "transparent",
  };
});

const progress = computed(() => {
  if (!Number.isFinite(duration.value) || duration.value <= 0) return 0;
  return Math.min(100, Math.max(0, (currentTime.value / duration.value) * 100));
});

const displayedProgress = computed(() => scrubPercentage.value ?? progress.value);

const playPauseLabel = computed(() =>
  isPlaying.value ? t("components.videoPlayer.pause") : t("components.videoPlayer.play")
);

const muteToggleLabel = computed(() =>
  isMuted.value ? t("components.videoPlayer.unmute") : t("components.videoPlayer.mute")
);

const fullscreenLabel = computed(() => t("components.videoPlayer.fullscreen"));
const exitFullscreenLabel = computed(() => t("components.videoPlayer.exitFullscreen"));

const qualityLabel = computed(() => t("components.videoPlayer.quality"));
const qualityAutoLabel = computed(() => t("components.videoPlayer.qualityAuto"));

const showQualitySelector = computed(() => isHlsJsActive.value && qualityVariants.value.length > 1);

const qualityMenuItems = computed(() => {
  return [
    { key: -1, label: qualityAutoLabel.value },
    ...qualityVariants.value.map(v => ({ key: v.value, label: v.label }))
  ];
});

const qualityButtonText = computed(() => {
  if (selectedQuality.value === -1) return qualityAutoLabel.value;
  const hit = qualityVariants.value.find(i => i.value === selectedQuality.value);
  return hit?.label ?? qualityAutoLabel.value;
});

const dropdownTo = computed(() => {
  if (isCustomFullscreen.value && fullscreenWrapperRef.value) {
    return fullscreenWrapperRef.value;
  }
  return playerWrapperRef.value ?? 'body';
});

const progressLabel = computed(() => t("components.videoPlayer.scrub"));

const formattedCurrentTime = computed(() => formatTime(currentTime.value));
const formattedDuration = computed(() => formatTime(duration.value));

const handleQualitySelect = (key: number) => {
  selectedQuality.value = key;
  if (hls.value) {
    hls.value.currentLevel = key;
  }
  isQualityDropdownOpen.value = false;
  showControlsTemporarily();
};

const handleQualityDropdownShowUpdate = (show: boolean) => {
  isQualityDropdownOpen.value = show;
  if (show) {
    controlsVisible.value = true;
    clearControlsHideTimer();
    return;
  }

  if (isMobileDevice()) return;

  if (!isPointerInPlayer.value) {
    clearControlsHideTimer();
    controlsVisible.value = false;
    return;
  }

  showControlsTemporarily();
};

const handleFullscreenQualityDropdownShowUpdate = (show: boolean) => {
  isFullscreenQualityDropdownOpen.value = show;
  if (show) {
    controlsVisible.value = true;
    clearControlsHideTimer();
    return;
  }

  if (isMobileDevice()) return;

  if (!isPointerInPlayer.value) {
    clearControlsHideTimer();
    controlsVisible.value = false;
    return;
  }

  showControlsTemporarily();
};

const buildQualityVariants = (levels: any[]) => {
  const variants = levels
    .map((level, index) => {
      const height = typeof level?.height === "number" ? level.height : null;
      const bitrate = typeof level?.bitrate === "number" ? level.bitrate : null;

      let label = "";
      if (height && height > 0) {
        label = `${height}p`;
      } else if (bitrate && bitrate > 0) {
        label = `${Math.round(bitrate / 1000)}kbps`;
      } else {
        label = String(index + 1);
      }

      return { value: index, label };
    })
    .filter(i => i.label.length > 0);

  qualityVariants.value = variants;
  if (selectedQuality.value !== -1 && selectedQuality.value >= variants.length) {
    selectedQuality.value = -1;
  }
};

// handleDocumentClick removed

const bufferedProgress = computed(() => {
  if (!Number.isFinite(duration.value) || duration.value <= 0) return 0;
  const percentage = (bufferedEnd.value / duration.value) * 100;
  return Math.min(100, Math.max(0, percentage));
});

const progressBarStyle = computed<Record<string, string>>(() => {
  const percentage = displayedProgress.value;
  const bufferedPercentage = Math.max(bufferedProgress.value, percentage);
  return {
    "--progress": `${percentage}%`,
    "--buffered": `${bufferedPercentage}%`,
  };
});

const formatTime = (seconds: number) => {
  if (!Number.isFinite(seconds) || seconds < 0) return "00:00";
  const totalSeconds = Math.floor(seconds);
  const minutes = Math.floor(totalSeconds / 60);
  const secs = totalSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
};

// 计算全屏视频的最佳显示尺寸
const calculateFullscreenVideoSize = (videoWidth: number, videoHeight: number) => {
  const containerWidth = window.innerWidth * 0.9; // 90vw
  const containerHeight = window.innerHeight * 0.9; // 90vh

  const videoAspectRatio = videoWidth / videoHeight;
  const containerAspectRatio = containerWidth / containerHeight;

  let finalWidth, finalHeight;

  if (videoAspectRatio > containerAspectRatio) {
    // 视频更宽，以宽度为准
    finalWidth = Math.min(containerWidth, videoWidth);
    finalHeight = finalWidth / videoAspectRatio;
  } else {
    // 视频更高，以高度为准
    finalHeight = Math.min(containerHeight, videoHeight);
    finalWidth = finalHeight * videoAspectRatio;
  }

  return {
    width: `${finalWidth}px`,
    height: `${finalHeight}px`,
    maxWidth: '90vw',
    maxHeight: '90vh'
  };
};

const clearControlsHideTimer = () => {
  if (!controlsHideTimer.value) return;
  window.clearTimeout(controlsHideTimer.value);
  controlsHideTimer.value = null;
};

const scheduleControlsHide = () => {
  clearControlsHideTimer();
  if (!isPlaying.value) return;
  if (isMobileDevice()) return;
  if (isQualityDropdownOpen.value) return;
  if (isFullscreenQualityDropdownOpen.value) return;
  controlsHideTimer.value = window.setTimeout(() => {
    controlsVisible.value = false;
    controlsHideTimer.value = null;
  }, props.controlsHideDelay);
};

const showControlsTemporarily = () => {
  controlsVisible.value = true;
  scheduleControlsHide();
};

const resetState = () => {
  clearControlsHideTimer();
  isPlaying.value = false;
  isMuted.value = props.muted;
  currentTime.value = 0;
  duration.value = 0;
  bufferedEnd.value = 0;
  scrubPercentage.value = null;
  pendingSeekPercentage.value = null;
  controlsVisible.value = true;
};

const updateBufferedEnd = (video: HTMLVideoElement | null) => {
  if (!video) {
    bufferedEnd.value = 0;
    return;
  }

  const ranges = video.buffered;
  let end = 0;
  try {
    for (let i = 0; i < ranges.length; i += 1) {
      const rangeEnd = ranges.end(i);
      if (Number.isFinite(rangeEnd)) end = Math.max(end, rangeEnd);
    }
  } catch {
    end = 0;
  }

  if (Number.isFinite(video.duration) && video.duration > 0) {
    end = Math.min(end, video.duration);
  }

  bufferedEnd.value = end;
};

const handleProgress = (event: Event) => {
  const video = getActiveVideoElement();
  updateBufferedEnd(video);
};

const getActiveVideoElement = () => {
  if (isCustomFullscreen.value && fullscreenVideoElement.value) {
    return fullscreenVideoElement.value;
  }
  return videoElement.value;
};

const syncVideoState = (updater: (video: HTMLVideoElement) => void) => {
  const activeVideo = getActiveVideoElement();
  if (!activeVideo) return;
  updater(activeVideo);
  if (isCustomFullscreen.value && videoElement.value && videoElement.value !== activeVideo) {
    updater(videoElement.value);
  }
};

const togglePlay = () => {
  const video = getActiveVideoElement();
  if (!video) return;
  if (video.paused || video.ended) {
    void video.play();
  } else {
    video.pause();
  }
  showControlsTemporarily();
};

const toggleMute = () => {
  const video = getActiveVideoElement();
  if (!video) return;
  const nextMuted = !video.muted;
  syncVideoState((target) => {
    target.muted = nextMuted;
  });
  isMuted.value = nextMuted;
  showControlsTemporarily();
};

// 检测是否为移动设备（多种检测方式确保准确性）
const isMobileDevice = () => {
  // 1. User-Agent检测
  const userAgent = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);

  // 2. 屏幕尺寸检测
  const isSmallScreen = window.matchMedia('(max-width: 768px)').matches;

  // 3. 触摸支持检测
  const hasTouchSupport = 'ontouchstart' in window && navigator.maxTouchPoints > 0;

  // 任何一个条件满足都认为是移动设备
  return userAgent || isSmallScreen || hasTouchSupport;
};

const isTelegramInApp = () => {
  const ua = navigator.userAgent || "";
  return /Telegram/i.test(ua) || Boolean((window as any).Telegram?.WebApp);
};

const isAndroidDevice = () => /Android/i.test(navigator.userAgent);

const setPageOverflow = (value: string) => {
  document.body.style.overflow = value;
  document.documentElement.style.overflow = value;
};

const enterFullscreen = async () => {
  const video = videoElement.value;
  if (!video) return;

  if (isMobileDevice() && (isTelegramInApp() || isAndroidDevice())) {
    await enterInlineFullscreen();
    return;
  }

  await enterCustomFullscreen();
};

// 进入自定义全屏模式（仅PC端）
const enterCustomFullscreen = async () => {
  isCustomFullscreen.value = true;
  isFullscreenLoading.value = true;
  isFullscreenError.value = false;

  setPageOverflow('hidden');

  await nextTick();

  // HLS 切换到全屏元素
  if (hls.value && fullscreenVideoElement.value) {
    try {
      hls.value.detachMedia();
      hls.value.attachMedia(fullscreenVideoElement.value);
    } catch (error) {
      isFullscreenError.value = true;
      console.warn('Failed to attach HLS to fullscreen video:', error);
    }
  }

  // 同步播放状态和时间位置
  if (fullscreenVideoElement.value && videoElement.value) {
    fullscreenVideoElement.value.currentTime = videoElement.value.currentTime;
    if (isPlaying.value) {
      try {
        await fullscreenVideoElement.value.play();
      } catch (error) {
        console.warn('Failed to play video in fullscreen:', error);
      }
    }
  }

  // 添加窗口大小变化监听器
  window.addEventListener('resize', handleWindowResize);
};

// 退出自定义全屏模式
const exitCustomFullscreen = async () => {
  if (isExitingCustomFullscreen.value) return;
  isExitingCustomFullscreen.value = true;

  const fullscreenVideo = fullscreenVideoElement.value;
  const inlineVideo = videoElement.value;
  const wasPlaying = fullscreenVideo ? !fullscreenVideo.paused : false;
  const resumeTime = fullscreenVideo?.currentTime ?? inlineVideo?.currentTime ?? 0;

  if (fullscreenVideo) {
    try {
      fullscreenVideo.pause();
    } catch {
      // ignore
    }
  }

  if (hls.value) {
    try {
      hls.value.detachMedia();
    } catch (error) {
      console.warn('Failed to detach HLS from fullscreen video:', error);
    }
  }

  isCustomFullscreen.value = false;
  isFullscreenLoading.value = false;
  isFullscreenError.value = false;
  fullscreenVideoStyle.value = {};

  setPageOverflow('');
  window.removeEventListener('resize', handleWindowResize);

  try {
    if (inlineVideo) {
      inlineVideo.currentTime = resumeTime;

      if (hls.value) {
        try {
          hls.value.attachMedia(inlineVideo);
        } catch (error) {
          console.warn('Failed to attach HLS back to inline video:', error);
        }
      }

      if (wasPlaying) {
        try {
          await inlineVideo.play();
        } catch (error) {
          console.warn('Failed to resume video after exiting fullscreen:', error);
        }
      }
    }
  } finally {
    isExitingCustomFullscreen.value = false;
  }
};


// 处理窗口大小变化
const handleWindowResize = () => {
  if (isCustomFullscreen.value && fullscreenVideoElement.value) {
    const video = fullscreenVideoElement.value;
    if (video.videoWidth && video.videoHeight) {
      if (isMobileDevice()) {
        fullscreenVideoStyle.value = {};
      } else {
        fullscreenVideoStyle.value = calculateFullscreenVideoSize(video.videoWidth, video.videoHeight);
      }
    }
  }
};

const enterInlineFullscreen = async () => {
  isInlineFullscreen.value = true;
  setPageOverflow('hidden');
  await nextTick();
  if (videoElement.value && isPlaying.value) {
    try {
      await videoElement.value.play();
    } catch (error) {
      console.warn('Failed to play video in inline fullscreen:', error);
    }
  }
};

const exitInlineFullscreen = () => {
  isInlineFullscreen.value = false;
  setPageOverflow('');
};

const handleMouseEnter = () => {
  isPointerInPlayer.value = true;
  showControlsTemporarily();
};

const handleMouseLeave = () => {
  isPointerInPlayer.value = false;
  if (isMobileDevice()) return;
  if (isQualityDropdownOpen.value) return;
  if (isFullscreenQualityDropdownOpen.value) return;
  clearControlsHideTimer();
  controlsVisible.value = false;
};

const handleMouseMove = () => {
  isPointerInPlayer.value = true;
  if (!isPlaying.value) return;
  showControlsTemporarily();
};

const handleProgressInput = (event: Event) => {
  const target = event.target as HTMLInputElement | null;
  if (!target) return;
  const percentage = Number(target.value);
  scrubPercentage.value = percentage;
  const video = getActiveVideoElement();
  if (!video || !Number.isFinite(video.duration) || video.duration <= 0) {
    pendingSeekPercentage.value = percentage;
    showControlsTemporarily();
    return;
  }
  const nextTime = (percentage / 100) * video.duration;
  syncVideoState((targetVideo) => {
    targetVideo.currentTime = nextTime;
  });
  currentTime.value = nextTime;
  updateBufferedEnd(video);
  showControlsTemporarily();
};

const handleProgressChange = () => {
  if (pendingSeekPercentage.value === null) {
    scrubPercentage.value = null;
  }
};

const applyPendingSeek = (video: HTMLVideoElement | null) => {
  if (pendingSeekPercentage.value === null) return;
  if (!video || !Number.isFinite(video.duration) || video.duration <= 0) return;
  const nextTime = (pendingSeekPercentage.value / 100) * video.duration;
  syncVideoState((targetVideo) => {
    targetVideo.currentTime = nextTime;
  });
  currentTime.value = nextTime;
  pendingSeekPercentage.value = null;
  scrubPercentage.value = null;
  updateBufferedEnd(video);
};

const handleLoadedData = (event: Event) => {
  internalLoading.value = false;
  internalError.value = false;
  emit("loadeddata", event);
};

const handleLoadedMetadata = (event: Event) => {
  const video = videoElement.value;
  if (video?.videoWidth && video.videoHeight) {
    isPortraitVideo.value = video.videoHeight > video.videoWidth;
  }
  duration.value = video?.duration ?? 0;
  isMuted.value = Boolean(video?.muted);
  currentTime.value = video?.currentTime ?? 0;
  updateBufferedEnd(video);
  applyPendingSeek(video);

  // 移动端在元数据加载后触发首帧预加载
  if (isMobileDevice() && video) {
    // 确保显示首帧
    if (video.currentTime === 0) {
      video.currentTime = 0.001;
    }
  }

  emit("loadedmetadata", event);
};

const handleTimeUpdate = (event: Event) => {
  const video = videoElement.value;
  if (!video) return;
  currentTime.value = video.currentTime;
  updateBufferedEnd(video);
  emit("timeupdate", event);
};

const handlePlay = (event: Event) => {
  isPlaying.value = true;
  showControlsTemporarily();
  emit("play", event);
};

const handlePause = (event: Event) => {
  isPlaying.value = false;
  clearControlsHideTimer();
  controlsVisible.value = true;
  emit("pause", event);
};

const handleVolumeChange = (event: Event) => {
  const video = videoElement.value;
  isMuted.value = Boolean(video?.muted);
  showControlsTemporarily();
  emit("volumechange", event);
};

const handleError = (event: Event) => {
  internalError.value = true;
  resetState();
  emit("error", event);
};

const emitRetry = () => {
  emit("retry");
};

// 全屏模式事件处理器
const handleFullscreenLoadedData = (event: Event) => {
  isFullscreenLoading.value = false;
  isFullscreenError.value = false;
};

const handleFullscreenLoadedMetadata = (event: Event) => {
  const video = fullscreenVideoElement.value;
  if (video) {
    if (video.videoWidth && video.videoHeight) {
      isPortraitVideo.value = video.videoHeight > video.videoWidth;
    }
    duration.value = video.duration || duration.value;
    currentTime.value = video.currentTime || currentTime.value;
    // 设置初始音量和静音状态
    video.muted = isMuted.value;

    // 计算并设置视频的最佳显示尺寸
    if (video.videoWidth && video.videoHeight) {
      if (isMobileDevice()) {
        fullscreenVideoStyle.value = {};
      } else {
        fullscreenVideoStyle.value = calculateFullscreenVideoSize(video.videoWidth, video.videoHeight);
      }
    }

    updateBufferedEnd(video);
    applyPendingSeek(video);
  }
};

const handleFullscreenTimeUpdate = (event: Event) => {
  const video = fullscreenVideoElement.value;
  if (!video) return;
  currentTime.value = video.currentTime;
  updateBufferedEnd(video);
};

const handleFullscreenPlay = (event: Event) => {
  isPlaying.value = true;
  showControlsTemporarily();
  // 同步播放状态到原始视频
  if (fullscreenVideoElement.value && videoElement.value) {
    // 同步时间位置
    videoElement.value.currentTime = fullscreenVideoElement.value.currentTime;
    currentTime.value = fullscreenVideoElement.value.currentTime;
  }
  if (videoElement.value && videoElement.value.paused) {
    videoElement.value.play().catch(console.warn);
  }
};

const handleFullscreenPause = (event: Event) => {
  isPlaying.value = false;
  clearControlsHideTimer();
  controlsVisible.value = true;
  // 同步暂停状态到原始视频，同时同步当前时间
  if (fullscreenVideoElement.value && videoElement.value) {
    videoElement.value.currentTime = fullscreenVideoElement.value.currentTime;
    currentTime.value = fullscreenVideoElement.value.currentTime;
  }
  if (videoElement.value && !videoElement.value.paused) {
    videoElement.value.pause();
  }
};

const handleFullscreenVolumeChange = (event: Event) => {
  const video = fullscreenVideoElement.value;
  if (video && videoElement.value) {
    videoElement.value.muted = video.muted;
    isMuted.value = video.muted;
  }
};

const handleFullscreenError = (event: Event) => {
  isFullscreenError.value = true;
  isFullscreenLoading.value = false;
  console.error('Fullscreen video error:', event);
};

const handleFullscreenEnded = (event: Event) => {
  // 视频播放结束后的处理
  if (!props.loop) {
    // 可以选择自动退出全屏或显示重播选项
  }
};

watch(
  () => props.src,
  (newValue) => {
    resetState();

    qualityVariants.value = [];
    selectedQuality.value = -1;

    // 销毁旧实例
    if (hls.value) {
      hls.value.destroy();
      hls.value = null;
    }
    isHlsJsActive.value = false;

    const hasSrc = typeof newValue === "string" && newValue.length > 0;
    if (!hasSrc) {
      internalError.value = false;
      internalLoading.value = false;
      return;
    }

    // HLS Support
    if (newValue.includes('.m3u8') || newValue.includes('playlist')) {
      if (Hls.isSupported()) {
        isHlsJsActive.value = true;

        if (props.loading === undefined) {
          internalLoading.value = true;
        }

        nextTick(() => {
          const video = videoElement.value;
          if (video) {
            hls.value = new Hls({
              enableWorker: true,
              lowLatencyMode: false,
              maxBufferLength: 10,
              maxMaxBufferLength: 30,
              startLevel: -1,
              abrEwmaDefaultEstimate: 500000,
              startFragPrefetch: true,
              testBandwidth: false,
            } as any);
            hls.value.loadSource(newValue);
            hls.value.attachMedia(video);

            hls.value.on(Hls.Events.MANIFEST_PARSED, (event, data) => {
              buildQualityVariants((data as any)?.levels || []);
              if (props.autoplay) {
                video.play().catch(() => { });
              }
            });

            hls.value.on(Hls.Events.ERROR, (event, data) => {
              if (data.fatal) {
                switch (data.type) {
                  case Hls.ErrorTypes.NETWORK_ERROR:
                    hls.value?.startLoad();
                    break;
                  case Hls.ErrorTypes.MEDIA_ERROR:
                    hls.value?.recoverMediaError();
                    break;
                  default:
                    internalError.value = true;
                    hls.value?.destroy();
                    qualityVariants.value = [];
                    selectedQuality.value = -1;
                    break;
                }
              }
            });
          }
        });

        return;
      }
    }

    if (props.loading === undefined) {
      internalLoading.value = true;
    }
    if (props.error === undefined) {
      internalError.value = false;
    }

    // src变化时，如果是移动端，等待DOM更新后预加载首帧
    if (isMobileDevice() && hasSrc) {
      nextTick(() => {
        // 稍微延迟以确保video元素已更新src
        setTimeout(preloadMobileFirstFrame, 50);
      });
    }
  },
  { immediate: true }
);

watch(
  () => props.muted,
  (value) => {
    const video = videoElement.value;
    if (!video) return;
    video.muted = value;
    isMuted.value = value;
  }
);

watch(
  () => props.loop,
  (value) => {
    if (videoElement.value) {
      videoElement.value.loop = value;
    }
  }
);

const play = async () => {
  if (!videoElement.value) return;
  await videoElement.value.play();
  showControlsTemporarily();
};

const pause = () => {
  if (!videoElement.value) return;
  videoElement.value.pause();
  clearControlsHideTimer();
  controlsVisible.value = true;
};

const seek = (seconds: number) => {
  if (!videoElement.value || !Number.isFinite(seconds)) return;
  videoElement.value.currentTime = Math.min(Math.max(seconds, 0), duration.value || seconds);
  currentTime.value = videoElement.value.currentTime;
};

const getVideoElement = () => videoElement.value;

// 移动端首帧预加载优化
const preloadMobileFirstFrame = () => {
  if (!isMobileDevice() || !videoElement.value || !hasSource.value) {
    return;
  }

  const video = videoElement.value;

  // 设置加载策略：移动端优先加载元数据和首帧
  if (video.readyState >= 1) { // HAVE_METADATA
    // 已有元数据，尝试预加载一小段数据以显示首帧
    if (video.currentTime === 0) {
      // 通过设置极小的currentTime触发首帧渲染
      video.currentTime = 0.001;
    }
  } else {
    // 还没有元数据，监听loadedmetadata事件
    const handleLoadedMetadata = () => {
      // 设置到视频开头并触发首帧加载
      video.currentTime = 0.001;
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
    };
    video.addEventListener('loadedmetadata', handleLoadedMetadata, { once: true });
  }
};

// 组件挂载后预加载移动端首帧
onMounted(() => {
  if (isMobileDevice() && hasSource.value) {
    // 等待video元素渲染完成后立即预加载
    nextTick(() => {
      preloadMobileFirstFrame();
    });
  }
});

onBeforeUnmount(() => {
  if (hls.value) {
    hls.value.destroy();
    hls.value = null;
  }
  clearControlsHideTimer();
  // 确保退出自定义全屏模式
  if (isCustomFullscreen.value) {
    exitCustomFullscreen();
  }
  if (isInlineFullscreen.value) {
    exitInlineFullscreen();
  }
});

// 监听ESC键退出全屏和空格键切换播放
watch(isCustomFullscreen, (newValue) => {
  if (newValue) {
    const handleKeydown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        exitCustomFullscreen();
      } else if (event.key === ' ' || event.code === 'Space') {
        event.preventDefault();
        togglePlay();
      }
    };
    document.addEventListener('keydown', handleKeydown);

    // 存储事件监听器引用以便清理
    (exitCustomFullscreen as any)._fullscreenKeyHandler = handleKeydown;
  } else {
    // 移除事件监听器
    const handler = (exitCustomFullscreen as any)._fullscreenKeyHandler;
    if (handler) {
      document.removeEventListener('keydown', handler);
      delete (exitCustomFullscreen as any)._fullscreenKeyHandler;
    }
  }
});

defineExpose({
  play,
  pause,
  seek,
  videoElement: getVideoElement,
  isPlaying: readonly(isPlaying),
});
</script>

<style scoped>
.video-controls {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  padding: 12px 12px 16px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0) 0%, rgba(0, 0, 0, 0.75) 100%);
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #fff;
  pointer-events: auto;
  z-index: 2;
}

.controls-row {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 8px;
  flex-wrap: wrap;
}

.controls-left,
.controls-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.controls-left {
  flex: 1;
  min-width: 0;
}

.control-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 32px;
  height: 32px;
  border-radius: 9999px;
  border: none;
  background: rgba(255, 255, 255, 0.12);
  color: inherit;
  cursor: pointer;
  transition: background 0.2s ease;
}

.control-button svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.control-button:hover {
  background: rgba(255, 255, 255, 0.25);
}



.time-label {
  font-size: 12px;
  opacity: 0.85;
  min-width: 0;
  flex: 1;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.progress-row {
  width: 100%;
}

.progress-bar {
  width: 100%;
  -webkit-appearance: none;
  appearance: none;
  --track-height: 4px;
  --control-height: 4px;
  --thumb-size: 12px;
  height: var(--control-height);
  border-radius: 9999px;
  background: rgba(255, 255, 255, 0.25);
  cursor: pointer;
}

.progress-bar::-webkit-slider-runnable-track {
  height: var(--track-height);
  border-radius: 9999px;
  background: linear-gradient(90deg,
      rgba(255, 255, 255, 0.85) 0%,
      rgba(255, 255, 255, 0.85) var(--progress, 0%),
      rgba(255, 255, 255, 0.45) var(--progress, 0%),
      rgba(255, 255, 255, 0.45) var(--buffered, 0%),
      rgba(255, 255, 255, 0.25) var(--buffered, 0%),
      rgba(255, 255, 255, 0.25) 100%);
}

.progress-bar::-moz-range-track {
  height: var(--track-height);
  border-radius: 9999px;
  background: linear-gradient(90deg,
      rgba(255, 255, 255, 0.85) 0%,
      rgba(255, 255, 255, 0.85) var(--progress, 0%),
      rgba(255, 255, 255, 0.45) var(--progress, 0%),
      rgba(255, 255, 255, 0.45) var(--buffered, 0%),
      rgba(255, 255, 255, 0.25) var(--buffered, 0%),
      rgba(255, 255, 255, 0.25) 100%);
}

.progress-bar::-webkit-slider-thumb {
  -webkit-appearance: none;
  appearance: none;
  width: var(--thumb-size);
  height: var(--thumb-size);
  border-radius: 50%;
  background: #fff;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.25);
  margin-top: calc((var(--track-height) - var(--thumb-size)) / 2);
}

.progress-bar::-moz-range-thumb {
  width: var(--thumb-size);
  height: var(--thumb-size);
  border-radius: 50%;
  background: #fff;
  border: none;
  box-shadow: 0 0 0 4px rgba(255, 255, 255, 0.25);
}

@media (pointer: coarse) {
  .progress-bar {
    --control-height: 28px;
    --thumb-size: 20px;
    background: transparent;
  }

  .progress-bar::-webkit-slider-thumb {
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.25);
  }

  .progress-bar::-moz-range-thumb {
    box-shadow: 0 0 0 6px rgba(255, 255, 255, 0.25);
  }
}

video {
  position: relative;
  z-index: 1;
  display: block;
}

.fade-in-up-enter-active,
.fade-in-up-leave-active {
  transition: opacity 0.2s ease, transform 0.2s ease;
}

.fade-in-up-enter-from,
.fade-in-up-leave-to {
  opacity: 0;
  transform: translateY(10px);
}

.fade-in-enter-active,
.fade-in-leave-active {
  transition: opacity 0.2s ease;
}

.fade-in-enter-from,
.fade-in-leave-to {
  opacity: 0;
}
</style>
