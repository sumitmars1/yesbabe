<template>
  <div
    class="inline-block media-protected relative p-0 chat-content rounded-lg"
    :style="{
      borderRadius,
      overflow: 'hidden',
      width: '240px',
      aspectRatio: '9/16',
    }"
  >
    <div
      :class="{ blur: hidden }"
      :style="{ width: '240px', aspectRatio: '9/16' }"
    >
      <!-- 视频占位符（仅在非付费内容且未加载时显示） -->
      <div
        v-if="!hidden && !processedContent && !videoLoadError"
        class="w-[240px] aspect-[9/16] flex items-center justify-center rounded-lg relative bg-gray-100 dark:bg-gray-800"
      >
        <!-- 默认背景图 -->
        <div
          v-if="hidden && defaultImageUrl"
          class="absolute inset-0 w-[240px] aspect-[9/16] bg-cover bg-center"
          :style="{ backgroundImage: `url(${defaultImageUrl})` }"
        />
        <div class="flex flex-col items-center space-y-3 relative z-10">
          <n-spin size="medium" />
          <span class="text-sm text-gray-500 dark:text-gray-400">加载中...</span>
        </div>
      </div>

      <VideoPlayer
        v-if="processedContent || videoLoadError"
        ref="videoPlayerRef"
        :src="processedContent"
        :loading="isLoadingMedia"
        :error="videoLoadError"
        :show-retry="Boolean(currentFileId)"
        :loop="false"
        :muted="false"
        :autoplay="false"
        @retry="handleVideoRetry"
        @loadeddata="handleVideoLoad"
        @error="handleVideoError"
      />
    </div>
    <div
      v-if="hidden"
      class="absolute inset-0 z-[1000] flex flex-col items-center justify-center p-5 text-center text-white"
    >
      <div class="flex flex-col items-center gap-4">
        <div class="text-sm font-semibold">
          {{ t("chatItem.maskedVideoPlaceholder") }}
        </div>
        <div class="flex items-center justify-center">
          <svg-icon iconClass="lock" :size="20" />
        </div>
        <BabeButton
          type="primary"
          size="large"
          @click="handleUpgradeClick"
          class="min-w-[120px] h-10 font-semibold rounded-20"
        >
          <svg-icon iconClass="Huangguan" :size="16" class="mr-1" />
          {{ t("chatItem.openPro") }}
        </BabeButton>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch, onMounted } from "vue";
import { useI18n } from "vue-i18n";
import VideoPlayer from "@/components/VideoPlayer/index.vue";
import { getGeneratedImage } from "@/api/chat";
import { showSubscriptionModal } from "@/utils/subscriptionModal";
import { getRandomDefaultImage } from "@/utils/defaultImageCache";
const props = defineProps<{
  content: any;
  messageType: string;
  isSelf: boolean;
  hidden?: boolean;
}>();

const { t } = useI18n();

const borderRadius = computed(() =>
  props.isSelf ? "16px 0px 16px 16px" : "0px 16px 16px 16px"
);
const hidden = computed(() => !!props.hidden);

const videoPoster = computed<string | undefined>(() => {
  const content = props.content as any;
  const candidate =
    content && typeof content === "object"
      ? content.thumbnail_url ??
        content.thumbnailUrl ??
        content.cover_image_url ??
        content.coverImageUrl ??
        content.image_url ??
        content.imageUrl
      : undefined;

  if (typeof candidate === "string" && candidate.length > 0) return candidate;
  if (defaultImageUrl.value) return defaultImageUrl.value;
  return undefined;
});

const videoPlayerRef = ref<InstanceType<typeof VideoPlayer> | null>(null);
const isLoadingMedia = ref<boolean>(false);
const videoLoadError = ref(false);
const actualMediaUrl = ref("");
const processedContent = ref("");
const defaultImageUrl = ref<string>("");

const currentFileId = computed(() => {
  const v = props.content as any;
  if (typeof v === "string" && v.startsWith("generate_video:"))
    return v.replace("generate_video:", "");
  if (v && typeof v === "object")
    return v.video_url || v.file_id || v.id || null;
  return null;
});

const extractVideoRaw = (content: any, messageType: string): string => {
  const t = String(messageType || "").toLowerCase();
  if (
    t === "text_to_video_complete" ||
    t === "image_to_video_complete" ||
    t === "video_generation_complete"
  ) {
    // 如果video_url已经是完整URL（http(s)://或/s/开头），直接返回
    if (content?.video_url) {
      const url = content.video_url;
      if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/s/")
      ) {
        return url;
      }
      // 否则使用旧格式（generate_video:前缀）
      return `generate_video:${url}`;
    }
    return content?.message || "";
  }
  if (t === "video_hidden" || t === "message_video_hidden") {
    const url =
      content?.video_url ??
      content?.url ??
      content?.file_id ??
      content?.content;
    if (typeof url === "string" && url.length > 0) {
      // 如果已经是完整URL，直接返回
      if (
        url.startsWith("http://") ||
        url.startsWith("https://") ||
        url.startsWith("/s/")
      ) {
        return url;
      }
      return url.startsWith("generate_video:") ? url : `generate_video:${url}`;
    }
    return "";
  }
  if (typeof content === "string") return content;
  if (typeof content === "object" && content)
    return content.video_url || content.url || content.message || "";
  return "";
};

const processMediaLink = async (filename: string): Promise<string> => {
  // 如果已经是完整URL（http(s)://或/s/开头），直接返回
  if (
    filename.startsWith("http://") ||
    filename.startsWith("https://") ||
    filename.startsWith("/s/")
  ) {
    return filename;
  }

  // 处理旧格式：generate_video:前缀
  if (filename.startsWith("generate_video:")) {
    const actual = filename.split(":")[1] || "";
    try {
      videoLoadError.value = false;
      const url = getGeneratedImage(actual);
      actualMediaUrl.value = url;
      return url;
    } catch (e) {
      console.error("生成视频URL失败", e);
      videoLoadError.value = true;
      return "视频生成失败";
    }
  }
  return filename;
};

const updateProcessed = async () => {
  const raw = extractVideoRaw(props.content, props.messageType);
  if (!raw) {
    processedContent.value = "";
    return;
  }
  processedContent.value = await processMediaLink(raw);
};

watch(() => [props.content, props.messageType], updateProcessed, {
  immediate: true,
  deep: true,
});
watch(actualMediaUrl, (u) => {
  if (u) processedContent.value = u;
});

const handleVideoRetry = async () => {
  const fid = currentFileId.value;
  if (!fid) return;
  if (
    typeof fid === "string" &&
    (fid.startsWith("http://") ||
      fid.startsWith("https://") ||
      fid.startsWith("/s/"))
  ) {
    processedContent.value = await processMediaLink(fid);
    return;
  }
  processedContent.value = await processMediaLink(`generate_video:${fid}`);
};
const handleVideoLoad = () => {
  videoLoadError.value = false;
};
const handleVideoError = () => {
  videoLoadError.value = true;
};
const handleUpgradeClick = () => {
  try {
    showSubscriptionModal("inline");
  } catch (e) {}
};

onMounted(() => {
  // 获取随机默认图片
  defaultImageUrl.value = getRandomDefaultImage() || "";
});
</script>

<style scoped></style>
