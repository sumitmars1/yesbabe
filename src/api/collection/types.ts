/**
 * 合集信息
 */
export interface Collection {
  id: number
  title: string
  description: string
  cover_image: string
  image_count: number
  video_count: number
  price: number
  discount_price: number
  is_free: boolean
  is_featured: boolean
  purchase_count: number
  created_time: string
  is_purchased: boolean
  companion_id?: number
}

/**
 * 合集列表响应
 */
export interface CollectionsResponse {
  companion_id: number
  companion_name: string
  collections: Collection[]
  total_count: number
}

/**
 * 合集文件
 */
export interface CollectionFile {
  id: number
  uu_id: string
  file_type: 'image' | 'video'
  signed_url?: string
}

/**
 * 合集详情（不含 is_purchased 字段）
 */
export interface CollectionDetail {
  id: number
  title: string
  description: string
  cover_image: string
  image_count: number
  video_count: number
  companion_id: number
  created_time: string
}

/**
 * 合集文件列表响应
 */
export interface CollectionFilesResponse {
  collection: CollectionDetail
  files: CollectionFile[]
  total_files: number
}

/**
 * 购买合集响应
 */
export interface PurchaseResponse {
  collection_id: number
  collection_title: string
  file_count: number
  paid_amount: number
}

/**
 * 已购买合集列表响应
 */
export interface PurchasedCollectionsResponse {
  items: Collection[]
  total_count: number
}
