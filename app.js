//app.js
App({
  onLaunch: function () {
    Promise.prototype.finally = function (callback) {
      let P = this.constructor;
      return this.then(
        value => P.resolve(callback()).then(() => value),
        reason => P.resolve(callback()).then(() => { throw reason })
      );
    };

    if (!String.prototype.startsWith) {
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
    String.format = function () {
      var s = arguments[0];
      for (var i = 0; i < arguments.length - 1; i++) {
        var reg = new RegExp("\\{" + i + "\\}", "gm");
        s = s.replace(reg, arguments[i + 1]);
      }

      return s;
    }
  },
  globalData: {
  }
})