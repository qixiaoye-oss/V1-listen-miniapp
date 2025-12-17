/**
 * tap-action 组件
 * 通用点击动效组件，封装点击反馈效果
 * 支持按钮模式和卡片模式
 *
 * 特性：
 * 1. 使用 catchtap 阻止事件冒泡，避免 PC 端调试时事件重复触发
 * 2. 内置 300ms 防重复点击机制，避免快速点击导致多次触发
 */

Component({
  options: {
    multipleSlots: true
  },
  properties: {
    // 类型：button（默认，应用按钮样式）/ card（仅点击动效）
    type: {
      type: String,
      value: 'button'
    },
    // icon 名称，自动映射颜色（仅 button 模式有效）
    icon: {
      type: String,
      value: ''
    },
    // 是否禁用
    disabled: {
      type: Boolean,
      value: false
    },
    // 防重复点击间隔（毫秒），设为 0 则禁用防重复
    throttle: {
      type: Number,
      value: 300
    }
  },
  data: {
    _isTapping: false
  },
  methods: {
    onTap(e) {
      if (this.properties.disabled) return

      // 防重复点击
      const throttle = this.properties.throttle
      if (throttle > 0) {
        if (this.data._isTapping) return
        this.setData({ _isTapping: true })
        setTimeout(() => {
          this.setData({ _isTapping: false })
        }, throttle)
      }

      this.triggerEvent('tap', e.detail)
    }
  }
})
