Component({
  /**
   * 组件的属性列表
   */
  properties: {
    // 分组配置数据
    groups: {
      type: Array,
      value: []
    },
    // 开关颜色
    switchColor: {
      type: String,
      value: 'rgba(0, 210, 106, 1)'
    }
  },

  /**
   * 组件的初始数据
   */
  data: {},

  /**
   * 组件的方法列表
   */
  methods: {
    /**
     * 处理开关切换事件
     */
    handleSwitchChange(e) {
      const { groupIndex, itemIndex, key } = e.currentTarget.dataset
      const checked = e.detail.value
      const value = checked ? 'open' : 'close'

      // 更新本地数据
      const updatePath = `groups[${groupIndex}].items[${itemIndex}].value`
      this.setData({
        [updatePath]: value
      })

      // 触发自定义事件，通知父组件
      this.triggerEvent('change', {
        key,
        value,
        checked,
        groupIndex,
        itemIndex
      })
    }
  }
})
