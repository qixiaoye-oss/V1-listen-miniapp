const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')
const smartLoading = require('../../../behaviors/smartLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
  data: {
    version: '1.0.0',
    permission_duration: '免费版'
  },
  onShow: function () {
    // 用户信息只加载一次
    if (this.data._hasLoaded) {
      return
    }
    this.startLoading()
    this.getUser()
    const accountInfo = wx.getAccountInfoSync()
    const version = accountInfo.miniProgram.version
    if (version) {
      this.setData({ version })
    }
  },
  onShareAppMessage: function () {
    return api.share('考雅听力专项题库', this)
  },
  toUpdateUserInfo() {
    this.navigateTo('/pages/user/login/login', { checkReady: false })
  },
  getUser() {
    this.hideLoadError()
    api.request(this, '/user/v1/user/info', {}, true).then(() => {
      this.markLoaded()
      this.finishLoading()
      this.setDataReady()
    }).catch(() => {
      this.finishLoading()
      pageGuard.showRetry(this)
    })
  },
  // 重试加载
  retryLoad() {
    this.startLoading()
    this.getUser()
  }
})