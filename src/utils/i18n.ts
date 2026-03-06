import { createI18n } from 'vue-i18n';
import zhCN from '@/locales/zh-CN';
import enUS from '@/locales/en-US';
import viVN from '@/locales/vi-VN';
import ptPT from '@/locales/pt-PT';
import jaJP from '@/locales/ja-JP';
import hiIN from '@/locales/hi-IN';

// 支持的语言列表（中文已禁用，暂时只保留英文和印地语）
export const SUPPORTED_LANGUAGES = {
  // 'zh-CN': 'zh-CN',  // 中文已禁用
  'en-US': 'en-US',
  // 'vi-VN': 'vi-VN',  // 暂时注释
  'pt-PT': 'pt-PT',
  // 'ja-JP': 'ja-JP',  // 暂时注释
  'hi-IN': 'hi-IN'
} as const;

export type SupportedLanguage = keyof typeof SUPPORTED_LANGUAGES;

// 语言选项（暂时只保留英文和印地语）
export const LANGUAGE_OPTIONS = [
  // { label: '中文', value: 'zh-CN' }, // 中文已禁用
  { label: 'English', value: 'en-US' },
  // { label: 'Tiếng Việt', value: 'vi-VN' },  // 暂时注释
  { label: 'Português', value: 'pt-PT' },
  // { label: '日本語', value: 'ja-JP' },      // 暂时注释
  { label: 'हिन्दी', value: 'hi-IN' }
];

// 默认语言（兜底）
export const DEFAULT_LANGUAGE: SupportedLanguage = 'en-US';

// 浏览器语言到支持语言的映射（中文已禁用，映射到英语；暂时只保留英文和印地语）
const BROWSER_LANG_MAP: Record<string, SupportedLanguage> = {
  // 中文浏览器显示英文
  'zh': 'en-US',
  'zh-CN': 'en-US',
  'zh-TW': 'en-US',
  'zh-HK': 'en-US',
  // 英文
  'en': 'en-US',
  'en-US': 'en-US',
  'en-GB': 'en-US',
  // 印地语
  'hi': 'hi-IN',
  'hi-IN': 'hi-IN',
  // 其他语言暂时映射到英文
  // 'vi': 'vi-VN',
  // 'vi-VN': 'vi-VN',
  'pt': 'pt-PT',
  'pt-PT': 'pt-PT',
  'pt-BR': 'pt-PT',
  // 'ja': 'ja-JP',
  // 'ja-JP': 'ja-JP',
};

/**
 * 检测浏览器语言
 * @returns 浏览器语言对应的支持语言，如果不支持则返回 null
 */
function detectBrowserLanguage(): SupportedLanguage | null {
  if (typeof navigator === 'undefined') {
    return null;
  }

  // 获取浏览器语言列表
  const browserLanguages = navigator.languages || [navigator.language];

  for (const lang of browserLanguages) {
    // 完全匹配
    if (SUPPORTED_LANGUAGES[lang as SupportedLanguage]) {
      return lang as SupportedLanguage;
    }

    // 映射匹配
    const mappedLang = BROWSER_LANG_MAP[lang];
    if (mappedLang) {
      return mappedLang;
    }

    // 前缀匹配（如 zh-CN 匹配 zh）
    const prefix = lang.split('-')[0];
    if (BROWSER_LANG_MAP[prefix]) {
      return BROWSER_LANG_MAP[prefix];
    }
  }

  return null;
}

/**
 * 通过 IP 检测语言（预留接口）
 * 实际实现需要调用 /api/user/check_region 接口
 * @returns Promise<SupportedLanguage | null>
 */
export async function detectLanguageByIP(): Promise<SupportedLanguage | null> {
  // TODO: 实现 IP 语言检测
  // 示例实现：
  // try {
  //   const response = await checkRegion();
  //   const region = response.data?.region;
  //   if (region) {
  //     const langMap: Record<string, SupportedLanguage> = {
  //       'CN': 'zh-CN',
  //       'US': 'en-US',
  //       'VN': 'vi-VN',
  //       'PT': 'pt-PT',
  //       'JP': 'ja-JP',
  //       'IN': 'hi-IN'
  //     };
  //     return langMap[region] || null;
  //   }
  // } catch (error) {
  //   console.error('IP 语言检测失败:', error);
  // }
  return null;
}

// 标记是否已通过 IP 检测设置语言
let hasTriedIPDetection = false;

// 用户手动选择语言的 localStorage key
const USER_LANGUAGE_KEY = 'user_selected_language';

/**
 * 检测用户语言环境
 * @param skipIPDetection 是否跳过 IP 检测（默认 false）
 */
export function detectUserLanguage(skipIPDetection = false): SupportedLanguage {
  // 1. 优先检查用户手动选择的语言（localStorage）
  const userSelectedLang = localStorage.getItem(USER_LANGUAGE_KEY) as SupportedLanguage;
  if (userSelectedLang && SUPPORTED_LANGUAGES[userSelectedLang]) {
    return userSelectedLang;
  }

  // 2. 检测浏览器语言
  const browserLang = detectBrowserLanguage();
  if (browserLang) {
    return browserLang;
  }

  // 3. 如果获取不到浏览器语言且未尝试过 IP 检测，标记需要 IP 检测
  if (!skipIPDetection && !hasTriedIPDetection) {
    hasTriedIPDetection = true;
    // 异步触发 IP 检测（不阻塞当前返回）
    triggerIPDetection();
  }

  // 4. 兜底英语
  return DEFAULT_LANGUAGE;
}

/**
 * 触发 IP 语言检测（异步）
 */
async function triggerIPDetection(): Promise<void> {
  const ipLang = await detectLanguageByIP();
  if (ipLang) {
    // 触发语言切换事件
    window.dispatchEvent(new CustomEvent('languageChanged', { detail: ipLang }));
  }
}

// 设置语言（用户手动选择，持久化保存）
export function setLanguage(language: SupportedLanguage): void {
  // 使用 localStorage 保存用户手动选择的语言
  localStorage.setItem(USER_LANGUAGE_KEY, language);
  // 触发自定义事件，通知其他组件语言已更改
  window.dispatchEvent(new CustomEvent('languageChanged', { detail: language }));
}

// 获取当前语言
export function getCurrentLanguage(): SupportedLanguage {
  return detectUserLanguage();
}

// 创建i18n实例（暂时只保留英文和印地语）
export function createI18nInstance() {
  const currentLanguage = detectUserLanguage();

  const i18n = createI18n({
    legacy: false, // 使用 Composition API
    locale: currentLanguage,
    fallbackLocale: 'en-US',
    messages: {
      // 'zh-CN': zhCN,  // 中文已禁用
      'en-US': enUS,
      // 'vi-VN': viVN,  // 暂时注释
      'pt-PT': ptPT,
      // 'ja-JP': jaJP,  // 暂时注释
      'hi-IN': hiIN
    },
    globalInjection: true // 全局注入
  });

  return i18n;
}

// 语言切换函数
export function switchLanguage(i18n: any, language: SupportedLanguage): void {
  if (SUPPORTED_LANGUAGES[language]) {
    i18n.global.locale.value = language;
    setLanguage(language);
  }
}
