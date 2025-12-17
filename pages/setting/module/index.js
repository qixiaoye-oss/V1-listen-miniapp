const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')
const pageLoading = require('../../../behaviors/pageLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {},
  onLoad() {
    this.startLoading()
    this.listResourceStatus()
  },
  listResourceStatus() {
    api.request(this, '/user/listUserOpenResource', {
      userId: api.getUserId(),
    }, true).then(() => {
      this.finishLoading()
    }).catch(() => {
      pageGuard.goBack(this)
    })
  },
  resourceChange(e) {
    let item = e.currentTarget.dataset.item
    let index = e.currentTarget.dataset.index
    const newValue = e.detail.value ? 1 : 0
    // 先乐观更新 UI
    this.setData({ [`list[${index}].isShow`]: newValue })
    api.request(this, '/user/updateUserOpenResource', {
      userId: api.getUserId(),
      id: item.id,
      isShow: newValue
    }, true, 'post').catch(() => {
      // 失败时恢复开关状态
      this.setData({ [`list[${index}].isShow`]: item.isShow })
    })
  }
})