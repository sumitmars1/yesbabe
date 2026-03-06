import { ref } from "vue";

// 单一的创建流程加载状态，供创建流程内多个页面共享
const isCreatorLoading = ref(false);
let pendingCount = 0;

const clampPending = () => {
  if (pendingCount < 0) {
    pendingCount = 0;
  }
};

export function useCreatorLoading() {
  /**
   * 开启创建流程的加载状态（支持嵌套调用）
   */
  const startCreatorLoading = () => {
    pendingCount += 1;
    isCreatorLoading.value = true;
  };

  /**
   * 结束一次创建流程的加载状态（支持嵌套调用）
   */
  const stopCreatorLoading = () => {
    pendingCount -= 1;
    clampPending();
    if (pendingCount === 0) {
      isCreatorLoading.value = false;
    }
  };

  /**
   * 兼容旧调用方式的显式设置
   */
  const setCreatorLoading = (loading: boolean) => {
    if (loading) {
      startCreatorLoading();
      return;
    }
    stopCreatorLoading();
  };

  /**
   * 重置状态为初始加载中
   */
  const resetCreatorLoading = () => {
    pendingCount = 1;
    isCreatorLoading.value = true;
  };

  return {
    isCreatorLoading,
    startCreatorLoading,
    stopCreatorLoading,
    setCreatorLoading,
    resetCreatorLoading,
  };
}
