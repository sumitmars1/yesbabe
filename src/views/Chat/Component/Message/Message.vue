<template>
  <div class="h-full flex flex-col">
    <div class="page-padding relative">
      <n-input style="background-color: var(--c-secondary-background);" size="large" type="text"
        :placeholder="t('chat.searchPlaceholder')" v-model="searchTerm" :disabled="loading">
        <template #prefix>
          <n-icon class="text-gray-500">
            <Search />
          </n-icon>
        </template>
      </n-input>
    </div>
    <!-- 加载状态 - 骨架屏 -->
    <div v-if="loading" class="px-4">
      <n-space vertical :size="12">
        <div v-for="i in 6" :key="i" class="flex items-center py-2">
          <n-skeleton height="60px" width="60px" circle class="mr-3" />
          <div class="flex-1">
            <n-skeleton height="16px" width="60%" class="mb-2" />
            <n-skeleton height="14px" width="80%" />
          </div>
        </div>
      </n-space>
    </div>

    <!-- 空数据状态 -->
    <div v-else-if="!loading && filteredMessageItems.length === 0"
      class="flex flex-col items-center justify-center py-16">
      <n-icon size="64" class="text-gray-400 mb-4">
        <Search />
      </n-icon>
      <div class="text-gray-500 text-lg mb-2">
        {{ searchTerm ? t('chat.noMatchingRecords') : t('chat.noChatHistory') }}
      </div>
      <div class="text-gray-400 text-sm">
        {{ searchTerm ? t('chat.tryOtherKeywords') : t('chat.startFirstConversation') }}
      </div>
    </div>

    <!-- 聊天列表 -->
    <n-space v-else vertical :size="4">
      <ChatItemComponent v-for="item in filteredMessageItems" :key="item.id" :item="item" />
    </n-space>
  </div>
</template>
<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick } from "vue";
import ChatItemComponent from "./MessageItem.vue";
import { MessageItem } from "@/types/chat";
import { getMessageList } from "@/api/chat/index";
import { Search } from "@vicons/ionicons5";
import { useThemeStore } from "@/stores/themeStore";
import { useChatStore } from "@/stores/chat";
import { useAuthStore } from "@/stores/auth";
import { useI18n } from "vue-i18n";
import { stripSuggestedReplies } from "@/utils/suggestedReply";

const { t } = useI18n();

const themeStore = useThemeStore();
const chatStore = useChatStore();
const authStore = useAuthStore();

// 状态管理
const loading = ref(false);
const messageItems = ref<MessageItem[]>([]);
const searchTerm = ref("");

// 接口调用时间戳，用于防止重复调用
let lastFetchTime = 0;
const FETCH_DEBOUNCE_DELAY = 1000; // 1秒内不重复调用

// 搜索过滤
const filteredMessageItems = computed(() => {
  if (!searchTerm.value) {
    return messageItems.value;
  }
  const lowerSearchTerm = searchTerm.value.toLowerCase();
  return messageItems.value.filter((item) =>
    item.name.toLowerCase().includes(lowerSearchTerm)
  );
});

// 获取消息列表
const fetchMessageList = async () => {
  // 如果未登录，不获取消息列表，避免显示错误提示
  if (!authStore.userInfo) {
    console.warn('Message.vue: userInfo 未加载，跳过消息列表请求');
    return;
  }

  try {
    const now = Date.now();
    // 防止短时间内重复调用
    if (now - lastFetchTime < FETCH_DEBOUNCE_DELAY) {
      console.log('Message.vue: 跳过重复调用 getMessageList');
      return;
    }
    lastFetchTime = now;

    loading.value = true;
    // 传递分页参数获取更多消息记录
    const { data } = await getMessageList({ page: 1, pageSize: 100 });
    let serverMessages = data || [];

    // 合并默认聊天模型（仅对新用户）
    const defaultChats = getDefaultChatModels();
    if (defaultChats.length > 0) {
      // 将默认聊天模型与服务器数据合并，避免重复
      const existingIds = new Set(serverMessages.map(item => item.companion_id));
      const newDefaultChats = defaultChats.filter(chat => !existingIds.has(chat.companion_id));

      // 将新的默认聊天模型添加到列表顶部
      messageItems.value = [...newDefaultChats, ...serverMessages];
      console.log('合并默认聊天模型:', newDefaultChats.length, '个');
    } else {
      messageItems.value = serverMessages;
    }

    // 未读消息数已经包含在 getMessageList 的返回数据中
    console.log('Message.vue: 获取消息列表成功', messageItems.value.length);
  } catch (error) {
    console.error("获取消息列表失败:", error);

    // 如果服务器请求失败，至少加载默认聊天模型
    const defaultChats = getDefaultChatModels();
    messageItems.value = defaultChats;
  } finally {
    loading.value = false;
  }
};

// 获取默认聊天模型的辅助函数
const getDefaultChatModels = (): MessageItem[] => {
  try {
    const stored = localStorage.getItem('defaultChatModels');
    const parsed: MessageItem[] = stored ? JSON.parse(stored) : [];
    return parsed.map((item) => ({
      ...item,
      t_head_image: item.t_head_image || item.head_image || '',
      head_image: '',
      s_head_image: '',
      avatar: '',
    }));
  } catch (error) {
    console.error('获取默认聊天模型失败:', error);
    return [];
  }
};

// 检查并添加当前聊天对象到消息列表
const ensureCurrentChatInList = () => {
  if (!chatStore.currentChat) return;

  const currentChatId =
    chatStore.currentChat.companion_id || chatStore.currentChat.id;
  const existingItemIndex = messageItems.value.findIndex(
    (item) => item.companion_id === currentChatId || item.id === currentChatId
  );

  // 如果当前聊天对象已在消息列表中：仅确保存在，不改变现有顺序
  // 修复：点击任意聊天模型都会排到最上面的问题
  if (existingItemIndex !== -1) {
    return;
  }

  // 如果当前聊天对象不在消息列表中，则添加到列表顶部
  const newMessageItem: MessageItem = {
    id: chatStore.currentChat.id,
    name: chatStore.currentChat.name,
    cover_video_url: chatStore.currentChat.cover_video_url || "",
    head_image: "",
    t_head_image: chatStore.currentChat.t_head_image,
    s_head_image: "",
    user_id: 0, // 默认值，实际可能需要从用户信息获取
    companion_id:
      chatStore.currentChat.companion_id || chatStore.currentChat.id,
    message_response_id: 0, // 默认值，首次聊天时为0
    content:
      chatStore.currentChat.content ||
      chatStore.currentChat.lastMessage ||
      "开始聊天吧！",
    message_response_created_at:
      chatStore.currentChat.message_response_created_at ||
      new Date().toISOString(),
    time: chatStore.currentChat.time || new Date().toISOString(),
    avatar: "",
    lastMessage:
      chatStore.currentChat.content ||
      chatStore.currentChat.lastMessage ||
      "开始聊天吧！",
  };

  // 新聊天对象不在列表：添加到列表尾部，避免无意义的置顶
  messageItems.value.push(newMessageItem);
};

// 提取消息内容的辅助函数
const extractMessageContent = (content: any): string => {
  if (typeof content === "string") {
    return content;
  }

  if (content && typeof content === "object") {
    // 处理不同类型的消息内容对象
    if (content.content) {
      return content.content;
    }
    if (content.message) {
      return content.message;
    }
    if (content.text) {
      return content.text;
    }
  }

  return "";
};

// 更新消息列表中的最新消息
const updateLatestMessage = (companionId: number) => {
  // 获取所有历史消息以查找非空内容
  const messages = chatStore.getChatMessages(companionId);
  const latestMessage = messages.length > 0 ? messages[messages.length - 1] : null;

  if (!latestMessage) return;

  const itemIndex = messageItems.value.findIndex(
    (item) => item.companion_id === companionId || item.id === companionId
  );

  if (itemIndex !== -1) {
    // 提取消息内容，如果为空则向前查找
    let messageContent =
      extractMessageContent(latestMessage.content) ||
      latestMessage.displayedText ||
      "";
    messageContent = stripSuggestedReplies(messageContent);

    if (!messageContent || messageContent.trim() === "") {
      for (let i = messages.length - 2; i >= 0; i--) {
        const prevMsg = messages[i];
        const prevContent =
          extractMessageContent(prevMsg.content) || prevMsg.displayedText;
        const normalizedPrev = stripSuggestedReplies(String(prevContent ?? ""));
        if (normalizedPrev && normalizedPrev.trim() !== "") {
          messageContent = normalizedPrev;
          break;
        }
      }
    }

    // 更新现有项目的最新消息内容和时间
    messageItems.value[itemIndex] = {
      ...messageItems.value[itemIndex],
      content: messageContent,
      message_response_created_at:
        latestMessage.time || new Date().toISOString(),
      lastMessage: messageContent,
    };

    // 将更新的项目移到列表顶部
    const updatedItem = messageItems.value.splice(itemIndex, 1)[0];
    messageItems.value.unshift(updatedItem);
  }
};

// 监听最新消息变化
watch(
  () => chatStore.latestMessages,
  (newLatestMessages) => {
    if (newLatestMessages && newLatestMessages.size > 0) {
      // 遍历所有最新消息，更新对应的消息列表项
      newLatestMessages.forEach((message, companionId) => {
        updateLatestMessage(companionId);
      });
    }
  },
  { deep: true, immediate: true }
);

// 监听当前聊天对象变化
watch(
  () => chatStore.currentChat,
  (newChat) => {
    if (newChat) {
      // 延迟执行，确保消息列表已经加载完成
      nextTick(() => {
        // 只在有消息列表的情况下才检查当前聊天对象
        if (messageItems.value.length > 0) {
          ensureCurrentChatInList();
        }
      });
    }
  },
  { immediate: false } // 不立即执行，等待 onMounted 后再处理
);

import { useGlobalStore } from "@/stores/global/global";
const globalStore = useGlobalStore();
// 组件挂载时获取数据
import { useRouter } from "vue-router";
const router = useRouter();
onMounted(() => {
  // 立即展示骨架屏
  loading.value = true;
  fetchMessageList().then(() => {
    // 获取消息列表后，检查当前聊天对象是否在列表中
    ensureCurrentChatInList();
  });
});

// 监听用户信息变化，确保刷新后能重新请求数据
watch(
  () => authStore.userInfo,
  (newUserInfo, oldUserInfo) => {
    // 当用户信息从无到有时（刷新后加载完成），重新获取消息列表
    if (newUserInfo && !oldUserInfo && messageItems.value.length === 0) {
      fetchMessageList().then(() => {
        ensureCurrentChatInList();
      });
    }
  },
  { immediate: false }
);
</script>

<style scoped></style>
