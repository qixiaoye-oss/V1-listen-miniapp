# Progress Bar 进度条组件

## 概述

`progress-bar` 是一个可复用的进度条组件，用于显示任务进度。组件包含进度轨道、进度填充和进度文字三部分。

## 组件位置

```
components/progress-bar/
├── progress-bar.js      # 组件逻辑
├── progress-bar.json    # 组件配置
├── progress-bar.wxml    # 组件模板
└── progress-bar.wxss    # 组件样式
```

## 使用方式

### 1. 注册组件

在页面的 `index.json` 中注册组件：

```json
{
  "usingComponents": {
    "progress-bar": "/components/progress-bar/progress-bar"
  }
}
```

### 2. 使用组件

在页面的 `index.wxml` 中使用：

```html
<progress-bar current="{{currentIndex + 1}}" total="{{list.length}}" />
```

## 组件属性

| 属性 | 类型 | 默认值 | 必填 | 说明 |
|------|------|--------|------|------|
| current | Number | 1 | 否 | 当前进度（从 1 开始） |
| total | Number | 1 | 否 | 总数 |

## 样式说明

### CSS 变量

组件使用以下 CSS 变量，可通过全局样式定制：

| 变量名 | 默认值 | 说明 |
|--------|--------|------|
| `--theme-color` | `rgba(0, 166, 237, 1)` | 进度填充颜色、进度文字颜色 |
| `--solid-border-color` | `rgba(0, 0, 0, 0.3)` | 进度轨道背景色 |

### 样式结构

```
.progress-cell                 # 组件容器
├── .progress-track           # 进度轨道（灰色背景）
│   └── .progress-fill        # 进度填充（蓝色）
└── .progress-text            # 进度文字（如 "1/10"）
```

### 默认样式

```css
/* 进度条组件样式 */
.progress-cell {
  position: relative;
  width: 100%;
  box-sizing: border-box;
}

/* 进度轨道（底色灰色） */
.progress-track {
  position: relative;
  width: 100%;
  height: 4px;
  background: var(--solid-border-color, rgba(0, 0, 0, 0.3));
  border-radius: 2px;
}

/* 进度填充（蓝色） */
.progress-fill {
  position: absolute;
  top: 0;
  left: 0;
  height: 4px;
  background-color: var(--theme-color, rgba(0, 166, 237, 1));
  border-radius: 2px;
}

/* 进度文字 */
.progress-text {
  margin-top: 5px;
  font-size: 12px;
  color: var(--theme-color, rgba(0, 166, 237, 1));
}
```

## 进度计算逻辑

- 百分比计算：`percent = (current / total) * 100`
- 边界保护：`current` 和 `total` 至少为 1，避免除零错误
- 文字定位：进度文字跟随进度位置，并有边界限制（最左/最右时与容器边缘保持距离）

## 复用到其他项目

### 步骤 1：复制组件文件

将 `components/progress-bar/` 整个目录复制到目标项目的 `components/` 目录下。

### 步骤 2：配置全局 CSS 变量

在目标项目的 `app.wxss` 中定义 CSS 变量：

```css
page {
  /* 主题色 - 进度填充和文字颜色 */
  --theme-color: rgba(0, 166, 237, 1);

  /* 边框色 - 进度轨道背景色 */
  --solid-border-color: rgba(0, 0, 0, 0.3);
}
```

### 步骤 3：注册并使用

参考上方"使用方式"章节。

## 注意事项

1. **样式隔离**：组件配置了 `"styleIsolation": "apply-shared"`，可以接收页面级的 CSS 变量
2. **数据验证**：组件内部会确保 `current` 和 `total` 至少为 1，避免显示异常
3. **响应式更新**：使用 `observers` 监听属性变化，自动更新进度显示

## 使用示例

### 基础用法

```html
<progress-bar current="{{1}}" total="{{10}}" />
<!-- 显示 10% 进度，文字 "1/10" -->
```

### 动态进度

```html
<progress-bar current="{{currentStep + 1}}" total="{{totalSteps}}" />
```

### 配合列表使用

```html
<progress-bar current="{{swiperCurrent + 1}}" total="{{list.length}}" />
```

## 相关文件

- 组件源码：`components/progress-bar/`
- 使用示例：`pages/training/listening/intensive/index.wxml`
