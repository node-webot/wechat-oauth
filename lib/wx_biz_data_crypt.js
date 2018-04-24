'use strict';

var crypto = require('crypto');

/**
 * 根据appId和小程序的sessionKey对小程序解密器的构造函数
 * 该代码来自官方示例：https://developers.weixin.qq.com/miniprogram/dev/api/signature.html
 * Examples:
 * ```
 * var WXBizDataCrypt = require('./wx_biz_data_crypt');
 * var decrypter = new WXBizDataCrypt('appid', 'sessionKey');
 * ```
 * @param {String} appid 在公众平台上申请得到的appid
 * @param {String} session_key 根据appid和小程序auth code获得的对应用户sessionKey
 */
function WXBizDataCrypt(appId, sessionKey) {
  this.appId = appId;
  this.sessionKey = sessionKey;
}

/**
 * 通过已有的解密器对小程序加密数据进行解密
 *
 * @param {String} encryptedData 从小程序中获得的加密数据，格式应该为base64
 * @param {String} iv 从小程序中获得加密算法初始向量initial-vector，格式应当为base64
 */
WXBizDataCrypt.prototype.decryptData = function (encryptedData, iv) {
  // base64 decode
  var sessionKey = new Buffer(this.sessionKey, 'base64');
  var encryptedBuffer = new Buffer(encryptedData, 'base64');
  var ivBuffer = new Buffer(iv, 'base64');

  try {
    // 解密
    var decipher = crypto.createDecipheriv('aes-128-cbc', sessionKey, ivBuffer);
    // 设置自动 padding 为 true，删除填充补位
    decipher.setAutoPadding(true);
    var decoded = decipher.update(encryptedBuffer, 'binary', 'utf8');
    decoded += decipher.final('utf8');

    decoded = JSON.parse(decoded);

  } catch (err) {
    throw new Error('Illegal Buffer, Is Your Data Correct?');
  }

  if (decoded.watermark.appid !== this.appId) {
    throw new Error('Invalid Watermark, Be Sure to Check Again');
  }

  return decoded;
};

module.exports = WXBizDataCrypt;
