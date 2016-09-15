
/**
 *  sg!
 */

/**
 *  sg
 *
 *  @module sgsg
 */

var _             = require('underscore');
var util          = require('util');
var urlLib        = require('url');

// Here I am :)
var sg    = {extlibs:{_:_}};
var tests = [];

sg._ = _;

/**
 *  Returns if the program is running in debug mode.
 *
 *  @alias module:sgsg.isDebug
 */
sg.isDebug = function() {
  return process.env.NODE_ENV === 'development';
};

sg.firstKey = function(obj) {
  for (var k in obj) {
    return k;
  }
  return ;
};

sg.numKeys = function(obj) {
  var num = 0;
  for (var k in obj) {
    num++;
  }

  return num;
};

/**
 *  Build {k:v}
 */
var kv = sg.kv = function(o, k, v) {
  if (arguments.length === 2) {
    return kv(null, o, k);
  }

  o = o || {};
  o[k] = v;
  return o;
};

/**
 *  Build {key:k, vName:v}
 */
var kkvv = sg.kkvv = function(o, k, v, vName) {
  if (arguments.length === 2) {
    return kkvv(null, o, k, 'value');
  }

  if (arguments.length === 3) {
    return kkvv(null, o, k, v);
  }

  o         = o || {};
  o.key     = k;
  o[vName]  = v;

  return o;
};

sg.trueOrFalse = function(value_) {
  var value = value_;
  if (value === true || value === false)  { return value; }
  if (value === 'true')                   { return true; }
  if (value === 'false')                  { return false; }

  if (_.isString(value)) { value = +value; }    // Convert to number
  return !!value;
};

sg.reduce = sg._reduce = function(collection, initial, fn) {
  return _.reduce(collection, fn, initial);
};

sg.extract = sg._extract = function(collection, name) {
  var value = collection[name];
  delete collection[name];
  return value;
};

sg.extracts = function(collection /*, names... */) {
  var names  = _.rest(arguments);
  var result = {};

  _.each(names, function(name) {
    result[name] = sg.extract(collection, name);
  });

  return result;
};

sg.dashifyKey = function(key) {
  return key.replace(/\./g, '-');
};

/**
 *  Makes the key a valid identifier (letter, digit, or underscore).
 */
sg.cleanKey = function(key) {
  return key.replace(/[^a-zA-Z0-9_]/g, '_');
};

/**
 *  Increments a key of an object, starts at zero if not present.
 */
sg.inc = function(obj, key, value) {
  if (!key) { return; }

  obj[key] = (obj[key]  || 0) + (value || 1);

  return obj[key];
};

/**
 *  Increments a key of a sub-object, starts at zero if not present.
 */
sg.inc2 = function(obj, key, subKey, value) {
  if (!key || !subKey) { return; }

  obj[key] = obj[key] || {};
  return sg.inc(obj[key], subKey, value);
};

/**
 *  Increments the 'count' of the 'named' attribute, and cleans the name (makes it an identifier).
 *
 *    obj = {}
 *
 *    incKeyed(obj, 'foo bar');
 *
 *    obj = {foo_bar:{name:'foo bar', count:1}}
 */
sg.incKeyed = function(obj, name, value) {
  if (!name) { return; }

  var key = sg.cleanKey(name);

  obj[key]        = obj[key] || {};
  obj[key].name   = name;

  obj[key].count  = (obj[key].count  || 0) + (value || 1);

  return obj[key];
};

sg.deref = function(x, keys_) {
  var keys = keys_.split('.'), key;
  var result = x;

  while (keys.length > 0) {
    key = keys.shift();
    if (!(result = result[key])) {
      return /* undefined */;
    }
  }

  return result;
};

var safeJSONParse = sg.safeJSONParse = function(str, def) {
  if (str !== '') {
    try {
      return JSON.parse(str);
    } catch(err) {
      verbose(4, "Error parsing JSON", str, err);
    }
  }

  return arguments.length > 1 ? def : {};
};

sg.deepCopy = function(x) {
  return sg.safeJSONParse(JSON.stringify(x));
};

sg.startsWith = function(longStr, start) {
  if (!longStr)                      { return false; }
  if (longStr.length < start.length) { return false; }

  if (longStr.substr(0, start.length).toLowerCase() === start.toLowerCase()) {
    return true;
  }

  return false;
};

sg.parseOn2Chars = function(str, sep1, sep2) {
  var ret = {};
  _.each(str.split(sep1).filter(_.identity), function(kv) {
    var arr = kv.split(sep2), k = arr[0], v = arr[1];
    ret[k.toLowerCase()] = v.toLowerCase();
  });

  return ret;
};

sg.startOfDay = function(d) {
  var day = new Date(d);

  day.setMilliseconds(0);
  day.setSeconds(0);
  day.setMinutes(0);
  day.setHours(0);

  return day;
};

sg.pad = function(val, len, sep_) {
  var sep = sep_;
  if (!sep) {
    if (_.isNumber(val))  { sep = '0'; }
    else                  { sep = ' '; }
  }

  var str = '' + val;
  while (str.length < len) {
    str = sep + str;
  }

  return str;
};

/**
 *  Generate a random string of the given length.
 *
 *  @alias module:sgsg.randomString
 *
 *  @param {int} length
 *  @param {string} charSet The set of characters to choose from. If
 *                          none is given, uses the 52 upper and lowercase English chars.
 */
sg.randomString = function(length, charSet) {
  var alnumCharSet = sg.alnumCharSet = 'ABCDEFGHIJKLNMOPQRSTUVWXYZ0123456789abcdefghijklnmopqrstuvwxyz';

  length  = length  || 64;
  charSet = charSet || alnumCharSet;

  var result = '';
  for (var i = 0; i < length; i++) {
    result = result + charSet[Math.floor(Math.random() * charSet.length)];
  }

  return result;
};

var reportError = sg.reportError = function(error) {
};

sg.runTest = function(testFn) {
};

sg.lines = function(lines) {
  if (_.isArray(lines)) { return sg.lines.apply(sg, lines); }

  /* otherwise */
  return _.toArray(arguments).join('\n');
};

var inspect = sg.inspect = function(x) {
  return util.inspect(x, {depth:null, colors:true});
};

var verbosity = sg.verbosity = function() {

  var vLevel = 0;
  if      (theARGV.vvvvvvvvverbose)  { vLevel = 9; }
  else if (theARGV.vvvvvvvverbose)   { vLevel = 8; }
  else if (theARGV.vvvvvvverbose)    { vLevel = 7; }
  else if (theARGV.vvvvvverbose)     { vLevel = 6; }
  else if (theARGV.vvvvverbose)      { vLevel = 5; }
  else if (theARGV.vvvverbose)       { vLevel = 4; }
  else if (theARGV.vvverbose)        { vLevel = 3; }
  else if (theARGV.vverbose)         { vLevel = 2; }
  else if (theARGV.verbose)          { vLevel = 1; }

  return vLevel;
};

var logFn = function() {
  console.log.apply(console, arguments);
};

// Wrap the log fn
(function() {
  var oldLogFn = logFn;
  logFn = function() {
    return oldLogFn.apply(oldLogFn, _.map(arguments, function(arg) {
      return inspect(arg);
    }));
  };
}());

sg.mkVerbose = function(modName) {
  return function(level /*, msg, options, ...*/) {
    if (verbosity() >= level) {
      logFn(_.rest(arguments));
    }
  };
};

var verbose = sg.verbose = sg.mkVerbose('sg');

/**
 *  Display a big, fat error.
 */
sg.bigFatError = function(err, message, halt) {
  console.error("----------------------------------------------------------------------------------------------------");
  console.error("----------------------------------------------------------------------------------------------------");
  console.error("----------------------------------------------------------------------------------------------------");
  console.error("----------------------------------------------------------------------------------------------------");
  console.error("----------------------------------------------------------------------------------------------------");
  console.error("----------------------------------------------------------------------------------------------------");
  if (message) {
    console.error(message);
  }
  console.error(inspect(err));
  console.error("----------------------------------------------------------------------------------------------------");
  console.error("----------------------------------------------------------------------------------------------------");
  if (halt) {
    process.exit(1);
  }

  if (_.isString(err)) {
    return new Error((message || "")+": "+err);
  }
  return err;
};

// Makes the attributes on a data object be the 'right' type (like '0' -> the number zero)
var smartAttrs = sg.smartAttrs = function(obj) {
  return _.reduce(obj, function(m, value, key) {
    if (_.isString(value) && /^[0-9]+$/.exec(value)) {
      return sg.kv(m, key, parseInt(value, 10));
    }
    return sg.kv(m, key, value);
  }, {});
};

sg.toError = function(e) {
  if (e instanceof Error)     { return e; }
  if (_.isString(e))          { return new Error(e); }
  if (_.isArray(e))           { return new Error(JSON.stringify(e)); }

  if (_.isObject(e)) {
    if (_.isString(e.error))  { return new Error(e.error); }
    if (_.isString(e.Error))  { return new Error(e.Error); }
    if (_.isString(e.err))    { return new Error(e.err); }
    if (_.isString(e.Err))    { return new Error(e.Err); }
  }

  if (e === null)             { return e; }
  if (e === undefined)        { return e; }

  return new Error('' + e);
};

var TheARGV = function(params_) {
  var self = this;

  var params = params_ || {};

  self.executable = process.argv[0];
  self.script = process.argv[1];
  self.flags = {};
  self.flagNames = [];
  self.args = [];

  self.setFlag = function(key_, value) {
    var key = key_.replace(/-/g, '_');

    self.flags[key] = value;
    self.flagNames.push(key);
    if (self.flags.hasOwnProperty(key) || !self.hasOwnProperty(key)) {
      self[key] = value;
    }
    if (params.short && params.short[key]) {
      self.setFlag(params.short[key], value);
    }
  };

  self.getParams = function(options) {
    var me = JSON.parse(JSON.stringify(self));
    var result = {args: sg.extract(me, 'args') || []};

    result.args = _.rest(result.args, options.numArgsToSkip || 0);

    delete me.executable;
    delete me.script;
    delete me.flags;
    delete me.flagNames;

    if (options.skipArgs) {
      delete result.args;
    }

    return _.extend(result, me);
  };

  self.getJson = function(options) {
    return JSON.stringify(self.getParams(options));
  };

  // Initialize -- scan the arguments
  var curr;
  for (var i = 2; i < process.argv.length; i++) {
    var next = i+1 < process.argv.length ? process.argv[i+1] : null;
    var m, m2;

    curr = process.argv[i];

    // --foo=bar, --foo=
    if ((m = /^--([a-zA-Z_0-9\-]+)=([^ ]+)$/.exec(curr)) && m.length === 3) {
      self.setFlag(m[1], m[2]);
    }
    // --foo-
    else if ((m = /^--([^ ]+)-$/.exec(curr))) {
      self.setFlag(m[1], false);
    }
    // --foo= bar
    else if ((m = /^--([^ ]+)=$/.exec(curr)) && next && (m2 = /^([^\-][^ ]*)/.exec(next))) {
      self.setFlag(m[1], m2[1]);
      i++;
    }
    // --foo
    else if ((m = /^--([^ ]+)$/.exec(curr))) {
      self.setFlag(m[1], true);
    }
    // -f-
    else if ((m = /^-(.)-$/.exec(curr))) {
      self.setFlag(m[1], true);
    }
    // -f bar
    else if ((m = /^-(.)$/.exec(curr)) && next && (m2 = /^([^\-][^ ]*)/.exec(next))) {
      self.setFlag(m[1], m2[1]);
      i++;
    }
    // -f
    else if ((m = /^-(.)$/.exec(curr))) {
      self.setFlag(m[1], true);
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
var ARGV = sg.ARGV = function(params) {

  // We have already computed theARGV with no params, so only re-compute if
  // the caller passes in new params
  if (params) {
    return (theARGV = new TheARGV(params));
  }

  // Compute if we have to, but return the cahed version otherwise
  return theARGV || (theARGV = new TheARGV(params));
};
theARGV = ARGV();

/**
 *  Stream to lines.
 */
sg.str2lines = function(remainder_, chunk /*, options, fn */) {
  var args        = _.rest(arguments, 2);
  var fn          = args.pop();
  var options     = args.pop() || {};
  var str         = remainder_ + chunk;
  var lines       = str.split('\n');
  var remainder   = lines.pop();

  _.each(lines, function(line_, index) {
    var line = line_;
    if (options.newline) { line += '\n'; }
    return fn(line, index);
  });

  return remainder;
};

sg.dieTrying = function(onError, code_, callback) {

  // 'callback' is the function that should be called on success

  // This function is being called as 'callback' in some function
  return function(err /*, ...*/) {
    if (!err) { return callback.apply(this, arguments); }

    /* otherwise */
    var errMsg = err;
    if (!_.isString(err)) {
      errMsg = sg.inspect(err);
    }

    var exitCode = onError.apply(this, arguments);
    process.exit(exitCode || code_ || 1);
  };
};

sg.mkDieTrying = function(usage_) {
  var usage = usage_;
  if (!_.isArray(usage)) {
    usage = usage.split('\n');
  }

  return function(callback) {
    var onError = function(err) {

      var errMsg = [];
      var errInfo = err;
      if (!_.isString(err)) {
        errInfo = sg.inspect(err);
      }

      errMsg.push("Error: " + errInfo);
      errMsg.push("");

      process.stderr.write(sg.lines(errMsg.concat(usage)));

      return 9;
    };

    return sg.dieTrying(onError, null, callback);
  };
};

sg.death = function(callback) {
  return callback(true);
};

sg.mkDie = function(dieTryingFn) {

  return function() {
    return sg.death(dieTryingFn(function(err) {
      // This inner function should not be called, as the dieTryingFn should intercept it
    }));
  };
};

var __each_ = function(coll, fn, callback) {

  if (_.isArray(coll) && coll.length <= 0) {
    return callback();
  }

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

  if ((end = indexes.length) === 0) {
    return callback(hasError ? errors : null, values);
  }

  var doOne = function() {
    var item = coll[indexes[i]];
    var nextI = i + 1;
    var next = function(err, val) {
      if (err) { hasError = true; }

      errors[i] = err;
      values[i] = val;

      i = nextI;
      if (i < end) {
        return process.nextTick(function() {
          doOne();
        });
      }

      return callback(hasError ? errors : null, values);
    };

    return fn(item, next, indexes[i], coll);
  };

  return setImmediate(doOne);
};

sg.__each = function(a, b, c) {
  // If the caller has a named function, like 'next', it is easier to call this
  // function with that name first
  if (_.isFunction(a)) { return __each_(b, c, a); }

  // Normal
  return __each_(a, b, c);
};

var __eachll = /*sg.__eachll =*/ function(coll, fn, callback) {
  var finalFn = _.after(coll.length, function() {
    callback();
  });

  for (var i = 0, l = coll.length; i < l; i++) {
    fn(coll[i], finalFn, i);
  }
};

var __eachll2 = sg.__eachll = function(list_ /*, max_, fn_, callback_*/ ) {

  var args      = _.rest(arguments);
  var callback  = args.pop();
  var fn        = args.pop();
  var max       = args.length > 0 ? args.shift() : 10000000;

  if (_.isArray(list_)) {
    var list = list_.slice();

    if (list.length === 0) { return callback(); }

    var outstanding = 0;
    var launch = function(incr) {
      outstanding += (incr || 0);

      if (list.length > 0 && outstanding < max) {
        outstanding++;
        fn(list.shift(), function() {
          process.nextTick(function() {
            launch(-1);
          });
        }, list.length, list_);
        //process.nextTick(launch);
        launch();
      }
      else if (list.length === 0 && outstanding === 0) {
        callback();
      }
    };
    launch(1);
    outstanding -= 1;
    return;
  }

  /* otherwise */
  return sg.__eachll(_.keys(list_), max, function(key, nextKey) {
    fn(list_[key], nextKey, key, list_);
  }, callback);
};

/**
 *  Invoke a function for each item in a second-level array.
 *
 *  Here is a snippet for enumerating the instances in the data that is 
 *  returned from describeInstances:
 *
 *    _.each(reservations.Reservations, function(reservation) {
 *      _.each(reservation.Instances, function(instance) {
 *          ...
 *      });
 *    });
 *
 *  Using this function, you could do:
 *
 *    sg.eachFrom(reservations.Reservations, "Instances", function(instance) {
 *        ...
 *    });
 *
 */
sg.eachFrom = function(arr, itemName, fn) {
  var count = 0;
  _.each(arr, function(item) {
    _.each(sg.deref(item, itemName), fn);
  });

  return count;
};

sg.__runll = function(/*fns, max, onDone*/) {

  var args    = _.rest(arguments, 0);
  var onDone  = args.pop();

  // The dispatch function
  args.push(function(fn /*, next, index, coll*/) {
    // fn(next, index, coll)
    return fn.apply(this, _.rest(arguments));
  });

  // The final function
  args.push(onDone);

  return __eachll2.apply(this, args);
};

sg.__run = function(a, b) {
  var fns, callback;

  if (_.isArray(a)) {
    fns = a; callback = b;
  } else {
    fns = b; callback = a;
  }

  return sg.__each(
    fns,
    function(fn, next, index, coll) {
      return fn(next, index, coll);
    },
    callback || function() {}
  );
};

/**
 *  Calls fn until it wants to quit
 */
sg.until = function(/* [options,] fn, callback */) {
  var args      = _.toArray(arguments);
  var callback  = args.pop();
  var fn        = args.pop();
  var options   = args.shift() || {};

  options.interval  = options.interval || options.delay;

  var count = -1, start = _.now();

  var again;
  var once = function() {
    count += 1;
    return fn(again, callback, count, _.now() - start);
  };

  again = function() {
    var delay = options.interval;

    if (arguments.length > 0) {
      delay = arguments[0];
    }

    if (delay) {
      return setTimeout(once, delay);
    }

    /* otherwise */
    return once();
  };

  // Yes, this actually works
  again.uncount = function(num_) {
    count -= (num_ || 1);
  };

  // Yes, this actually works
  again.uncountSometimes = function(num_) {
    if (Math.random() > 0.25) {
      return again.uncount.apply(this, arguments);
    }
  };

  return once();
};

sg.parseUrl = function(req, parseQuery) {
  return req && req.url && urlLib.parse(req.url, parseQuery);
};

sg.getBody = function(req, callback) {
  // req.end might have already been called
  if (req.bodyJson) {
    return callback(null, req.bodyJson);
  }

  var onEnd = function() {

    req.bodyJson = req.bodyJson || safeJSONParse(req.chunks.join(''));
    req.bodyJson = smartAttrs(req.bodyJson);

    if (req.bodyJson.meta) {
      req.bodyJson.meta = smartAttrs(req.bodyJson.meta);
    }

    return callback(null, req.bodyJson);
  };

  req.on('end', onEnd);

  // Only collect the data once
  if (req.chunks) {
    return;
  }

  /* otherwise */
  req.chunks = [];
  req.on('data', function(chunk_) {
    var chunk = chunk_.toString();
    req.chunks.push(chunk);
  });
};

/**
 *  Get sub-parts of the pathname.  Generally to get the next (few)
 *  route parts.
 *
 *  For: url.pathname = '/a/b/c/d/e/f/g'
 *
 *  httpRoute(url)           -> 'a'
 *  httpRoute(url, 1)        -> 'b'
 *  httpRoute(url, 1, 2)     -> 'b/c'
 *  httpRoute(url, 1, 3)     -> 'b/d'
 *  httpRoute(url, 1, null)  -> 'b/c/d/e/f/g'
 *
 */
sg.httpRoute = function(url) {
  if (_.isObject(url) && !url.hasOwnProperty('pathname')) {
    var req = url;
    return httpRoute.apply(this, [parseUrl(req)].concat(_.rest(arguments)));
  }

  var parts   = _.rest(url.pathname.split('/'));
  var fields  = _.flatten(_.rest(arguments));

  if (fields.length < 1) {
    fields.push(0);
  } else if (fields.length === 2 && fields[1] === null) {
    fields = _.range(fields[0], parts.length+1);
  }

  return _.chain(fields).
    map(function(fNum) { return parts[fNum]; }).
    compact().
    value().join('/');
};

/**
 *  Does the route match?
 */
sg.httpRouteMatches = function(a /*, [fields], route*/) {
  var args   = _.rest(arguments, 0);
  var route  = args.pop();

  if (route.toLowerCase() !== httpRoute.apply(this, args).toLowerCase()) {
    return false;
  }

  if (_.isObject(a) && a.hasOwnProperty('url')) {
    return parseUrl(a, true);
  }

  return true;
};

sg = require('./sgargv').load(sg, _);

// Dynamically load the Mongo helpers
var __mdb;
sg.mongo = function() {
  if (!__mdb) { __mdb = require('./dbex'); }

  return __mdb;
};

// Dynamically load the routes helpers
var __routes;
sg.routes = function() {
  if (!__routes) { __routes = require('./ex-routes'); }

  return __routes;
};

sg = require('./sgext').load(sg, _);
sg = require('./sgmore').load(sg, _);
sg = require('./sgaws').load(sg, _);

_.each(sg, function(fn, name) {
  exports[name] = sg[name];
});

//exports.sgmore = function() { return require('./sgmore'); };
//exports.sgext  = function() { return require('./sgext'); };


