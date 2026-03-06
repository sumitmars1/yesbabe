import { RouterLink } from "vue-router";
import type { MenuOption } from "naive-ui";
import { defineStore } from "pinia";
import { defineComponent, h, ref, computed, watch } from "vue";
import { useRoute } from "vue-router";
import SvgIcon from "@/components/SvgIcon/index.vue";
import { useI18n } from "vue-i18n";

const renderIcon = (icon: string) => {
  return () =>
    h(SvgIcon, {
      iconClass: icon,
      size: 24,
    });
};

type CustomMenuOption = MenuOption & {
  labelName: string;
  iconName: string;
  routerPath: string;
  translationKey: string;
  key: string; // 明确指定key为string类型
};

export const useMenuStore = defineStore(
  "menu",
  () => {
    const activeKey = ref<string>("home");
    const route = useRoute();
    const { t } = useI18n();
    
    // 创建状态的响应式变量
    const hasCreatedAI = ref<boolean>(false);
    
    // 检查用户是否已创建AI的方法
    const checkCreatedAIStatus = async () => {
      try {
        const { useCreateStore } = await import('@/stores/create');
        const createStore = useCreateStore();
        const aiList = await createStore.fetchCreatedAIList();
        hasCreatedAI.value = aiList.length > 0;
      } catch (error) {
        console.error('检查已创建AI状态失败:', error);
        hasCreatedAI.value = false;
      }
    };
    
    // 初始化时延迟4秒检查，避免刷新时阻塞其他请求
    setTimeout(() => {
      checkCreatedAIStatus();
    }, 4000);

    // 定义包含 labelName 和 iconName 属性的自定义 MenuOption 类型
    const menuOptions = computed<CustomMenuOption[]>(() => {
      // 动态生成创建菜单项
      const createLabel = hasCreatedAI.value ? "menu.myAI" : "menu.create";
      const createMenuItem: CustomMenuOption = {
        // 纯文本标签，不在这里处理跳转，交由 CustomMenu 统一处理
        label: () => h("div", null, { default: () => t(createLabel) }),
        labelName: t(createLabel),
        iconName: "magicWand",
        // 避免基于当前路由的“切换”逻辑，给出基于状态的稳定目标
        routerPath: hasCreatedAI.value ? "/create/models" : "/create/style",
        key: "creator",
        icon: renderIcon("magicWand"),
        translationKey: hasCreatedAI.value ? "menu.myAI" : "menu.create",
      };
      
      return [
        {
          label: () =>
            h(
              RouterLink,
              {
                to: {
                  path: "/",
                },
              },
              { default: () => t("menu.explore") }
            ),
          labelName: t("menu.explore"),
          iconName: "explore",
          routerPath: "/",
          key: "home",
          icon: renderIcon("explore"),
          translationKey: "menu.explore",
        },
        // 聊天
        {
          label: () =>
            h(
              RouterLink,
              {
                to: {
                  path: "/chat",
                },
              },
              { default: () => t("menu.chat") }
            ),
          labelName: t("menu.chat"),
          iconName: "chat",
          routerPath: "/chat",
          key: "chat",
          icon: renderIcon("chat"),
          translationKey: "menu.chat",
        },
        // createMenuItem, 
        {
          label: () =>
            h(
              RouterLink,
              {
                to: {
                  path: "/ai-generator",
                },
              },
              { default: () => t("menu.aiGenerator") }
            ),
          labelName: t("menu.aiGenerator"),
          iconName: "AI",
          routerPath: "/ai-generator",
          key: "ai-generator",
          icon: renderIcon("AI"),
          translationKey: "menu.aiGenerator",
        },
        {
          label: () =>
            h(
              RouterLink,
              {
                to: {
                  path: "/premium/pro",
                },
              },
              { default: () => t("menu.premium") }
            ),
          labelName: t("menu.premium"),
          iconName: "Premium",
          routerPath: "/premium/pro",
          key: "premium",
          icon: renderIcon("Premium"),
          translationKey: "menu.premium",
        },
      ];
    });

    /**
     * 根据路由路径获取匹配的菜单项key
     * 优化路由匹配逻辑，更精确地处理各种路由情况
     */
    const getMenuKeyByPath = (path: string): string => {
      const currentMenuOptions = menuOptions.value;

      // 1. 尝试精确匹配
      const exactMatch = currentMenuOptions.find(
        (item) => item.routerPath === path
      );
      if (exactMatch) return exactMatch.key;

      // 2. 处理create路由的特殊情况
      if (path.startsWith('/create')) {
        return 'creator';
      }

      // 3. 处理其他子路由情况
      const parentMatch = currentMenuOptions.find((item) => {
        // 确保不是首页路径（避免误匹配）
        if (item.routerPath === "/") return false;
        // 检查是否是当前路径的父路径
        return path.startsWith(item.routerPath + "/");
      });
      if (parentMatch) return parentMatch.key;

      // 4. 处理查询参数和哈希情况
      const pathWithoutQuery = path.split("?")[0].split("#")[0];
      if (pathWithoutQuery !== path) {
        return getMenuKeyByPath(pathWithoutQuery);
      }

      // 5. 默认返回首页
      return path === "/" ? "home" : "";
    };

    // 计算属性：根据当前路由动态计算当前应该选中的菜单项
    const currentMenuKey = computed(() => {
      return getMenuKeyByPath(route.path);
    });

    // 监听路由变化，自动更新activeKey
    watch(
      currentMenuKey,
      (newKey) => {
        // 只有当newKey不为空字符串时才更新
        if (newKey && newKey !== "") {
          activeKey.value = newKey;
        }
        // 如果newKey为空字符串，保持当前activeKey不变
      },
      { immediate: true } // 组件初始化时立即执行一次
    );

    return {
      activeKey,
      menuOptions,
      currentMenuKey,
      hasCreatedAI,
      checkCreatedAIStatus,
    };
  }
  // 移除persist配置，避免状态持久化导致的不同步问题
);
