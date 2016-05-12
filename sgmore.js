
/**
 *  sgmore!
 *
 *  More functions for SG, but bigger and more complex than those in sg.js.
 */

exports.load = function(sg, _) {

  var path          = require('path');
  var spawn         = require('child_process').spawn;

  var fs            = sg.extlibs.fs           = require('fs-extra');
  var glob          = sg.extlibs.glob         = require('glob');

  var dogStats;

  var dogStatsClosure = function() {
    var server = process.env.SG_STATSD_SERVER || process.env.STATSD_SERVER || process.env.DOG_STATSD_SERVER || 'localhost';
    try {
      var dogStatsD = require('dogstatsd').StatsD;
      dogStats      = new dogStatsD(server, 8125);
    } catch(e) {}
  };
  dogStatsClosure();

  sg.StatsD = function() {
    var self = this;

    self.increment = function(name, value, tags) {
      if (!dogStats) { return; }
      var args = parseParams.apply(self, arguments);

      if ('value' in args)  { dogStats.incrementBy(args.name, args.value, dogTags(args.tags)); }
      else                  { dogStats.increment(args.name, dogTags(args.tags)); }
    };

    self.decrement = function(name, value, tags) {
      if (!dogStats) { return; }
      var args = parseParams.apply(self, arguments);

      if ('value' in args)  { dogStats.decrementBy(args.name, args.value, dogTags(args.tags)); }
      else                  { dogStats.decrement(args.name, dogTags(args.tags)); }
    };

    self.gauge = function(name, value, tags) {
      if (!dogStats) { return; }
      var args = parseParams.apply(self, arguments);

      if ('value' in args)  { dogStats.gauge(args.name, args.value, dogTags(args.tags)); }
      else                  { dogStats.gauge(args.name, dogTags(args.tags)); }
    };

    self.histogram = function(name, value, tags) {
      if (!dogStats) { return; }
      var args = parseParams.apply(self, arguments);

      dogStats.histogram(args.name, args.value, dogTags(args.tags));
    };

    self.timing = function(name, value, tags) {
      if (!dogStats) { return; }
      var args = parseParams.apply(self, arguments);

      dogStats.timing(args.name, args.value, dogTags(args.tags));
    };

    self.set = function(name, value, tags) {
      if (!dogStats) { return; }
      var args = parseParams.apply(self, arguments);

      if ('value' in args)  { dogStats.set(args.name, args.value, dogTags(args.tags)); }
      else                  { dogStats.set(args.name, dogTags(args.tags)); }
    };

    var parseParams = function(name /*, value, tags*/) {
      var args  = _.rest(arguments);
      var tags  = _.isArray(_.last(args)) ? args.pop() : null;
      var value = args.shift();

      var result = { name : name };
      if (value) { result.value = value; }
      if (tags)  { result.tags  = tags; }

      return result;
    };

    var dogTags = function(userTags) {
      var result = [];
      if (userTags) {
        result = result.concat(userTags);
      }

      _.each(userTags, function(value, key) {
        if (value === true) {
          result.push(key);
        } else {
          result.push(key + ':' + value);
        }
      });

      //_.each(initTags, function(value, key) {
      //  result.push(key + ':' + value);
      //});

      //_.each(keyValueTags, function(value, key) {
      //  result.push(key + ':' + value);
      //});

      //_.each(tags, function(value, key) {
      //  result.push(key);
      //});

      return result;
    };
  };


  var stringForHttpCode = function(code) {
    // First, specific codes
    if (code === 301)                       { return 'Moved Permanently'; }
    else if (code === 302)                  { return 'Found'; }
    else if (code === 304)                  { return 'Not Modified'; }
    else if (code === 400)                  { return 'Bad Request'; }
    else if (code === 401)                  { return 'Unauthorized'; }
    else if (code === 403)                  { return 'Permission Denied'; }
    else if (code === 404)                  { return 'Not Found'; }
    else if (code === 418)                  { return "I'm a teapot"; }
    else if (code === 429)                  { return 'Too Many Requests'; }
    else if (code === 500)                  { return 'Internal Error'; }
    else if (code === 501)                  { return 'Not Implemented'; }
    else if (code === 521)                  { return 'Web server is down'; }

    // Ranges
    else if (200 <= code && code < 300)     { return 'OK'; }
    else if (300 <= code && code < 400)     { return 'Follow Location'; }
    else if (400 <= code && code < 500)     { return 'Client Error'; }
    else if (code < 600)                    { return 'Server Error'; }
    return '';
  };

  var mkResponseObject = function(code, str) {

    if (code === 301)                       { return { Location: str}; }
    else if (code === 302)                  { return { Location: str}; }

    return {msg: str};
  };

  sg.jsonResponse = function(req, res, code, content_, headers_, debugInfo_) {
    var content     = content_    || {code: code, msg: stringForHttpCode(code)};
    var headers     = headers_    || {};
    var debugInfo   = null;

    if (process.env.NODE_ENV !== 'production') {
      if (code >= 400) {
        debugInfo = debugInfo_ || {};
      }
    }

    if (_.isString(content)) {
      content = mkResponseObject(code, content);
    }

    if (_.isObject(content)) {
      if (debugInfo) {
        content.debug = debugInfo;
      }

      content = JSON.stringify(content);
    }

    headers['Content-Type']   = headers['Content-Type'] || 'application/json';
    headers['Content-Length'] = content.length;

    if (code === 301 || code === 302) {
      headers.Location = content.Location;
    }

    res.writeHead(code, headers);
    res.write(content);
    return res.end();
  };

  sg._200 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 200, content, headers, debugInfo); };
  sg._301 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 301, content, headers, debugInfo); };
  sg._302 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 302, content, headers, debugInfo); };
  sg._304 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 304, content, headers, debugInfo); };
  sg._400 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 400, content, headers, debugInfo); };
  sg._401 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 401, content, headers, debugInfo); };
  sg._403 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 403, content, headers, debugInfo); };
  sg._404 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 404, content, headers, debugInfo); };
  sg._418 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 418, content, headers, debugInfo); };
  sg._429 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 429, content, headers, debugInfo); };
  sg._500 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 500, content, headers, debugInfo); };
  sg._501 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 501, content, headers, debugInfo); };
  sg._521 = function(req, res, content, debugInfo, headers) { return sg.jsonResponse(req, res, 521, content, headers, debugInfo); };

  sg.sendResponseChunks = function(req, res, contentType, chunks) {

    var headers = {};

    headers['Content-Type']   = contentType;

    res.writeHead(200, headers);
    _.each(chunks, function(chunk) {
      res.write(chunk);
    });
    return res.end();
  };


  // -------------------- MongoDB helpers --------------------
  sg.MongoUpsert = function(collection) {
    var self = this;

    sg.MongoUpdater.apply(self, arguments);

    self.commit = function(key, value, callback) {
      self.cleanUpdates();

      var selector;

      if (arguments.length === 3) {
        selector    = kv(key, value);
      } else {
        selector    = arguments[0];
        callback    = arguments[1];
      }

      return collection.update(selector, self.updates, {upsert:true}, function(/*err, receipt*/) {
        return callback.apply(this, arguments);
      });
    };
  };

  sg.MongoUpdate = function(collection) {
    var self = this;

    sg.MongoUpdater.apply(self, arguments);

    self.commit = function(key, value, callback) {
      self.cleanUpdates();

      var selector;

      if (arguments.length === 3) {
        selector    = kv(key, value);
      } else {
        selector    = arguments[0];
        callback    = arguments[1];
      }

      return collection.update(selector, self.updates, function(/*err, receipt*/) {
        return callback.apply(this, arguments);
      });
    };
  };

  sg.MongoInsert = function(collection, idKey, idValue) {
    var self = this;

    sg.MongoUpdater.apply(self, arguments);

    self.inc('seen');

    self.commit = function(callback) {
      self.cleanUpdates();

      var selector = kv(idKey, idValue);

      return collection.update(selector, self.updates, {upsert:true}, function(/*err, receipt*/) {
        return callback.apply(this, arguments);
      });
    };
  };

  sg.MongoFindAndModify = function(collection) {
    var self = this;

    sg.MongoUpdater.apply(self, arguments);

    self.commit = function(key, value, callback) {
      self.cleanUpdates();

      return collection.findAndModify(kv(key, value), [[key, 1]], self.updates, {"new":true}, function(/*err, item*/) {
        return callback.apply(this, arguments);
      });
    };
  };

  sg.MongoUpdater = function(collection) {
    var self = this;
    var now  = new Date();

    self.updates = {
      $setOnInsert : { ctime: now },
      $set         : { mtime: now },
      $inc         : {}
    };

    self.set = function(key, value) {

      var obj = arguments[0];
      if (arguments.length === 2) {
        obj = kv(key, value);
      }

      _.extend(self.updates.$set, obj);
    };

    self.unset = function(key) {

      self.updates.$unset = self.updates.$unset || {};
      self.updates.$unset[key] = true;
    };

    self.setOnInsert = function(key, value) {

      var obj = arguments[0];
      if (arguments.length === 2) {
        obj = kv(key, value);
      }

      _.extend(self.updates.$setOnInsert, obj);
    };

    self.inc = function(key, value_) {
      var value = value_;
      if (!value_ && value !== 0) {
        value = 1;
      }

      self.updates.$inc[key] = (self.updates.$inc[key] || 0) + value;
    };

    self.addToSet = function(key, value) {

      if (_.isArray(value)) {
        _.each(value, function(item) {
          self.addToSet(key, item);
        });
        return;
      }

      // If we do not have $addToSet already, add it
      if (!self.updates.hasOwnProperty('$addToSet')) {
        self.updates.$addToSet = {};
      }

      // If this is the first time this key is used, the value is not an array
      if (!self.updates.$addToSet.hasOwnProperty(key)) {
        self.updates.$addToSet[key] = value;
        return;
      }

      /* otherwise -- if we already have an array, just add to it */
      if (self.updates.$addToSet[key].hasOwnProperty('$each')) {
        self.updates.$addToSet[key].$each.push(value);
        return;
      }

      /* otherwise -- update from a normal value to an array of two values */
      var oldValue = self.updates.$addToSet[key];
      self.updates.$addToSet[key] = {$each:[oldValue, value]};

    };

    self.cleanUpdates = function() {
      if (self.updates.$set && _.keys(self.updates.$set).length === 0) { delete self.updates.$set; }
      if (self.updates.$inc && _.keys(self.updates.$inc).length === 0) { delete self.updates.$inc; }
    };
  };

  var findFiles = sg.findFiles = function(pattern, options, callback) {
    return glob(pattern, options, function(err, filenames_) {
      if (err) { return callback(err); }

      /* otherwise */
      var filenames = [];
      return __eachll(filenames_, function(filename, next) {
        return fs.stat(filename, function(err, stats) {
          if (!err && stats.isFile()) {
            filenames.push(filename);
          }
          return next();
        });

      }, function(errs) {
        return callback(null, filenames);
      });
    });
  };

  var eachLine = sg.eachLine = function(pattern, options_, eachCallback, finalCallback) {
    var options = _.defaults({}, options_ || {}, {cwd: process.cwd()});
    var total   = 0;

    var eachLineOfOneFile = function(filename, next) {
      return fs.readFile(path.join(options.cwd, filename), 'utf8', function(err, contents) {
        if (err) { return next(err); }

        var lines = contents.split('\n');
        if (options.lineFilter) {
          lines = _.filter(lines, options.lineFilter);
        }

        for (var i = 0, l = lines.length; i < l; ++i) {
          total++;
          var result = eachCallback(lines[i], i, filename, total);
          if (result === 'SG.nextFile') {
            return next();
          }
        }

        return next();
      });
    };

    // Is this a glob?
    if (!/\*/.exec(pattern)) {
      // No, not a glob
      return eachLineOfOneFile(arguments[0], function(err) {
        return finalCallback(err);
      });
    }

    /* otherwise */
    options.filenameFilter = options.filenameFilter || function(){return true;};

    return glob(pattern, options, function(err, files) {
      if (err) { return finalCallback(err); }

      return __each(files, function(filename, next) {

        return fs.stat(filename, function(err, stats) {
          if (err)              { return next(); }
          if (!stats.isFile())  { return next(); }

          if (!options.filenameFilter(filename)) { return next(); }

          return eachLineOfOneFile(filename, next);
        });

      }, function() {
        return finalCallback();
      });
    });
  };

  sg.spawnEz = function(command, args, options) {
    var stderr    = sg.extract(options, 'stderr');
    var stdout    = sg.extract(options, 'stdout');
    var close     = sg.extract(options, 'close');
    var newline   = sg.extract(options, 'newline');

    var proc, errRemainder = '', outRemainder = '', streamOptions = {};

    if (_.keys(options).length > 0) {
      proc = spawn(command, args, options);
    } else {
      proc = spawn(command, args);
    }

    if (newline) {
      streamOptions.newline = newline;
    }

    if (stderr) {
      proc.stderr.on('data', function(chunk) {
        errRemainder = sg.str2lines(errRemainder, chunk, streamOptions, stderr);
      });
    }

    if (stdout) {
      proc.stdout.on('data', function(chunk) {
        outRemainder = sg.str2lines(outRemainder, chunk, streamOptions, stdout);
      });
    }

    if (close) {
      proc.on('close', close);
    }
  };

  return sg;
};

