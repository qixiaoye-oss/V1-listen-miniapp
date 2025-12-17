const api = getApp().api
const pageGuard = require('../../../behaviors/pageGuard')

Page({
  behaviors: [pageGuard.behavior],
  data: {
    inputVal: "",
    hideScroll: true,
    inputShowed: true,
    userList: [],
    roleList: [],
  },
  inputTyping(e) {
    this.cancelTimer('searchUser')
    this.setData({
      inputVal: e.detail.value,
      hideScroll: false,
      inputShowed: true
    })
    this.registerTimer('searchUser', () => {
      this.listUser()
    }, 1000)
  },
  clearInput() {
    this.setData({
      inputVal: "",
      hideScroll: true,
      inputShowed: true
    })
  },
  hideInput() {
    this.setData({
      inputVal: "",
      hideScroll: true,
      inputShowed: true,
      userList: []
    });
  },
  offline: function (e) {
    this.setData({
      hideScroll: true,
      inputShowed: false,
      userId: e.currentTarget.id,
      userName: e.currentTarget.dataset.item.nickName,
    });
    // 查询已经关联的角色
    this.listUserRole(e.currentTarget.id)
  },
  listUser() {
    api.request(this, '/user/listUserByName', {
      nameOrId: this.data.inputVal
    }, true).catch(() => {
      // 搜索失败仅提示
    })
  },
  listUserRole(userId) {
    api.request(this, '/user/listUserRole', {
      userId: userId
    }, true).catch(() => {
      // 查询失败仅提示
    })
  },
  submit: function (e) {
    let param = {
      roleUser: e.detail.value.roleResource.join(','),
      userId: e.detail.value.userId
    }
    api.request(this, '/user/saveUserRole', param, true, "POST").then(res => {
      api.toast("保存成功")
    }).catch(() => {
      // 保存失败仅提示
    })
  },
})