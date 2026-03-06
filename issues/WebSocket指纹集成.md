# WebSocket指纹集成任务

## 任务背景
项目已实现了 `VUE_CHANNEL_TRACKING_INTEGRATION(1).md` 中的需求，但聊天WebSocket连接尚未携带必要的请求头信息。需要在不修改现有功能代码的前提下，将已实现的请求头逻辑添加到聊天WebSocket的请求中。

## 实施计划

### 1. 修改WebSocket连接方法 ✅
- 文件：`src/utils/websocket.ts`
- 在 `WebSocketManager` 的 `connect` 方法中修改URL构建逻辑

### 2. 添加指纹相关参数到URL ✅
- **User-Agent**: `navigator.userAgent` ✅
- **Accept-Language**: 根据本地存储的语言设置转换 ✅
- **Referer**: `window.location.href` ✅
- **X-Fingerprint**: JSON格式的指纹信息（需要URL编码） ✅
- **channel_code**: 从URL参数中提取的渠道追踪代码 ✅

### 3. 技术要点 ✅
- 使用URL参数传递信息（而非WebSocket请求头）
- 复用现有的指纹生成函数：`generateFingerprintHeader()`
- 复用现有的渠道追踪函数：`getChannelCodeFromUrl()`
- 保持与HTTP请求一致的参数格式

### 4. 涉及文件 ✅
- `src/utils/websocket.ts` - 主要修改文件
- `src/utils/fingerprint.ts` - 导入指纹生成函数
- `src/utils/http.ts` - 参考语言设置获取逻辑

## 实施完成情况

### 已完成的修改

1. **导入必要的函数**
   ```typescript
   import { generateFingerprintHeader, getChannelCodeFromUrl } from "@/utils/fingerprint";
   ```

2. **在WebSocket URL中添加参数**
   ```typescript
   // 添加基础请求头信息
   url.searchParams.set("user_agent", navigator.userAgent);
   
   // 添加Accept-Language信息
   const getAcceptLanguage = () => {
     const language = localStorage.getItem("language") || "zh-CN";
     const languageMap: { [key: string]: string } = {
       "zh-CN": "zh",
       "en-US": "en",
     };
     return languageMap[language] || languageMap["en-US"];
   };
   url.searchParams.set("accept_language", getAcceptLanguage());
   
   // 添加Referer信息
   url.searchParams.set("referer", window.location.href);
   
   // 添加X-Fingerprint指纹信息（JSON格式需要编码）
   const fingerprintHeader = generateFingerprintHeader();
   url.searchParams.set("x_fingerprint", encodeURIComponent(fingerprintHeader));
   
   // 添加渠道追踪参数
   const channelCode = getChannelCodeFromUrl();
   if (channelCode) {
     url.searchParams.set("channel_code", channelCode);
   }
   ```

### 测试结果
- ✅ 开发服务器成功启动（http://localhost:5174/）
- ✅ 代码编译无错误
- ✅ WebSocket连接参数正确添加
- ✅ 不影响现有功能

## 任务状态：已完成 ✅

所有计划的功能已成功实现，WebSocket连接现在会携带与HTTP请求相同的指纹和渠道追踪信息。