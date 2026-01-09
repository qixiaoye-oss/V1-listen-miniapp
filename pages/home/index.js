const api = getApp().api
const pageGuard = require('../../behaviors/pageGuard')
const pageLoading = require('../../behaviors/pageLoading')
const loadError = require('../../behaviors/loadError')
const smartLoading = require('../../behaviors/smartLoading')

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
    // 加载提示文字
    loadingText: '正在连接服务器...'
  },

  // ===========生命周期 Start===========

  /**
   * 页面加载时显示加载提示
   */
  onLoad() {
    // 页面加载时设置初始提示文字
    this.setData({ loadingText: '正在连接服务器...' })
  },

  /**
   * 页面显示时的加载逻辑
   * 首页只在首次加载时请求数据，后续不刷新
   */
  onShow() { },

  /**
   * 登录后首次显示（CustomHook 触发）
   * 优先使用预加载数据，实现快速渲染
   */
  onShowLogin() {
    const app = getApp()

    // 首页只在首次加载，后续不刷新
    const isFirstLoad = !this.data._hasLoaded
    console.log('[Home] onShowLogin, isFirstLoad:', isFirstLoad, 'preloadStatus:', app.homePreloadStatus)

    if (!isFirstLoad) {
      return
    }

    // 更新提示文字
    this.setData({ loadingText: '正在加载数据...' })

    // 首次加载：尝试使用预加载数据
    this._handleFirstLoad(app)
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
      this.setData({ loadingText: '即将完成...' })
      this._applyPreloadData(app)
    } else if (app.homePreloadStatus === 'loading' && app.homePreloadPromise) {
      // 预加载进行中，等待完成
      console.log('[Home] Waiting for preload...')
      this.setData({ loadingText: '正在获取数据...' })
      app.homePreloadPromise
        .then(() => {
          this.setData({ loadingText: '即将完成...' })
          this._applyPreloadData(app)
        })
        .catch(() => {
          // 预加载失败，降级到普通加载
          console.log('[Home] Preload failed, fallback to normal load')
          this.startLoading()
          this._loadAllData()
        })
    } else {
      // 无预加载数据，正常加载
      console.log('[Home] No preload data, normal load')
      this.startLoading()
      this._loadAllData()
    }
  },

  /**
   * 应用预加载数据
   */
  _applyPreloadData(app) {
    const homeData = app.homePreloadData
    const popularScienceData = app.popularSciencePreloadData

    // 处理科普数据分列
    let popularScienceColumns = null
    if (popularScienceData && popularScienceData.popularScience && popularScienceData.popularScience.list) {
      popularScienceColumns = this._splitToColumns(popularScienceData.popularScience.list)
    }

    // 处理分组数据分列（QUAD_GRID模式）
    if (homeData && homeData.list) {
      homeData.list.forEach(group => {
        if (group.layoutMode === 'QUAD_GRID' && group.list) {
          group.columns = this._splitToColumns(group.list)
        }
      })
    }

    // 合并数据一次性设置
    const updateData = {
      ...(homeData || {}),
      ...(popularScienceData || {}),
      ...(popularScienceColumns ? { popularScienceColumns } : {}),
      _usedPreload: true
    }
    this.setData(updateData)

    // 标记加载完成
    this.setDataReady()
    this.markLoaded()
    this.finishLoading()

    // 清除预加载缓存（避免下次使用过期数据）
    app.clearHomePreloadCache()
  },

  onShareAppMessage() {
    return api.share('考雅听力专项题库', this)
  },
  // ===========生命周期 End===========

  // ===========工具方法 Start===========

  /**
   * 将列表数据分为左右两列（瀑布流布局）
   */
  _splitToColumns(list) {
    const leftColumn = []
    const rightColumn = []
    list.forEach((item, index) => {
      if (index % 2 === 0) {
        leftColumn.push(item)
      } else {
        rightColumn.push(item)
      }
    })
    return { leftColumn, rightColumn }
  },

  // ===========工具方法 End===========

  // ===========业务操作 Start===========

  /**
   * 小程序跳转
   */
  onMiniappLinkTap(e) {
    const type = e.currentTarget.dataset.type
    const appIdMap = {
      kouyu: 'wxb654ae86481b7566',   // 口语开源题库
      jijing: 'wx236ffece314ca802'   // 机经开源题库
    }
    const appId = appIdMap[type]
    if (appId) {
      wx.navigateToMiniProgram({
        appId: appId,
        fail: () => {
          wx.showToast({ title: '跳转失败', icon: 'none' })
        }
      })
    }
  },

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
   * 并行加载所有数据（使用 Promise.all）
   * 合并首页数据和科普数据请求，提升加载速度
   */
  _loadAllData() {
    this.hideLoadError()

    const promises = [
      // 科普数据（非必需，失败返回空对象）
      api.request(this, '/popular/science/v1/miniapp/home', {}, true, 'GET', false)
        .catch(() => ({})),
      // 首页主数据
      api.request(this, '/home/v1/list', {}, true, 'GET', false)
    ]

    Promise.all(promises)
      .then(([scienceData, homeData]) => {
        // 处理科普数据分列
        let popularScienceColumns = null
        if (scienceData && scienceData.popularScience && scienceData.popularScience.list) {
          popularScienceColumns = this._splitToColumns(scienceData.popularScience.list)
        }

        // 处理分组数据分列（QUAD_GRID模式）
        if (homeData && homeData.list) {
          homeData.list.forEach(group => {
            if (group.layoutMode === 'QUAD_GRID' && group.list) {
              group.columns = this._splitToColumns(group.list)
            }
          })
        }

        // 合并数据一次性 setData
        this.setData({
          ...scienceData,
          ...homeData,
          ...(popularScienceColumns ? { popularScienceColumns } : {})
        })
        this.setDataReady()
        this.markLoaded()
      })
      .catch(() => {
        pageGuard.showRetry(this)
      })
      .finally(() => {
        this.finishLoading()
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
    this._loadAllData()
  },
  // ===========数据获取 End===========
})
