<template>
  <div
    class="flex items-center text-primary w-full box-border justify-between"
    :class="{
      'border-b-hoverBackground border-b-solid border-1px card':
        !globalStore.isMobile,
    }"
  >
    <div class="flex items-center flex-1 min-w-0">
      <svg-icon
        v-if="globalStore.isMobile"
        iconClass="back"
        :size="24"
        class="mr-2 flex-shrink-0"
        @click="handleBackMessage"
      ></svg-icon>
      <n-avatar
        v-show="chatStore.currentChat?.companion_id"
        :src="avatarSrc"
        :key="avatarKey"
        class="mr-2 shrink-0"
        :class="{ 'cursor-pointer': globalStore.isMobile }"
        :size="36"
        round
        object-fit="cover"
        @click="handleAvatarClick"
      ></n-avatar>
      <div class="flex flex-col text-sm min-w-0 max-w-full justify-between">
        <span
          class="font-bold text-base whitespace-nowrap overflow-hidden text-ellipsis max-w-full block leading-none"
          >{{ chatStore.currentChat?.name }}</span>
        <span
          v-if="subtitleText"
          class="text-xs text-#8C8C8C mt-1 whitespace-nowrap overflow-hidden text-ellipsis leading-none"
        >
          {{ subtitleText }}
        </span>
      </div>
    </div>
      <div v-show="chatStore.currentChat?.companion_id" class="flex items-center">
        <div class="flex items-center mr-3">
        <!-- <div
          class="h-26px w-26px flex items-center justify-center cursor-pointer"
          @click="handleLikeClick"
        >
          <svg-icon
            :size="26"
            :iconClass="isLiked ? 'heart-filled' : 'heart'"
            :class="{
              'text-pink fill-pink': isLiked,
              'like-animation': isAnimating,
            }"
            :style="{ transition: 'all 0.3s ease' }"
          />
        </div> -->
        <span
          v-if="displayLikeCount"
          class="text-base ml-1 font-600"
          :class="{ 'text-pink': isLiked }"
          >{{ displayLikeCount }}</span>
        </div>
      <div
        v-if="chatStore.currentChat?.companion_id"
        class="h-26px w-26px flex items-center justify-center cursor-pointer mr-3"
        @click="handleCollectionClick"
      >
        <svg-icon :size="26" iconClass="heartlock" />
      </div>
      <!-- <div
        class="h-26px w-26px flex items-center justify-center cursor-pointer"
      >
        <svg-icon :size="26" iconClass="phone" />
      </div> -->
    </div>
  </div>

  <!-- 合集弹窗 -->
  <CollectionModal
    v-if="!globalStore.isMobile"
    v-model:show="showCollectionModal"
    :companion-id="chatStore.currentChat?.companion_id"
  />
</template>

<script setup lang="ts">
import { NButton, NIcon, NAvatar } from "naive-ui";
import { ChevronLeftFilled } from "@vicons/material";
import { useChatStore } from "@/stores/chat/index";
import { useGlobalStore } from "@/stores/global/global";
import { useRouter } from "vue-router";
import { ref, computed, watch } from "vue";
import { useI18n } from "vue-i18n";
import { likeCompanion, cancelLikeCompanion } from "@/api/home/index";
import { useAuthStore } from "@/stores/auth";
import { showLoginModal } from "@/utils/authModal";
import { showSubscriptionModal } from "@/utils/subscriptionModal";
import { createDiscreteApi } from "naive-ui";
import { CollectionModal } from "@/components/Collection";
import { handleAssetUrl } from "@/utils/assetUrl";

const chatStore = useChatStore();
const globalStore = useGlobalStore();
const router = useRouter();
const authStore = useAuthStore();
const { t } = useI18n();

const avatarSrc = computed(() => {
  const chat = chatStore.currentChat;
  return handleAssetUrl(chat?.t_head_image);
});

const avatarKey = ref(0);
watch(
  () => chatStore.currentChat?.t_head_image,
  () => {
    avatarKey.value += 1;
  }
);

// 合集弹窗状态
const showCollectionModal = ref(false);

// 点赞状态管理
const isLiked = computed(() => chatStore.currentChat?.liked || false);
const isAnimating = ref(false);
const likeCount = ref(0);

// 昵称下方信息：年龄与职业（来自 Pinia 的 currentCompanion）
const companionAge = computed(
  () =>
    chatStore.currentCompanion?.age as unknown as string | number | undefined
);
const companionOccupation = computed(
  () => chatStore.currentCompanion?.occupation as unknown as string | undefined
);
const subtitleText = computed(() => {
  const ageVal = companionAge.value;
  const occVal = companionOccupation.value;
  const ageStr =
    ageVal !== undefined && ageVal !== null && ageVal !== ""
      ? String(ageVal)
      : "";
  const occStr = occVal || "";
  if (ageStr && occStr) return `${ageStr},${occStr}`;
  return ageStr || occStr || "";
});

// 监听currentChat和currentCompanion变化，更新点赞数
watch(
  () => [chatStore.currentChat, chatStore.currentCompanion],
  ([newChat, newCompanion]) => {
    // 从 currentCompanion 获取点赞数，它包含 interaction_number 字段
    if (
      newCompanion &&
      "interaction_number" in newCompanion &&
      typeof newCompanion.interaction_number === "number"
    ) {
      likeCount.value = newCompanion.interaction_number || 0;
    } else {
      likeCount.value = 0;
    }
  },
  { immediate: true }
);

// 格式化点赞数显示
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

// 处理点赞点击事件
const handleLikeClick = async () => {
  // 检查用户是否已登录
  if (!authStore.isLoggedIn) {
    showLoginModal("login");
    return;
  }

  // 检查是否有当前聊天对象
  if (!chatStore.currentChat?.companion_id) {
    return;
  }

  const { message } = createDiscreteApi(["message"]);
  const previousLikedState = chatStore.currentChat.liked;
  const previousLikeCount = likeCount.value;

  // 乐观更新UI - 点赞状态和点赞数
  if (chatStore.currentChat) {
    chatStore.currentChat.liked = !chatStore.currentChat.liked;
    // 乐观更新点赞数
    if (chatStore.currentChat.liked) {
      likeCount.value = previousLikeCount + 1;
    } else {
      likeCount.value = Math.max(0, previousLikeCount - 1);
    }
  }

  // 触发动画
  isAnimating.value = true;
  setTimeout(() => {
    isAnimating.value = false;
  }, 300);

  try {
    // 调用相应的点赞API
    if (chatStore.currentChat.liked) {
      await likeCompanion(chatStore.currentChat.companion_id);
      // message.success(t('header.likeSuccess'));
    } else {
      await cancelLikeCompanion(chatStore.currentChat.companion_id);
      // message.success(t('header.unlikeSuccess'));
    }

    // 同步更新currentCompanion中的liked状态和点赞数
    if (chatStore.currentCompanion) {
      chatStore.currentCompanion.liked = chatStore.currentChat.liked;
      chatStore.currentCompanion.interaction_number = likeCount.value;
    }
  } catch (error) {
    // 回滚乐观更新 - 恢复点赞状态和点赞数
    if (chatStore.currentChat) {
      chatStore.currentChat.liked = previousLikedState;
      likeCount.value = previousLikeCount;
    }
    console.error("点赞操作失败:", error);
    message.error(t("header.likeError"));
  } finally {
    // 清理完成
  }
};

const handleAvatarClick = () => {
  if (globalStore.isMobile && chatStore.currentChat?.companion_id) {
    router.push(`/chat/profile/${chatStore.currentChat.companion_id}`);
  }
};

const handleBackMessage = () => {
  chatStore.clearCurrentChat;
  router.push(`/chat`);
};

// 处理合集点击
const handleCollectionClick = () => {
  // 检查用户是否已登录
  if (!authStore.isLoggedIn) {
    showLoginModal("login");
    return;
  }

  if (!authStore.userInfo?.is_vip) {
    showSubscriptionModal("inline");
    return;
  }

  const companionId = chatStore.currentChat?.companion_id;
  if (!companionId) {
    return;
  }

  if (globalStore.isMobile) {
    router.push({
      name: "ChatCollections",
      params: { id: companionId },
      query: { from: "chat" },
    });
    return;
  }

  // 打开合集弹窗
  showCollectionModal.value = true;
};
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
