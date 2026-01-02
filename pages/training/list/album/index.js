const api = getApp().api
const pageGuard = require('../../../../behaviors/pageGuard')
const pageLoading = require('../../../../behaviors/pageLoading')
const loadError = require('../../../../behaviors/loadError')
const smartLoading = require('../../../../behaviors/smartLoading')
const { diffSetData } = require('../../../../utils/diff')

Page({
  behaviors: [pageGuard.behavior, pageLoading, loadError, smartLoading],
  data: {},
  // ===========生命周期 Start===========
  onShow() {
    const loadType = this.shouldLoad()
    if (loadType === 'full') {
      this.startLoading()
      this.listData()
    } else if (loadType === 'silent') {
      this.listData(true) // 静默刷新
    }
    // loadType === 'none' 时不刷新
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  toPage() {
    const {
      subjectId
    } = this.options
    this.navigateTo(`/pages/training/setting/album/index?subjectId=${subjectId}`, { checkReady: false })
  },
  toChapter({
    currentTarget: {
      dataset: {
        id
      }
    }
  }) {
    const {
      subjectId
    } = this.options
    this.navigateTo(`../set/index?moduleId=${id}&subjectId=${subjectId}`, { checkReady: false })
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listData(isSilent = false) {
    const _this = this
    if (!isSilent) {
      this.hideLoadError()
    }
    api.request(this, '/module/v1/list', {
      ...this.options
    }, !isSilent).then((res) => {
      if (isSilent) {
        // 静默刷新：使用 diff 更新，避免闪烁
        diffSetData(_this, res, () => {
          _this.markLoaded()
        })
      } else {
        // 首次加载：直接 setData
        _this.setData(res, () => {
          _this.markLoaded()
          _this.setDataReady()
          _this.finishLoading()
        })
      }
    }).catch(() => {
      if (!isSilent) {
        pageGuard.showRetry(_this)
      }
      // 静默刷新失败不处理
    })
  },
  // 重试加载
  retryLoad() {
    this.startLoading()
    this.listData()
  },
  // ===========数据获取 End===========
})
