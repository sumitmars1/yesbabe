<template>
  <!-- 骨架屏 -->
  <div
    v-if="isLoading"
    class="transition-all relative rounded-[10px] price-card-skeleton"
    :class="{
      'mb-4': globalStore.isMobile,
      'py-8': !globalStore.isMobile,
    }"
  >
    <div
      :class="{
        'flex p-5 justify-between items-center': globalStore.isMobile,
      }"
    >
      <div
        class="flex items-center"
        :class="{
          'justify-center': !globalStore.isMobile,
        }"
      >
        <div
          class="text-base leading-none"
          :class="{
            'mr-4': globalStore.isMobile,
            'mb-3': !globalStore.isMobile,
          }"
        >
          <n-skeleton text style="width: 80px" />
        </div>
        <div
          class="text-sm leading-2.5 rounded-full inline-block px-1 py-2 top-3 right-3"
          :class="{
            absolute: !globalStore.isMobile,
            hidden: globalStore.isMobile,
          }"
        >
          <n-skeleton circle style="width: 40px; height: 20px" />
        </div>
      </div>
      <div
        class=""
        :class="{
          'font-bold': !globalStore.isMobile,
        }"
      >
        <n-skeleton text style="width: 60px" />
      </div>
    </div>
    <div v-if="!globalStore.isMobile && showCurrentTotalLine" class="text-sm mt-2">
      <n-skeleton text style="width: 120px" />
    </div>
  </div>

  <!-- 实际内容 -->
  <div
    v-else
    class="transition-all cursor-pointer relative rounded-[10px] hover:translate-y-[-2px]"
    :class="[
      {
        'mb-4 ': globalStore.isMobile,
        'py-8': !globalStore.isMobile,
      },
      isSelected
        ? 'shadow-activeBorder bg-[#F2EBFF] dark:bg-[#19172B]'
        : 'shadow-border bg-background ',
    ]"
    @click="emit('select-plan')"
  >
    <div
      :class="{
        'flex p-5 justify-between items-center': globalStore.isMobile,
      }"
    >
      <div
        class="flex items-center"
        :class="{
          'justify-center': !globalStore.isMobile,
        }"
      >
        <div
          class="text-base leading-none font-bold"
          :class="{
            'mr-4': globalStore.isMobile,
            'mb-3': !globalStore.isMobile,
          }"
        >
          {{ planTitle }}
        </div>
        <div
          v-if="discountPercent"
          class="text-sm leading-2.5 text-black bg-#FFEB3B rounded-full inline-block px-1 py-2"
          :class="{
            'absolute -top-2 right-3': !globalStore.isMobile,
          }"
        >
          <span class="discount-badge ml-2">{{ discountPercent }}</span>
        </div>
      </div>
      <div
        class="flex flex-col"
        :class="[
          globalStore.isMobile ? 'items-end text-right' : 'items-center text-center',
          { 'font-bold': !globalStore.isMobile },
        ]"
      >
        <div class="flex items-baseline">
          <span
            :class="{
              'text-2xl': !globalStore.isMobile,
            }"
            >{{ currencySymbol }}{{ formatCurrency(averagePerMonth) }}</span
          >
          <span class="text-xs ml-1">{{ t('premium.priceCard.perMonth') }}</span>
        </div>
        <div
          v-if="globalStore.isMobile && showCurrentTotalLine"
          class="text-xs text-[#A8ABB2] mt-1 font-normal"
        >
          {{ currencySymbol }}{{ formatCurrency(currentPrice) }}
        </div>
      </div>
    </div>
    <div v-if="!globalStore.isMobile && showCurrentTotalLine" class="text-sm text-[#A8ABB2]">
      <span class="">{{ currencySymbol }}{{ formatCurrency(currentPrice) }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGlobalStore } from '@/stores/global/global';
import { useI18n } from 'vue-i18n';
import { useCurrency } from '@/composables/useCurrency';
import { formatVipDiscountPercentByOneMonthStandard } from '@/api/premium';

const { t } = useI18n();
const { currencySymbol, formatCurrency } = useCurrency();
// 使用 defineProps 并设置默认值
const props = defineProps({
  id: { type: Number, required: true },
  month: { type: Number, required: true },
  originalPrice: { type: String, required: true },
  currentPrice: { type: String, required: true },
  oneMonthPrice: { type: String, default: '' },
  isSelected: { type: Boolean, required: true },
  isLoading: { type: Boolean, default: false },
});

const emit = defineEmits<{
  (e: "select-plan"): void;
}>();

const globalStore = useGlobalStore();

const showCurrentTotalLine = computed(() => props.month !== 1);

const averagePerMonth = computed(() => {
  const current = parseFloat(props.currentPrice);
  if (Number.isNaN(current) || props.month <= 0) return 0;
  return current / props.month;
});

// 计算折扣百分比
const discountPercent = computed(() => {
  return formatVipDiscountPercentByOneMonthStandard(
    props.oneMonthPrice,
    props.currentPrice,
    props.month
  );
});

// 根据月份生成标题
const planTitle = computed(() => {
  return `${props.month} ${t('premium.priceCard.months')}`;
});
</script>

<style scoped>
.price-card {
  @apply p-4 rounded-lg shadow-md;
}

.discount-badge {
  @apply bg-yellow-500 text-black px-2 py-1 rounded-full text-xs;
}

/* 骨架屏样式 */
.price-card-skeleton {
  @apply p-4 rounded-lg;
  background-color: var(--bg-background);
  box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* 骨架屏颜色适配暗色模式 */
:deep(.n-skeleton) {
  --n-color-start: rgba(125, 125, 125, 0.06);
  --n-color-end: rgba(125, 125, 125, 0.12);
  background-color: transparent;
}

:deep(.n-skeleton.n-skeleton--text) {
  height: 16px;
  margin-top: 8px;
}
</style>
