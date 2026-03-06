<template>
  <div class="skeleton-loader" :class="containerClass">
    <!-- 网格布局模式 -->
    <div 
      v-if="mode === 'grid'"
      class="grid gap-4"
      :class="gridClass"
    >
      <div 
        v-for="i in count" 
        :key="i"
        class="skeleton-item"
        :class="itemClass"
        :style="itemStyle"
      >
        <slot name="item" :index="i">
          <n-skeleton 
            class="w-full h-full" 
            :sharp="false" 
          />
        </slot>
      </div>
    </div>

    <!-- 水平布局模式 -->
    <div 
      v-else-if="mode === 'horizontal'"
      class="flex justify-center gap-4"
      :class="horizontalClass"
    >
      <div 
        v-for="i in count" 
        :key="i"
        class="skeleton-item"
        :class="itemClass"
        :style="itemStyle"
      >
        <slot name="item" :index="i">
          <n-skeleton 
            class="w-full h-full" 
            :sharp="false" 
          />
        </slot>
      </div>
    </div>

    <!-- 卡片布局模式 -->
    <div 
      v-else-if="mode === 'card'"
      class="skeleton-card"
      :class="cardClass"
    >
      <slot name="card">
        <!-- 卡片头部 -->
        <div v-if="cardConfig.showHeader" class="card-header mb-3">
          <n-skeleton 
            :text="true" 
            :style="{ width: cardConfig.headerWidth || '80%' }" 
          />
        </div>
        
        <!-- 卡片主体 -->
        <div class="card-body">
          <n-skeleton 
            class="w-full"
            :style="{ height: cardConfig.bodyHeight || '120px' }"
            :sharp="false"
          />
        </div>
        
        <!-- 卡片底部 -->
        <div v-if="cardConfig.showFooter" class="card-footer mt-3">
          <div class="flex justify-between items-center">
            <n-skeleton 
              :text="true" 
              :style="{ width: cardConfig.footerLeftWidth || '60%' }" 
            />
            <n-skeleton 
              :text="true" 
              :style="{ width: cardConfig.footerRightWidth || '30%' }" 
            />
          </div>
        </div>
      </slot>
    </div>

    <!-- 列表布局模式 -->
    <div 
      v-else-if="mode === 'list'"
      class="skeleton-list space-y-4"
    >
      <div 
        v-for="i in count" 
        :key="i"
        class="skeleton-list-item flex items-center gap-3"
        :class="listItemClass"
      >
        <slot name="list-item" :index="i">
          <!-- 头像/图标 -->
          <div v-if="listConfig.showAvatar" class="flex-shrink-0">
            <n-skeleton 
              :circle="true"
              :style="{ 
                width: listConfig.avatarSize || '40px', 
                height: listConfig.avatarSize || '40px' 
              }"
            />
          </div>
          
          <!-- 内容区域 -->
          <div class="flex-1 space-y-2">
            <n-skeleton 
              :text="true" 
              :style="{ width: listConfig.titleWidth || '70%' }" 
            />
            <n-skeleton 
              v-if="listConfig.showSubtitle"
              :text="true" 
              :style="{ width: listConfig.subtitleWidth || '90%' }" 
            />
          </div>
          
          <!-- 右侧内容 -->
          <div v-if="listConfig.showAction" class="flex-shrink-0">
            <n-skeleton 
              :text="true" 
              :style="{ width: listConfig.actionWidth || '60px' }" 
            />
          </div>
        </slot>
      </div>
    </div>

    <!-- 自定义模式 -->
    <div v-else-if="mode === 'custom'" class="skeleton-custom">
      <slot></slot>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useGlobalStore } from '@/stores/global/global';

// 定义组件属性
interface Props {
  // 骨架屏模式
  mode?: 'grid' | 'horizontal' | 'card' | 'list' | 'custom';
  // 骨架屏数量
  count?: number;
  // 网格配置
  gridCols?: {
    default?: number;
    sm?: number;
    md?: number;
    lg?: number;
    xl?: number;
    '2xl'?: number;
  };
  // 单个项目的样式配置
  itemWidth?: string;
  itemHeight?: string;
  itemClass?: string;
  // 容器样式
  containerClass?: string;
  // 水平布局配置
  horizontalClass?: string;
  // 卡片配置
  cardConfig?: {
    showHeader?: boolean;
    showFooter?: boolean;
    headerWidth?: string;
    bodyHeight?: string;
    footerLeftWidth?: string;
    footerRightWidth?: string;
  };
  cardClass?: string;
  // 列表配置
  listConfig?: {
    showAvatar?: boolean;
    showSubtitle?: boolean;
    showAction?: boolean;
    avatarSize?: string;
    titleWidth?: string;
    subtitleWidth?: string;
    actionWidth?: string;
  };
  listItemClass?: string;
}

const props = withDefaults(defineProps<Props>(), {
  mode: 'grid',
  count: 6,
  gridCols: () => ({
    default: 2,
    sm: 3,
    md: 3,
    lg: 4,
    xl: 5,
    '2xl': 6
  }),
  itemWidth: 'auto',
  itemHeight: '240px',
  itemClass: '',
  containerClass: '',
  horizontalClass: '',
  cardConfig: () => ({
    showHeader: true,
    showFooter: true,
    headerWidth: '80%',
    bodyHeight: '120px',
    footerLeftWidth: '60%',
    footerRightWidth: '30%'
  }),
  cardClass: '',
  listConfig: () => ({
    showAvatar: true,
    showSubtitle: true,
    showAction: false,
    avatarSize: '40px',
    titleWidth: '70%',
    subtitleWidth: '90%',
    actionWidth: '60px'
  }),
  listItemClass: ''
});

const globalStore = useGlobalStore();

// 计算网格类名
const gridClass = computed(() => {
  const cols = props.gridCols;
  const classes = [];
  
  if (cols.default) classes.push(`grid-cols-${cols.default}`);
  if (cols.sm) classes.push(`sm:grid-cols-${cols.sm}`);
  if (cols.md) classes.push(`md:grid-cols-${cols.md}`);
  if (cols.lg) classes.push(`lg:grid-cols-${cols.lg}`);
  if (cols.xl) classes.push(`xl:grid-cols-${cols.xl}`);
  if (cols['2xl']) classes.push(`2xl:grid-cols-${cols['2xl']}`);
  
  return classes.join(' ');
});

// 计算单个项目样式
const itemStyle = computed(() => {
  const style: Record<string, string> = {};
  
  if (props.itemWidth !== 'auto') {
    style.width = props.itemWidth;
  }
  if (props.itemHeight !== 'auto') {
    style.height = props.itemHeight;
  }
  
  return style;
});
</script>

<style scoped lang="scss">
.skeleton-loader {
  .skeleton-item {
    @apply rounded-2xl overflow-hidden;
    transition: all 0.3s ease;
  }
  
  .skeleton-card {
    @apply p-4 rounded-lg;
    background-color: var(--bg-background);
    box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    transition: all 0.3s ease;
  }
  
  .skeleton-list {
    .skeleton-list-item {
      @apply p-3 rounded-lg;
      background-color: var(--bg-background);
      transition: all 0.3s ease;
    }
  }
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

:deep(.n-skeleton.n-skeleton--text:first-child) {
  width: 70%;
}

:deep(.n-skeleton.n-skeleton--text:last-child) {
  width: 90%;
}

/* 暗色模式适配 */
:deep([data-theme="dark"] .n-skeleton) {
  --n-color-start: rgba(255, 255, 255, 0.06);
  --n-color-end: rgba(255, 255, 255, 0.12);
}
</style>