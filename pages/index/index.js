const ble = require("../../utils/ble");

//index.js
//获取应用实例
const app = getApp()

Page({
  data: {
    agt_num: '',
    app_key: '',
    pid: ''
  },
  onLoad: function () {
    this.setData({
      agt_num: wx.getStorageSync("agt_num"),
      app_key: wx.getStorageSync("app_key"),
      pid: wx.getStorageSync("pid")
    });
  },
  inputBlue(e) {
    let data = {};
    data[e.target.id] = e.detail.value;
    this.setData(data);
    wx.setStorageSync(e.target.id, e.detail.value);
  },
  openLock: function() {
    console.log("开锁: " + JSON.stringify(this.data))
    if (!this.data.agt_num || !this.data.app_key || !this.data.pid) {
      wx.showToast({
        title: '请正确填写开锁信息。',
        icon: 'none',
        duration: 2000
      })
      return;
    }
    
    wx.request({
      url: "https://md-open.yanglb.com/service/getData",
      data: this.data,
      fail: error => {
        wx.showModal({
          title: "错误",
          content: "网络错误，无法获取开锁数据。\n" + error.errMsg,
          showCancel: false
        })
      },
      success: (data) => {
        data = data.data;
        if (data.code != 0) {
          console.error("请求失败");
          wx.showToast({
            title: data.msg,
            icon: 'none',
            duration: 2000
          })
          return;
        }

        console.log("返回成功");
        ble.write(
          data.data.ssid,
          data.data.serviceUUID,
          data.data.writeUUID,
          data.data.notifyUUID,
          data.data.key_content,
          function (error, notifyData) {
            if (error) {
              console.error(error);
              wx.showModal({ 
                title: "操作失败", 
                content: error.message,
                showCancel: false
              })
              return;
            }

            // 成功 打印通知数据
            console.log("设备返回数据: " + notifyData);
            if (notifyData.toUpperCase() == data.data.callback_success.toUpperCase()) {
              wx.showModal({
                title: "开门成功",
                showCancel: false
              })
            } else {
              wx.showModal({
                title: "开门失败",
                showCancel: false
              })
            }
          }
        );
      }
    })
  }
})
