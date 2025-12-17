function initAudio(src, onProgress) {
  return new Promise((resolve, reject) => {
    // 如果没有传入进度回调，使用原生 loading
    if (!onProgress) {
      wx.showLoading({
        title: '音频准备中...',
        mask: true
      })
    }
    const audio = wx.createInnerAudioContext()
    let timer
    audio.onCanplay(() => {
      if (!onProgress) {
        wx.hideLoading()
      }
      clearTimeout(timer)
      resolve(audio)
    })
    audio.onError(() => {
      if (!onProgress) {
        wx.hideLoading()
      }
      clearTimeout(timer)
      resolve(audio)
      modal("", "本模块电脑版播放功能需要等待微信官方更新，目前手机/平板可以正常播放。", false)
    })
    const downloadTask = wx.downloadFile({
      url: src,
      success: ({
        tempFilePath,
        statusCode
      }) => {
        if (statusCode === 200) {
          audio.src = tempFilePath
          audio.duration
          wx.setStorageSync('tempAudioUrl', tempFilePath)
          resolve(audio)
        }
      },
      fail(res) {
        console.log(res);
        if (onProgress) {
          onProgress(100) // 失败时也要关闭进度
        }
      }
    })
    // 监听下载进度
    if (onProgress) {
      downloadTask.onProgressUpdate((res) => {
        onProgress(res.progress)
      })
    }
  })
}

function delAudioFile() {
  let tempUrl = wx.getStorageSync('tempAudioUrl')
  wx.getFileSystemManager().removeSavedFile({
    filePath: tempUrl
  })
  wx.removeStorageSync('tempAudioUrl')
}

function formatAudioTime(val) {
  let nval = Number(val).toFixed(3)
  return Number(nval)
}
/**
 * 将毫秒转换为秒
 * @param {number} milliseconds - 毫秒数
 * @returns {number} 对应的秒数
 */
function millis2Seconds(milliseconds) {
  if (typeof milliseconds !== 'number' || isNaN(milliseconds)) {
    throw new Error('输入必须是有效数字');
  }
  return milliseconds / 1000;
}

/**
 * 将秒转换为毫秒
 * @param {number} seconds - 秒数
 * @returns {number} 对应的毫秒数
 */
function seconds2Millis(seconds) {
  if (typeof seconds !== 'number' || isNaN(seconds)) {
    throw new Error('输入必须是有效数字');
  }
  return seconds * 1000;
}

function audioErr(err, url) {
  const { brand, model, platform, system } = wx.getDeviceInfo()
  const { SDKVersion, version } = wx.getAppBaseInfo()
  wx.request({
    url: uri + '/user/addLog',
    method: "POST",
    data: {
      audioUrl: url,
      userId: getUserId(),
      logContent: JSON.stringify(err),
      brand: brand,
      model: model,
      version: version,
      system: system,
      platform: platform,
      sdkversion: SDKVersion
    },
    header: {
      'Content-Type': 'application/json'
    },
  })
}

module.exports = {
  initAudio: initAudio,
  delAudioFile: delAudioFile,
  formatAudioTime: formatAudioTime,
  millis2Seconds: millis2Seconds,
  seconds2Millis: seconds2Millis,
  audioErr: audioErr,
}