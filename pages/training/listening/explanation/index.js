const api = getApp().api
const pageGuard = require('../../../../behaviors/pageGuard')
const audioPageLoading = require('../../../../behaviors/audioPageLoading')
const audioApi = require('../../../../utils/audioApi')

let audio
Page({
  // 注：此页面音频为流式加载，不需要下载进度遮罩，仅使用 pageLoading 功能
  behaviors: [pageGuard.behavior, audioPageLoading],
  data: {
    audioPlay: false,
    noReady: true,
    htmlStyle: {
      p: 'margin-bottom:14px'
    },
    showHidden: false,
    playingSmallIndex: -1,  // 当前高亮的片段索引
    currentSentenceIdx: -1, // 当前播放的句子索引
    audioEndTime: 0,        // 当前播放片段的结束时间
    playType: 'whole'       // 播放类型：'whole' 整体播放，'single' 单片段播放
  },
  onLoad: function (options) {
    this.startLoading()
    this.getDetail(true)
  },
  onShow: function () {
    audio = wx.createInnerAudioContext()
    audio.onPlay(() => {
      this.setData({
        audioPlay: true
      })
    })
    audio.onCanplay(() => {
      this.setData({
        noReady: false
      })
    })
    audio.onTimeUpdate(() => {
      const { startTimeMillis, endTimeMillis } = this.data.question
      const { audioEndTime, playType } = this.data
      let startTime = audioApi.millis2Seconds(startTimeMillis)
      let endTime = audio.duration
      if (endTimeMillis != 0) {
        endTime = audioApi.millis2Seconds(endTimeMillis)
      }

      // 更新当前播放片段的高亮状态
      this.setSentencePlayingStatus()

      // 单片段播放模式：到达片段结束时间则停止
      if (playType === 'single' && audioEndTime > 0 && audio.currentTime >= audioEndTime) {
        audio.pause()
        this.setData({
          audioPlay: false,
          playingSmallIndex: -1,
          currentSentenceIdx: -1
        })
        return
      }

      // 整体播放模式：到达整体结束时间则停止
      if (audio.currentTime >= endTime) {
        audio.stop()
        audio.startTime = startTime
        audio.seek(startTime)
        this.setData({
          audioPlay: false,
          playingSmallIndex: -1,
          currentSentenceIdx: -1
        })
      }
    })
    audio.onEnded(() => {
      const { startTimeMillis } = this.data.question
      let startTime = audioApi.millis2Seconds(startTimeMillis)
      audio.stop()
      audio.startTime = startTime
      audio.seek(startTime)
      this.setData({
        audioPlay: false,
        playingSmallIndex: -1,
        currentSentenceIdx: -1
      })
    })
    audio.onError(res => {
      console.error('[explanation] 音频错误:', res)
    })
  },
  stopAudio() {
    audio.pause()
    this.setData({
      audioPlay: false,
      playingSmallIndex: -1,
      currentSentenceIdx: -1
    })
  },
  play(e) {
    // if (!this.data.noReady) {
    //   api.toast("音频还没准备好！")
    //   return
    // }
    this.stopAudio()
    this.setData({ playType: 'whole' })
    audio.play()
  },

  // 点击片段播放（与 intensive 页面一致）
  listenSentenceAgain(e) {
    this.stopAudio()
    const { question } = this.data
    if (!question || !question.sentenceList) return

    const sentenceIdx = Number(e.detail?.sentenceIdx ?? 0)
    const idx = Number(e.detail?.index ?? e.detail?.idx ?? 0)

    // 找到对应的句子和片段
    const sentenceList = question.sentenceList
    if (!sentenceList[sentenceIdx] || !sentenceList[sentenceIdx].list) return

    const sentence = sentenceList[sentenceIdx].list[idx]
    if (!sentence) return

    // 如果没有时间戳数据，只做高亮不播放
    if (sentence.startTimeMillis === undefined || sentence.startTimeMillis === null) {
      this.setData({
        playingSmallIndex: idx,
        currentSentenceIdx: sentenceIdx
      })
      return
    }

    this.setData({
      audioEndTime: audioApi.millis2Seconds(sentence.endTimeMillis),
      playingSmallIndex: idx,
      currentSentenceIdx: sentenceIdx,
      playType: 'single'
    })

    let startTime = audioApi.millis2Seconds(sentence.startTimeMillis)
    startTime = startTime === 0 ? startTime : (startTime - 0.1)

    audio.seek(startTime)
    audio.play()
  },

  // 根据当前播放时间更新高亮状态
  setSentencePlayingStatus() {
    const { question } = this.data
    if (!question?.sentenceList) return

    // 遍历所有句子和片段，找到当前播放位置
    for (let sIdx = 0; sIdx < question.sentenceList.length; sIdx++) {
      const list = question.sentenceList[sIdx].list
      if (!list) continue

      for (let i = 0; i < list.length; i++) {
        const leftTime = audioApi.millis2Seconds(list[i].startTimeMillis) - 0.1
        const rightTime = audioApi.millis2Seconds(list[i].endTimeMillis)

        if (audio.currentTime >= leftTime && audio.currentTime <= rightTime) {
          if (this.data.currentSentenceIdx !== sIdx || this.data.playingSmallIndex !== i) {
            this.setData({ currentSentenceIdx: sIdx, playingSmallIndex: i })
          }
          return
        }
      }
    }
  },
  onHide() {
    this.stopAudio()
  },
  onUnload: function () {
    audio.destroy()
    let tempUrl = wx.getStorageSync('tempAudioUrl')
    wx.getFileSystemManager().removeSavedFile({
      filePath: tempUrl
    })
    wx.removeStorageSync('tempAudioUrl')
  },
  showHidden() {
    this.setData({
      showHidden: !this.data.showHidden
    })
  },
  getDetail(isPull) {
    const _this = this
    api.request(this, '/question/v1/analysis/question/miniapp', { ...this.options }, isPull).then(res => {
      let startTime = audioApi.millis2Seconds(res.question.startTimeMillis)
      audio.src = res.audioUrl
      audio.startTime = startTime
      audio.seek(startTime)
      _this.setDataReady()
      _this.finishLoading()
    }).catch(() => {
      pageGuard.goBack(_this)
    })
  },
  checkImg(e) {
    wx.previewImage({
      urls: [this.data.detail.imageUrl],
    })
  },
})