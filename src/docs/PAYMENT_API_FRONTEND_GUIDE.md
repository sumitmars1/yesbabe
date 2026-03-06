# 支付接口前端对接文档

## 1. 概述

本文档面向前端开发者，提供越南支付系统的完整对接指南。

**支付流程**:
```
创建订单 → 获取支付链接 → 用户支付 → 回调处理 → 权益发放
```

**支持场景**:
- VIP订阅购买
- Token(钻石)充值

---

## 2. 鉴权说明

所有支付接口需要携带 JWT Token：

```javascript
headers: {
  "Authorization": "Bearer YOUR_JWT_TOKEN"
}
```

---

## 3. VIP订阅购买

### 3.1 创建VIP支付订单

**接口**: `POST /api/pay/vn/create_vip`

**请求体**:
```json
{
  "vip_id": 1,                      // VIP套餐ID（必填，整数>0）
  "pay_method": "VNBANKQR",         // 支付方式（必填，见下方枚举）
  "back_url": "https://example.com",// 支付完成跳转地址（可选）
}
```

**支付方式枚举** (`pay_method`):
| 值 | 说明 |
|---|---|
| `VNBANKQR` | 越南网银扫码 |
| `VNZALO` | 越南ZALO pay |
| `VNMOMO` | 越南MOMO pay |
| `VNVTPAY` | 越南ViettelPay |

**成功响应**:

```json
{
  "code": 200,
  "message": "success",
  "data": {
    "order_id": "VN_20251226113134883939871516_C51CE4",
    "payment_url": "https://payment-gateway.example.com/pay/xxxx"
  }
}
```

**前端处理**:
```javascript
// 1. 发起支付请求
const response = await fetch('/api/pay/vn/create_vip', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    vip_id: 1,
    pay_method: 'VNBANKQR',
    back_url: window.location.origin + '/payment-result'
  })
});

const result = await response.json();

if (result.code === 200) {
  // 2. 跳转到支付页面（重要：使用 location.href，不要用 window.open）
  window.location.href = result.data.payment_url;
} else {
  // 处理错误
  alert(result.message);
}
```

**重要说明**:
1. ⚠️ **必须使用 `location.href` 跳转**，不能使用 `window.open`，否则支付页面可能无法正常工作
2. 如果用户快速重复点击，后端会返回错误提示，前端应该做防抖处理
3. 每次创建新订单会自动取消该用户之前未支付的同类型订单

---

## 4. Token(钻石)充值

### 4.1 创建Token支付订单

**接口**: `POST /api/pay/vn/create_tokens`

**权限要求**: 仅VIP用户可调用

**请求体**:
```json
{
  "token_id": 1,                    // Token套餐ID（必填，整数>0）
  "pay_method": "VNMOMO",           // 支付方式（必填）
  "back_url": "https://example.com",// 支付完成跳转地址（可选）
}
```

**成功响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "order_id": "VN_20251226120000123456789012_A1B2C3",
    "payment_url": "https://payment-gateway.example.com/pay/yyyy"
  }
}
```

**前端处理** (同VIP购买):
```javascript
const response = await fetch('/api/pay/vn/create_tokens', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${token}`
  },
  body: JSON.stringify({
    token_id: 1,
    pay_method: 'VNMOMO',
    back_url: window.location.origin + '/payment-result'
  })
});

const result = await response.json();

if (result.code === 200) {
  window.location.href = result.data.payment_url;
} else {
  alert(result.message);
}
```

---

## 5. 订单查询

### 5.1 查询订单状态

**接口**: `GET /api/pay/vn/query?mch_order_id={订单号}`

**用途**: 查询订单支付状态（仅查询，有频率限制60秒内3次, 具体次数后面再调整）

**请求示例**:
```javascript
const response = await fetch(
  `/api/pay/vn/query?mch_order_id=${orderId}`,
  {
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const result = await response.json();
```

**成功响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "provider_response": {
      "code": 200,
      "data": {
        "isPaid": 1,           // 0=未支付，1=已支付
        "payAmount": "15000",
        "paidAt": "2025-12-26 12:00:00"
      }
    },
    "local_status": "completed",  // 本地订单状态
    "order_id": "VN_xxx",
    "amount": 15000,
    "order_type": "vip_purchase",
    "created_at": "2025-12-26T11:30:00"
  }
}
```

**订单状态说明**:
| 状态 | 说明 |
|---|---|
| `pending` | 待支付 |
| `completed` | 已完成（权益已发放） |
| `failed` | 支付失败 |
| `cancelled` | 已取消 |
| `amount_mismatch` | 金额异常（需人工审核） |
| `benefit_failed` | 权益发放失败（需人工审核） |

---

## 6. 订单同步（补单 ---- 先不要调用）

### 6.1 同步订单状态

**接口**: `POST /api/pay/vn/sync?mch_order_id={订单号}`

**用途**: 主动同步订单状态，如果支付成功但未收到回调，会自动补单并发放权益

**使用场景**:
- 用户支付后长时间未收到权益
- 回调丢失时的补救措施

**请求示例**:

```javascript
const response = await fetch(
  `/api/pay/vn/sync?mch_order_id=${orderId}`,
  {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`
    }
  }
);

const result = await response.json();
```

**成功响应**:
```json
{
  "code": 200,
  "message": "success",
  "data": {
    "order_id": "VN_xxx",
    "synced": true,               // 是否执行了同步操作
    "previous_status": "pending", // 同步前的状态
    "current_status": "completed",// 同步后的状态
    "message": "Order synced successfully"
  }
}
```

**前端建议**:
```javascript
// 支付完成页面可以提供"刷新订单"按钮
async function refreshOrder(orderId) {
  const result = await syncOrder(orderId);

  if (result.data.current_status === 'completed') {
    // 权益已发放，刷新用户信息
    await fetchUserInfo();
    showSuccess('支付成功，权益已发放！');
  } else if (result.data.current_status === 'pending') {
    showInfo('订单尚未支付，请稍后再试');
  } else {
    showWarning('订单状态异常，请联系客服');
  }
}
```

---

## 7. 取消订单

### 7.1 取消未支付订单

**接口**: `POST /api/pay/vn/cancel`

**用途**: 取消未支付的订单

**请求体**:
```json
{
  "mch_order_id": "VN_xxx",      // 订单号（必填）
  "cancel_reason": "用户不想支付了" // 取消原因（必填）
}
```

**成功响应**:
```json
{
  "code": 200,
  "message": "Order cancelled successfully",
  "data": {
    "order_id": "VN_xxx",
    "status": "cancelled",
    "cancel_reason": "用户不想支付了",
    "warning": "请勿使用此已取消订单的支付链接。如已支付，请联系客服退款。"
  }
}
```

**限制条件**:
- 只能取消 `pending` 状态的订单
- 已支付/已完成的订单无法取消
- 取消后可以重新创建新订单

---

## 8. 错误处理

### 8.1 常见错误码

| HTTP状态码 | code | 说明 | 前端处理 |
|---|---|---|---|
| 200 | 200 | 成功 | 正常处理 |
| 400 | 400 | 请求参数错误 | 检查请求参数 |
| 401 | 401 | 未登录或Token过期 | 跳转到登录页 |
| 403 | 403 | 权限不足 | 提示用户权限不足 |
| 404 | 404 | 订单不存在 | 提示订单不存在 |
| 429 | 429 | 请求过于频繁 | 提示用户稍后再试 |
| 500 | 500 | 服务器内部错误 | 提示系统繁忙 |
| 503 | 503 | 服务暂时不可用 | 提示支付服务繁忙，请稍后再试 |

### 8.2 错误响应示例

```json
{
  "code": 400,
  "message": "A payment request is being processed, please do not click repeatedly",
  "data": null
}
```

### 8.3 前端错误处理建议

```javascript
async function handlePayment(data) {
  try {
    const response = await fetch('/api/pay/vn/create_vip', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(data)
    });

    const result = await response.json();

    // 处理业务错误
    if (result.code !== 200) {
      switch (result.code) {
        case 400:
          alert('请求参数错误: ' + result.message);
          break;
        case 401:
          alert('登录已过期，请重新登录');
          window.location.href = '/login';
          break;
        case 404:
          alert('套餐不存在');
          break;
        case 429:
          alert('请求过于频繁，请稍后再试');
          break;
        case 500:
          alert('系统繁忙，请稍后再试');
          break;
        case 503:
          alert('支付服务繁忙，请稍后再试');
          break;
        default:
          alert(result.message || '操作失败');
      }
      return;
    }

    // 成功：跳转到支付页面
    window.location.href = result.data.payment_url;

  } catch (error) {
    // 网络错误
    console.error('Network error:', error);
    alert('网络错误，请检查网络连接');
  }
}
```

## 9. 注意事项

### 11.1 安全建议
1. ✅ 始终使用 HTTPS 传输
2. ✅ Token 不要暴露在URL中，使用 Header 传递
3. ✅ 前端不要缓存敏感信息（如支付金额、套餐价格）
4. ✅ 支付跳转前验证用户登录状态
5. ✅ 订单号只能通过服务端创建，前端不可伪造

### 11.2 用户体验建议
1. ✅ 支付按钮添加防抖（至少1秒间隔）
2. ✅ 支付跳转前显示Loading状态
3. ✅ 支付回调页面自动查询订单状态
4. ✅ 提供"刷新订单"功能，应对回调延迟
5. ✅ 对异常订单（`amount_mismatch`, `benefit_failed`）提示联系客服
6. ✅ 超时未支付的订单（默认30分钟）会被自动取消

### 11.3 常见问题

**Q1: 用户支付后跳转回来，但权益未到账？**
- A: 使用 `/api/pay/vn/sync` 接口主动同步订单状态

**Q2: 用户多次点击支付按钮会创建多个订单吗？**
- A: 不会，后端会取消之前的未支付订单，只保留最新的订单

**Q3: 订单状态为 `amount_mismatch` 是什么意思？**

- A: 支付金额与订单金额不符，需要人工审核，提示用户联系客服

**Q4: 如何处理支付超时？**
- A: 订单创建后30分钟（可配置）未支付会自动取消，用户需要重新创建订单

**Q5: 支付链接可以分享给别人吗？**
- A: 不可以，支付链接与用户账号绑定，且有时效限制
