const api = getApp().api

Component({
  properties: {
    list: Array,
    // 从父页面接收的播放状态
    nowPlayAudio: {
      type: Number,
      value: -1
    },
    nowPlaySmallAudio: {
      type: Number,
      value: -1
    }
  },
  data: {
    showHidden: false
  },
  methods: {
    // 前往编辑
    toEditPage(e) {
      const { item } = e.currentTarget.dataset
      this.triggerEvent('edit', item)
    },
    // 播放音频（触发事件由父页面处理）
    playAudio(e) {
      const { index } = e.currentTarget.dataset
      this.triggerEvent('playAudio', { index })
    },
    // 点击片段播放（触发事件由父页面处理）
    onSegmentTap(e) {
      const { sentenceIndex } = e.currentTarget.dataset
      const segmentIndex = Number(e.detail?.index ?? e.detail?.idx ?? 0)
      this.triggerEvent('playSegment', { sentenceIndex, segmentIndex })
    },
    // 显示/隐藏内容
    showContent(e) {
      const { index } = e.currentTarget.dataset
      const list = this.properties.list
      list[index].show = !list[index].show
      this.setData({ list })
    },
    // 设置操作
    operation(e) {
      const { index, hidden } = e.currentTarget.dataset
      // TODO: 实现设置操作（如隐藏/显示此项）
    },
    // 切换显示隐藏项
    showHidden() {
      this.setData({ showHidden: !this.data.showHidden })
    },
    // 复习状态切换
    againButChange(e) {
      const { index } = e.currentTarget.dataset
      const { value } = e.target.dataset
      const list = this.properties.list
      list[index].status = value
      this.setData({ list })
    },
    // 打卡
    review() {
      this.triggerEvent('review')
    },
    // 保存并返回
    onReturnTap() {
      this.triggerEvent('return')
    }
  }
})
