const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')
const loadError = require('../../../behaviors/loadError')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError],
  data: {
    version: '1.4.37'
  },
  onShow: function () {
    this.getUser(this)
    this.startLoading()
    const systemInfo = wx.getSystemInfoSync();
    const tabBarHeight = systemInfo.windowHeight - systemInfo.statusBarHeight;
    const miniProgram = wx.getAccountInfoSync();
    this.setData({
      version: miniProgram.miniProgram.version,
      bottom: tabBarHeight - 90
    })
  },
  onShareAppMessage: function () {
    return api.share('用户中心', this)
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