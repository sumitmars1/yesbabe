<template>
  <div
    class="relative cursor-pointer"
    :class="[
      inChat
        ? 'w-full aspect-[9/16]'
        : 'w-full aspect-[9/16] max-sm:w-full max-sm:max-w-full max-sm:h-auto max-sm:aspect-[9/16]',
    ]"
    @click="handleClick"
  >
    <!-- 封面图片 -->
    <div class="h-full mb-3 relative overflow-hidden" :style="{ borderRadius }">
      <template v-if="coverUrl">
        <n-image
          :src="coverUrl"
          object-fit="cover"
          width="100%"
          height="100%"
          preview-disabled
          class="w-full h-full object-cover"
          draggable="false"
        />
      </template>
      <div
        v-else
        class="w-full h-full flex items-center justify-center bg-hoverBackground"
      >
        <n-spin size="small" />
      </div>

      <!-- 底部黑透滤镜和内容 -->
      <div class="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/80 via-black/40 to-transparent">
        <!-- 左下角：文件数量和描述 -->
        <div class="flex flex-col gap-2 text-left">
          <!-- 文件数量 -->
          <div class="inline-flex items-center gap-2">
            <div
              v-if="collection.image_count > 0"
              class="inline-flex items-center text-xs text-white bg-black/35 px-2 py-1 rounded-full backdrop-blur-xs"
            >
              <svg-icon iconClass="photo" :size="14" class="mr-1" />
              <span>{{ collection.image_count }}</span>
            </div>
            <div
              v-if="collection.video_count > 0"
              class="inline-flex items-center text-xs text-white bg-black/35 px-2 py-1 rounded-full backdrop-blur-xs"
            >
              <svg-icon iconClass="Video" :size="14" class="mr-1" />
              <span>{{ collection.video_count }}</span>
            </div>
          </div>

          <!-- 描述 -->
          <div
            class="text-white text-sm leading-[1.35] -webkit-box -webkit-box-orient-vertical -webkit-line-clamp-3 overflow-hidden text-left max-sm:text-xs"
            :title="collection.description"
          >
            {{ collection.description }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { NImage, NSpin } from 'naive-ui'
import type { Collection } from '@/api/collection/types'
import { getCollectionImageUrl } from '@/api/chat'
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

interface Props {
  collection: Collection
  inChat?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  inChat: false,
})

const borderRadius = computed(() => 
  props.inChat ? '0px 16px 16px 16px' : '16px'
)

const emit = defineEmits<{
  click: [collection: Collection]
}>()

// 封面图URL
const coverUrl = ref<string>('')

// 加载封面图
const loadCover = (filename?: string) => {
  if (!filename) {
    coverUrl.value = ''
    return
  }
  
  coverUrl.value = getCollectionImageUrl(filename)
}

// 监听封面图片变化
watch(
  () => props.collection.cover_image,
  (newCover) => {
    loadCover(newCover)
  },
  { immediate: true }
)

const handleClick = () => {
  emit('click', props.collection)
}
</script>

<style scoped>
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>
