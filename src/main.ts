import { createApp } from "vue";
import "./style.css";
import App from "./App.vue";
import router from "./router/index";
import "virtual:uno.css";
import "virtual:svg-icons-register";
import SvgIcon from "@/components/SvgIcon/index.vue";
import BabeButton from "@/components/BabeButton/index.vue";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import { createPinia } from "pinia";
import { createI18nInstance, SUPPORTED_LANGUAGES, type SupportedLanguage } from "@/utils/i18n";
import { initLoginModal } from "@/utils/authModal";
import { initConsumptionModal } from "@/utils/consumptionModal";
import { destroyPaymentModal } from "@/utils/paymentModal";
import { addGlobalMediaProtection, removeGlobalMediaProtection } from "@/utils/mediaProtection";
import { preloadDefaultImages } from "@/utils/defaultImageCache";
import ElementPlus from "element-plus";
import "element-plus/dist/index.css";
// 创建全局message实例

const pinia = createPinia();
pinia.use(piniaPluginPersistedstate);

const i18n = createI18nInstance();

window.addEventListener('languageChanged', (event) => {
  const language = (event as CustomEvent).detail as SupportedLanguage;
  if (language && SUPPORTED_LANGUAGES[language]) {
    i18n.global.locale.value = language;
  }
});

const app = createApp(App);
app.use(router);
app.use(pinia);
app.use(i18n);
app.use(ElementPlus);
app.component("svg-icon", SvgIcon);
app.component("BabeButton", BabeButton);

// 将message挂载到全局属性
app.mount("#app");

// 初始化登录模态框
initLoginModal();

// 初始化消费模态框
initConsumptionModal();

// 添加全局媒体保护
addGlobalMediaProtection();

// 在应用卸载时清理支付模态框和媒体保护
window.addEventListener('beforeunload', () => {
  destroyPaymentModal();
  removeGlobalMediaProtection();
});

// 预加载默认图片
preloadDefaultImages().then((images) => {
  if (images.length > 0) {
    console.log(`[应用启动] 已预加载 ${images.length} 张默认图片用于付费内容遮罩`);
  }
}).catch((error) => {
  console.error('[应用启动] 预加载默认图片失败:', error);
});
