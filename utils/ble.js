'use strict';
const utility = require("./utility");
import * as async from "./async.min.js";

var ble = {
	/**
	 * 等待设备响应超时时间
	 */
	waitResponseTimeout: 500,
	
	/**
	 * 扫描超时时间
	 */
	scanBLETimeout: 5000,
	
	/**
	 * 连接超时时间
	 */
	connectTimeout: 2000,
	
	/**
	 * 向蓝牙设备写入数据，并等待设备回复
	 * @param callback 写入结果及数据通知
	 */
	write: function(ssid, serviceUUID, writeUUID, notifyUUID, data, callback) {
		serviceUUID = serviceUUID.toUpperCase();
		writeUUID   = writeUUID.toUpperCase();
		notifyUUID  = notifyUUID.toUpperCase();
		
		var device = null;
		ble.init()
			.then(() => {
				return ble.scan(ssid);
			})
			.then((dev) => {
				device = dev;
				return ble.connect(dev);
			})
			.then(() => {
				// 经测试: 刚连接后获取服务会失败，先等待几秒钟
				return new Promise((resolve, reject) => {
					setTimeout(() => {
						ble.setup(device, serviceUUID, writeUUID, notifyUUID)
							.then(resolve)
							.catch(reject);
					}, 1000);
				})
				// return ble.setup(device, serviceUUID, writeUUID, notifyUUID);
			})
			.then(() => {
				return ble.writeData(device, serviceUUID, writeUUID, data);
			})
			.then(() => {
				return ble.waitResponse();
			})
			.then((res) => {
				callback(null, res);
			})
			.catch((e) => callback(e))
			.finally(() => {
				// 清理
				wx.stopBluetoothDevicesDiscovery({});
				if (device) {
					console.log("关闭连接");
					wx.closeBLEConnection({
						deviceId: device.deviceId
					});

          wx.closeBluetoothAdapter({})
				}
				ble.onNotify = null;
			});
	},
	
	//////////////////////////////////////////////////
	// 以下为内部使用方法
	//////////////////////////////////////////////////
	isInited: false,
	init: function() {
		return new Promise((resolve, reject) => {
			console.log("ble.init");
			if (ble.isInited) return resolve();
      wx.openBluetoothAdapter({
				success: function(e) {
					ble.isInited = true;
          wx.onBLECharacteristicValueChange(ble.onBLECharacteristicValueChange);
					resolve();
				},
				fail: function(e) {
					console.log('open failed: '+JSON.stringify(e));
					reject(new Error('打开蓝牙失败'));
				}
			})
		})
	},
	onBLECharacteristicValueChange: function(event) {
		console.log("onBLECharacteristicValueChange: " + event.deviceId);
		if (typeof(ble.onNotify) === 'function') {
			ble.onNotify(event);
		}
	},
	waitResponse: function() {
		return new Promise((resolve, reject) => {
			console.log("ble.waitResponse");
			// 超时
			var t = setTimeout(() => {
				var e = new Error("等待设备回复超时");
				ble.onNotify = null;
				
				reject(e);
			}, ble.waitResponseTimeout);
			
			ble.onNotify = function(e) {
				clearTimeout(t);
				
				var data = new Uint8Array(e.value);
				var s = utility.data2hexString(data);
				console.log("设备回复: " + s);
				resolve(s);
			}
		})
	},
	
	scanMap: {},
	scan: function(ssid) {
		return new Promise((resolve, reject) => {
			console.log("ble.scan: " + ssid);
			// 缓存
			if (ble.scanMap[ssid]) return resolve(ble.scanMap[ssid]);
			
			// 超时
			var t = setTimeout(() => {
				var e = new Error("扫描超时");
        wx.stopBluetoothDevicesDiscovery({});
				reject(e);
			}, ble.scanBLETimeout);
			
			// 监听扫描结果
      wx.onBluetoothDeviceFound(devices => {
				for(var i in devices.devices){
					var dev = devices.devices[i];
					console.log('扫描到设备: ' + JSON.stringify(dev));
					
					if (dev.name == ssid) {
						ble.scanMap[ssid] = dev;
						
						// 停止扫描
            wx.stopBluetoothDevicesDiscovery({});
						clearTimeout(t);
						
						console.log('发现目标设备: ' + dev.name);
						resolve(dev);
					}
				}
			});
			
			// 启动蓝牙扫描
      wx.startBluetoothDevicesDiscovery({
				allowDuplicatesKey: false,
				fail: function(e) {
					console.log('扫描设备失败: '+JSON.stringify(e));
          wx.stopBluetoothDevicesDiscovery({});
					clearTimeout(t);
					reject(new Error('扫描设备失败'));
				},
				success: function() {
					console.log("已启动扫描");
				}
			})
		})
	},
	
	connect: function(device) {
		return new Promise((resolve, reject) => {
			console.log("ble.connect: " + device.id);
			
      wx.createBLEConnection({
				deviceId: device.deviceId,
				timeout: ble.connectTimeout,
				success: function() {
					console.log("连接成功");
					resolve();
				},
				fail: function(e) {
					if (e.message == "already connect") {
						console.log("连接成功");
						resolve();
						return;
					}
					
					console.log("连接失败: " + JSON.stringify(e));
					reject(new Error("连接失败"));
				}
			})
		})
	},
	
	setup: function(device, serviceUUID, writeUUID, notifyUUID) {
		return new Promise((resolve, reject) => {
			console.log("ble.setup");
			
			// 获取服务
      wx.getBLEDeviceServices({
				deviceId: device.deviceId,
				success: function(e) {
					let service = null;
					console.log("获取服务: " + JSON.stringify(e.services));
					for (let i in e.services) {
						var itm = e.services[i];
						if (itm.uuid.toUpperCase() == serviceUUID) {
							service = itm;
							break;
						}
					}
					
					if (!service) {
						console.log("当前蓝牙设备(" + device.deviceId + ")没有特定的服务: " + serviceUUID);
						reject(new Error("获取蓝牙服务失败"));
						return;
					}
					
					// 获取特征
          wx.getBLEDeviceCharacteristics({
						deviceId: device.deviceId,
						serviceId: serviceUUID,
						success: function(e) {
							let wc = null, nc = null;
							for (let i in e.characteristics) {
								var itm = e.characteristics[i];
								if (itm.uuid.toUpperCase() == writeUUID) {
									wc = itm;
								}
								
								if (itm.uuid.toUpperCase() == notifyUUID) {
									nc = itm;
								}
							}
							
							if (!wc || !nc) {
								console.log("获取蓝牙特征失败");
								reject(new Error("获取蓝牙特征失败"));
								return;
							}
							
							// 订阅通知
              wx.notifyBLECharacteristicValueChange({
								deviceId: device.deviceId,
								serviceId: serviceUUID,
								characteristicId: notifyUUID,
								state: true,
								success: function() {
									console.log("启用订阅成功: " + device.deviceId + " => " + notifyUUID);
									resolve();
								},
								fail: function(e) {
									console.log("启用订阅失败: " + JSON.stringify(e));
									reject(new Error("启用订阅失败"));
								}
							})
						},
						fail: function(e) {
							console.log("获取蓝牙特征失败: " + JSON.stringify(e));
							reject(new Error("获取蓝牙特征失败"));
						}
					})
				},
				fail: function(e) {
					console.log("获取蓝牙服务失败: " + JSON.stringify(e));
					reject(new Error("获取蓝牙服务失败"));
				}
			})
		});
	},
	
	writeData: function(device, serviceUUID, writeUUID, data) {
		return new Promise((resolve, reject) => {
			console.log("ble.writeData");
			
			// 拆分数据并写入
			var dataList = utility.splitString(data, 40);
			async.eachLimit(dataList, 1, function(d, callback) {
				setTimeout(() => {
					console.log("写入数据: " + d);
					var v = utility.hexString2Data(d);
					wx.writeBLECharacteristicValue({
						deviceId: device.deviceId,
						serviceId: serviceUUID,
						characteristicId: writeUUID,
						value: v.buffer,
						success: function() {
							callback();
						},
						fail: function(e) {
							console.log("写入数据失败: " + JSON.stringify(e));
							callback(new Error("写入数据失败"));
						}
					})
				}, 50);
			}, (error) => {
				if (error) {
					reject(error);
				} else {
					resolve();
				}
			});
		});
	}
}

module.exports = ble;