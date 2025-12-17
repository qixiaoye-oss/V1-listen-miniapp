const api = getApp().api
const audioApi = getApp().audioApi
const pageGuard = require('../../../../behaviors/pageGuard')
const audioPageLoading = require('../../../../behaviors/audioPageLoading')

let audioContext

Page({
  behaviors: [pageGuard.behavior, audioPageLoading],
  data: {
    list: [],
    detail: null,
    detailIndex: -1,         // 当前编辑的句子在 list 中的索引
    isPc: false,
    showDetail: false,
    isAllRady: false,
    // 音频播放状态
    nowPlayAudio: -1,        // 当前播放的大句子索引
    nowPlaySmallAudio: -1,   // 当前播放的小片段索引
    audioEndTime: 0,         // 当前播放片段结束时间
    playType: 'whole'        // 播放类型：'whole' 整句，'single' 片段
  },
  onLoad(options) {
    this.startAudioPageLoading()
    this.listData()
  },
  onShow() {
    this.isOpenPc()
  },
  onResize() {
    this.isOpenPc()
  },
  onUnload() {
    this.stopAudio()
    if (audioContext) {
      audioContext.destroy()
    }
    audioApi.delAudioFile()
  },
  isOpenPc() {
    const { windowWidth, windowHeight } = wx.getWindowInfo()
    let flag = (windowWidth / windowHeight) > 1
    this.setData({
      isPc: flag,
    })
  },
  // 获取数据
  listData() {
    const _this = this
    api.request(this, '/record/v1/list/label', {
      ...this.options
    }, true).then((res) => {
      // 如果有 audioUrl，预加载音频
      if (res?.audioUrl) {
        return audioApi.initAudio(res.audioUrl, (progress) => {
          _this.updateAudioProgress(progress)
        })
      } else {
        return Promise.resolve(null)
      }
    }).then((audio) => {
      if (audio) {
        audioContext = audio
        _this.audioContextListener()
      }
      _this.setData({ isAllRady: true })
      _this.finishAudioPageLoading()
    }).catch(() => {
      pageGuard.goBack(_this)
    })
  },

  // 音频事件监听
  audioContextListener() {
    if (!audioContext) return

    audioContext.onPlay(() => {})
    audioContext.onStop(() => {
      this.setData({
        nowPlayAudio: -1,
        nowPlaySmallAudio: -1
      })
    })
    audioContext.onPause(() => {
      this.setData({
        nowPlayAudio: -1,
        nowPlaySmallAudio: -1
      })
    })
    audioContext.onEnded(() => {
      this.setData({
        nowPlayAudio: -1,
        nowPlaySmallAudio: -1
      })
    })
    audioContext.onTimeUpdate(() => {
      const { audioEndTime, playType } = this.data
      // 更新当前播放片段高亮
      this.updatePlayingStatus()
      // 片段播放结束检测
      if (playType === 'single' && audioEndTime > 0 && audioContext.currentTime >= audioEndTime) {
        this.stopAudio()
      }
    })
    audioContext.onError((err) => {
      console.error('[intensive-notes] 音频错误:', err)
    })
  },

  // 更新播放状态（高亮当前片段）
  updatePlayingStatus() {
    const { nowPlayAudio, list, playType } = this.data
    if (nowPlayAudio < 0 || !list || !list[nowPlayAudio]) return

    const sentence = list[nowPlayAudio].list
    if (!sentence) return

    for (let i = 0; i < sentence.length; i++) {
      const leftTime = audioApi.millis2Seconds(sentence[i].startTimeMillis) - 0.1
      const rightTime = audioApi.millis2Seconds(sentence[i].endTimeMillis)
      if (audioContext.currentTime >= leftTime && audioContext.currentTime <= rightTime) {
        if (this.data.nowPlaySmallAudio !== i) {
          this.setData({ nowPlaySmallAudio: i })
        }
        return
      }
    }
  },

  // 停止音频
  stopAudio() {
    if (audioContext && !audioContext.paused) {
      audioContext.stop()
    }
    this.setData({
      nowPlayAudio: -1,
      nowPlaySmallAudio: -1
    })
  },

  // 播放整个句子（由子组件触发）
  onPlayAudio({ detail }) {
    const { index } = detail
    const { nowPlayAudio, list } = this.data

    // 如果点击当前正在播放的，则暂停
    if (nowPlayAudio === index) {
      this.stopAudio()
      return
    }

    this.stopAudio()
    if (!audioContext || !list || !list[index]) return

    const paragraph = list[index]
    if (!paragraph.startTimeMillis) return

    let startTime = audioApi.millis2Seconds(paragraph.startTimeMillis)
    startTime = startTime === 0 ? startTime : (startTime - 0.1)

    this.setData({
      nowPlayAudio: index,
      audioEndTime: audioApi.millis2Seconds(paragraph.endTimeMillis),
      playType: 'whole'
    })

    audioContext.seek(startTime)
    audioContext.play()
  },

  // 播放单个片段（由子组件触发）
  onPlaySegment({ detail }) {
    const { sentenceIndex, segmentIndex } = detail
    const { list } = this.data

    this.stopAudio()
    if (!audioContext || !list || !list[sentenceIndex]) return

    const segment = list[sentenceIndex].list?.[segmentIndex]
    if (!segment || !segment.startTimeMillis) {
      // 仅高亮
      this.setData({
        nowPlayAudio: sentenceIndex,
        nowPlaySmallAudio: segmentIndex
      })
      return
    }

    let startTime = audioApi.millis2Seconds(segment.startTimeMillis)
    startTime = startTime === 0 ? startTime : (startTime - 0.1)

    this.setData({
      nowPlayAudio: sentenceIndex,
      nowPlaySmallAudio: segmentIndex,
      audioEndTime: audioApi.millis2Seconds(segment.endTimeMillis),
      playType: 'single'
    })

    audioContext.seek(startTime)
    audioContext.play()
  },
  toEditPage({ detail }) {
    let { list } = this.data
    let detailIndex = -1
    list.forEach((item, index) => {
      item.active = item.id === detail.id
      if (item.id === detail.id) {
        detailIndex = index
      }
    });
    this.setData({ detail, detailIndex, showDetail: true, list })
  },
  editOver({ detail }) {
    const { list } = this.data
    if (detail.errMsg == 'ok') {
      let index = list.findIndex((i) => i.id === detail.id)
      this.setData({
        [`list[${index}].reviseContent`]: detail.html
      })
      this.editRecord({
        id: detail.id,
        reviseContent: detail.html
      })
    }
    this.setData({ showDetail: false })
  },
  editRecord(answer, showToast = true) {
    api.request(this, '/record/v1/save/revise', answer, false, 'post').then(() => {
      if (showToast) {
        api.toast('保存成功')
      }
    }).catch(() => {
      // 保存失败仅提示
    })
  },
  // 实时自动保存
  autoSave({ detail }) {
    const { list } = this.data
    if (detail.id) {
      let index = list.findIndex((i) => i.id === detail.id)
      if (index !== -1) {
        this.setData({
          [`list[${index}].reviseContent`]: detail.html
        })
        this.editRecord({
          id: detail.id,
          reviseContent: detail.html
        }, false) // 静默保存，不显示提示
      }
    }
  },
  returnPage() {
    this.navigateBack()
  }
})