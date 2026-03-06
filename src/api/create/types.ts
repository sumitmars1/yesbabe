export interface CreateTitle {
  id: number;
  title: string;
  sort_order: number;
  is_deleted: boolean;
  type?: string;
  router_path?: string;
}

export interface CreateCategoryItem {
  id: number;
  name: string;
  sort_order: number;
  options: CreateOptionItem[];
}

export interface CreateOptionItem {
  id: number;
  name: string;
  desc: string | null;
  image_url: string | null;
  sort_order: number;
  is_vip_show: boolean;
  is_deleted: boolean;
}

// 风格类型定义
export interface StyleItem {
  id: number;
  name: string;
  image_url: string;
}
