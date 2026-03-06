/**
 * 发送邮箱验证码（注册/重置密码）
 *
 */
export interface SendEmailCodeRequest {
  /**
   * Email
   */
  email: string;
  /**
   * Email Type
   */
  email_type?: "register" | "reset_password";
  /**
   * Password
   */
  password?: string;
}

/**
 * 邮箱注册参数
 */
export interface Register {
  /**
   * Code
   */
  code?: string;
  /**
   * Email
   */
  email: string;
  /**
   * Password
   */
  password: string;
  /**
   * 注册来源
   * - direct: 主动点击注册按钮
   * - auth_redirect: 401 弹窗后注册
   * - in_app_prompt: 应用内引导弹窗后注册
   */
  register_source?: string;
}

/**
 * 重置/修改密码参数
 */
export interface ResetPassword {
  /**
   * Email
   */
  email: string;
  /**
   * Code (重置密码时需要)
   */
  code?: string;
  /**
   * Old Password (修改密码时需要)
   */
  old_password?: string;
  /**
   * New Password
   */
  new_password: string;
}
/**
 * 登录参数，包含邮箱和密码
 */
export interface Login {
  /**
   * Client Id
   */
  client_id?: null | string;
  /**
   * Client Secret
   */
  client_secret?: null | string;
  /**
   * Grant Type
   */
  grant_type?: null | string;
  /**
   * Password
   */
  password: string;
  /**
   * Scope
   */
  scope?: string;
  /**
   * Username
   */
  username: string;
}
