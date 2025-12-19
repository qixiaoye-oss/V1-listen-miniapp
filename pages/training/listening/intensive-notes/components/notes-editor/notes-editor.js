const api = getApp().api

Component({
  properties: {
    detail: Object,
    // 当前 detail 在 list 中的索引
    detailIndex: {
      type: Number,
      value: -1
    },
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
    formats: {},
    editorCtx: null,
    editorKey: true,
    showPl: true,
    // 保存状态：'empty' | 'saving' | 'saved' | 'failed'
    saveStatus: 'empty',
    // 上次保存的内容（用于对比变化）
    lastSavedContent: ''
  },
  observers: {
    // 监听 detail 变化，重置编辑器和保存状态
    'detail.reviseContent': function (val) {
      // 销毁富文本编辑器
      this.setData({ editorKey: false, formats: {} })
      setTimeout(() => {
        // 创建新的富文本编辑器
        this.setData({ editorKey: true })
      }, 50);
    },
    // 监听 detail.id 变化，重置保存状态
    'detail.id': function (val) {
      if (val) {
        const { detail } = this.data
        const hasContent = detail && detail.reviseContent && detail.reviseContent.trim()
        this.setData({
          saveStatus: hasContent ? 'saved' : 'empty',
          lastSavedContent: detail?.reviseContent || ''
        })
      }
    }
  },
  methods: {
    // 点击片段播放（触发事件由父页面处理）
    listenSentenceAgain(e) {
      const segmentIndex = Number(e.detail?.index ?? e.detail?.idx ?? 0)
      const { detailIndex } = this.properties
      this.triggerEvent('playSegment', {
        sentenceIndex: detailIndex,
        segmentIndex
      })
    },
    // 点击保存按钮（仅在保存失败状态下可点击，用于重试）
    saveUserAnswer() {
      const { saveStatus } = this.data
      if (saveStatus !== 'failed') return
      this.doSave()
    },
    // 执行保存操作
    doSave() {
      const { editorCtx, detail, lastSavedContent } = this.data
      if (!editorCtx || !detail?.id) return

      editorCtx.getContents({
        success: (res) => {
          const currentContent = res.html || ''
          const currentText = (res.text || '').trim()

          // 内容为空
          if (!currentText) {
            this.setData({ saveStatus: 'empty', lastSavedContent: '' })
            return
          }

          // 内容无变化，直接标记已保存
          if (currentContent === lastSavedContent) {
            this.setData({ saveStatus: 'saved' })
            return
          }

          // 设置保存中状态
          this.setData({ saveStatus: 'saving' })

          // 触发保存事件，由父页面调用API
          this.triggerEvent('save', {
            id: detail.id,
            html: currentContent,
            text: currentText
          })
        }
      })
    },
    // 保存成功回调（由父页面调用）
    onSaveSuccess(html) {
      this.setData({
        saveStatus: 'saved',
        lastSavedContent: html
      })
    },
    // 保存失败回调（由父页面调用）
    onSaveFailed() {
      this.setData({ saveStatus: 'failed' })
    },
    // 编辑器内容变化时触发（防抖自动保存）
    onEditorInput() {
      const { editorCtx, lastSavedContent, detail } = this.data
      if (!editorCtx) return

      // 清除之前的防抖定时器
      if (this.saveTimer) {
        clearTimeout(this.saveTimer)
      }

      // 获取当前内容判断状态
      editorCtx.getContents({
        success: (res) => {
          const currentText = (res.text || '').trim()
          const currentContent = res.html || ''

          // 内容为空
          if (!currentText) {
            this.setData({ saveStatus: 'empty', showPl: true })
            return
          }

          this.setData({ showPl: false })

          // 内容无变化，保持已保存状态
          if (currentContent === lastSavedContent) {
            this.setData({ saveStatus: 'saved' })
            return
          }

          // 有变化，显示保存中并启动防抖保存
          this.setData({ saveStatus: 'saving' })

          this.saveTimer = setTimeout(() => {
            this.doSave()
          }, 500)
        }
      })
    },
    // 富文本编辑器准备完毕
    onEditorReady() {
      const { detail } = this.data
      const _this = this
      wx.createSelectorQuery().in(this).select('#editor').context(function (res) {
        if (!res) {
          return
        }
        const editorCtx = res.context
        // 设定默认样式，1.4倍行距
        editorCtx.setContents({
          delta: {
            ops: [{
              insert: '\n',
              attributes: {
                'line-height': '1.4em', // 明确单位
                'paragraph': true // 确保段落结构
              }
            }]
          }
        })

        const hasContent = detail.reviseContent && detail.reviseContent.trim()
        if (hasContent) {
          // 当存在内容时直接赋值到富文本编辑器中
          editorCtx.setContents({
            html: detail.reviseContent
          })
        }

        // 初始化保存状态
        _this.setData({
          editorCtx,
          showPl: !hasContent,
          saveStatus: hasContent ? 'saved' : 'empty',
          lastSavedContent: detail.reviseContent || ''
        })
      }).exec()
    },
    // 设定样式
    format(e) {
      const { editorCtx } = this.data
      let { name, value } = e.target.dataset
      if (!name) return
      editorCtx.format(name, value)
    },
    // 删除所有样式
    removeFormat() {
      const { editorCtx } = this.data
      editorCtx.removeFormat()
    },
    onStatusChange(e) {
      const formats = e.detail
      this.setData({ formats })
    },
    textareaFocus() {
      this.setData({ showPl: false })
    },
    textareaBlur() {
      // 失焦时触发保存
      if (this.saveTimer) {
        clearTimeout(this.saveTimer)
      }
      this.doSave()
    }
  }
})