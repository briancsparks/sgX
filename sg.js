
/**
 *  sg!
 */

var _             = require('underscore');
var fs            = require('fs');
var glob          = require('glob');
var path          = require('path');

var lib = {};

var firstKey = lib.firstKey = function(obj) {
  for (var k in obj) {
    return k;
  }
  return ;
};

var numKeys = lib.numKeys = function(obj) {
  var num = 0;
  for (var k in obj) {
    num++;
  }

  return num;
};

var kv = lib.kv = function(o, k, v) {
  o = o || {};
  o[k] = v;
  return o;
};

var context = lib.context = function(key, def) {
  var keyIndex = -1;
  for (var i = 0; i < process.argv.length; i++) {
    if (process.argv[i] === "--" + key) {
      keyIndex = i;
      break;
    }
  }

  if (keyIndex >= 0 && keyIndex+1 < process.argv.length) {
    return process.argv[keyIndex + 1];
  }

  if (def) {
    return def;
  }
};

var captures = lib.captures = function(re, str, callback) {
  var m = re.exec(str);
  return callback.apply(this, [m].concat(_.slice(m)));
};

var capturesSync = lib.captures = function(re, str) {
  var m = re.exec(str);
  return Array.prototype.slice.apply(m);
};

var __each = lib.__each = function(coll, fn, callback) {

  var i = 0, end;
  var indexes, values, errors, hasError = false;

  if (_.isArray(coll)) {
    indexes = _.range(coll.length);
    values = [];
    errors = [];
  }
  else {
    indexes = _.keys(coll);
    values = {};
    errors = {};
  }

  end = indexes.length;

  var doOne = function() {
    var item = coll[indexes[i]];
    var next = function(err, val) {
      if (err) { hasError = true; }

      errors[i] = err;
      values[i] = val;

      i += 1;
      if (i < end) {
        return process.nextTick(function() {
          doOne();
        });
      }

      return callback(hasError ? errors : null, values);
    };

    return fn(item, next, indexes[i]);
  };

  return doOne();
};

var __eachll = lib.__eachll = function(coll, fn, callback) {
  var finalFn = _.after(coll.length, function() {
    callback();
  });

  for (var i = 0, l = coll.length; i < l; i++) {
    fn(coll[i], finalFn, i);
  }
};

var __run = lib.__run = function(fns, callback_) {
  var callback = callback_ || function() {};
  return __each(fns, 
    function(fn, next) {
      return fn(next);
    }, 

    function() {
      return callback();
    }
  );
};

var findFiles = lib.findFiles = function(pattern, options, callback) {
  return glob(pattern, options, function(err, filenames_) {
    if (err) { return callback(err); }

    var filenames = [];
    return __eachll(filenames_, 
      function(filename, next) {
        return fs.stat(filename, function(err, stats) {
          if (!err && stats.isFile()) {
            filenames.push(filename);
          }
          return next();
        });
      },
      function(errs) {
        return callback(null, filenames);
      }
    );
  });
};

var eachLine = lib.eachLine = function(pattern, options_, eachCallback, finalCallback) {
  var options = _.defaults({}, options_ || {}, {cwd: process.cwd()}),
      total = 0;

  var eachLineOneFile = function(filename, next) {
    return fs.readFile(path.join(options.cwd, filename), 'utf8', function(err, contents) {
      if (err) { return next(err); }

      var lines = contents.split('\n');
      if (options.lineFilter) {
        lines = lines.filter(options.lineFilter);
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
    return eachLineOneFile(arguments[0], function(err) {
      return finalCallback(err);
    });
  }

  /* otherwise */
  options.filenameFilter = options.filenameFilter || function(){return true;};

  return glob(pattern, options, function(err, files) {
    if (err) { return finalCallback(err); }

    return __each(files, 
      function(filename, next) {

        return fs.stat(filename, function(err, stats) {
          if (err) { return next(); }
          if (!stats.isFile()) { return next(); }

          if (!options.filenameFilter(filename)) { return next(); }

          return eachLineOneFile(filename, next);
        });
      },
      
      function() {
        return finalCallback();
      }
    );
  });
};

var parseOn2Chars = lib.parseOn2Chars = function(str, sep1, sep2) {
  var ret = {};
  _.each(str.split(sep1).filter(_.identity), function(kv) {
    var arr = kv.split(sep2), k = arr[0], v = arr[1];
    ret[k.toLowerCase()] = v.toLowerCase();
  });

  return ret;
};

var exportify = lib.exportify = function(obj) {
  for (var key in obj) {
    exports[key] = obj[key];
  }
};

var lineNum = 0;
var remainder = '';
var ARGF = lib.ARGF = function(callback, fnDone_) {
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

var awk = lib.awk = function(callback, fnDone_) {
  return ARGF(function(line, lineNum) {
    return callback(line.split(' '), lineNum);
  }, fnDone_);
};

var TheARGV = function(params_) {
  var self = this;

  var params = params_ || {};

  self.executable = process.argv[0];
  self.script = process.argv[1];
  self.flags = {};
  self.args = [];

  self.setFlag = function(key, value) {
    self.flags[key] = value;
    if (self.flags.hasOwnProperty(key) || !self.hasOwnProperty(key)) {
      self[key] = value;
    }
    if (params.short && params.short[key]) {
      self.setFlags(params.short[key], value);
    }
  };

  // Initialize -- scan the arguments
  var curr;
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
      break;
    }
    else {
      self.args.push(curr);
    }
  }

  for (; i < process.argv.length; i++) {
    curr = process.argv[i];
    self.args.push(curr);
  }
};

var theARGV = null;
var ARGV = lib.ARGV = function(params) {
  return theARGV || (theARGV = new TheARGV(params));
};



exportify(lib);

