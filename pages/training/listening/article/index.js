const api = getApp().api
const pageGuard = require('../../../../behaviors/pageGuard')
const pageLoading = require('../../../../behaviors/pageLoading')
const buttonGroupHeight = require('../../../../behaviors/button-group-height')

Page({
  behaviors: [pageGuard.behavior, pageLoading, buttonGroupHeight],
  data: {
    htmlStyle: {
      p: 'margin-bottom:10px;',
      span: 'line-height: 1.4;font-family: Arial, Helvetica, sans-serif;'
    }
  },
  // ===========生命周期 Start===========
  onLoad: function (options) {
    this.startLoading()

    // 尝试从 Storage 读取缓存
    const cacheKey = `article_${options.partId}`
    const cachedData = wx.getStorageSync(cacheKey)

    if (cachedData) {
      // 有缓存，直接使用
      this.setData(cachedData)
      this.setDataReady()
      this.finishLoading()
      wx.nextTick(() => {
        this.updateButtonGroupHeight()
      })
    } else {
      // 无缓存，请求数据
      this.getDetail(true)
    }
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  returnPage() {
    this.navigateBack()
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  // 访问接口获取数据
  getDetail(isPull) {
    api.request(this, `/part/v1/article/${this.options.partId}`, {}, isPull, false).then((res) => {
      // 存入 Storage 缓存
      const cacheKey = `article_${this.options.partId}`
      wx.setStorageSync(cacheKey, res)

      this.setDataReady()
      this.finishLoading()
      // 延迟计算，确保按钮组渲染完成
      wx.nextTick(() => {
        this.updateButtonGroupHeight()
      })
    }).catch(() => {
      pageGuard.goBack(this)
    })
  }
  // ===========数据获取 End===========
})
