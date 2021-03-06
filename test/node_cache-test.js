(function() {
  var VCache, ks, localCache, localCacheTTL, randomString, vs, _;
  _ = require("underscore");
  VCache = require("../lib/node_cache");
  localCache = new VCache({
    stdTTL: 0
  });
  localCacheTTL = new VCache({
    stdTTL: 0.3,
    checkperiod: 0
  });
  localCache._killCheckPeriod();
  randomString = function(length, withnumbers) {
    var chars, i, randomstring, rnum, string_length;
    if (withnumbers == null) {
      withnumbers = true;
    }
    chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
    if (withnumbers) {
      chars += "0123456789";
    }
    string_length = length || 5;
    randomstring = "";
    i = 0;
    while (i < string_length) {
      rnum = Math.floor(Math.random() * chars.length);
      randomstring += chars.substring(rnum, rnum + 1);
      i++;
    }
    return randomstring;
  };
  vs = [];
  ks = [];
  module.exports = {
    "general": function(beforeExit, assert) {
      var key, n, start, value, value2;
      console.log("START GENERAL TEST");
      n = 0;
      start = _.clone(localCache.getStats());
      value = randomString(100);
      value2 = randomString(100);
      key = randomString(10);
      localCache.set(key, value, 0, function(err, res) {
        assert.isNull(err, err);
        n++;
        assert.equal(1, localCache.getStats().keys - start.keys);
        localCache.get(key, function(err, res) {
          var pred;
          n++;
          pred = {};
          pred[key] = value;
          return assert.eql(pred, res);
        });
        localCache.get("xxx", function(err, res) {
          n++;
          assert.isNull(err, err);
          return assert.eql({}, res);
        });
        localCache.del("xxx", function(err, res) {
          n++;
          assert.isNull(err, err);
          return assert.equal(0, res);
        });
        localCache.set(key, value2, 0, function(err, res) {
          n++;
          assert.isNull(err, err);
          assert.ok(res, err);
          return localCache.get(key, function(err, res) {
            var pred;
            n++;
            pred = {};
            pred[key] = value2;
            assert.eql(pred, res);
            return assert.equal(1, localCache.getStats().keys - start.keys);
          });
        });
        return localCache.del(key, function(err, res) {
          n++;
          assert.isNull(err, err);
          assert.equal(1, res);
          assert.equal(0, localCache.getStats().keys - start.keys);
          return localCache.get(key, function(err, res) {
            n++;
            assert.isNull(err, err);
            return assert.eql({}, res);
          });
        });
      });
      return beforeExit(function() {
        return assert.equal(8, n, "not exited");
      });
    },
    "flush": function(beforeExit, assert) {
      var count, i, key, n, startKeys, val, _i, _len;
      console.log("START FLUSH TEST");
      n = 0;
      count = 100;
      startKeys = localCache.getStats().keys;
      ks = [];
      val = randomString(20);
      for (i = 1; 1 <= count ? i <= count : i >= count; 1 <= count ? i++ : i--) {
        key = randomString(7);
        ks.push(key);
      }
      for (_i = 0, _len = ks.length; _i < _len; _i++) {
        key = ks[_i];
        localCache.set(key, val, 0, function(err, res) {
          n++;
          assert.isNull(err, err);
        });
      }
      assert.equal(localCache.getStats().keys, startKeys + count);
      localCache.flushAll(false);
      assert.equal(localCache.getStats().keys, 0);
      assert.eql(localCache.data, {});
      return beforeExit(function() {
        return assert.equal(n, count + 0);
      });
    },
    "many": function(beforeExit, assert) {
      var count, i, key, n, time, val, _i, _j, _len, _len2;
      n = 0;
      count = 100000;
      console.log("START MANY TEST/BENCHMARK.\nSet, Get and check " + count + " elements");
      val = randomString(20);
      ks = [];
      for (i = 1; 1 <= count ? i <= count : i >= count; 1 <= count ? i++ : i--) {
        key = randomString(7);
        ks.push(key);
      }
      time = new Date().getTime();
      for (_i = 0, _len = ks.length; _i < _len; _i++) {
        key = ks[_i];
        localCache.set(key, val, 0, function(err, res) {
          assert.isNull(err, err);
        });
      }
      console.log("TIME-SET:", new Date().getTime() - time);
      time = new Date().getTime();
      for (_j = 0, _len2 = ks.length; _j < _len2; _j++) {
        key = ks[_j];
        localCache.get(key, function(err, res) {
          var pred;
          n++;
          pred = {};
          pred[key] = val;
          return assert.eql(pred, res);
        });
      }
      console.log("TIME-GET:", new Date().getTime() - time);
      console.log("MANY STATS:", localCache.getStats());
      return beforeExit(function() {
        return assert.equal(n, count);
      });
    },
    "delete": function(beforeExit, assert) {
      var count, i, n, ri, startKeys;
      console.log("START DELETE TEST");
      n = 0;
      count = 10000;
      startKeys = localCache.getStats().keys;
      for (i = 1; 1 <= count ? i <= count : i >= count; 1 <= count ? i++ : i--) {
        ri = Math.floor(Math.random() * vs.length);
        localCache.del(ks[i], function(err, count) {
          n++;
          assert.isNull(err, err);
          return assert.equal(1, count);
        });
      }
      for (i = 1; 1 <= count ? i <= count : i >= count; 1 <= count ? i++ : i--) {
        ri = Math.floor(Math.random() * vs.length);
        localCache.del(ks[i], function(err, count) {
          n++;
          assert.equal(0, count);
          return assert.isNull(err, err);
        });
      }
      assert.equal(localCache.getStats().keys, startKeys - count);
      return beforeExit(function() {
        return assert.equal(n, count * 2);
      });
    },
    "stats": function(beforeExit, assert) {
      var count, end, i, key, keys, n, start, val, vals, _ref;
      console.log("START STATS TEST");
      n = 0;
      start = _.clone(localCache.getStats());
      count = 5;
      keys = [];
      vals = [];
      for (i = 1, _ref = count * 2; 1 <= _ref ? i <= _ref : i >= _ref; 1 <= _ref ? i++ : i--) {
        key = randomString(7);
        val = randomString(50);
        keys.push(key);
        vals.push(val);
        localCache.set(key, val, 0, function(err, success) {
          n++;
          assert.isNull(err, err);
          return assert.ok(success);
        });
      }
      for (i = 1; 1 <= count ? i <= count : i >= count; 1 <= count ? i++ : i--) {
        localCache.get(keys[i], function(err, res) {
          var pred;
          n++;
          pred = {};
          pred[keys[i]] = vals[i];
          assert.eql(pred, res);
          return assert.isNull(err, err);
        });
        localCache.del(keys[i], function(err, success) {
          n++;
          assert.isNull(err, err);
          return assert.ok(success);
        });
      }
      for (i = 1; 1 <= count ? i <= count : i >= count; 1 <= count ? i++ : i--) {
        localCache.get("xxxx", function(err, res) {
          ++n;
          assert.isNull(err, err);
          return assert.eql({}, res);
        });
      }
      end = localCache.getStats();
      assert.equal(end.hits - start.hits, 5, "hits wrong");
      assert.equal(end.misses - start.misses, 5, "misses wrong");
      assert.equal(end.keys - start.keys, 5, "hits wrong");
      assert.equal(end.ksize - start.ksize, 5 * 7, "hits wrong");
      assert.equal(end.vsize - start.vsize, 5 * 50, "hits wrong");
      return beforeExit(function() {
        return assert.equal(n, count * 5);
      });
    },
    "multi": function(beforeExit, assert) {
      var count, getKeys, i, key, n, pred, startKeys, val, _i, _j, _len, _len2;
      console.log("START MULTI TEST");
      n = 0;
      count = 100;
      startKeys = localCache.getStats().keys;
      ks = [];
      val = randomString(20);
      for (i = 1; 1 <= count ? i <= count : i >= count; 1 <= count ? i++ : i--) {
        key = randomString(7);
        ks.push(key);
      }
      for (_i = 0, _len = ks.length; _i < _len; _i++) {
        key = ks[_i];
        localCache.set(key, val, 0, function(err, res) {
          n++;
          assert.isNull(err, err);
        });
      }
      getKeys = ks.splice(50, 5);
      pred = {};
      for (_j = 0, _len2 = getKeys.length; _j < _len2; _j++) {
        key = getKeys[_j];
        pred[key] = val;
      }
      localCache.get(getKeys, function(err, res) {
        n++;
        assert.isNull(err, err);
        return assert.eql(pred, res);
      });
      localCache.del(getKeys, function(err, res) {
        n++;
        assert.isNull(err, err);
        return assert.equal(getKeys.length, res);
      });
      localCache.get(getKeys, function(err, res) {
        n++;
        assert.isNull(err, err);
        return assert.eql({}, res);
      });
      return beforeExit(function() {
        return assert.equal(n, count + 3);
      });
    },
    "ttl": function(beforeExit, assert) {
      var key, key2, key3, key4, key5, n, val;
      console.log("START TTL TEST");
      val = randomString(20);
      key = randomString(7);
      key2 = randomString(7);
      key3 = randomString(7);
      key4 = randomString(7);
      key5 = randomString(7);
      n = 0;
      localCache.set(key, val, 0.5, function(err, res) {
        assert.isNull(err, err);
        assert.ok(res);
        return localCache.get(key, function(err, res) {
          var pred;
          assert.isNull(err, err);
          pred = {};
          pred[key] = val;
          return assert.eql(pred, res);
        });
      });
      localCache.set(key2, val, 0.8, function(err, res) {
        assert.isNull(err, err);
        assert.ok(res);
        return localCache.get(key2, function(err, res) {
          var pred;
          assert.isNull(err, err);
          pred = {};
          pred[key2] = val;
          return assert.eql(pred, res);
        });
      });
      setTimeout(function() {
        ++n;
        return localCache.get(key, function(err, res) {
          var pred;
          assert.isNull(err, err);
          pred = {};
          pred[key] = val;
          return assert.eql(pred, res);
        });
      }, 400);
      setTimeout(function() {
        ++n;
        return localCache.get(key, function(err, res) {
          assert.isNull(err, err);
          return assert.eql({}, res);
        });
      }, 600);
      setTimeout(function() {
        ++n;
        return localCache.get(key2, function(err, res) {
          var pred;
          assert.isNull(err, err);
          pred = {};
          pred[key2] = val;
          assert.eql(pred, res);
          return assert.eql(pred, res);
        });
      }, 600);
      setTimeout(function() {
        var startKeys;
        startKeys = localCache.getStats().keys;
        key = "autotest";
        return localCache.set(key, val, 0.5, function(err, res) {
          assert.isNull(err, err);
          assert.ok(res);
          assert.equal(startKeys + 1, localCache.getStats().keys);
          return localCache.get(key, function(err, res) {
            var pred;
            pred = {};
            pred[key] = val;
            assert.eql(pred, res);
            return setTimeout(function() {
              localCache._checkData(false);
              return assert.isUndefined(localCache.data[key]);
            }, 700);
          });
        });
      }, 1000);
      localCache.set(key3, val, 100, function(err, res) {
        assert.isNull(err, err);
        assert.ok(res);
        return localCache.get(key3, function(err, res) {
          var pred;
          assert.isNull(err, err);
          pred = {};
          pred[key3] = val;
          assert.eql(pred, res);
          localCache.ttl(key3 + "false", 0.3, function(err, setted) {
            assert.isNull(err, err);
            return assert.equal(false, setted);
          });
          localCache.ttl(key3, 0.3, function(err, setted) {
            assert.isNull(err, err);
            return assert.ok(setted);
          });
          localCache.get(key3, function(err, res) {
            pred = {};
            pred[key3] = val;
            return assert.eql(pred, res);
          });
          return setTimeout(function() {
            localCache._checkData(false);
            return assert.isUndefined(localCache.data[key3]);
          }, 500);
        });
      });
      localCache.set(key4, val, 100, function(err, res) {
        assert.isNull(err, err);
        assert.ok(res);
        return localCache.get(key4, function(err, res) {
          var pred;
          assert.isNull(err, err);
          pred = {};
          pred[key4] = val;
          assert.eql(pred, res);
          localCache.ttl(key4 + "false", function(err, setted) {
            assert.isNull(err, err);
            return assert.equal(false, setted);
          });
          return localCache.ttl(key4, function(err, setted) {
            assert.isNull(err, err);
            assert.ok(setted);
            return assert.isUndefined(localCache.data[key4]);
          });
        });
      });
      return localCacheTTL.set(key5, val, 100, function(err, res) {
        assert.isNull(err, err);
        assert.ok(res);
        return localCacheTTL.get(key5, function(err, res) {
          var pred;
          assert.isNull(err, err);
          pred = {};
          pred[key5] = val;
          assert.eql(pred, res);
          localCacheTTL.ttl(key5 + "false", function(err, setted) {
            assert.isNull(err, err);
            return assert.equal(false, setted);
          });
          localCacheTTL.ttl(key5, function(err, setted) {
            assert.isNull(err, err);
            return assert.ok(setted);
          });
          localCacheTTL.get(key5, function(err, res) {
            pred = {};
            pred[key5] = val;
            return assert.eql(pred, res);
          });
          return setTimeout(function() {
            localCacheTTL._checkData(false);
            return assert.isUndefined(localCacheTTL.data[key5]);
          }, 500);
        });
      });
    }
  };
}).call(this);
