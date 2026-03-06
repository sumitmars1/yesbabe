#AI 聊天的重构版

## 聊天的历史消息格式：这个接口是聊天记录的接口，返回的是一个数组，数组的元素是聊天记录对象，每个聊天记录对象有如下字段：
````typescript
/**
 * AI 响应字段说明（response_content 与 response_type 配合使用）
 *
 * response_type 的取值定义如下：
 *
 * 1. `"text"` — 文本消息
 *    - `response_content`: 直接为文本内容，直接展示即可。
 *
 * 2. `"mixed"` — 混合图片/视频消息
 *    - `response_content`: 为资源路径（例如 `/s/covers/xxx.png` 或 `/s/covers/xxx.mp4`）。
 *    - 可根据文件后缀判断类型：
 *        - 图片：`.png`, `.jpg`, `.jpeg`, `.webp`
 *        - 视频：`.mp4`, `.mov`, `.mkv`（可扩展）
 *    - 前端逻辑：根据文件类型动态设置 `<img src>` 或 `<video src>`。
 *
 * 3. `"image"` — 图片消息
 *    - `response_content`: 为图片文件的 ID。
 *    - 请求接口：`GET /gen_image/${id}`
 *    - 返回结果：图片流（`Blob`），前端可通过 `URL.createObjectURL()` 加载。
 *
 * 4. `"video"` — 视频消息
 *    - `response_content`: 为视频文件的 ID。
 *    - 请求接口：`GET /gen_image/${id}`
 *    - 返回结果：视频流（`Blob`），前端可直接绑定到 `<video>` 的 `src`。
 *
 * 5. `"text_hidden"` — 隐藏文本消息
 *    - 前端展示内容：显示卡片提示「请开通 Pro 查看」。
 *
 * 6. `"image_hidden"` — 隐藏图片消息
 *    - 前端展示内容：显示卡片提示「请开通 Pro 查看图片」。
 *
 * 7. `"video_hidden"` — 隐藏视频消息
 *    - 前端展示内容：显示卡片提示「请开通 Pro 查看视频」。
 *
 * 8. `"collection_video"` — 视频合集消息
 *    - `response_content`: 多个视频文件 ID，以 `|` 分隔。
 *    - 请求接口：
 *      ```ts
 *      http.request<Blob>({
 *        method: 'get',
 *        url: '/gen_image/collection/',
 *        params: { filename },
 *        responseType: 'blob',
 *      })
 *      ```
 *    - `filename` 参数即为多个视频 ID 的组合字符串（如 `"id1|id2|id3"`）。
 *    - 返回结果：视频合集流（`Blob`），可通过 `URL.createObjectURL()` 转换为可播放链接。
 *
 * 9. `"collection_image"` — 图片合集消息
 *    - `response_content`: 多个图片文件 ID，以 `|` 分隔。
 *    - 请求接口：
 *      ```ts
 *      http.request<Blob>({
 *        method: 'get',
 *        url: '/gen_image/collection/',
 *        params: { filename },
 *        responseType: 'blob',
 *      })
 *      ```
 *    - `filename` 参数即为多个图片 ID 的组合字符串（如 `"id1|id2|id3"`）。
 *    - 返回结果：图片合集流（`Blob`），前端可动态展示多张图片。
 *
 * 👉 说明：
 * - 文件类类型（image / video / collection_*）都需调用后端接口获取文件流。
 * - `mixed` 类型可直接展示，不需请求。
 * - 隐藏类型以“请开通 Pro 查看”类提示卡片展示。
 * - 接口返回的所有 Blob 数据都可使用：
 *   ```ts
 *   const url = URL.createObjectURL(blob);
 *   element.src = url;
 *   ```
 */
interface HistoryChatItem {
  id: number; //发送的id
  type: "text"; // 例如 "text"
  content: string;
  additional_data: any | null;
  is_processed_by_third_party: boolean;
  created_at: string; // ISO 时间字符串
  updated_at: string | null;
  response_id: number;//响应的id
  response_type:
    | "text"
    | "mixed"
    | "image"
    | "video"
    | "text_hidden"
    | "image_hidden"
    | "video_hidden"
    | "collection_video"
    | "collection_image";
  response_content: string;
  response_additional_data: any | null;
  response_is_from_third_party: boolean;
  response_created_at: string;
}
````
## 修改现在的插入的消息的逻辑，现在插入的消息格式与历史消息的格式不一致，所以需要修改实时消息 插入历史消息的逻辑，删除掉不需要的字段，没有使用或者没有展示的字段「is_processed_by_third_party，response_additional_data，response_is_from_third_party」等可以不用写入历史记录。

## 聊天的流程记录

1：text: 发送消息后会收到
text_start -> text_progress(需要实现打字机效果) -> text_complete(成功)/text_error(错误)
                                            -> text_progress_hidden(隐藏,渐进式马赛克) -> text_complete_hidden(隐藏，完成对所有文字的马赛克，出现Pro订阅的卡片)

```http
/api/ws/chat
```
## 消息开始

```json
{
    "message_type": "text_start",
    "content":{
        "message": "🔍 正在生成...",
        "image_url": None
    }
}
```

## 消息块

```json
{
    "message_type": "text_progress",
    "content":{
        "message": status,
        "image_url": file_id
    }
}
```

## 消息确认消息

```json
{
    "message_type": "text_complete",
    "content":{
        "success": True,
        "message": file_id,
        "image_url": file_id,
        "conversation_id": None
    }
}
```

## 错误信息

```json
{
    "message_type": "text_error",
    "content": {
        "message": "❌ 图像匹配失败，请稍后重试或升级VIP",
        "image_url": None,
        "success": False
    }
}
```



2:image: 文生图（聊天端）
text_start -> text_to_image_start -> text_to_image_progress -> text_to_image_complete (成功) / text_to_image_error(失败)
                                                            -> message_image_hidden(隐藏，显示Pro订阅的图片的卡片)
# 1. 聊天框的文生图消息流

## 链接

```http
/api/ws/chat
```

## 任务开始

```json
{
	"type": "text_to_image_start",
	"data": {
		"message": "🔍 队列排队中..",
		"image_url": null
	},
	"timestamp": "2025-09-19T22:13:19.083262"
}
```

## 心跳消息

```python
{
    "type": "ping",
    "content": {
    }
}
```

## 生成进度

```json
{
	"type": "text_to_image_progress",
	"data": {
		"message": "🎨 40.0%",
		"image_url": null
	},
	"timestamp": "2025-09-19T22:13:55.233131"
}
```

## 生成完成确认消息

```json
{
	"type": "text_to_image_complete",
	"data": {
		"success": true,
		"message": "1/1",
		"image_url": "69826f31-672e-45de-8d24-526644fc7211_0",
		"file_type": "IMAGE"
	},
	"timestamp": "2025-09-19T22:14:54.076247"
}
```

## 错误

```json
{
    "message_type": "text_to_image_error",
    "content": {
        "message": "❌ 图像匹配失败，请稍后重试或升级VIP",
        "image_url": None,
        "success": False
    }
}
```




3：video: 视频消息（聊天端）
text_start -> text_to_video_start -> text_to_video_progress -> text_to_video_complete (成功) / text_to_video_error(失败)
                                                            -> message_video_hidden(隐藏，显示Pro订阅的视频的卡片)
 # 1. 文生视频消息流

## 链接

```http
/api/ws/chat
```

## 发送消息

```json
{
    "type": "message",
    "content": "给我发一个你在大海边散步的视频"
}
```

## 任务开始

```json
{
	"type": "text_to_video_start",
	"content": {
		"message": "🎬 队列等待中.."
	},
	"sender_id": null,
	"recipient_id": null,
	"timestamp": "2025-09-19T21:12:12.440729"
}
```

## 生成进度

```json
{
	"type": "text_to_video_progress",
	"content": {
		"message": "🎬 57.1%",
		"video_url": null
	},
	"sender_id": null,
	"recipient_id": null,
	"timestamp": "2025-09-19T21:12:46.057648"
}
```

## 生成完成确认消息

```json
{
	"type": "text_to_video_complete",
	"content": {
		"success": true,
		"message": "1/1",
		"file_type": "VIDEO",
		"video_url": "21ecc0c0-e2e8-45b6-a55c-94488cf6b066",
		"file_id": ""
	},
	"sender_id": null,
	"recipient_id": null,
	"timestamp": "2025-09-19T22:35:05.607536"
}
```

## 文生视频错误

```json
{
    "message_type": "text_to_video_error",
    "content": {
        "message": "❌ 图像匹配失败，请稍后重试或升级VIP",
        "image_url": None,
        "success": False
    }
}
```

## 全局错误

```json
{
    "message_type": "error",
    "content": {
        "message": "❌ 图像匹配失败，请稍后重试或升级VIP",
        "image_url": None,
        "success": False
    }
}
```



4：collection_video: 视频合集消息（聊天端）
用户收到collection_marketing消息展示合集卡片。用户点击购买合集的按钮，发送purchase_collection消息。当收到collection_purchase_success消息，展示图片或者视频合集。（现有流程）
# 1. 聊天框

## 1. 接收到合集营销信息

`api/ws/chat`

```json
{
	"type": "collection_marketing",
	"data": {
		"id": 1,
		"title": "测试合集",
		"price": 400,
		"image_count": 20,
		"video_count": 2,
		"cover_image": "ff6302cf-2a3d-49f4-b21b-244a339bbbff_0"
	},
	"timestamp": "2025-10-24T14:44:59.556659"
}
```

## 2. 发送购买信息

`api/ws/chat`

```json
{
    "type": "purchase_collection",
    "collection_id":1
}
```

## 3. 购买合集成功后的实时信息

```json
{
	"type": "collection_purchase_success",
	"data": {
		"type": "collection_image",
		"message_id": 2203,
		"response_id": 2154,
		"file_count": 2,
		"content": "9c2f1ca3-884f-4d0f-ad9d-d59ab433a94a_0|ff6302cf-2a3d-49f4-b21b-244a339bbbff_0"
	},
	"timestamp": "2025-10-24T14:48:42.912993"
}


{
	"type": "collection_purchase_success",
	"data": {
		"type": "collection_video",
		"message_id": 2204,
		"response_id": 2155,
		"file_count": 2,
		"content": "8326b6ae-580e-4d3f-9a8f-628487c96d5b|1a347c30-be6f-4de0-a284-f85aeb118758"
	},
	"timestamp": "2025-10-24T14:48:42.914077"
}
```

优化点：以上就是聊天框的所有类型注解，用户收到对应的类型之后展示对应的消息卡片。将每个消息卡片根据type字段展示不同的内容。并将不同类型的卡片单独抽离出来（text,image,video,collection_image,collection_video，text_hidden,image_hidden,video_hidden）等不同类型的消息卡片。这些类型卡片都由同一个组件进行渲染展示。并控制数据的展示。 现在不需要判断一个完成的流程了，只需要检测最新的 unique_id 并覆盖之前的相同的 unique_id 的类型，并设置对应的类型。
