const api = getApp().api
const pageGuard = require('../../../../behaviors/pageGuard')
const pageLoading = require('../../../../behaviors/pageLoading')
const buttonGroupHeight = require('../../../../behaviors/button-group-height')

Page({
  behaviors: [pageGuard.behavior, pageLoading, buttonGroupHeight],
  data: {},
  // ===========生命周期 Start===========
  onShow() { },
  onLoad: function (options) {
    this.startLoading()
    this.listQuestion(true)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  returnPage() {
    const { subjectId, moduleId } = this.options
    this.redirectTo(`/pages/training/list/set/index?subjectId=${subjectId}&moduleId=${moduleId}`)
  },
  change(e) {
    const { partIndex, groupIndex, questionIndex } = e.currentTarget.dataset
    const { parts } = this.data
    let param = {
      partId: parts[partIndex].id,
      groupId: parts[partIndex].groups[groupIndex].id,
      questionId: parts[partIndex].groups[groupIndex].questions[questionIndex].id
    }
    this.navigateTo('../explanation/index' + api.parseParams(param), { checkReady: false })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listQuestion(isPull) {
    const _this = this
    api.request(this, `/result/v1/result/${this.options.resultId}`, {}, isPull).then(() => {
      _this.setDataReady()
      _this.finishLoading()
      // 延迟计算，确保按钮组渲染完成
      wx.nextTick(() => {
        _this.updateButtonGroupHeight()
      })
    }).catch(() => {
      pageGuard.goBack(_this)
    })
  },
})