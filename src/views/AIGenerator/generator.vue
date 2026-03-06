<template>
  <div class="text-primary bg-background page-padding">
    <!-- 视频生成确认弹窗 -->
    <VideoGenerationModal ref="videoModalRef" @confirm="handleConfirmGenerateVideo" />

    <!-- PC端模型选择弹窗 -->
    <ModelSelectorModal v-if="!globalStore.isMobile" v-model:show="showModal" :nav-list="navList"
      :initial-nav-name="modelNavName" :initial-nav-id="modalNavValue" :initial-sex="modalSexValue"
      :current-model-id="currentModel?.id" @confirm="handleModalConfirm" @cancel="handleModalCancel" />
    <div class="mb-firstMargin">
      <div class="flex flex-col mb-firstMargin">
        <div class="flex mb-thirdMargin" v-if="!globalStore.isMobile">
          <svg-icon iconClass="photo" class="mr-1" :size="24"></svg-icon>
          <span class="title-16">{{ t("generator.generateImage") }}</span>
        </div>
        <div class="text-sm" v-if="!globalStore.isMobile">{{ t("generator.customizeStyle") }}</div>
      </div>
      <div class="flex flex-col items-center">
        <template v-if="loading || !currentModel?.id || isCompanionLoading">
          <div>
            <div class="text-primary relative">
              <n-skeleton circle :width="120" :height="120" />
            </div>
          </div>
          <div class="text-base font-bold w-20 mt-2">
            <n-skeleton text :width="80" />
          </div>
          <!-- <div
            class="bg-white w-full bg-cardBackground text-primary rounded-lg p-4 max-w-md text-left relative h-140px box-border">
            <n-skeleton text :repeat="5" width="100%" />
          </div> -->
        </template>

        <!-- 有数据时显示实际内容 -->
        <template v-else>
          <div>
            <!-- 删除了Uploader组件，只保留头像显示 -->
            <div class="text-primary relative">
              <n-avatar :key="companionInfo?.id || currentModel.id"
                :src="companionInfo?.t_head_image" mode="avatar" :size="120"
                object-fit="cover"
                class="shadow-[0_0_8px_rgba(255,255,255,0.8)] rounded-full border-[2px] border-solid border-white" />
              <div
                class="absolute bottom-2.5 right-2.5 w-5 h-5 box-border bg-black border-0 rounded-full flex items-center justify-center cursor-pointer refresh-btn"
                @click="showModelSelector">
                <svg-icon iconClass="refresh" :size="12" class="text-white"></svg-icon>
              </div>
            </div>
          </div>
          <!-- 角色名称与副标题（年龄 · 职业） -->
          <div class="text-base font-bold whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
            {{ companionInfo?.name || currentModel.name }}
          </div>
          <div v-if="subtitleText"
            class="text-xs text-#8C8C8C mt-1 whitespace-nowrap overflow-hidden text-ellipsis max-w-full">
            {{ subtitleText }}
          </div>
        </template>
      </div>
    </div>
    <!-- 角色描述 -->
    <div class="mb-firstMargin relative">
      <template v-if="loading || !currentModel?.id || isCompanionLoading">
        <div class="card rounded-lg">
          <n-skeleton text :repeat="4" width="100%" />
        </div>
      </template>
      <div v-else class="relative">
        <n-input v-model:value="editableDescription" type="textarea" :rows="4" autosize
          class="h-146px bg-cardBackground large-card rounded-lg text-primary pb-30px"
          :placeholder="currentPrompt?.content || currentModel?.description" />
        <div class="absolute bottom-2 right-2" v-if="authStore.userInfo">
          <div
            class="w-6 h-6 block bg-invertBackground text-invertText rounded-full flex items-center justify-center cursor-pointer refresh-btn description-refresh-btn"
            @click="refreshDescription">
            <svg-icon iconClass="update" :size="18"></svg-icon>
          </div>
        </div>
      </div>
    </div>
    <!-- 服装选择区域 -->
    <div class="mb-firstMargin" v-if="categories.length > 0">
      <!-- 服装类型标签 -->
      <n-tabs v-model:value="selectedCategoryId">
        <n-tab-pane v-for="category in categories" :key="category.id" :label="category.name" :name="category.id">
          <n-scrollbar x-scrollable style="">
            <div class="wheel-x-container" @wheel.prevent="handleHorizontalWheel">
              <div class="flex gap-2 w-max pt-3px pb-2px">
                <CreateCard v-for="item in currentClothingOptions" :key="item.id" type="IMAGE" :image="item.image_url"
                  :name="item.name" width="w-88px" height="h-82px" border-radius="8px"
                  :isSelected="selectedItems[selectedCategoryId] === item.id" @click="selectItem(item.id)" />
              </div>
            </div>
          </n-scrollbar>
        </n-tab-pane>
      </n-tabs>
    </div>

    <!-- 生成图片数量选择 -->
    <div class="mb-firstMargin" v-if="imageCounts.length > 0">
      <div class="mb-thirdMargin">
        <span class="title-16">{{
          t("generator.generateImageCount")
          }}</span>
      </div>
      <div class="grid grid-cols-5 gap-2">
        <div v-for="count in imageCounts" :key="count.id"
          class="cursor-pointer relative h-8 rounded-lg border-2 flex items-center justify-center" :class="{
            'shadow-activeBorder text-appColor':
              selectedImageCount === count.image_number,
            'shadow-border text-gray-500':
              selectedImageCount !== count.image_number,
          }" @click="handleImageCountClick(count)">
          {{ count.image_number }}
          <div class="absolute -right-1 -top-2.5" v-if="count.is_vip_show">
            <svg-icon iconClass="diamond" :size="24"></svg-icon>
          </div>
        </div>
      </div>
    </div>
    <!-- 费用显示 -->
    <div class="flex items-center mb-4">
      <span class="mr-2 title-16">{{ t("generator.cost") }}:</span>
      <div class="flex items-center">
        <svg-icon iconClass="diamond" :size="18" class="mr-1"></svg-icon>
        <span class="text-primary leading-none">{{ currentPrice }}</span>
      </div>
    </div>
    <!-- 生成按钮 -->
    <div class="flex justify-center mb-4">
      <BabeButton type="primary" block @click="generateImage" :loading="isGenerating">
        {{
          isGenerating
            ? t("generator.generating")
            : t("generator.generateButton")
        }}
      </BabeButton>
    </div>

    <!-- 移动端查看结果按钮 -->
    <div class="flex justify-center mb-10" v-if="globalStore.isMobile">
      <BabeButton type="default" block @click="goToResultPage">
        {{ t("generator.viewResults") }}
      </BabeButton>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch, nextTick, onActivated } from "vue";
import { useRouter, useRoute } from "vue-router";
import { NSkeleton, NInfiniteScroll, NScrollbar, useMessage } from "naive-ui";
import { useI18n } from "vue-i18n";
import CreateCard from "@/views/Creator/Compoent/CreateCard.vue";
import { getImageRules, getImageOptions } from "@/api/AIGenerator";
import { getHomeList, getNavs } from "@/api/home";
import { getCurrentCompanion } from "@/api/chat";
import { showSubscriptionModal } from "@/utils/subscriptionModal";
import { showLoginModal } from "@/utils/authModal";
import ModelSelectorModal from "@/components/ModelSelectorModal/index.vue";
const baseURL = import.meta.env.VITE_API_BASE_URL;
import type {
  GenImageTabsResponse,
  PricingTier,
} from "@/api/AIGenerator/type";
import type { NavItem } from "@/api/home/type";
import type { HomeListData } from "@/api/home/type";
import type { CompanionInfo, DefaultPrompt } from "@/api/chat/types";
import { useGlobalStore } from "@/stores/global/global";
import { useImageGeneratorStore } from "@/stores/imageGenerator";
import { useAIGeneratorUIStore } from "@/stores/aigenerator";
import { useChatStore } from "@/stores/chat";
import { useImageGeneratorModelStore } from "@/stores/imageGenerator/model";
import { startImageGeneration } from "./index";
import VideoGenerationModal from "@/components/VideoGenerationModal/index.vue";
import { useVideoWebSocket } from "@/composables/useVideoWebSocket";
import { showConsumptionModal } from "@/utils/consumptionModal";
import { MessageType } from "@/utils/websocket";
import { showDiamondRechargeModal } from "@/utils/diamondRechargeModal";
// 暂时注释掉自动恢复功能
// import { autoResumeGeneration } from "./index";
const globalStore = useGlobalStore();
const imageGeneratorStore = useImageGeneratorStore();
const generatorUIStore = useAIGeneratorUIStore();
const chatStore = useChatStore();
const imageModelStore = useImageGeneratorModelStore();
// 添加事件发射
const emit = defineEmits([
  "generateComplete",
  "video-generate-requested",
  "video-generate-progress",
  "video-generate-complete",
  "video-generate-start",
  "initFinished",
]);

// 国际化（提前用于提示）
const { t } = useI18n();

// 视频WebSocket（/api/ws/video）：发送图生视频请求
const {
  initWebSocket: initVideoWebSocket,
  disconnect: disconnectVideoWebSocket,
  isConnected: isVideoWsConnected,
  isConnecting: isVideoWsConnecting,
  sendGenerateVideoMessage,
  onEvent,
} = useVideoWebSocket();

// 视频生成弹窗引用与状态
const videoModalRef = ref<InstanceType<typeof VideoGenerationModal> | null>(null);
// pendingVideoFileId：用于弹窗交互阶段（待确认）
const pendingVideoFileId = ref<string | null>(null);
// activeVideoFileId：一旦确认发送请求，直到 complete/error 才清空，用于匹配后端可能不带 file_id 的事件
const activeVideoFileId = ref<string | null>(null);
const activeVideoSourceFileId = ref<string | null>(null);

// 暴露给父组件的方法：打开视频生成弹窗
const openVideoModal = (fileId: string) => {
  pendingVideoFileId.value = fileId;
  videoModalRef.value?.show();
};
defineExpose({ openVideoModal });

// 确认生成视频
const message = useMessage();

// 统一的登录检查函数
const checkLoginAndProceed = (callback: () => void) => {
  if (!authStore.userInfo) {
    showLoginModal('login');
    return;
  }
  callback();
};

const ensureVideoWebSocketConnected = async (companionId: number) => {
  if (isVideoWsConnected.value) return true;

  try {
    await initVideoWebSocket(companionId);
  } catch (error) {
    console.error("初始化视频WebSocket失败:", error);
  }

  const startTime = Date.now();
  const timeout = 8000;
  while (!isVideoWsConnected.value) {
    if (!isVideoWsConnecting.value && !isVideoWsConnected.value) {
      break;
    }
    if (Date.now() - startTime > timeout) {
      break;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }

  return isVideoWsConnected.value;
};

const handleConfirmGenerateVideo = async () => {
  if (!pendingVideoFileId.value) return;
  if (!authStore.userInfo) {
    showLoginModal('login');
    return;
  }

  const fileId = pendingVideoFileId.value;
  const companionId = currentModel.value?.id ?? companionInfo.value?.id;
  if (!companionId) {
    message.error("缺少模型信息，无法生成视频");
    emit('video-generate-complete', { fileId, success: false });
    pendingVideoFileId.value = null;
    return;
  }
  try {
    // 先发出loading事件，确保UI立即进入loading
    emit('video-generate-requested', { fileId });

    const connected = await ensureVideoWebSocketConnected(companionId);
    if (!connected) {
      emit('video-generate-complete', { fileId, success: false });
      message.error("视频连接未建立，请稍后重试");
      return;
    }

    // 标记为当前活动任务（用于后续WS事件在缺少 file_id 时做关联）
    activeVideoFileId.value = fileId;
    activeVideoSourceFileId.value = fileId;
    const ok = sendGenerateVideoMessage(fileId);
    if (ok) {
      //   message.success(t('chatItem.videoRequestSent'));
    } else {
      // 发送失败，回滚loading
      emit('video-generate-complete', { fileId, success: false });
      activeVideoFileId.value = null;
      activeVideoSourceFileId.value = null;
      //   message.error(t('common.error'));
    }
  } catch (e) {
    console.error('发送生成视频请求失败:', e);
    // 异常也回滚loading
    emit('video-generate-complete', { fileId, success: false });
    activeVideoFileId.value = null;
    activeVideoSourceFileId.value = null;
    // message.error(t('common.error'));
  } finally {
    // 清理待确认ID，但保留 activeVideoFileId 直到 complete/error
    pendingVideoFileId.value = null;
  }
};

// 监听视频WS事件并向父级转发状态
onEvent((m) => {
  // 正常消息使用type字段
  const type = m.type as string;

  // 处理聊天配额耗尽错误消息
  if (type === MessageType.message_chat_exhausted_error) {
    try {
      showSubscriptionModal('inline');
    } catch (e) {
      console.error("显示订阅弹窗失败:", e);
    }
    // 重置loading状态
    if (activeVideoFileId.value) {
      emit('video-generate-complete', { fileId: activeVideoFileId.value, success: false });
      activeVideoFileId.value = null;
      activeVideoSourceFileId.value = null;
    }
    // 异常结束，断开WebSocket连接
    disconnectVideoWebSocket();
    return;
  }

  // 处理余额不足错误消息
  if (type === MessageType.insufficient_balance_error) {
    try {
      showDiamondRechargeModal();
    } catch (e) {
      console.error("处理余额不足错误失败:", e);
    }
    // 重置loading状态
    if (activeVideoFileId.value) {
      emit('video-generate-complete', { fileId: activeVideoFileId.value, success: false });
      activeVideoFileId.value = null;
      activeVideoSourceFileId.value = null;
    }
    // 异常结束，断开WebSocket连接
    disconnectVideoWebSocket();
    return;
  }

  if (type === MessageType.image_to_video_start) {
    // 任务开始，显示队列等待状态
    const fileId = activeVideoSourceFileId.value || activeVideoFileId.value || m.content?.file_id;
    const text = m.content?.message as string | undefined;
    if (fileId && text) {
      console.log('视频生成开始:', text);
      // 可以向父级发送开始事件
      emit('video-generate-start', { fileId, message: text });
    }
  } else if (type === MessageType.image_to_video_progress) {
    const fileId = activeVideoSourceFileId.value || activeVideoFileId.value || m.content?.file_id;
    let progress: number | undefined;
    const text = m.content?.message as string | undefined;

    const rawProgress = m.content?.progress as unknown;
    if (typeof rawProgress === "number") {
      progress = rawProgress;
    } else {
      if (typeof text === 'string') {
        const match = text.match(/(\d+(?:\.\d+)?)\s*%/);
        if (match) progress = parseFloat(match[1]);
      }
    }

    if (fileId && (typeof progress === 'number' || typeof text === 'string')) {
      emit('video-generate-progress', { fileId, progress, message: text });
    }
  } else if (type === MessageType.image_to_video_complete) {
    const fileId = activeVideoSourceFileId.value || activeVideoFileId.value || m.content?.file_id;
    if (!fileId) return;
    const success = m.content?.success !== false;
    emit('video-generate-complete', { fileId, success });
    // 完成后清理活动任务
    activeVideoFileId.value = null;
    activeVideoSourceFileId.value = null;
    // 任务结束，断开WebSocket连接
    disconnectVideoWebSocket();
  } else if (type === MessageType.image_to_video_error) {
    // 处理视频生成错误
    const fileId = activeVideoSourceFileId.value || activeVideoFileId.value || m.content?.file_id;
    // 即使后端未返回 file_id，也要提示并回滚按钮状态
    if (!fileId) {
      console.error('视频生成错误（无 file_id）:', m.content);
      const errorMessage = (typeof m.content === 'string' && m.content) ? m.content : (m.content?.message || '视频生成失败');
      message.error(errorMessage);
      return;
    }

    console.error('视频生成错误:', m.content);
    const errorMessage = m.content?.message || '视频生成失败';

    // 向父级发送错误事件
    emit('video-generate-complete', { fileId, success: false, error: errorMessage });
    // 出错后清理活动任务
    activeVideoFileId.value = null;
    activeVideoSourceFileId.value = null;
    // 异常结束，断开WebSocket连接
    disconnectVideoWebSocket();

    // 显示错误提示
    message.error(errorMessage);
  } else if (type === MessageType.error) {
    // 处理全局错误
    console.error('全局错误:', m.content);

    const errorMessage = m.content?.message || '操作失败，请稍后重试';

    // 如果有待处理的视频文件ID，标记为失败
    const fallbackId = pendingVideoFileId.value || activeVideoFileId.value;
    if (fallbackId) {
      emit('video-generate-complete', {
        fileId: fallbackId,
        success: false,
        error: errorMessage
      });
    }

    // 显示错误提示
    message.error(errorMessage);
    // 清理活动任务
    activeVideoFileId.value = null;
    activeVideoSourceFileId.value = null;
    // 异常结束，断开WebSocket连接
    disconnectVideoWebSocket();
  }
});

// 路由
const router = useRouter();
const route = useRoute();

// 国际化 t 已在上文定义

// 定义categories变量
const categories = ref<GenImageTabsResponse[]>([]);

// AI模型列表和当前选中的模型
const modelList = ref<HomeListData[]>([]);

// 使用 imageModelStore 的 currentModel，不再在组件内部维护
const currentModel = computed(() => imageModelStore.currentModel);


// Companion信息和默认提示词
const companionInfo = ref<CompanionInfo | null>(null);
// 从 store 中获取提示词相关状态，实现持久化
const currentPrompt = computed({
  get: () => imageModelStore.currentPrompt,
  set: (val) => imageModelStore.setCurrentPrompt(val)
});
const lastSelectedPromptId = computed({
  get: () => imageModelStore.lastSelectedPromptId,
  set: (val) => imageModelStore.lastSelectedPromptId = val
});

// 弹窗相关状态
const showModal = ref(false);
const selectedModelId = ref<number | null>(null);
const modalLoading = ref(false);

// 筛选相关状态
const modalSexValue = ref<"man" | "girl">("girl");
const modelNavName = ref<string>();
const modalNavValue = ref<number>();
const navList = ref<NavItem[]>([]);

// 筛选选项
const sexOptions = computed(() => [
  { label: t("generator.female"), value: "girl" },
  { label: t("generator.male"), value: "man" },
]);

// 筛选选项（暂时未使用）
// const navOptions = computed(() => {
//   return navList.value.map((nav) => ({
//     label: nav.name,
//     value: nav.id,
//   }));
// });

// 模态内骨架屏数量：为避免加载阶段数量抖动，锁定为固定值（按端区分）
const skeletonModalCount = computed(() => (globalStore.isMobile ? 4 : 6));

// 本次加载会话锁定的骨架数量，避免加载过程中数量抖动
const lockedSkeletonCount = ref<number | null>(null);

const computeSkeletonCount = () => {
  // 可按需要更精细，比如基于容器宽度/列宽计算，这里用端区分保持稳定
  return globalStore.isMobile ? 4 : 6;
};

watch(
  () => modalLoading.value,
  async (loading) => {
    if (loading) {
      // 进入加载态时锁定一次数量
      await nextTick();
      if (lockedSkeletonCount.value == null) {
        lockedSkeletonCount.value = computeSkeletonCount();
      }
    } else {
      // 结束加载后释放锁
      lockedSkeletonCount.value = null;
    }
  },
  { immediate: true }
);

// 分页参数
const pageParams = ref({
  size: 20,
  page: 1,
});

// 是否还有更多数据
const hasMore = ref(true);

// 过滤后的模型列表（暂时未使用）
// const filteredModelList = computed(() => {
//   return modelList.value;
// });

// esponse[]>([]);
const imageCounts = ref<PricingTier[]>([]);

// 当前选中的服装类别ID
const selectedCategoryId = ref<number>(0);

// 选中的项目 - 改为存储ID
const selectedItems = ref<Record<number, number>>({});

// 跟踪已添加的服装提示词
const addedClothingCues = ref<string[]>([]);

// 选择项目的方法
const selectItem = (itemId: number) => {
  checkLoginAndProceed(() => {
    // 找到新选中的服装选项
    const selectedItem = currentClothingOptions.value.find(
      (item) => item.id === itemId
    );

    if (selectedItem && selectedItem.cue_word) {
      // 更新选中项以显示选择效果
      selectedItems.value[selectedCategoryId.value] = itemId;

      // 每次点击都直接追加新提示词，不校验是否重复
      /* 原始逻辑（已注释）：
      // 获取当前分类的上一个选中项
      const previousItemId = selectedItems.value[selectedCategoryId.value];
  
      // 更新选中项
      selectedItems.value[selectedCategoryId.value] = itemId;
  
      // 如果有上一个选中项，需要替换对应的提示词
      if (previousItemId) {
        const previousItem = currentClothingOptions.value.find(
          (item) => item.id === previousItemId
        );
        if (previousItem && previousItem.cue_word) {
          // 替换上一个提示词
          editableDescription.value = editableDescription.value.replace(
            previousItem.cue_word,
            selectedItem.cue_word
          );
          // 更新跟踪数组
          const index = addedClothingCues.value.indexOf(previousItem.cue_word);
          if (index > -1) {
            addedClothingCues.value[index] = selectedItem.cue_word;
          }
          return;
        }
      }
      */

      if (editableDescription.value) {
        editableDescription.value += ", " + selectedItem.cue_word;
      } else {
        editableDescription.value = selectedItem.cue_word;
      }
      // 添加到跟踪数组
      addedClothingCues.value.push(selectedItem.cue_word);
    }
  });
};

// 当前服装选项
const currentClothingOptions = computed(() => {
  const currentCategory = categories.value.find(
    (category) => category.id === selectedCategoryId.value
  );
  return currentCategory?.datas || [];
});

// 头像区域下方副标题（与聊天一致：年龄 · 职业）
const subtitleText = computed(() => {
  const age = companionInfo.value?.age ?? (currentModel.value?.age as unknown as string | number | undefined);
  const occupation = companionInfo.value?.occupation || (currentModel.value?.occupation as unknown as string | undefined) || "";
  const ageStr = age !== undefined && age !== null && age !== "" ? String(age) : "";
  const occStr = occupation || "";
  if (ageStr && occStr) return `${ageStr} · ${occStr}`;
  return ageStr || occStr || "";
});

// 鼠标滚轮横向滚动（将纵向滚动映射为横向）
const handleHorizontalWheel = (e: WheelEvent) => {
  if (globalStore.isMobile) return;
  const delta = e.deltaY || e.deltaX || 0;
  let container = (e.currentTarget as HTMLElement) || null;
  // 向上查找最近的可横向滚动容器
  while (container) {
    const canScrollX = container.scrollWidth > container.clientWidth;
    if (canScrollX) break;
    container = container.parentElement as HTMLElement | null;
  }
  if (container) {
    container.scrollLeft += delta;
  }
};

// 选中的图片数量
const selectedImageCount = ref(1);

// 计算当前选中数量对应的费用
const currentPrice = computed(() => {
  const selectedTier = imageCounts.value.find(
    (tier) => tier.image_number === selectedImageCount.value
  );
  return selectedTier ? selectedTier.d_price : 0;
});

// 生成状态 - 基于store状态
const isGenerating = computed(() => imageGeneratorStore.isGenerating);

// 加载状态
const loading = ref(false);
const isCompanionLoading = ref(false);

// 可编辑的描述文本 - 从 store 中获取，实现持久化
const editableDescription = computed({
  get: () => imageModelStore.editableDescription,
  set: (val) => imageModelStore.setEditableDescription(val)
});

const updateDescriptionFromCurrentPrompt = () => {
  const cues = addedClothingCues.value;
  let base = currentPrompt.value?.content?.trim() || "";

  if (!base) {
    const modelDescription = currentModel.value?.description;
    base = typeof modelDescription === "string" ? modelDescription : "";
  }

  if (cues.length > 0) {
    const cuesText = cues.join(", ");
    base = base ? `${base}, ${cuesText}` : cuesText;
  }

  editableDescription.value = base;
};
// 获取导航列表数据（确保先完成模型列表与 companion 信息）
const loadNavList = async () => {
  try {
    const { data } = await getNavs();
    navList.value = data || [];
    console.log('navList', navList.value)
    // 设置默认导航
    if (navList.value.length > 0) {
      modelNavName.value = navList.value[0].name;
      modalNavValue.value = navList.value[0].id;
      // 确保在返回前完成首页模型与 companion 信息加载
      await loadHomeList();
    }
  } catch (error) {
    console.error("获取导航列表失败:", error);
  }
};

// 获取首页列表数据（返回前确保 companion/current 已完成）
const loadHomeList = async () => {
  try {
    loading.value = true; // 开始加载，显示骨架屏

    // 优先从 store 获取已选择的模型
    if (imageModelStore.currentModel) {
      // 如果 store 中已有模型，直接使用
      // 提示词和描述已经通过 computed 自动从 store 中恢复
      companionInfo.value = imageModelStore.currentModel;

      // 如果 store 中没有提示词但模型有默认提示词，则随机选择一个
      if (!imageModelStore.currentPrompt && companionInfo.value?.default_prompts && companionInfo.value.default_prompts.length > 0) {
        selectRandomPrompt();
        updateDescriptionFromCurrentPrompt();
      }

      loading.value = false;
      return;
    }

    // 如果 store 为空，才请求列表并取第一个
    const { data } = await getHomeList({
      size: 20,
      page: 1,
      nav_id: modalNavValue.value,
      sex: modalSexValue.value,
    });
    console.log('data', data)
    if (data.items && data.items.length > 0) {
      modelList.value = data.items;
      // 获取第一个模型的ID，调用 companion/current 接口获取详细信息
      const firstModelId = data.items[0]?.id;
      if (firstModelId) {
        // 使用 companion/current 接口获取模型详细信息
        await loadCompanionInfo(firstModelId);
      }
    }
  } catch (error) {
    console.error("获取AI模型列表失败:", error);
  } finally {
    loading.value = false; // 无论成功失败，都结束加载状态
  }
};

// 获取companion信息（高优先级，快速执行）
const loadCompanionInfo = async (modelId: number, isManualSwitch = false) => {
  isCompanionLoading.value = true;
  try {
    const { data } = await getCurrentCompanion(modelId);
    companionInfo.value = data;
    // 将获取的完整数据写入 imageModelStore
    imageModelStore.setCurrentModel(data);

    // 设置当前聊天对象，确保WebSocket能够正确连接
    const chatData = {
      id: data.id,
      name: data.name,
      head_image: "",
      t_head_image: data.head_image,
      s_head_image: "",
      user_id: 0,
      companion_id: data.id,
      message_response_id: 0,
      content: data.description || "开始聊天吧！",
      message_response_created_at: new Date().toISOString(),
      cover_video_url: data.cover_video_url || "",
      // 添加点赞状态字段
      liked: data.liked || false,
    };
    chatStore.setCurrentChat(chatData);

    // 清空之前的服装提示词跟踪
    addedClothingCues.value = [];
    selectedItems.value = {};

    if (data?.default_prompts && data.default_prompts.length > 0) {
      selectRandomPrompt();
    } else {
      currentPrompt.value = null;
      lastSelectedPromptId.value = null;
    }

    updateDescriptionFromCurrentPrompt();

    await loadImageRules(data.id);

    if (isManualSwitch) {
      // 手动切换模型时，同步初始化WebSocket连接
      const currentWsCompanionId = imageGeneratorStore.getCurrentCompanionId?.();
      const needsNewConnection = !imageGeneratorStore.isWebSocketConnected ||
        currentWsCompanionId !== data.id;

      if (needsNewConnection) {
        await imageGeneratorStore.initWebSocket(data.id);
      }
    } else {
      // WebSocket初始化延后执行，不阻塞主要流程
      initWebSocketAsync();
    }
  } catch (error) {
    console.error("获取companion信息失败:", error);
    throw error; // 重新抛出错误，让上层处理
  } finally {
    isCompanionLoading.value = false;
    if (!editableDescription.value) {
      updateDescriptionFromCurrentPrompt();
    }
  }
};

// 异步初始化WebSocket连接（不阻塞主流程）
const initWebSocketAsync = async () => {
  try {
    // 延迟一小段时间，确保主要UI已经渲染
    setTimeout(async () => {
      // 在设置完currentChat后，检查是否需要重新初始化图片生成的 WebSocket 连接
      // 仅当当前连接未建立，或已建立但绑定的模型与当前选择不一致时才重连
      const currentWsCompanionId = imageGeneratorStore.getCurrentCompanionId?.();
      const needsNewConnection = !imageGeneratorStore.isWebSocketConnected ||
        currentWsCompanionId !== currentModel.value.id;

      if (needsNewConnection) {
        try {
          await imageGeneratorStore.initWebSocket(currentModel.value.id);
        } catch (error) {
          console.error("初始化WebSocket连接失败:", error);
        }
      } else {
        console.log("WebSocket连接已存在且companion_id未变化，跳过重复初始化");
      }
    }, 100);
  } catch (error) {
    console.error("异步初始化WebSocket失败:", error);
  }
};

// 等待WebSocket连接建立
const waitForWebSocketConnection = async (timeout = 10000): Promise<void> => {
  return new Promise((resolve, reject) => {
    const startTime = Date.now();

    const checkConnection = () => {
      const currentWsCompanionId = imageGeneratorStore.getCurrentCompanionId?.();
      const isConnected = imageGeneratorStore.isWebSocketConnected &&
        currentWsCompanionId === currentModel.value?.id;

      if (isConnected) {
        resolve();
        return;
      }

      // 检查超时
      if (Date.now() - startTime > timeout) {
        reject(new Error('WebSocket连接超时'));
        return;
      }

      // 继续检查
      setTimeout(checkConnection, 100);
    };

    checkConnection();
  });
};

// 随机选择提示词（确保不重复）
const selectRandomPrompt = () => {
  if (
    !companionInfo.value?.default_prompts ||
    companionInfo.value.default_prompts.length === 0
  ) {
    return;
  }

  const prompts = companionInfo.value.default_prompts;

  if (prompts.length === 1) {
    // 只有一个提示词时直接使用
    currentPrompt.value = prompts[0];
    lastSelectedPromptId.value = prompts[0].id;
  } else {
    // 多个提示词时确保不重复
    let availablePrompts = prompts;
    if (lastSelectedPromptId.value !== null) {
      availablePrompts = prompts.filter(
        (p) => p.id !== lastSelectedPromptId.value
      );
    }

    const randomIndex = Math.floor(Math.random() * availablePrompts.length);
    currentPrompt.value = availablePrompts[randomIndex];
    lastSelectedPromptId.value = currentPrompt.value.id;
  }
};

// 显示模型选择器（PC端弹窗或移动端页面）
const showModelSelector = async () => {
  checkLoginAndProceed(async () => {
    if (globalStore.isMobile) {
      // 移动端：跳转到模型选择页面
      router.push({
        name: 'AIGeneratorSelectModel',
        query: { currentModelId: currentModel.value?.id?.toString() || '' }
      });
    } else {
      // PC端：打开弹窗
      showModal.value = true;
    }
  });
};

// 刷新描述（随机选择提示词）
const refreshDescription = async () => {
  checkLoginAndProceed(() => {
    // 添加旋转动画
    const refreshBtn = document.querySelector(".description-refresh-btn");
    if (refreshBtn) {
      refreshBtn.classList.add("rotating");
      setTimeout(() => {
        refreshBtn.classList.remove("rotating");
      }, 600);
    }

    // 随机选择新的提示词
    selectRandomPrompt();
    updateDescriptionFromCurrentPrompt();
  });
};

// 选择模型（暂时未使用）
// const selectModel = (modelId: number) => {
//   selectedModelId.value = modelId;
// };

// 确认选择loading状态
const isConfirmingSelection = ref(false);

// PC端弹窗确认选择
const handleModalConfirm = async (modelId: number) => {
  // 检查用户是否为Pro以及tokens是否足够
  if (!authStore.userInfo?.is_vip) {
    showSubscriptionModal('redirect');
    return;
  } else if (authStore.accountInfo.tokens < currentPrice.value) {
    showConsumptionModal({
      onOk: () => router.push("/premium/diamonds"),
    });
    return;
  }

  isConfirmingSelection.value = true;
  try {
    // 使用选中模型的ID调用 companion/current 接口获取详细信息
    await loadCompanionInfo(modelId, true);
    // 等待WebSocket连接建立
    await waitForWebSocketConnection();
    showModal.value = false;
  } catch (error) {
    console.error("切换模型失败:", error);
  } finally {
    isConfirmingSelection.value = false;
  }
};

// PC端弹窗取消选择
const handleModalCancel = () => {
  showModal.value = false;
};

// 处理性别筛选变化（已不再使用，ModelSelectorModal组件内部处理）
const handleModalSexChange = async (value: "man" | "girl") => {
  modalSexValue.value = value;
  // 重置选中的模型
  selectedModelId.value = null;
  // 重置分页参数
  pageParams.value = { size: 20, page: 1 };
  hasMore.value = true;
  modelList.value = [];
  await loadModalData();
};

// 处理导航筛选变化（已不再使用，ModelSelectorModal组件内部处理）
const handleModalNavChange = async (value: string) => {
  console.log(`output-value`, value);
  const currentNav = navList.value.find((nav) => nav.name === value);
  if (currentNav) {
    modalNavValue.value = currentNav.id;
    // 重置选中的模型
    selectedModelId.value = null;
    // 重置分页参数
    pageParams.value = { size: 20, page: 1 };
    hasMore.value = true;
    modelList.value = [];
    await loadModalData();
  }
};

// 加载弹窗数据（已不再使用，ModelSelectorModal组件内部处理）
const loadModalData = async (isLoadMore = false) => {
  try {
    modalLoading.value = true;
    const { data } = await getHomeList({
      ...pageParams.value,
      nav_id: modalNavValue.value,
      sex: modalSexValue.value,
    });

    const items = data?.items || [];
    if (isLoadMore) {
      // 加载更多时追加数据
      modelList.value = [...modelList.value, ...items];
    } else {
      // 初始加载时替换数据
      modelList.value = items;
    }

    // 判断是否还有更多数据（优先使用后端 has_next）
    hasMore.value = typeof data?.has_next === 'boolean'
      ? data.has_next
      : items.length === pageParams.value.size;
  } catch (error) {
    console.error("获取模型列表失败:", error);
  } finally {
    modalLoading.value = false;
  }
};

// 处理无限滚动加载（已不再使用，ModelSelectorModal组件内部处理）
const handleLoad = async () => {
  if (!hasMore.value || modalLoading.value) return false;
  pageParams.value.page += 1;
  await loadModalData(true);
  return hasMore.value;
};

// 获取图片选项数据
const loadImageOptions = async () => {
  try {
    loading.value = true;
    const { data } = await getImageOptions();
    categories.value = data || [];

    // 设置默认选中第一个类别
    if (categories.value.length > 0) {
      selectedCategoryId.value = categories.value[0].id;
    }
  } catch (error) {
    console.error("获取图片选项失败:", error);
  } finally {
    loading.value = false;
  }
};

// 获取价格规则数据
const loadImageRules = async (companionId?: number) => {
  try {
    const resolvedCompanionId =
      companionId ?? currentModel.value?.id ?? companionInfo.value?.id;
    if (!resolvedCompanionId) return;

    const { data } = await getImageRules({ companion_id: resolvedCompanionId });
    imageCounts.value = data || [];

    // 设置默认选中第一个数量
    if (imageCounts.value.length > 0) {
      selectedImageCount.value = imageCounts.value[0].image_number;
    }
  } catch (error) {
    console.error("获取价格规则失败:", error);
  }
};
import { useAuthStore } from "@/stores/auth";
const authStore = useAuthStore();
// 处理图片数量点击事件
const handleImageCountClick = (count: PricingTier) => {
  checkLoginAndProceed(() => {
    if (count.is_vip_show && !authStore.userInfo?.is_vip) {
      showSubscriptionModal('redirect');
    } else {
      // 计算选择该数量需要的钻石费用
      // d_price 已经是生成 image_number 张图片的总价格，不需要再乘以 image_number
      const requiredTokens = count.d_price;
      // 检查用户钻石是否足够
      if (
        authStore.accountInfo &&
        authStore.accountInfo.tokens < requiredTokens
      ) {
        // 钻石不足，显示消费弹窗
        showConsumptionModal({
          onOk: () => router.push("/premium/diamonds"),
        });
        return;
      }

      selectedImageCount.value = count.image_number;
    }
  });
};
// 生成图片
const generateImage = async () => {
  checkLoginAndProceed(async () => {
    // 检查用户是否为Pro以及tokens是否足够
    if (!authStore.userInfo?.is_vip) {
      // 用户不是Pro，跳转到Pro页面
      showSubscriptionModal('redirect');
      return;
    } else if (
      authStore.accountInfo &&
      authStore.accountInfo.tokens < currentPrice.value
    ) {
      // 用户是Pro但tokens不足，显示购买钻石弹窗
      showConsumptionModal({
        onOk: () => router.push("/premium/diamonds"),
      });
      return;
    }

    try {
      // 获取当前选中的定价规则ID
      const selectedTier = imageCounts.value.find(
        (tier) => tier.image_number === selectedImageCount.value
      );
      const ruleId = selectedTier?.id;

      // 使用菜单端图片生成流程，传递 ruleId
      await startImageGeneration(
        editableDescription.value,
        currentModel.value.id,
        selectedImageCount.value,
        ruleId
      );

      console.log("菜单端图片生成任务已开始", { ruleId });

      // 导航到结果页面（移动端）
      if (globalStore.isMobile) {
        router.push({ name: 'AIGeneratorResult' });
      }
    } catch (error) {
      console.error("启动生成任务失败:", error);
    }
  });
};

// 跳转到结果页面（移动端专用）
const goToResultPage = () => {
  if (globalStore.isMobile) {
    router.push({ name: 'AIGeneratorResult' });
  }
};

// 初始化数据
const initData = async () => {
  // 最高优先级：先完成导航/模型/companion 信息
  await loadNavList();

  if (imageCounts.value.length === 0) {
    await loadImageRules();
  }

  // 次级优先级：并行加载其他选项与账户信息（不阻塞主要体验）
  await Promise.all([
    loadImageOptions(),
    authStore.handleGetAccountInfo(),
  ]);

  // 暂时注释掉自动恢复功能
  // try {
  //   const resumed = await autoResumeGeneration();
  //   if (resumed) {
  //     console.log('已恢复未完成的生成任务');
  //   }
  // } catch (error) {
  //   console.error('恢复生成任务失败:', error);
  // }
};


// 组件激活时检查数据是否需要更新
onActivated(async () => {
  // 检查 store 中是否有模型数据
  if (imageModelStore.currentModel) {
    // 从 store 恢复模型数据，提示词和描述已通过 computed 自动恢复
    companionInfo.value = imageModelStore.currentModel;
    await loadImageRules(imageModelStore.currentModel.id);
  } else {
    // 如果 store 中没有数据，重新初始化
    await initData();
  }
});

onMounted(() => {
  initData()
    .catch((error) => {
      console.error("初始化生成器数据失败:", error);
    })
    .finally(() => {
      emit("initFinished");
    });
});
</script>

<style scoped lang="scss">
:deep(.n-input .n-input-wrapper) {
  padding: 0;
}

/* 本页 n-tabs 标签文字大小 */
:deep(.n-tabs-tab__label) {
  font-size: 16px !important;
}

:deep(.n-input__textarea-el) {
  padding: 0;
}

/* 自定义样式 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-5 {
  display: -webkit-box;
  -webkit-line-clamp: 5;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

/* 旋转动画 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.refresh-btn.rotating svg {
  animation: spin 0.6s ease-in-out;
}


/* 弹窗样式 */
.modal-content {
  max-height: 80vh;
  overflow-y: auto;
}

/* 响应式调整 */
@media (max-width: 640px) {
  .modal-content {
    max-height: 50vh;
  }
}

:deep(.v-x-scroll) {}

/* 统一覆盖为 16px */
:deep(.n-tabs-tab__label) {
  font-size: 16px !important;
}

.wheel-x-container {
  width: 100%;
}

/* 隐藏n-scrollbar滚动条 */
:deep(.n-scrollbar-rail) {
  display: none !important;
}

:deep(.n-scrollbar-track) {
  display: none !important;
}

:deep(.n-scrollbar-content) {
  scrollbar-width: none;
  -ms-overflow-style: none;
}

:deep(.n-scrollbar-content::-webkit-scrollbar) {
  display: none;
}

.title-16 {
  font-size: 16px;
  font-weight: 700;
}

.ai-desc {
  font-size: inherit;
  color: #8C8C8C;
}

/* 折叠：单行省略，按钮同一行靠后 */
.ai-desc-row {
  display: flex;
  align-items: center;
  width: 100%;
  gap: 4px;
  font-size: 12px;
  /* 统一控制字体大小 */
}

.ai-desc-row .ai-desc {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  flex: 1 1 auto;
  min-width: 0;
  /* 让省略号在 flex 容器中生效 */
}

.ai-desc-toggle {
  font-size: inherit;
  color: #8C8C8C;
  background: transparent;
  border: none;
  padding: 0;
  cursor: pointer;
  flex: 0 0 auto;
}

/* 展开：文本与按钮作为内联顺序排列，按钮跟在最后一行末尾 */
.ai-desc-row.expanded {
  display: block;
}

.ai-desc-row.expanded .ai-desc {
  display: inline;
  white-space: normal;
  overflow: visible;
  text-overflow: initial;
}

.ai-desc-row.expanded .ai-desc-toggle {
  display: inline;
  margin-left: 4px;
}
</style>
