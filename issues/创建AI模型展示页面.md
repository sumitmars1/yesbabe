# 创建AI模型展示页面

## 需求描述
在创建页面中新增一个页面，在用户第一次成功创建完AI模型之后，再点击创建菜单都要进入这个页面。页面展示已经创建的AI模型，在这些AI模型之前有一个"+"号的添加入口，模型卡片和添加卡片的风格保持一致。

## 实现方案
采用独立模型展示页面方案：
1. 创建 `CreatedModels.vue` 页面展示已创建的AI模型
2. 添加 `/create/models` 路由
3. 修改创建入口逻辑，用户已创建AI时跳转到模型展示页面
4. 创建 `AddAICard` 和 `ModelCard` 组件，复用 `RoleCard` 样式
5. 在 create store 中添加状态管理

## 实现步骤

### 1. 创建核心组件
- ✅ 创建 `AddAICard.vue` 组件（添加AI入口，样式参考AddRoleCard）
- ✅ 创建 `ModelCard.vue` 组件（展示AI模型，样式参考RoleCard）

### 2. 创建主页面
- ✅ 创建 `CreatedModels.vue` 页面
- ✅ 实现响应式布局（参考HomeView）
- ✅ 集成AddAICard和ModelCard组件

### 3. 路由和状态管理
- ✅ 在路由中添加 `/create/models` 路由
- ✅ 修改create store，添加用户创建状态管理
- ✅ 修改创建入口逻辑（菜单点击逻辑）
- ✅ 修改创建成功后的跳转逻辑

## 文件变更

### 新增文件
1. `/src/components/AddAICard/index.vue` - 添加AI卡片组件
2. `/src/components/ModelCard/index.vue` - AI模型卡片组件
3. `/src/views/Creator/CreatedModels.vue` - AI模型展示页面

### 修改文件
1. `/src/router/index.ts` - 添加 `/create/models` 路由
2. `/src/stores/create/index.ts` - 添加用户创建状态管理
3. `/src/stores/menu/index.ts` - 修改创建菜单点击逻辑

## 技术特点

### 组件设计
- `AddAICard` 和 `ModelCard` 组件复用了 `RoleCard` 的样式设计
- 支持PC和移动端响应式布局
- 保持与现有组件一致的交互体验

### 状态管理
- 在 create store 中添加 `hasCreatedAI` 状态跟踪用户是否已创建AI
- 在 create store 中添加 `createdAIList` 存储用户创建的AI列表
- 创建成功后自动更新状态并跳转到模型展示页面

### 路由逻辑
- 菜单点击时根据 `hasCreatedAI` 状态决定跳转路径
- 已创建AI：跳转到 `/create/models`
- 未创建AI：跳转到 `/create/style`

## 待完善
1. 需要实现真实的获取用户已创建AI模型的API接口
2. 需要在应用启动时检查用户的创建状态
3. 可以考虑添加模型编辑、删除等功能
4. 可以添加模型分享、导出等高级功能

## 测试要点
1. 首次用户点击创建菜单应进入创建流程
2. 已创建AI的用户点击创建菜单应进入模型展示页面
3. 创建成功后应自动跳转到模型展示页面
4. 模型展示页面的添加按钮应能正确跳转到创建流程
5. PC和移动端的样式应保持一致