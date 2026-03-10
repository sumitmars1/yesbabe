<script setup lang="ts">
import { computed } from "vue";
import { MessageItem } from "@/types/chat";
import { formatRelativeTime } from "@/utils/timeFormat";
import { handleAssetUrl } from "@/utils/assetUrl";
import { NBadge, NAvatar } from "naive-ui";
import { useI18n } from "vue-i18n";
import { stripSuggestedReplies } from "@/utils/suggestedReply";
const props = defineProps<{
  item: MessageItem;
}>();
import { useRouter } from "vue-router";
const router = useRouter();

import { useChatStore } from "@/stores/chat";
const chatStore = useChatStore();
import { useWebSocket } from "@/composables/useWebSocket";
import { useDialog } from "naive-ui";

const { messages } = useWebSocket();
const dialog = useDialog();

const { t } = useI18n();

const avatarImgProps = {
  class: "image-optimized avatar-image",
  decoding: "async" as const,
};

// 计算当前项是否被选中
const isSelected = computed(() => {
  return chatStore.currentChat?.companion_id === props.item.companion_id;
});

// 新适配：基于 type 渲染摘要
// type === 'image' => [图片]
// type === 'video' => [视频]
// type === 'collection' => [合集]
// type === 'collection_image' => [图片合集]
// type === 'collection_video' => [视频合集]
// type === 'text'  => content 原样
// type === 'mixed' => 根据 content 后缀判断图片/视频
// type === 'text_hidden' => 升级 Pro,解锁私密文字
// type === 'image_hidden' => 升级 Pro,解锁私密图片
// type === 'video_hidden' => 升级 Pro,解锁私密视频
// 如果内容为空，则回退查找上一条非空内容
const getMessageSummary = (type: string, content: string): string => {
  if (type === "image") return t("chatItem.messageItemImage");
  if (type === "video") return t("chatItem.messageItemVideo");
  if (type === "collection") return t("chatItem.messageItemCollection");
  if (type === "collection_image")
    return t("chatItem.messageItemImageCollection");
  if (type === "collection_video")
    return t("chatItem.messageItemVideoCollection");
  if (type === "text") return content;
  if (type === "text_hidden" || type === "message_text_hidden")
    return t("chatItem.messageItemHiddenText");
  if (type === "image_hidden" || type === "message_image_hidden")
    return t("chatItem.messageItemHiddenImage");
  if (type === "video_hidden" || type === "message_video_hidden")
    return t("chatItem.messageItemHiddenVideo");
  if (type === "mixed") {
    const lower = content.toLowerCase();
    if (/\.(mp4|webm|ogg|avi|mov|wmv|flv|mkv)(\?|#|$)/.test(lower))
      return t("chatItem.messageItemVideo");
    if (/\.(png|jpg|jpeg|gif|webp|svg)(\?|#|$)/.test(lower))
      return t("chatItem.messageItemImage");
    return content;
  }
  return content;
};

// 使用计算属性确保能正确访问 i18n 函数
const displayContent = computed(() => {
  const messageType = String(props.item.type ?? "").toLowerCase();
  const content = stripSuggestedReplies(String(props.item.content || ""));

  // 如果当前内容非空，直接返回
  if (content.trim() !== "") {
    return getMessageSummary(messageType, content);
  }

  // 如果当前内容为空，尝试从其他字段获取非空内容
  // 优先级：content -> s_content -> description
  if (props.item.s_content && props.item.s_content.trim() !== "") {
    return getMessageSummary(messageType, stripSuggestedReplies(props.item.s_content));
  }

  if (props.item.description && props.item.description.trim() !== "") {
    return getMessageSummary(messageType, stripSuggestedReplies(props.item.description));
  }

  // 所有字段都为空时，返回默认提示
  return getMessageSummary(messageType, "");
});

const handleClick = async () => {
  // 检查是否有正在生成的内容
  const isContentGenerating = messages.value.some(msg => msg.isLoading === true);
  
  // 如果有内容正在生成，且点击的不是当前选中的聊天
  if (isContentGenerating && !isSelected.value) {
    const confirmed = await new Promise<boolean>((resolve) => {
      dialog.warning({
        title: t('common.tips'),
        content: t('chatItem.generatingContentWarning'),
        positiveText: t('common.confirm'),
        negativeText: t('common.cancel'),
        positiveButtonProps: {
          bordered: false,
          style: {
            background: 'linear-gradient(to right, #7562ff, #b462ff)',
            color: 'white',
            border: '0'
          }
        } as any,
        closeOnEsc: false,
        closable: false,
        maskClosable: false,
        onPositiveClick: () => {
          resolve(true);
        },
        onNegativeClick: () => {
          resolve(false);
        },
      });
    });

    if (!confirmed) {
      return;
    }
  }

  // 图片生成过程中的离开确认已在路由守卫中统一处理
  // 本地立即清除未读数，提供即时反馈
  if (props.item.unread_count && props.item.unread_count > 0) {
    props.item.unread_count = 0;
  }

  // 将 MessageItem 数据传递给 store
  const chatData = {
    ...props.item,
    lastMessage: props.item.content,
    time: formatRelativeTime(props.item.message_response_created_at),
    isSelf: false,
  };

  const companionId = props.item.companion_id || props.item.id;
  if (companionId) {
    chatStore.ensureCurrentChatByCompanionId(companionId, chatData).catch(() => {
      // 错误已在 store 内部处理（包含权限与取消请求处理），这里无需二次提示
    });
  } else {
    chatStore.setCurrentChat(chatData);
  }
  router.push({ name: "ChatAI" });

  console.log(t("chatItem.messageItemSwitchToChat"), props.item.name);
};

// 移除WebSocket相关导入和初始化，避免重复连接
</script>

<template>
  <div
    @click="handleClick"
    :class="[
      'large-card flex items-center cursor-pointer transition-colors duration-300 box-border py-2 px-4 ',
      isSelected
        ? 'bg-hoverBackground border-l-4 border-primary'
        : 'hover:bg-hoverBackground',
    ]"
  >
    <div class="relative" style="width: 72px; height: 60px">
      <n-badge
        v-if="(item.unread_count || 0) > 0"
        :value="(item.unread_count || 0) > 99 ? '99+' : item.unread_count"
        :color="'#FF4A7A'"
        :offset="[-15, 10]"
      >
        <n-avatar
          :size="60"
          round
          object-fit="cover"
          :src="handleAssetUrl(item.t_head_image)"
          :img-props="avatarImgProps"
        />
      </n-badge>
      <n-avatar
        v-else
        :size="60"
        round
        object-fit="cover"
        :src="handleAssetUrl(item.t_head_image)"
        :img-props="avatarImgProps"
      />
    </div>
    <div class="flex-1 overflow-hidden">
      <div class="flex justify-between items-center mb-2">
        <div class="font-bold truncate text-primary">
          {{ item.name }}
        </div>
        <div class="ml-2 flex-shrink-0" style="font-size: 12px; color: #808080">
          {{ formatRelativeTime(item.message_response_created_at, t) }}
        </div>
      </div>
      <div class="truncate" style="font-size: 12px; color: #808080">
        {{ displayContent }}
      </div>
    </div>
  </div>
</template>

<style scoped>
/* No scoped styles needed if using UnoCSS utility classes */
</style>
