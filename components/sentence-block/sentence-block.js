Component({
  properties: {
    // 原文片段列表 [{content: 'xxx'}, ...]
    list: {
      type: Array,
      value: []
    },
    // 翻译内容
    translate: {
      type: String,
      value: ''
    },
    // 当前激活（高亮）的片段索引，-1 表示无激活
    activeIndex: {
      type: Number,
      value: -1
    },
    // 是否遮罩（原文+翻译同时遮罩）
    hidden: {
      type: Boolean,
      value: false
    },
    // 元素 id 前缀（用于滚动定位，生成 id 为 idPrefix + index）
    idPrefix: {
      type: String,
      value: 'T'
    },
    // 句子索引（用于多句子场景，区分是哪个句子被点击）
    sentenceIdx: {
      type: Number,
      value: 0
    }
  },
  methods: {
    // 点击原文片段触发
    handleTap(e) {
      const index = e.currentTarget.dataset.idx
      this.triggerEvent('segmenttap', {
        index: index,
        sentenceIdx: this.data.sentenceIdx,
        ...e.currentTarget.dataset
      })
    }
  }
})
