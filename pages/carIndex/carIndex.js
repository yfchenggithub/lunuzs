// pages/carIndex/carIndex.js
import Notify from "../../miniprogram_npm/@vant/weapp/notify/notify"
import * as echarts from "../../ec-canvas/echarts"
let car_index_ec = "";
const app = getApp();
Page({

  /**
   * 页面的初始数据
   */
  data: {
    showCarImageList: false,
    isAdmin: true,
    isAllowSearch: true,
    cardCur: 0,
    swiperList: [],
    current_date: "", //当前时间
    car_name: "", //车牌
    car_index: 0, //指数
    car_num: 0, //车牌ID 对车牌进行编码 
    car_index_ec: {
      lazyLoad: true
    },
    isSubscribe: false,
    car_chart_data: [],
  },

  // 预览图片
  onPreviewImage: function (e) {
    var currentImg = e.target.id
    console.log(currentImg)
    let imgList = this.data.swiperList
    if (imgList.length) {
      wx.previewImage({
        //当前显示图片
        current: currentImg,
        //所有图片
        urls: imgList
      })
    } else {
      wx.previewImage({
        //当前显示图片
        current: currentImg,
        //所有图片
        urls: [currentImg]
      })
    }
  },

  onCopyQQGroupNum(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.text,
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
  toggleShowCarImageList() {
    let state = this.data.showCarImageList
    this.setData({
      showCarImageList: !state
    })
  },

  /// 点击去禁止搜索
  onClickToDisableSearch(e) {
    console.log("onClickToDisableSearch=", e)
    let that = this
    let car_num = this.data.car_num
    if (!car_num) return
    let openid = getApp().globalData.openid
    if (!openid) return
    console.log("openid=", openid)
    console.log("car_num=", car_num)
    // oldState 表示修改之前的搜索状态，oldState=true表示之前是允许搜索，点击一次表示禁止搜索
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'AdminDisableSearch',
        car_num: car_num,
        openid: openid
      },
      success: res => {
        console.log('AdminDisableSearch succ=', res);
        wx.showToast({
          title: '设置禁止搜索成功',
        })
        that.setData({
          isAllowSearch: false
        })
      },
      fail: err => {
        console.log('AdminDisableSearch fail=', err);
      }
    })
  },

  /// 点击去允许搜索
  onClickToAllowSearch(e) {
    console.log("onClickToAllowSearch=", e)
    let that = this
    let car_num = this.data.car_num
    if (!car_num) return
    let openid = getApp().globalData.openid
    if (!openid) return
    console.log("openid=", openid)
    console.log("car_num=", car_num)
    // oldState 表示修改之前的搜索状态，oldState=true表示之前是允许搜索，点击一次表示禁止搜索
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'AdminAllowSearch',
        car_num: car_num,
        openid: openid
      },
      success: res => {
        console.log('AdminAllowSearch succ=', res);
        wx.showToast({
          title: '设置允许搜索成功',
        })
        that.setData({
          isAllowSearch: true
        })
      },
      fail: err => {
        console.log('AdminAllowSearch fail=', err);
      }
    })
  },

  // 修改订阅状态
  onClickToChangeSubscribe(e) {
    console.log("onClickToChangeSubscribe=", e)
    let item = this.data.isSubscribe
    this.setData({
      isSubscribe: !item
    })
    if (item) {
      wx.showToast({
        title: '取消订阅',
      })
    } else {
      wx.showToast({
        title: '已订阅',
      })
    }

    let that = this
    let car_num = this.data.car_num
    if (!car_num) return
    let openid = getApp().globalData.openid
    if (!openid) return
    console.log("openid=", openid)
    console.log("car_num=", car_num)
    // item 表示修改之前的订阅状态，item=true表示之前是已订阅，点击一次表示取消订阅
    if (item) {
      // 取消订阅
      wx.cloud.callFunction({
        name: 'openapi',
        data: {
          action: 'userDelSubscribe',
          car_num: car_num,
          openid: openid
        },
        success: res => {
          console.log('userDelSubscribe succ=', res);
        },
        fail: err => {
          console.log('userDelSubscribe fail=', err);
        }
      })
    } else {
      // 增加订阅
      wx.cloud.callFunction({
        name: 'openapi',
        data: {
          action: 'userAddSubscribe',
          car_num: car_num,
          openid: openid
        },
        success: res => {
          console.log('userAddSubscribe succ=', res);
        },
        fail: err => {
          console.log('userAddSubscribe fail=', err);
        }
      })
    }
  },

  setPieChartData(ec, data) {
    var option = {
      backgroundColor: "#ffffff",
      tooltip: {
        trigger: 'item',
        formatter: '{b}:{c}({d}%)',
        confine: true //将此限制打开后tooltip将不再溢出
      },
      series: [{
        label: {
          normal: {
            fontSize: 14,
            // formatter: '{b}:{c}({d}%)'
          }
        },
        type: 'pie',
        center: ['50%', '50%'],
        radius: ['20%', '40%'],
        data: data,
        selectedMode: 'single', // 点击饼块,脱离圆点一部分,'single'|'multiple',单选和多选
      }]
    };
    ec.setOption(option);
  },

  // 查看一下当前用户是否订阅过这个车
  async checkSubcribeState() {
    let car_num = this.data.car_num
    const db = wx.cloud.database()
    const _ = db.command
    return await new Promise((resolve, reject) => {
        wx.cloud.callFunction({
          name: 'openapi',
          data: {
            action: 'getSubscribeList',
            openid: getApp().globalData.openid
          },
          success: res => {
            console.log("getSubscribeList succ 1111", res)
            resolve(res)
          },
          fail: err => {
            console.log("getSubscribeList fail 1111", err)
            reject(0)
          }
        })
      })
      .then(res => {
        console.log(res)
        if (res.result.data.length != 0) {
          var subscribeList = res.result.data[0].subscribeDataList
          if (subscribeList.indexOf(car_num) == -1) {
            return false
          }
          return true;
        }
      })
  },

  // 获取车的详情信息
  async loadCarImageList() {
    let car_num = Number(this.data.car_num)
    if (!car_num) return
    let that = this
    await wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'loadCarImageList',
        car_num: car_num,
      },
      success: res => {
        let carList = []
        let arrNum = res.result.length
        for (let i = 0; i < arrNum; ++i) {
          let imgNum = res.result[i].images.length
          for (let j = 0; j < imgNum; ++j) {
            if (res.result[i].images[j]) {
              carList.push(res.result[i].images[j])
            }
          }
        }
        that.setData({
          swiperList: carList
        })
        console.log('获取车的照片列表成功 res=', res);
      },
      fail: err => {
        console.log('获取车的照片列表失败 err=', err);
      }
    })
  },

  async loadCarDetail() {
    let car_num = Number(this.data.car_num)
    if (!car_num) return

    let that = this
    await wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'loadCarDetail',
        car_num: car_num,
      },
      success: res => {
        console.log("获取车的详情信息 res=", res)
        let carDetailArr = []
        if (res.result.data.length == 1) {
          // 这里只有一条数据， 只能是一条数据
          var obj = res.result.data[0]
          let goodman = obj.goodman
          if (0 != goodman) {
            var newItem = new Object;
            newItem.name = "好人"
            newItem.value = Number(goodman)
            carDetailArr.push(newItem)
          }
          let farLightDog = obj.farLightDog
          if (0 != farLightDog) {
            var newItem = new Object;
            newItem.name = "远光狗"
            newItem.value = Number(farLightDog)
            carDetailArr.push(newItem)
          }
          let jumpQueueDog = obj.jumpQueueDog
          if (0 != jumpQueueDog) {
            var newItem = new Object;
            newItem.name = "加塞狗"
            newItem.value = Number(jumpQueueDog)
            carDetailArr.push(newItem)
          }
          let justFuckIt = obj.justFuckIt
          if (0 != justFuckIt) {
            var newItem = new Object;
            newItem.name = "sb"
            newItem.value = Number(justFuckIt)
            carDetailArr.push(newItem)
          }
          let occupyEmergency = obj.occupyEmergency
          if (0 != occupyEmergency) {
            var newItem = new Object;
            newItem.name = "占用应急车道"
            newItem.value = Number(occupyEmergency)
            carDetailArr.push(newItem)
          }
          let overLineDrive = obj.overLineDrive
          if (0 != overLineDrive) {
            var newItem = new Object;
            newItem.name = "压线行驶"
            newItem.value = Number(overLineDrive)
            carDetailArr.push(newItem)
          }
          // 一开始只是表示骑线停车 后面把范围扩大了 表示违规停车
          let overLinePark = obj.overLinePark
          if (0 != overLinePark) {
            var newItem = new Object;
            newItem.name = "违规停车"
            newItem.value = Number(overLinePark)
            carDetailArr.push(newItem)
          }
          let reverseDrive = obj.reverseDrive
          if (0 != reverseDrive) {
            var newItem = new Object;
            newItem.name = "逆向行驶"
            newItem.value = Number(reverseDrive)
            carDetailArr.push(newItem)
          }
          let runRedLight = obj.runRedLight
          if (0 != runRedLight) {
            var newItem = new Object;
            newItem.name = "闯红灯"
            newItem.value = Number(runRedLight)
            carDetailArr.push(newItem)
          }
          let slowDog = obj.slowDog
          if (0 != slowDog) {
            var newItem = new Object;
            newItem.name = "龟速狗"
            newItem.value = Number(slowDog)
            carDetailArr.push(newItem)
          }
          let solidLine = obj.solidLine
          if (0 != solidLine) {
            var newItem = new Object;
            newItem.name = "实线变道"
            newItem.value = Number(solidLine)
            carDetailArr.push(newItem)
          }
          let dangerousDrive = obj.dangerousDrive
          if (0 != dangerousDrive) {
            var newItem = new Object;
            newItem.name = "危险驾驶"
            newItem.value = Number(dangerousDrive)
            carDetailArr.push(newItem)
          }
          let notInTheLine = obj.notInTheLine
          if (0 != notInTheLine) {
            var newItem = new Object;
            newItem.name = "不按车道行驶"
            newItem.value = Number(notInTheLine)
            carDetailArr.push(newItem)
          }
          if (carDetailArr.length == 0) {
            var newItem = new Object;
            newItem.name = "暂时没有详细数据"
            newItem.value = Number(0)
            carDetailArr.push(newItem)
          }
        } else {
          var newItem = new Object;
          newItem.name = "暂时没有详细数据"
          newItem.value = Number(0)
          carDetailArr.push(newItem)
        }
        if (car_index_ec) {
          that.setPieChartData(car_index_ec, carDetailArr)
        }
        that.setData({
          car_chart_data: carDetailArr
        })
      },
      fail: err => {
        console.log('获取车的详情信息 err=', err);
      }
    })
  },

  // 初始化饼图
  showPieChart() {
    if (car_index_ec) {
      this.setPieChartData(car_index_ec, this.data.car_chart_data)
    } else {
      let that = this
      let carIndex_ecComponent = this.selectComponent('#mychart-dom-pie-carIndex');
      carIndex_ecComponent.init((canvas, width, height, dpr) => {
        // 获取组件的 canvas、width、height 后的回调函数
        // 在这里初始化图表
        car_index_ec = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr // new
        });
        if (car_index_ec) {
          that.setPieChartData(car_index_ec, that.data.car_chart_data)
        }
        // 注意这里一定要返回 chart 实例，否则会影响事件处理等
        return car_index_ec;
      });
    }
  },

  // 初始化饼图
  initPieChart() {
    let that = this
    let carIndex_ecComponent = this.selectComponent('#mychart-dom-pie-carIndex');
    carIndex_ecComponent.init((canvas, width, height, dpr) => {
      // 获取组件的 canvas、width、height 后的回调函数
      // 在这里初始化图表
      car_index_ec = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // new
      });
      if (car_index_ec) {
        that.setPieChartData(car_index_ec, that.data.car_chart_data)
      }
      // 注意这里一定要返回 chart 实例，否则会影响事件处理等
      return car_index_ec;
    });
  },

  setPieChartClickCallback() {
    if (car_index_ec) {
      car_index_ec.on("click", function (params) {
        console.log("click chart =", params.data.name)
      })
    }
  },

  // page上面有一个截止时间 类似 4月1日
  setCurrentDate() {
    var month = (new Date()).getMonth() + 1;
    var day = (new Date()).getDate()
    var today = month + "月" + day + "日"
    this.setData({
      current_date: today
    })
  },

  // 从别的页面转过来的 需要保存一下参数
  setOption(options) {
    if (options.car) {
      this.setData({
        car_name: options.car
      })
    }
    if (options.carnum) {
      this.setData({
        car_num: Number(options.carnum)
      })
    }
    if (options.carIndex) {
      this.setData({
        car_index: options.carIndex
      })
    }
    if (options.allowSearch) {
      if (0 == options.allowSearch) {
        this.setData({
          isAllowSearch: false
        })
      } else {
        this.setData({
          isAllowSearch: true
        })
      }
    }
  },

  async setSubcribeState() {
    let state = await this.checkSubcribeState()
    this.setData({
      isSubscribe: state
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this.initPieChart()
    this.setCurrentDate()
    this.setOption(options)
    // console.log("carindex admin login")
    // getApp().globalData.isAdmin = false
    this.setData({
      isAdmin: getApp().globalData.isAdmin
    })
    await this.setSubcribeState()
    await this.loadCarDetail()
    await this.loadCarImageList()
  },

  cardSwiper(e) {
    this.setData({
      cardCur: e.detail.current
    })
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    if (car_index_ec) {
      this.setPieChartData(car_index_ec, this.data.car_chart_data)
    } else {
      this.initPieChart()
    }
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
    if (car_index_ec) {
      this.setPieChartData(car_index_ec, this.data.car_chart_data)
    } else {
      this.initPieChart()
    }
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
    // let carname = this.data.car_name + " 被吐槽" + this.data.car_index + "次"
    let carImage = "../../images/home.png"
    // if (this.data.swiperList.length) {
    //   carImage = this.data.swiperList[0]
    // } else {
    //   carImage = "../../images/home.png"
    // }
    return {
      title: getApp().globalData.share_title,
      imageUrl: carImage
    }
  }
})