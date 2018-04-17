'use strict';

var crypto = require('crypto');
var expect = require('expect.js');
var urllib = require('urllib');
var WxBizCrypt = require('../lib/wx_biz_data_crypt');

describe('wx_biz_data_crypt.js', function () {
  describe('decryptData', function () {
    var appId = 'appId';
    var sessionKey = crypto.randomBytes(16).toString('base64');
    var iv = crypto.randomBytes(16).toString('base64');
    var data = {
      openid: 'openid',
      exampleField1: 'just a example',
      watermark: {
        appid: appId,
      },
    };

    var cipher = crypto.createCipheriv('aes-128-cbc', new Buffer(sessionKey, 'base64'), new Buffer(iv, 'base64'));
    cipher.setAutoPadding(true);
    var encryptedData = cipher.update(JSON.stringify(data), 'utf8', 'base64');
    encryptedData += cipher.final('base64');

    var cryptor = new WxBizCrypt(appId, sessionKey);

    it('should ok', function () {
      var decryptedData = cryptor.decryptData(encryptedData, iv);
      expect(decryptedData.openid).to.equal(data.openid);
      expect(decryptedData.exampleField1).to.equal(data.exampleField1);
      expect(decryptedData.watermark.appid).to.equal(data.watermark.appid);
    });

    it('should not ok on invalid decrypted data input', function (){
      try{
        cryptor.decryptData('', iv);
      }catch(e){
        expect(e).to.be.a(Error);
      }
    });

    it('should not ok on invalid decrypted data input', function (){
      try{
        cryptor.decryptData(encryptedData, '');
      }catch(e){
        expect(e).to.be.a(Error);
      }
    });

    it('should not ok with invalid app id', function (){
      var invalidCryptor = new WxBizCrypt('invalid app id', sessionKey);
      console.log(invalidCryptor.appId);
      try{
        invalidCryptor.decryptData(encryptedData, iv);
      }catch(e){
        expect(e).to.be.a(Error);
      }
    });
  });
});
