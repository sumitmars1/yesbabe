<template>
  <div class="flex justify-between items-center w-full h-full">
   
    <div class="flex items-center">
      <svg-icon
        v-if="
          globalStore.isMobile &&
          ($route.path === '/profile' ||
            $route.path === '/profile/purchased-collections' ||
            $route.path === '/profile/consumption-details' ||
            $route.path === '/ai-generator/select-model')
        "
        iconClass="back"
        :size="24"
        class="mr-2 cursor-pointer"
        @click="handleBackMessage"
      ></svg-icon>
      <!-- 展示当前路由的名称（国际化） -->
      <span class="text-lg font-bold">{{ typeof $route.meta?.headerName === 'string' ? tMenu(String($route.meta.headerName)) : '' }}</span>
    </div>
    <div v-if="!authStore.isLoggedIn" class="flex flex-nowrap">
      <BabeButton
        size="medium"
        type="secondary"
        class="mr-2"
        @click="showLoginModal('register')"
      >
        {{ tMenu('header.createAccount') }}
      </BabeButton>
      <BabeButton @click="showLoginModal('login')" size="medium">
        {{ tMenu('header.login') }}
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
              ]" :style="currentProText === 'PRO' ? '-webkit-text-stroke: 2px #FF413B; paint-order: stroke fill;' : undefined">{{ currentProText }}</span>
            </div>
          </transition>
        </div>
        <!-- 已订阅：显示钻石组件 -->
        <div v-else-if="authStore.userInfo.is_vip === true">
          <Diamonds></Diamonds>
        </div>
        <!-- 其他情况（例如字段缺失）不渲染，避免闪动 -->
      </template>
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
import { h, ref, onMounted, onBeforeUnmount } from "vue";
import { useI18n } from "vue-i18n";
import { useThemeStore } from "@/stores/themeStore";
const themeStore = useThemeStore();
import { useGlobalStore } from "@/stores/global/global";
const globalStore = useGlobalStore();
import { showLoginModal } from "@/utils/authModal";
import { useAuthStore } from "@/stores/auth/index";
import { useRouter, useRoute } from "vue-router";
import { NIcon } from "naive-ui";
import logoUrl from "@/assets/logo.png";
import Diamonds from "@/components/Diamonds/index.vue";
// 渲染图标
import SvgIcon from "@/components/SvgIcon/index.vue";
const renderIcon = (icon: string) => {
  return () =>
    h(SvgIcon, {
      iconClass: icon,
      size: 20,
    });
};
const router = useRouter();
const route = useRoute();
const authStore = useAuthStore();

// PRO按钮文字切换
const { t } = useI18n();
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

// 组件挂载时启动文字切换
onMounted(() => {
  startTextRotation();
});

// 组件卸载时清理定时器
onBeforeUnmount(() => {
  if (textInterval) {
    clearInterval(textInterval);
  }
});

// 用户菜单选项
// 用户菜单选项
import { computed } from "vue";
const { t: tMenu } = useI18n();

const userMenuOptions = computed(() => [
  {
    label: tMenu('header.profile'),
    key: "profile",
    icon: renderIcon("Profile"),
  },
  {
    label: tMenu('header.subscription'),
    key: "subscription",
    icon: renderIcon("Premium"),
  },
  {
    label: tMenu('coupon.title'),
    key: "coupon",
    icon: renderIcon("Coupon"),
  },
  // {
  //   label: tMenu('header.settings'),
  //   key: 'settings',
  //   icon: renderIcon('Setting'),
  // },
  {
    type: "divider",
    key: "d1",
  },
  {
    label: tMenu('header.logout'),
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
      authStore.logout(false); // Don't redirect in logout function since we do it here
      router.push("/");
      break;
  }
}
const handleBackMessage = () => {
  const currentPath = router.currentRoute.value.path;

  // 如果是模型选择页面，直接返回到 AI Generator 页面
  if (currentPath === '/ai-generator/select-model') {
    router.push('/ai-generator');
    return;
  }

  // 如果是生成结果页面，直接返回到 AI Generator 页面
  if (currentPath === '/ai-generator/result') {
    router.push('/ai-generator');
    return;
  }

  // 如果是消费明细页面，返回到个人中心
  if (currentPath === '/profile/consumption-details') {
    router.push('/profile');
    return;
  }

  // 根据当前页面决定返回到哪里
  if (/^\/chat\/profile\/\d+$/.test(currentPath)) {
    router.push('/chat');
  } else if (/^\/chat\/collections\/\d+$/.test(currentPath)) {
    router.push('/chat');
  } else if (/^\/chat\/collections\/\d+\/files\/\d+$/.test(currentPath)) {
    router.push(`/chat/collections/${route.params.companionId || route.params.id}`);
  } else if (currentPath === '/my-roles') {
    router.push('/chat');
  } else if (currentPath.startsWith('/profile')) {
    router.push('/chat');
  } else {
    router.push("/");
  }
};
</script>

<style lang="scss" scoped>
.hamburger {
  position: relative;
  width: 16px;
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

.hamburger.active span:nth-child(2) {
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
