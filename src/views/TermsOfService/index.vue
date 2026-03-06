<template>
  <div class="tos-view w-full min-h-screen bg-[#111] text-white px-4 md:px-8 box-border overflow-x-hidden">
    <div class="max-w-4xl mx-auto">
      <div class="tos-content font-sans leading-relaxed text-gray-300">
        <template v-for="(section, index) in parsedContent" :key="index">
          <h1 v-if="section.type === 'h1'" class="text-3xl font-bold text-white mb-6 mt-8">{{ section.text }}</h1>
          <h2 v-else-if="section.type === 'h2'" class="text-2xl font-semibold text-white mb-4 mt-8">{{ section.text }}</h2>
          <h3 v-else-if="section.type === 'h3'" class="text-xl font-medium text-white mb-3 mt-6">{{ section.text }}</h3>
          <div v-else-if="section.type === 'list'" class="pl-4 mb-4">
            <div v-for="(item, i) in section.items" :key="i" class="mb-2 flex items-start">
              <span class="mr-2">•</span>
              <span>{{ item }}</span>
            </div>
          </div>
          <p v-else class="mb-4 text-base leading-7">{{ section.text }}</p>
        </template>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'
import rawContentEn from '@/docs/term_of_service.md?raw'
import rawContentVi from '@/docs/term_of_service.vi-VN.md?raw'
import rawContentPt from '@/docs/term_of_service.pt-PT.md?raw'
import rawContentJa from '@/docs/term_of_service_ja.md?raw'

const { locale } = useI18n()

const rawContent = computed(() => {
  if (locale.value === 'vi-VN') {
    return rawContentVi
  }

  if (locale.value === 'pt-PT') {
    return rawContentPt
  }

  if (locale.value === 'ja-JP') {
    return rawContentJa
  }

  return rawContentEn
})

interface Section {
  type: 'h1' | 'h2' | 'h3' | 'p' | 'list';
  text?: string;
  items?: string[];
}

const parsedContent = computed(() => {
  const lines = rawContent.value.split('\n');
  const sections: Section[] = [];
  let currentList: string[] = [];

  const flushList = () => {
    if (currentList.length > 0) {
      sections.push({ type: 'list', items: [...currentList] });
      currentList = [];
    }
  };

  lines.forEach(line => {
    const trimmedLine = line.trim();
    if (!trimmedLine) {
      flushList();
      return;
    }

    // Check for H1 (Main Title)
    if (trimmedLine === 'Terms of Service' || trimmedLine === 'Điều khoản dịch vụ' || trimmedLine === 'Termos de Serviço' || trimmedLine === '利用規約') {
      flushList();
      sections.push({ type: 'h1', text: trimmedLine });
      return;
    }

    // Check for numbered headers (e.g., "1. General", "1.1 Account")
    const headerMatch = trimmedLine.match(/^(\d+(\.\d+)*)\.?\s+(.+)$/);
    if (headerMatch) {
      flushList();
      const level = headerMatch[1].split('.').length;
      // Map 1 -> h2, 1.1 -> h3, etc.
      const type = level === 1 ? 'h2' : 'h3';
      sections.push({ type, text: trimmedLine });
      return;
    }

    // Check for list items (starting with bullet point)
    if (trimmedLine.startsWith('•')) {
      currentList.push(trimmedLine.substring(1).trim());
      return;
    }
    
    // Check for "Date of Revision" line
    if (trimmedLine.startsWith('Date of Revision:') || trimmedLine.startsWith('Ngày cập nhật:') || trimmedLine.startsWith('Data de revisão:') || trimmedLine.startsWith('改定日:')) {
      flushList();
      sections.push({ type: 'p', text: trimmedLine });
      // Add a separator or styling if needed, but p is fine for now
      return;
    }
    
    // Default to paragraph
    flushList();
    // If previous section was also a paragraph, maybe join them? 
    // But usually in this doc, paragraphs are separated by newlines.
    // Let's check if the previous item is a paragraph to handle multi-line paragraphs in source
    // However, looking at the source, lines seem to be full paragraphs or distinct lines.
    // To be safe, we push a new paragraph.
    sections.push({ type: 'p', text: trimmedLine });
  });

  flushList();
  return sections;
});
</script>

<style scoped>
.tos-content {
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans', 'Helvetica Neue', sans-serif;
}
</style>
