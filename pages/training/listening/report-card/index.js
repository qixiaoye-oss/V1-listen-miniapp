const api = getApp().api
const pageGuard = require('../../../../behaviors/pageGuard')
const pageLoading = require('../../../../behaviors/pageLoading')
const buttonGroupHeight = require('../../../../behaviors/button-group-height')
const smartLoading = require('../../../../behaviors/smartLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading, buttonGroupHeight, smartLoading],
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
    // 查找页面栈中的 set 页面
    const pages = getCurrentPages()
    let setPageIndex = -1
    for (let i = pages.length - 2; i >= 0; i--) {
      if (pages[i].route === 'pages/training/list/set/index') {
        setPageIndex = i
        break
      }
    }

    if (setPageIndex >= 0) {
      // 找到 set 页面，通知其刷新并返回
      const delta = pages.length - 1 - setPageIndex
      this.notifyParentRefresh(delta)
      wx.navigateBack({ delta })
    } else {
      // 未找到，使用 redirectTo
      const { subjectId, moduleId } = this.options
      this.redirectTo(`/pages/training/list/set/index?subjectId=${subjectId}&moduleId=${moduleId}`)
    }
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