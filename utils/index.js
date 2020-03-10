var $conf = {
	agt_num: "",
	app_key: "",
	pid: ""
};

var app = {
	init: function() {
		$("#start").removeAttr('disabled');
	},
	
	openLock: function() {
		console.log("====== 开始开锁 ======");
		
		// 获取开锁数据
		$.ajax({
			type: 'POST',
			url: 'http://121.40.204.191:18080/mdserver/service/getData',
			dataType: "json",
			data: $conf,
			success: function(data) {
				console.log(JSON.stringify(data));
				
				// 写入蓝牙
				ble.write(
					data.data.ssid, 
					data.data.serviceUUID, 
					data.data.writeUUID, 
					data.data.notifyUUID, 
					data.data.key_content,
					function(error, notifyData) {
						if (error) {
							console.error(error);
							alert('开锁失败: ' + error.message);
							return;
						}
						
						// 成功 打印通知数据
						console.log("设备返回数据: " + notifyData);
						if (notifyData.toUpperCase() == data.data.callback_success.toUpperCase()) {
							alert("开门成功");
						} else {
							alert("开门失败");
						}
					}
				);
			}
		})
	}
}
document.addEventListener('plusready', app.init, false);
