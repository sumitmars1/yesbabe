
export interface GenImageTabsResponse {
    id: number;
    name: string;
    sort_order: number;
    is_deleted: boolean;
    datas: GenImageOptionsResponse[];
}
export interface GenImageOptionsResponse {
    id: number;
    name: string;
    image_url: string;
    cue_word: string;
    is_deleted: boolean;
    sort_order: number;
}
export interface PricingTier {
    id: number;
    image_number: number;
    d_price: number;
    is_deleted: boolean;
    is_vip_show: boolean;
}

export interface CreateImageRequest {
    content: string;
    companion_id: number;
    image_number: number;
}

export interface CreateImageResponse {
    id: string;
    image_url: string;
    status: 'pending' | 'processing' | 'completed' | 'failed';
    message?: string;
}
export interface GenerateResponse {
    id: number;
    uu_id: string;
    file_type: string;
    created_time: string;
    image_id: number;
    companion_id: number;
    // 是否可再次生成视频（后端将补充该字段）；缺省视为可生成
    can_generate_video?: boolean;
}
