const api = require('./utils/api.js')
const audioApi = require('./utils/audioApi.js')
const pageGuard = require('./behaviors/pageGuard.js')
const CustomHook = require('spa-custom-hooks')

let userData = {
  login: false
}

CustomHook.install({
  'Login': {
    name: 'Login',
    watchKey: 'login',
    deep: true,
    onUpdate(val) {
      return val;
    }
  }
}, userData)

App({
  api: api,
  audioApi: audioApi,
  pageGuard: pageGuard,

  // ============ 预加载相关 ============
  // 首页预加载数据缓存
  homePreloadData: null,
  // 预加载状态：'pending' | 'loading' | 'success' | 'error'
  homePreloadStatus: 'pending',
  // 预加载 Promise（用于首页等待）
  homePreloadPromise: null,
  // 科普数据预加载
  popularSciencePreloadData: null,
  // 是否从后台返回
  _isFromBackground: false,

  /**
   * 预加载首页数据
   * 在登录成功后调用，提前获取首页数据
   */
  preloadHomeData() {
    const _this = this
    this.homePreloadStatus = 'loading'

    // 创建 Promise 供首页等待
    this.homePreloadPromise = new Promise((resolve, reject) => {
      // 并行请求首页数据和科普数据
      Promise.all([
        this._fetchHomeList(),
        this._fetchPopularScience()
      ]).then(([homeData, popularScienceData]) => {
        _this.homePreloadData = homeData
        _this.popularSciencePreloadData = popularScienceData
        _this.homePreloadStatus = 'success'
        resolve({ homeData, popularScienceData })
      }).catch(err => {
        _this.homePreloadStatus = 'error'
        reject(err)
      })
    })

    return this.homePreloadPromise
  },

  /**
   * 获取首页列表数据
   */
  _fetchHomeList() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://listen.jingying.vip/api/listen/home/v1/list',
        method: 'GET',
        header: {
          'Content-Type': 'application/json',
          'Token': wx.getStorageSync('token')
        },
        success(res) {
          if (res.data.code == '200') {
            resolve(res.data.data)
          } else {
            reject(res.data)
          }
        },
        fail(err) {
          reject(err)
        }
      })
    })
  },

  /**
   * 获取科普数据
   */
  _fetchPopularScience() {
    return new Promise((resolve, reject) => {
      wx.request({
        url: 'https://listen.jingying.vip/api/listen/popular/science/v1/miniapp/home',
        method: 'GET',
        header: {
          'Content-Type': 'application/json',
          'Token': wx.getStorageSync('token')
        },
        success(res) {
          if (res.data.code == '200') {
            resolve(res.data.data)
          } else {
            // 科普数据非必需，失败时返回空
            resolve(null)
          }
        },
        fail() {
          // 科普数据非必需，失败时返回空
          resolve(null)
        }
      })
    })
  },

  /**
   * 清除预加载缓存
   * 在需要强制刷新时调用
   */
  clearHomePreloadCache() {
    this.homePreloadData = null
    this.popularSciencePreloadData = null
    this.homePreloadStatus = 'pending'
    this.homePreloadPromise = null
  },

  // ============ 生命周期 ============
  onHide: function () {
    // 进入后台时标记
    this._isFromBackground = true
  },

  onShow: function () {
    // onShow 执行后重置标记（下次进入后台才会再次标记）
    const _this = this
    setTimeout(() => {
      _this._isFromBackground = false
    }, 100)

    if (wx.canIUse('getUpdateManager')) {
      const updateManager = wx.getUpdateManager()
      updateManager.onCheckForUpdate(function (res) {
        if (res.hasUpdate) {
          updateManager.onUpdateReady(function () {
            api.modal('更新提示', '新版本已经准备好，是否重启应用？', false).then(res => {
              updateManager.applyUpdate()
            })
          })
          updateManager.onUpdateFailed(function () {
            wx.showModal({
              title: '已经有新版本了哟~',
              content: '新版本已经上线啦~，请您删除当前小程序，重新搜索打开哟~'
            })
          })
        }
      })
    } else {
      api.modal('提示', '当前微信版本过低，无法使用该功能，请升级到最新微信版本后重试。', false)
    }
  },
  onLaunch: function () {
    if (wx.setScreenBrightness) {
      // 保持屏幕常亮 true / false
      wx.setKeepScreenOn({
        keepScreenOn: true
      });
    }
    // 自动登录
    const _this = this

    // 清除旧 token，避免旧 token 干扰新的登录请求
    const oldToken = wx.getStorageSync('token')
    if (oldToken) {
      console.log('[Login] 清除旧 token')
      wx.removeStorageSync('token')
    }

    wx.login().then(data => {
      api.request(_this, '/user/v1/login', {
        code: data.code
      }, true, false).then(res => {
        wx.setStorageSync('token', res.token)
        userData.login = true
        // 登录成功后立即预加载首页数据
        _this.preloadHomeData()
      })
    })
    // 静音可以播放
    wx.setInnerAudioOption({
      mixWithOther: false,
      obeyMuteSwitch: false
    })
    if (!wx.getStorageSync('AUDIO_PLAY_COUNT')) {
      wx.setStorageSync('AUDIO_PLAY_COUNT', 2)
    }
  }
})