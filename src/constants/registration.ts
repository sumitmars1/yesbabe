/**
 * 注册来源常量 — 与后端 RegistrationSource 一一对应
 * 用于追踪用户注册行为，区分主动注册和被动注册
 */

/** 注册来源常量 */
export const REGISTER_SOURCE = {
  /** 主动注册：用户主动点击注册按钮 */
  DIRECT: 'direct',
  /** 被动注册：用户操作内容时 401，弹窗后注册 */
  AUTH_REDIRECT: 'auth_redirect',
  /** 被动注册：应用内引导弹窗提示后注册 */
  IN_APP_PROMPT: 'in_app_prompt',
} as const;

/** 注册来源类型 */
export type RegisterSource = typeof REGISTER_SOURCE[keyof typeof REGISTER_SOURCE];
