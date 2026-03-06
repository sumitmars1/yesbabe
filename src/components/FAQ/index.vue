<template>
  <div class="faq-container">
    <div class="faq-header">
      <h1 class="faq-title" v-html="t('faq.title')"></h1>
    </div>
    <n-collapse class="faq-collapse">
      <n-collapse-item
        v-for="(item, index) in faqItems"
        :key="index"
        :title="item.question"
        :name="index"
      >
        <div class="faq-answer">{{ item.answer }}</div>
      </n-collapse-item>
    </n-collapse>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useI18n } from 'vue-i18n';
import { NCollapse, NCollapseItem } from 'naive-ui';

const { t } = useI18n();

// FAQ数据
const faqItems = computed(() => [
  {
    question: t('faq.items.whatIsYesbabeAI.question'),
    answer: t('faq.items.whatIsYesbabeAI.answer')
  },
  {
    question: t('faq.items.isYesbabeAILegitimate.question'),
    answer: t('faq.items.isYesbabeAILegitimate.answer')
  },
  {
    question: t('faq.items.bankStatements.question'),
    answer: t('faq.items.bankStatements.answer')
  },
  {
    question: t('faq.items.customizeExperience.question'),
    answer: t('faq.items.customizeExperience.answer')
  },
  {
    question: t('faq.items.whoUsesYesbabeAI.question'),
    answer: t('faq.items.whoUsesYesbabeAI.answer')
  },
  {
    question: t('faq.items.whatIsAICompanion.question'),
    answer: t('faq.items.whatIsAICompanion.answer')
  },
  {
    question: t('faq.items.multimodalInteraction.question'),
    answer: t('faq.items.multimodalInteraction.answer')
  },
  {
    question: t('faq.items.roleplay.question'),
    answer: t('faq.items.roleplay.answer')
  },
  {
    question: t('faq.items.whatIsAIGirlfriend.question'),
    answer: t('faq.items.whatIsAIGirlfriend.answer')
  },
  {
    question: t('faq.items.personalities.question'),
    answer: t('faq.items.personalities.answer')
  },
  {
    question: t('faq.items.howAIGFLearns.question'),
    answer: t('faq.items.howAIGFLearns.answer')
  },
  {
    question: t('faq.items.privacyAndSecurity.question'),
    answer: t('faq.items.privacyAndSecurity.answer')
  },
  {
    question: t('faq.items.installation.question'),
    answer: t('faq.items.installation.answer')
  }
]);
</script>

<style scoped>
.faq-container {
  padding: 16px;
  background-color: var(--c-background);
  border-radius: 8px;
  color: var(--c-text-primary);
}

.faq-header {
  margin-bottom: 16px;
}

.faq-title {
  font-size: 24px;
  font-weight: bold;
  margin: 0;
  padding: 0;
}

:deep(.faq-title-highlight) {
  color: var(--c-app-color);
}

.faq-collapse {
  background-color: var(--c-background);
}

.faq-collapse :deep(.n-collapse-item) {
  background-color: var(--c-soild-background);
  border-radius: 8px;
  margin-bottom: 8px;
  overflow: hidden;
}

.faq-collapse :deep(.n-collapse-item__header) {
  padding: 16px;
  font-weight: 500;
  color: var(--c-text-primary);
}

.faq-collapse :deep(.n-collapse-item__content-wrapper) {
  padding: 0;
}

.faq-collapse :deep(.n-collapse-item__content-inner) {
  padding: 0;
}

.faq-answer {
  padding: 16px;
  color: var(--c-text-secondary);
  border-top: 1px solid rgba(128, 128, 128, 0.1);
}
</style>