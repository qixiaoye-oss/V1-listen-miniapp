# toggle-control-group 组件

## 简介

`toggle-control-group` 是一个可复用的开关控制分组组件，用于展示和控制多个开关设置项。组件采用数据驱动的方式，支持分组显示、自定义图标和背景色，适用于各种设置页面场景。

## 功能特性

- ✅ 数据驱动配置，无需修改组件代码
- ✅ 支持多分组展示
- ✅ 支持自定义标题、图标和背景色
- ✅ 支持提示文本（tip）
- ✅ 开关状态可视化（打开/关闭标签）
- ✅ 样式完全独立，无外部依赖
- ✅ 可跨项目复用

## 使用方法

### 1. 引入组件

在页面的 `index.json` 中引入组件：

```json
{
  "usingComponents": {
    "toggle-control-group": "/components/toggle-control-group/index"
  }
}
```

### 2. 在 WXML 中使用

```xml
<toggle-control-group groups="{{groups}}" bind:change="onToggleChange" />
```

### 3. 在 JS 中配置数据

```javascript
Page({
  data: {
    groups: [
      {
        title: '专项标签',
        icon: '/images/v2/doc.png',
        bgColor: 'rgba(99,89,148, 0.15)',
        items: [
          { key: 'accuracy', label: '正确率', value: 'close' },
          { key: 'answer', label: '答题', value: 'close' },
          {
            key: 'intensive',
            label: '精听',
            tip: '做题错误率超过50%提示需要精听',
            value: 'open'
          }
        ]
      },
      {
        title: '其他设置',
        icon: '/images/v2/flag_bt.png',
        bgColor: 'rgba(248, 49, 47, 0.15)',
        items: [
          { key: 'review', label: '复习', value: 'open' }
        ]
      }
    ]
  },

  onToggleChange(e) {
    const { key, value, checked } = e.detail
    console.log(`开关 ${key} 变为 ${value}`)
    // 调用 API 更新设置
  }
})
```

### 4. 页面样式配置

在页面的 `index.wxss` 中添加：

```css
page {
  display: flex;
  flex-direction: column;
  gap: 15px;
}
```

## API 文档

### 组件属性 (Properties)

| 属性名 | 类型 | 默认值 | 必填 | 说明 |
|--------|------|--------|------|------|
| groups | Array | [] | 是 | 分组配置数据 |
| switchColor | String | 'rgba(0, 210, 106, 1)' | 否 | 开关颜色 |

### groups 数据结构

```typescript
interface Group {
  title?: string;           // 分组标题（可选）
  icon?: string;            // 图标路径（可选）
  bgColor?: string;         // 标题背景色（可选）
  items: Item[];            // 开关项列表
}

interface Item {
  key: string;              // 唯一标识（必填）
  label: string;            // 显示文字（必填）
  value: string | boolean;  // 值：'open'/'close' 或 true/false
  tip?: string;             // 提示文本（可选）
}
```

### 事件 (Events)

#### change

开关状态变化时触发

**事件对象 (e.detail)：**

```javascript
{
  key: string,        // 开关的唯一标识
  value: string,      // 'open' 或 'close'
  checked: boolean,   // true 或 false
  groupIndex: number, // 分组索引
  itemIndex: number   // 项目索引
}
```

## 样式说明

### 核心样式尺寸

| 元素 | 样式规格 |
|------|----------|
| 组间距 | 15px |
| 边框颜色 | rgba(0, 0, 0, 0.3) |
| 边框圆角 | 9px |
| 图标尺寸 | 20px × 20px |
| 标题文字 | 14px, line-height: 1.4 |
| 项目文字 | 14px, line-height: 1.4 |
| 标签文字 | 12px |
| 提示文字 | 12px, 颜色: rgba(0, 0, 0, 0.3) |
| 内边距 | 15px |

### 颜色定义

| 元素 | 颜色值 |
|------|--------|
| 边框/分割线 | rgba(0, 0, 0, 0.3) |
| 打开标签背景 | rgba(0, 210, 106, 1) |
| 关闭标签背景 | rgba(0, 0, 0, 0.15) |
| 关闭标签文字 | rgba(0, 0, 0, 0.3) |

## 完整示例

### 示例 1：基础用法

```javascript
// index.js
Page({
  data: {
    groups: [
      {
        title: '通知设置',
        icon: '/images/bell.png',
        bgColor: 'rgba(52, 120, 246, 0.15)',
        items: [
          { key: 'message', label: '消息通知', value: 'open' },
          { key: 'sound', label: '声音提醒', value: 'close' }
        ]
      }
    ]
  },

  onToggleChange(e) {
    console.log('开关变化：', e.detail)
  }
})
```

```xml
<!-- index.wxml -->
<toggle-control-group groups="{{groups}}" bind:change="onToggleChange" />
```

### 示例 2：无标题分组

```javascript
data: {
  groups: [
    {
      // 不设置 title、icon、bgColor
      items: [
        { key: 'option1', label: '选项1', value: true },
        { key: 'option2', label: '选项2', value: false }
      ]
    }
  ]
}
```

### 示例 3：带提示文本

```javascript
data: {
  groups: [
    {
      title: '高级设置',
      items: [
        {
          key: 'auto',
          label: '自动同步',
          tip: '开启后将在 WiFi 环境下自动同步数据',
          value: 'open'
        }
      ]
    }
  ]
}
```

## 互斥开关示例

如果需要实现互斥开关（单选）逻辑，参考以下代码：

```javascript
Page({
  data: {
    mode: 'all',
    groups: [
      {
        title: '完成率统计',
        items: [
          { key: 'alone', label: '单独统计', value: false },
          { key: 'all', label: '综合统计', value: true }
        ]
      }
    ]
  },

  onToggleChange(e) {
    const { key, checked } = e.detail
    const newMode = checked ? key : (key === 'alone' ? 'all' : 'alone')

    // 更新互斥状态
    const groups = this.data.groups.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        value: item.key === newMode
      }))
    }))

    this.setData({ mode: newMode, groups })
  }
})
```

## 跨项目使用

本组件样式完全独立，可直接复制到其他项目使用，无需额外配置。

**复制以下文件：**
```
components/toggle-control-group/
├── index.js
├── index.json
├── index.wxml
├── index.wxss
└── README.md
```

## 版本历史

查看 [CHANGELOG.md](./CHANGELOG.md) 了解版本更新记录。

## 许可

MIT License
