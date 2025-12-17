# 骨架屏组件使用指南

骨架屏（Skeleton Screen）用于在内容加载时显示占位轮廓，提升用户感知体验。

**版本：** v2.2.0
**更新日期：** 2025-12-16

---

## 目录

1. [概述](#一概述)
2. [快速开始](#二快速开始)
3. [组件属性](#三组件属性)
4. [预设类型](#四预设类型)
5. [与加载系统配合](#五与加载系统配合)
6. [自定义样式](#六自定义样式)
7. [完整源码](#七完整源码)
8. [迁移到其他项目](#八迁移到其他项目)
9. [已接入页面](#九已接入页面)

---

## 一、概述

### 1.1 什么是骨架屏？

```
┌────────────────────────────────────────────────────────────────┐
│                                                                │
│   传统 Loading              骨架屏                              │
│   ┌──────────────┐        ┌──────────────────────────────┐    │
│   │              │        │ ████████████████████████████ │    │
│   │   ⏳ 加载中   │        │ ████████  ██████████████████ │    │
│   │              │        │ ████████████████████████████ │    │
│   └──────────────┘        │ ████████  ██████████████████ │    │
│                           └──────────────────────────────┘    │
│   用户无法预判内容          用户能提前感知内容布局              │
│                                                                │
└────────────────────────────────────────────────────────────────┘
```

### 1.2 优势

| 特性 | 说明 |
|------|------|
| **减少感知延迟** | 用户看到结构，心理等待时间更短 |
| **避免布局抖动** | 预先占据空间，加载完成后平滑过渡 |
| **提升专业感** | 符合大厂应用的交互规范 |

### 1.3 文件结构

```
project/
├── components/
│   └── skeleton/
│       ├── index.js          # 组件逻辑
│       ├── index.json        # 组件配置
│       ├── index.wxml        # 组件模板
│       └── index.wxss        # 组件样式（宿主样式）
└── style/
    └── skeleton.wxss         # 全局骨架屏样式（动画+布局）
```

### 1.4 样式架构

骨架屏组件采用**双层样式架构**：

| 文件 | 作用 | 样式隔离 |
|------|------|----------|
| `components/skeleton/index.wxss` | 组件宿主基础样式 | 组件内部 |
| `style/skeleton.wxss` | 全局动画、布局样式 | 全局共享 |

#### 关键配置

```js
// components/skeleton/index.js
Component({
  options: {
    multipleSlots: true,
    virtualHost: true,        // 启用虚拟节点，解决 flex/grid gap 问题
    styleIsolation: 'apply-shared'
  }
})
```

**virtualHost: true 的作用：**
> 组件不生成额外的 DOM 节点，完全解决组件在 `loading=false` 时仍占用 flex/grid gap 空间的问题。

---

## 二、快速开始

### 2.1 全局注册组件

在 `app.json` 中注册：

```json
{
  "usingComponents": {
    "skeleton": "/components/skeleton/index"
  }
}
```

### 2.2 引入样式

在 `app.wxss` 中引入：

```css
@import "style/skeleton.wxss";
```

### 2.3 在页面中使用

```xml
<!-- 骨架屏 -->
<skeleton type="list" loading="{{loading}}" rows="5" avatar />

<!-- 正常内容（loading 为 false 时显示） -->
<view wx:if="{{!loading}}">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</view>
```

---

## 三、组件属性

| 属性 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `loading` | Boolean | `true` | 是否显示骨架屏 |
| `type` | String | `'list'` | 骨架屏类型：`list` / `card` / `detail` / `sentence` / `user` |
| `rows` | Number | `5` | 行数（1-10，推荐 3-8） |
| `avatar` | Boolean | `false` | 是否显示头像（list 类型有效） |
| `avatarShape` | String | `'square'` | 头像形状：`circle` / `square` |
| `showActions` | Boolean | `true` | 是否显示操作按钮（sentence 类型有效） |
| `title` | String | `''` | 可选标题文本 |
| `animate` | Boolean | `true` | 是否开启闪光动画 |
| `customClass` | String | `''` | 自定义类名 |

**外部样式类：**

| 类名 | 说明 |
|------|------|
| `custom-class` | 根节点外部样式类，用于页面级样式覆盖 |

---

## 四、预设类型

### 4.1 列表类型（type="list"）

适用场景：通知列表、专辑列表、套题列表

```xml
<!-- 基础列表 -->
<skeleton type="list" loading="{{loading}}" rows="5" />

<!-- 带头像的列表 -->
<skeleton type="list" loading="{{loading}}" rows="5" avatar />

<!-- 带圆形头像的列表 -->
<skeleton type="list" loading="{{loading}}" rows="5" avatar avatarShape="circle" />
```

效果预览：
```
┌─────────────────────────────────┐
│ [■■■] ████████████████  [tag]  │
├─────────────────────────────────┤
│ [■■■] ████████████████  [tag]  │
├─────────────────────────────────┤
│ [■■■] ████████████████  [tag]  │
└─────────────────────────────────┘
```

### 4.2 卡片类型（type="card"）

适用场景：首页卡片、课程卡片（双列网格布局）

```xml
<skeleton type="card" loading="{{loading}}" rows="4" />
```

效果预览：
```
┌──────────┐  ┌──────────┐
│  ████    │  │  ████    │
│ ████████ │  │ ████████ │
│  [tag]   │  │  [tag]   │
└──────────┘  └──────────┘
┌──────────┐  ┌──────────┐
│  ████    │  │  ████    │
│ ████████ │  │ ████████ │
│  [tag]   │  │  [tag]   │
└──────────┘  └──────────┘
```

### 4.3 详情类型（type="detail"）

适用场景：文章详情、通知详情（分段式布局）

```xml
<skeleton type="detail" loading="{{loading}}" rows="3" />
```

效果预览：
```
┌─────────────────────────────────┐
│ ████ 标题区                     │
├─────────────────────────────────┤
│ ████████████████████████████    │
│ ██████████████████              │
│ ████████████████████████        │
└─────────────────────────────────┘
```

### 4.4 句子类型（type="sentence"）

适用场景：句子列表、单词列表、结果列表（带操作按钮）

```xml
<skeleton type="sentence" loading="{{loading}}" rows="5" showActions />
```

效果预览：
```
┌─────────────────────────────────┐
│ 1/10               [label]      │
│ ████████████████████████████    │
│ ████████████████                │
│ ██████████          [▶] [→]    │
├─────────────────────────────────┤
│ 2/10               [label]      │
│ ████████████████████████████    │
│ ██████████          [▶] [→]    │
└─────────────────────────────────┘
```

### 4.5 用户信息类型（type="user"）

适用场景：用户中心、个人主页

```xml
<skeleton type="user" loading="{{loading}}" rows="4" />
```

效果预览：
```
┌─────────────────────────────────┐
│   ┌─────┐                       │
│   │ ●●● │  ████████             │
│   │ ●●● │  ████                 │
│   └─────┘                       │
├─────────────────────────────────┤
│ ████████████████████████████    │
├─────────────────────────────────┤
│ ████████████████████████████    │
└─────────────────────────────────┘
```

---

## 五、与加载系统配合

骨架屏可以与现有的 `pageLoading` 配合使用：

```js
// pages/list/index.js
const pageGuard = require('../../behaviors/pageGuard')
const pageLoading = require('../../behaviors/pageLoading')
const loadError = require('../../behaviors/loadError')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],
  data: {
    list: []
  },

  onShow() {
    this.startLoading()  // 显示进度条
    this.listData()
  },

  listData() {
    this.hideLoadError()
    api.request(this, '/api/list', {}, true).then(res => {
      this.setData({ list: res })
      this.setDataReady()
      this.finishLoading()  // 隐藏进度条，同时 loading 变为 false
    }).catch(() => {
      pageGuard.showRetry(this)
    })
  },

  retryLoad() {
    this.startLoading()
    this.listData()
  }
})
```

```xml
<!-- pages/list/index.wxml -->
<import src="/templates/page-loading.wxml" />
<import src="/templates/load-error.wxml" />

<!-- 进度条 -->
<template is="pageLoading" data="{{loading, loadProgress}}" />

<!-- 错误重试 -->
<template is="loadError" data="{{loadError}}" />

<!-- 骨架屏（loading 为 true 时显示） -->
<skeleton type="list" loading="{{loading}}" rows="5" avatar wx:if="{{!loadError}}" />

<!-- 正常内容（loading 为 false 时显示） -->
<view class="list" wx:if="{{!loading && !loadError}}">
  <view wx:for="{{list}}" wx:key="id">{{item.name}}</view>
</view>
```

### 加载体验流程

```
用户进入页面
    │
    ▼
┌─────────────────────────────────────┐
│  1. 进度条 + 骨架屏 同时显示         │
│     ████████░░░░░░░░  (进度条)       │
│     ████████████████  (骨架)         │
│     ██████████████████████████████  │
└─────────────────────────────────────┘
    │
    │ 数据加载完成
    ▼
┌─────────────────────────────────────┐
│  2. 进度条完成 + 骨架屏消失          │
│     显示真实内容                     │
└─────────────────────────────────────┘
```

---

## 六、自定义样式

### 6.1 CSS 变量

骨架屏支持以下 CSS 变量：

```css
page {
  /* 基础样式变量 */
  --skeleton-bg: #f0f0f0;              /* 骨架块背景色 */
  --skeleton-highlight: #e8e8e8;        /* 动画高亮色 */
  --skeleton-radius: 4px;              /* 圆角大小 */

  /* 容器样式变量 */
  --skeleton-card-bg: #fff;             /* 卡片/容器背景色 */
  --skeleton-border-color: #eee;        /* 边框颜色 */
  --skeleton-item-gap: 8px;             /* 列表项间距 */
}
```

### 6.2 暗色主题示例

```css
/* 暗色主题 */
page.dark {
  --skeleton-bg: #2c2c2c;
  --skeleton-highlight: #3c3c3c;
  --skeleton-card-bg: #1a1a1a;
  --skeleton-border-color: #333;
}
```

### 6.3 关闭动画

如需关闭闪光动画（提升性能）：

```xml
<skeleton type="list" loading="{{loading}}" animate="{{false}}" />
```

### 6.4 使用外部样式类

```xml
<skeleton
  type="list"
  loading="{{loading}}"
  custom-class="my-skeleton"
/>
```

```css
/* 页面样式 */
.my-skeleton {
  padding: 20rpx;
}
```

---

## 七、完整源码

### 7.1 components/skeleton/index.js

```js
Component({
  options: {
    multipleSlots: true,
    virtualHost: true
  },

  externalClasses: ['custom-class'],

  properties: {
    loading: { type: Boolean, value: true },
    type: { type: String, value: 'list' },
    rows: { type: Number, value: 5 },
    animate: { type: Boolean, value: true },
    avatar: { type: Boolean, value: false },
    avatarShape: { type: String, value: 'square' },
    showActions: { type: Boolean, value: true },
    title: { type: String, value: '' },
    customClass: { type: String, value: '' }
  },

  data: {
    rowsArray: []
  },

  lifetimes: {
    attached() {
      this.updateRowsArray();
    }
  },

  observers: {
    'rows': function() {
      this.updateRowsArray();
    }
  },

  methods: {
    updateRowsArray() {
      const rows = Math.min(Math.max(this.data.rows, 1), 10);
      const arr = [];
      for (let i = 0; i < rows; i++) {
        arr.push(i);
      }
      this.setData({ rowsArray: arr });
    }
  }
});
```

### 7.2 components/skeleton/index.json

```json
{
  "component": true,
  "styleIsolation": "apply-shared"
}
```

### 7.3 style/skeleton.wxss

详见项目中的 `style/skeleton.wxss` 文件，包含：
- 闪光动画 `skeleton-shimmer`
- 5 种骨架类型布局样式
- 6 个 CSS 变量支持

---

## 八、迁移到其他项目

### 8.1 复制文件

```
components/
└── skeleton/
    ├── index.js
    ├── index.json
    ├── index.wxml
    └── index.wxss

style/
└── skeleton.wxss
```

### 8.2 注册组件

```json
// app.json
{
  "usingComponents": {
    "skeleton": "/components/skeleton/index"
  }
}
```

### 8.3 引入样式

```css
/* app.wxss */
@import "style/skeleton.wxss";
```

### 8.4 使用组件

```xml
<skeleton type="list" loading="{{loading}}" rows="5" />
```

---

## 九、最佳实践

### 9.1 骨架屏行数建议

| 页面类型 | 建议行数 | 说明 |
|----------|:--------:|------|
| 短列表 | 3-5 | 一屏可见的列表 |
| 长列表 | 5-8 | 超出一屏的列表 |
| 详情页 | 2-3 | 使用 detail 类型 |
| 用户中心 | 3-4 | 使用 user 类型 |

### 9.2 性能优化

- 大列表（rows > 8）建议禁用动画：`animate="{{false}}"`
- 加载时间短于 200ms 时可不显示骨架屏
- 骨架屏行数不宜过多，一般 5-8 行足够

### 9.3 与错误状态配合

```xml
<!-- 加载失败时不显示骨架屏 -->
<skeleton loading="{{loading}}" wx:if="{{!loadError}}" />

<!-- 错误重试 -->
<template is="loadError" data="{{loadError}}" />

<!-- 正常内容 -->
<view wx:if="{{!loading && !loadError}}">...</view>
```

---

## 十、已接入页面

本项目已为以下页面接入骨架屏组件：

### 10.1 列表类页面（list 类型）

| 页面路径 | 说明 | 配置 |
|----------|------|------|
| `pages/notice/list/index` | 通知列表 | `rows="5"` |
| `pages/training/list/album/index` | 专辑列表 | `rows="5" avatar` |
| `pages/training/list/set/index` | 套题列表 | `rows="5" avatar` |
| `pages/training/listening/report-card/index` | 答题报告 | `rows="5"` |
| `pages/setting/module/index` | 模块设置 | `rows="3"` |

### 10.2 卡片类页面（card 类型）

| 页面路径 | 说明 | 配置 |
|----------|------|------|
| `pages/home/index` | 首页 | `rows="4"` |

### 10.3 详情类页面（detail 类型）

| 页面路径 | 说明 | 配置 |
|----------|------|------|
| `pages/notice/detail/index` | 通知详情 | `rows="3"` |
| `pages/training/listening/article/index` | 文章内容 | `rows="3"` |
| `pages/training/listening/explanation/index` | 题目解析 | `rows="3"` |

### 10.4 句子类页面（sentence 类型）

| 页面路径 | 说明 | 配置 |
|----------|------|------|
| `pages/training/listening/sentence/index` | 句子列表 | `rows="5" showActions` |

### 10.5 用户信息页面（user 类型）

| 页面路径 | 说明 | 配置 |
|----------|------|------|
| `pages/user/user/user` | 用户中心 | `rows="4"` |

### 10.6 未接入页面说明

以下页面因特殊原因未接入骨架屏：

| 页面路径 | 原因 |
|----------|------|
| `pages/training/setting/*` | 页面结构简单，仅一个组件 |
| `pages/training/listening/extensive/index` | 音频播放页，已有 audioLoading |
| `pages/training/listening/intensive/index` | 精听页面，已有 audioLoading |
| `pages/training/listening/answer-input/index` | 答题输入页，交互为主 |
| `pages/user/login/login` | 登录页，单独设计 |

---

**文档版本：** v2.2.0
**最后更新：** 2025-12-16
**维护者：** 开发团队
