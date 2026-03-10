<template>
  <!-- 加载阶段（流式开始） -->
  <div v-if="isLoading" class="chat-content card inline-block" :style="{ borderRadius, maxWidth: '70%' }">
    <div class="flex items-center space-x-2">
      <template v-if="useBlobSpinner">
        <BlobsColorCircle
          :size="26"
          mode="blobs"
          :speed="6"
          :colors="['#E8D5FF', '#C084FC', '#8B5FFF', '#5D4AFF']"
          :primaryIndex="0"
        />
      </template>
      <n-spin v-else size="small" />
      <span class="text-gray-500 text-sm">{{ startMessage }}</span>
    </div>
  </div>

  <!-- 流式打字阶段（持续输出） -->
  <div v-else-if="isTyping" :class="typingContainerClass" :style="typingContainerStyle">
    <div class="flex items-start space-x-2">
      <template v-if="useBlobSpinner">
        <BlobsColorCircle
          :size="26"
          mode="blobs"
          :speed="6"
          :colors="['#E8D5FF', '#C084FC', '#8B5FFF', '#5D4AFF']"
          :primaryIndex="0"
        />
      </template>
      <n-spin v-else size="small" />
      <div class="whitespace-pre-wrap relative w-full">
        <span :class="[{ 'blur-lg': isHiddenProgress }]" v-html="typingHtml"></span>
        <span class="typing-cursor">|</span>

        <!-- 渐进式打码遮罩，仅用于 text_progress_hidden -->
        <div v-if="isHiddenProgress" class="absolute inset-0 z-[1000] flex flex-col items-center justify-center p-5 text-center">
          <div class="flex flex-col items-center gap-4">
            <div class="text-sm font-semibold">{{ overlayDescription }}</div>
            <div class="flex items-center justify-center">
              <svg-icon iconClass="lock" :size="20" />
            </div>
            <BabeButton type="primary" size="large" @click="handleUpgradeClick" class="min-w-[120px] h-10 font-semibold rounded-20">
              {{ upgradeCtaLabel }}
            </BabeButton>
          </div>
        </div>
      </div>
    </div>
  </div>

  <!-- 完成态文本 -->
  <TextContent
    v-else
    :content="contentForText"
    :is-self="isSelf"
    :response-id="responseId"
    @send-suggestion="(text) => emit('send-suggestion', text)"
  />
  
</template>

<script setup lang="ts">
import { computed } from 'vue';
import TextContent from '../parts/TextContent.vue';
import { useI18n } from 'vue-i18n';
import { formatTextWithEmojis } from '@/utils/emoji';
import { MessageType } from '@/utils/websocket';
import { showSubscriptionModal } from '@/utils/subscriptionModal';
import BlobsColorCircle from '@/components/BlobsColorCircle/index.vue';
import { stripSuggestedReplies } from "@/utils/suggestedReply";

const props = defineProps<{
  content: any;
  messageType: string;
  isSelf: boolean;
  responseId?: number;
  isLoading?: boolean;
  isTyping?: boolean;
  typingText?: string;
  loadingIndicator?: 'default' | 'blobs';
}>();

const emit = defineEmits<{
  (e: "send-suggestion", text: string): void;
}>();

const { t } = useI18n();

// 规范文本内容：对象优先取 content/message/full_content
const contentForText = computed(() => {
  const v = props.content as any;
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    return v.content || v.message || v.full_content || '';
  }
  return '';
});

const borderRadius = computed(() => (props.isSelf ? '16px 0px 16px 16px' : '0px 16px 16px 16px'));
const startMessage = computed(() => {
  const v = props.content as any;
  if (v && typeof v === 'object' && typeof v.message === 'string') return v.message;
  return t('chatItem.generatingReply');
});

const typingHtml = computed(() => {
  const raw = props.typingText || contentForText.value || '';
  const bodyText = props.isSelf ? raw : stripSuggestedReplies(raw);
  return formatTextWithEmojis(bodyText, {
    lightenParentheses: !props.isSelf && bodyText.includes('('),
  });
});

// 渐进式打码：当消息类型为 text_progress_hidden 时，打字阶段使用遮罩和模糊
const isHiddenProgress = computed(() => String(props.messageType || '').toLowerCase() === MessageType.text_progress_hidden);
const typingContainerClass = computed(() => [
  isHiddenProgress.value ? 'chat-content card inline-block masked-container premium-mask' : 'chat-content card inline-block',
]);

// 隐藏状态的高度设置
const typingContainerStyle = computed(() => ({
  borderRadius: borderRadius.value,
  maxWidth: '70%',
  minHeight: isHiddenProgress.value ? '100px' : 'auto',
  maxHeight: isHiddenProgress.value ? '400px' : 'none',
  width: isHiddenProgress.value ? '240px' : 'auto'
}));
const overlayDescription = computed(() => t('chatItem.maskedTextPlaceholder'));
const upgradeCtaLabel = computed(() => t('chatItem.openPro'));
const handleUpgradeClick = () => { try { showSubscriptionModal('inline'); } catch (e) {} };
const useBlobSpinner = computed(() => props.loadingIndicator === 'blobs');
</script>

<style scoped>
.typing-cursor {
  display: inline-block;
  animation: blink 1s infinite;
  color: #18a058;
  font-weight: bold;
  margin-left: 2px;
}

@keyframes blink {
  0%, 50% { opacity: 1; }
  51%, 100% { opacity: 0; }
}

</style>
