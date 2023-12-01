// pages/index/index.js
import Notify from "../../miniprogram_npm/@vant/weapp/notify/notify"
const tx_location_service_key = 'QQDBZ-D5JWX-NU746-ZJDHU-OMSMJ-FGFF4'; //使用在腾讯位置服务申请的key
const app_name = 'lunuzs'; //调用插件的app的名称
const location = JSON.stringify({
  latitude: 31.95266,
  longitude: 118.84002
});
const category = '生活服务,娱乐休闲';
const chooseLocation = requirePlugin('chooseLocation');
var QQMapWX = require("../../third/libs/qqmap-wx-jssdk.js")
var qqmapsdk;
let Time = require("../../third/utils/time")
Page({
  /**
   * 页面的初始数据
   */
  data: {
    // columns: ['杭州', '宁波', '温州', '嘉兴', '湖州'],
    ca_imagePath: '',
    ca_quality: 0.1,
    ca_width: 1200,
    ca_height: 800,
    // minDate: new Date(2022, 1, 1).getTime(),
    // maxDate: new Date(2023, 1, 1).getTime(),
    optionObj: undefined, // 在页面从drive mode 跳转过来的时候
    province: "",
    city: "",
    latitude: 0,
    longitude: 0,
    address: "",
    showPopupDate: false, // 从弹出层选择日期
    ImgMaxUploadSize: 1024 * 1024 * 10, // bytes
    minHour: 10,
    maxHour: 20,
    minDate: new Date(2020, 1, 1).getTime(),
    maxDate: new Date(2023, 12, 30).getTime(),
    currentDate: new Date().getTime(),
    formatter(type, value) {
      if (type === 'year') {
        return `${value}年`;
      }
      if (type === 'month') {
        return `${value}月`;
      }
      if (type === 'day') {
        return `${value}日`;
      }
      if (type === 'hour') {
        return `${value}时`;
      }
      if (type === 'minute') {
        return `${value}分`;
      }
      return value;
    },
    plugin_map_url: "", // 第三方地图插件URL
    submitProcess: 0, // 显示提交进度
    isShowCommitOverlay: false, // 用户提交后 显示遮罩层
    cloudFileList: [], // 系统把通过安全检测的图片上传到云存储，后面通过这个来获取图片
    secureFileList: [], // 通过安全检测的文件列表, 在上传到云存储后，需要进行安全检测，安全检测后，才能上传到云存储
    userUploadFileList: [], // 用户上传的文件列表
    // fileList: [], //车牌照片
    openid: "",
    car_number: '', //车牌号
    car_comment: '', //评论
    car_time: '', //时间
    car_place: '', //地点
    // 省份简写
    provinces: [
      ['京', '沪', '粤', '津', '冀', '晋', '蒙', '辽', '吉', '黑'],
      ['苏', '浙', '皖', '闽', '赣', '鲁', '豫', '鄂', '湘'],
      ['桂', '琼', '渝', '川', '贵', '云', '藏'],
      ['陕', '甘', '青', '宁', '新'],
    ],
    // 车牌输入
    numbers: [
      ["0", "1", "2", "3", "4", "5", "6", "7", "8", "9"],
      ["A", "B", "C", "D", "E", "F", "G", "H", "J", "K"],
      ["L", "M", "N", "P", "Q", "R", "S", "T", "U", "V"],
      ["W", "X", "Y", "Z", "港", "澳", "学", "挂"]
    ],
    carnum: [],
    showNewEnergy: false, // 显示新能源标识
    InputCarKeyboardState: false,
    showRemarks: false,
    remark_actions: [{
        name: '车主好人',
      },
      {
        name: 'sb',
      },
      {
        name: '远光狗',
      },
      {
        name: '加塞狗',
      },
      {
        name: '龟速狗',
      },
      {
        name: '违规停车',
      },
      {
        name: '占用应急车道',
      },
      {
        name: '闯红灯',
      },
      {
        name: '危险驾驶',
      }
    ],
  },

  onCloseRemarksPop(e) {
    this.setData({
      showRemarks: false
    })
  },

  onSelectRemarksPop(e) {
    console.log("onSelectRemarksPop=", e)
    this.setData({
      showRemarks: false
    })
    this.setData({
      car_comment: e.detail.name
    })
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

  onGetRemarks(e) {
    var enable = this.data.showRemarks
    this.setData({
      showRemarks: !enable,
      InputCarKeyboardState: false
    })
  },

  onChange(event) {
    const {
      picker,
      value,
      index
    } = event.detail;
    console.log(`当前值：${value}, 当前索引：${index}`);
  },

  onGetCurrentTime() {
    this.setData({
      showPopupDate: true,
      InputCarKeyboardState: false
    })
  },

  onCloseDate() {
    this.setData({
      showPopupDate: false
    })
  },

  onHideCommitOverlay() {
    this.setData({
      isShowCommitOverlay: false
    })
  },

  onClickShow() {
    this.setData({
      isShowCommitOverlay: true
    });
  },

  setSubmitProcess(value) {
    this.setData({
      submitProcess: value
    })
  },

  onImgOverSize(event) {
    Notify("图片最大1M，请重新选择")
  },

  deleteImg(event) {
    // 删除图片的序号值
    var imgIdx = event.detail.index
    var fileList = this.data.userUploadFileList
    // 要删除的第一项的位置和要删除的项数
    fileList.splice(imgIdx, 1)
    this.setData({
      userUploadFileList: fileList
    })
  },

  /// use-before-read 需要设置这个属性为true
  // OnBeforeRead(event) {
  //   wx.createSelectorQuery()
  //     .select('#attendCanvasId')
  //     .fields({
  //       node: true,
  //       size: true,
  //     })
  //     .exec(this.initCanvas.bind(this))
  // },

  // initCanvas(res) {
  //   console.log("initCanvas enter", res)
  //   let that = this
  //   // Canvas 对象
  //   const canvas = res[0].node

  //   // Canvas 画布的实际绘制宽高
  //   const renderWidth = res[0].width
  //   const renderHeight = res[0].height

  //   /// 该方法返回 Canvas 的绘图上下文, RenderingContext 
  //   const ctx = canvas.getContext('2d')

  //   // 初始化画布大小
  //   const dpr = wx.getSystemInfoSync().pixelRatio
  //   canvas.width = renderWidth * dpr
  //   canvas.height = renderHeight * dpr
  //   ctx.scale(dpr, dpr)

  //   // 绘制前清空画布
  //   ctx.clearRect(0, 0, canvas.width, canvas.height)

  //   /// 修改图片绘制
  //   const image = canvas.createImage()
  //   image.src = "../../images/1.jpg"
  //   wx.getFileInfo({
  //     filePath: image.src,
  //     success: function (res) {
  //       console.log("res=", res)
  //     }
  //   })
  //   /// onload 图片加载完成回调触发后，再将图片对象传入 context.drawImage 进行绘制
  //   image.onload = () => {
  //     ctx.drawImage(
  //       image,
  //       0,
  //       0,
  //       canvas.width,
  //       canvas.height
  //     )
  //     setTimeout(() => {
  //       wx.canvasToTempFilePath({
  //         canvas: canvas,
  //         fileType: "jpg",
  //         quality: that.data.ca_quality,
  //         success(res) {
  //           console.log("canvasToTempFilePath ok:", res)
  //           wx.getFileInfo({
  //             filePath: res.tempFilePath,
  //             success: function (res) {
  //               console.log("res=", res)
  //             }
  //           })
  //         },
  //         fail(res) {
  //           console.log("canvasToTempFilePath fail:", res)
  //         }
  //       })
  //     }, 1000);
  //   }
  // },

  compressImgUseCanvas(imgUrl) {
    // wx.getFileInfo({
    //   filePath: imgUrl,
    //   success: function (res) {
    //     console.log("compress before=", res)
    //   }
    // })
    let that = this
    wx.createSelectorQuery()
      .select('#attendCanvasId')
      .fields({
        node: true,
        size: true,
      })
      .exec((res) => {
        // Canvas 对象
        const canvas = res[0].node

        // Canvas 画布的实际绘制宽高
        const renderWidth = res[0].width
        const renderHeight = res[0].height
        // console.log("renderWidth=", renderWidth)
        // console.log("renderHeight=", renderHeight)

        /// 该方法返回 Canvas 的绘图上下文, RenderingContext 
        const ctx = canvas.getContext('2d')

        // 初始化画布大小  
        /// https://developers.weixin.qq.com/miniprogram/dev/framework/ability/canvas.html
        const dpr = wx.getSystemInfoSync().pixelRatio
        // console.log("dpr=", dpr)
        canvas.width = renderWidth * dpr
        canvas.height = renderHeight * dpr
        ctx.scale(dpr, dpr)

        // 绘制前清空画布
        ctx.clearRect(0, 0, renderWidth, renderHeight)

        /// 填充一个矩形 矩形路径左上角的横坐标 矩形路径的宽度
        ctx.fillRect(0, 0, renderWidth, renderHeight)

        /// 修改图片绘制
        const new_image = canvas.createImage()

        // 设置图片src
        new_image.src = imgUrl

        /// onload 图片加载完成回调触发后，再将图片对象传入 context.drawImage 进行绘制
        new_image.onload = () => {
          ctx.drawImage(
            new_image,
            0,
            0,
            renderWidth,
            renderHeight
          )
          setTimeout(() => {
            wx.canvasToTempFilePath({
              canvas: canvas,
              x: 0,
              y: 0,
              width: that.data.ca_width,
              height: that.data.ca_height,
              destWidth: that.data.ca_width,
              destHeight: that.data.ca_height,
              fileType: "png",
              quality: that.data.ca_quality,
              success(res) {
                // console.log("canvasToTempFilePath ok:", res, Date.now())
                /// 先让用户看到图片， 然后后面再做操作
                // var fileList = that.data.userUploadFileList
                var fileList = []
                var newFile = new Object()
                newFile.url = res.tempFilePath
                newFile.name = res.tempFilePath
                newFile.deletable = true
                fileList.push(newFile)
                that.setData({
                  userUploadFileList: fileList
                })
                // wx.getFileInfo({
                //   filePath: res.tempFilePath,
                //   success: function (res) {
                //     console.log("res=", res)
                //   }
                // })
              },
              fail(res) {
                // console.log("canvasToTempFilePath fail:", res)
              }
            })
          }, 1000);
        }
      })
  },

  afterRead(event) {
    // { } 大括号，表示定义一个对象，大部分情况下要有成对的属性和值，或是函数
    // "http://tmp/EBtEoT7KeIyh7bbdf5b464d6bea0182ba80331d8c093.png" event.detail 是文件的临时地址
    const {
      file
    } = event.detail;

    // if (1 == file.length) {
    //   let img = file[0].url
    //   wx.getFileInfo({
    //     filePath: img,
    //     success: function (res) {
    //       console.log("res=", res)
    //     }
    //   })
    // }
    var fileList = this.data.userUploadFileList
    if (Array.isArray(file)) {
      for (let i = 0; i < file.length; i++) {
        var newFile = new Object()
        newFile.url = file[i].url
        newFile.name = file[i].url
        newFile.deletable = true
        fileList.push(newFile)
      }
    } else {
      var newFile = new Object()
      newFile.url = file.url
      newFile.name = file.url
      newFile.deletable = true
      fileList.push(newFile)
    }
    this.setData({
      userUploadFileList: fileList
    })

    // console.log("compressImgUseCanvas", Date.now())
    this.compressImgUseCanvas(file.url)
  },

  onChangeToDriveMode() {
    // // 如果已经填写部分 则需要进行判断才进行跳转到驾驶模式，防止误点。
    // if (this.data.carnum[0] || this.data.userUploadFileList[0]) {
    //   wx.showModal({
    //     title: '跳转到驾驶模式',
    //     content:"当前有填写内容，确认是否跳转",
    //     confirmText:"确认跳转",
    //     success: function (res){
    //       if (res.confirm) {
    //         wx.redirectTo({
    //           url: '/pages/voiceSubmit/voiceSubmit',
    //         })
    //       }
    //     }
    //   })
    // }else {
    //   wx.redirectTo({
    //     url: '/pages/voiceSubmit/voiceSubmit',
    //   })
    // }
  },

  onManualInputCarPlace(e) {
    let data = e.detail
    this.setData({
      car_place: data
    })
  },

  onGetUserLocation(event) {
    this.setData({
      InputCarKeyboardState: false
    })
    wx.navigateTo({
      url: this.data.plugin_map_url,
      success: function (res) {

      },
      fail: function (err) {
        Notify('地图选择失败，请手动输入');
      }
    });
  },

  onChangeComment(event) {
    var comment = event.detail
    if (comment) {
      this.setData({
        car_comment: comment
      })
    }
    this.setData({
      InputCarKeyboardState: false
    })
  },
  onFocusPlaceInputFiled(event) {
    this.setData({
      InputCarKeyboardState: false
    })
  },
  onFocusTimeInputFiled(event) {
    this.setData({
      InputCarKeyboardState: false
    })
  },
  onFocusCommentInputFiled(event) {
    this.setData({
      InputCarKeyboardState: false
    })
  },
  onChangeTime(event) {
    var time = event.detail
    if (time) {
      this.setData({
        car_time: time,
        InputCarKeyboardState: false
      })
    }
  },

  onChangePlace(event) {
    var place = event.detail
    if (place) {
      this.setData({
        car_place: place
      })
    }
  },

  // 选中点击设置
  bindChoose(e) {
    if (!this.data.carnum[6] || this.data.showNewEnergy) {
      var arr = [];
      arr[0] = e.target.dataset.val;
      this.data.carnum = this.data.carnum.concat(arr)
      this.setData({
        carnum: this.data.carnum
      })
    }
  },
  bindDelChoose() {
    if (this.data.carnum.length != 0) {
      this.data.carnum.splice(this.data.carnum.length - 1, 1);
      this.setData({
        carnum: this.data.carnum
      })
    }
  },
  showPowerBtn() {
    this.setData({
      showNewEnergy: true,
      InputCarKeyboardState: true
    })
  },
  closeKeyboard() {
    this.setData({
      InputCarKeyboardState: false
    })
  },

  // 单击打开，双击关闭。 是否可以提高用户体验。
  openKeyboard() {
    var state = this.data.InputCarKeyboardState
    this.setData({
      InputCarKeyboardState: !state
    })
  },

  // 把用户所有的输入都清除，包括上传的照片。
  resetInput() {
    this.setData({
      // car_time: "",
      car_comment: "",
      // car_place: "",
      carnum: [],
      userUploadFileList: [],
      showNewEnergy: false
    })
  },

  // todo 正则并没有经过测试
  checkCarNumber() {
    // ^([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[a-zA-Z](([DF]((?![IO])[a-zA-Z0-9](?![IO]))[0-9]{4})|([0-9]{5}[DF]))|[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领A-Z]{1}[A-Z]{1}[A-Z0-9]{4}[A-Z0-9挂学警港澳]{1})$
    let reg = /^(([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z](([0-9]{5}[DF])|([DF]([A-HJ-NP-Z0-9])[0-9]{4})))|([京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][A-HJ-NP-Z0-9]{4}[A-HJ-NP-Z0-9挂学警港澳使领]))$/
    var carNum = this.data.carnum.join('')
    const careg = reg.test(carNum);
    if (!careg) {
      wx.showToast({
        icon: 'none',
        title: '请输入正确车牌号',
      })
      return false
    }
    return true
  },


  // 文本内容合法性检测
  async checkText(text) {
    console.log("text: ", text)
    try {
      var res = await wx.cloud.callFunction({
        name: 'openapi',
        data: {
          action: 'msgSecCheck',
          content: text,
        }
      })
      if (res.result.errCode == 0) {
        return true
      }
    } catch (error) {
      return false
    }
  },

  isNum(data) {
    if ('0' <= data && data <= '9') {
      return true;
    }
    return false;
  },

  isUpperCaseLetter(data) {
    if ('A' <= data && data <= 'Z') {
      return true;
    }
    return false;
  },

  //对车牌号进行数字化
  strCar2Int() {
    var CarNumArr = this.data.carnum
    // 后面就是
    var weight = 10 * 1000
    if (this.data.showNewEnergy) {
      weight = 100 * 1000
    }
    var result = 0
    // [0] 苏 [1] A 表示南京  这两个不考虑进行编码 从第2位开始
    for (let i = 2; i < CarNumArr.length; ++i) {
      let value = CarNumArr[i]
      if (this.isNum(value)) {
        result += (value - '0') * weight
      }
      if (this.isUpperCaseLetter(value)) {
        result += (value.charCodeAt() - 'A'.charCodeAt() + 10) * weight
      }
      weight /= 10
    }
    return result
  },

  // 对上传的图片进行校验
  async checkImgs() {
    var secureImgList = []
    var images = this.data.userUploadFileList
    var imageNum = this.data.userUploadFileList.length
    var imageNotOk = undefined
    for (let i = 0; i < imageNum; ++i) {
      // newImages 是本地文件路径  http://tmp//*.jpg
      let image = images[i]
      let cdnUrl = wx.cloud.CDN({
        type: 'filePath',
        filePath: image.url
      })
      console.log("cdnUrl=", cdnUrl)
      try {
        var res = await wx.cloud.callFunction({
          name: 'openapi',
          data: {
            action: 'imgSecCheckUseCDN',
            imgContent: cdnUrl,
            contentType: "image/png",
          }
        })
        var rescode = res.result.errCode
        if (rescode == 87014 || rescode == -604102) {
          imageNotOk = true
        } else {
          secureImgList.push(image)
        }
      } catch (err) {
        console.log("imgSecCheckUseCDN fail", err);
      }
    }
    this.setData({
      secureFileList: secureImgList
    })
    return true
  },

  async uploadImgs() {
    let cloudIds_ = []
    let secureFileList = this.data.secureFileList
    let imageNum = secureFileList.length
    for (let i = 0; i < imageNum; ++i) {
      let image = secureFileList[i].url
      try {
        let cloudId = await this.uploadImgsAsync(image)
        if (cloudId) {
          cloudIds_ = cloudIds_.concat(cloudId)
        }
      } catch (error) {
        console.log("这里会失败， 无所谓 上传不了就不显示，不能影响正常流程 ")
        continue
      }
    }
    this.setData({
      cloudFileList: cloudIds_
    })
    return true
  },

  async uploadImgsAsync(image) {
    try {
      let fileID = await this.uploadImgsAsyncPromise(image)
      return fileID
    } catch (error) {
      Notify("上传图片失败", error)
      return 0
    }
  },


  // 能上传就上传，能上传几张就几张， Promise.all这个语义不符合这个场景。promise数组中所有的promise实例都变为resolve的时候，该方法才会返回，并将所有结果传递results数组中。
  // promise数组中任何一个promise为reject的话，则整个Promise.all调用会立即终止，并返回一个reject的新的promise对象
  uploadImgsAsyncPromise(image) {
    if (!image) return false
    return new Promise((resolve, reject) => {
      let suffix = /\.\w+$/.exec(image)[0]; // 取文件后拓展名
      wx.cloud.uploadFile({
        cloudPath: 'angryCar/' + Date.now() + '-' + Math.random() * 1000000 + suffix,
        filePath: image,
        success: (res) => {
          // fileIds = fileIds.concat(res.fileID)
          resolve(res.fileID)
        },
        fail: (err) => {
          console.log("系统上传图片失败", err)
          reject(false)
        },
        complete: (args) => {
          console.log("系统上传图片成功", args)
        }
      })
    })
  },


  // 对车的事件进行相应的统计，carStat 表中各种数据进行更新
  async carEventStat(strCar, numCar, comment) {
    // console.log("carEventStat=", strCar, numCar, comment)
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'carEventStat',
        strCar: strCar,
        numCar: numCar,
        comment: comment
      },
      success: res => {
        console.log("统计成功 res=", res)
      },
      fail: err => {
        console.log('统计失败 err=', err);
      }
    })
  },
  async updateCarIndex(strCar, numCar) {
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'updateCarIndex',
        strCar: strCar,
        numCar: numCar
      },
      success: res => {
        console.log("更新车指数成功 res=", res)
      },
      fail: err => {
        console.log('更新车指数失败 err=', err);
      }
    })
  },

  async scoreSub10() {
    var openid = getApp().globalData.openid
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'scoreSub10',
        openid: openid,
        value: 10
      },
      success: res => {
        console.log("积分减少10成功 res=", res)
      },
      fail: err => {
        console.log('积分减少10失败 err=', err);
      }
    })
  },

  async updateDayIndex() {
    var currentTimeStamp = Date.parse(new Date())
    const num = Time.genTimeStampNum(currentTimeStamp)
    wx.cloud.callFunction({
      name: 'openapi',
      data: {
        action: 'updateDayIndex',
        dateNum: num
      },
      success: res => {
        console.log("更新当日指数成功 res=", res)
      },
      fail: err => {
        console.log('更新当日指数失败 err=', err);
      }
    })
  },

  onCloseCalendar(e) {
    this.setData({
      showPopupDate: false
    })
  },

  formatDate(date) {
    date = new Date(date);
    return `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`;
  },

  onConfirmCalendar(e) {
    this.setData({
      showPopupDate: false,
      car_time: this.formatDate(e.detail)
    })
  },


  // 提交车牌号码
  async submitAngryCarEvent() {
    let that = this
    // 车牌号是不能少的。完整的车牌号是必须的
    if (this.data.carnum[6]) {
      this.setSubmitProcess(30)
      if (false == that.checkCarNumber()) {
        return
      }
      this.onClickShow()
      this.setSubmitProcess(40)
      var imgOk = await this.checkImgs()
      if (!imgOk) {
        this.onHideCommitOverlay()
        Notify('图片有可能违法违规');
        return
      }
      this.setSubmitProcess(70)
      var result = await this.uploadImgs()
      if (!result) {
        Notify('图片由于网络原因可能部分没有上传成功');
      }
      this.setSubmitProcess(80)
      var numCar = this.strCar2Int()
      var strCar = this.data.carnum.join('')

      let optimise_car_place = ""
      if (this.data.province) {
        optimise_car_place += this.data.province
      }
      if (this.data.city) {
        optimise_car_place += this.data.city
      }
      if (this.data.district) {
        optimise_car_place += this.data.district
      }
      optimise_car_place += this.data.car_place
      var car_place = optimise_car_place
      var car_comment = this.data.car_comment
      var car_time = this.data.car_time
      var content = car_place + car_comment + car_time
      var textOk = await this.checkText(content)
      if (!textOk) {
        this.onHideCommitOverlay()
        Notify('输入可能违法违规内容，请重新输入');
        return
      }
      this.setSubmitProcess(90)

      await wx.cloud.callFunction({
        name: 'openapi',
        data: {
          action: 'addCar',
          car_num: strCar,
          reporter: that.data.openid,
          car_place: car_place,
          car_comment: car_comment,
          car_time: car_time,
          car_digit: numCar,
          images: this.data.cloudFileList
        },
        success: res => {
          Notify({
            type: 'success',
            message: '提交成功'
          });
          // that.scoreSub10()
          that.updateDayIndex()
          that.updateCarIndex(strCar, numCar)
          // 进行统计
          that.carEventStat(strCar, numCar, car_comment)
        },
        fail: err => {
          Notify('通知内提交失败容');
        }
      })
    } else {
      Notify("请输入车牌号")
    }
    this.setSubmitProcess(100)
    this.onHideCommitOverlay()
    this.setSubmitProcess(0)
    this.resetInput()


  },
  /**
   * bind:search	确定搜索时触发	event.detail: 当前输入值
   */
  onSearch: function (event) {
    var car_number = event.detail
    console.log("当前搜索输入值", car_number)
  },

  /**
   * bind:cancel	取消搜索搜索时触发
   */
  onCancel: function (event) {},

  //获取当前位置
  async setUserLocation() {
    console.log("setUserLocation")
    var that = this;
    wx.getSetting({
      success: (res) => {
        console.log(JSON.stringify(res))
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
                      that.getCurrentGpsLocationAndSpeed();
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
          that.getCurrentGpsLocationAndSpeed();
        } else {
          //调用wx.getLocation的API
          that.getCurrentGpsLocationAndSpeed();
        }
      }
    })
  },

  // 微信获得经纬度
  // https://developers.weixin.qq.com/community/develop/doc/000aee91a98d206bc6dbe722b51801?page=1#comment-list getLocation增加调用频率限制
  // 
  getCurrentGpsLocationAndSpeed: function () {
    let that = this;
    // 这个函数是一个异步的函数, 就是getCurrentLocationAndSpeed这个调用函数先结束, 然后再返回当前的Location和speed
    /*wx.getLocation({
      type: 'wgs84', // gps坐标 国际上通用的坐标系
      isHighAccuracy: true,
      highAccuracyExpireTime: 3,
      success: function (res) {
        console.log(JSON.stringify(res))
        const latitude = res.latitude // 纬度
        const longitude = res.longitude // 经度
        const speed = res.speed // 速度，单位 m/s
        const accuracy = res.accuracy; // 位置的精确度
        that.setPluginMapUrl(latitude, longitude)
        that.setCurrentHumanReadLocation(latitude, longitude)
      },
      fail: function (res) {
        console.log('fail' + JSON.stringify(res))
      }
    })*/

    if (wx.getFuzzyLocation) {
      /// getLocation增加调用频率限制, 当前小程序频繁调用wx.getLocation接口会导致用户手机电量消耗较快，请开发者改为使用持续定位接口wx.onLocationChange，该接口会固定频率回调，使用效果与跟频繁调用getLocation一致
      wx.getFuzzyLocation({
        type: 'wgs84',
        success(res) {
          const latitude = res.latitude
          const longitude = res.longitude
          that.setPluginMapUrl(latitude, longitude)
          that.setCurrentHumanReadLocation(latitude, longitude)
        },
        fail(err) {
          console.log('getFuzzyLocation' + JSON.stringify(err))
        }
      })
    }
    /// getLocation增加调用频率限制, 当前小程序频繁调用wx.getLocation接口会导致用户手机电量消耗较快，请开发者改为使用持续定位接口wx.onLocationChange，该接口会固定频率回调，使用效果与跟频繁调用getLocation一致
  },


  setPluginMapUrl: function (latitude, longitude) {
    const location = JSON.stringify({
      latitude: latitude,
      longitude: longitude
    });
    var plugin_url = 'plugin://chooseLocation/index?key=' + tx_location_service_key + '&referer=' + app_name + '&location=' + location + '&category=' + category
    this.setData({
      plugin_map_url: plugin_url
    })
  },

  // 获取当前地理位置 可读的文本形式 通过经纬度转换过来的
  getCurrentHumanReadLocation: function (latitude, longitude) {
    if (!latitude || !longitude) {
      console.log("getCurrentHumanReadLocation param null")
      return
    }
    let that = this;
    // 这个也是一个异步函数，当前函数结束之后， reverseGeocoder才会返回结果
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: latitude,
        longitude: longitude
      },
      success: function (res) {
        let province = res.result.ad_info.province
        let city = res.result.ad_info.city
        let address = res.result.address
        that.setData({
          province: province,
          city: city,
          latitude: latitude,
          longitude: longitude,
          address: address
        })
      },
      fail: function (res) {
        console.log("getCurrentHumanReadLocation fail", res);
      },
      complete: function (res) {
        console.log(res);
      }
    });
  },

  // 获取当前地理位置, 本接口提供由坐标到坐标所在位置的文字描述的转换，输入坐标返回地理位置信息和附近poi列表
  setCurrentHumanReadLocation: function (latitude, longitude) {
    if (!latitude || !longitude) {
      console.log("setCurrentHumanReadLocation param null")
      return
    }
    let that = this;
    // 这个也是一个异步函数，当前函数结束之后， reverseGeocoder才会返回结果
    qqmapsdk.reverseGeocoder({
      location: {
        latitude: latitude,
        longitude: longitude
      },
      success: function (res) {
        let province = res.result.ad_info.province
        let city = res.result.ad_info.city
        let address = res.result.address
        let detailed_address = ""
        if (!res.result.formatted_addresses.recommend.includes(res.result.ad_info.province)) {
          detailed_address += res.result.ad_info.province
        }
        if (!res.result.formatted_addresses.recommend.includes(res.result.ad_info.city)) {
          detailed_address += res.result.ad_info.city
        }
        detailed_address += res.result.formatted_addresses.recommend
        that.setData({
          province: province,
          city: city,
          latitude: latitude,
          longitude: longitude,
          address: address
        })
        var options = that.data.optionObj
        if (options) {
          detailed_address = options.place
          console.log("设置地点参数", detailed_address)
        }
        that.setData({
          car_place: detailed_address
        })
      },
      fail: function (res) {
        console.log(res);
      },
      complete: function (res) {
        console.log(res);
      }
    });
  },

  setCurrentTime() {
    var currentTimeStamp = Date.parse(new Date())
    // var currentTime = Time.formatTime(currentTimeStamp, 'Y-M-D h:m:s')
    var currentTime = Time.formatTime(currentTimeStamp, 'Y-M-D')
    var options = this.data.optionObj
    if (options) {
      currentTime = options.time
      console.log("设置了参数 ", currentTime)
    }
    this.setData({
      car_time: currentTime
    })
  },
  /**
   * 生命周期函数--监听页面加载
   */
  async onLoad(options) {
    console.log("onLoad ", options)
    if (options && options.time && options.place) {
      console.log("从别的页面过来的参数", options)
      var optionObj = new Object()
      optionObj.time = options.time
      optionObj.place = options.place
      this.setData({
        optionObj: optionObj
      })
    }

    // 实例化API核心类
    qqmapsdk = new QQMapWX({
      key: tx_location_service_key
    });
    let that = this

    this.setData({
      car_comment: "违规停车"
    })
    this.setUserLocation()
    this.setCurrentTime()

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
      },
      fail: err => {
        console.log("getopenID fail", err)
      }
    })
  },

  /**
   * 生命周期函数--监听页面初次渲染完成
   */
  onReady: function () {},

  onCancelTime(event) {
    this.setData({
      showPopupDate: false
    });
  },

  onConfirmTime(event) {
    this.setData({
      currentDate: event.detail,
      showPopupDate: false
    });
    var time = Time.formatTime(event.detail, 'Y-M-D h:m:s')
    this.setData({
      car_time: time
    })
  },

  onInputTime(event) {
    this.setData({
      currentDate: event.detail,
    });
  },

  /**
   * 生命周期函数--监听页面显示
   */
  onShow: function () {
    // 从地图选点插件返回后，在页面的onShow生命周期函数中能够调用插件接口，取得选点结果对象
    const location = chooseLocation.getLocation(); // 如果点击确认选点按钮，则返回选点结果对象，否则返回null
    if (location) {
      console.log("从地图上选择的位置 ", location)
      this.setData({
        car_place: location.name
      })
    }

    wx.enableAlertBeforeUnload({
      message: "当前页面是否有数据保存，点击确认返回上一页面",
      complete: (e) => {
        console.log(e);
      }
    })
  },

  /**
   * 生命周期函数--监听页面隐藏
   */
  onHide: function () {},

  /**
   * 生命周期函数--监听页面卸载
   */
  onUnload: function () {
    // if (true == this.data.InputCarKeyboardState) {
    //   this.setData({
    //     InputCarKeyboardState: false
    //   })
    //   return
    // }

    // if (true == this.data.showRemarks) {
    //   this.setData({
    //     showRemarks: false
    //   })
    //   return
    // }

    // if (true == this.data.showPopupDate) {
    //   this.setData({
    //     showPopupDate: false
    //   })
    //   return
    // }

    // 页面卸载时设置插件选点数据为null，防止再次进入页面，geLocation返回的是上次选点结果
    chooseLocation.setLocation(null);
    this.data.optionObj = undefined
  },

  /**
   * 页面相关事件处理函数--监听用户下拉动作
   */
  onPullDownRefresh: function () {
    this.setCurrentHumanReadLocation(this.data.latitude, this.data.longitude)
    this.setCurrentTime()
    // 在这里更新指数
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
  }
})