import http from "@/utils/http";
import { AxiosPromise } from "axios";
import type {
  MenuResponse,
  NavResponse,
  HomeListResponse,
  HomeListQuery,
  NewListQuery,
  HotListQuery,
  CarouselResponse,
  NavQuery,
} from "./type";

/**
 * 获取菜单栏数据
 * @returns Promise<MenuResponse>
 */
export const getMenus = () => {
  return http.request<AxiosPromise<MenuResponse>>({
    method: "get",
    url: "/index/menus",
  });
};

/**
 * 获取导航栏数据
 * @param params - 查询参数，包含可选的channel_code
 * @returns Promise<NavResponse>
 */
export const getNavs = (params?: NavQuery) => {
  return http.request<AxiosPromise<NavResponse>>({
    method: "get",
    url: "/index/navs",
    params,
  });
};

/**
 * 获取轮播图数据
 * @returns Promise<CarouselResponse>
 */
export const getCarousels = () => {
  return http.request<AxiosPromise<CarouselResponse>>({
    method: "get",
    url: "/index/carousels",
  });
};

/**
 * 获取首页列表数据
 * @returns Promise<HomeListResponse>
 */
export const getHomeList = (data: HomeListQuery) => {
  return http.request<AxiosPromise<HomeListResponse>>({
    method: "get",
    url: "/index/p_list",
    params: data,
  });
};

/**
 * 获取首页最新数据
 * @returns Promise<NewListResponse>
 */
export const getNewList = (data: NewListQuery) => {
  return http.request<AxiosPromise<HomeListResponse>>({
    method: "get",
    url: "/index/p_list/new",
    params: data,
  });
};

/**
 * 获取首页最热数据
 * @returns Promise<HotListResponse>
 */
export const getHotList = (data: HotListQuery) => {
  return http.request<AxiosPromise<HomeListResponse>>({
    method: "get",
    url: "/index/p_list/hot",
    params: data,
  });
};

/**
 * 点赞角色
 * @param companionId - 角色ID
 * @returns Promise<any>
 */
export const likeCompanion = (companionId: number) => {
  return http.request<AxiosPromise<any>>({
    method: "post",
    url: `/companion/like/${companionId}`,
  });
};

/**
 * 取消点赞角色
 * @param companionId - 角色ID
 * @returns Promise<any>
 */
export const cancelLikeCompanion = (companionId: number) => {
  return http.request<AxiosPromise<any>>({
    method: "post",
    url: `/companion/cancel/like/${companionId}`,
  });
};
