import http from "@/utils/http";
import { SendEmailCodeRequest, Register, Login, ResetPassword } from "./type";

/**
 * 用户注册
 * @param email 邮箱
 * @param password 密码
 * @param username 用户名
 */
export const SendEmailCode = (data: SendEmailCodeRequest) => {
  return http.request({
    method: "post",
    url: "/user/send_email_code",
    data,
  });
};

/**
 * /user/register
 * @param email 邮箱
 * @param password 密码
 * @param code 验证码
 */
export const register = (data: Register) => {
  return http.request({
    method: "post",
    url: "/user/register",
    data,
  });
};

/**
 * /user/reset_password
 * @param email 邮箱
 * @param new_password 新密码
 * @param code 验证码 (重置密码时需要)
 * @param old_password 旧密码 (修改密码时需要)
 */
export const resetPassword = (data: ResetPassword) => {
  return http.request({
    method: "post",
    url: "/user/reset_password",
    data,
  });
};
/**
 * /login/token
 * Handles user login and returns a JWT access token.
 * x-www-form-urlencoded
 */
export const login = (data: Login) => {
  return http.request({
    method: "post",
    url: "/login/token",
    data,
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
  });
};
/**
 * 获取我的信息
 * /user/me
 */
export const getMyInfo = () => {
  return http.request({
    method: "get",
    url: "/user/me",
  });
};
export const getAccountInfo = () => {
  return http.request({
    method: "get",
    url: "/user/account",
  });
};
/**
 * logout
 * /logout
 */
export const logout = () => {
  return http.request({
    method: "post",
    url: "/logout",
  });
}

export const deleteAccount = (data: any) => {
  return http.request({
    method: 'post',
    url: '/user/delete_account',
    data,
  });
};