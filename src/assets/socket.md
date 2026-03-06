# 1. 响应

## 1. 错误

```json
{
    "message_type": "error",
    "content":{
        "message":"错误信息"
        ...其他信息
    }
}
```

## 2. 文本流

### 1. 开始

```json
{
    "message_type":"stream_start"
    "content":{
    	"message": "开始生成回复...",
    	...其他信息
	}
}
```

### 3. 块

```json
{
    "message_type":"stream_chunk"
    "content":{
    	"chunk": "",
    	...其他信息
	}
}
```

### 4. 结束

```json
{
    "message_type":"stream_complete"
    "content":{
    	"message_id": message_db.id,
    	"response_id": response_db.id,
    	"full_content": full_response,
	}
}
```

## 3. 图像生成

### 1. 开始

```json
{
    "message_type":"image_generation_start"
    "content":{
    	"message": "检测到图像生成请求，正在处理...",
	}
}
```

### 2. 流

```json
{
    "message_type":"image_generation_progress"
    "content":{
    	"message": "",
	}
}
```

### 3. 结束

```python
{
    "message_type":"image_generation_complete"
    "content":{
    	"message": "",
        "image_url": "",
        "success": ""
	}
}
```



