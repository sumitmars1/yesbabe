<template>
  <Transition name="panel-fade">
    <div v-if="isVisible" class="fixed top-16 right-4 w-96 max-w-[calc(100vw-2rem)] bg-cardBackground border border-btnBorder rounded-xl shadow-lg z-50 overflow-hidden" @click.stop>
      <!-- 面板头部 -->
      <div class="flex items-center justify-between p-4 border-b border-btnBorder bg-cardBackground">
        <h3 class="text-lg font-semibold text-primary m-0">{{ $t('notificationCenter.title') }}</h3>
        <div class="flex items-center gap-2">
          <button 
            v-if="hasUnread" 
            @click="markAllAsRead" 
            class="px-3 py-1.5 text-sm text-appColor bg-transparent border border-appColor rounded-lg hover:bg-appColor hover:text-white transition-colors duration-200"
          >
            {{ $t('notificationCenter.markAllAsRead') }}
          </button>
          <button @click="closePanel" class="p-1.5 text-secondary hover:text-primary hover:bg-hoverBackground rounded-lg transition-colors duration-200">
            <SvgIcon iconClass="x" :size="16" />
          </button>
        </div>
      </div>

      <!-- 面板内容 -->
      <div class="max-h-96 overflow-y-auto">
        <!-- 加载状态 -->
        <div v-if="isLoading" class="flex flex-col items-center justify-center py-8 text-secondary">
          <n-spin size="small" />
          <span class="text-sm mt-2">{{ $t('common.loading') }}</span>
        </div>

        <!-- 空状态 -->
        <div v-else-if="notifications.length === 0" class="flex flex-col items-center justify-center py-8 text-secondary">
          <SvgIcon iconClass="Bell" :size="48" class="opacity-50 mb-2" />
          <p class="text-sm m-0">{{ $t('notificationCenter.noNotifications') }}</p>
        </div>

        <!-- 通知列表 -->
        <div v-else class="divide-y divide-btnBorder">
          <div 
            v-for="notification in notifications" 
            :key="notification.id" 
            class="relative flex items-start gap-3 p-3 hover:bg-hoverBackground cursor-pointer transition-colors duration-200"
            :class="{ 'bg-blue-50 dark:bg-blue-900/20': notification.status === 'unread' }"
            @click="handleNotificationClick(notification)"
          >
            <!-- 未读指示器 -->
            <div v-if="notification.status === 'unread'" class="absolute left-1 top-1/2 transform -translate-y-1/2 w-2 h-2 bg-appColor rounded-full"></div>
            
            <div class="flex-1 min-w-0 ml-3">
              <h4 class="text-sm font-medium text-primary mb-1 line-clamp-1">{{ notification.title }}</h4>
              <p class="text-xs text-secondary mb-2 line-clamp-2 leading-relaxed">{{ notification.content }}</p>
              <span class="text-xs text-secondary opacity-75">{{ formatTime(notification.created_at) }}</span>
            </div>
            
            <button 
              @click.stop="deleteNotification(notification.id)" 
              class="flex-shrink-0 p-1 text-secondary hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition-colors duration-200 opacity-0 hover:opacity-100"
              :title="$t('common.delete')"
            >
              <SvgIcon iconClass="x" :size="14" />
            </button>
          </div>
        </div>
      </div>
    </div>
  </Transition>
</template>

<script setup lang="ts">
import { computed, onMounted, onUnmounted } from 'vue'
import { NButton, NSpin } from 'naive-ui'
import { useNotificationStore } from '@/stores/notification'
import { useRouter } from 'vue-router'
import { useI18n } from 'vue-i18n'
import SvgIcon from '@/components/SvgIcon/index.vue'
import type { UnreadNotificationItem } from '@/types/notification'

const notificationStore = useNotificationStore()
const router = useRouter()
const { t: $t } = useI18n()

// 计算属性
const isVisible = computed(() => notificationStore.showPanel)
const notifications = computed(() => notificationStore.getRecentNotifications(10)) // 只显示前10条
const isLoading = computed(() => notificationStore.isLoading)
const hasUnread = computed(() => notificationStore.unreadCount > 0)

// 方法
const closePanel = () => {
  notificationStore.closePanel()
}

const markAllAsRead = async () => {
  await notificationStore.markAllAsRead()
}

const handleNotificationClick = async (notification: UnreadNotificationItem) => {
  // 标记为已读
  if (notification.status === 'unread') {
    notificationStore.markAsRead(notification.id)
  }
  
  // 根据通知类型跳转到相应页面
  if (notification.type === 'user') {
    router.push('/chat')
  } else if (notification.type === 'system') {
    // 系统通知可能不需要跳转
  }
  
  closePanel()
}

const deleteNotification = (id: number) => {
  notificationStore.removeNotification(id)
}

const formatTime = (timestamp: string) => {
  const date = new Date(timestamp)
  const now = new Date()
  const diff = now.getTime() - date.getTime()
  
  const minutes = Math.floor(diff / (1000 * 60))
  const hours = Math.floor(diff / (1000 * 60 * 60))
  const days = Math.floor(diff / (1000 * 60 * 60 * 24))
  const weeks = Math.floor(days / 7)
  const months = Math.floor(days / 30)
  
  if (minutes < 1) return $t('notificationCenter.timeAgo.justNow')
  if (minutes < 60) return $t('notificationCenter.timeAgo.minutesAgo', { minutes })
  if (hours < 24) return $t('notificationCenter.timeAgo.hoursAgo', { hours })
  if (days < 7) return $t('notificationCenter.timeAgo.daysAgo', { days })
  if (weeks < 4) return $t('notificationCenter.timeAgo.weeksAgo', { weeks })
  if (months < 12) return $t('notificationCenter.timeAgo.monthsAgo', { months })
  
  return date.toLocaleDateString('zh-CN', {
    month: 'short',
    day: 'numeric'
  })
}

// 点击外部关闭面板
const handleClickOutside = (event: MouseEvent) => {
  const target = event.target as Element
  if (!target.closest('.notification-panel') && !target.closest('.notification-bell')) {
    closePanel()
  }
}

// 生命周期
onMounted(() => {
  document.addEventListener('click', handleClickOutside)
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>

<style scoped>
/* 面板动画 */
.panel-fade-enter-active,
.panel-fade-leave-active {
  transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
}

.panel-fade-enter-from {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

.panel-fade-leave-to {
  opacity: 0;
  transform: translateY(-8px) scale(0.95);
}

/* 文本截断 */
.line-clamp-1 {
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style>