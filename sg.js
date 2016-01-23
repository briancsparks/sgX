
/**
 *  sg!
 */

var sg = {extlibs:{}};

var _             = sg.extlibs._            = require('underscore');
var glob          = sg.extlibs.glob         = require('glob');
var async         = sg.extlibs.async        = require('async');
var fs            = sg.extlibs.fs           = require('fs-extra');
var mkdirp        = sg.extlibs.mkdirp       = require('mkdirp');
var request       = sg.extlibs.superagent   = require('superagent');
var moment        = sg.extlibs.moment       = require('moment');
var shelljs       = sg.extlibs.shelljs      = require('shelljs');

sg.extlibs.request = sg.extlibs.superagent;

var path          = require('path');

sg.requireShellJsGlobal = function() {
  require('shelljs/global');
};

var firstKey = sg.firstKey = function(obj) {
  for (var k in obj) {
    return k;
  }
  return ;
};

var numKeys = sg.numKeys = function(obj) {
  var num = 0;
  for (var k in obj) {
    num++;
  }

  return num;
};

var okv = sg.okv = function(o, k, v) {
  o = o || {};
  o[k] = v;
  return o;
};

var kv = sg.kv = function(k, v) {
  return okv({}, k, v);
};

var parseOn2Chars = sg.parseOn2Chars = function(str, sep1, sep2) {
  var ret = {};
  _.each(str.split(sep1).filter(_.identity), function(kv) {
    var arr = kv.split(sep2), k = arr[0], v = arr[1];
    ret[k.toLowerCase()] = v.toLowerCase();
  });

  return ret;
};

var __each = sg.__each = function(collection, fn, callback) {

  var indexes, values, errors, hasError = false;

  if (_.isArray(collection)) {
    indexes = _.range(collection.length);
    values = [];
    errors = [];
  }
  else {
    indexes = _.keys(collection);
    values = {};
    errors = {};
  }

  var i = 0, end = indexes.length;

  var doOne = function() {

    var indexKey    = indexes[i];
    var item        = collection[indexKey];

    var next = function(err, value) {
      if (err) { hasError = true; }

      errors[indexKey] = err;
      values[indexKey] = value;

      i += 1;
      if (i < end) {
        return process.nextTick(doOne);
      }

      return callback(hasError ? errors : null, values);
    };

    return fn(item, next, indexKey, collection);
  };

  // Start the ball rolling
  return doOne();
};

var __eachll = sg.__eachll = function(collection, fn, callback) {
  var finalFn = _.after(collection.length, function() {
    callback();
  });

  for (var i = 0, l = collection.length; i < l; i++) {
    fn(collection[i], finalFn, i);
  }
};

var __run = sg.__run = function(fns, callback_) {
  var callback = callback_ || function() {};

  return __each(fns, function(fn, next) {

    return fn(next);

  }, function() {

    return callback();
  });
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

var exportify = sg.exportify = function(obj) {
  for (var key in obj) {
    exports[key] = obj[key];
  }
};

var lineNum = 0;
var remainder = '';
var ARGF = sg.ARGF = function(callback, fnDone_) {
  var fnDone = fnDone_ || function() {};

  var doOneLine = function(line) {
    lineNum++;
    callback(line, lineNum);
  };

  process.stdin.setEncoding('utf8');

  process.stdin.on('data', function(chunk) {
    remainder += chunk;
    var lines = remainder.split('\n');
    remainder = lines.pop();

    _.each(lines, doOneLine);
  });

  process.stdin.on('end', function() {
    var lines = remainder.split('\n');
    _.each(lines, doOneLine);
    fnDone();
  });
};

var awk = sg.awk = function(callback, fnDone_) {
  return ARGF(function(line, lineNum) {
    return callback(line.split(' '), lineNum);
  }, fnDone_);
};

var TheARGV = function(params_) {
  var self = this;

  var params = params_ || {};

  self.executable = process.argv[0];
  self.script     = process.argv[1];
  self.flags      = {};
  self.args       = [];
  self.args2      = [];

  self.setFlag = function(key, value) {
    self.flags[key] = value;
    if (self.flags.hasOwnProperty(key) || !self.hasOwnProperty(key)) {
      self[key] = value;
    }

    // set the short version of the flag
    if (params.short && params.short[key]) {
      self.setFlags(params.short[key], value);
    }
  };

  // Initialize -- scan the arguments
  var curr, argset = 0;
  for (var i = 2; i < process.argv.length; i++) {
    var next = i+1 < process.argv.length ? process.argv[i+1] : null;
    var m, m2;

    curr = process.argv[i];

    // --foo=bar, --foo=
    if ((m = /--([a-zA-Z_0-9\-]+)=([^ ]+)/.exec(curr)) && m.length === 3) {
      self.setFlag([m[1]], m[2]);
    }
    // --foo-
    else if ((m = /--([^ ]+)-/.exec(curr))) {
      self.setFlag([m[1]], false);
    }
    // --foo= bar
    else if ((m = /--([^ ]+)=/.exec(curr)) && next && (m2 = /^([^\-][^ ]*)/.exec(next))) {
      self.setFlag([m[1]], m2[1]);
      i++;
    }
    // --foo
    else if ((m = /--([^ ]+)/.exec(curr))) {
      self.setFlag([m[1]], true);
    }
    // -f-
    else if ((m = /-(.)-/.exec(curr))) {
      self.setFlag([m[1]], true);
    }
    // -f bar
    else if ((m = /-(.)/.exec(curr)) && next && (m2 = /^([^\-][^ ]*)/.exec(next))) {
      self.setFlag([m[1]], m2[1]);
      i++;
    }
    // -f
    else if ((m = /-(.)/.exec(curr))) {
      self.setFlag([m[1]], true);
    }
    else if (curr === '--') {
      argset = 1;
    }
    else if (curr === '---') {
      argset = 2;
    }
    else {
      if (argset === 1) {
        self.args.push(curr);
      } else if (argset === 2) {
        self.args2.push(curr);
      }
    }
  }
};

var theARGV = null;
var ARGV = sg.ARGV = function(params) {
  return theARGV || (theARGV = new TheARGV(params));
};



exportify(sg);

