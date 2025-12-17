const api = getApp().api
const pageGuard = require('../../../../behaviors/pageGuard')
const pageLoading = require('../../../../behaviors/pageLoading')

Page({
  behaviors: [pageGuard.behavior, pageLoading],
  data: {
    groups: [
      {
        title: '专项标签',
        icon: '/images/v2/doc.png',
        bgColor: 'rgba(99,89,148, 0.15)',
        items: [
          { key: 'accuracy', label: '正确率', value: 'close' },
          { key: 'answer', label: '答题', value: 'close' },
          {
            key: 'intensive',
            label: '精听',
            tip: '做题错误率超过50%提示需要精听；未超过50%自动标记无需精听（在无需精听情况下，依然可以选择精听）',
            value: 'close'
          }
        ]
      },
      {
        title: '没听懂句子标签',
        icon: '/images/v2/flag_bt.png',
        bgColor: 'rgba(248, 49, 47, 0.15)',
        items: [
          { key: 'review', label: '复习', value: 'close' }
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
    const { key, value } = e.detail
    this.updateSetting(key, value)
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
    const { accuracyDisplay, answerDisplay, intensiveDisplay, reviewDisplay } = res
    const groups = this.data.groups.map(group => ({
      ...group,
      items: group.items.map(item => ({
        ...item,
        value: res[`${item.key}Display`] || 'close'
      }))
    }))
    this.setData({ groups })
  },
  updateSetting(type, state) {
    api.request(this, '/v2/training/setting/special', {
      ...this.options,
      type,
      state
    }, true, true, 'POST').catch(() => {
      api.toast('更新失败')
    })
  },
  // ===========数据获取 End===========
})
