<template>
  <div class="notification-bell" @click="togglePanel">
    <!-- 铃铛图标 -->
    <div class="bell-icon" :class="{ 'bell-shake': hasUnread && shouldAnimate }">
      <SvgIcon iconClass="Bell" :size="20" />
    </div>
    
    <!-- 未读数量徽章 -->
    <transition name="badge-bounce">
      <div 
        v-if="unreadCount > 0" 
        class="unread-badge"
        :class="{ 'pulse': shouldAnimate }"
      >
        {{ unreadCount > 99 ? '99+' : unreadCount }}
      </div>
    </transition>
  </div>
</template>

<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useNotificationStore } from '@/stores/notification'
import SvgIcon from '@/components/SvgIcon/index.vue'

const notificationStore = useNotificationStore()
const shouldAnimate = ref(false)

// 计算属性
const unreadCount = computed(() => notificationStore.unreadCount)
const hasUnread = computed(() => unreadCount.value > 0)

// 方法
const togglePanel = () => {
  notificationStore.togglePanel()
}

// 监听未读数量变化，触发动画
watch(unreadCount, (newCount, oldCount) => {
  if (newCount > oldCount && newCount > 0) {
    shouldAnimate.value = true
    setTimeout(() => {
      shouldAnimate.value = false
    }, 2000)
  }
}, { immediate: false })
</script>

<style scoped>
.notification-bell {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40px;
  height: 40px;
  cursor: pointer;
  border-radius: 50%;
  transition: all 0.2s ease;
}

.notification-bell:hover {
  background-color: rgba(0, 0, 0, 0.05);
}

.bell-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  color: #666;
  transition: color 0.2s ease;
}

.notification-bell:hover .bell-icon {
  color: #333;
}

/* 铃铛摇摆动画 */
.bell-shake {
  animation: bellShake 0.8s ease-in-out;
}

@keyframes bellShake {
  0%, 100% { transform: rotate(0deg); }
  10%, 30%, 50%, 70%, 90% { transform: rotate(-10deg); }
  20%, 40%, 60%, 80% { transform: rotate(10deg); }
}

/* 未读徽章样式 */
.unread-badge {
  position: absolute;
  top: -2px;
  right: -2px;
  min-width: 18px;
  height: 18px;
  background: linear-gradient(135deg, #ff4757, #ff3742);
  color: white;
  border-radius: 9px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 11px;
  font-weight: 600;
  padding: 0 4px;
  box-shadow: 0 2px 4px rgba(255, 71, 87, 0.3);
  border: 2px solid white;
}

/* 徽章脉冲动画 */
.unread-badge.pulse {
  animation: badgePulse 1.5s ease-in-out infinite;
}

@keyframes badgePulse {
  0% { transform: scale(1); }
  50% { transform: scale(1.1); box-shadow: 0 2px 8px rgba(255, 71, 87, 0.5); }
  100% { transform: scale(1); }
}

/* 徽章进入/离开动画 */
.badge-bounce-enter-active {
  animation: badgeBounceIn 0.5s ease-out;
}

.badge-bounce-leave-active {
  animation: badgeBounceOut 0.3s ease-in;
}

@keyframes badgeBounceIn {
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.2);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
}

@keyframes badgeBounceOut {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0);
    opacity: 0;
  }
}

/* 暗色主题适配 */
.dark .bell-icon {
  color: #ccc;
}

.dark .notification-bell:hover {
  background-color: rgba(255, 255, 255, 0.1);
}

.dark .notification-bell:hover .bell-icon {
  color: #fff;
}
</style>