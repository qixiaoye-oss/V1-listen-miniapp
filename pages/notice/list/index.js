const api = getApp().api
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const pageGuard = require('../../../behaviors/pageGuard')
const smartLoading = require('../../../behaviors/smartLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
  data: {},
  // ===========生命周期 Start===========
  onShow() {
    // 静态内容，只加载一次
    if (this.data._hasLoaded) {
      return
    }
    this.startLoading()
    this.hideLoadError()
    this.listData()
  },
  // 重试加载
  retryLoad() {
    this.startLoading()
    this.hideLoadError()
    this.listData()
  },
  onShareAppMessage() {
    return api.share('考雅听力专项题库', this)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  // 去往答题
  toDetail(e) {
    let item = e.currentTarget.dataset.item
    this.navigateTo(`../detail/index?id=${item.id}`)
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  // 访问接口获取数据
  listData() {
    api.request(this, '/popular/science/v1/miniapp/list', {}, true)
      .then(() => {
        this.markLoaded()
        this.finishLoading()
        this.setDataReady()
      })
      .catch(() => {
        this.finishLoading()
        pageGuard.showRetry(this)
      })
  },
  // ===========数据获取 End===========
})
