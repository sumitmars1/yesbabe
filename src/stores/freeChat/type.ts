/**
 * 免费聊天记录
 */
export interface FreeChatRecord {
  /** 剩余次数 */
  remainingCount: number;
  /** 总次数 (默认20) */
  totalCount: number;
}

/**
 * 免费聊天次数状态
 */
export interface FreeChatState {
  /** 记录映射 key: `${username}_${companionId}` */
  records: Record<string, FreeChatRecord>;
}
