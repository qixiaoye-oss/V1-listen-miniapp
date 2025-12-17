const audioApi = getApp().audioApi
const pageGuard = require('../../../../behaviors/pageGuard')
const pageLoading = require('../../../../behaviors/pageLoading')

let audio

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {
    list: [],
    endTime: 0,
    stauts: 0,
    scrollIntoId: ''
  },

  onLoad(options) {
    this.startLoading()

    // 从 storage 读取数据
    const list = wx.getStorageSync('listenings')
    if (!list || list.length === 0) {
      wx.showToast({ title: '数据加载失败', icon: 'none' })
      pageGuard.goBack(this)
      return
    }

    // 初始化播放状态
    list.forEach(i => {
      i['audioPlay'] = 'stop'
    })

    this.setData({
      list: list,
      scrollIntoId: 'ID' + options.paragraphId
    })

    this.setDataReady()
    this.finishLoading()
  },

  onShow() {
    // 刷新列表状态（从 storage 同步最新状态）
    const storageList = wx.getStorageSync('listenings')
    if (storageList) {
      storageList.forEach(i => {
        i['audioPlay'] = 'stop'
      })
      this.setData({ list: storageList })
    }

    // 初始化音频
    audio = wx.createInnerAudioContext()
    audio.src = wx.getStorageSync('tempAudioUrl')
    audio.onTimeUpdate(() => {
      const currentTime = Math.floor(audio.currentTime * 100) / 100
      const endTime = this.data.endTime
      if (endTime > 0 && currentTime > (endTime - 0.50)) {
        audio.stop()
        this.audioStop()
      }
    })
  },

  audioStop() {
    const { list } = this.data
    list.forEach(i => {
      i['audioPlay'] = 'stop'
    })
    this.setData({ list: list })
  },

  playAudio(e) {
    audio.stop()
    this.audioStop()

    const { list } = this.data
    const len = list.length
    const nextIdx = e.currentTarget.dataset.idx
    let endTime

    if (nextIdx < (len - 1)) {
      endTime = audioApi.millis2Seconds(list[nextIdx + 1].list[0].startTimeMillis)
    }

    this.setData({
      endTime: endTime,
      stauts: 1
    })

    let startTime = audioApi.millis2Seconds(list[nextIdx].list[0].startTimeMillis)
    if (nextIdx > 0 && startTime <= 0) {
      startTime = audioApi.millis2Seconds(list[nextIdx].list[0].startTimeMillis)
    }

    audio.startTime = startTime
    audio.seek(startTime)
    console.log('音频播放开始时间：', startTime)

    list[nextIdx].audioPlay = 'play'
    this.setData({ list: list })

    this.registerTimer('playAudio', () => {
      audio.play()
    }, 500)
  },

  onHide() {
    if (audio) {
      audio.destroy()
    }
  },

  onUnload() {
    if (audio) {
      audio.destroy()
    }
  },

  /**
   * 跳转到精听详情（防重复点击）
   */
  toDetail(e) {
    this.throttleAction('toDetail', () => {
      const idx = e.currentTarget.dataset.idx

      // 同步最新状态到 storage
      wx.setStorageSync('listenings', this.data.list)

      // 设置上一页的 index
      const pages = getCurrentPages()
      const prevPage = pages[pages.length - 2]
      if (prevPage) {
        prevPage.setData({ index: idx })
      }

      this.navigateBack()
    })
  }
})
