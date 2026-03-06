export type ChatType = 'text' | 'image' | 'voice' | 'video'
export interface Message {
    id: number;
    avatar: string; // URL to the avatar image
    name: string;
    type: ChatType,
    lastMessage: string;
    timestamp: string; // e.g., "5:02PM"
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
    cover_video_url: string;
    cover_image_url: string;
}
