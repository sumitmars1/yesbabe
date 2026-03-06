import { defineStore } from 'pinia';
import { ref, computed, watch } from 'vue';
import { createImage } from '@/api/AIGenerator';
import type { CreateImageRequest, CreateImageResponse } from '@/api/AIGenerator/type';
import {
  WebSocketManager,
  createWebSocketManager,
  getImageWebSocketConfig,
  MessageType,
  type WebSocketConfig,
} from '@/utils/websocket';
import { useAuthStore } from '@/stores/auth';
import { showSubscriptionModal } from '@/utils/subscriptionModal';
import { useChatStore } from '@/stores/chat';

export interface GenerationTask {
  id: string;
  request: CreateImageRequest;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  result?: CreateImageResponse;
  error?: string;
}

export interface GenerationSession {
  id: string;
  totalCount: number;
  completedCount: number;
  failedCount: number;
  tasks: GenerationTask[];
  startTime: number;
  endTime?: number;
  status: 'idle' | 'running' | 'completed' | 'failed';
  ruleId?: number; // 添加 ruleId 字段
  currentProgressMessage?: string; // 添加当前进度消息字段
  currentProgressPercentage?: number; // 添加当前进度百分比字段
}

export const useImageGeneratorStore = defineStore('imageGenerator', () => {
  // WebSocket管理器实例
  let wsManager: WebSocketManager | null = null;
  let hasSetupWsListeners = false;
  
  // 当前生成会话
  const currentSession = ref<GenerationSession | null>(null);
  const lastGenerationOptions = ref<{
    request: CreateImageRequest;
    totalCount: number;
    ruleId?: number;
  } | null>(null);
  
  // 生成历史
  const sessions = ref<GenerationSession[]>([]);
  
  // WebSocket连接状态
  const isWebSocketConnected = ref(false);
  
  // 计算属性
  const isGenerating = computed(() => currentSession.value?.status === 'running');
  
  const progress = computed(() => {
    if (!currentSession.value) return 0;
    const { totalCount, completedCount, failedCount } = currentSession.value;
    if (totalCount === 0) return 0;
    return Math.round(((completedCount + failedCount) / totalCount) * 100);
  });
  
  const remainingCount = computed(() => {
    if (!currentSession.value) return 0;
    const { totalCount, completedCount, failedCount } = currentSession.value;
    return totalCount - completedCount - failedCount;
  });
  
  const completedResults = computed(() => {
    if (!currentSession.value) return [];
    return currentSession.value.tasks
      .filter(task => task.status === 'completed' && task.result)
      .map(task => task.result!);
  });
  
  // 初始化WebSocket连接
  const initWebSocket = async (companionId?: number) => {
    const authStore = useAuthStore();
    const chatStore = useChatStore();
    
    if (!authStore.token) {
      console.warn('用户未登录，无法建立WebSocket连接');
      return;
    }
    
    try {
      // 使用菜单端图片生成的 WebSocket 配置（/api/ws/image）
      const baseConfig = getImageWebSocketConfig();
      
      // 计算 companion_id（优先使用显式传入，其次使用当前聊天对象）
      const compId = companionId ?? chatStore.currentChat?.companion_id;
      if (!compId) {
        console.warn('缺少 companion_id，无法建立图片生成 WebSocket 连接');
        return;
      }

      const nextConfig: WebSocketConfig = {
        ...baseConfig,
        token: authStore.token,
        companion_id: compId,
      };

      // 为图片生成使用独立的 WebSocket 管理器，避免与聊天模块共享导致的互相重连
      if (!wsManager) {
        wsManager = createWebSocketManager(nextConfig);
        hasSetupWsListeners = false;
      } else {
        const prevConfig = wsManager.getConfig();
        const companionChanged = prevConfig?.companion_id !== compId;
        const tokenChanged = prevConfig?.token !== authStore.token;
        const urlChanged = prevConfig?.url !== nextConfig.url;

        wsManager.updateConfig(nextConfig);

        if (companionChanged || tokenChanged || urlChanged) {
          console.log('图片生成WebSocket配置发生变化，准备重连', {
            companionChanged,
            tokenChanged,
            urlChanged,
          });
          wsManager.disconnect();
          isWebSocketConnected.value = false;
        }
      }
      
      // 设置事件监听
      setupWebSocketEvents();
      
      // 建立连接
      await wsManager!.connect();
      
    } catch (error) {
      console.error('初始化WebSocket失败:', error);
    }
  };
  
  // 设置WebSocket事件监听
  const setupWebSocketEvents = () => {
    if (!wsManager || hasSetupWsListeners) return;
    hasSetupWsListeners = true;
    
    // 监听连接状态变化
    wsManager.onConnected(() => {
      isWebSocketConnected.value = true;
      console.log('图片生成WebSocket连接已建立');
    });
    
    wsManager.onDisconnected(() => {
      isWebSocketConnected.value = false;
      console.log('图片生成WebSocket连接已断开');
    });
    
    // 监听图片生成相关消息
    wsManager.onMessage((message) => {
      handleWebSocketMessage(message);
    });
  };

  // 获取当前图片生成WS绑定的 companion_id（用于外部判断是否需要重连）
  const getCurrentCompanionId = (): number | undefined => {
    try {
      const cfg = wsManager?.getConfig();
      return cfg?.companion_id as number | undefined;
    } catch {
      return undefined;
    }
  };
  
  // 处理WebSocket消息
  const handleWebSocketMessage = (message: any) => {
    console.log('收到菜单端图片生成WebSocket消息:', message);
    
    // 根据文档，菜单端图片生成使用 data 字段而不是 content
    const messageData = message.data || message.content;
    const messageType = message.type || message.message_type;
    
    switch (messageType) {
      case 'message_exhausted_error':
        try {
          showSubscriptionModal();
        } catch (e) {
          console.error('显示订阅弹窗失败:', e);
        }
        // 将当前会话标记为失败（如存在）
        if (currentSession.value) {
          currentSession.value.status = 'failed';
          currentSession.value.endTime = Date.now();
        }
        break;
      // 菜单端：按文档流程处理，使用 data 字段
      case MessageType.menu_text_to_image_start:
        console.log('菜单文生图开始:', messageData);
        handleMenuImageGenerationStart(messageData);
        break;
      case MessageType.menu_text_to_image_progress:
        console.log('菜单文生图进度:', messageData);
        handleMenuImageGenerationProgress(messageData);
        break;
      case MessageType.menu_text_to_image_complete:
        console.log('菜单文生图完成项:', messageData);
        handleMenuImageGenerationComplete(messageData);
        break;
      case MessageType.menu_text_to_image_error:
      case 'menu_text_to_image_error': // 兼容文档中的 message_type 格式
        console.log('菜单文生图错误:', messageData);
        handleMenuImageGenerationError(messageData);
        break;
      // 兼容旧类型（映射到文档类型）
      case MessageType.image_generation_start:
      case MessageType.text_to_image_start:
        console.log('图片生成开始:', messageData);
        if (currentSession.value) currentSession.value.status = 'running';
        break;
      case MessageType.image_generation_progress:
      case MessageType.text_to_image_progress:
        console.log('图片生成进度:', messageData);
        break;
      case MessageType.image_generation_complete:
      case MessageType.text_to_image_complete:
        console.log('图片生成完成:', messageData);
        handleImageGenerationComplete(messageData);
        break;
      default:
        console.warn('未知消息类型:', messageType, message);
        break;
    }
  };
  
  // 处理图片生成完成消息
  const handleImageGenerationComplete = (content: any) => {
    if (!currentSession.value) return;
    
    const session = currentSession.value;
    const task = session.tasks[0]; // 批量模式下仅一个任务

    const batch = content?.batch_info as { current?: number; total?: number; is_last?: boolean } | undefined;
    const isSuccess = !!content?.success && !!content?.image_url;

    if (task && task.status === 'processing') {
      if (isSuccess) {
        session.completedCount++;
      } else {
        session.failedCount++;
      }

      // 若后端提供了批次信息，则以其为准判断是否结束
      const finishedByBatch = batch?.is_last === true;
      const finishedByCount = (session.completedCount + session.failedCount) >= session.totalCount;

      if (finishedByBatch || finishedByCount) {
        task.status = isSuccess ? 'completed' : 'failed';
        session.status = isSuccess && session.failedCount === 0 ? 'completed' : (session.completedCount > 0 ? 'completed' : 'failed');
        session.endTime = Date.now();
      }
    }
  };

  // 处理菜单端图片生成开始消息
  const handleMenuImageGenerationStart = (data: any) => {
    if (currentSession.value) {
      currentSession.value.status = 'running';
      // 更新任务状态
      if (currentSession.value.tasks[0]) {
        currentSession.value.tasks[0].status = 'processing';
      }
    }
  };

  // 处理菜单端图片生成进度消息
  const handleMenuImageGenerationProgress = (data: any) => {
    if (!currentSession.value) return;
    
    console.log('收到进度消息 data:', data);
    
    // 存储完整的进度消息
    if (data.message) {
      currentSession.value.currentProgressMessage = data.message;
      console.log(`菜单端生成进度消息: ${data.message}`);
    }
    
    // 尝试多种方式提取进度百分比
    let progressValue: number | null = null;
    
    // 方式1: 从 data.message 中提取百分比，支持多种格式
    // 例如: "3.2%", "🎨 40.0%", "progress: 50%", "50.5 %" 等
    if (data.message) {
      const percentMatch = data.message.match(/(\d+(?:\.\d+)?)\s*%/);
      if (percentMatch) {
        progressValue = parseFloat(percentMatch[1]);
        console.log(`从 message 提取进度百分比: ${progressValue}%`);
      }
    }
    
    // 方式2: 如果 message 中没有百分比，尝试提取纯数字
    // 例如: "3.2", "40.0" 等
    if (progressValue === null && data.message) {
      const numberMatch = data.message.match(/(\d+(?:\.\d+)?)/);
      if (numberMatch) {
        const num = parseFloat(numberMatch[1]);
        // 如果数字在 0-100 范围内，认为是百分比
        if (num >= 0 && num <= 100) {
          progressValue = num;
          console.log(`从 message 提取纯数字作为进度: ${progressValue}%`);
        }
      }
    }
    
    // 方式3: 尝试从 data.progress 字段提取
    if (progressValue === null && data.progress !== undefined) {
      if (typeof data.progress === 'number') {
        progressValue = data.progress;
        console.log(`从 progress 字段提取进度: ${progressValue}%`);
      } else if (typeof data.progress === 'string') {
        const progressMatch = data.progress.match(/(\d+(?:\.\d+)?)/);
        if (progressMatch) {
          progressValue = parseFloat(progressMatch[1]);
          console.log(`从 progress 字符串提取进度: ${progressValue}%`);
        }
      }
    }
    
    // 存储进度百分比到会话中
    if (progressValue !== null && !isNaN(progressValue)) {
      // 确保进度值在 0-100 范围内
      currentSession.value.currentProgressPercentage = Math.min(Math.max(progressValue, 0), 100);
      console.log(`✅ 最终存储的进度: ${currentSession.value.currentProgressPercentage}%`);
    } else {
      console.warn('⚠️ 无法从进度消息中提取有效的百分比数值');
    }
  };

  // 处理菜单端图片生成完成消息
  const handleMenuImageGenerationComplete = (data: any) => {
    if (!currentSession.value) return;

    const session = currentSession.value;
    const task = session.tasks[0];

    const batch = data?.batch_info as { current?: number; total?: number; is_last?: boolean } | undefined;
    const isSuccess = !!data?.success && !!data?.image_url;

    if (task && task.status === 'processing') {
      // 先保存更新前的计数，用于判断是否完成
      const previousCompletedCount = session.completedCount;
      const previousFailedCount = session.failedCount;

      // 更新计数
      if (isSuccess) {
        session.completedCount++;
        // 存储结果
        if (!task.result) {
          task.result = {
            id: data.image_url || `result_${Date.now()}`,
            image_url: data.image_url,
            status: 'completed',
            message: data.message || ''
          };
        }
      } else {
        session.failedCount++;
        // 当生成失败时，存储后端返回的完整错误信息
        task.error = data?.message || '生成失败';
      }

      // 根据 batch_info 的 is_last 判断是否完成，或者根据更新后的完成数量判断
      const finishedByBatch = batch?.is_last === true;
      const finishedByCount = (session.completedCount + session.failedCount) >= session.totalCount;

      if (finishedByBatch || finishedByCount) {
        // 确保状态正确设置
        task.status = isSuccess ? 'completed' : 'failed';

        // 设置会话状态：只要有成功的就算completed，全部失败才算failed
        if (session.completedCount > 0) {
          session.status = 'completed';
        } else {
          session.status = 'failed';
        }

        session.endTime = Date.now();
      }
    }
  };

  // 处理菜单端图片生成错误消息
  const handleMenuImageGenerationError = (data: any) => {
    if (currentSession.value) {
      currentSession.value.status = 'failed';
      currentSession.value.endTime = Date.now();
      // 更新任务状态，存储后端返回的完整错误信息
      if (currentSession.value.tasks[0]) {
        currentSession.value.tasks[0].status = 'failed';
        // 直接使用后端返回的错误信息，不做任何处理
        currentSession.value.tasks[0].error = data?.message || '生成失败';
      }
      console.error('菜单端图片生成错误:', data);
    }
  };
  
  // 通过WebSocket发送图片生成消息
  const sendImageGenerationMessage = async (request: CreateImageRequest, ruleId?: number) => {
    if (!wsManager || !isWebSocketConnected.value) {
      throw new Error('WebSocket未连接');
    }
    
    try {
      const success = wsManager.sendGenerateImageMessage(
        request.content,
        request.image_number, // 这里image_number就是批量数量
        ruleId // 传递 rule_id
      );
      
      if (!success) {
        throw new Error('发送WebSocket消息失败');
      }
    } catch (error) {
      console.error('发送图片生成消息失败:', error);
      throw error;
    }
  };
  
  // 开始生成会话
  const startGeneration = async (request: CreateImageRequest, totalCount: number, ruleId?: number) => {
    const sessionId = `session_${Date.now()}`;
    const normalizedRequest: CreateImageRequest = {
      ...request,
      image_number: totalCount,
    };

    lastGenerationOptions.value = {
      request: { ...normalizedRequest },
      totalCount,
      ruleId,
    };
    
    // 创建新会话
    const session: GenerationSession = {
      id: sessionId,
      totalCount,
      completedCount: 0,
      failedCount: 0,
      tasks: [],
      startTime: Date.now(),
      status: 'running',
      ruleId // 存储 ruleId 到会话中
    };
    
    // 创建单个批量任务，而不是多个单独任务
    const task: GenerationTask = {
      id: `${sessionId}_batch_task`,
      request: normalizedRequest, // 使用totalCount作为批量数量
      status: 'pending'
    };
    session.tasks.push(task);
    
    currentSession.value = session;
    sessions.value.push(session);
    
    // 开始执行任务
    await executeGeneration();
  };
  
  // 执行生成任务
  const executeGeneration = async () => {
    if (!currentSession.value) return;
    
    const session = currentSession.value;
    
    try {
      // 执行批量任务
      const task = session.tasks[0]; // 现在只有一个批量任务
      if (task && task.status === 'pending') {
        // 检查会话是否被停止
        if (session.status === 'running') {
          await executeTask(task, session.ruleId); // 传递 ruleId
        }
      }
      // 会话的最终完成/失败由 WebSocket 完成项或错误消息来决定
    } catch (error) {
      console.error('生成过程中发生错误:', error);
      session.status = 'failed';
      session.endTime = Date.now();
    }
  };
  
  // 执行单个任务
  const executeTask = async (task: GenerationTask, ruleId?: number) => {
    if (!currentSession.value) return;
    
    try {
      task.status = 'processing';
      
      // 确保WebSocket连接已建立
      if (!isWebSocketConnected.value) {
        await initWebSocket(task.request.companion_id);
      }
      
      // 通过WebSocket发送图片生成请求，传递 ruleId
      await sendImageGenerationMessage(task.request, ruleId);
      
      // 注意：任务状态将通过WebSocket消息回调更新
      // 不在这里直接设置为completed，而是等待WebSocket消息
      
    } catch (error) {
      console.error(`任务 ${task.id} 执行失败:`, error);
      task.error = error instanceof Error ? error.message : '未知错误';
      task.status = 'failed';
      currentSession.value.failedCount++;
    }
  };
  
  // 停止生成
  const stopGeneration = () => {
    if (currentSession.value) {
      currentSession.value.status = 'failed';
      currentSession.value.endTime = Date.now();
    }
  };
  
  // 清除当前会话
  const clearCurrentSession = () => {
    currentSession.value = null;
  };
  
  // 获取会话历史
  const getSessionHistory = () => {
    return sessions.value;
  };
  
  // 恢复生成（页面刷新后继续未完成的生成）
  const resumeGeneration = async () => {
    if (!currentSession.value) {
      return false;
    }
    
    const session = currentSession.value;
    
    // 如果会话状态不是运行中，检查是否有未完成的任务
    if (session.status !== 'running') {
      const pendingTasks = session.tasks.filter(task => task.status === 'pending');
      if (pendingTasks.length > 0) {
        // 重新设置为运行状态
        session.status = 'running';
      } else {
        return false;
      }
    }
    
    const pendingTasks = session.tasks.filter(task => task.status === 'pending');
    
    if (pendingTasks.length === 0) {
      // 没有待处理任务，标记会话完成
      session.status = 'completed';
      session.endTime = Date.now();
      return false;
    }
    
    console.log(`恢复生成任务，剩余 ${pendingTasks.length} 张图片`);
    
    // 继续执行生成
    await executeGeneration();
    return true;
  };
  
  // 自动清理已完成的任务
  const cleanupCompletedTasks = () => {
    if (!currentSession.value) return;
    
    const session = currentSession.value;
    // 只保留未完成和正在处理的任务
    session.tasks = session.tasks.filter(task => 
      task.status === 'pending' || task.status === 'processing'
    );
  };

  const retryLastGeneration = async () => {
    if (!lastGenerationOptions.value) {
      console.warn('当前没有可重试的生成任务');
      return false;
    }
    const { request, totalCount, ruleId } = lastGenerationOptions.value;
    await startGeneration({ ...request }, totalCount, ruleId);
    return true;
  };
  
  // 检查是否有未完成的会话
  const hasUnfinishedSession = () => {
    return currentSession.value && 
           currentSession.value.tasks.some(task => task.status === 'pending');
  };
  
  // 取消对 currentChat 的自动监听，避免与聊天模块同时触发连接
  // 由调用方在需要时（如切换模型或开始生成）显式调用 initWebSocket()

  return {
    // 状态
    currentSession,
    sessions,
    isWebSocketConnected,
    
    // 计算属性
    isGenerating,
    progress,
    remainingCount,
    completedResults,
    
    // 方法
    startGeneration,
    stopGeneration,
    clearCurrentSession,
    getSessionHistory,
    resumeGeneration,
    hasUnfinishedSession,
    cleanupCompletedTasks,
    retryLastGeneration,
    initWebSocket,
    sendImageGenerationMessage,
    handleWebSocketMessage,
    getCurrentCompanionId,
  };
}
// 暂时注释掉本地存储功能
// , {
//   persist: {
//     key: 'imageGenerator',
//     storage: localStorage,
//     paths: ['currentSession', 'sessions']
//   }
// }
);
