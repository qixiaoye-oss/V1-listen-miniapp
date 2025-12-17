const api = getApp().api
const audioApi = getApp().audioApi
const pageGuard = require('../../../../behaviors/pageGuard')
const audioPageLoading = require('../../../../behaviors/audioPageLoading')
const buttonGroupHeight = require('../../../../behaviors/button-group-height')

let innerAudioContext = null
Page({
  behaviors: [pageGuard.behavior, audioPageLoading, buttonGroupHeight],
  data: {
    underwayIndex: 0,
    underway: {
      id: ''
    },
    schedule: 0,
    audioStatus: 0,
    lastRecordingTime: 0,
    playTime: 0,
    saveFlag: true,
    showActionsheet: false,
    playbackRate: '1.0',
    showSlider: false,
    groups: [{
      text: '0.8倍速',
      value: 0.8
    }, {
      text: '1倍速',
      value: 1.0
    }, {
      text: '1.25倍速',
      value: 1.25
    }, {
      text: '1.5倍速',
      value: 1.5
    }, {
      text: '2倍速',
      value: 2.0
    }]
  },
  onLoad(options) {
    this.startAudioPageLoading()
    this.listData()
  },
  onHide() {
    // innerAudioContext.stop()
    // this.setData({
    //   audioStatus: 0
    // })
  },
  onUnload() {
    innerAudioContext.destroy()
    audioApi.delAudioFile()
  },
  playAudio() {
    this.setData({
      audioStatus: 1,
      [`parts[0].playing`]: true,
      [`parts[0].draggable`]: true
    })
    this.registerTimer('playAudio', () => {
      innerAudioContext.play()
      this.setData({
        lastRecordingTime: Date.now(),
      })
    }, 500)
  },
  pauseAudio() {
    innerAudioContext.pause()
    this.setData({
      audioStatus: 0
    })
  },
  // 记录时间
  calculateRecordingTime() {
    let playTime = (Date.now() - this.data.lastRecordingTime)
    this.setData({
      lastRecordingTime: Date.now(),
      playTime: this.data.playTime + playTime
    })
    // 计算是否超过50 如果本次已经保存过则不在进行保存
    if (this.data.saveFlag) {
      let pt = this.data.playTime / 1000
      let percentage = (pt / this.data.detail.ftDuration) * 100
      if (percentage > 50) {
        this.saveRecord(false)
        this.setData({
          saveFlag: false
        })
      }
    }
  },
  refreshAudio() {
    this.registerTimer('refreshAudio', () => {
      innerAudioContext.startTime = 0
      innerAudioContext.seek(0)
      innerAudioContext.play()
      this.setData({
        audioStatus: 1,
      })
    }, 100)
  },
  sliderChange(e) {
    innerAudioContext.stop()
    let schedule = e.detail.value
    let startTime = audioApi.formatAudioTime(((innerAudioContext.duration * schedule) / 100))
    innerAudioContext.seek(startTime)
    innerAudioContext.startTime = startTime
    this.registerTimer('sliderChange', () => {
      innerAudioContext.play()
      this.setData({
        audioStatus: 1
      })
    }, 100)
  },
  toggleSlider() {
    this.setData({
      showSlider: !this.data.showSlider
    })
  },
  playSet() {
    this.setData({
      showActionsheet: true
    })
  },
  btnClick(e) {
    const val = e.detail.value
    innerAudioContext.playbackRate = val
    innerAudioContext.pause()
    innerAudioContext.play()
    this.setData({
      playbackRate: (val == 1 || val == 2) ? val + '.0' : val,
      showActionsheet: false
    })
  },
  listData(isPull) {
    const _this = this
    const { underwayIndex } = this.data
    api.request(this, `/question/v1/list/part/${this.options.unitId}/miniapp`, {}, isPull).then(({ parts }) => {
      // 传入进度回调，实时更新下载进度 下载第一个音频
      audioApi.initAudio(parts[underwayIndex].audioUrl, (progress) => {
        _this.updateAudioProgress(progress)
      }).then(data => {
        innerAudioContext = data
        _this.addEventListener()
        _this.finishAudioPageLoading()
      })
    }).catch(() => {
      pageGuard.goBack(_this)
    })
  },
  addEventListener() {
    innerAudioContext.duration
    innerAudioContext.onTimeUpdate(() => {
      const { underwayIndex } = this.data
      let schedule = (innerAudioContext.currentTime / innerAudioContext.duration) * 10000
      this.setData({
        [`parts[${underwayIndex}].schedule`]: schedule
      })
      // this.calculateRecordingTime()
    })
    innerAudioContext.onEnded(() => {
      // 切换音频
      this.toggleAudio()
    })
    innerAudioContext.onPause(() => {
      this.setData({
        audioStatus: 0
      })
    })
    innerAudioContext.onPlay(() => {
      this.setData({
        audioStatus: 1,
      })
    })
  },
  // 切换音频
  toggleAudio() {
    const { parts, underwayIndex } = this.data
    if (parts.length > underwayIndex) {
      innerAudioContext.src = parts[underwayIndex + 1].audioUrl
      innerAudioContext.duration
      this.setData({
        [`parts[${underwayIndex}].playing`]: false,
        [`parts[${underwayIndex}].draggable`]: false,
        [`parts[${underwayIndex + 1}].playing`]: true,
        [`parts[${underwayIndex + 1}].draggable`]: true,
        underwayIndex: underwayIndex + 1
      })
      innerAudioContext.play()
      innerAudioContext.duration
    } else {
      this.setData({
        audioStatus: 2,
        [`parts[${underwayIndex}].playing`]: false,
        [`parts[${underwayIndex}].draggable`]: false,
      })
    }
  },
  saveRecord(isPull) {
    api.request(this, '/v2/training/save/extensive', {
      ...this.options
    }, isPull, true, 'POST').catch(() => {
      // 自动保存静默失败
    })
  },
  toExam() {
    // innerAudioContext.stop()
    this.setData({
      audioStatus: 0
    })
    this.navigateTo('../answer-input/index' + api.parseParams(this.options), { checkReady: false })
  },
  toList() {
    const { parts, underwayIndex } = this.data
    this.navigateTo(`../article/index?partId=${parts[underwayIndex].id}`, { checkReady: false })
  },
})