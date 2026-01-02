/**
 * 数据差异对比工具
 *
 * 功能：
 * 1. 深度比较两个值是否相等
 * 2. 生成最小化的 setData 更新路径
 * 3. 仅更新变化字段，避免页面闪烁
 *
 * 使用方式：
 * const { diffSetData } = require('../../utils/diff')
 *
 * // 在数据加载完成后
 * diffSetData(this, newData, () => {
 *   this.finishLoading()
 * })
 */

/**
 * 深度比较两个值是否相等
 * @param {*} a - 第一个值
 * @param {*} b - 第二个值
 * @returns {boolean}
 */
function isEqual(a, b) {
  // 同一引用或基本类型相等
  if (a === b) return true

  // 处理 null 和 undefined
  if (a == null || b == null) return a === b

  // 类型不同
  if (typeof a !== typeof b) return false

  // 数组比较
  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    for (let i = 0; i < a.length; i++) {
      if (!isEqual(a[i], b[i])) return false
    }
    return true
  }

  // 对象比较
  if (typeof a === 'object') {
    const keysA = Object.keys(a)
    const keysB = Object.keys(b)

    if (keysA.length !== keysB.length) return false

    for (const key of keysA) {
      if (!keysB.includes(key)) return false
      if (!isEqual(a[key], b[key])) return false
    }
    return true
  }

  return false
}

/**
 * 比较新旧数据，生成最小化更新路径
 * @param {Object} oldData - 旧数据
 * @param {Object} newData - 新数据
 * @param {string} prefix - 路径前缀
 * @param {Object} updates - 更新对象（累积）
 * @returns {Object} 更新对象 { 'list[0].tag': 'new', 'title': 'xxx' }
 */
function diff(oldData, newData, prefix = '', updates = {}) {
  // 新数据不存在，不做删除处理
  if (newData === undefined) return updates

  // 旧数据不存在，直接设置新值
  if (oldData === undefined) {
    updates[prefix] = newData
    return updates
  }

  // 类型不同，直接替换
  if (typeof oldData !== typeof newData) {
    updates[prefix] = newData
    return updates
  }

  // 基本类型比较
  if (typeof newData !== 'object' || newData === null) {
    if (oldData !== newData) {
      updates[prefix] = newData
    }
    return updates
  }

  // 数组处理
  if (Array.isArray(newData)) {
    if (!Array.isArray(oldData)) {
      // 旧数据不是数组，直接替换
      updates[prefix] = newData
      return updates
    }

    // 长度不同，直接替换整个数组
    if (oldData.length !== newData.length) {
      updates[prefix] = newData
      return updates
    }

    // 长度相同，逐项对比
    for (let i = 0; i < newData.length; i++) {
      const itemPath = prefix ? `${prefix}[${i}]` : `[${i}]`
      diff(oldData[i], newData[i], itemPath, updates)
    }
    return updates
  }

  // 对象处理
  const oldKeys = Object.keys(oldData)
  const newKeys = Object.keys(newData)

  // 检查是否有新增或删除的键
  const hasKeyChanges = newKeys.length !== oldKeys.length ||
    newKeys.some(key => !oldKeys.includes(key))

  if (hasKeyChanges) {
    // 键发生变化，直接替换整个对象
    updates[prefix] = newData
    return updates
  }

  // 递归比较每个属性
  for (const key of newKeys) {
    const propPath = prefix ? `${prefix}.${key}` : key
    diff(oldData[key], newData[key], propPath, updates)
  }

  return updates
}

/**
 * 差异化 setData
 * @param {Object} page - 页面实例
 * @param {Object} newData - 新数据
 * @param {Function} callback - 更新完成回调
 * @returns {boolean} 是否有数据更新
 */
function diffSetData(page, newData, callback) {
  const updates = {}

  for (const key of Object.keys(newData)) {
    diff(page.data[key], newData[key], key, updates)
  }

  const hasUpdates = Object.keys(updates).length > 0

  if (hasUpdates) {
    page.setData(updates, callback)
  } else if (callback) {
    callback()
  }

  return hasUpdates
}

/**
 * 合并数据并进行差异更新
 * 适用于 API 返回的数据需要合并到现有 data 的场景
 * @param {Object} page - 页面实例
 * @param {Object} apiData - API 返回的数据
 * @param {Function} callback - 更新完成回调
 * @returns {boolean} 是否有数据更新
 */
function mergeAndDiff(page, apiData, callback) {
  return diffSetData(page, apiData, callback)
}

module.exports = {
  isEqual,
  diff,
  diffSetData,
  mergeAndDiff
}
