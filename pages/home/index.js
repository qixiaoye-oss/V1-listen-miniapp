const api = getApp().api
const pageGuard = require('../../behaviors/pageGuard')
const pageLoading = require('../../behaviors/pageLoading')
const loadError = require('../../behaviors/loadError')
const smartLoading = require('../../behaviors/smartLoading')
const { diffSetData } = require('../../utils/diff')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
  data: {
    url: {
      "TRAINING": "/pages/training/list/album/index"
    },
    popularScience: {
      url: []
    },
    // 标记是否使用了预加载数据
    _usedPreload: false,
    // 加载提示状态
    showHint: true,
    hintText: '正在连接服务器...'
  },

  // ===========生命周期 Start===========

  /**
   * 页面加载时显示加载提示
   */
  onLoad() {
    // 页面加载时显示 loading hint
    this.setData({
      showHint: true,
      hintText: '正在连接服务器...'
    })
  },

  /**
   * 页面显示时的加载逻辑
   * 使用 smart loading 区分：首次加载、静默刷新、无需刷新
   */
  onShow() { },

  /**
   * 登录后首次显示（CustomHook 触发）
   * 优先使用预加载数据，实现快速渲染
   */
  onShowLogin() {
    const app = getApp()
    const loadType = this.shouldLoad()

    console.log('[Home] onShowLogin, loadType:', loadType, 'preloadStatus:', app.homePreloadStatus)

    // 更新提示文字
    this.setData({ hintText: '正在加载数据...' })

    if (loadType === 'full') {
      // 首次加载：尝试使用预加载数据
      this._handleFirstLoad(app)
    } else if (loadType === 'silent') {
      // 静默刷新：后台更新数据，无视觉反馈
      this._hideLoadingHint()
      this._handleSilentRefresh()
    } else {
      // 无需刷新，隐藏提示
      this._hideLoadingHint()
    }
  },

  /**
   * 隐藏加载提示
   */
  _hideLoadingHint() {
    this.setData({ showHint: false })
  },

  /**
   * 处理首次加载
   * 优先使用预加载数据，否则显示骨架屏并请求
   */
  _handleFirstLoad(app) {
    // 检查预加载状态
    if (app.homePreloadStatus === 'success' && app.homePreloadData) {
      // 预加载成功，直接使用缓存数据
      console.log('[Home] Using preloaded data')
      this.setData({ hintText: '即将完成...' })
      this._applyPreloadData(app)
    } else if (app.homePreloadStatus === 'loading' && app.homePreloadPromise) {
      // 预加载进行中，等待完成
      console.log('[Home] Waiting for preload...')
      this.setData({ hintText: '正在获取数据...' })
      app.homePreloadPromise
        .then(() => {
          this.setData({ hintText: '即将完成...' })
          this._applyPreloadData(app)
        })
        .catch(() => {
          // 预加载失败，降级到普通加载
          console.log('[Home] Preload failed, fallback to normal load')
          this._hideLoadingHint()
          this.startLoading()
          this.listData()
          this.listPopularScienceData()
        })
    } else {
      // 无预加载数据，正常加载
      console.log('[Home] No preload data, normal load')
      this._hideLoadingHint()
      this.startLoading()
      this.listData()
      this.listPopularScienceData()
    }
  },

  /**
   * 应用预加载数据
   */
  _applyPreloadData(app) {
    const homeData = app.homePreloadData
    const popularScienceData = app.popularSciencePreloadData

    // 隐藏加载提示
    this._hideLoadingHint()

    // 设置首页数据
    if (homeData) {
      this.setData(homeData)
    }

    // 设置科普数据
    if (popularScienceData) {
      this.setData(popularScienceData)
    }

    // 标记加载完成
    this.markLoaded()
    this.finishLoading()
    this.setDataReady()

    // 标记已使用预加载
    this.setData({ _usedPreload: true })

    // 清除预加载缓存（避免下次使用过期数据）
    app.clearHomePreloadCache()
  },

  /**
   * 处理静默刷新
   * 后台请求数据，使用 diff 更新，避免闪烁
   */
  _handleSilentRefresh() {
    console.log('[Home] Silent refresh')
    this._silentListData()
    this._silentListPopularScienceData()
  },

  onShareAppMessage() {
    return api.share('考雅听力专项题库', this)
  },
  // ===========生命周期 End===========

  // ===========业务操作 Start===========
  toChildPage({ currentTarget: { dataset: { id, type, isInside } } }) {
    if (isInside === '0') {
      this.listPopularScienceByModule()
    } else {
      const { url } = this.data
      this.navigateTo(`${url[type]}?subjectId=${id}`, { checkReady: false })
    }
  },

  // 进入补充说明列表
  toNoticeListPage() {
    this.navigateTo('../notice/list/index', { checkReady: false })
  },

  // 进入补充说明详情
  toNoticePage(e) {
    const id = e.currentTarget.dataset.id
    this.navigateTo(`../notice/detail/index?id=${id}`, { checkReady: false })
  },

  // 点击说明徽章
  onNoticeTap(e) {
    const id = e.currentTarget.dataset.id
    this.navigateTo(`../notice/detail/index?id=${id}`, { checkReady: false })
  },
  // ===========业务操作 End===========

  // ===========数据获取 Start===========

  /**
   * 获取首页列表数据（带骨架屏）
   */
  listData() {
    this.hideLoadError()
    api.request(this, '/home/v1/list', {}, true).then(() => {
      this.markLoaded()
      this.finishLoading()
      this.setDataReady()
    }).catch(() => {
      this.finishLoading()
      pageGuard.showRetry(this)
    })
  },

  /**
   * 静默获取首页列表数据
   * 使用 diff 更新，避免页面闪烁
   */
  _silentListData() {
    const _this = this
    wx.request({
      url: 'https://listen.jingying.vip/api/listen/home/v1/list',
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Token': wx.getStorageSync('token')
      },
      success(res) {
        if (res.data.code == '200' && res.data.data) {
          // 使用 diff 更新，仅更新变化字段
          diffSetData(_this, res.data.data, () => {
            _this.markLoaded()
            console.log('[Home] Silent refresh completed')
          })
        }
      },
      fail() {
        // 静默刷新失败，不做处理
        console.log('[Home] Silent refresh failed')
      }
    })
  },

  /**
   * 获取科普数据
   */
  listPopularScienceData() {
    api.request(this, '/popular/science/v1/miniapp/home', {}, true).catch(() => {
      // 科普数据非必需，静默失败
    })
  },

  /**
   * 静默获取科普数据
   */
  _silentListPopularScienceData() {
    const _this = this
    wx.request({
      url: 'https://listen.jingying.vip/api/listen/popular/science/v1/miniapp/home',
      method: 'GET',
      header: {
        'Content-Type': 'application/json',
        'Token': wx.getStorageSync('token')
      },
      success(res) {
        if (res.data.code == '200' && res.data.data) {
          diffSetData(_this, res.data.data)
        }
      }
    })
  },

  listPopularScienceByModule() {
    api.request(this, '/popular/science/v1/list/no_permission/miniapp', {}, true).then(res => {
      const list = res.popularScienceList || []
      if (list.length == 1) {
        this.navigateTo(`/pages/notice/detail/index?id=${list[0].id}`)
      }
    })
  },

  /**
   * 重试加载（强制刷新）
   */
  retryLoad() {
    this.resetLoadState()
    this.startLoading()
    this.listData()
    this.listPopularScienceData()
  },
  // ===========数据获取 End===========
})
