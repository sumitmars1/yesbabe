<template>
  <div class="min-w-[200px] h-screen overflow-y-auto">
    <div v-if="globalStore.isMobile"
      class="flex items-center bg-sidebarBackground text-primary w-full box-border z-10 justify-between h-[64px] p-4 border-b-hoverBackground border-b-solid border-0.5px fixed top-0 left-0 right-0">
      <div class="flex items-center">
        <n-button circle secondary class="mr-2" size="small" @click="handleBackToChat">
          <n-icon size="20" class="cursor-pointer">
            <ChevronLeftFilled />
          </n-icon>
        </n-button>
        <span class="font-bold">{{ companion?.name || t("profile.userProfile") }}</span>
      </div>
    </div>

    <div class="text-primary" :class="{
      '': !globalStore.isMobile,
      '': globalStore.isMobile,
    }">
      <div ref="carouselContainer" class="w-full" :class="{
        'h-[50vh]': globalStore.isMobile,
        'carousel-pc-container': !globalStore.isMobile
      }">
        <n-carousel show-arrow draggable touchable autoplay :interval="5000" v-if="companion" :key="companion.id" class="carousel-content">
          <!-- 头像图片 -->
          <div class="w-full h-full" v-if="companion.head_image">
            <n-image object-fit="cover" width="100%" height="100%" :src="handleAssetUrl(companion.head_image)"
              :key="companion.head_image"></n-image>
          </div>

          <!-- 封面图片 -->
          <div class="w-full h-full" v-if="companion.cover_image_url">
            <n-image object-fit="cover" width="100%" height="100%" :src="handleAssetUrl(companion.cover_image_url)"
              :key="companion.cover_image_url"></n-image>
          </div>

          <!-- 封面视频 -->
          <div class="w-full h-full" v-if="companion.cover_video_url">
            <video width="100%" height="100%" loop muted autoplay style="object-fit: cover" class="w-full h-full"
              :key="companion.cover_video_url">
              <source :src="handleAssetUrl(companion.cover_video_url)" type="video/mp4" />
              您的浏览器不支持视频标签。
            </video>
          </div>

          <!-- 默认头像（当所有媒体都不存在时） -->
          <div class="w-full h-full" v-if="
            !companion.head_image &&
            !companion.cover_image_url &&
            !companion.cover_video_url
          ">
            <n-image object-fit="cover" width="100%" height="100%" :src="Profile" :key="'default-profile'"></n-image>
          </div>
        </n-carousel>
      </div>
      <div class="page-padding" v-if="companion">
        <div class="font-semibold mb-2">{{ companion.name }}</div>
        <div class="text-secondary text-sm mb-9">
          {{ companion.description }}
        </div>
        <div class="flex flex-wrap gap-2">
          <BabeButton size="small" class=" mr-2" type="secondary" @click="handleGoToAIGenerator">{{ t("profile.generateImage") }}</BabeButton>
          <!-- <BabeButton size="small" class="">{{ t("profile.voiceChat") }}</BabeButton> -->
        </div>
      </div>
      <div>
        <n-divider style="margin: 0"></n-divider>
      </div>
      <div class="page-padding" v-if="companion">
        <div class="font-semibold mb-secondMargin">{{ t("profile.aboutMe") }}</div>
        <n-grid :x-gap="12" :y-gap="24" :cols="2">
          <n-grid-item v-for="(item, index) in profileItems" :key="index">
            <div class="flex flex-col">
              <div class="text-sm">
                <div class="text-secondary">{{ item.label }}</div>
                <div>{{ item.value }}</div>
              </div>
            </div>
          </n-grid-item>
        </n-grid>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, watch } from "vue";
import Profile from "@/assets/icons/pic/profile.png";
import { handleAssetUrl } from "@/utils/assetUrl";
import { useChatStore } from "@/stores/chat";
import { useRoute, useRouter } from "vue-router";
import { useGlobalStore } from "@/stores/global/global";
import { ChevronLeftFilled } from "@vicons/material";
import { useI18n } from "vue-i18n";

// 创建一个引用来获取轮播图容器元素
const carouselContainer = ref<HTMLElement | null>(null);

const { t } = useI18n();
const route = useRoute();
const router = useRouter();
const chatStore = useChatStore();
const globalStore = useGlobalStore();

const activeCompanionId = computed(() => {
  const fromChat = chatStore.currentChat?.companion_id;
  if (fromChat) return fromChat;
  const raw = route.params.id || route.query.id;
  const fromRoute = Number(raw);
  return Number.isFinite(fromRoute) && fromRoute > 0 ? fromRoute : 0;
});

watch(
  () => activeCompanionId.value,
  (id, prevId) => {
    if (!id) {
      chatStore.clearCurrentCompanion();
      return;
    }

    if (prevId && id !== prevId) {
      chatStore.clearCurrentCompanion();
    }

    const alreadyLoaded = chatStore.currentCompanion?.id === id;
    if (alreadyLoaded) return;

    chatStore.onGetCurrentCompanion(id).catch(() => {});
  },
  { immediate: true }
);

// 获取当前聊天伴侣信息
const companion = computed(() => {
  return chatStore.currentCompanion?.id ? chatStore.currentCompanion : null;
});

// 处理文本，统一标点符号
const normalizeText = (text?: string) => {
  if (!text || text === "--") return "--";
  // 将各种分隔符统一替换为逗号
  return text.replace(/[;;、]/g, "，").trim();
};

// 动态生成个人资料项
const profileItems = computed(() => {
  if (!companion.value) return [];

  return [
    { label: t("profile.age"), value: companion.value.age?.toString() || "--" },
    { label: t("profile.language"), value: normalizeText(companion.value.language) },
    { label: t("profile.relationship"), value: normalizeText(companion.value.relation) },
    { label: t("profile.ethnicity"), value: normalizeText(companion.value.ethnicity) },
    { label: t("profile.hobby"), value: normalizeText(companion.value.hobbies) },
    { label: t("profile.occupation"), value: normalizeText(companion.value.occupation) },
    { label: t("profile.bodyType"), value: normalizeText(companion.value.body) },
    { label: t("profile.personality"), value: normalizeText(companion.value.personality) },
  ];
});

// 返回聊天页面
const handleBackToChat = () => {
  router.push("/chat");
};

// 跳转到图像生成页面
const handleGoToAIGenerator = () => {
  router.push("/ai-generator");
};
</script>

<style scoped>
/* PC 端轮播图容器 - 9:16 宽高比 */
.carousel-pc-container {
  position: relative;
  width: 100%;
  aspect-ratio: 9 / 16;
  max-height: 65vh;
  overflow: hidden;
}

.carousel-content {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}

/* 确保图片和视频容器铺满父容器 */
.w-full.h-full {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

/* 确保 n-image 组件内的图片铺满容器 */
:deep(.n-image img) {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

/* 轮播图箭头按钮样式 */
:deep(.n-carousel .n-carousel__arrow) {
  background-color: rgba(0, 0, 0, 0.5);
  color: white;
}

/* 轮播图指示器居中 */
:deep(.n-carousel .n-carousel__dots) {
  position: absolute;
  bottom: 16px;
  left: 0;
  right: 0;
  justify-content: center;
  display: flex;
  gap: 8px;
  z-index: 10;
  pointer-events: auto;
}

/* 轮播图小圆点样式优化 */
:deep(.n-carousel .n-carousel__dot) {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  background-color: rgba(255, 255, 255, 0.4);
  border: 2px solid rgba(255, 255, 255, 0.6);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  pointer-events: auto;
}

:deep(.n-carousel .n-carousel__dot:hover) {
  background-color: rgba(255, 255, 255, 0.6);
  border-color: rgba(255, 255, 255, 0.8);
  transform: scale(1.1);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

:deep(.n-carousel .n-carousel__dot--active) {
  background-color: rgba(255, 255, 255, 0.9);
  border-color: #ffffff;
  transform: scale(1.2);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.4);
}

/* 暗色主题下的小圆点样式 */
:deep([data-theme="dark"] .n-carousel .n-carousel__dot) {
  background-color: rgba(0, 0, 0, 0.4);
  border-color: rgba(0, 0, 0, 0.6);
  box-shadow: 0 2px 8px rgba(255, 255, 255, 0.1);
}

:deep([data-theme="dark"] .n-carousel .n-carousel__dot:hover) {
  background-color: rgba(0, 0, 0, 0.6);
  border-color: rgba(0, 0, 0, 0.8);
  box-shadow: 0 4px 12px rgba(255, 255, 255, 0.2);
}

:deep([data-theme="dark"] .n-carousel .n-carousel__dot--active) {
  background-color: rgba(0, 0, 0, 0.9);
  border-color: #000000;
  box-shadow: 0 4px 16px rgba(255, 255, 255, 0.3);
}
</style>
