import http from "@/utils/http";
import {
  GenImageTabsResponse,
  PricingTier,
  CreateImageRequest,
  CreateImageResponse,
  GenerateResponse,
} from "./type";
import { AxiosPromise } from "axios";
/**
 * /gen_image/options
 */
export const getImageOptions = () => {
  return http.request<AxiosPromise<GenImageTabsResponse[]>>({
    method: "get",
    url: "/gen_image/options",
  });
};

/**
 * /gen_image/p_rules
 */
export const getImageRules = (params: { companion_id: number }) => {
  return http.request<AxiosPromise<PricingTier[]>>({
    method: "get",
    url: "/gen_image/p_rules",
    params,
  });
};

/**
 * /gen_image/create
 */
export const createImage = (data: CreateImageRequest) => {
  return http.request<CreateImageResponse>({
    method: "post",
    url: "/gen_image/create",
    data,
    headers: {
      repeatSubmit: false, // 允许重复提交，防止图片生成请求被取消
    },
  });
};
//gen_image/history?size=10&page=1
export const getImageHistory = (data: { size: number; page: number }) => {
  return http.request<AxiosPromise<GenerateResponse[]>>({
    method: "get",
    url: "/gen_image/history",
    params: data,
  });
};
