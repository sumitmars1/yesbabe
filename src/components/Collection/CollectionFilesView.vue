<template>
  <div class="h-full flex flex-col">
    <!-- 加载状态 -->
    <div v-if="loading || filesLoading" class="flex-1 flex items-center justify-center">
      <n-spin size="large" />
    </div>

    <!-- 文件展示区域 -->
    <div v-else class="flex-1 overflow-hidden">
      <!-- PC端：左右布局 -->
      <div v-if="!globalStore.isMobile" class="h-full flex gap-4 max-h-[calc(100vh-200px)]">
        <!-- 左侧轮播图 -->
        <div class="shrink-0 flex items-center justify-center p-0 max-h-full">
          <div class="w-[270px] max-h-[calc(100vh-200px)] aspect-[9/16] flex bg-black/5 rounded-xl overflow-hidden">
            <div v-if="files.length > 0" class="w-full h-full relative flex justify-center items-center">
              <CustomCarousel
                :items="files"
                :current-index="currentCarouselIndex"
                :show-arrow="true"
                :show-dots="false"
                :autoplay="autoplayEnabled"
                :interval="6000"
                @update:current-index="handleCarouselChange"
                class="w-full h-full"
              >
                <template #default="{ item: file, index }">
                  <template v-if="fileUrlMap.has(file.uu_id)">
                    <n-image
                      v-if="file.file_type === 'image'"
                      :src="fileUrlMap.get(file.uu_id)"
                      object-fit="cover"
                      width="100%"
                      height="100%"
                      class="w-full h-full pointer-events-auto"
                      preview-disabled
                    />
                    <VideoPlayer
                      v-else-if="file.file_type === 'video'"
                      ref="videoPlayerRef"
                      :src="currentCarouselIndex === index ? (fileUrlMap.get(file.uu_id) || '') : ''"
                      :controls-list="'nodownload'"
                      :disable-context-menu="true"
                      :loop="true"
                      :muted="true"
                      :autoplay="currentCarouselIndex === index"
                      class="w-full h-full pointer-events-auto relative z-10"
                      @play="handleVideoPlay"
                      @pause="handleVideoPause"
                    />
                  </template>
                  <div v-else class="w-full h-full flex items-center justify-center">
                    <n-spin size="large" />
                  </div>
                </template>
              </CustomCarousel>
            </div>
            <div v-else class="h-full flex items-center justify-center text-secondary">
              {{ t('collection.noFiles') }}
            </div>
          </div>
        </div>

        <!-- 右侧缩略图列表 -->
        <div class="flex-1 flex flex-col min-w-0">
          <n-scrollbar 
            class="flex-1 !block [&_.n-scrollbar-rail]:hidden [&_.n-scrollbar-track]:hidden [&_.n-scrollbar-content]:[scrollbar-width:none] [&_.n-scrollbar-content::-webkit-scrollbar]:hidden" 
            content-class="!block"
          >
            <div class="grid grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 pr-2 pb-3 pl-3 pt-1">
              <div
                v-for="file in files"
                :key="file.id"
                class="aspect-[9/16] rounded-lg overflow-hidden cursor-pointer transition-all"
                :class="{
                  'shadow-[0_0_0_4px_var(--c-pink-color)]': currentFile?.id === file.id,
                  'opacity-60 hover:opacity-100': currentFile?.id !== file.id
                }"
                @click="selectFile(file)"
              >
                <template v-if="fileUrlMap.has(file.uu_id)">
                  <n-image
                    v-if="file.file_type === 'image'"
                    :src="fileUrlMap.get(file.uu_id)"
                    object-fit="cover"
                    width="100%"
                    height="100%"
                    preview-disabled
                    class="[&_img]:w-full [&_img]:h-full [&_img]:object-cover"
                  />
                  <div v-else class="w-full h-full relative">
                    <video
                      :src="(fileUrlMap.get(file.uu_id) || '') + '#t=0.001'"
                      class="w-full h-full object-cover"
                      preload="metadata"
                      muted
                      playsinline
                    />
                    <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                      <svg-icon iconClass="play-circle" :size="20" class="text-white" />
                    </div>
                  </div>
                </template>
                <div v-else class="w-full h-full flex items-center justify-center bg-black/10">
                  <n-spin size="small" />
                </div>
              </div>
            </div>
          </n-scrollbar>
        </div>
      </div>

      <!-- 移动端：上下布局 -->
      <div v-else class="h-full flex flex-col">
        <!-- 上方轮播图 - 动态高度适配不同设备 -->
        <div class="w-full bg-black/5 rounded-xl overflow-hidden mb-4" :style="mobileMainImageStyle">
          <div v-if="files.length > 0" class="w-full h-full">
            <CustomCarousel
              :items="files"
              :current-index="currentCarouselIndex"
              :show-arrow="true"
              :show-dots="false"
              :autoplay="autoplayEnabled"
              :interval="6000"
              @update:current-index="handleCarouselChange"
              class="w-full h-full"
            >
              <template #default="{ item: file, index }">
                <template v-if="fileUrlMap.has(file.uu_id)">
                  <n-image
                    v-if="file.file_type === 'image'"
                    :src="fileUrlMap.get(file.uu_id)"
                    object-fit="cover"
                    width="100%"
                    height="100%"
                    class="w-full h-full pointer-events-auto"
                    preview-disabled
                  />
                  <VideoPlayer
                    v-else-if="file.file_type === 'video'"
                    ref="videoPlayerRef"
                    :src="currentCarouselIndex === index ? (fileUrlMap.get(file.uu_id) || '') : ''"
                    :controls-list="'nodownload'"
                    :disable-context-menu="true"
                    :loop="true"
                    :muted="true"
                    :autoplay="currentCarouselIndex === index"
                    class="w-full h-full pointer-events-auto relative z-10"
                    @play="handleVideoPlay"
                    @pause="handleVideoPause"
                  />
                </template>
                <div v-else class="w-full h-full flex items-center justify-center">
                  <n-spin size="large" />
                </div>
              </template>
            </CustomCarousel>
          </div>
          <div v-else class="h-full flex items-center justify-center text-secondary">
            {{ t('collection.noFiles') }}
          </div>
        </div>

        <!-- 下方缩略图滚动列表 -->
        <div class="flex-shrink-0" style="height: 120px;">
          <div class="flex gap-3 overflow-x-auto h-full px-2 pt-2 pb-4 [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
            <div
              v-for="file in files"
              :key="file.id"
              class="flex-shrink-0 w-16 h-24 rounded-lg overflow-hidden cursor-pointer transition-all"
              :class="{
                'shadow-[0_0_0_4px_var(--c-pink-color)]': currentFile?.id === file.id,
                'opacity-60 hover:opacity-100': currentFile?.id !== file.id
              }"
              @click="selectFile(file)"
            >
              <template v-if="fileUrlMap.has(file.uu_id)">
                <n-image
                  v-if="file.file_type === 'image'"
                  :src="fileUrlMap.get(file.uu_id)"
                  object-fit="cover"
                  width="100%"
                  height="100%"
                  preview-disabled
                />
                <div v-else class="w-full h-full relative">
                  <video
                    :src="(fileUrlMap.get(file.uu_id) || '') + '#t=0.001'"
                    class="w-full h-full object-cover"
                    preload="metadata"
                    muted
                    playsinline
                  />
                  <div class="absolute inset-0 flex items-center justify-center bg-black/30">
                    <svg-icon iconClass="play-circle" :size="12" class="text-white" />
                  </div>
                </div>
              </template>
              <div v-else class="w-full h-full flex items-center justify-center bg-black/10">
                <n-spin size="small" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, onBeforeUnmount, computed, onMounted, nextTick } from 'vue'
import { NImage, NSpin, NScrollbar } from 'naive-ui'
import VideoPlayer from '@/components/VideoPlayer/index.vue'
import CustomCarousel from '@/components/CustomCarousel/index.vue'
import type { CollectionFile, CollectionDetail } from '@/api/collection/types'
import { getCollectionFile } from '@/api/chat'
import { useI18n } from 'vue-i18n'
import { useGlobalStore } from '@/stores/global/global'
import { useAuthStore } from '@/stores/auth/index'
import SvgIcon from '@/components/SvgIcon/index.vue'

const { t } = useI18n()
const globalStore = useGlobalStore()
const authStore = useAuthStore()

// 移动端主图动态高度计算
const HEADER_HEIGHT = 64 // Header高度
const THUMBNAIL_HEIGHT = 136 // 底部缩略图区域高度（包含间距和padding,增加了顶部padding）
const MARGIN_BOTTOM = 16 // 主图与缩略图之间的间距
const PAGE_PADDING = 32 // 页面总padding（上下各16px）
const viewportHeight = ref(window.innerHeight)
const mainImageHeight = ref(0)

// 计算主图的最大高度
const calculateMainImageHeight = () => {
  if (!globalStore.isMobile) {
    mainImageHeight.value = 0
    return
  }
  
  // 可用高度 = 视口高度 - Header - 缩略图区域 - 主图底部间距 - 页面padding
  const availableHeight = viewportHeight.value - HEADER_HEIGHT - THUMBNAIL_HEIGHT - MARGIN_BOTTOM - PAGE_PADDING
  const containerWidth = window.innerWidth - 32 // 减去左右padding
  const maxHeightByRatio = (containerWidth * 16) / 9 // 9:16宽高比的最大高度
  
  // 取可用高度和最大宽高比高度中的较小值,确保至少有200px
  mainImageHeight.value = Math.max(200, Math.min(availableHeight, maxHeightByRatio))
}

// 监听窗口大小变化
const handleResize = () => {
  viewportHeight.value = window.innerHeight
  calculateMainImageHeight()
}

onMounted(() => {
  calculateMainImageHeight()
  window.addEventListener('resize', handleResize)
})

// 计算移动端主图容器样式
const mobileMainImageStyle = computed(() => {
  if (!globalStore.isMobile || mainImageHeight.value === 0) {
    return {}
  }
  
  return {
    height: `${mainImageHeight.value}px`,
    maxHeight: `${mainImageHeight.value}px`,
    aspectRatio: '9 / 16'
  }
})

interface Props {
  collection: CollectionDetail | null
  files: CollectionFile[]
  totalFiles: number
  loading?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  loading: false
})


// 当前选中的文件
const currentFile = ref<CollectionFile | null>(null)
const currentFileUrl = ref<string>('')

// 文件加载状态
const filesLoading = ref(false)

// 文件URL缓存 (uu_id -> object URL)
const fileUrlMap = ref<Map<string, string>>(new Map())

// 当前轮播图索引
const currentCarouselIndex = ref(0)

// 当前播放的视频ID，用于跟踪视频切换
const currentPlayingVideoId = ref<string | null>(null)

// 控制轮播图自动播放
const autoplayEnabled = ref(true)

// VideoPlayer引用
const videoPlayerRef = ref<InstanceType<typeof VideoPlayer> | null>(null)

// 当前视频的播放状态监听器
let currentVideoPlayHandler: ((event: Event) => void) | null = null
let currentVideoPauseHandler: ((event: Event) => void) | null = null

// URL池，用于清理
const urlPool = new Set<string>()

// 移除当前视频事件监听器
const removeCurrentVideoListeners = () => {
  try {
    const videoElement = videoPlayerRef.value?.videoElement?.()
    if (videoElement && currentVideoPlayHandler && currentVideoPauseHandler) {
      videoElement.removeEventListener('play', currentVideoPlayHandler)
      videoElement.removeEventListener('pause', currentVideoPauseHandler)
      currentVideoPlayHandler = null
      currentVideoPauseHandler = null
    }
  } catch (error) {
    console.warn('移除视频事件监听器失败:', error)
  }
}

// 为当前视频设置播放状态监听器
const setupVideoListeners = (videoElement: HTMLVideoElement | null) => {
  if (!videoElement) return

  console.log('设置视频播放状态监听器', videoElement)

  // 创建新的监听器
  currentVideoPlayHandler = () => {
    // 视频开始播放时，暂停轮播图自动切换
    autoplayEnabled.value = false
    console.log('视频播放，禁用轮播图自动切换:', autoplayEnabled.value)
  }

  currentVideoPauseHandler = () => {
    // 视频暂停时，保持禁用轮播图自动切换（视频暂停时也不应该自动切换）
    autoplayEnabled.value = false
    console.log('视频暂停，保持禁用轮播图自动切换:', autoplayEnabled.value)
  }

  // 移除旧的监听器（防止重复添加）
  removeCurrentVideoListeners()

  // 添加监听器
  videoElement.addEventListener('play', currentVideoPlayHandler, { passive: true })
  videoElement.addEventListener('pause', currentVideoPauseHandler, { passive: true })

  // 检查视频当前播放状态
  if (!videoElement.paused) {
    autoplayEnabled.value = false
    console.log('视频已经在播放，禁用轮播图自动切换')
  }
}

// 解析视频直链（不下载完整文件）
const resolveVideoDirectUrl = async (filename: string): Promise<string> => {
  const token = authStore.token
  if (!token) {
    throw new Error('未登录，无法获取视频')
  }

  // 使用 HLS playlist 接口
  const hlsUrl = `${window.location.origin}/api/hls/playlist/${filename}?token=${encodeURIComponent(token)}`;
  
  return Promise.resolve(hlsUrl);
}

// 撤销URL
const revokeUrl = (url?: string | null) => {
  if (!url) return
  try {
    URL.revokeObjectURL(url)
  } catch (error) {
    console.warn('撤销对象URL失败:', error)
  }
}

// 注册URL到池
const registerUrl = (url: string) => {
  urlPool.add(url)
  return url
}

// 清理所有URL和状态
const cleanup = () => {
  currentFileUrl.value = ''
  currentPlayingVideoId.value = null
  urlPool.forEach((url) => revokeUrl(url))
  urlPool.clear()
  fileUrlMap.value.clear()
  // 移除视频监听器
  removeCurrentVideoListeners()
}

// 确保文件URL存在（视频使用直链，图片使用signed_url直链）
const ensureFileUrl = async (file: CollectionFile) => {
  const filename = file.uu_id

  if (fileUrlMap.value.has(filename)) {
    return fileUrlMap.value.get(filename)!
  }

  try {
    // 视频文件：使用直链方式
    if (file.file_type === 'video') {
      const directUrl = await resolveVideoDirectUrl(filename)
      fileUrlMap.value.set(filename, directUrl)
      // 视频直链不需要注册到 URL 池，因为不需要清理
      return directUrl
    }

    // 图片文件：使用 signed_url 直链
    if (file.signed_url) {
      fileUrlMap.value.set(filename, file.signed_url)
      return file.signed_url
    }

    // 兼容旧逻辑：如果没有 signed_url，使用 Blob URL 方式
    const blob = await getCollectionFile(filename)
    const objectUrl = URL.createObjectURL(blob)
    fileUrlMap.value.set(filename, objectUrl)
    registerUrl(objectUrl)
    return objectUrl
  } catch (error) {
    console.error('加载合集文件失败:', filename, error)
    throw error
  }
}

// 加载所有文件
const loadAllFiles = async () => {
  if (props.files.length === 0) {
    filesLoading.value = false
    return
  }

  filesLoading.value = true
  try {
    // 并行加载所有文件
    await Promise.all(
      props.files.map(file =>
        ensureFileUrl(file).catch(err => {
          console.error(`加载文件 ${file.uu_id} 失败:`, err)
        })
      )
    )
    
    // 选中第一个文件
    if (!currentFile.value && props.files.length > 0) {
      await selectFile(props.files[0])
    }
  } finally {
    filesLoading.value = false
  }
}

// 选择文件
const selectFile = async (file: CollectionFile) => {
  currentFile.value = file

  try {
    const url = await ensureFileUrl(file)
    currentFileUrl.value = url
    // 同步轮播图索引
    const index = props.files.findIndex(f => f.id === file.id)
    if (index !== -1) {
      currentCarouselIndex.value = index
    }

    // 如果是视频，处理播放逻辑
    if (file.file_type === 'video') {
      // 先移除旧的事件监听器
      removeCurrentVideoListeners()

      await nextTick()
      if (videoPlayerRef.value) {
        try {
          // 获取视频元素
          const videoElement = videoPlayerRef.value.videoElement?.()

          // 为视频添加播放状态监听器（在播放前设置）
          if (videoElement) {
            setupVideoListeners(videoElement)
          }

          // 如果是同一个视频，继续播放（可能被暂停了）
          // 如果是不同的视频，重置播放位置并从头播放
          if (currentPlayingVideoId.value !== file.uu_id) {
            // 切换到新视频，重置播放位置
            videoPlayerRef.value.seek(0)
            currentPlayingVideoId.value = file.uu_id
          }

          // 开始播放
          await videoPlayerRef.value.play()

          console.log('视频开始播放，当前轮播图自动播放状态:', autoplayEnabled.value)
        } catch (error) {
          console.warn('视频自动播放失败:', error)
          // 如果播放失败，仍然禁用轮播图自动切换（视频出现时不应该自动切换）
          autoplayEnabled.value = false
        }
      }
      // 视频出现时禁用自动切换
      autoplayEnabled.value = false
    } else {
      // 切换到非视频文件时，清除当前播放视频ID并恢复轮播图自动切换
      currentPlayingVideoId.value = null
      autoplayEnabled.value = true
      // 移除视频监听器
      removeCurrentVideoListeners()
    }
  } catch (error) {
    console.error('加载当前文件失败:', error)
    currentFileUrl.value = ''
  }
}

// 处理视频播放事件（备用方案）
const handleVideoPlay = () => {
  autoplayEnabled.value = false
  console.log('VideoPlayer播放事件触发，禁用轮播图自动切换:', autoplayEnabled.value)
}

// 处理视频暂停事件（备用方案）
const handleVideoPause = () => {
  autoplayEnabled.value = false
  console.log('VideoPlayer暂停事件触发，保持禁用轮播图自动切换:', autoplayEnabled.value)
}

// 处理轮播图变化
const handleCarouselChange = async (index: number) => {
  currentCarouselIndex.value = index
  if (props.files[index]) {
    await selectFile(props.files[index])
  }
}

// 监听文件列表变化
watch(() => props.files, (newFiles) => {
  if (newFiles.length > 0) {
    loadAllFiles()
  } else {
    currentFile.value = null
    currentFileUrl.value = ''
    currentPlayingVideoId.value = null
    autoplayEnabled.value = true
  }
}, { immediate: true })


// 组件卸载时清理资源
onBeforeUnmount(() => {
  cleanup()
  window.removeEventListener('resize', handleResize)
})
</script>
