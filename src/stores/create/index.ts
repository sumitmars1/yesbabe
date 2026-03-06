import { CreateType, CreateTypeItem, CreateAIForm } from "./type";
import {
  CreateTitle,
  CreateCategoryItem,
  CreateOptionItem,
} from "@/api/create/types";
import { defineStore } from "pinia";
import { computed, ref } from "vue";
import { useRouter, useRoute } from "vue-router";
import {
  getTitleList,
  getTitleListByStyle,
  getCategoryList,
  getStyleList,
  createMyAi as createMyAiApi,
  getMyCreatedAI,
  StyleItem,
} from "@/api/create/index";

export const useCreateStore = defineStore("create", () => {
  const router = useRouter();
  const route = useRoute();
  const CreateTypeList = ref<CreateTitle[]>([]);
  const categoryData = ref<Record<string, CreateOptionItem[]>>({});
  // 以 title 或 category.name 为 key 的分类与选项缓存
  // 对于 title 维度，附带 categories（分类名数组）与合并后的 options 列表
  const categoryMap = ref<Record<string, { list: any[]; categories?: string[] }>>({});
  // 针对每个 title，构建按分类名分组的选项索引（基于接口 options 动态匹配）
  const categoryOptionsIndex = ref<Record<string, Record<string, { ids: Set<number>; names: Set<string> }>>>({});

  // 风格相关状态
  const styleList = ref<StyleItem[]>([]);
  const selectedStyleId = ref<number | null>(null);

  // 用户创建状态
  const hasCreatedAI = ref<boolean>(false);
  const createdAIList = ref<any[]>([]);
  
  // 创建进度状态
  const isCreating = ref<boolean>(false);
  const createProgress = ref<number>(0);

  /**
   * 设置创建类型列表
   * @param style_id 可选的风格ID，用于获取特定风格的标题列表
   */
  const setCreateTypeList = async (style_id?: number) => {
    try {
      const res = style_id
        ? await getTitleListByStyle(style_id)
        : await getTitleList();

      // 匹配并添加 type 和 router_path
      const dataArray = Array.isArray(res.data) ? res.data : [];
      CreateTypeList.value = dataArray

      // 获取当前路由
      const currentRoutePath = route.path;

      // 找到当前路由对应的 title item
      const currentTitleItem = CreateTypeList.value.find(
        (item) => item.router_path === currentRoutePath
      );

      // 优先获取当前路由对应的 category
      if (currentTitleItem) {
        await loadCategoryForTitle(currentTitleItem);
      }

      // 分批获取其他 title 的 category（排除已获取的当前项）
      const remainingTitles = CreateTypeList.value.filter(
        (item) => item.id !== currentTitleItem?.id
      );

      // 使用 Promise.all 并发获取剩余的 categories
      await Promise.all(
        remainingTitles.map((titleItem) =>
          loadCategoryForTitle(titleItem)
        )
      );
    } catch (error) {
      console.error("获取创建类型列表失败:", error);
    }
  };

  /**
   * 获取风格列表
   */
  const setStyleList = async () => {
    try {
      const res = await getStyleList();
      styleList.value = res.data;
      // 默认选中第一个
      if (res.data.length > 0 && selectedStyleId.value === null) {
        selectedStyleId.value = res.data[0].id;
        // 同时更新表单字段，确保表单数据和UI显示一致
        updateFormField('style', res.data[0].name);
        // 根据默认选中的风格获取对应的标题列表（后台异步，不阻塞样式加载显示）
        setCreateTypeList(res.data[0].id).catch((e) => {
          console.error("预加载创建类型失败:", e);
        });
      }
    } catch (error) {
      console.error("获取风格列表失败:", error);
    }
  };

  /**
   * 切换风格
   * @param style_id 风格ID
   */
  const switchStyle = async (style_id: number | string) => {
    // 确保传入的是数字类型
    const id = typeof style_id === 'string' ? parseInt(style_id) : style_id;
    selectedStyleId.value = id;

    // 清空表单数据
    resetForm();

    // 获取新的CreateTypeList
    await setCreateTypeList(id);

    // 如果新的CreateTypeList不为空，将路由切换到第一个title
    if (CreateTypeList.value.length > 0) {
      router.push(CreateTypeList.value[0].router_path);
    }
  };

  /**
   * 重置表单数据
   */
  const resetForm = () => {
    createForm.value = {
      style: "",
      ethnicity: "",
      age: "",
      eye_color: "",
      body_type: "",
      breast_size: "",
      butt_size: "",
      hair_style: "",
      hair_color: "",
      personality: "",
      relationship: "",
    };
  };

  // 为单个 title 加载 category 数据
  const loadCategoryForTitle = async (
    titleItem: CreateTitle
  ) => {
    try {
      const categoryRes = await getCategoryList(titleItem.id);
      categoryRes.data.map((category) => {
        categoryData.value[category.name] = category.options;
      });
      
      // 转换为以 title 为 key 的 map 结构
      if (categoryRes.data) {
        // 将 category 数组转换为以 name 为 key 的对象
        categoryRes.data.forEach((category) => {
          categoryMap.value[category.name] = {
            list: category.options || [],
          };
        });

        // 确保以 title 为主 key 的结构存在
        if (!categoryMap.value[titleItem.title]) {
          categoryMap.value[titleItem.title] = {
            list: [],
            categories: [],
          };
        }

        // 合并所有 options 到主 title key 下
        const allOptions = categoryRes.data.reduce((acc, category) => {
          return acc.concat(category.options || []);
        }, []);

        // 分类名（如 Age、Eye Color 等）
        const categoryNames = categoryRes.data.map((c) => c.name);

        categoryMap.value[titleItem.title] = {
          list: allOptions,
          categories: categoryNames,
        };

        // 构建按分类名分组的选项索引，便于动态匹配表单值
        if (!categoryOptionsIndex.value[titleItem.title]) {
          categoryOptionsIndex.value[titleItem.title] = {};
        }
        const indexBucket: Record<string, { ids: Set<number>; names: Set<string> }> = {};
        categoryRes.data.forEach((c) => {
          indexBucket[c.name] = {
            ids: new Set<number>((c.options || []).map((o: any) => o.id)),
            names: new Set<string>((c.options || []).map((o: any) => String(o.name))),
          };
        });
        categoryOptionsIndex.value[titleItem.title] = indexBucket;
      }
    } catch (error) {
      console.error(`获取 ${titleItem.title} 分类数据失败:`, error);
    }
  };

  // 获取分类数据（保持原有方法兼容性）
  const getCategoryData = async (titleId: number) => {
    if (categoryData.value[titleId]) {
      return categoryData.value[titleId];
    }

    try {
      const res = await getCategoryList(titleId);
      // 将所有category的options合并
      const allOptions = res.data.reduce((acc: CreateOptionItem[], category) => {
        return acc.concat(category.options || []);
      }, []);
      categoryData.value[titleId] = allOptions;
      return allOptions;
    } catch (error) {
      console.error("获取分类数据失败:", error);
      return [];
    }
  };

  // 根据 title 获取选项列表
  const getCategoryByTitle = (title: string) => {
    return categoryMap.value[title]?.list || [];
  };

  const currentPath = computed(() => {
    return route.path;
  });

  // 当前选择的进度数字（从1开始）
  const currentStepIndex = computed(() => {
    const currentRoutePath = route.path;
    const index = CreateTypeList.value.findIndex(
      (item) => item.router_path === currentRoutePath
    );
    return index !== -1 ? index + 1 : 0;
  });

  const createForm = ref<CreateAIForm>({
    style: "",
    ethnicity: "",
    age: "",
    eye_color: "",
    body_type: "",
    breast_size: "",
    butt_size: "",
    hair_style: "",
    hair_color: "",
    personality: "",
    relationship: "",
  });

  // 统一的表单更新方法
  const updateFormField = (field: keyof CreateAIForm, value: string) => {
    createForm.value[field] = value;
  };

  // 检查字段是否被选中
  const isFieldSelected = (field: keyof CreateAIForm, value: string) => {
    return createForm.value[field] === value;
  };

  /**
   * 根据当前路由，设置当前选中的类型
   * @param path 路径参数，可能是 'next'、'prev' 或具体的路径
   */
  const setCurrentPath = (path: string) => {
    // 如果CreateTypeList为空，不执行任何操作
    if (CreateTypeList.value.length === 0) {
      return;
    }

    const currentRoutePath = route.path;
    let currentIndex = CreateTypeList.value.findIndex(
      (item) => item.router_path === currentRoutePath
    );

    // 基于接口 options 动态校验：检查当前步骤是否至少选择了一个值
    const isCurrentStepSatisfiedByOptions = (): { ok: true } | { ok: false; categoryName: string } => {
      const currentTitle = CreateTypeList.value[currentIndex]?.title;
      
      if (!currentTitle) {
        return { ok: true }; // 无法解析当前 title 时不阻塞
      }
      
      const perCategory = categoryOptionsIndex.value[currentTitle];
      
      if (!perCategory) {
        return { ok: true }; // 尚未加载分类时放行（或在上层控制 skeleton/loading）
      }
      
      const formValues = Object.values(createForm.value).filter(Boolean).map((v) => String(v));
      
      // 检查是否至少有一个分类有值（改为宽松验证）
      let hasAnyValue = false;
      for (const categoryName of Object.keys(perCategory)) {
        const { ids, names } = perCategory[categoryName];
        
        const hasValue = formValues.some((v) => names.has(v) || ids.has(Number(v)));
        
        if (hasValue) {
          hasAnyValue = true;
          break; // 只要有一个分类有值就通过
        }
      }
      
      if (!hasAnyValue) {
        return { ok: false, categoryName: currentTitle };
      }
      
      return { ok: true };
    };

    if (path === "next") {
      // 特殊处理：如果当前在 /create/style 页面，直接跳转到第一个步骤
      if (currentRoutePath === '/create/style') {
        // 检查是否选择了风格
        if (!createForm.value.style) {
          window["$message"].warning('请先选择一个风格');
          return;
        }
        
        // 已选择风格，跳转到第一个步骤
        if (CreateTypeList.value.length > 0) {
          const firstPath = CreateTypeList.value[0].router_path;
          router.push(firstPath);
          return;
        } else {
          return;
        }
      }
      
      // 基于 options 的动态校验
      const ok = isCurrentStepSatisfiedByOptions();
      
      if (!ok.ok) {
        const warningMsg = `您尚未选择${(ok as { ok: false; categoryName: string }).categoryName}，请先选择`;
        window["$message"].warning(warningMsg);
        return;
      }

      // 当当前路径未能在列表中匹配时，按预设顺序寻找下一个已存在的步骤，避免误触发创建
      if (currentIndex === -1) {
        const order = [
          '/create/style',
          '/create/race',
          '/create/body',
          '/create/hair',
          '/create/personality',
          '/create/relationship',
        ];
        const existingPaths = CreateTypeList.value.map(i => i.router_path);
        const currentOrderIndex = order.findIndex(p => currentRoutePath.startsWith(p));
        const nextPath = order.slice(currentOrderIndex + 1).find(p => existingPaths.includes(p));
        
        if (nextPath) {
          router.push(nextPath);
          return;
        }
        // 如果没有下一个步骤，才调用创建
        createMyAi();
        return;
      }

      // 如果所有字段都已填写，则切换到下一个页面
      if (currentIndex !== -1 && currentIndex < CreateTypeList.value.length - 1) {
        const nextPath = CreateTypeList.value[currentIndex + 1].router_path;
        // 跳转到下一个页面
        router.push(nextPath);
      } else {
        // 如果是最后一个页面，才调用创建
        createMyAi();
      }
    } else if (path === "prev") {
      // 当当前路径未能在列表中匹配时，按预设顺序寻找上一个已存在的步骤
      if (currentIndex === -1) {
        const order = [
          '/create/style',
          '/create/race',
          '/create/body',
          '/create/hair',
          '/create/personality',
          '/create/relationship',
        ];
        const existingPaths = CreateTypeList.value.map(i => i.router_path);
        const currentOrderIndex = order.findIndex(p => currentRoutePath.startsWith(p));
        const prevPath = order.slice(0, currentOrderIndex).reverse().find(p => existingPaths.includes(p));
        if (prevPath) {
          router.push(prevPath);
          return;
        }
        // 如果没有上一个步骤，回退到style页面
        router.push('/create/style');
        return;
      }
      
      if (currentIndex > 0) {
        router.push(CreateTypeList.value[currentIndex - 1].router_path);
      } else {
        // 已在首步或未找到索引，回退到style页面
        router.push('/create/style');
      }
    } else {
      const targetItem = CreateTypeList.value.find(
        (item) => item.router_path === path
      );
      if (targetItem) {
        router.push(path);
      } else {
        router.push(CreateTypeList.value[0].router_path);
      }
    }
  };

  const createMyAi = async () => {
    // 找到第一个未填写的字段
    const emptyField = Object.entries(createForm.value).find(
      ([key, value]) => !value
    );

    if (emptyField) {
      const fieldKey = emptyField[0];
      // 查找字段对应的路由信息
      const routeInfo = CreateTypeList.value.find((item) => {
        // 这个映射关系需要根据你的具体逻辑来确定
        // 这里只是一个示例
        const keyMap: Record<string, string> = {
          style: "Style",
          ethnicity: "Race",
          age: "Race",
          eye_color: "Race",
          body_type: "Body",
          breast_size: "Body",
          butt_size: "Body",
          hair_style: "Hair",
          hair_color: "Hair",
          personality: "Personality",
          relationship: "Relationship",
        };
        return item.type === keyMap[fieldKey];
      });

      if (routeInfo && routeInfo.router_path) {
        router.push(routeInfo.router_path);
        const fieldCNMap: Record<string, string> = {
          style: "风格",
          ethnicity: "种族",
          age: "年龄",
          eye_color: "眼睛颜色",
          body_type: "身材",
          breast_size: "胸部",
          butt_size: "臀部",
          hair_style: "发型",
          hair_color: "发色",
          personality: "个性",
          relationship: "关系",
        };
        const fieldCNName = fieldCNMap[fieldKey] || '样式';
        window["$message"].warning(`您尚未选择${fieldCNName}，请先选择`);
        // 可以择性地显示提示信息
        return;
      }
    }

    // 开始创建流程
    isCreating.value = true;
    createProgress.value = 0;

    // 最小3秒的进度条动画
    const minDuration = 3000; // 3秒
    const startTime = Date.now();

    // 启动进度条动画
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min((elapsed / minDuration) * 100, 95); // 最多到95%，等待API完成
      createProgress.value = progress;
    }, 100);

    try {
      const { data, code } = await createMyAiApi(createForm.value);
      
      // 确保至少显示了3秒
      const elapsed = Date.now() - startTime;
      if (elapsed < minDuration) {
        await new Promise(resolve => setTimeout(resolve, minDuration - elapsed));
      }
      
      // 停止进度条动画并设置为100%
      clearInterval(progressInterval);
      createProgress.value = 100;
      
      if (code === 200) {
        //创建成功，更新状态并跳转到已创建页面
        hasCreatedAI.value = true;
        // 重新获取已创建列表
        await fetchCreatedAIList();

        // 更新菜单状态
        try {
          const { useMenuStore } = await import('@/stores/menu');
          const menuStore = useMenuStore();
          await menuStore.checkCreatedAIStatus();
        } catch (error) {
          console.error('更新菜单状态失败:', error);
        }

        console.log(`output->创建成功，跳转到已创建页面`, data);
        
        // 清除缓存，确保页面显示最新数据
        localStorage.removeItem('my_ai_list_cache');
        localStorage.removeItem('my_ai_list_cache_time');
        
        // 短暂延迟后跳转，让用户看到100%进度
        setTimeout(() => {
          router.push('/create/models');
          isCreating.value = false;
          createProgress.value = 0;
        }, 500);
      } else {
        throw new Error('创建失败');
      }
    } catch (error) {
      clearInterval(progressInterval);
      isCreating.value = false;
      createProgress.value = 0;
      console.error("创建失败:", error);
      window["$message"].error("创建失败，请重试");
    }
  };

  /**
   * 获取已创建的AI列表
   */
  const fetchCreatedAIList = async () => {
    try {
      const { data } = await getMyCreatedAI();
      createdAIList.value = data || [];
      hasCreatedAI.value = createdAIList.value.length > 0;
      return createdAIList.value;
    } catch (error) {
      console.error("获取已创建AI列表失败:", error);
      createdAIList.value = [];
      hasCreatedAI.value = false;
      return [];
    }
  };

  /**
   * 检查用户是否有已创建的AI，如果没有则跳转到创建流程
   */
  const checkAndRedirectToCreate = async () => {
    const aiList = await fetchCreatedAIList();
    if (aiList.length === 0) {
      // 如果没有已创建的AI，跳转到创建流程的第一步 - style页面
      router.push('/create/style');
      return false;
    }
    return true;
  };

  return {
    CreateTypeList,
    categoryData,
    categoryMap,
    categoryOptionsIndex,
    getCategoryData,
    getCategoryByTitle,
    createForm,
    setCurrentPath,
    currentPath,
    currentStepIndex,
    updateFormField,
    isFieldSelected,
    createMyAi,
    // 动态渲染与匹配辅助
    getFormFieldByCategoryName: (name: string): keyof CreateAIForm | null => {
      const norm = String(name).trim().toLowerCase();
      const compact = norm.replace(/\s+|_/g, "");
      // 直接映射
      const direct: Record<string, keyof CreateAIForm> = {
        style: 'style',
        ethnicity: 'ethnicity',
        age: 'age',
        eyecolor: 'eye_color',
        bodytype: 'body_type',
        breastsize: 'breast_size',
        buttsize: 'butt_size',
        hairstyle: 'hair_style',
        haircolor: 'hair_color',
        personality: 'personality',
        relationship: 'relationship',
      };
      if (direct[compact]) return direct[compact];

      // 模糊匹配（按关键词）
      if (/(ethnic|race)/.test(norm)) return 'ethnicity';
      if (/^age\b|years?/.test(norm)) return 'age';
      if (/eye\s*color|eyes?\s*color/.test(norm)) return 'eye_color';
      if (/body\s*type|figure|shape/.test(norm)) return 'body_type';
      if (/breast|bust|boob|cup/.test(norm)) return 'breast_size';
      if (/butt|buttock|hip|ass/.test(norm)) return 'butt_size';
      if (/hair\s*style/.test(norm)) return 'hair_style';
      if (/hair\s*color/.test(norm)) return 'hair_color';
      if (/personality|character|trait/.test(norm)) return 'personality';
      if (/relationship|relation/.test(norm)) return 'relationship';
      return null;
    },
    // 新增方法
    fetchCreatedAIList,
    checkAndRedirectToCreate,
    // 风格相关
    styleList,
    selectedStyleId,
    setStyleList,
    switchStyle,
    resetForm,
    // 用户创建状态
    hasCreatedAI,
    createdAIList,
    // 创建进度状态
    isCreating,
    createProgress,
  };
});
