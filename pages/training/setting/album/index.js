const api = getApp().api
const pageGuard = require('../../../../behaviors/pageGuard')
const pageLoading = require('../../../../behaviors/pageLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {
    mode: 'all',
    groups: [
      {
        title: '完成率统计',
        icon: '/images/v2/correct_bt.png',
        bgColor: 'rgba(0, 210, 106, 0.15)',
        items: [
          {
            key: 'alone',
            label: '单独按是否答题统计完成率',
            value: false
          },
          {
            key: 'all',
            label: '同时按答题以及精听统计完成率',
            value: true
          }
        ]
      }
    ]
  },
  // ===========生命周期 Start===========
  onShow() {
    this.startLoading()
    this.listSetting()
  },
  // ===========生命周期 End===========
  // ===========业务操作 Start===========
  onToggleChange(e) {
    const { key, checked } = e.detail
    const newMode = checked ? key : (key === 'alone' ? 'all' : 'alone')

    // 更新 mode
    this.setData({
      mode: newMode
    })

    // 更新 groups 中的值（互斥开关）
    const groups = this.data.groups.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        value: item.key === newMode
      }))
    }))

    this.setData({ groups })
    this.updateSetting()
  },
  // ===========业务操作 End===========
  // ===========数据获取 Start===========
  listSetting() {
    api.request(this, '/v2/training/list/setting', {
      ...this.options
    }, true, true).then(res => {
      this.updateGroupsFromResponse(res)
      this.finishLoading()
    }).catch(() => {
      pageGuard.goBack(this)
    })
  },
  updateGroupsFromResponse(res) {
    const mode = res.completionRate || 'all'
    const groups = this.data.groups.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        value: item.key === mode
      }))
    }))
    this.setData({ mode, groups })
  },
  updateSetting() {
    api.request(this, '/v2/training/setting/completion', {
      ...this.options,
      state: this.data.mode
    }, true, true, 'POST').catch(() => {
      api.toast('更新失败')
    })
  },
  // ===========数据获取 End===========
})
