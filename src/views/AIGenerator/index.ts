import { useImageGeneratorStore } from '@/stores/imageGenerator';
import type { CreateImageRequest } from '@/api/AIGenerator/type';

/**
 * 开始图片生成任务
 * @param content 生成内容描述
 * @param companionId 伴侣ID
 * @param totalCount 总生成数量
 */
export const startImageGeneration = async (
  content: string,
  companionId: number,
  totalCount: number,
  ruleId?: number
) => {
  const store = useImageGeneratorStore();
  
  const request: CreateImageRequest = {
    content,
    companion_id: companionId,
    image_number: 1 // 固定为1，通过循环调用实现多张生成
  };
  
  await store.startGeneration(request, totalCount, ruleId);
};

/**
 * 停止图片生成
 */
export const stopImageGeneration = () => {
  const store = useImageGeneratorStore();
  store.stopGeneration();
};

/**
 * 获取生成进度
 */
export const getGenerationProgress = () => {
  const store = useImageGeneratorStore();
  return {
    progress: store.progress,
    isGenerating: store.isGenerating,
    remainingCount: store.remainingCount,
    completedResults: store.completedResults,
    currentSession: store.currentSession
  };
};

/**
 * 清除当前生成会话
 */
export const clearCurrentSession = () => {
  const store = useImageGeneratorStore();
  store.clearCurrentSession();
};

// 暂时注释掉恢复相关功能（因为没有本地存储）
// /**
//  * 恢复生成（页面刷新后继续）
//  */
// export const resumeImageGeneration = async () => {
//   const store = useImageGeneratorStore();
//   return await store.resumeGeneration();
// };

// /**
//  * 检查是否有未完成的会话
//  */
// export const hasUnfinishedGeneration = () => {
//   const store = useImageGeneratorStore();
//   return store.hasUnfinishedSession();
// };

// /**
//  * 自动恢复生成（在页面加载时调用）
//  */
// export const autoResumeGeneration = async () => {
//   const store = useImageGeneratorStore();
//   
//   if (hasUnfinishedGeneration()) {
//     console.log('检测到未完成的生成任务，自动恢复中...');
//     
//     // 确保会话状态正确
//     if (store.currentSession && store.currentSession.status !== 'running') {
//       store.currentSession.status = 'running';
//     }
//     
//     return await resumeImageGeneration();
//   }
//   return false;
// };