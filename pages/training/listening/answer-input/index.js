const api = getApp().api
const pageGuard = require('../../../../behaviors/pageGuard')
const pageLoading = require('../../../../behaviors/pageLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: { saveLoading: false },
  // ===========生命周期 Start===========
  onLoad() {
    this.startLoading()
    this.listQuestion()
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  inputArea(e) {
    const { partIndex, groupIndex, questionIndex } = e.currentTarget.dataset
    this.setData({
      [`parts[${partIndex}].groups[${groupIndex}].questions[${questionIndex}].userAnswer`]: e.detail
    })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  // 访问接口获取数据
  listQuestion() {
    api.request(this, `/question/v1/list/part/${this.options.unitId}/miniapp`, {}, true, false).then(() => {
      this.finishLoading()
    }).catch(() => {
      pageGuard.goBack(this)
    })
  },
  saveQue() {
    if (this.data.saveLoading) {
      return
    }
    this.setData({
      saveLoading: true
    })
    api.request(this, '/result/v1/submit', {
      ...this.options,
      parts: this.data.parts
    }, false, 'POST').then(res => {
      this.redirectTo('../report-card/index' + api.parseParams({
        ...res,
        ...this.options
      }))
    }).catch(() => {
      this.setData({ saveLoading: false })
      // 提交失败仅提示，保留答案
    })
  }
  // ===========数据获取 End===========
})
