'use strict';

var expect = require('expect.js');
var urllib = require('urllib');
var muk = require('muk');
var OAuth = require('../');
var config = require('./config');

describe('oauth.js', function () {
  describe('getAuthorizeURL', function () {
    var auth = new OAuth('appid', 'appsecret');
    it('should ok', function () {
      var url = auth.getAuthorizeURL('http://diveintonode.org/');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/oauth2/authorize?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_base&state=#wechat_redirect');
    });

    it('should ok with state', function () {
      var url = auth.getAuthorizeURL('http://diveintonode.org/', 'hehe');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/oauth2/authorize?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_base&state=hehe#wechat_redirect');
    });

    it('should ok with state and scope', function () {
      var url = auth.getAuthorizeURL('http://diveintonode.org/', 'hehe', 'snsapi_userinfo');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/oauth2/authorize?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_userinfo&state=hehe#wechat_redirect');
    });
  });

  describe('getAuthorizeURLForWebsite', function () {
    var auth = new OAuth('appid', 'appsecret');
    it('should ok', function () {
      var url = auth.getAuthorizeURLForWebsite('http://diveintonode.org/');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/qrconnect?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_login&state=#wechat_redirect');
    });

    it('should ok with state', function () {
      var url = auth.getAuthorizeURLForWebsite('http://diveintonode.org/', 'hehe');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/qrconnect?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_login&state=hehe#wechat_redirect');
    });

    it('should ok with state and scope', function () {
      var url = auth.getAuthorizeURLForWebsite('http://diveintonode.org/', 'hehe', 'snsapi_userinfo');
      expect(url).to.be.equal('https://open.weixin.qq.com/connect/qrconnect?appid=appid&redirect_uri=http%3A%2F%2Fdiveintonode.org%2F&response_type=code&scope=snsapi_userinfo&state=hehe#wechat_redirect');
    });
  });

  describe('getAccessToken', function () {
    var api = new OAuth(config.appid, config.appsecret);
    it('should invalid', function (done) {
      api.getAccessToken('code', function (err, data) {
        expect(err).to.be.ok();
        expect(err.name).to.be.equal('WeChatAPIError');
        expect(err.message).to.contain('invalid code');
        done();
      });
    });

    describe('should ok', function () {
      before(function () {
        muk(urllib, 'request', function (url, args, callback) {
          var resp = {
            "access_token":"ACCESS_TOKEN",
            "expires_in":7200,
            "refresh_token":"REFRESH_TOKEN",
            "openid":"OPENID",
            "scope":"SCOPE"
          };
          process.nextTick(function () {
            callback(null, resp);
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.getAccessToken('code', function (err, token) {
          expect(err).not.to.be.ok();
          expect(token).to.have.property('data');
          expect(token.data).to.have.keys('access_token', 'expires_in', 'refresh_token', 'openid', 'scope', 'create_at');
          done();
        });
      });
    });

    describe('should not ok', function () {
      before(function () {
        muk(urllib, 'request', function (url, args, callback) {
          var resp = {
            "access_token":"ACCESS_TOKEN",
            "expires_in": 0.1,
            "refresh_token":"REFRESH_TOKEN",
            "openid":"OPENID",
            "scope":"SCOPE"
          };

          setTimeout(function () {
            callback(null, resp);
          }, 100);
        });
      });

      after(function () {
        muk.restore();
      });

      it('should not ok', function (done) {
        api.getAccessToken('code', function (err, token) {
          expect(token.isValid()).not.to.be.ok();
          done();
        });
      });
    });
  });

  describe('refreshAccessToken', function () {
    var api = new OAuth('appid', 'secret');

    it('should invalid', function (done) {
      api.refreshAccessToken('refresh_token', function (err, data) {
        expect(err).to.be.ok();
        expect(err.name).to.be.equal('WeChatAPIError');
        expect(err.message).to.contain('invalid appid');
        done();
      });
    });

    describe('should ok', function () {
      before(function () {
        muk(urllib, 'request', function (url, args, callback) {
          var resp = {
            "access_token":"ACCESS_TOKEN",
            "expires_in":7200,
            "refresh_token":"REFRESH_TOKEN",
            "openid":"OPENID",
            "scope":"SCOPE"
          };
          process.nextTick(function () {
            callback(null, resp);
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.refreshAccessToken('refresh_token', function (err, token) {
          expect(err).not.to.be.ok();
          expect(token.data).to.have.keys('access_token', 'expires_in', 'refresh_token', 'openid', 'scope', 'create_at');
          done();
        });
      });
    });
  });

  describe('_getUser', function () {
    it('should invalid', function (done) {
      var api = new OAuth('appid', 'secret');
      api._getUser('openid', 'access_token', function (err, data) {
        expect(err).to.be.ok();
        expect(err.name).to.be.equal('WeChatAPIError');
        expect(err.message).to.contain('invalid credential, access_token is invalid or not latest');
        done();
      });
    });

    describe('mock get user ok', function () {
      var api = new OAuth('appid', 'secret');
      before(function () {
        muk(urllib, 'request', function (url, args, callback) {
          process.nextTick(function () {
            callback(null, {
              "openid": "OPENID",
              "nickname": "NICKNAME",
              "sex": "1",
              "province": "PROVINCE",
              "city": "CITY",
              "country": "COUNTRY",
              "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
              "privilege": [
                "PRIVILEGE1",
                "PRIVILEGE2"
              ]
            });
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api._getUser('openid', 'access_token', function (err, data) {
          expect(err).not.to.be.ok();
          expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
            'country', 'headimgurl', 'privilege');
          done();
        });
      });
    });
  });

  describe('getUser', function () {
    it('can not get token', function (done) {
      var api = new OAuth('appid', 'secret');
      api.getUser('openid', function (err, data) {
        expect(err).to.be.ok();
        expect(err.message).to.be.equal('No token for openid, please authorize first.');
        done();
      });
    });

    describe('mock get token error', function () {
      var api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', function (openid, callback) {
          process.nextTick(function () {
            callback(new Error('get token error'));
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.getUser('openid', function (err, data) {
          expect(err).to.be.ok();
          expect(err.message).to.be.equal('get token error');
          done();
        });
      });
    });

    describe('mock get null data', function () {
      var api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', function (openid, callback) {
          process.nextTick(function () {
            callback(null, null);
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.getUser('openid', function (err, data) {
          expect(err).to.be.ok();
          expect(err).to.have.property('name', 'NoOAuthTokenError');
          expect(err).to.have.property('message', 'No token for openid, please authorize first.');
          done();
        });
      });
    });

    describe('mock get valid token', function () {
      var api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', function (openid, callback) {
          process.nextTick(function () {
            callback(null, {
              access_token: 'access_token',
              create_at: new Date().getTime(),
              expires_in: 60
            });
          });
        });
        muk(api, '_getUser', function (openid, accessToken, callback) {
          process.nextTick(function () {
            callback(null, {
              "openid": "OPENID",
              "nickname": "NICKNAME",
              "sex": "1",
              "province": "PROVINCE",
              "city": "CITY",
              "country": "COUNTRY",
              "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
              "privilege": [
                "PRIVILEGE1",
                "PRIVILEGE2"
              ]
            });
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok with openid', function (done) {
        api.getUser('openid', function (err, data) {
          expect(err).not.to.be.ok();
          expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
            'country', 'headimgurl', 'privilege');
          done();
        });
      });

      it('should ok with options', function (done) {
        api.getUser({openid: 'openid', lang: 'en'}, function (err, data) {
          expect(err).not.to.be.ok();
          expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
            'country', 'headimgurl', 'privilege');
          done();
        });
      });

      it('should ok with options', function (done) {
        api.getUser({openid: 'openid'}, function (err, data) {
          expect(err).not.to.be.ok();
          expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
            'country', 'headimgurl', 'privilege');
          done();
        });
      });
    });

    describe('mock get invalid token', function () {
      var api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', function (openid, callback) {
          process.nextTick(function () {
            callback(null, {
              access_token: 'access_token',
              create_at: new Date().getTime() - 70 * 1000,
              expires_in: 60
            });
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.getUser('openid', function (err, data) {
          expect(err).to.be.ok();
          expect(err).to.have.property('name', 'WeChatAPIError');
          expect(err.message).to.contain('refresh_token missing');
          done();
        });
      });
    });

    describe('mock get invalid token and refresh_token', function () {
      var api = new OAuth('appid', 'secret');
      before(function () {
        muk(api, 'getToken', function (openid, callback) {
          process.nextTick(function () {
            callback(null, {
              access_token: 'access_token',
              refresh_token: 'refresh_token',
              create_at: new Date().getTime() - 70 * 1000,
              expires_in: 60
            });
          });
        });

        muk(api, 'refreshAccessToken', function (refreshToken, callback) {
          var resp = {
            data: {
              "access_token": "ACCESS_TOKEN",
              "expires_in": 7200,
              "refresh_token": "REFRESH_TOKEN",
              "openid": "OPENID",
              "scope": "SCOPE"
            }
          };
          process.nextTick(function () {
            callback(null, resp);
          });
        });

        muk(api, '_getUser', function (openid, accessToken, callback) {
          process.nextTick(function () {
            callback(null, {
              "openid": "OPENID",
              "nickname": "NICKNAME",
              "sex": "1",
              "province": "PROVINCE",
              "city": "CITY",
              "country": "COUNTRY",
              "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
              "privilege": [
                "PRIVILEGE1",
                "PRIVILEGE2"
              ]
            });
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.getUser('openid', function (err, data) {
          expect(err).not.to.be.ok();
          expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city', 'country', 'headimgurl', 'privilege');
          done();
        });
      });
    });
  });

  describe('mock getUserByCode', function () {
    var api = new OAuth('appid', 'secret');
    before(function () {
      muk(urllib, 'request', function (url, args, callback) {
        var resp = {
          "access_token":"ACCESS_TOKEN",
          "expires_in":7200,
          "refresh_token":"REFRESH_TOKEN",
          "openid":"OPENID",
          "scope":"SCOPE"
        };
        process.nextTick(function () {
          callback(null, resp);
        });
      });

      muk(api, '_getUser', function (openid, accessToken, callback) {
        process.nextTick(function () {
          callback(null, {
            "openid": "OPENID",
            "nickname": "NICKNAME",
            "sex": "1",
            "province": "PROVINCE",
            "city": "CITY",
            "country": "COUNTRY",
            "headimgurl": "http://wx.qlogo.cn/mmopen/g3MonUZtNHkdmzicIlibx6iaFqAc56vxLSUfpb6n5WKSYVY0ChQKkiaJSgQ1dZuTOgvLLrhJbERQQ4eMsv84eavHiaiceqxibJxCfHe/46",
            "privilege": [
              "PRIVILEGE1",
              "PRIVILEGE2"
            ]
          });
        });
      });
    });

    after(function () {
      muk.restore();
    });

    it('should ok with getUserByCode', function (done) {
      api.getUserByCode('code', function (err, data) {
        expect(err).not.to.be.ok();
        expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
          'country', 'headimgurl', 'privilege');
        done();
      });
    });

    it('should ok with getUserByCode', function (done) {
      var options = {code: 'code', lang: 'en'};
      api.getUserByCode(options, function (err, data) {
        expect(err).not.to.be.ok();
        expect(data).to.have.keys('openid', 'nickname', 'sex', 'province', 'city',
          'country', 'headimgurl', 'privilege');
        done();
      });
    });
  });

  describe('mock getUserByCode mini program', function () {
    describe('should ok', function () {
      var api = new OAuth('appid', 'secret', null, null, true);
      before(function () {
        muk(api, 'getSessionKey', function (code, callback) {
          var resp = {
            data: {
              session_key: 'SESSION_KEY',
              expires_in:7200,
              openid: 'OPENID',
              unionid: 'UNIONID'
            }
          };
          process.nextTick(function () {
            callback(null, resp);
          });
        });

        muk(api, 'decryptMiniProgramUser', function (code) {
          return {
            openId: 'OPENID',
            nickName: 'NICKNAME',
            gender: 0,
            city: 'CITY',
            province: 'PROVINCE',
            country: 'COUNTRY',
            avatarUrl: 'AVATARURL',
            unionId: 'UNIONID',
          };
        });
      });

      it('should ok with getUserByCode', function (done) {
        api.getUserByCode('code', function (err, data) {
          expect(err).not.to.be.ok();
          expect(data).to.have.keys('openId', 'nickName', 'gender', 'province', 'city',
            'country', 'avatarUrl');
          done();
        });
      });

      after(function () {
        muk.restore();
      });
    });

    describe('should not ok', function () {
      it('should not ok if get session key throws an error', function (done) {
        var api = new OAuth('appid', 'secret', null, null, true);

        muk(api, 'getSessionKey', function (code, callback) {
          callback(new Error('mock error'));
        });

        api.getUserByCode('code', function (err, data) {
          expect(err).to.be.a(Error);
          done();
        });

        muk.restore();
      });
    });
  });

  describe('verifyToken', function () {
    var api = new OAuth('appid', 'secret');
    it('should ok with verifyToken', function (done) {
      api.verifyToken('openid', 'access_token', function (err, data) {
        expect(err).to.be.ok();
        expect(err.message).to.contain('access_token is invalid');
        done();
      });
    });
  });

  describe('getSessionKey', function () {
    var api = new OAuth('appid', 'secret', null, null, true);
    it('should invalid', function (done) {
      api.getSessionKey('code', function (err, result) {
        expect(err).to.be.ok();
        expect(err.name).to.be.equal('WeChatAPIError');
        expect(err.message).to.contain('invalid appid');
        done();
      });
    });

    describe('should ok', function () {
      before(function () {
        muk(urllib, 'request', function (url, args, callback) {
          var resp = {
            session_key: 'SESSION_KEY',
            expires_in:7200,
            openid: 'OPENID',
            unionid: 'UNIONID'
          };
          process.nextTick(function () {
            callback(null, resp);
          });
        });
      });

      after(function () {
        muk.restore();
      });

      it('should ok', function (done) {
        api.getSessionKey('code', function (err, token) {
          expect(err).not.to.be.ok();
          expect(token).to.have.property('data');
          expect(token.data).to.have.keys('session_key', 'openid', 'create_at');
          done();
        });
      });
    });
  });

  describe('decryptMiniProgramUser', function () {
    describe('should not ok', function () {
      var api = new OAuth('appid', 'secret', null, null, true);
      it('should not ok with invalid data', function () {
        expect(function () {
          api.decryptMiniProgramUser({});
        }).to.throwError();
      });
    });
  });
});
