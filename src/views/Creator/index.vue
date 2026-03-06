<template>
  <div class="text-primary bg-background max-w-800px mx-auto page-padding box-border">
    <div class="w-fit mx-auto w-full">
      <!-- 加载状态 -->
      <LoadingIndicator v-if="isCreatorLoading" :text="t('creator.loading')" />
      
      <!-- 实际内容 -->
      <div v-show="!isCreatorLoading">
        <router-view class="mb-firstMargin"></router-view>

        <!-- 创建进度条 -->
        <div v-if="createStore.isCreating" class="mb-6">
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
            <div
              class="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-1000 ease-out"
              :style="{ width: createStore.createProgress + '%' }"></div>
          </div>
          <p class="text-center text-sm text-gray-600 dark:text-gray-400 mt-2">
            {{ t('creator.creating') }}... {{ Math.round(createStore.createProgress) }}%
          </p>
        </div>

        <div v-show="createStore.currentPath !== '/create/models'" class="flex" :class="[
          createStore.currentPath === '/create/style' ||
            createStore.CreateTypeList.length === 0
            ? 'justify-center'
            : 'justify-between',
        ]">
          <BabeButton type="default" v-show="createStore.CreateTypeList.length > 0 &&
            createStore.currentPath !== '/create/style'
            " @click="createStore.setCurrentPath('prev')" :class="{
              'flex-1 mr-2': globalStore.isMobile,
              'w-200px': !globalStore.isMobile,
            }">{{ t('creator.creatorIndex.prev') }}</BabeButton>
          <BabeButton @click="handleNextOrCreate" :loading="createStore.isCreating" :class="{
            'flex-1/2': globalStore.isMobile,
            'w-350px': !globalStore.isMobile,
          }">{{ getButtonText() }}</BabeButton>
        </div>
      </div>
    </div>
  </div>
</template>
<script setup lang="ts">
import { ref, onMounted, watch, computed, unref } from "vue";
import { useI18n } from "vue-i18n";
import { useRoute, useRouter } from "vue-router";
import { useCreateStore } from "@/stores/create";
import { useThemeStore } from "@/stores/themeStore";
import { useGlobalStore } from "@/stores/global/global";
import { showSubscriptionModal } from "@/utils/subscriptionModal";
import LoadingIndicator from "@/components/LoadingIndicator/index.vue";
import { useCreatorLoading } from "@/composables/useCreatorLoading";

const { t } = useI18n();
const createStore = useCreateStore();
const route = useRoute();
const router = useRouter();
const themeStore = useThemeStore();
const globalStore = useGlobalStore();
const { isCreatorLoading, stopCreatorLoading, resetCreatorLoading } = useCreatorLoading();

resetCreatorLoading();

const aiList = ref<any[]>([]);

// 初始化页面逻辑
onMounted(async () => {
  try {
    // 先加载"已创建AI列表"并决定跳转（确保最先调用该接口）
    await loadAIList();

    // 然后再加载风格列表（不影响前面的路由判断）
    createStore.setStyleList().catch((e) => {
      console.error('预加载风格列表失败:', e);
    });
  } catch (error) {
    console.error('初始化页面失败:', error);
  } finally {
    stopCreatorLoading();
  }
});



// 加载AI列表数据
const loadAIList = async () => {
  try {
    // 每次都从接口获取最新列表
    const freshData = await createStore.fetchCreatedAIList();
    aiList.value = freshData;

    // 根据最新数据决定路由跳转（仅当当前正处于 /create 根路由时）
    if (route.path === '/create') {
      if (freshData.length > 0) {
        router.replace('/create/models');
      } else {
        router.replace('/create/style');
      }
    }
  } catch (error) {
    console.error('加载AI列表失败:', error);
    // 错误情况下默认跳转到style页面
    if (route.path === '/create') {
      router.replace('/create/style');
    }
  }
};

// 计算按钮文本
const getButtonText = () => {
  if (createStore.isCreating) {
    return t('creator.creating');
  }

  // 检查是否是最后一步（relationship）
  const currentRoutePath = route.path;
  const isLastStep = currentRoutePath === '/create/relationship' ||
    (createStore.CreateTypeList.length > 0 &&
      currentRoutePath === createStore.CreateTypeList[createStore.CreateTypeList.length - 1].router_path);

  return isLastStep ? t('creator.create') : t('creator.creatorIndex.next');
};

// 处理下一步或创建按钮点击
const handleNextOrCreate = () => {
  // 检查是否是最后一步
  const currentRoutePath = route.path;
  const isLastStep = currentRoutePath === '/create/relationship' ||
    (createStore.CreateTypeList.length > 0 &&
      currentRoutePath === createStore.CreateTypeList[createStore.CreateTypeList.length - 1].router_path);
  
  if (isLastStep) {
    // 最后一步：执行创建
    createStore.createMyAi();
  } else {
    // 非最后一步：跳转到下一步
    createStore.setCurrentPath('next');
  }
};
</script>
<style scoped lang="scss">
/* 暗色模式适配已由 LoadingIndicator 组件处理 */
</style>
