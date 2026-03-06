import http from '@/utils/http'
import type {
  CollectionsResponse,
  CollectionFilesResponse,
  PurchaseResponse,
  PurchasedCollectionsResponse
} from './types'
import { AxiosResponse } from 'axios'

/**
 * 获取合集列表
 * @param companion_id 角色ID
 */
export const getCollections = (companion_id: number) => {
  return http.request<AxiosResponse<CollectionsResponse>>({
    method: 'get',
    url: '/companion/collections',
    params: { companion_id }
  })
}

/**
 * 获取合集文件列表
 * @param collection_id 合集ID
 */
export const getCollectionFiles = (collection_id: number) => {
  return http.request<AxiosResponse<CollectionFilesResponse>>({
    method: 'get',
    url: '/companion/collection/files',
    params: { collection_id }
  })
}

/**
 * 获取已购买合集列表
 */
export const getPurchasedCollections = () => {
  return http.request<AxiosResponse<PurchasedCollectionsResponse>>({
    method: 'get',
    url: '/companion/collections/purchased'
  })
}

/**
 * 购买合集
 * @param collection_id 合集ID
 */
export const purchaseCollection = (collection_id: number) => {
  return http.request<AxiosResponse<PurchaseResponse>>({
    method: 'post',
    url: '/companion/collection/purchase',
    params: { collection_id }
  })
}
