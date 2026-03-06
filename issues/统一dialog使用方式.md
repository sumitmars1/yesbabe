# 统一 dialog 使用方式

## 背景

在 `generator.vue` 文件中发现了两种不同的 dialog 使用方式：
1. `confirmSelection` 方法中使用 `createDiscreteApi(["dialog"])`
2. `generateImage` 方法中使用 `useDialog()`

这种不一致可能导致代码混乱和潜在问题。

## 解决方案

统一使用 `useDialog()` 方法，因为：
- 项目已经在 App.vue 中配置了全局的 `<n-dialog-provider>`
- `useDialog()` 更符合Vue3的组合式API设计理念
- 统一使用一种方式可以提高代码的一致性和可维护性

## 修改步骤

1. 确保在文件顶部已导入 useDialog
2. 在 setup 作用域内创建一个 dialog 变量：`const dialog = useDialog()`
3. 修改 confirmSelection 方法，删除 createDiscreteApi 的使用，直接使用预先创建的 dialog 变量
4. 修改 generateImage 方法，删除重复创建的 dialog 变量

## 修改结果

整个组件现在统一使用 `useDialog()` 方式，提高了代码质量和可维护性。