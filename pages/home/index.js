const api = getApp().api
const pageGuard = require('../../behaviors/pageGuard')
const pageLoading = require('../../behaviors/pageLoading')
const loadError = require('../../behaviors/loadError')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],
  data: {
    url: {
      "TRAINING": "/pages/training/list/album/index"
    },
    popularScience: {
      url: []
    }
  },
  // ===========生命周期 Start===========
  onShow() {
    // 计算响应式布局标志
    const systemInfo = wx.getSystemInfoSync()
    const windowWidth = systemInfo.windowWidth
    // 判断是否为宽屏模式（如平板或横屏）
    const isWideScreen = windowWidth >= 768
    this.setData({
      isWideScreen: isWideScreen,
      windowWidth: windowWidth
    })
  },
  onShowLogin() {
    this.startLoading()
    this.listData()
    this.listPopularScienceData()
  },
  onShareAppMessage() {
    return api.share('考雅听力专项题库', this)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  toChildPage({ currentTarget: { dataset: { id, type, isInside } } }) {
    if (isInside === '0') {
      this.listPopularScienceByModule()
    }else{
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
  // 点击说明徽章（暂未连接API）
  onNoticeTap(e) {
    const id = e.currentTarget.dataset.id
    this.navigateTo(`../notice/detail/index?id=${id}`, { checkReady: false })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData() {
    this.hideLoadError()
    api.request(this, '/home/v1/list', {}, true).then(() => {
      this.setDataReady()
      this.finishLoading()
    }).catch(() => {
      pageGuard.showRetry(this)
    })
  },
  listPopularScienceData() {
    api.request(this, '/popular/science/v1/miniapp/home', {}, true).catch(() => {
      // 科普数据非必需，静默失败
    })
  },
  listPopularScienceByModule() {
    api.request(this, '/popular/science/v1/list/no_permission/miniapp', {}, true).then(res=>{
      const list = res.popularScienceList || []
      if (list.length == 1){
        this.navigateTo(`/pages/notice/detail/index?id=${list[0].id}`)
      }
    })
  },
  // 重试加载
  retryLoad() {
    this.startLoading()
    this.listData()
    this.listPopularScienceData()
  },
  // ===========数据获取 End===========
})
