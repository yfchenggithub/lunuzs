// pages/aboutme/aboutme.js
import Notify from "../../miniprogram_npm/@vant/weapp/notify/notify"
Page({

  /**
   * 页面的初始数据
   */
  data: {
    isAdmin: false,
    d_notice: "", // 当前页面的通知栏内容
    share_title:"", // 分享标题
  },

  // 获取文本内容 这个用来发送通知
  getShareTitle() {
    return this.data.share_title
  },

  // 获取文本内容 这个用来发送通知
  getPageInputText() {
    return this.data.d_notice
  },

  // 发送的通知内容
  onNoticeInput(ev) {
    this.setPageInputText(ev.detail)
  },

  onShareTitleInput(ev) {
    this.setShareTitle(ev.detail)
  },

  // 用户输入的文本内容
  setShareTitle(title) {
    this.setData({
      share_title: title
    })
  },

  // 用户输入的文本内容
  setPageInputText(notice) {
    this.setData({
      d_notice: notice
    })
  },
  
  onSettingDefaultShareTitle() {
    wx.showModal({
      title: '系统提示',
      content: "确定要设置默认分享标题吗？",
      success(res) {
        if (res.confirm == true) {
          wx.cloud.callFunction({
            name: 'openapi',
            data: {
              action: 'updateShareTitle',
              content: "退一步越想越气,忍一时越想越亏"
            },
            success: res => {
              Notify("设置默认分享标题成功")
            },
            fail: err => {
              Notify("设设置默认分享标题失败")
            }
          })
        }
      }
    })
  },
  onSettingShareTitle() {
    var share_title = this.getShareTitle()
    if (!share_title) {
      Notify("设置的分享title为空，请重新输入")
      return
    }
    wx.showModal({
      title: '系统提示',
      content: "确定要设置share title吗？",
      success(res) {
        if (res.confirm == true) {
          wx.cloud.callFunction({
            name: 'openapi',
            data: {
              action: 'updateShareTitle',
              content: share_title
            },
            success: res => {
              Notify("设置share title成功")
            },
            fail: err => {
              Notify("设置share title失败")
            }
          })
        }
      }
    })
  },

  // 设置公告栏内容， 首页上面的公告通知
  onSettingNotice() {
    var noticeText = this.getPageInputText()
    if (!noticeText) {
      Notify("设置的公告内容为空，请重新输入")
      return
    }
    wx.showModal({
      title: '系统提示',
      content: "确定要设置首页的公告内容吗？",
      success(res) {
        if (res.confirm == true) {
          wx.cloud.callFunction({
            name: 'openapi',
            data: {
              action: 'updateNotice',
              content: noticeText
            },
            success: res => {
              Notify("设置公告成功")
            },
            fail: err => {
              Notify("设置公告失败")
            }
          })
        }
      }
    })
  },
  // 这里也需要进行init判断， 不能多次初始化，这个是云服务器进行判断
  onInitHistoryIndex() {
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'InitHistoryIndex',
      },
      success: res => {
        Notify({
          type: 'success',
          message: '初始化历史指数成功'
        });
      },
      fail: err => {
        Notify({
          type: 'warning',
          message: '初始化历史指数失败'
        });
      }
    })
  },

  // dayIndex 在这个数据库表中新建一个当天的record, 这样是为了避免每次有用户增加的时候都去判断一把是否有今天的纪录，这样提前新建的话
  // 每次都只要udpate index就可以了， 简化了处理逻辑
  // 需要防止多次初始化, 在云端进行判断这部分
  onInitTodayIndex() {
    var today_ts = Date.parse(new Date())
    var today_date = new Date(today_ts);
    //构造时间数字, 年用10000进行加权，月用100进行加权，日用1进行加权
    var today_number = today_date.getFullYear() * 10000 + (today_date.getMonth() + 1) * 100 + today_date.getDate()
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'InitTodayIndex',
        dateNum: today_number //这里为啥加个参数，因为方便调试用。不冲掉当前的数据。
      },
      success: res => {
        console.log('初始化成功=', res);
        Notify({
          type: 'success',
          message: '初始化当日指数成功'
        });
      },
      fail: err => {
        console.log('获取当日指数失败 err=', err);
        Notify({
          type: 'warning',
          message: '初始化当日指数失败'
        });
      }
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: function (options) {
    if (getApp().globalData.openid == "oDG8P49w_UYTxVFRykAWeMOEJtIU") {
      this.setData({
        isAdmin: true
      })
    }
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
    wx.stopPullDownRefresh({
      success: (res) => {
        Notify({
          type: 'success',
          message: '下拉刷新成功'
        })
      },
    })
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
    let carImage = "../../images/home.png"
    return {
      title: getApp().globalData.share_title,
      imageUrl: carImage
    }
  },

  
  onCopyQQGroupNum(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.num,
      success: function (res) {
        wx.getClipboardData({
          success: (option) => {
            wx.showToast({
              title: '复制QQ群成功',
            })
          },
        })
      }
    })
  },

  onCopyOffcialSite(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.site,
      success: function (res) {
        wx.getClipboardData({
          success: (option) => {
            wx.showToast({
              title: '复制网站成功',
            })
          },
        })
      }
    })
  },
})