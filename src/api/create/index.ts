import { http } from "@/utils/http";
import { CreateTitle, CreateCategoryItem } from "./types";
import { CreateAIForm } from "@/stores/create/type";
import { AxiosResponse } from "axios";

// 风格数据类型
export interface StyleItem {
  id: number;
  name: string;
  image_url: string;
}

/**
 * 获取标题栏数据
 /my_ai/titles
 * 
 */
export const getTitleList = () => {
  return http.request<AxiosResponse<CreateTitle>>({
    method: "get",
    url: "/my_ai/titles",
  });
};

/**
 * 根据风格ID获取标题栏数据
 * @param style_id 风格ID
 */
export const getTitleListByStyle = (style_id: number) => {
  return http.request<AxiosResponse<CreateTitle[]>>({
    method: "get",
    url: "/my_ai/titles",
    params: { style_id },
  });
};

export const getCategoryList = (title_id: number) => {
  return http.request<AxiosResponse<CreateCategoryItem[]>>({
    method: "get",
    url: `/my_ai/options`,
    params: { title_id },
  });
};

/**
 * 获取风格数据
 */
export const getStyleList = () => {
  return http.request<AxiosResponse<StyleItem[]>>({
    method: "get",
    url: "/my_ai/styles",
  });
};

export const createMyAi = (data: CreateAIForm) => {
  return http.request({
    method: "post",
    url: "/my_ai/create",
    data,
  });
};

/**
 * 获取已创建的AI模型列表
 */
export const getMyCreatedAI = () => {
  return http.request({
    method: "get",
    url: "/my_ai/list",
  });
};
