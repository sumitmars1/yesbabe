<template>
  <n-grid x-gap="0" :cols="4" class="h-[calc(100vh_-_64px)]">
    <template v-if="!globalStore.isMobile">
      <n-gi span="1">
        <n-scrollbar class="h-[calc(100vh_-_64px)]">
          <Message />
        </n-scrollbar>
      </n-gi>
      <n-gi
        :span="chatStore.currentChat?.id ? 2 : 3"
        :style="borderStyle"
        class="h-[calc(100vh_-_64px)]"
      >
        <Chat />
      </n-gi>
      <n-gi span="1" v-if="chatStore.currentChat?.id">
        <n-scrollbar class="h-[calc(100vh_-_64px)]">
          <Profile />
        </n-scrollbar>
      </n-gi>
    </template>
    <template v-else>
      <n-gi span="4">
        <Profile v-if="isProfilePage" />
        <CollectionsMobile v-else-if="isCollectionsPage" />
        <Chat v-else-if="isChatAIPage" />
        <Message v-else />
        <!-- <RouterView /> -->
      </n-gi>
    </template>
  </n-grid>
</template>
<script setup lang="ts">
import { computed, ref, onMounted, onBeforeUnmount, watch } from "vue";
import Message from "@/views/Chat/Component/Message/Message.vue";
import Chat from "@/views/Chat/Component/Chat/Chat.vue";
import Profile from "@/views/Chat/Component/Profile.vue";
import CollectionsMobile from "@/views/Chat/Component/Collection/CollectionsMobile.vue";

import { useGlobalStore } from "@/stores/global/global";
const globalStore = useGlobalStore();

import { useChatStore } from "@/stores/chat";
const chatStore = useChatStore();

import { useRoute, onBeforeRouteLeave } from "vue-router";
const route = useRoute();

import { useWebSocket } from "@/composables/useWebSocket";
import { useDialog } from "naive-ui";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const dialog = useDialog();
const { messages } = useWebSocket();

// 是否有内容正在生成（基于消息的 isLoading 状态）
const isContentGenerating = computed(() => {
  return messages.value.some(msg => msg.isLoading === true);
});

// 是否已确认离开
const isConfirmedLeave = ref(false);

// 离开前确认（处理页面刷新/关闭）
const beforeUnload = (e: BeforeUnloadEvent) => {
  if (isContentGenerating.value && !isConfirmedLeave.value) {
    e.preventDefault();
    e.returnValue = '';
  }
};

onMounted(() => {
  window.addEventListener('beforeunload', beforeUnload);
});

onBeforeUnmount(() => {
  window.removeEventListener('beforeunload', beforeUnload);
});

// 路由离开守卫
onBeforeRouteLeave(async (_to, _from, next) => {
  if (isContentGenerating.value && !isConfirmedLeave.value) {
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
          isConfirmedLeave.value = true;
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
  next();
});

const borderStyle = computed(() => {
  return {
    borderLeft: '1px solid var(--c-hover-background)',
    borderRight: chatStore.currentChat?.id ? '1px solid var(--c-hover-background)' : 'none'
  };
});

const routeCompanionId = computed(() => {
  const raw = route.query.companionId ?? route.query.id;
  const value = Array.isArray(raw) ? raw[0] : raw;
  const companionId = Number(value);
  return Number.isFinite(companionId) && companionId > 0 ? companionId : 0;
});

watch(
  () => [route.name, routeCompanionId.value] as const,
  ([name, companionId]) => {
    if (name !== "ChatAI") return;
    if (!companionId) return;

    chatStore.ensureCurrentChatByCompanionId(companionId).catch(() => {});
  },
  { immediate: true }
);

// 判断是否显示Profile页面
const isProfilePage = computed(() => {
  return route.params.id && route.name === "ChatProfile";
});
//判断是否在ai页面
const isChatAIPage = computed(() => {
  return route.name === "ChatAI";
});

const isCollectionsPage = computed(() => {
  return route.name === "ChatCollections";
});
</script>
