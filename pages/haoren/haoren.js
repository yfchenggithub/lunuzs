// pages/haoren/haoren.js
import Notify from "../../miniprogram_npm/@vant/weapp/notify/notify"

Page({

  /**
   * 页面的初始数据
   */
  data: {
    latest_haoren_list: [], // 最新好人提交列表， 可以在当前页面中展示
  },

  /// 获取最新的提交历史，一般弄个五条就足够
  async getLatestSubmitList() {
    let that = this
    const db = wx.cloud.database()
    const _ = db.command
    let getlatestCommitListPro = new Promise((resolve, reject) => {
      db.collection("carIndex")
        .where({
          car_comment: db.RegExp({
            regexp: '好人',
            options: 'i',
          })
        })
        .orderBy('_createTime', 'desc')
        .limit(10)
        .get()
        .then(res => {
          resolve(res)
        })
        .catch(err => {
          reject(err)
        })
    })

    getlatestCommitListPro.then(res => {
      let result_list = res.data
      let tmpArr = []
      for (let i = 0; i < result_list.length; ++i) {
        if (res.data[i].car_num == "苏A0Z8M0") {
          continue;
        }
        var newItem = new Object;
        newItem.car_name = res.data[i].car_num
        newItem.car_comment = res.data[i].car_comment
        newItem.car_digit = res.data[i].car_digit
        newItem.car_num = res.data[i].car_digit
        newItem.car_time = res.data[i].car_time
        newItem.space = " "
        newItem.car_index = 1
        tmpArr.push(newItem)
      }
      that.setData({
        latest_haoren_list: tmpArr
      })
    })
  },

  /**
   * 生命周期函数--监听页面加载
   */
  onLoad(options) {
    this.getLatestSubmitList()
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady() {

  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow() {

  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide() {

  },

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload() {

  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh() {
    this.getLatestSubmitList()
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
  onReachBottom() {

  },

  /**
   * 用户点击右上角分享
   */
  onShareAppMessage() {
    let carImage = "../../images/home.png"
    return {
      // title: getApp().globalData.share_title,
      title: "文明驾驶，分享小程序收益",
      imageUrl: carImage
    }
  }
})