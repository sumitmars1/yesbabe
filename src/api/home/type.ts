// 菜单项接口
export interface MenuItem {
  id: number;
  name: string;
  is_deleted: boolean;
  icon_url: string;
  sort_order: number;
}

// 导航项接口
export interface NavItem {
  id: number;
  name: string;
  is_deleted: boolean;
  icon_url: string;
  sort_order: number;
}

// 轮播图接口
export interface CarouselItem {
  id: number;
  name: string;
  car_url: string;
  click_to_url: string;
  is_deleted: boolean;
  sort_order: number;
}
export interface HomeListData{
    age: string;
    com_type: string;
    cover_video_url: string;
    head_image: string;
    description: string;
    id: number;
    interaction_number: number;
    is_deleted: boolean;
    name: string;
    liked: boolean;
    occupation?: string;
    t_head_image: string;
    s_head_image: string;
    level?: string;
  }
// 首页列表项接口
export interface HomeListResponse {
  items: HomeListData[];
  total: number;
  has_next: boolean;
}
export interface HomeListQuery extends BaseQueryListParams {
  nav_id: number;
  sort_type?: "newest" | "hottest" | "recommend";
  sex?: "man" | "girl";
}
export interface NewListQuery extends BaseQueryListParams {
  nav_id: number;
}

// 导航查询参数接口 - 支持任意URL查询参数
export interface NavQuery {
  [key: string]: string | string[] | undefined;
}

// API响应类型
export type MenuResponse = MenuItem[];
export type NavResponse = NavItem[];
export type CarouselResponse = CarouselItem[];

export type HotListQuery = NewListQuery;
