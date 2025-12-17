# Changelog

All notable changes to the toggle-control-group component will be documented in this file.

## [1.0.0] - 2025-11-30

### 首次发布

#### ✨ 新增功能
- 创建可复用的 toggle-control-group 组件
- 支持多分组展示，每个分组可独立配置
- 支持自定义标题、图标和背景色
- 支持开关项配置（标签、提示文本、状态）
- 开关状态可视化显示（打开/关闭标签）
- 触发 change 事件通知父组件状态变化

#### 🎨 样式特性
- 组件样式完全独立，不依赖外部 CSS 变量
- 统一边框颜色：rgba(0, 0, 0, 0.3)
- 响应式布局，支持不同内容长度
- 支持提示文本自动换行

#### 📦 数据结构
- 数据驱动配置方式
- 支持 'open'/'close' 和 true/false 两种值类型
- 完整的 TypeScript 类型定义（文档中）

#### 🔧 技术实现
- 基于微信小程序 Component 构造器
- 使用 BEM 命名规范
- 代码遵循项目规范（const 声明、单引号、错误处理等）

#### 📝 文档
- 完整的 README.md 使用文档
- API 文档说明
- 多个使用示例
- 样式规格说明
- 跨项目使用指南

### 替代说明

本组件替代了以下重复代码：
- `pages/training/setting/set/index` - 专项设置页面（减少约 150 行代码）
- `pages/training/setting/album/index` - 完成率统计设置页面（减少约 60 行代码）

### 兼容性

- 微信小程序基础库版本：>= 2.0.0
- 支持所有支持 Component 构造器的小程序平台

### 依赖

无外部依赖

### 已知问题

无

---

## 版本号说明

版本格式：`主版本号.次版本号.修订号`

- **主版本号**：不兼容的 API 修改
- **次版本号**：向下兼容的功能新增
- **修订号**：向下兼容的问题修正
