const api = getApp().api
const audioApi = getApp().audioApi
const pageGuard = require('../../../../behaviors/pageGuard')
const audioPageLoading = require('../../../../behaviors/audioPageLoading')
const buttonGroupHeight = require('../../../../behaviors/button-group-height')

let audioContext

Page({
  behaviors: [pageGuard.behavior, audioPageLoading, buttonGroupHeight],
  data: {
    areaTop: -2,
    areaLeft: 0,
    bodyHeight: '',
    swiperCurrent: 0,
    audioState: 'none',
    audioEndTime: 0,
    playingSmallIndex: -1,
    showArticle: false,
    baseShowArticle: false,
    schedule: 0,
    completelyOver: false,
    showActionsheet: false,
    playbackRate: 1,
    playbackRateStr: 1.0,
    groups: [
      {
        text: '文章显示',
        type: 'warn',
        value: 3
      }
    ],
    showPl: true,
    saveFlag: false,
    notesSaveStatus: 'none'  // 'none' | 'saving' | 'saved'
  },

  // ==================== 生命周期 ====================

  onLoad: function (options) {
    this.setData({ audioState: 'none' })
    this.startAudioPageLoading()
    this.listListening(false)
  },

  onShow: function () {
    const { platform } = wx.getDeviceInfo()
    if (platform == 'ios') {
      this.setData({ areaTop: -6, areaLeft: -4 })
    }
    // 只有数据就绪后才处理从 sentence 返回的情况
    if (!api.isEmpty(this.data.index) && this.isDataReady()) {
      this._handleReturnFromSentence()
    }
  },

  onHide: function () {
    let { audioState } = this.data
    if (audioState === 'playing') {
      this.setData({ audioState: 'none', playingSmallIndex: -1 })
    }
  },

  onUnload: function () {
    this.stopAudio()
    if (audioContext) {
      audioContext.destroy()
    }
    audioApi.delAudioFile()
  },

  onReady() {
    // buttonGroupHeight behavior 会自动计算按钮组高度
  },

  // ==================== 业务方法 ====================

  /**
   * 处理从 sentence 页面返回
   */
  _handleReturnFromSentence() {
    // 从 storage 同步最新数据
    const storageList = wx.getStorageSync('listenings')
    const { index } = this.data
    const i = Number(index)

    this.setData({
      list: storageList,
      swiperCurrent: i,
      schedule: (((i + 1) / storageList.length) * 100),
      showArticle: false,
      index: ''
    })
    this.stopAudio()
    this.playAudio()
  },

  // 切换卡片（遗留方法，保留兼容）
  swiperSwitch({ detail }) {
    if (detail.source !== "touch") {
      return
    }
    this.stopAudio()
    this.textareaBlur()
    const { list } = this.data
    this.setData({
      swiperCurrent: detail.current,
      audioState: 'none',
      showArticle: false,
      schedule: (((detail.current + 1) / list.length) * 100)
    })
    wx.nextTick(() => {
      this.playAudio()
    })
  },

  // 音频播放监听
  audioContextListener() {
    audioContext.onEnded(() => {
      this.setData({
        audioState: 'stop',
        completelyOver: true
      })
    })
    audioContext.onPlay(() => {
      this.setData({ audioState: 'playing' })
    })
    audioContext.onStop(() => {
      this.setData({ audioState: 'stop', playingSmallIndex: -1 })
    })
    audioContext.onPause(() => {
      this.setData({ audioState: 'stop', playingSmallIndex: -1 })
    })
    audioContext.onTimeUpdate(() => {
      const { audioEndTime } = this.data
      this.setSentencePlayingStatus()
      if (audioContext.currentTime >= audioEndTime && audioEndTime != 0 && audioContext.currentTime != 0) {
        this.stopAudio()
        this.setData({ playingSmallIndex: -1 })
      }
    })
  },

  // 计算播放到哪个句子（使用 this.data.list）
  setSentencePlayingStatus() {
    const { swiperCurrent, list } = this.data
    if (!list || !list[swiperCurrent]) return

    const sentence = list[swiperCurrent].list
    for (let i = 0; i < sentence.length; i++) {
      const leftTime = audioApi.millis2Seconds(sentence[i].startTimeMillis) - 0.1
      const rightTime = audioApi.millis2Seconds(sentence[i].endTimeMillis)
      if (audioContext.currentTime >= leftTime && audioContext.currentTime <= rightTime) {
        this.setData({ playingSmallIndex: i })
      }
    }
  },

  // 大句子播放（使用 this.data.list）
  playAudio() {
    const { swiperCurrent, list } = this.data
    if (!list || !list[swiperCurrent]) return

    const paragraph = list[swiperCurrent]
    let startTime = audioApi.millis2Seconds(paragraph.startTimeMillis)
    startTime = startTime == 0 ? startTime : (startTime - 0.1)
    wx.nextTick(() => {
      audioContext.seek(startTime)
      audioContext.startTime = startTime
      audioContext.play()
    })
    this.setData({
      audioEndTime: audioApi.millis2Seconds(paragraph.endTimeMillis)
    })
    this.saveSentencePlayingRecord()
  },

  // 切换下一个大句子（使用节流防重复）
  nextSentence() {
    this.throttleAction('nextSentence', () => {
      this.stopAudio()
      this.nextAudio()
    })
  },

  // 切换下一句-完全听懂（使用节流防重复）
  nextSentence2() {
    this.throttleAction('nextSentence2', () => {
      const { swiperCurrent, list } = this.data
      if (!list || !list[swiperCurrent]) return

      if (list[swiperCurrent].status == 0 || list[swiperCurrent].label) {
        return
      }

      // 更新 this.data.list
      this.setData({
        [`list[${swiperCurrent}].status`]: '2',
      })

      // 同步到 storage
      list[swiperCurrent].status = '2'
      wx.setStorageSync('listenings', list)

      this.stopAudio()
      this.nextAudio()
    })
  },

  // 播放下一个
  nextAudio() {
    this.validateNotes()
    const { swiperCurrent, list } = this.data
    if (!list || swiperCurrent >= (list.length - 1)) {
      api.toast('已经最后一句啦！')
      return
    }
    this.setData({
      swiperCurrent: swiperCurrent + 1,
      schedule: (((swiperCurrent + 2) / list.length) * 100),
      showArticle: false
    }, () => {
      // hint_banner 高度可能变化，更新按钮组高度
      this.updateButtonGroupHeight()
    })
    this.playAudio()
  },

  // 小句子播放
  listenSentenceAgain(e) {
    this.stopAudio()
    const { swiperCurrent, list } = this.data
    if (!list || !list[swiperCurrent]) return

    const idx = e.detail?.idx ?? e.currentTarget?.dataset?.idx
    const sentence = list[swiperCurrent].list[idx]
    this.setData({
      audioEndTime: audioApi.millis2Seconds(sentence.endTimeMillis),
      playingSmallIndex: idx
    })
    let startTime = audioApi.millis2Seconds(sentence.startTimeMillis)
    startTime = startTime == 0 ? startTime : (startTime - 0.1)
    wx.nextTick(() => {
      audioContext.seek(startTime)
      audioContext.startTime = startTime
      audioContext.play()
    })
  },

  // 重新播放
  listenAgain: function () {
    this.stopAudio()
    this.playAudio()
  },

  // 停止播放
  stopAudio() {
    if (audioContext && !audioContext.paused) {
      audioContext.stop()
    }
    const { swiperCurrent, list } = this.data
    if (list) {
      this.setData({
        completelyOver: (swiperCurrent + 1) === list.length
      })
    }
  },

  // 跳转到句子列表（使用安全导航）
  toList: function () {
    this.stopAudio()
    const { swiperCurrent, list } = this.data
    this.navigateTo('../sentence/index?sid=' + this.options.setId + '&paragraphId=' + list[swiperCurrent].id)
  },

  // 完成精听（使用节流防重复）
  toExam() {
    this.throttleAction('toExam', () => {
      this.overIntensive()
    })
  },

  textareaFocus() {
    this.setData({ showPl: false })
  },

  textareaBlur() {
    this.setData({ showPl: true })
  },

  // 标注句子（同步更新 data 和 storage）
  inputVal({ detail }) {
    const _this = this
    const { swiperCurrent, list } = this.data
    if (!list || !list[swiperCurrent]) return

    // 更新 this.data.list
    this.setData({
      [`list[${swiperCurrent}].label`]: detail.value,
      [`list[${swiperCurrent}].status`]: '3',
    })

    // 同步到 storage
    list[swiperCurrent].label = detail.value
    list[swiperCurrent].status = '3'
    wx.setStorageSync('listenings', list)

    this.cancelTimer('inputVal')
    this.registerTimer('inputVal', () => {
      _this.validateNotes()
    }, 500)
  },

  showArticle: function () {
    this.setData({
      showArticle: !this.data.showArticle
    })
  },

  playSet() {
    let path = `groups[${this.data.groups.length - 1}].text`
    this.setData({
      [path]: this.data.baseShowArticle ? '文章显示：关闭常开' : '文章显示：常开',
      showActionsheet: true
    })
  },

  btnClick(e) {
    const val = e.detail.value
    if (val === 3) {
      this.setData({
        baseShowArticle: !this.data.baseShowArticle,
        showActionsheet: false
      })
    } else {
      audioContext.playbackRate = val
      audioContext.pause()
      audioContext.play()
      this.setData({
        playbackRate: val,
        playbackRateStr: (val == 1 || val == 2) ? val + '.0' : val,
        showActionsheet: false
      })
    }
  },

  // ==================== 数据请求 ====================

  /**
   * 获取数据（修复版）
   * - 显式设置 list 到 data
   * - 加载完成后标记数据就绪
   */
  listListening(isPull) {
    const _this = this
    api.request(this, `/part/v1/sentence`, { ...this.options }, isPull, true)
      .then(res => {
        // 1. 存入 storage（供 sentence 页面使用）
        wx.setStorageSync('listenings', res.list)

        // 2. 显式设置 list 到 data（确保数据源统一）
        _this.setData({
          list: res.list,
          swiperCurrent: res.swiperCurrent || 0,
          progressId: res.progressId,
          schedule: (((res.swiperCurrent || 0) + 1) / res.list.length) * 100,
          audioUrl: res.audioUrl
        })

        // 3. 加载音频
        return audioApi.initAudio(res.audioUrl, (progress) => {
          _this.updateAudioProgress(progress)
        })
      })
      .then(data => {
        audioContext = data
        _this.audioContextListener()

        // 4. 标记数据就绪，完成加载
        _this.setDataReady()
        _this.finishAudioPageLoading()

        // 5. 数据就绪后重新计算按钮组高度（此时 hint_banner 已渲染）
        _this.updateButtonGroupHeight()
      })
      .catch(() => {
        pageGuard.goBack(_this)
      })
  },

  // 笔记保存前验证
  validateNotes() {
    const { progressId } = this.data
    if (!api.isEmpty(progressId)) {
      this.saveSentenceNotes()
    } else {
      this.createProgress()
    }
  },

  // 创建进度后保存笔记
  createProgress() {
    api.request(this, '/record/v1/create/progress', { ...this.options }, true, 'POST').then(() => {
      this.saveSentenceNotes()
    }).catch(() => {
      // 创建进度静默失败
    })
  },

  // 保存句子笔记
  saveSentenceNotes() {
    const { progressId, swiperCurrent, list } = this.data
    if (!list || !list[swiperCurrent]) return

    const hasNotes = !!list[swiperCurrent].label

    // 只有有笔记内容时才显示保存状态
    if (hasNotes) {
      this.setData({ notesSaveStatus: 'saving' })
    }

    api.request(this, '/record/v1/save/label', {
      progressId: progressId,
      sentenceId: list[swiperCurrent].id,
      status: list[swiperCurrent].status,
      content: list[swiperCurrent].label,
      currentIndex: swiperCurrent
    }, true, 'POST').then(() => {
      // 只有有笔记内容时才显示已保存状态
      if (hasNotes) {
        this.setData({ notesSaveStatus: 'saved' })
        // 2秒后隐藏
        this.registerTimer('hideNotesSaved', () => {
          this.setData({ notesSaveStatus: 'none' })
        }, 2000)
      }
    }).catch(() => {
      // 保存失败，隐藏状态
      if (hasNotes) {
        this.setData({ notesSaveStatus: 'none' })
      }
    })
  },

  // 保存句子播放状态（同步更新 data 和 storage）
  saveSentencePlayingRecord() {
    const { swiperCurrent, list } = this.data
    if (!list || !list[swiperCurrent]) return

    const state = list[swiperCurrent].status
    const newStatus = state == '0' ? '1' : state

    // 更新 this.data.list
    this.setData({
      [`list[${swiperCurrent}].status`]: newStatus,
    })

    // 同步到 storage
    list[swiperCurrent].status = newStatus
    wx.setStorageSync('listenings', list)

    // API 静默保存（hasToast=true 不显示 loading）
    api.request(this, '/record/v1/sentence/playing', {
      ...this.options,
      sentenceId: list[swiperCurrent].id
    }, true, 'POST').catch(() => {
      // 播放记录静默失败
    })
  },

  // 完成精听（使用安全重定向）
  overIntensive() {
    const { progressId } = this.data
    this.saveSentenceNotes()

    api.request(this, `/record/v1/complete/progress/${this.data.progressId}`, {}, false).then(() => {
      this.redirectTo('../intensive-notes/index' + api.parseParams({
        ...this.options,
        progressId: progressId,
      }))
    }).catch(() => {
      // 完成失败提示重试
    })
  }
})
