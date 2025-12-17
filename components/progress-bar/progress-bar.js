Component({
  properties: {
    // 当前进度（从1开始）
    current: {
      type: Number,
      value: 1
    },
    // 总数
    total: {
      type: Number,
      value: 1
    }
  },

  data: {
    percent: 100,
    textMargin: '0px'
  },

  observers: {
    'current, total': function (current, total) {
      // 确保 current 至少为 1
      const validCurrent = Math.max(1, current || 1)
      // 确保 total 至少为 1
      const validTotal = Math.max(1, total || 1)
      // 计算百分比
      const percent = (validCurrent / validTotal) * 100
      this.setData({
        percent,
        textMargin: this.calcTextMargin(percent)
      })
    }
  },

  methods: {
    /**
     * 计算进度文字的安全 margin-left 值
     * 确保进度文字在最左和最右时不会超出容器边界
     */
    calcTextMargin(percent) {
      // 使用 CSS min/max 限制边界
      // 最小 0（左边界），最大 calc(100% - 44px)（右边界，假设文字宽度 44px）
      // 中间值为 percent% - 22px（使文字中心对齐到进度位置）
      return `max(0px, min(calc(${percent}% - 22px), calc(100% - 44px)))`
    }
  }
})
