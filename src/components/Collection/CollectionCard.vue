<template>
  <div class="relative cursor-pointer masked-container overflow-hidden" :class="[
    inChat
      ? 'w-full aspect-[9/16]'
      : 'w-full aspect-[9/16] max-sm:w-full max-sm:max-w-full max-sm:h-auto max-sm:aspect-[9/16]',
    confirmMode
      ? 'shadow-[0_0_0_4px_#FFBF06,0_0_16px_rgba(255,191,6,0.4)]'
      : '',
  ]" :style="{ borderRadius }" @click="handleClick">
    <!-- 封面图片 -->
    <div class="absolute inset-0 collection-card__mask-media">
      <template v-if="coverUrl">
        <n-image :src="coverUrl" object-fit="cover" width="100%" height="100%" preview-disabled
          class="w-full h-full object-cover scale-110 blur-base pointer-events-none select-none masked-media-blur"
          draggable="false" />
      </template>
      <div v-else class="absolute inset-0 flex items-center justify-center collection-card__mask-placeholder">
        <n-spin size="small" />
      </div>
    </div>

    <!-- 遮罩层 -->
    <div
      class="absolute inset-0 z-[1001] flex flex-col items-center justify-between p-4 text-center text-white bg-[rgba(18,18,28,0.65)] backdrop-blur-sm collection-card__mask-overlay masked-overlay">
      <!-- 顶部：文件数量标签 -->
      <div class="flex justify-center w-full overlay-top">
        <div class="inline-flex items-center gap-2 top-meta">
          <div v-if="collection.image_count > 0"
            class="inline-flex items-center text-xs text-white bg-black/35 px-2 py-1 rounded-full backdrop-blur-xs top-tag">
            <svg-icon iconClass="photo" :size="14" class="mr-1" />
            <span>{{ collection.image_count }}</span>
          </div>
          <div v-if="collection.video_count > 0"
            class="inline-flex items-center text-xs text-white bg-black/35 px-2 py-1 rounded-full backdrop-blur-xs top-tag">
            <svg-icon iconClass="Video" :size="14" class="mr-1" />
            <span>{{ collection.video_count }}</span>
          </div>
        </div>
      </div>

      <!-- 中部：锁图标、标题、按钮居中排列 -->
      <div class="flex flex-col items-center justify-center gap-2 text-center overlay-center">
        <!-- 心形锁图标 -->
        <svg-icon iconClass="heartlock" :size="20" class="text-white/60" />

        <!-- 标题 -->
        <div
          class="text-white text-base leading-[1.35] font-semibold -webkit-box -webkit-box-orient-vertical -webkit-line-clamp-2 overflow-hidden text-center max-w-full px-2"
          :title="collection.title">
          {{ collection.title }}
        </div>

        <!-- 购买按钮 -->
        <BabeButton :type="confirmMode ? 'warning' : 'primary'" size="large" :loading="loading"
          @click.stop="handlePurchase"
          class="min-w-[132px] h-12 font-semibold rounded-20 shadow-[0_4px_12px_rgba(99,102,241,0.3)] transition-all duration-300 active:translate-y-0 purchase-button"
          :class="{
            '!bg-[#FFBF06] !border-[#FFBF06] shadow-[0_4px_12px_rgba(255,191,6,0.3)] active:!bg-[#E6AC05] active:!border-[#E6AC05]':
              confirmMode,
          }">
          <div class="flex flex-col items-center justify-center leading-tight">
            <div class="inline-flex items-center gap-1.5">
              <svg-icon iconClass="diamond" :size="18" class="text-white/95" />
              <span class="text-xl font-extrabold tracking-tight text-white">{{
                collection.discount_price
              }}</span>
            </div>
            <div class="text-xs text-white/90 font-semibold">
              {{
                confirmMode
                  ? t("collection.confirmPurchase")
                  : t("collection.purchase")
              }}
            </div>
          </div>
        </BabeButton>
      </div>

      <!-- 底部：购买人数 -->
      <div class="w-full text-center overlay-bottom">
        <div class="text-xs text-white/70" v-if="collection.purchase_count">
          {{ collection.purchase_count }} {{ t("collection.purchased") }}
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, watch, computed } from "vue";
import { NImage, NSpin } from "naive-ui";
import type { Collection } from "@/api/collection/types";
import { getCollectionImageUrl } from "@/api/chat";
import { useI18n } from "vue-i18n";

const { t } = useI18n();

interface Props {
  collection: Collection;
  loading?: boolean;
  inChat?: boolean;
}

const props = withDefaults(defineProps<Props>(), {
  loading: false,
  inChat: false,
});

const borderRadius = computed(() =>
  props.inChat ? '0px 16px 16px 16px' : '16px'
);

const emit = defineEmits<{
  purchase: [collectionId: number];
  click: [collection: Collection];
}>();

// 确认购买模式
const confirmMode = ref(false);

// 封面图URL
const coverUrl = ref<string>("");

// 加载封面图
const loadCover = (filename?: string) => {
  if (!filename) {
    coverUrl.value = "";
    return;
  }

  coverUrl.value = getCollectionImageUrl(filename);
};

// 监听封面图片变化
watch(
  () => props.collection.cover_image,
  (newCover) => {
    loadCover(newCover);
  },
  { immediate: true }
);

const handleClick = () => {
  if (!confirmMode.value) {
    emit("click", props.collection);
  }
};

const handlePurchase = () => {
  if (confirmMode.value) {
    // 确认购买
    emit("purchase", props.collection.id);
    confirmMode.value = false;
  } else {
    // 进入确认模式
    confirmMode.value = true;
    // 3秒后自动退出确认模式
    setTimeout(() => {
      confirmMode.value = false;
    }, 3000);
  }
};
</script>
