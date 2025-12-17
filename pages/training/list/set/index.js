const api = getApp().api
const pageGuard = require('../../../../behaviors/pageGuard')
const pageLoading = require('../../../../behaviors/pageLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {},
  // ===========生命周期 Start===========
  onShow() {
    this.startLoading()
    this.listData()
  },
  onShareAppMessage() {
    return api.share('不刷语料库', this)
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  // 去往答题
  toWriting(e) {
    const { moduleIndex, unitIndex } = e.currentTarget.dataset
    const { list } = this.data
    const { subjectId } = this.options
    const item = list[moduleIndex].list[unitIndex]
    if (!this.verifyPermissions(item)) {
      return
    }
    let param = { unitId: item.id, moduleId: list[moduleIndex].id, subjectId: subjectId }
    this.createActionSheet(item, param)
  },
  // 权限验证
  verifyPermissions(item) {
    const user = wx.getStorageSync('user')
    // if (api.isEmpty(user.nickName)) {
    //   wx.navigateTo({
    //     url: '/pages/setting/user/index',
    //   })
    //   return false
    // }
    if (item.isInside === '0') {
      api.modal('', '暂无权限', false)
      return false
    }
    return true
  },
  createActionSheet(item, param) {
    const options = [
      {
        title: "泛听/做题模式",
        param: { ...param },
        function: "handleGeneralMode"
      },
    ];
    const parts = item.list || []
    parts.forEach(part => {
      options.push({
        title: `精听模式（${part.partNum}）`,
        param: { ...param, partId: part.id, progressId: part.uncompletedProgressId || '' },
        function: "handleIntensiveMode"
      })
      if (part.completedProgressId) {
        options.push({
          title: `标注（${part.partNum}）`,
          param: { ...param, partId: part.id, progressId: part.completedProgressId },
          function: "handleIntensiveLabelMode"
        })
      }
    })
    if (item.resultId) {
      options.push({
        title: `答题记录`,
        param: { ...param, resultId: item.resultId },
        function: "handleAnswerRecord"
      })
    }
    const titles = options.map(item => item.title);
    wx.showActionSheet({
      itemList: titles,
      success: (res) => {
        const selectedIndex = res.tapIndex;
        if (selectedIndex >= 0 && selectedIndex < options.length) {
          const selectedOption = options[selectedIndex];
          // 根据 function 字段调用对应方法，并传入 param
          this[selectedOption.function](selectedOption.param);
        }
      }
    })
  },
  // 泛听/做题模式处理函数
  handleGeneralMode(params) {
    this.navigateTo('/pages/training/listening/extensive/index' + api.parseParams(params), { checkReady: false })
  },
  // 精听模式处理函数（支持多个模式，可判断 resultId 是否存在）
  handleIntensiveMode(params) {
    // 判断是否存在历史记录
    if (params.progressId) {
      wx.showModal({
        title: '',
        content: '存在未完成记录是否继续上次？',
        cancelText: "重新开始",
        confirmText: "继续上次",
        complete: (res) => {
          if (res.cancel) {
            this.delListeningProgress(params)
          }
          if (res.confirm) {
            this.toIntensivePage(params)
          }
        }
      })
      return
    }
    this.toIntensivePage(params)
  },
  // 答题记录处理函数
  handleAnswerRecord(params) {
    this.navigateTo('/pages/training/listening/report-card/index' + api.parseParams(params), { checkReady: false })
  },
  toIntensivePage(params) {
    this.navigateTo('/pages/training/listening/intensive/index' + api.parseParams(params), { checkReady: false })
  },
  handleIntensiveLabelMode(params) {
    this.navigateTo('/pages/training/listening/intensive-notes/index' + api.parseParams(params), { checkReady: false })
  },
  // 跳转到设置页面
  toPage() {
    const { subjectId, albumId } = this.options
    this.navigateTo(`/pages/training/setting/set/index?subjectId=${subjectId}&albumId=${albumId}`, { checkReady: false })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData() {
    api.request(this, '/unit/v1/list', {
      ...this.options
    }, true).then(() => {
      this.finishLoading()
    }).catch(() => {
      pageGuard.goBack(this)
    })
  },
  // 删除记录
  delListeningProgress(params) {
    api.request(this, `/record/v1/del/progress/${params.progressId}`, {}, true).then(() => {
      delete params['progressId']
      this.toIntensivePage(params)
    }).catch(() => {
      // 删除失败仅提示
    })
  }
  // ===========数据获取 End===========
})
