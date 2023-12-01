// pages/voiceSubmit/voiceSubmit.js
const app = getApp()
import Notify from "../../miniprogram_npm/@vant/weapp/notify/notify"
const plugin = requirePlugin('WechatSI')
const manager = plugin.getRecordRecognitionManager()
const { __esModule } = require("../../miniprogram_npm/@vant/weapp/common/color")
let Time = require("../../third/utils/time")
var qqmapsdk;
var QQMapWX = require("../../third/libs/qqmap-wx-jssdk.js")
const key = 'QQDBZ-D5JWX-NU746-ZJDHU-OMSMJ-FGFF4'; //使用在腾讯位置服务申请的key
Page({
  /**
   * 页面的初始数据
   */
  data: {
    src:"",
    currentAddress: "",
    VoiceMode: false, // 语音控制拍照模式
    recordState: false, //录音状态
    content: '', //内容
    recordList: [{
      time: "示例时间",
      place: "示例地点",
      image: "图像1"
    },
  ], //用户纪录的列表，用户点击一次生成一次纪录
  },

  // 对快速纪录进行编辑
  onEditRecord(e) {
    var tmpList = getApp().globalData.userFastRecordList
    const idx = e.currentTarget.dataset.idx
    const newRecord = tmpList[idx]
    wx.redirectTo({
      url: '/pages/textSubmit/textSubmit?time=' + newRecord.time + "&place=" + newRecord.place,
    })
  },

  // 把当前的纪录删除， 有可能用户是误点击。
  onDelRecord(e){
    var tmpList = getApp().globalData.userFastRecordList
    const del_idx = e.currentTarget.dataset.del_idx
    tmpList.splice(del_idx, 1)
    getApp().globalData.userFastRecordList = tmpList
    this.setData({
      recordList: tmpList
    })
  },

  getCurrentTime() {
    var currentTimeStamp = Date.parse(new Date())
    var currentTime = Time.formatTime(currentTimeStamp, 'Y-M-D h:m:s')
    return currentTime
  },

  async getUserLocation() {
    var that = this;
    wx.getSetting({
      success: (res) => {
        // console.log(JSON.stringify(res))
        if (res.authSetting['scope.userLocation'] != undefined && res.authSetting['scope.userLocation'] != true) {
          wx.showModal({
            title: '请求授权当前位置',
            content: '需要获取您的地理位置，请确认授权',
            success: function (res) {
              if (res.cancel) {
                wx.showToast({
                  title: '拒绝授权',
                  icon: 'none',
                  duration: 1000
                })
              } else if (res.confirm) {
                wx.openSetting({
                  success: function (dataAu) {
                    if (dataAu.authSetting["scope.userLocation"] == true) {
                      wx.showToast({
                        title: '授权成功',
                        icon: 'success',
                        duration: 1000
                      })
                      //再次授权，调用wx.getLocation的API
                      that.getLocation();
                    } else {
                      wx.showToast({
                        title: '授权失败',
                        icon: 'none',
                        duration: 1000
                      })
                    }
                  }
                })
              }
            }
          })
        } else if (res.authSetting['scope.userLocation'] == undefined) {
          //调用wx.getLocation的API
          that.getLatitudeAndlongitude();
        } else {
          //调用wx.getLocation的API
          that.getLatitudeAndlongitude();
        }
      }
    })
  },

  
  // 微信获得经纬度
  getLatitudeAndlongitude: function () {
    let that = this;
    wx.getLocation({
      type: 'wgs84',
      isHighAccuracy: true,
      highAccuracyExpireTime:3,
      success: function (res) {
        // console.log(JSON.stringify(res))
        const latitude = res.latitude
        const longitude = res.longitude
        const speed = res.speed
        const accuracy = res.accuracy;
        qqmapsdk.reverseGeocoder({
          location: {
            latitude: latitude,
            longitude: longitude
          },
          success: function (res) {
            let detailed_address = ""
            if (!res.result.formatted_addresses.recommend.includes(res.result.ad_info.province)){
              detailed_address += res.result.ad_info.province
            }
            if (!res.result.formatted_addresses.recommend.includes(res.result.ad_info.city)){
              detailed_address += res.result.ad_info.city
            }
            detailed_address += res.result.formatted_addresses.recommend
            that.setData({
              currentAddress: detailed_address
            })
            var currentTimeStamp = Date.parse(new Date())
            // var currentTime = Time.formatTime(currentTimeStamp, 'Y-M-D h:m:s')
            var currentTime = Time.formatTime(currentTimeStamp, 'Y-M-D')
            var obj = new Object
            obj["time"] = currentTime
            obj["place"] = detailed_address
            obj["image"] = detailed_address
            var newList = getApp().globalData.userFastRecordList.concat(obj)
            getApp().globalData.userFastRecordList = newList
            that.setData({
              recordList:newList
            })
            Notify({
              type: 'success',
              message: '快速纪录成功, 左滑进行编辑'
            })
          },
          fail: function (res) {
            Notify("快速纪录失败")
            console.log(res);
          },
          complete: function (res) {
            console.log(res);
          }
        });
      },
      fail: function (res) {
        console.log('fail' + JSON.stringify(res))
      }
    })
  },

  // 用户在驾驶模式时 可以快速纪录当前的时间 地点
  onfastRecord() {
   this.getUserLocation()
  },

  onChangeToTextMode() {
    wx.redirectTo({
      url: '/pages/textSubmit/textSubmit',
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    this.setData({
      recordList: getApp().globalData.userFastRecordList
    })
    //识别语音
    this.initRecord()
    qqmapsdk = new QQMapWX({
      key: key
    });
  },

  initRecord: function () {
    console.log("initRecord")
    const that = this
    /// 有新的识别内容返回，则会调用此事件
    manager.onRecognize = function (res) {
      Notify("onRecognize")
      console.log("current result", res.result)
    }
    // 正常开始录音识别时会调用此事件
    manager.onStart = function (res) {
      Notify("onStart")
      console.log("成功开始录音识别", res)
    }
    // 识别错误事件
    manager.onError = function (res) {
      Notify("onError")
      console.error("error msg", res.msg)
    }
    // 识别结束事件
    manager.onStop = function (res) {
      Notify("onStop")
      console.log("record file path", res.tempFilePath)
      console.log("result", res.result)
      if (res.result == '') {
        return;
      }
      that.setData({
        content: res.result
      })
    }
  },

  BeginTakePhotoVoice: async function(e) {
    var cur_mode = this.data.VoiceMode
    this.setData({
      VoiceMode: !cur_mode
    })

    var loop = this.data.VoiceMode
    while (loop) {
      // 开始识别
      console.log("start")
      manager.start({
        duration: 30000, // 指定录音的时长，单位ms
        lang: 'zh_CN'
      })
      await new Promise(resolve => setTimeout(resolve, 1000));
      // 结束识别
      manager.stop()
      console.log("stop")
    }
  },

  /// 这个是语音输入, 开始识别
  touchStart: function (e) {
    this.setData({
      recordState: true
    })

    // 开始识别
    manager.start({
      duration: 30000, // 指定录音的时长，单位ms
      lang: 'zh_CN'
    })
  },

  /// 这个是语音输入结束, 
  touchEnd: function (e) {
    this.setData({
      recordState: false
    })

    // 结束识别
    manager.stop()
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    wx.stopPullDownRefresh()
  },

  /**
   * 页面上拉触底事件的处理函数
   */
  onReachBottom: function () {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage: function () {

  },

  takePhoto() {
    const ctx = wx.createCameraContext()
    ctx.takePhoto({
      quality: 'high',
      success: (res) => {
        this.setData({
          src: res.tempImagePath
        })
      }
    })
  },
})