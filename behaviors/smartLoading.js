/**
 * 智能加载控制 Behavior
 *
 * 功能：
 * 1. 区分首次加载、静默刷新、后台返回三种场景
 * 2. 首次加载显示骨架屏，后续静默刷新
 * 3. 子页面返回时支持静默刷新
 * 4. 缓存过期机制
 *
 * 使用方式：
 * const smartLoading = require('../../behaviors/smartLoading')
 *
 * Page({
 *   behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
 *
 *   onShow() {
 *     const loadType = this.shouldLoad()
 *     if (loadType === 'full') {
 *       this.startLoading()
 *       this.listData()
 *     } else if (loadType === 'silent') {
 *       this.listData(true) // 静默刷新
 *     }
 *     // loadType === 'none' 时不刷新
 *   }
 * })
 */

module.exports = Behavior({
  data: {
    // 是否已完成首次加载
    _hasLoaded: false,
    // 是否需要刷新（由子页面标记）
    _needRefresh: false,
    // 上次加载时间戳
    _lastLoadTime: 0
  },

  methods: {
    /**
     * 判断是否需要加载数据
     * @param {Object} options - 配置项
     * @param {number} options.cacheTime - 缓存有效期（毫秒），默认 5 分钟
     * @param {boolean} options.forceRefresh - 是否强制刷新
     * @returns {'full' | 'silent' | 'none'} 加载类型
     *   - full: 首次加载，需要显示骨架屏
     *   - silent: 静默刷新，不显示加载状态
     *   - none: 无需加载
     */
    shouldLoad(options = {}) {
      const { cacheTime = 5 * 60 * 1000, forceRefresh = false } = options
      const now = Date.now()

      // 强制刷新
      if (forceRefresh) {
        return this.data._hasLoaded ? 'silent' : 'full'
      }

      // 首次加载
      if (!this.data._hasLoaded) {
        return 'full'
      }

      // 子页面标记需要刷新
      if (this.data._needRefresh) {
        this.setData({ _needRefresh: false })
        return 'silent'
      }

      // 缓存过期
      if (now - this.data._lastLoadTime > cacheTime) {
        return 'silent'
      }

      // 无需刷新
      return 'none'
    },

    /**
     * 标记数据已加载完成
     * 在数据加载成功后调用
     */
    markLoaded() {
      this.setData({
        _hasLoaded: true,
        _lastLoadTime: Date.now()
      })
    },

    /**
     * 标记需要刷新
     * 通常由子页面在操作完成后调用
     */
    markNeedRefresh() {
      this.setData({ _needRefresh: true })
    },

    /**
     * 清除刷新标记
     * 在处理完刷新后调用
     */
    clearRefreshMark() {
      this.setData({ _needRefresh: false })
    },

    /**
     * 重置加载状态
     * 用于下拉刷新等场景
     */
    resetLoadState() {
      this.setData({
        _hasLoaded: false,
        _needRefresh: false,
        _lastLoadTime: 0
      })
    },

    /**
     * 通知父页面需要刷新
     * @param {number} levels - 向上通知的层级数，默认 1
     */
    notifyParentRefresh(levels = 1) {
      const pages = getCurrentPages()
      const currentIndex = pages.length - 1

      for (let i = 1; i <= levels; i++) {
        const targetIndex = currentIndex - i
        if (targetIndex >= 0) {
          const parentPage = pages[targetIndex]
          if (parentPage && parentPage.markNeedRefresh) {
            parentPage.markNeedRefresh()
          }
        }
      }
    },

    /**
     * 检查是否从后台返回
     * @returns {boolean}
     */
    isFromBackground() {
      const app = getApp()
      return app._isFromBackground || false
    },

    /**
     * 检查是否从图片预览返回
     * @returns {boolean}
     */
    isFromImagePreview() {
      const app = getApp()
      if (app._isFromImagePreview) {
        app._isFromImagePreview = false
        return true
      }
      return false
    },

    /**
     * 判断是否应该静默刷新（简化版 shouldLoad）
     * @returns {boolean}
     */
    shouldSilentRefresh() {
      return this.data._needRefresh || this.isFromBackground()
    }
  }
})
