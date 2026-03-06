<template>
  <div class="flex justify-between items-center w-full h-full">
    <div class="flex items-center">
      <div class="hamburger mr-4" @click="globalStore.toggleSidebar()">
        <span></span>
        <span class="thin-line"></span>
        <span></span>
      </div>
      <span class="mr-2 h-28px cursor-pointer" @click="router.push('/')">
        <n-image preview-disabled :src="logoUrl" width="28"></n-image>
      </span>
      <span class="text-lg font-bold">Yesbabe.ai</span>
    </div>
    <div v-if="!authStore.isLoggedIn" class="flex flex-nowrap">
      <BabeButton
        size="medium"
        type="secondary"
        class="mr-2"
        @click="showLoginModal('register')"
        v-show="!globalStore.isMobile"
      >
        {{ $t('header.createAccount') }}
      </BabeButton>
      <BabeButton size="medium" @click="showLoginModal('login')">
        {{ $t('header.login') }}
      </BabeButton>
    </div>
    <div v-else class="flex items-center gap-2">
      <!-- 登录后：仅在 userInfo 就绪后再渲染，避免刷新时闪现 Pro 升级图 -->
      <template v-if="authStore.userInfo">
        <!-- 未订阅：显示 Pro 升级按钮 -->
        <div
          v-if="authStore.userInfo.is_vip === false"
          class="min-w-92px h-34px px-1 cursor-pointer rounded-full bg-gradient-to-r from-[#FF413B] to-[#FFC300] flex items-center justify-center transition-all duration-300 hover:scale-105 hover:shadow-[0_4px_12px_rgba(255,65,59,0.3)]"
          @click="router.push('/premium/pro')"
        >
          <transition name="pro-text" mode="out-in">
            <div :key="currentProText" class="flex items-center justify-center gap-1 w-full h-full">
              <svg-icon
                v-if="currentProText === 'PRO'"
                iconClass="Huangguan"
                :size="22"
                class="flex-shrink-0"
              />
              <span :class="[
                'font-bold whitespace-normal truncate inline-block transition-all duration-300',
                currentProText === 'PRO'
                  ? 'text-lg text-white'
                  : 'text-sm text-white'
              ]" :style="currentProText === 'PRO' ? {
                '-webkitTextStroke': '2px #FF413B',
                'paintOrder': 'stroke fill'
              } : {}">{{ currentProText }}</span>
            </div>
          </transition>
        </div>
        <!-- 已订阅：显示钻石组件 -->
        <div v-else-if="authStore.userInfo.is_vip === true">
          <Diamonds></Diamonds>
        </div>
        <!-- 其他情况（例如字段缺失）不渲染，避免闪动 -->
      </template>
      <!-- 通知中心 -->
      <!-- <div class="relative">
        <NotificationBell />
        <NotificationPanel />
      </div> -->
      <n-dropdown
        trigger="click"
        :options="userMenuOptions"
        @select="handleUserMenuSelect"
      >
        <n-avatar
          round
          size="medium"
          :src="authStore.userInfo?.head_image"
          class="cursor-pointer"
        />
      </n-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { h, onMounted, watch, computed, ref, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useThemeStore } from "@/stores/themeStore";
const themeStore = useThemeStore();
import { useGlobalStore } from "@/stores/global/global";
const globalStore = useGlobalStore();
import { showLoginModal } from "@/utils/authModal";
import { useAuthStore } from "@/stores/auth/index";
import { useRouter } from "vue-router";
import { NIcon } from "naive-ui";
import logoUrl from "@/assets/logo.png";
import Diamonds from "@/components/Diamonds/index.vue";
import SvgIcon from "@/components/SvgIcon/index.vue";
import { useAccountPolling } from "@/composables/useAccountPolling";
import NotificationBell from "@/components/NotificationCenter/NotificationBell.vue";
import NotificationPanel from "@/components/NotificationCenter/NotificationPanel.vue";

const router = useRouter();
const authStore = useAuthStore();
const { startPolling, stopPolling } = useAccountPolling();
const { t } = useI18n();

// PRO按钮文字切换
const proTexts = ['PRO', t('header.maxDiscount')];
const currentProText = ref(proTexts[0]);
let textInterval: NodeJS.Timeout;

const startTextRotation = () => {
  let index = 0;
  textInterval = setInterval(() => {
    index = (index + 1) % proTexts.length;
    currentProText.value = proTexts[index];
  }, 7000); // 每7秒切换一次
};

const renderIcon = (icon: string) => {
  return () =>
    h(SvgIcon, {
      iconClass: icon,
      size: 20,
    });
};
// 用户菜单选项
const userMenuOptions = computed(() => [
  {
    label: t('header.profile'),
    key: "profile",
    icon: renderIcon("Profile"),
  },
  {
    label: t('header.subscription'),
    key: "subscription",
    icon: renderIcon("Premium"),
  },
  {
    label: t('coupon.title'),
    key: "coupon",
    icon: renderIcon("Coupon"),
  },
  // {
  //   label: "设置",
  //   key: "settings",
  //   icon: renderIcon("Setting"),
  // },
  {
    type: "divider",
    key: "d1",
  },
  {
    label: t('header.logout'),
    key: "logout",
    icon: renderIcon("Exit"),
  },
]);

// 处理用户菜单选择
function handleUserMenuSelect(key) {
  switch (key) {
    case "profile":
      router.push("/profile");
      break;
    case "subscription":
      router.push("/premium");
      break;
    case "coupon":
      router.push("/coupon");
      break;
    case "settings":
      router.push("/settings");
      break;
    case "logout":
      authStore.logout();
      // logout function now handles redirecting to home when necessary
      break;
  }
}

// 组件挂载时启动延迟轮询（App.vue已经立即获取了用户信息）
onMounted(() => {
  if (authStore.isLoggedIn) {
    startPolling(true);
  }
  startTextRotation();
});

// 监听登录状态变化
watch(() => authStore.isLoggedIn, (isLoggedIn) => {
  if (isLoggedIn) {
    startPolling(true);
  } else {
    stopPolling();
  }
});

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  if (textInterval) {
    clearInterval(textInterval);
  }
});
</script>

<style lang="scss" scoped>
.hamburger {
  position: relative;
  width: 20px;
  height: 16px;
  cursor: pointer;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  transition: all 0.3s ease;
}

.hamburger span {
  width: 100%;
  height: 2px;
  background-color: var(--c-text-primary);
  border-radius: 1px;
  transition: all 0.3s ease;
}

.hamburger .thin-line {
  height: 2px;
}

/* 初始状态：三条水平线 */
.hamburger span:nth-child(1) {
  transform: translateY(0);
}

.hamburger span:nth-child(2) {
  opacity: 1;
}

.hamburger span:nth-child(3) {
  transform: translateY(0);
}

/* active 状态：X 形 */
.hamburger.active span:nth-child(1) {
  transform: translateY(7px) rotate(45deg);
}

.hamburger.active .thin-line {
  opacity: 0;
}

.hamburger.active span:nth-child(3) {
  transform: translateY(-7px) rotate(-45deg);
}


/* 文字切换动画效果 - 左右滑动 */
.pro-text-enter-active,
.pro-text-leave-active {
  transition: all 0.6s cubic-bezier(0.4, 0, 0.2, 1);
}

.pro-text-enter-from {
  opacity: 0;
  transform: translateX(20px) scale(0.9);
}

.pro-text-leave-to {
  opacity: 0;
  transform: translateX(-20px) scale(0.9);
}
</style>
