// 用户信息接口
export interface UserInfo {
  id: number;
  email: string;
  is_vip: boolean;
  is_superuser: boolean;
  is_active: boolean;
  role: string;
  vip_expiration_time?: string;
  login_time?: string;
  created_time?: string;
  head_image?: string;
  user_name?: string;
}

// 认证状态接口
export interface AuthState {
  token: string | null;
  userInfo: UserInfo | null;
  isLoading: boolean;
}

// 登录响应接口
export interface LoginResponse {
  access_token: string;
  token_type: string;
}
export interface AccountInfo {
  id: number;
  tokens: number;
  user_id: number;
  user: UserInfo;
}
