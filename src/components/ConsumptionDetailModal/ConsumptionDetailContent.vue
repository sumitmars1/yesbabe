<template>
  <div class="h-full w-full overflow-y-scroll flex flex-col">
    <div
      class="flex-shrink-0 relative overflow-hidden mb-3 rounded-[14px] py-3 px-4 text-white [background:linear-gradient(135deg,var(--n-primary-color-pressed,#7948ea)_0%,var(--n-primary-color-hover,#e05ada)_100%)] before:content-[''] before:absolute before:inset-0 before:[background:linear-gradient(45deg,rgba(255,255,255,0.12)_0%,rgba(255,255,255,0)_100%)]">
      <div class="relative z-1">
        <div v-if="categoriesLoading" class="grid grid-cols-2 gap-3">
          <div class="space-y-2">
            <div
              class="h-4 w-16 rounded-[6px] [background:linear-gradient(90deg,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0.2)_75%)] [background-size:200%_100%] animate-[skeleton-loading_1.5s_infinite] dark:[background:linear-gradient(90deg,rgba(255,255,255,0.12)_25%,rgba(255,255,255,0.24)_50%,rgba(255,255,255,0.12)_75%)] [[data-theme=dark]_&]:[background:linear-gradient(90deg,rgba(255,255,255,0.12)_25%,rgba(255,255,255,0.24)_50%,rgba(255,255,255,0.12)_75%)]">
            </div>
            <div
              class="h-6 w-20 rounded-[6px] [background:linear-gradient(90deg,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0.2)_75%)] [background-size:200%_100%] animate-[skeleton-loading_1.5s_infinite] dark:[background:linear-gradient(90deg,rgba(255,255,255,0.12)_25%,rgba(255,255,255,0.24)_50%,rgba(255,255,255,0.12)_75%)] [[data-theme=dark]_&]:[background:linear-gradient(90deg,rgba(255,255,255,0.12)_25%,rgba(255,255,255,0.24)_50%,rgba(255,255,255,0.12)_75%)]">
            </div>
          </div>
          <div class="space-y-2">
            <div
              class="h-4 w-16 rounded-[6px] [background:linear-gradient(90deg,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0.2)_75%)] [background-size:200%_100%] animate-[skeleton-loading_1.5s_infinite] dark:[background:linear-gradient(90deg,rgba(255,255,255,0.12)_25%,rgba(255,255,255,0.24)_50%,rgba(255,255,255,0.12)_75%)] [[data-theme=dark]_&]:[background:linear-gradient(90deg,rgba(255,255,255,0.12)_25%,rgba(255,255,255,0.24)_50%,rgba(255,255,255,0.12)_75%)]">
            </div>
            <div
              class="h-6 w-20 rounded-[6px] [background:linear-gradient(90deg,rgba(255,255,255,0.2)_25%,rgba(255,255,255,0.4)_50%,rgba(255,255,255,0.2)_75%)] [background-size:200%_100%] animate-[skeleton-loading_1.5s_infinite] dark:[background:linear-gradient(90deg,rgba(255,255,255,0.12)_25%,rgba(255,255,255,0.24)_50%,rgba(255,255,255,0.12)_75%)] [[data-theme=dark]_&]:[background:linear-gradient(90deg,rgba(255,255,255,0.12)_25%,rgba(255,255,255,0.24)_50%,rgba(255,255,255,0.12)_75%)]">
            </div>
          </div>
        </div>
        <div v-else>
          <div class="overview-summary">
            <div>
              <div class="text-xs opacity-90 mb-1">{{ t('components.consumptionDetailModal.totalConsumption') }}</div>
              <div class="text-lg font-bold inline-flex items-center gap-1">
                <svg-icon iconClass="diamond" :size="16" />
                <span>{{ formatCurrency(totalConsumption) }}</span>
              </div>
            </div>
          </div>
          <div v-if="categories.length" class="mt-3">
            <div class="text-xs font-semibold opacity-85 tracking-[0.08em] uppercase">
              {{ t('components.consumptionDetailModal.overview') }}
            </div>
            <!-- 桌面端：网格布局 -->
            <div class="mt-2 hidden md:grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(130px,1fr))]">
              <button v-for="cat in categories" :key="cat.name" type="button"
                class="flex flex-col items-start justify-center gap-1 py-[10px] px-3 rounded-[10px] border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.15)] text-inherit font-medium transition-all duration-200 ease cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:bg-[rgba(255,255,255,0.3)] hover:translate-y-[-2px] hover:scale-[1.01] backdrop-blur-xs"
                :class="cat.name === selectedCategory
                  ? 'bg-[rgba(255,255,255,0.4)] border-[rgba(255,255,255,0.6)] shadow-[0_12px_26px_rgba(0,0,0,0.18)] text-[var(--n-primary-color)]'
                  : ''
                  " @click="handleCategorySelect(cat.name)">
                <span class="text-xs font-semibold">{{ getCategoryName(cat.name) }}</span>
                <span class="inline-flex items-center gap-1 text-[13px] font-bold">
                  <svg-icon iconClass="diamond" :size="14" />
                  <span>{{ formatCurrency(cat.total_amount) }}</span>
                </span>
              </button>
            </div>
            <!-- 移动端：横向滚动 -->
            <div class="mt-2 md:hidden flex gap-2 overflow-x-auto pb-2 scrollbar-hide"
              style="-webkit-overflow-scrolling: touch;">
              <button v-for="cat in categories" :key="cat.name" type="button"
                class="flex-shrink-0 flex flex-col items-start justify-center gap-1 py-[10px] px-3 rounded-[10px] border border-[rgba(255,255,255,0.3)] bg-[rgba(255,255,255,0.15)] text-inherit font-medium transition-all duration-200 ease cursor-pointer shadow-[0_4px_12px_rgba(0,0,0,0.08)] hover:bg-[rgba(255,255,255,0.3)] backdrop-blur-xs min-w-[120px]"
                :class="cat.name === selectedCategory
                  ? 'bg-[rgba(255,255,255,0.4)] border-[rgba(255,255,255,0.6)] shadow-[0_12px_26px_rgba(0,0,0,0.18)] text-[var(--n-primary-color)]'
                  : ''
                  " @click="handleCategorySelect(cat.name)">
                <span class="text-xs font-semibold whitespace-nowrap">{{ getCategoryName(cat.name) }}</span>
                <span class="inline-flex items-center gap-1 text-[13px] font-bold">
                  <svg-icon iconClass="diamond" :size="14" />
                  <span>{{ formatCurrency(cat.total_amount) }}</span>
                </span>
              </button>
            </div>
          </div>
          <div v-else class="mt-4 text-[13px] opacity-90">
            {{ t('components.consumptionDetailModal.noCategories') }}
          </div>
        </div>
      </div>
    </div>

    <div class="flex-1 min-h-0 flex flex-col overflow-hidden">
      <div v-if="categoriesLoading" class="flex items-center justify-center flex-1">
        <n-spin size="medium" />
      </div>
      <template v-else>
        <div v-if="selectedCategory" class="flex-shrink-0 mb-4 pt-1">
          <div class="text-[18px] font-semibold text-[var(--n-text-color)]">{{ getCategoryName(selectedCategory) }}
          </div>
          <div class="mt-1 text-[13px] text-[var(--n-text-color-disabled)]">
            {{ t('components.consumptionDetailModal.totalConsumption') }}:
            <span class="inline-flex items-center gap-1">
              <svg-icon iconClass="diamond" :size="14" />
              <span>{{ formatCurrency(currentCategory?.total_amount) }}</span>
            </span>
          </div>
        </div>

        <div class="flex-1 min-h-0 overflow-hidden flex flex-col">
          <div v-if="loading" class="flex items-center justify-center flex-1">
            <n-spin size="medium" />
          </div>
          <div v-else-if="!selectedCategory"
            class="flex flex-col items-center justify-center flex-1 text-center animate-[fadeIn_0.4s_ease]"
            :class="isMobile ? 'py-12' : 'py-16'">
            <n-icon :size="isMobile ? 48 : 64" class="text-gray-400 mb-4">
              <ReceiptOutline />
            </n-icon>
            <div class="text-gray-500 mb-2" :class="isMobile ? 'text-base' : 'text-lg'">
              {{ t('components.consumptionDetailModal.selectCategoryHint') }}
            </div>
          </div>
          <div v-else-if="consumptionList.length === 0"
            class="flex flex-col items-center justify-center flex-1 text-center animate-[fadeIn_0.4s_ease]"
            :class="isMobile ? 'py-12' : 'py-16'">
            <n-icon :size="isMobile ? 48 : 64" class="text-gray-400 mb-4">
              <ReceiptOutline />
            </n-icon>
            <div class="text-gray-500 mb-2" :class="isMobile ? 'text-base' : 'text-lg'">
              {{ t('components.consumptionDetailModal.noRecords') }}
            </div>
            <div class="text-gray-400 text-sm">
              {{ t('components.consumptionDetailModal.noRecordsDescription') }}
            </div>
          </div>
          <div v-else class="flex-1 min-h-0 flex flex-col w-full overflow-hidden">
            <n-scrollbar class="h-full" :style="detailScrollStyle" :size="isMobile ? 4 : 8" trigger="hover"
              :show-scrollbar="!isMobile" @scroll="handleScroll">
              <div class="flex flex-col w-full box-border"
                :class="isMobile ? 'gap-3 py-[2px] px-1' : 'gap-3 py-1 px-[6px]'">
                <div v-for="(item, index) in consumptionList" :key="item.id ?? index"
                  class="group relative overflow-hidden cursor-pointer px-3 py-2 shadow-border rounded-lg hover:shadow-hover-border"
                  :class="isMobile ? 'flex flex-col items-start gap-3' : 'flex items-center justify-between gap-3'">
                  <div
                    class="flex-1 items-center min-w-0 break-words text-[15px] font-semibold text-[var(--n-text-color)] transition-colors duration-300 ease group-hover:text-[var(--n-primary-color)]">
                    <template v-if="getConsumptionAmountDisplay(item).type === 'amount'">
                      <div class="flex items-center">
                        <span class="leading-0 mr-2">{{ getConsumptionAmountDisplay(item).label }}:</span>
                        <span class="inline-flex items-center gap-1 ">
                          <svg-icon iconClass="diamond" :size="14" />
                          <span>{{ getConsumptionAmountDisplay(item).amount }}</span>
                        </span>
                      </div>
                    </template>
                    <template v-else>
                      {{ getConsumptionAmountDisplay(item).text }}
                    </template>
                  </div>
                  <span
                    class="flex-shrink-0 text-xs text-[var(--n-text-color-3)] opacity-80 transition-[color,opacity] duration-300 ease group-hover:text-[var(--n-text-color-2)] group-hover:opacity-100"
                    :class="isMobile ? 'mt-[6px]' : ''">
                    {{ getOperationTimeText(item) }}
                  </span>
                </div>
                <!-- 加载更多提示 -->
                <div v-if="loadingMore"
                  class="flex items-center justify-center py-4 text-sm text-[var(--n-text-color-3)]">
                  <n-spin size="small" class="mr-2" />
                  {{ t('components.consumptionDetailModal.loadingMore') }}
                </div>
                <div v-else-if="!hasMore && consumptionList.length > 0"
                  class="flex items-center justify-center py-4 text-sm text-[var(--n-text-color-3)]">
                  {{ t('components.consumptionDetailModal.noMoreData') }}
                </div>
              </div>
            </n-scrollbar>
          </div>
        </div>
      </template>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick } from "vue";
import { useI18n } from "vue-i18n";
import { NSpin, NIcon, NScrollbar } from "naive-ui";
import { ReceiptOutline } from "@vicons/ionicons5";
import { getConsumptionDetail, getConsumptionOverview } from "@/api/user/index";
import type { ConsumptionCategory, ConsumptionDetailItem } from "@/api/user/types";
import { throttle } from "@/utils/throttle";
import { useCurrency } from "@/composables/useCurrency";
import SvgIcon from "@/components/SvgIcon/index.vue";

type ConsumptionDetailRecord = ConsumptionDetailItem & {
  amount?: number;
  total_amount?: number;
};

const props = defineProps<{
  isPage?: boolean;
}>();

const { t } = useI18n();
const { formatCurrency } = useCurrency();

const isMobile = ref(false);

const loading = ref(false);
const categoriesLoading = ref(false);
const consumptionList = ref<ConsumptionDetailRecord[]>([]);
const categories = ref<ConsumptionCategory[]>([]);
const totalConsumption = ref(0);
const selectedCategory = ref("");
const detailMaxHeight = ref(0);

// 分页相关
const page = ref(1);
const pageSize = ref(20);
const hasMore = ref(true);
const loadingMore = ref(false);

const currentCategory = computed(() => {
  return categories.value.find((cat) => cat.name === selectedCategory.value) ?? null;
});

const getCategoryName = (name: string) => {
  if (!name) return "";

  const map: Record<string, string> = {
    '文字聊天': 'textChat',
    '语音聊天': 'voiceChat',
    '图片生成': 'imageGeneration',
    '视频生成': 'videoGeneration',
    '订阅': 'subscription',
    '充值': 'recharge',
    '购买钻石': 'buyDiamonds',
    '签到': 'checkIn',
    '注册': 'register',
    '其他': 'other'
  };

  // 优先精确匹配
  if (map[name]) {
    return t(`components.consumptionDetailModal.types.${map[name]}`);
  }

  // 模糊匹配
  for (const key in map) {
    if (name.includes(key)) {
      return t(`components.consumptionDetailModal.types.${map[key]}`);
    }
  }

  return name;
};

const translateContent = (content: string) => {
  if (!content) return "";

  let result = content;

  const replacements: Record<string, string> = {
    '文字聊天': t('components.consumptionDetailModal.types.textChat'),
    '语音聊天': t('components.consumptionDetailModal.types.voiceChat'),
    '图片生成': t('components.consumptionDetailModal.types.imageGeneration'),
    '视频生成': t('components.consumptionDetailModal.types.videoGeneration'),
    '订阅': t('components.consumptionDetailModal.types.subscription'),
    '充值': t('components.consumptionDetailModal.types.recharge'),
    '购买钻石': t('components.consumptionDetailModal.types.buyDiamonds'),
    '消费金额': t('components.consumptionDetailModal.consumptionAmount'),
    '消费': t('components.consumptionDetailModal.types.consumption'),
    '金额': t('components.consumptionDetailModal.types.amount'),
  };

  for (const [key, val] of Object.entries(replacements)) {
    // 使用正则进行全局替换，注意转义特殊字符
    result = result.replace(new RegExp(key, 'g'), val);
  }

  return result;
};

const calculateDetailMaxHeight = () => {
  // 如果是页面模式，不需要计算最大高度，让其自适应
  if (props.isPage) return 0;

  const viewport = window.innerHeight || 0;

  // 使用更保守的高度计算，确保不会超出弹窗
  if (isMobile.value) {
    // 移动端：更保守的计算
    const baseHeight = viewport * 0.75; // 从0.85降低到0.75
    const reserved = 220; // 增加预留空间
    const calculated = baseHeight - reserved;
    return Math.max(120, Math.min(400, calculated)); // 最大高度从500降低到400
  } else {
    // 桌面端：更保守的计算
    const baseHeight = viewport * 0.7; // 从0.8降低到0.7
    const reserved = 280; // 增加预留空间
    const calculated = baseHeight - reserved;
    return Math.max(150, Math.min(450, calculated)); // 最大高度从600降低到450
  }
};

const updateDetailMaxHeight = () => {
  detailMaxHeight.value = calculateDetailMaxHeight();
};

const detailScrollStyle = computed(() => {
  if (props.isPage) {
    return {
      flex: "1",
      minHeight: "0",
      width: "100%",
      height: "100%"
    };
  }

  const maxHeight = detailMaxHeight.value > 0
    ? `${detailMaxHeight.value}px`
    : (isMobile.value ? "calc(75vh - 220px)" : "calc(70vh - 280px)"); // 更保守的备用高度

  return {
    maxHeight,
    flex: "1",
    minHeight: "0",
    width: "100%"
  };
});

const getConsumptionAmountDisplay = (item: ConsumptionDetailRecord) => {
  const label = t("components.consumptionDetailModal.consumptionAmount");

  if (typeof item.amount === "number") {
    return {
      type: "amount" as const,
      label,
      amount: formatCurrency(item.amount),
    };
  }

  if (typeof item.total_amount === "number") {
    return {
      type: "amount" as const,
      label,
      amount: formatCurrency(item.total_amount),
    };
  }

  if (item.content) {
    const match = item.content.match(/消费金额[:：]?\s*([-\d.]+)/);
    if (match && match[1]) {
      const parsed = Number(match[1]);
      if (!Number.isNaN(parsed)) {
        return {
          type: "amount" as const,
          label,
          amount: formatCurrency(parsed),
        };
      }
      return {
        type: "text" as const,
        text: `${label}: ${match[1]}`,
      };
    }

    return {
      type: "text" as const,
      text: translateContent(item.content),
    };
  }

  return {
    type: "text" as const,
    text: `${label}: --`,
  };
};

const getOperationTimeText = (item: ConsumptionDetailRecord) => {
  const label = t("components.consumptionDetailModal.operationTime");
  if (item.operation_time) {
    const date = new Date(item.operation_time);
    if (!Number.isNaN(date.getTime())) {
      return `${label}: ${date.toLocaleString()}`;
    }
    return `${label}: ${item.operation_time}`;
  }
  return `${label}: --`;
};

const fetchConsumptionDetail = async (isLoadMore = false) => {
  if (!selectedCategory.value) {
    if (!isLoadMore) {
      consumptionList.value = [];
    }
    return;
  }

  // 如果是加载更多，但没有更多数据了，直接返回
  if (isLoadMore && !hasMore.value) return;

  try {
    if (isLoadMore) {
      loadingMore.value = true;
    } else {
      loading.value = true;
    }

    const response = await getConsumptionDetail({
      size: pageSize.value,
      page: page.value,
      category: selectedCategory.value,
    });

    const items = (response.data?.items as ConsumptionDetailRecord[]) || [];

    if (isLoadMore) {
      // 加载更多：追加数据
      consumptionList.value.push(...items);
    } else {
      // 首次加载：替换数据
      consumptionList.value = items;
    }

    // 判断是否还有更多数据
    const total = response.data?.total || 0;
    hasMore.value = consumptionList.value.length < total;
  } catch (error) {
    console.error("获取消费明细失败:", error);
    if (!isLoadMore) {
      consumptionList.value = [];
    }
  } finally {
    loading.value = false;
    loadingMore.value = false;
  }
};

// 加载更多数据
const loadMore = () => {
  if (loadingMore.value || !hasMore.value) return;
  page.value += 1;
  fetchConsumptionDetail(true);
};

// 滚动处理函数
const handleScroll = (e: Event) => {
  const target = e.target as HTMLElement;
  if (!target) return;

  const { scrollTop, scrollHeight, clientHeight } = target;
  // 距离底部 100px 时触发加载
  const threshold = 100;

  if (scrollHeight - scrollTop - clientHeight < threshold) {
    loadMore();
  }
};

const handleCategorySelect = (category: string) => {
  if (selectedCategory.value === category) return;
  selectedCategory.value = category;
  // 重置分页状态
  page.value = 1;
  hasMore.value = true;
  consumptionList.value = [];
  fetchConsumptionDetail();
};

const fetchConsumptionOverview = async () => {
  try {
    categoriesLoading.value = true;
    const response = await getConsumptionOverview();

    if (response.data?.category_overview) {
      const overview = response.data.category_overview;
      categories.value = overview.categories || [];
      totalConsumption.value = overview.total_consumption || 0;

      if (categories.value.length === 0) {
        selectedCategory.value = "";
        consumptionList.value = [];
        return;
      }

      // 如果有默认选中的类别，使用它
      if (selectedCategory.value) {
        fetchConsumptionDetail();
      } else {
        const hasSelected = categories.value.some((cat) => cat.name === selectedCategory.value);
        if (!hasSelected) {
          handleCategorySelect(categories.value[0].name);
        } else {
          fetchConsumptionDetail();
        }
      }
    }
  } catch (error) {
    console.error("获取消费总览失败:", error);
  } finally {
    categoriesLoading.value = false;
  }
};

const checkDevice = () => {
  isMobile.value =
    window.innerWidth <= 768 ||
    /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  updateDetailMaxHeight();
};

const handleResize = throttle(() => {
  checkDevice();
}, 300); // 使用300ms的防抖

onMounted(() => {
  selectedCategory.value = "";
  consumptionList.value = [];
  fetchConsumptionOverview();
  checkDevice();
  updateDetailMaxHeight();
  window.addEventListener("resize", handleResize);
});

onUnmounted(() => {
  window.removeEventListener("resize", handleResize);
});
</script>

<style scoped>
@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(10px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes skeleton-loading {
  0% {
    background-position: 200% 0;
  }

  100% {
    background-position: -200% 0;
  }
}

/* 隐藏滚动条但保持滚动功能 */
.scrollbar-hide {
  -ms-overflow-style: none;
  scrollbar-width: none;
}

.scrollbar-hide::-webkit-scrollbar {
  display: none;
}
</style>
