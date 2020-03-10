if(!String.prototype.startsWith){
    String.prototype.startsWith = function (str) {
        return !this.indexOf(str);
    }
}
if (!String.prototype.endWith) {
    String.prototype.endWith = function (str) {
        if (this.length < str.length) return false;
        return this.substr(this.length - str.length) == str;
    }
}
String.format = function() {
  var s = arguments[0];
  for (var i = 0; i < arguments.length - 1; i++) {       
    var reg = new RegExp("\\{" + i + "\\}", "gm");             
    s = s.replace(reg, arguments[i + 1]);
  }

  return s;
}

/**
 * 工具类
 */
var utility = {
    /**
     * 获取本地保存的对象
     */
    objectForKey:function(key) {
        return JSON.parse(localStorage.getItem(key));
    },

    /**
     * 将对象保存到本地存储中
     */
    setObjectForKey:function(object, key) {
        if (object) {
            localStorage.setItem(key, JSON.stringify(object));
        } else {
            localStorage.removeItem(key);
        }
    },
    getOrSetObjectForKey: function(key, data) {
        if (typeof (data) != 'undefined') {
            utility.setObjectForKey(data, key);
            return data;
        }

        return utility.objectForKey(key);
    },

    /**
     * 将Uint8Array转换为16进制字符串
     */
    data2hexString: function(data, split) {
        var hex = '';
        split = typeof(split) == 'string' ? split : '';
        for (var i=0; i<data.length; i++) {
            var value = data[i];
            var s = value.toString(16);
            s = s.length==2 ? s : '0'+s;

            hex += (s + split);
        };

        hex = hex.substr(0, hex.length-split.length).toLowerCase();
        return hex;
    },

    /**
     * 将16进制字符串转为buffer
     */
    hexString2Data: function(string) {
        var data = new Uint8Array(string.length / 2);
        for (var i=0; i<data.length; i++) {
            var s = '0x' + string.substr(i * 2, 2);
            data[i] = parseInt(s);
        }
        return data;
    },

    /**
     * 将Uint8Array转换为10进制字符串
     */
    data2String: function(data, split) {
        var hex = '';
        split = typeof(split) == 'string' ? split : '';
        for (var i=0; i<data.length; i++) {
            var value = data[i];
            var s = value.toString();
            hex += (s + split);
        };

        hex = hex.substr(0, hex.length-split.length);
        return hex;
    },
	
	/**
	 * 按长度分隔字符串
	 */
	splitString(str, len) {
		var r = Math.ceil((str.length) / len);
		var idx = 0;
		var res = [];
		
		for(var i=0; i<r; i++) {
			var s = str.substring(i*len, (i+1) * len);
			res.push(s);
		}
		return res;
	},

    /**
     * 返回子元素（由于某些版本的手机不支持 Uint8Array 的方法，所以只好手动处理）
     */
    subarray: function(array, start, length) {
        var result = new Uint8Array(length);
        for(var i=0; i<length; i++) {
            result[i] = array[start + i];
        }
        return result;
    },

    /**
     * 合并两个数组
     * @param {Uint8Array} arr1 数组1
     * @param {Uint8Array} arr2 数组2
     */
    mergeArray: function(arr1, arr2) {
        var result = new Uint8Array(arr1.length + arr2.length);
        for (var i=0; i<arr1.length; i++) {
            result[i] = arr1[i];
        }
        for (var i=0; i<arr2.length; i++) {
            result[arr1.length + i] = arr2[i];
        }
        return result;
    },

    /**
     * 计算校验码
     * @param {Uint8Array} data 要计算校验码的数据
     * @param {int} length 计算长度
     */
    calcSum: function(data, length) {
        var res = new Uint8Array(1);
        for (var i=0; i<length; i++) {
            res[0] += data[i];
        }

        return res[0];
    },

    /**
     * 生成随机码
     */
    randomCode: function() {
        // 开发模式下随机码设置为0
        if ($conf && $conf.DEBUG) return 0x00;

        var data = new Uint8Array(1);
        data[0] = parseInt(Math.random() * 100000);
        return data[0];
    },

    /**
     * 加密
     * @param {Uint8Array} data 要加密的数据
     */
    encrypt: function(data) {
        var index = 2; // 第2位开始
        var code = data[index - 1];

        var result = new Uint8Array(data.length);
        for (var i=0; i<index; i++) {
            result[i] = data[i];
        }

        // 最后一位也计算
        for (var i=index; i<data.length; i++) {
            result[i] = data[i] + code;
        }
        return result;
    },

    /**
     * 解密
     * @param {Uint8Array} data 要解密的数据
     */
    decrypt: function(data) {
        var index = 2; // 第2位开始
        var code = data[index - 1];

        var result = new Uint8Array(data.length);
        for (var i=0; i<index; i++) {
            result[i] = data[i];
        }

        // 最后一位也计算
        for (var i=index; i<data.length; i++) {
            result[i] = data[i] - code;
        }
        return result;
    }
}