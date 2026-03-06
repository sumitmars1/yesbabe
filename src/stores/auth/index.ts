import { defineStore } from "pinia";
import { ref, computed } from "vue";
import { useRouter } from "vue-router";
import {
  getMyInfo,
  getAccountInfo,
  logout as loginRequest,
} from "@/api/auth/index";
import { getDefaultCompanions } from "@/api/chat/index";
import { showLoginModal } from "@/utils/authModal";
import { isLoggingOut } from "@/utils/http";
import { REGISTER_SOURCE, type RegisterSource } from "@/constants/registration";
import type { UserInfo, AccountInfo } from "./type";
import type { MessageItem } from "@/types/chat";

export const useAuthStore = defineStore(
  "auth",
  () => {
    // 状态
    const token = ref<string | null>(localStorage.getItem("token"));
    const userInfo = ref<UserInfo | null>(null);
    const accountInfo = ref<AccountInfo | null>(null);
    const isLoading = ref(false);
    // 添加验证状态标志
    const isVerifyingToken = ref(false);
    // 注册来源上下文
    const registerSource = ref<RegisterSource>(REGISTER_SOURCE.DIRECT);

    // 计算属性
    const isLoggedIn = computed(() => !!token.value);
    // 检查是否正在验证token
    const isTokenBeingVerified = computed(() => isVerifyingToken.value);

    // 设置 token
    const setToken = (newToken: string) => {
      token.value = newToken;
      localStorage.setItem("token", newToken);
    };

    // 清除 token
    const clearToken = () => {
      token.value = null;
      localStorage.removeItem("token");
    };

    // 设置用户信息
    const setUserInfo = (info: UserInfo) => {
      userInfo.value = info;
    };

    // 清除用户信息
    const clearUserInfo = () => {
      userInfo.value = null;
    };

    // 清除账户信息
    const clearAccountInfo = () => {
      accountInfo.value = null;
    };

    // 设置注册来源
    const setRegisterSource = (source: RegisterSource) => {
      registerSource.value = source;
    };

    // 重置注册来源为默认值
    const resetRegisterSource = () => {
      registerSource.value = REGISTER_SOURCE.DIRECT;
    };
    const handleGetAccountInfo = async () => {
      if (!token.value) {
        return new Error("No token available");
      }
      try {
        const response = await getAccountInfo();
        if (response.code === 200) {
          accountInfo.value = response.data;
        }
      } catch (error: any) {
        // 全局拦截器已处理401等错误，此处仅记录其他未知异常
        console.error("Failed to get account info:", error);
      }
    };
    // 获取用户信息
    const fetchUserInfo = async () => {
      if (!token.value) {
        throw new Error("No token available");
      }

      isVerifyingToken.value = true;
      try {
        isLoading.value = true;
        const response = await getMyInfo();
        if (response.code === 200) {
          setUserInfo(response.data);
          return response.data;
        } else {
          throw new Error(response.message || "Failed to fetch user info");
        }
      } catch (error) {
        console.error("Failed to fetch user info:", error);
        throw error;
      } finally {
        isLoading.value = false;
        isVerifyingToken.value = false;
      }
    };

    // 初始化新用户的默认聊天模型
    const initializeDefaultChats = async () => {
      try {
        // 检查是否为新用户（可以根据用户信息或本地存储判断）
        const hasInitialized = localStorage.getItem("defaultChatsInitialized");

        if (!hasInitialized) {
          console.log("初始化新用户默认聊天模型...");
          const { data: defaultCompanions } = await getDefaultCompanions(5);

          if (defaultCompanions && defaultCompanions.length > 0) {
            // 将默认模型保存到本地存储，模拟为聊天列表
            const defaultChats = defaultCompanions.map((companion) => ({
              ...companion,
              content:
                companion.content ||
                "你好！我是" + companion.name + "，很高兴认识你！",
              message_response_created_at: new Date().toISOString(),
              unread_count: 1, // 初始化时有一条未读消息
              is_read: false,
            }));

            // 保存到本地存储，使得消息列表可以显示
            localStorage.setItem(
              "defaultChatModels",
              JSON.stringify(defaultChats)
            );
            localStorage.setItem("defaultChatsInitialized", "true");

            console.log(
              "新用户默认聊天模型初始化完成:",
              defaultChats.length,
              "个模型"
            );
          }
        }
      } catch (error) {
        console.error("初始化默认聊天模型失败:", error);
      }
    };

    // 登录成功后的处理
    const handleLoginSuccess = async (accessToken: string) => {
      setToken(accessToken);
      try {
        await fetchUserInfo();
        await handleGetAccountInfo();

        // 初始化新用户的默认聊天模型
        await initializeDefaultChats();
      } catch (error) {
        console.error("Failed to fetch user info after login:", error);
        // 即使获取用户信息失败，也保持登录状态
      }

      // 登录成功后刷新页面，确保应用状态完全重置
      setTimeout(() => {
        window.location.reload();
      }, 100); // 短暂延迟确保数据已保存
    };

    // 登出（用户主动登出）
    const logout = async (shouldRedirectToHome = true) => {
      // 设置登出标志，防止响应拦截器递归调用
      isLoggingOut.value = true;

      // 先发送登出请求（此时token还存在），再清除本地状态
      try {
        await loginRequest();
      } catch (error) {
        // 忽略logout请求的错误，避免死循环
        console.log(
          "Logout request failed, but will clear local state anyway:",
          error
        );
      } finally {
        // 无论服务器请求成功失败，都要清除本地状态
        clearToken();
        clearUserInfo();
        clearAccountInfo();
        // 清除登出标志
        isLoggingOut.value = false;

        // 如果需要重定向到首页且当前不在首页
        if (shouldRedirectToHome && window.location.pathname !== "/") {
          // 重定向到首页
          window.location.href = "/";
        } else {
          // 否则刷新当前页面以确保状态完全清除
          window.location.reload();
        }
      }
    };

    // 系统自动登出（不刷新页面，用于401/403等自动登出场景）
    const logoutSilently = async (shouldRedirectToHome = false) => {
      // 设置登出标志，防止响应拦截器递归调用
      isLoggingOut.value = true;

      try {
        // 对于系统自动登出，不发送logout请求，只清除本地状态
        // 因为通常是因为token已经失效才触发的自动登出
        clearToken();
        clearUserInfo();
        clearAccountInfo();

        // 如果需要重定向到首页且当前不在首页
        if (shouldRedirectToHome && window.location.pathname !== "/") {
          // 重定向到首页
          window.location.href = "/";
        }
      } finally {
        // 清除登出标志
        isLoggingOut.value = false;
      }
    };

    return {
      // 状态
      token,
      userInfo,
      accountInfo,
      registerSource,
      // 计算属性
      isLoggedIn,
      isTokenBeingVerified,
      // 方法
      setToken,
      clearToken,
      setUserInfo,
      clearUserInfo,
      clearAccountInfo,
      setRegisterSource,
      resetRegisterSource,
      fetchUserInfo,
      handleLoginSuccess,
      handleGetAccountInfo,
      logout,
      logoutSilently,
      initializeDefaultChats,
    };
  },
  {
    persist: true,
  }
);
