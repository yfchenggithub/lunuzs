// pages/index/index.js
import Notify from "../../miniprogram_npm/@vant/weapp/notify/notify"
import * as echarts from "../../ec-canvas/echarts"
let Time = require("../../third/utils/time")
var last7daysTodayIdxObj = []
let history_index_line_chart = "";
let history_index_pie_chart = "";
// let today_index_ec = "";

function getXtimeArray() {
  var currentTimeStamp = Date.parse(new Date())
  var currentTime = Time.formatTime(currentTimeStamp, 'M/D')
  return currentTime
}

function getXAxistime(ts) {
  var currentTime = Time.formatTime(ts, 'M/D')
  return currentTime
}

// 获取最近7天的当日指数
async function getLast7DaysHistoryIdx() {
  // last6 作为基准， 然后数据库中只要取到比这个大的就可以
  var last6dayTs = Date.parse(new Date()) - 6 * 24 * 3600 * 1000
  // 20220312 返回这样的数字， 这样可以直接用来对比
  const last6daynum = Time.genTimeStampNum(last6dayTs)

  return await new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'getCarLast7DayHistoryIndex',
        dateNum: last6daynum
      },
      success: res => {
        console.log('获取最近7天的历史指数 res=', res);
        if (res.result.data.length) {
          resolve(res.result.data)
        } else {
          // 这个地方只是不暴露给用户， 其实系统数据库应该是有问题， 没有创建当天的当日指数
          resolve([])
        }
      },
      fail: err => {
        console.log('获取当日指数失败 err=', err);
        reject(err)
      }
    })
  })
}

// 获取最近7天的当日指数
async function getLast7DaysTodayIdx() {
  // last6 作为基准， 然后数据库中只要取到比这个大的就可以
  var last6dayTs = Date.parse(new Date()) - 6 * 24 * 3600 * 1000
  // 20220312 返回这样的数字， 这样可以直接用来对比
  const last6daynum = Time.genTimeStampNum(last6dayTs)

  return await new Promise((resolve, reject) => {
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'getCarLast7DayTodayIndex',
        dateNum: last6daynum
      },
      success: res => {
        console.log('获取最近7天的当日指数 res=', res);
        if (res.result.data.length) {
          resolve(res.result.data)
        } else {
          // 这个地方只是不暴露给用户， 其实系统数据库应该是有问题， 没有创建当天的当日指数
          resolve([])
        }
      },
      fail: err => {
        console.log('获取当日指数失败 err=', err);
        reject(err)
      }
    })
  })
}

function getX7DaysArray() {
  var last7ts = Date.parse(new Date()) - 6 * 24 * 3600 * 1000
  var x7DaysArray = []
  for (let i = 0; i < 7; ++i) {
    var item = getXAxistime(last7ts)
    x7DaysArray.push(item)
    last7ts += 24 * 3600 * 1000;
  }
  return x7DaysArray
}

function initTodayChart(canvas, width, height, dpr) {
  console.log("initTodayChart")
  const chart = echarts.init(canvas, null, {
    width: width,
    height: height,
    devicePixelRatio: dpr // new
  });
  canvas.setChart(chart);

  var xAxisTime = getX7DaysArray()
  // last7daysTodayidx = await getY7DaysTodayIdxArray();
  // var last7days = []
  // for (let i=0; i<last7daysTodayidx.length; ++i) {
  //   last7days.push(last7daysTodayidx[i].index)
  // }
  var option = {
    title: {
      text: '当日指数',
      left: 'center'
    },
    legend: {
      data: ['当日指数'],
      top: 50,
      left: 'center',
      backgroundColor: '#fff',
      z: 100
    },
    grid: {
      containLabel: true
    },
    tooltip: {
      show: true,
      trigger: 'axis'
    },
    xAxis: {
      type: 'category',
      boundaryGap: false,
      // data: ['周一', '周二', '周三', '周四', '周五', '周六', '3/12'],
      data: xAxisTime,
      // show: false
    },
    yAxis: {
      x: 'center',
      type: 'value',
      splitLine: {
        lineStyle: {
          type: 'dashed'
        }
      }
      // show: false
    },
    series: [{
      name: '当日指数',
      type: 'line',
      smooth: true,
      data: [18, 36, 65, 30, 78, 40, 33]
      // data: last7days
    }]
  };

  chart.setOption(option);
  return chart;
}

Page({

  /**
   * 页面的初始数据
   */
  data: {
    is_admin: false,
    d_notice: "", // 当前页面的通知栏内容
    share_title: "", // 当前分享标题
    history_pie_chart_data: [], //那个饼图的数据，一个是初始化chart  一个是获取chart需要的数据
    history_line_chart_data: [], //那个线图的数据，一个是初始化chart  一个是获取chart需要的数据
    // 路怒症指数的饼图
    // history_index_pie_ec: {
    //   lazyLoad: true
    // },
    latest_submit_list: [], // 最新提交列表， 可以在当前页面中展示
    user_subscribe_list: [], // 用户订阅历史，可以在当前页面中展示
    user_search_history_list: [], // 用户搜索历史，可以在当前页面中展示
    // 路怒症指数的线图
    history_index_line_chart: {
      lazyLoad: true
    },
    history_index_pie_chart: {
      lazyLoad: true
    },
    showdot: true, //这个可以用来触发用户去交互
    openid: "",
    score_: 0,
    // history_index: 0,
    // today_index: 0,
    show: false,
    actions: [{
        name: '普通模式',
      },
      // {
      //   name: '驾驶模式',
      // },
      {
        name: '分享好友',
        openType: 'share',
      },
    ],
  },

  onCopySlogan(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.text,
      success: function (res) {
        wx.getClipboardData({
          success: (option) => {
            wx.showToast({
              title: '复制路怒症指数',
            })
          },
        })
      }
    })
  },

  onClickCancelAllSubs() {
    this.setData({
      user_subscribe_list: []
    })
    //去数据库中删除
    let openid = this.data.openid
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'cancelUserAllSubscribe',
        openid: openid
      },
      success: res => {
        console.log("cancelUserAllSubscribe succ=", res)
      },
      fail: err => {
        console.log("cancelUserAllSubscribe fail=", err)
      }
    })
  },
  onClickToDelAllHistory(e) {
    // 先显示上先消灭 然后把数据库的数据也删除
    this.setData({
      user_search_history_list: []
    })

    let openid = this.data.openid
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'clearUserSearchHistory',
        openid: openid
      },
      success: res => {
        console.log("clearUserSearchHistory succ=", res)
      },
      fail: err => {
        console.log("clearUserSearchHistory fail=", err)
      }
    })
  },

  // 详情展示单个车的详情
  onClickToCarDetails(event) {
    let car = event.currentTarget.dataset.car
    let carIndex = event.currentTarget.dataset.carindex
    let carnum = event.currentTarget.dataset.carnum
    let pageUrl = "/pages/carIndex/carIndex?car=" + car + "&carIndex=" + carIndex + "&carnum=" + carnum
    wx.navigateTo({
      url: pageUrl,
    })
  },

  // 添加用户搜索事件， 这个方便用户查询之前搜索过的纪录
  addUserSearchEvent(carnum) {
    var openid = this.data.openid
    if (!openid || !carnum) {
      return
    }

    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'addUserSearchEvent',
        carnum: carnum,
        openid: openid
      },
      success: res => {
        console.log("addUserSearchEvent succ=", res)
      },
      fail: err => {
        console.log("addUserSearchEvent fail=", err)
      }
    })
  },
  /**
   * bind:search	确定搜索时触发	event.detail: 当前输入值
   */
  onSearchCar: async function (event) {
    let that = this
    const db = wx.cloud.database()
    const _ = db.command
    var car_number = event.detail
    console.log("当前搜索输入值", car_number, typeof (car_number), car_number.toUpperCase())
    /// 如果少于四位的话 很有可能会造成搜索到多个数据。这个时候只需要
    if (car_number.length < 4) {
      Notify("请输入车牌后四位")
      return
    }
    var search_key = car_number.toUpperCase()
    search_key = search_key.replace(/\s*/g, "");
    console.log("search_key=", search_key)
    var result = await db.collection("angryIndex") /// 路怒指数
      .where({
        car_string: db.RegExp({
          regexp: search_key,
          options: "i" // i大小写不敏感 
        })
      })
      /// 当前尽量只搜索到一个车牌，
      // .orderBy('_createTime', 'desc')
      // .skip(skip_num)
      // .limit(10)
      .get()
      .then(res => {
        /// 如果是admin 不受搜索限制 可以查詢任何数据，可以进行设置搜索还是不搜索。 angryIndex.allowSearch
        console.log("用户搜索得到的结果是:", res)
        if (1 < res.data.length) {
          /// 这个应该会很少找到，毕竟后四位都相同的车还是少的
          wx.showToast({
            title: '当前有多个搜索结果，需要更多的信息',
          })
          return
        }
        if (res.data.length != 0) { /// 这里只可以是1的，每次只给一个结果
          // 这里直接转到carIndex.wxml页面去，并不是弹窗，相当于用户体验优化
          let car = res.data[0].car_string
          let carIndex = res.data[0].index
          let carnum = res.data[0].car_num
          let allowSearch = res.data[0].allowSearch
          if (!allowSearch && !getApp().globalData.isAdmin) {
            Notify("已经收录该车指数但并不展示")
            return
          }
          if (!allowSearch && getApp().globalData.isAdmin) {
            Notify("已经收录该车指数但并不展示, 管理员除外")
          }
          let pageUrl = "/pages/carIndex/carIndex?car=" + car + "&carIndex=" + carIndex + "&carnum=" + carnum + "&allowSearch=" + allowSearch
          wx.navigateTo({
            url: pageUrl,
          })
          // "苏A582KE" 计算编码的时候苏A并不包含在里面
          let car_string = res.data[0].car_string
          let car_string_src = car_string.slice(2)
          let car_num = Time.strCar2Int(car_string_src)
          // console.log("car_num=", car_num)
          that.addUserSearchEvent(car_num)
        } else {
          Notify("暂时没有收录该车指数")
        }
      })
  },

  /**
   * bind:cancel	取消搜索搜索时触发
   */
  onCancel: function (event) {},


  /// 获取通知栏内容， 给小程序一个修改通知栏的功能
  async getShareTitle() {
    let that = this
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'getShareTitle',
      },
      success: res => {
        // console.log("notice ", res)
        that.setData({
          share_title: res.result.data[0].content
        })
        getApp().globalData.share_title = res.result.data[0].content;
      },
      fail: err => {
        that.setData({
          share_title: "退一步越想越气,忍一时越想越亏"
        })
        getApp().globalData.share_title = "退一步越想越气,忍一时越想越亏"
      }
    })
  },

  /// 获取通知栏内容， 给小程序一个修改通知栏的功能
  async getNotice() {
    let that = this
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'getNotice',
      },
      success: res => {
        // console.log("notice ", res)
        that.setData({
          d_notice: res.result.data[0].content
        })
      },
      fail: err => {
        that.setData({
          d_notice: "路怒症指数 基于路怒症的大数据平台"
        })
      }
    })
  },

  // 获取当前用户订阅的数据
  async getCurUserSubscribeList() {
    let that = this
    const db = wx.cloud.database()
    const _ = db.command
    let openIDPro = new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'openapi',
        data: {
          action: 'getopenID',
        },
        success: res => {
          var openid = res.result.openid;
          that.setData({
            openid: openid
          })
          getApp().globalData.openid = openid
          if (openid == getApp().globalData.ADMIN_OPENID) {
            getApp().globalData.isAdmin = true;
            that.setData({
              is_admin: true
            })
            // console.log("admin is logging")
          }
          resolve(openid)
        },
        fail: err => {
          console.log("getopenID fail", err)
          reject(0)
        }
      })
    })
    openIDPro.then(res => {
        let subscribePro = new Promise((resolve, reject) => {
          wx.cloud.callFunction({
            name: 'openapi',
            data: {
              action: 'getSubscribeList',
              openid: res
            },
            success: res => {
              resolve(res)
            },
            fail: err => {
              reject(0)
            }
          })
        })
        return subscribePro
      })
      .then(res => {
        if (res.result.data.length != 0) {
          var subscribeList = res.result.data[0].subscribeDataList
          for (let i = 0; i < subscribeList.length; ++i) {
            let subscribeCarNum = Number(subscribeList[i])
            let getIdxPro = new Promise((resolve, reject) => {
              db.collection("angryIndex")
                .where({
                  car_num: _.eq(subscribeCarNum)
                })
                .get()
                .then(res => {
                  resolve(res)
                })
                .catch(err => {
                  reject(err)
                })
            })
            getIdxPro.then(res => {
              var newItem = new Object;
              newItem.car_name = res.data[0].car_string
              newItem.car_index = Number(res.data[0].index)
              newItem.car_num = subscribeCarNum
              var tmpArr = that.data.user_subscribe_list
              tmpArr.push(newItem)
              that.setData({
                user_subscribe_list: tmpArr
              })
            })
          }
        }
      })
  },

  /// 获取最新的提交历史，一般弄个五条就足够
  async getLatestSubmitList() {
    let that = this
    const db = wx.cloud.database()
    const _ = db.command
    // 先获取用户的OPENID
    let getUserOpenIDPromise = new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'openapi',
        data: {
          action: 'getopenID',
        },
        success: res => {
          var openid = res.result.openid;
          that.setData({
            openid: openid
          })
          getApp().globalData.openid = openid
          if (openid == getApp().globalData.ADMIN_OPENID) {
            getApp().globalData.isAdmin = true;
            that.setData({
              is_admin: true
            })
            // console.log("admin is logging")
          }
          resolve(openid)
        },
        fail: err => {
          reject(0)
        }
      })
    })
    getUserOpenIDPromise.then(res => {
      let getlatestCommitListPro = new Promise((resolve, reject) => {
        db.collection("carIndex")
          .where({
            _id: _.exists(true)
          })
          .orderBy('_createTime', 'desc')
          .limit(5)
          .get()
          .then(res => {
            resolve(res)
          })
          .catch(err => {
            reject(err)
          })
      })
      return getlatestCommitListPro
    }).then(res => {
      let result_list = res.data
      let tmpArr = []
      for (let i = 0; i < result_list.length; ++i) {
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
        latest_submit_list: tmpArr
      })
    })
  },

  async getCurUserSearchList() {
    let that = this
    const db = wx.cloud.database()
    const _ = db.command
    // 先获取用户的OPENID
    let getUserOpenIDPromise = new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'openapi',
        data: {
          action: 'getopenID',
        },
        success: res => {
          var openid = res.result.openid;
          that.setData({
            openid: openid
          })
          getApp().globalData.openid = openid
          if (openid == getApp().globalData.ADMIN_OPENID) {
            getApp().globalData.isAdmin = true;
            that.setData({
              is_admin: true
            })
            // console.log("admin is logging")
          }
          resolve(openid)
        },
        fail: err => {
          reject(0)
        }
      })
    })
    getUserOpenIDPromise.then(res => {
        // 根据用户openID在表userSubscribeList中查询搜索列表
        let getUserSearchHistoryPromise = new Promise((resolve, reject) => {
          wx.cloud.callFunction({
            name: 'openapi',
            data: {
              action: 'getSearchList',
              openid: res
            },
            success: res => {
              resolve(res)
            },
            fail: err => {
              reject(0)
            }
          })
        })
        return getUserSearchHistoryPromise
      })
      .then(res => {
        if (res.result.data.length != 0) {
          var searchList = res.result.data[0].searchDataList
          for (let i = 0; i < searchList.length; ++i) {
            let searchCarNum = Number(searchList[i])
            // 根据carNum查询这个路怒症指数
            let getAngryIdxPro = new Promise((resolve, reject) => {
              db.collection("angryIndex")
                .where({
                  car_num: _.eq(searchCarNum)
                })
                .get()
                .then(res => {
                  resolve(res)
                })
                .catch(err => {
                  reject(err)
                })
            })
            getAngryIdxPro.then(res => {
              var newItem = new Object;
              newItem.car_name = res.data[0].car_string
              newItem.car_index = Number(res.data[0].index)
              newItem.car_num = searchCarNum
              var tmpArr = that.data.user_search_history_list
              tmpArr.push(newItem)
              that.setData({
                user_search_history_list: tmpArr
              })
            })
          }
        }
      })
  },

  async getCarHistoryIndex() {
    var currentTimeStamp = Date.parse(new Date())
    const num = Time.genTimeStampNum(currentTimeStamp)
    return await new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'openapi',
        data: {
          action: 'getCarHistoryIndex',
          dateNum: num
        },
        success: res => {
          if (res.result.data.length) {
            resolve(res.result.data[0].index)
          } else {
            // 这个地方只是不暴露给用户， 其实系统数据库应该是有问题， 没有创建当天的历史指数
            resolve(0)
          }
        },
        fail: err => {
          console.log('获取历史指数失败 err=', err);
          reject(err)
        }
      })
    })
  },

  async getCarTodayIndex() {
    var currentTimeStamp = Date.parse(new Date())
    const num = Time.genTimeStampNum(currentTimeStamp)

    return await new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'openapi',
        data: {
          action: 'getCarTodayIndex',
          dateNum: num
        },
        success: res => {
          console.log('获取当日指数成功 res=', res);
          if (res.result.data.length) {
            resolve(res.result.data[0].index)
          } else {
            // 这个地方只是不暴露给用户， 其实系统数据库应该是有问题， 没有创建当天的当日指数
            resolve(0)
          }
        },
        fail: err => {
          console.log('获取当日指数失败 err=', err);
          reject(err)
        }
      })
    })
  },

  //设定EChart报表的历史指数状态, history_idx 是一个指数 数组
  setLineChartData(history_chart, history_idx) {
    var xAxisTime = getX7DaysArray()
    var option = {
      title: {
        text: '路怒症指数',
        left: 'center'
      },
      legend: {
        data: ['路怒症指数'],
        top: 50,
        left: 'center',
        backgroundColor: '#fff',
        z: 100
      },
      grid: {
        containLabel: true
      },
      tooltip: {
        show: true,
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        // data: ['周一', '周二', '周三', '周四', '周五', '周六', '周日'],
        data: xAxisTime,
        // show: false
      },
      yAxis: {
        x: 'center',
        type: 'value',
        splitLine: {
          lineStyle: {
            type: 'dashed'
          }
        }
        // show: false
      },
      series: [{
        name: '路怒症指数',
        type: 'line',
        smooth: true,
        // data: [18, 36, 65, 30, 78, 40, 33]
        data: history_idx
      }]
    };

    history_chart.setOption(option);
    return history_chart;
  },

  //设定EChart报表的当日指数状态
  setTodayIdxOption(chart, today_idx) {
    var xAxisTime = getX7DaysArray()
    var option = {
      title: {
        text: '当日指数',
        left: 'center'
      },
      legend: {
        data: ['当日指数'],
        top: 50,
        left: 'center',
        backgroundColor: '#fff',
        z: 100
      },
      grid: {
        containLabel: true
      },
      tooltip: {
        show: true,
        trigger: 'axis'
      },
      xAxis: {
        type: 'category',
        boundaryGap: false,
        // data: ['周一', '周二', '周三', '周四', '周五', '周六', '3/12'],
        data: xAxisTime,
        // show: false
      },
      yAxis: {
        x: 'center',
        type: 'value',
        splitLine: {
          lineStyle: {
            type: 'dashed'
          }
        }
        // show: false
      },
      series: [{
        name: '当日指数',
        type: 'line',
        smooth: true,
        // data: [18, 36, 65, 30, 78, 40, 33]
        data: today_idx
      }]
    };

    chart.setOption(option);
  },

  // carStat 这个表中有可能要新增加字段，但是在web上增加完并不会初始化，所以在这里进行初始化
  // filed value 并没有调试好
  initCarStatField(field, value) {
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'initCarStatField',
        field: field,
        value: value
      },
      success: res => {
        console.log("getopenID succ", res)
      },
      fail: err => {
        console.log("getopenID fail", err)
      }
    })
  },
  // https://developers.weixin.qq.com/miniprogram/dev/wxcloud/reference-sdk-api/database/command/aggregate/AggregateCommand.sum.html
  // 求某一列的和 
  getSumOfFiled(filed_) {
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'getSumOfFiled',
        field: filed_
      },
      success: res => {
        console.log("getSumOfFiled succ=", res)
      },
      fail: err => {
        console.log("getSumOfFiled fail=", err)
      }
    })
  },


  setPieChartData(ec, data) {
    var option = {
      backgroundColor: "#F5F5F5",
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

  // 获取各种违规行为的数据， 然后通过chart进行渲染. 
  // 数据存储在carStat中 字段 carNum=0那里
  async getPieChartData() {
    let that = this
    await wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'getBehaviorProfile',
      },
      success: res => {
        let dataArr = []
        if (res.result.data.length == 1) {
          // 这里只有一条数据， 只能是一条数据
          var obj = res.result.data[0]
          let goodman = obj.goodman
          if (0 != goodman) {
            var newItem = new Object;
            newItem.name = "好人"
            newItem.value = Number(goodman)
            dataArr.push(newItem)
          }
          let farLightDog = obj.farLightDog
          if (0 != farLightDog) {
            var newItem = new Object;
            newItem.name = "远光狗"
            newItem.value = Number(farLightDog)
            dataArr.push(newItem)
          }
          let jumpQueueDog = obj.jumpQueueDog
          if (0 != jumpQueueDog) {
            var newItem = new Object;
            newItem.name = "加塞狗"
            newItem.value = Number(jumpQueueDog)
            dataArr.push(newItem)
          }
          let justFuckIt = obj.justFuckIt
          if (0 != justFuckIt) {
            var newItem = new Object;
            newItem.name = "sb"
            newItem.value = Number(justFuckIt)
            dataArr.push(newItem)
          }
          let occupyEmergency = obj.occupyEmergency
          if (0 != occupyEmergency) {
            var newItem = new Object;
            newItem.name = "占用应急车道"
            newItem.value = Number(occupyEmergency)
            dataArr.push(newItem)
          }
          let overLineDrive = obj.overLineDrive
          if (0 != overLineDrive) {
            var newItem = new Object;
            newItem.name = "压线行驶"
            newItem.value = Number(overLineDrive)
            dataArr.push(newItem)
          }
          // 一开始只是表示骑线停车 后面把范围扩大了 表示违规停车
          let overLinePark = obj.overLinePark
          if (0 != overLinePark) {
            var newItem = new Object;
            newItem.name = "违规停车"
            newItem.value = Number(overLinePark)
            dataArr.push(newItem)
          }
          let reverseDrive = obj.reverseDrive
          if (0 != reverseDrive) {
            var newItem = new Object;
            newItem.name = "逆向行驶"
            newItem.value = Number(reverseDrive)
            dataArr.push(newItem)
          }
          let runRedLight = obj.runRedLight
          if (0 != runRedLight) {
            var newItem = new Object;
            newItem.name = "闯红灯"
            newItem.value = Number(runRedLight)
            dataArr.push(newItem)
          }
          let slowDog = obj.slowDog
          if (0 != slowDog) {
            var newItem = new Object;
            newItem.name = "龟速狗"
            newItem.value = Number(slowDog)
            dataArr.push(newItem)
          }
          let solidLine = obj.solidLine
          if (0 != solidLine) {
            var newItem = new Object;
            newItem.name = "实线变道"
            newItem.value = Number(solidLine)
            dataArr.push(newItem)
          }
          let dangerousDrive = obj.dangerousDrive
          if (0 != dangerousDrive) {
            var newItem = new Object;
            newItem.name = "危险驾驶"
            newItem.value = Number(dangerousDrive)
            dataArr.push(newItem)
          }
          let notInTheLine = obj.notInTheLine
          if (0 != notInTheLine) {
            var newItem = new Object;
            newItem.name = "不按车道行驶"
            newItem.value = Number(notInTheLine)
            dataArr.push(newItem)
          }
          if (dataArr.length == 0) {
            var newItem = new Object;
            newItem.name = "暂时没有详细数据"
            newItem.value = Number(0)
            dataArr.push(newItem)
          }
          if (history_index_pie_chart) {
            that.setPieChartData(history_index_pie_chart, dataArr)
          }
          // 点击chart事件 可以查看图片 todo
          // history_index_pie_chart.on("click", function (params) {
          //   console.log("click chart =", params.data.name)
          // })
        } else {
          var newItem = new Object;
          newItem.name = "暂时没有详细数据"
          newItem.value = Number(0)
          dataArr.push(newItem)
          that.setPieChartData(history_index_pie_chart, dataArr)
        }
        that.setData({
          history_pie_chart_data: dataArr
        })
      },
      fail: err => {
        console.log("getBehaviorProfile fail", err)
      }
    })
  },

  // 加载最近七天历史指数的数据并设置页面的history_line_chart_data
  async getLineChartData() {
    let last7daysHistoryIdxObj = await getLast7DaysHistoryIdx();
    var last7daysHistoryIdxArr = []
    for (let i = 0; i < last7daysHistoryIdxObj.length; ++i) {
      last7daysHistoryIdxArr.push(last7daysHistoryIdxObj[i].index)
    }
    this.setData({
      history_line_chart_data: last7daysHistoryIdxArr
    })
  },

  // 初始化线图节点
  initHistoryLineChart() {
    let that = this
    let history_ecComponent = this.selectComponent('#mychart-dom-line-history');
    history_ecComponent.init((canvas, width, height, dpr) => {
      // 获取组件的 canvas、width、height 后的回调函数
      // 在这里初始化图表
      history_index_line_chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // new
      });
      if (history_index_line_chart) {
        that.setLineChartData(history_index_line_chart, that.data.history_line_chart_data)
      }
      // 注意这里一定要返回 chart 实例，否则会影响事件处理等
      return history_index_line_chart;
    });
  },

  showHistoryLineChart() {
    if (history_index_line_chart) {
      this.setLineChartData(history_index_line_chart, this.data.history_line_chart_data);
    } else {
      let that = this
      let history_ecComponent = this.selectComponent('#mychart-dom-line-history');
      history_ecComponent.init((canvas, width, height, dpr) => {
        // 获取组件的 canvas、width、height 后的回调函数
        // 在这里初始化图表
        history_index_line_chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr // new
        });
        that.setLineChartData(history_index_line_chart, that.data.history_line_chart_data);
        // 注意这里一定要返回 chart 实例，否则会影响事件处理等
        return history_index_line_chart;
      });
    }
  },

  // 初始化饼图节点
  initHistoryPieChart() {
    let history_pie_ecComponent = this.selectComponent('#mychart-dom-pie-history');
    history_pie_ecComponent.init((canvas, width, height, dpr) => {
      // 获取组件的 canvas、width、height 后的回调函数
      // 在这里初始化图表
      history_index_pie_chart = echarts.init(canvas, null, {
        width: width,
        height: height,
        devicePixelRatio: dpr // new
      });
      if (history_index_pie_chart) {
        this.setPieChartData(history_index_pie_chart, this.data.history_pie_chart_data);
      }
      // 注意这里一定要返回 chart 实例，否则会影响事件处理等
      return history_index_pie_chart;
    });
  },
  // 如果已经有该用户的积分 就不用创建， 如果没有 就需要创建
  async initUserScore() {
    return await new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'openapi',
        data: {
          action: 'initUserScore',
          openid: this.data.openid,
        },
        success: res => {
          console.log("initUserScore=", res)
          resolve(true)
        },
        fail: err => {
          reject(false)
        }
      })
    })
  },

  //获取用户当前的积分 只需要在跳转到提交页面进行判断积分是否足够。 如果已经在提交页面 则只进行积分的减少 不进行积分的判断
  //积分的判断是在跳转的时候进行， 积分的减少是在提交的时候进行。两者是分开的。
  async getUserScore() {
    let that = this
    return await new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'openapi',
        data: {
          action: 'getUserScore',
          openid: this.data.openid,
        },
        success: res => {
          console.log("getUserCurScore=", res)
          if (res.result.data.length != 0) {
            that.data.score_ = res.result.data[0].score
          }
          resolve(true)
        },
        fail: err => {
          reject(false)
        }
      })
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  onLoad: async function (options) {
    this.getCurUserSearchList()
    this.getCurUserSubscribeList()
    this.getLatestSubmitList()
    this.getNotice()
    this.getShareTitle()
    // await this.getLineChartData()
    // await this.getPieChartData()
    // this.initHistoryPieChart()
    // this.initHistoryLineChart()
    // this.showHistoryPieChart()
    // this.showHistoryLineChart()
    // await this.initUserScore()
    // this.getUserScore()
  },

  showHistoryPieChart() {
    let that = this
    if (!history_index_pie_chart) {
      let history_pie_ecComponent = this.selectComponent('#mychart-dom-pie-history');
      history_pie_ecComponent.init((canvas, width, height, dpr) => {
        // 获取组件的 canvas、width、height 后的回调函数
        // 在这里初始化图表
        history_index_pie_chart = echarts.init(canvas, null, {
          width: width,
          height: height,
          devicePixelRatio: dpr // new
        });
        if (history_index_pie_chart) {
          that.setPieChartData(history_index_pie_chart, that.data.history_pie_chart_data)
        }
        // 注意这里一定要返回 chart 实例，否则会影响事件处理等
        return history_index_pie_chart;
      });
    } else {
      that.setPieChartData(history_index_pie_chart, that.data.history_pie_chart_data)
    }
  },
  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {
    // this.showHistoryPieChart()
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
  onPullDownRefresh: async function () {
    this.getNotice()
    this.getShareTitle()
    // last7daysTodayIdxObj = await getLast7DaysTodayIdx();
    // var last7daysTodayIdx = []
    // for (let i = 0; i < last7daysTodayIdxObj.length; ++i) {
    //   last7daysTodayIdx.push(last7daysTodayIdxObj[i].index)
    // }
    // //调用设定EChart报表状态的函数，并且把从后端拿到的数据传过去
    // this.setTodayIdxOption(today_index_ec, last7daysTodayIdx);
    // this.showHistoryPieChart()
    // let last7daysHistoryIdxObj = await getLast7DaysHistoryIdx();
    // var last7daysHistoryIdx = []
    // for (let i = 0; i < last7daysHistoryIdxObj.length; ++i) {
    //   last7daysHistoryIdx.push(last7daysHistoryIdxObj[i].index)
    // }
    //调用设定EChart报表状态的函数，并且把从后端拿到的数据传过去
    // this.setLineChartData(history_index_line_chart, last7daysHistoryIdx);
    // 在这里更新指数
    // var todayIndex = await this.getCarTodayIndex()
    // this.setData({
    //   today_index: todayIndex
    // })
    // var historyIndex = await this.getCarHistoryIndex()
    // this.setData({
    //   history_index: historyIndex
    // })

    this.data.user_subscribe_list = []
    this.getCurUserSubscribeList()
    this.getLatestSubmitList()

    this.data.user_search_history_list = []
    let that = this
    const db = wx.cloud.database()
    const _ = db.command
    let openIDPro = new Promise((resolve, reject) => {
      resolve(that.data.openid)
    })
    openIDPro.then(res => {
        let searchPro = new Promise((resolve, reject) => {
          wx.cloud.callFunction({
            name: 'openapi',
            data: {
              action: 'getSearchList',
              openid: res
            },
            success: res => {
              resolve(res)
            },
            fail: err => {
              reject(0)
            }
          })
        })
        return searchPro
      })
      .then(res => {
        // console.log(res)
        if (res.result.data.length != 0) {
          var searchList = res.result.data[0].searchDataList
          for (let i = 0; i < searchList.length; ++i) {
            let searchCarNum = Number(searchList[i])
            let getIdxPro = new Promise((resolve, reject) => {
              db.collection("angryIndex")
                .where({
                  car_num: _.eq(searchCarNum)
                })
                .get()
                .then(res => {
                  resolve(res)
                })
                .catch(err => {
                  reject(err)
                })
            })
            getIdxPro.then(res => {
              console.log("res=", res)
              var newItem = new Object;
              newItem.car_name = res.data[0].car_string
              newItem.car_index = Number(res.data[0].index)
              newItem.car_num = searchCarNum
              var tmpArr = that.data.user_search_history_list
              tmpArr.push(newItem)
              that.setData({
                user_search_history_list: tmpArr
              })
            })
          }
        }
      })


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
    // this.addUserScore(1000)
    let carImage = "../../images/home.png"
    return {
      title: getApp().globalData.share_title,
      imageUrl: carImage
    }
  },

  // 进行增加用户的积分
  async addUserScore(value) {
    return await new Promise((resolve, reject) => {
      wx.cloud.callFunction({
        name: 'openapi',
        data: {
          action: 'addUserScore',
          openid: this.data.openid,
          score_add: value
        },
        success: res => {
          Notify({
            type: 'success',
            message: '积分增加成功'
          });
          resolve(1)
        },
        fail: err => {
          Notify("积分增加失败")
          reject(0)
        }
      })
    })
  },

  onSelectMode(event) {
    this.setData({
      show: true
    });
  },

  onClose() {
    this.setData({
      show: false
    });
  },

  onCopyNotice(e) {
    wx.setClipboardData({
      data: e.currentTarget.dataset.num,
      success: function (res) {
        wx.getClipboardData({
          success: (option) => {
            wx.showToast({
              title: '复制内容成功',
            })
          },
        })
      }
    })
  },

  // 在跳转到提交页面时需要进行分数判断，只需要在跳转时进行判断。 如果已经在提交页面 不进行判断。只需要减少积分
  navigateToSubmitPage() {
    // console.log("navigateToSubmitPage")
    // 
    // if (this.data.score_ <= 0) {
    //   Notify("当前积分不足，分享当前页面成功后可获取免费积分")
    //   return
    // }
    wx.navigateTo({
      url: '/pages/textSubmit/textSubmit',
    })
  },
  // 通知栏里面点击事件 直接跳转到普通页面
  onClickToTextSubmitPage() {
    this.navigateToSubmitPage()
  },

  onSelect(event) {
    console.log(event.detail);
    if ("驾驶模式" == event.detail.name) {
      wx.navigateTo({
        url: '/pages/voiceSubmit/voiceSubmit',
      })
      return
    }
    if ("普通模式" == event.detail.name) {
      this.navigateToSubmitPage()
      return
    }
  },

  onClickAboutMe(event) {
    wx.navigateTo({
      url: '/pages/aboutme/aboutme',
    })
  },

  // 发送的通知内容
  onNoticeInput(ev) {
    this.setPageInputText(ev.detail)
  },

  // 用户输入的文本内容
  setPageInputText(notice) {
    this.setData({
      d_notice: notice
    })
  },
  // 获取文本内容 这个用来发送通知
  getPageInputText() {
    return this.data.d_notice
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

})