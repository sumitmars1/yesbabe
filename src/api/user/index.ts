import http from "@/utils/http";
import {
  CheckRegionResponse,
  ConsumptionDetailRequest,
  ConsumptionDetailResponse,
  ConsumptionOverviewResponse
} from "./types";

/**
 * 检测用户地区
 * 用于根据 IP 地址获取用户所在地区
 */
export const checkRegion = () => {
  return http.request<CheckRegionResponse>({
    method: "get",
    url: "/user/check_region",
  });
};

/**
 * 获取消费总览
 * @param category 可选的类别筛选
 */
export const getConsumptionOverview = (category?: string) => {
  return http.request<ConsumptionOverviewResponse>({
    method: "get",
    url: "/user/consumer_overview",
    params: category ? { category } : undefined,
  });
};

/**
 * 获取消费明细
 * @param data 分页参数
 */
export const getConsumptionDetail = (data: ConsumptionDetailRequest) => {
  return http.request<ConsumptionDetailResponse>({
    method: "get",
    url: "/user/consumption_details",
    params: data,
  });
};