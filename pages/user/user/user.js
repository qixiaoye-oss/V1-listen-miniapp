const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],
  data: {
    version: '1.0.0',
    permission_duration: '免费版'
  },
  onShow: function () {
    this.getUser(this)
    this.startLoading()
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
      this.setDataReady()
      this.finishLoading()
    }).catch(() => {
      pageGuard.showRetry(this)
    })
  },
  // 重试加载
  retryLoad() {
    this.startLoading()
    this.getUser()
  }
})