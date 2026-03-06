<template>
  <div class="relative group mt-[18px]">
    <div v-if="showTTS" class="tts-tab absolute -top-[13px] left-0 z-10 h-[26px]">
      <button type="button" class="tts-button-wrapper" :class="{
        'tts-button-disabled': isTTSDisabled,
        'tts-button-playing': isPlaying
      }" :title="ttsButtonText" :aria-label="ttsButtonText" :aria-disabled="isTTSDisabled" :disabled="isTTSDisabled"
        @click.stop="handleTTS">
        <div class="tts-icon-container">
          <svg-icon v-if="!isPlaying" :iconClass="'voice'" :size="18"
            class="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          <div v-else
            class="playing-animation flex items-end justify-between h-[12px] w-[32px] absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2">
            <span v-for="i in 9" :key="i" class="bar" :class="`bar-${i}`"></span>
          </div>
        </div>
      </button>
    </div>

    <div :class="containerClass" :style="{
      borderRadius,
      minHeight: hidden ? '120px' : 'auto',
      maxHeight: hidden ? '400px' : 'none',
      width: hidden ? '240px' : 'auto'
    }">
      <div :class="textClass" v-html="textContentHtml"></div>
      <div v-if="hidden" class="absolute inset-0 z-[1000] flex flex-col items-center justify-center p-5 text-center">
        <div class="flex flex-col items-center gap-4">
          <div class="text-sm font-semibold">{{ overlayDescription }}</div>
          <div class="flex items-center justify-center">
            <svg-icon iconClass="lock" :size="20" />
          </div>
          <BabeButton type="primary" size="large" @click="handleUpgradeClick"
            class="min-w-[120px] h-10 font-semibold rounded-20">
            <svg-icon iconClass="Huangguan" :size="16" class="mr-1" />
            {{ t('chatItem.openPro') }}
          </BabeButton>
        </div>
      </div>
    </div>

    <!-- 推荐回复列表 -->
    <div v-if="shouldShowSuggestions" class="suggestions-container">
      <div class="suggestions-hint">{{ t('chat.suggestedReplies') }}</div>
      <div v-for="(suggestion, idx) in suggestions" :key="`${idx}-${suggestion}`" class="suggestion-chip"
        :class="{ 'suggestion-chip--disabled': isSuggestionsDisabled }" @click.stop="handleSuggestionClick(suggestion)">
        <span class="suggestion-text">{{ suggestion }}</span>
        <svg-icon iconClass="arrow-right" :size="12" class="suggestion-arrow" />
      </div>
    </div>

    <!-- 隐藏的音频播放器 -->
    <audio ref="audioPlayer" @ended="handleAudioEnded" @pause="handleAudioPause" @play="handleAudioPlay"
      style="display: none;"></audio>
  </div>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue';
import { useI18n } from 'vue-i18n';
import { formatTextWithEmojis } from '@/utils/emoji';
import { showSubscriptionModal } from '@/utils/subscriptionModal';
import { getTextToSpeech } from '@/api/chat';
import { useWebSocket } from "@/composables/useWebSocket";

const props = defineProps<{
  content: any;
  isSelf: boolean;
  hidden?: boolean;
  responseId?: number;
}>();

const emit = defineEmits<{
  (e: "send-suggestion", text: string): void;
}>();

const { t } = useI18n();
const { isReplying } = useWebSocket();

// 音频播放器相关状态
const audioPlayer = ref<HTMLAudioElement | null>(null);
const isGenerating = ref(false);
const isPlaying = ref(false);
const audioUrl = ref<string | null>(null);

const borderRadius = computed(() => (props.isSelf ? '16px 0px 16px 16px' : '0px 16px 16px 16px'));

const rawText = computed(() => {
  const v = props.content as any;
  if (typeof v === 'string') return v;
  if (v && typeof v === 'object') {
    const candidate = v.content || v.message || v.full_content || '';
    return typeof candidate === 'string' ? candidate : String(candidate ?? '');
  }
  return '';
});

const normalizeSuggestedReplyText = (input: string) => {
  const text = String(input ?? "").trim();
  if (!text) return "";
  return text.replace(/^(?:%{3}\s*)+/, "").trim();
};

const parseSuggestedReplies = (input: string) => {
  const text = input ?? "";
  const firstMarkerIndex = text.indexOf("%%%");
  if (firstMarkerIndex === -1) {
    return { bodyText: text, suggestions: [] as string[] };
  }

  const bodyText = text.slice(0, firstMarkerIndex).replace(/\s+$/, "");
  const tail = text.slice(firstMarkerIndex);
  const suggestions: string[] = [];

  const re = /%%%\s*([^\r\n]*)/g;
  let match: RegExpExecArray | null;
  while ((match = re.exec(tail))) {
    const suggestion = normalizeSuggestedReplyText(match[1] ?? "");
    if (suggestion) suggestions.push(suggestion);
  }

  return { bodyText, suggestions };
};

const parsedText = computed(() => {
  if (props.isSelf) {
    return { bodyText: rawText.value, suggestions: [] as string[] };
  }
  return parseSuggestedReplies(rawText.value);
});
const suggestions = computed(() => parsedText.value.suggestions);

const textContentHtml = computed(() =>
  formatTextWithEmojis(parsedText.value.bodyText, {
    lightenParentheses: !props.isSelf && parsedText.value.bodyText.includes('('),
  })
);

const hidden = computed(() => !!props.hidden);
const showTTS = computed(() => !hidden.value && !props.isSelf && parsedText.value.bodyText.trim().length > 0);
const isTTSDisabled = computed(() => isGenerating.value || !props.responseId);
const overlayDescription = computed(() => t('chatItem.maskedTextPlaceholder'));

const containerClass = computed(() => [
  props.isSelf ? 'text-white bg-gradient-to-r from-[#7562ff] to-[#b462ff] text-left' : 'chat-content',
  'large-card inline-block max-w-70% whitespace-pre-wrap card relative',
  hidden.value ? 'masked-container' : '',
]);

const textClass = computed(() => [
  'masked-text',
  { blur: hidden.value },
]);

const handleUpgradeClick = () => {
  try { showSubscriptionModal('inline'); } catch (e) { console.error(e); }
};

const shouldShowSuggestions = computed(() => {
  if (hidden.value) return false;
  if (props.isSelf) return false;
  return suggestions.value.length > 0;
});

const isSuggestionsDisabled = computed(() => isReplying.value === true);

const handleSuggestionClick = (text: string) => {
  if (isSuggestionsDisabled.value) return;
  const normalized = normalizeSuggestedReplyText(String(text ?? ""));
  if (!normalized) return;
  emit("send-suggestion", normalized);
};

// TTS 按钮文本
const ttsButtonText = computed(() => {
  if (isGenerating.value) return t('chatItem.generating');
  if (isPlaying.value) return t('chatItem.playing');
  return t('chatItem.textToSpeech');
});

// 处理 TTS 点击
const handleTTS = async () => {
  // isPlaying.value = true
  if (isGenerating.value || !props.responseId) return;

  // 如果正在播放，则暂停
  if (isPlaying.value && audioPlayer.value) {
    audioPlayer.value.pause();
    return;
  }

  // 如果已经有音频，直接播放
  if (audioUrl.value && audioPlayer.value) {
    audioPlayer.value.play();
    return;
  }

  // 生成音频
  try {
    isGenerating.value = true;
    const audioBlob = await getTextToSpeech(props.responseId);

    // 创建 Blob URL
    const url = URL.createObjectURL(audioBlob);
    audioUrl.value = url;

    // 设置音频源并播放
    if (audioPlayer.value) {
      audioPlayer.value.src = url;
      audioPlayer.value.play();
    }
  } catch (error: any) {
    console.error('TTS 错误:', error);
  } finally {
    isGenerating.value = false;
  }
};

// 音频事件处理
const handleAudioEnded = () => {
  isPlaying.value = false;
};

const handleAudioPause = () => {
  isPlaying.value = false;
};

const handleAudioPlay = () => {
  isPlaying.value = true;
};
</script>

<style scoped>
.tts-tab {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  /* padding: 4px 4px; */
  /* border-radius: 16px; */
  /* border-radius: 16px; */
  border-radius: 13px;
  /* 添加圆角，让边缘更柔和 */

  background: var(--chat-content-background);
}

/* .tts-tab::after {
   content: '';
   position: absolute;
   right: 0px;
   bottom: 4px;
   width: 8px;
   height: 8px;
   background: var(--chat-content-background);
   border-radius: 50%;
} */

/* TTS 按钮容器 */
.tts-button-wrapper {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.5s ease-in-out;
  flex-shrink: 0;
  padding: 0;
  border: none;
  background: transparent;
}

/* 图标容器 */
.tts-icon-container {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 26px;
  height: 26px;
  border-radius: 13px;
  transition: width 0.5s cubic-bezier(0.34, 1.56, 0.64, 1), background-color 0.3s ease, color 0.3s ease, border-radius 0.3s ease;
  background-color: rgba(117, 98, 255, 0.1);
  color: #7562ff;
}

.tts-button-wrapper.tts-button-playing .tts-icon-container {
  width: 56px;
}

.tts-button-wrapper.tts-button-playing .tts-icon-container::before {
  border-radius: 13px;
}

/* 边框效果 - 使用伪元素 */
.tts-icon-container::before {
  /* content: '';
  position: absolute;
  top: -1px;
  left: -1px;
  right: -1px;
  bottom: -1px;
  border-radius: 50%;
  border: 2px solid transparent;
  transition: all 0.3s ease; */
}

/* Hover 效果 - 显示边框 */
.tts-button-wrapper:not(.tts-button-disabled):hover .tts-icon-container::before {
  border-color: #7562ff;
  opacity: 0.6;
}

/* 播放状态 - 边框脉冲动画 (已移除，改用波形动画) */
/* .tts-button-wrapper.tts-button-playing .tts-icon-container::before {
  border-color: #7562ff;
  animation: tts-pulse 1.5s ease-in-out infinite;
} */

/* 禁用状态 */
.tts-button-wrapper.tts-button-disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

/* 波形动画 */
.bar {
  display: inline-block;
  width: 2px;
  background-color: #7562ff;
  border-radius: 1px;
  transform-origin: bottom;
  animation: wave 1s ease-in-out infinite;
}

.bar-1 {
  height: 30%;
  animation-duration: 0.5s;
  animation-delay: -0.1s;
}

.bar-2 {
  height: 60%;
  animation-duration: 0.7s;
  animation-delay: -0.3s;
}

.bar-3 {
  height: 90%;
  animation-duration: 0.6s;
  animation-delay: -0.5s;
}

.bar-4 {
  height: 100%;
  animation-duration: 0.8s;
  animation-delay: -0.2s;
}

.bar-5 {
  height: 75%;
  animation-duration: 0.9s;
  animation-delay: -0.6s;
}

.bar-6 {
  height: 50%;
  animation-duration: 0.7s;
  animation-delay: -0.4s;
}

.bar-7 {
  height: 85%;
  animation-duration: 0.6s;
  animation-delay: -0.7s;
}

.bar-8 {
  height: 65%;
  animation-duration: 0.8s;
  animation-delay: -0.35s;
}

.bar-9 {
  height: 45%;
  animation-duration: 0.75s;
  animation-delay: -0.55s;
}

@keyframes wave {

  0%,
  100% {
    transform: scaleY(0.4);
    opacity: 0.6;
  }

  50% {
    transform: scaleY(1);
    opacity: 1;
  }
}

/* ===== 推荐回复卡片样式 ===== */
.suggestions-container {
  margin-top: 12px;
  max-width: 70%;
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.suggestions-hint {
  align-self: flex-start;
  font-size: 12px;
  line-height: 1.2;
  color: var(--c-text-secondary);
  opacity: 0.7;
  padding-left: 4px;
}

.suggestion-chip {
  position: relative;
  align-self: flex-start;
  display: inline-flex;
  align-items: center;
  gap: 6px;
  width: fit-content;
  max-width: 100%;
  padding: 6px 12px;
  background: var(--c-secondary-background);
  border-radius: 16px;
  border: 1px solid var(--btn-border);
  cursor: pointer;
  transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
  overflow: hidden;
}

/* 渐变边框效果 - 使用伪元素 */
.suggestion-chip::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: 20px;
  padding: 1px;
  background: linear-gradient(135deg, rgba(117, 98, 255, 0.3) 0%, rgba(180, 98, 255, 0.2) 100%);
  -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.suggestion-chip:hover::before {
  opacity: 1;
}

/* 悬停光效 */
.suggestion-chip::after {
  content: '';
  position: absolute;
  inset: 0;
  background: linear-gradient(135deg, rgba(117, 98, 255, 0.08) 0%, rgba(180, 98, 255, 0.04) 100%);
  opacity: 0;
  transition: opacity 0.3s ease;
}

.suggestion-chip:hover::after {
  opacity: 1;
}

.suggestion-text {
  position: relative;
  z-index: 1;
  font-size: 13px;
  line-height: 1.5;
  color: var(--c-text-primary);
  white-space: pre-wrap;
  word-break: break-word;
  text-align: left;
  transition: transform 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.suggestion-arrow {
  position: relative;
  z-index: 1;
  flex-shrink: 0;
  color: var(--c-app-color);
  opacity: 0;
  transform: translateX(-4px);
  transition: all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1);
}

/* 悬停状态 */
.suggestion-chip:hover {
  transform: translateX(2px);
  box-shadow: 0 4px 12px rgba(117, 98, 255, 0.12);
}

.suggestion-chip:hover .suggestion-text {
  transform: translateX(-2px);
}

.suggestion-chip:hover .suggestion-arrow {
  opacity: 1;
  transform: translateX(0);
}

/* 禁用状态 */
.suggestion-chip--disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.suggestion-chip--disabled:hover {
  transform: none;
  box-shadow: none;
}

.suggestion-chip--disabled:hover::before,
.suggestion-chip--disabled:hover::after {
  opacity: 0;
}

.suggestion-chip--disabled .suggestion-arrow {
  display: none;
}

/* 点击反馈 */
.suggestion-chip:active:not(.suggestion-chip--disabled) {
  transform: scale(0.98) translateX(2px);
  transition-duration: 0.1s;
}
</style>
