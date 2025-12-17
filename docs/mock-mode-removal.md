# Mock 模式移除说明文档

## 概述

本文档记录了 Mock 模式从雅思听力训练小程序中移除的相关信息，包括移除原因、Training 与 Mock 的差异分析、移除内容以及后续建议。

**移除时间：** 2025-11-30
**提交记录：** f78174f - refactor: 移除 Mock 模式相关代码
**代码减少：** 317 行（删除 318 行，新增 1 行）

---

## 移除原因

1. **功能不完整**
   - Mock 模式仅实现了列表展示功能
   - 核心学习功能（泛听、精听、答题、分析）完全缺失
   - 存在已知 bug（精听功能跳转错误）

2. **用户体验混淆**
   - 两种模式并存，用户难以理解差异
   - Mock 模式无法提供实际学习价值

3. **维护成本**
   - 需要维护两套独立的页面结构
   - Mock 模式代码质量较低，存在未实现的功能

4. **产品策略调整**
   - 专注于功能完整的 Training 学习模式
   - 提供统一且高质量的学习体验

---

## Training 与 Mock 模式主要差异

### 1. 功能完整度对比

| 功能模块 | Training 模式 | Mock 模式 |
|---------|--------------|----------|
| 专辑/题集列表 | ✅ 完整 | ✅ 仅列表 |
| 泛听模式 | ✅ 200行代码 | ❌ 无 |
| 精听模式 | ✅ 404行代码 | ❌ 有bug，未实现 |
| 答题练习 | ✅ 完整 | ❌ 无 |
| 成绩报告 | ✅ 完整 | ❌ 无 |
| 题目解析 | ✅ 完整 | ❌ 无 |
| 个性化设置 | ✅ 2个设置页 | ❌ 无 |
| 学习数据跟踪 | ✅ 详细 | ⚠️ 仅基础进度 |

### 2. 页面数量对比

- **Training 模式：** 13 个页面（完整学习闭环）
- **Mock 模式：** 2 个页面（仅列表展示）

### 3. 学习流程对比

**Training 完整流程：**
```
专辑 → 题集 → [泛听/精听选择]
              ↓
         泛听模式 → 答题 → 成绩 → 解析
              ↓
         精听模式 → 逐句听写 → 标记不懂句子
```

**Mock 简化流程：**
```
专辑 → 题集 → [选择后无功能]
```

### 4. 数据展示差异

**Training 标签系统：**
- 正确率标签（未作/已作，高于平均/低于平均）
- 精听状态标签（未精听/需精听/已精听/无需精听）
- 不懂句子数量标签
- 可自定义标签显隐

**Mock 标签系统：**
- 视频进度（未完成/进行中/已完成）
- 文档进度（未完成/进行中/已完成）
- 练习进度（未完成/进行中/已完成）
- 无设置功能

### 5. 核心能力差异

| 能力 | Training | Mock |
|-----|---------|------|
| 定位 | 完整学习系统 | 内容浏览入口 |
| 核心指标 | 正确率、精听状态、不懂句子数 | 完成进度 |
| 学习方式 | 泛听+精听双模式 | 无 |
| 反馈机制 | 成绩报告+解析+句子标注 | 无 |
| 倍速播放 | 5档（0.8x-2.0x） | 无 |
| 学习记录 | 自动保存（50%播放自动记录） | 无 |

---

## 已移除的内容

### 删除的文件（8个）

```
pages/mocks/
├── list/
│   ├── album/
│   │   ├── index.js       (52行)
│   │   ├── index.wxml
│   │   ├── index.wxss
│   │   └── index.json
│   └── set/
│       ├── index.js       (116行，含bug）
│       ├── index.wxml
│       ├── index.wxss
│       └── index.json
```

### 修改的文件（2个）

**1. app.json**
```diff
- "pages/mocks/list/album/index",
- "pages/mocks/list/set/index",
```

**2. pages/home/index.js**
```diff
data: {
  url: {
    "TRAINING": "/pages/training/list/album/index",
-   "MOCK_EXAM": "/pages/mocks/list/album/index"
  }
}
```

### 移除的已知 Bug

**Bug 位置：** `pages/mocks/list/set/index.js:37`

```javascript
// 错误代码（已移除）
wx.showActionSheet({
  itemList: ['泛听/做题模式', '精听模式'],
  success(res) {
    if (res.tapIndex == 0) {  // 泛听
      wx.navigateTo({
        url: `/pages/training/listening/extensive/index?sid=${item.id}`,
      })
    }
    if (res.tapIndex == 0) {  // ❌ Bug: 应该是 tapIndex == 1
      // 精听模式未实现
    }
  }
})
```

---

## 移除影响分析

### ✅ 无影响项

1. **Training 模式功能**
   - Mock 是完全独立的模块
   - 删除后不影响 Training 的任何功能

2. **共享资源**
   - `behaviors/loadingProgress` 仍被 Training 使用
   - `getApp().api` 全局 API 对象不受影响

3. **用户数据**
   - Training 模式的学习记录完全保留
   - Mock 模式实际使用数据较少

### ⚠️ 需要注意项

1. **后端 API 调整**（重要）
   - `/v2/home/list` API 需停止返回 `dataType="MOCK_EXAM"` 的科目
   - `/v2/mocks/album/list` API 已不再被前端调用，可标记为废弃

2. **用户入口**
   - 如后端仍返回 Mock 科目，用户点击会跳转失败
   - 建议后端过滤，或前端添加兜底过滤逻辑

---

## 后续建议

### 1. 后端必须调整（高优先级）

**修改 `/v2/home/list` API：**
- 不再返回 `dataType="MOCK_EXAM"` 的科目数据
- 确保首页只显示 Training 科目

**废弃 Mock 相关 API：**
- `/v2/mocks/album/list` - 可标记为 deprecated 或删除
- 相关的 Mock 数据接口可一并清理

### 2. 前端兜底方案（可选）

如果后端暂时无法调整，可在 `pages/home/index.js` 添加前端过滤：

```javascript
listData() {
  api.request(this, '/v2/home/list', {}, true, true).then((res) => {
    // 过滤掉 MOCK_EXAM 类型的科目
    if (res.list) {
      res.list.forEach(group => {
        if (group.list) {
          group.list = group.list.filter(item => item.dataType !== 'MOCK_EXAM')
        }
      })
      this.setData(res)
    }
    this.finishLoading()
  }).catch(() => {
    this.finishLoading()
  })
}
```

### 3. 测试验证清单

- [ ] 小程序编译无错误
- [ ] 首页加载正常，无 Mock 科目卡片显示
- [ ] 点击 Training 科目正常跳转到专辑列表
- [ ] Training 模式所有功能正常（泛听、精听、答题等）
- [ ] 路由跳转无异常
- [ ] 无控制台报错

### 4. 用户通知（可选）

如有必要，可在版本更新说明中告知用户：
- Mock 模式已移除
- 统一使用功能更完整的 Training 学习模式
- Training 模式提供更好的学习体验

---

## 移除收益

### 代码质量提升

- ✅ 减少 317 行代码
- ✅ 消除已知 bug（精听功能错误）
- ✅ 降低代码维护复杂度
- ✅ 统一代码风格和质量

### 用户体验改善

- ✅ 简化学习模式，减少用户困惑
- ✅ 专注于功能完整的 Training 模式
- ✅ 提供统一的高质量学习体验
- ✅ 避免用户进入功能不完整的页面

### 产品策略优化

- ✅ 聚焦核心学习功能
- ✅ 提升整体产品质量
- ✅ 为后续功能迭代腾出空间
- ✅ 降低团队维护成本

---

## API 参考

### 已废弃的 Mock API

| API 路径 | 原用途 | 状态 |
|---------|-------|------|
| `/v2/mocks/album/list` | 获取 Mock 专辑列表 | ❌ 已废弃 |

### 继续使用的 Training API

| API 路径 | 用途 | 状态 |
|---------|------|------|
| `/v2/home/list` | 获取首页科目列表 | ✅ 需调整（不返回 Mock） |
| `/v2/training/album/list` | 获取 Training 专辑列表 | ✅ 正常使用 |
| `/v2/training/set/list` | 获取 Training 题集列表 | ✅ 正常使用 |
| `/v2/training/save/extensive` | 保存泛听学习记录 | ✅ 正常使用 |
| `/v2/training/list/setting` | 获取 Training 设置 | ✅ 正常使用 |
| `/v2/training/setting/special` | 更新专项标签设置 | ✅ 正常使用 |
| `/v2/training/setting/completion` | 更新完成率统计方式 | ✅ 正常使用 |

---

## 相关文档

- 首页结构文档：[home-page-structure.md](./home-page-structure.md)
- 按钮组样式指南：[button-group-style-guide.md](./button-group-style-guide.md)

---

## 版本历史

| 版本 | 日期 | 说明 |
|-----|------|------|
| 1.0 | 2025-11-30 | 初始版本，记录 Mock 模式移除 |

---

## 联系方式

如有疑问或需要进一步说明，请联系开发团队。
