// ... existing code ...

// 默认提示词接口
export interface DefaultPrompt {
  id: number;
  content: string;
  is_deleted: boolean;
  created_time: string;
}

// 聊天伴侣相关接口
export interface CompanionInfo {
  id: number;
  name: string;
  age: number;
  language: string;
  relation: string;
  occupation: string;
  hobbies: string; // 或 string[]（若需拆分逗号分隔的列表）
  ethnicity: string;
  body: string;
  personality: string; // 或 string[]（同上）
  description: string;
  greeting: string;
  head_image: string;
  cover_video_url: string;
  cover_image_url: string;
  default_prompts: DefaultPrompt[];
  liked?: boolean; // 点赞状态
  interaction_number?: number; // 点赞数
  s_head_image?: string;
  t_head_image?: string;
}

// 导入统一的MessageItem接口
