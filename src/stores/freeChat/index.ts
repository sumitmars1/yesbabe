import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useAuthStore } from "@/stores/auth";
import type { FreeChatRecord, FreeChatState } from "./type";

/** 每个模型默认免费次数 */
const DEFAULT_TOTAL_COUNT = 20;

export const useFreeChatStore = defineStore(
  "freeChat",
  () => {
    // 状态
    const records = ref<FreeChatState["records"]>({});

    /**
     * 生成存储键
     * @param username 用户名
     * @param companionId 模型ID
     */
    const generateKey = (username: string, companionId: number): string => {
      return `${username}_${companionId}`;
    };

    /**
     * 获取当前用户名
     */
    const getCurrentUsername = (): string | null => {
      const authStore = useAuthStore();
      return authStore.userInfo?.user_name || null;
    };

    /**
     * 获取指定模型的剩余免费次数
     * @param companionId 模型ID
     * @returns 剩余次数，如果未初始化则返回默认值20
     */
    const getRemainingCount = (companionId: number): number => {
      const username = getCurrentUsername();
      if (!username) return DEFAULT_TOTAL_COUNT;

      const key = generateKey(username, companionId);
      const record = records.value[key];

      if (!record) {
        // 未初始化时返回默认次数
        return DEFAULT_TOTAL_COUNT;
      }

      return record.remainingCount;
    };

    /**
     * 检查是否还有剩余免费次数
     * @param companionId 模型ID
     */
    const hasFreeCountLeft = (companionId: number): boolean => {
      return getRemainingCount(companionId) > 0;
    };

    /**
     * 初始化某模型的免费次数
     * @param companionId 模型ID
     * @param totalCount 总次数，默认20
     */
    const initFreeChat = (companionId: number, totalCount: number = DEFAULT_TOTAL_COUNT): void => {
      const username = getCurrentUsername();
      if (!username) return;

      const key = generateKey(username, companionId);

      // 已存在记录则不重复初始化
      if (records.value[key]) return;

      records.value[key] = {
        remainingCount: totalCount,
        totalCount
      };
    };

    /**
     * 消耗一次聊天次数
     * @param companionId 模型ID
     * @returns 是否消耗成功
     */
    const decrementCount = (companionId: number): boolean => {
      const username = getCurrentUsername();
      if (!username) return false;

      const key = generateKey(username, companionId);

      // 未初始化时先初始化
      if (!records.value[key]) {
        initFreeChat(companionId);
      }

      const record = records.value[key];
      if (!record || record.remainingCount <= 0) {
        return false;
      }

      records.value[key] = {
        ...record,
        remainingCount: record.remainingCount - 1
      };

      return true;
    };

    /**
     * 重置指定模型的次数
     * @param companionId 模型ID
     */
    const resetCount = (companionId: number): void => {
      const username = getCurrentUsername();
      if (!username) return;

      const key = generateKey(username, companionId);
      const record = records.value[key];

      if (record) {
        records.value[key] = {
          ...record,
          remainingCount: record.totalCount
        };
      }
    };

    /**
     * 重置当前用户所有模型的次数
     */
    const resetAllForUser = (): void => {
      const username = getCurrentUsername();
      if (!username) return;

      const prefix = `${username}_`;
      Object.keys(records.value).forEach((key) => {
        if (key.startsWith(prefix)) {
          const record = records.value[key];
          if (record) {
            records.value[key] = {
              ...record,
              remainingCount: record.totalCount
            };
          }
        }
      });
    };

    /**
     * 清除当前用户的所有记录
     */
    const clearUserRecords = (): void => {
      const username = getCurrentUsername();
      if (!username) return;

      const prefix = `${username}_`;
      Object.keys(records.value).forEach((key) => {
        if (key.startsWith(prefix)) {
          delete records.value[key];
        }
      });
    };

    return {
      // 状态
      records,
      // 方法
      getRemainingCount,
      hasFreeCountLeft,
      initFreeChat,
      decrementCount,
      resetCount,
      resetAllForUser,
      clearUserRecords
    };
  },
  {
    persist: {
      key: "free-chat-counts",
      storage: localStorage
    }
  }
);
