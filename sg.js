
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
var assert        = require('assert');

// Here I am :)
var sg    = {extlibs:{_:_}};
var tests = [];

sg._ = _;

// Get functions from lite.js
sg = _.extend(sg, require('./lite'));

var kv              = sg.kv;
var kkvv            = sg.kkvv;
var dottedKv        = sg.dottedKv;
var isObject        = sg.isObject;
var isPod           = sg.isPod;
var isnt            = sg.isnt;
var kvSmart         = sg.kvSmart;
var safeJSONParse   = sg.safeJSONParse;
var extend          = sg.extend;

sg.timeBetween = function(a_, b_) {
  var a     = _.isDate(a) ? a.getTime() : a;
  var b     = _.isDate(b) ? b.getTime() : b;
  var diff  = b-a;

  if (diff < 0) { diff = a-b; }

  return diff;
};

sg.timeSince = function(a) {
  return sg.timeBetween(a, _.now());
};

/**
 *  Helps you turn passed-in arguments into arrays.
 *
 *  For example, users usually want the following to all work for a join-style function:
 *
 *      join('a', 'b', 'c')         ==> ['a', 'b', 'c']     (case 1)
 *      join(['a', 'b', 'c'])       ==> ['a', 'b', 'c']     (case 2)
 *
 *  and even this, even if it seems weird:
 *
 *      join('d')                   ==> ['d']               (case 3)
 *
 *  and they also want to be able to start from an arbitrary point:
 *
 *      join('.', 'a', 'b', 'c')    ==> ['a', 'b', 'c']     (case 4)
 *      join('.', ['a', 'b', 'c'])  ==> ['a', 'b', 'c']     (case 5)
 */
sg.arrayify = function(args_, start_) {

  // args might be an arguments object, so turn it into a real array
  var start   = arguments.length > 1 ? start_ : 0;
  var args    = _.rest(args_, start);

  if (args.length === 0)  { return []; }

  if (_.isArray(args[0])) { return args[0]; }

  return args;
};

tests.push(function() {

  (function() {
    assert(_.isEqual(sg.arrayify(arguments), []));
  }());

  (function() {
    assert(_.isEqual(sg.arrayify(arguments), ['a', 'b', 'c']));     /* case 1 */
  }('a', 'b', 'c'));

  (function() {
    assert(_.isEqual(sg.arrayify(arguments), ['a', 'b', 'c']));     /* case 2 */
  }(['a', 'b', 'c']));

  (function() {
    assert(_.isEqual(sg.arrayify(arguments), ['a', 'b', 'c']));     /* case 2 */
  }(['a', 'b', 'c'], 42));

  (function() {
    assert(_.isEqual(sg.arrayify(arguments), ['d']));               /* case 3 */
  }('d'));

  (function() {
    assert(_.isEqual(sg.arrayify(arguments, 1), ['a', 'b', 'c']));  /* case 4 */
  }('.', 'a', 'b', 'c'));

  (function() {
    assert(_.isEqual(sg.arrayify(arguments, 1), ['a', 'b', 'c']));     /* case 5 */
  }('.', ['a', 'b', 'c']));

  console.log("arrayify() -- pass");
});

/**
 *  Functional join.
 *
 *  This is the version that does work.
 */
var join_ = function(sep, parts) {
  return _.toArray(parts).join(sep);
};

/**
 *  Functional join.
 *
 *  The version that users will usually want
 */
sg.join = function(sep /*, parts...*/) {
  return join_(sep, _.rest(arguments));
};

/**
 *  Join by dots.
 */
sg.dotted = function() {
  return join_('.', arguments);
};

/**
 *  Join by dashes.
 */
sg.dashed = function() {
  return join_('-', arguments);
};

/**
 *  Change dots into dashes.
 */
sg.dashifyKey = function(key) {
  return key.replace(/\./g, '-');
};

/**
 *  Is the value in the list-as-a-sting.
 *
 *  strList : 'a,foo,barbaz'
 *  value   : 'a'
 *
 *  Must do ',a,foo,barbaz,'.indexOf(...)
 */
sg.inList = function(strList, value, sep_) {
  var sep = sep_ || ',';

  var surrounded = sep + strList + sep;
  return surrounded.indexOf(sep + value + sep) !== -1;
};

/**
 *  Makes the key a valid identifier (letter, digit, or underscore).
 */
sg.cleanKey = function(key) {
  return key.replace(/[^a-zA-Z0-9_]/g, '_');
};

var capitalizeFirstLetter = sg.capitalizeFirstLetter = function(s) {
  return s.charAt(0).toUpperCase() + s.slice(1);
};

/**
 *  Returns the snake-case version of the string.
 *
 *  instance-type --> instance_type
 */
var toSnakeCase = sg.toSnakeCase = function(key) {
  var parts = _.chain(key.split('.')).map(function(x) { return x.split(/[-_]/g); }).flatten().value();
  return parts.join('_');
};

/**
 *  Returns the dot.case version of the string.
 *
 *  instance_type --> instance.type
 */
var toDotCase = sg.toDotCase = function(key) {
  var parts = _.chain(key.split('.')).map(function(x) { return x.split(/[-_]/g); }).flatten().value();
  return parts.join('.');
};

/**
 *  Returns the dash-case version of the string.
 *
 *  instance_type --> instance-type
 */
var toDashCase = sg.toDashCase = function(key) {
  var parts = _.chain(key.split('.')).map(function(x) { return x.split(/[-_]/g); }).flatten().value();
  return parts.join('-');
};

/**
 *  Returns the camel-case version of the string.
 *
 *  instance_type --> instanceType
 *  instance-type --> instanceType
 */
var toCamelCase = sg.toCamelCase = function(key) {
  var parts = _.chain(key.split('.')).map(function(x) { return x.split(/[-_]/g); }).flatten().value();
  var result  = parts.shift();

  _.each(parts, function(s) {
    result += capitalizeFirstLetter(s);
  });

  return result;
};

/**
 *  Returns the CapitalCase version of the string.
 *
 *  instance_type --> InstanceType
 *  instance-type --> InstanceType
 */
var toCapitalCase = sg.toCapitalCase = function(key) {
  return capitalizeFirstLetter(toCamelCase(key));
};

// Ask for the dash-case or snake_case or identifier.case name, get those or camelCase
var argvGet = sg.argvGet = function(argv, names_) {
  var i, name, names = names_.split(',');

  for (i = 0; i < names.length; i += 1) {
    if ((name = names[i]) in argv)                  { return sg.smartValue(argv[name]); }
    if ((name = toDashCase(names[i])) in argv)      { return sg.smartValue(argv[name]); }
    if ((name = toSnakeCase(names[i])) in argv)     { return sg.smartValue(argv[name]); }
    if ((name = toCamelCase(names[i])) in argv)     { return sg.smartValue(argv[name]); }
    if ((name = toCapitalCase(names[i])) in argv)   { return sg.smartValue(argv[name]); }
    if ((name = toDotCase(names[i])) in argv)       { return sg.smartValue(argv[name]); }
  }

};

/**
 *  Returns the value, but also removes it.
 */
var argvExtract = sg.argvExtract = function(argv, names_) {
  var i, name, names = names_.split(',');

  for (i = 0; i < names.length; i += 1) {
    if ((name = names[i]) in argv)                  { return sg.smartValue(sg.extract(argv, name)); }
    if ((name = toDashCase(names[i])) in argv)      { return sg.smartValue(sg.extract(argv, name)); }
    if ((name = toSnakeCase(names[i])) in argv)     { return sg.smartValue(sg.extract(argv, name)); }
    if ((name = toCamelCase(names[i])) in argv)     { return sg.smartValue(sg.extract(argv, name)); }
    if ((name = toCapitalCase(names[i])) in argv)   { return sg.smartValue(sg.extract(argv, name)); }
    if ((name = toDotCase(names[i])) in argv)       { return sg.smartValue(sg.extract(argv, name)); }
  }

};

/**
 *  _.pick for ARGV args.
 */
sg.argvPick = function(argv, names_) {
  var i, name, names = names_;

  if (_.isString(names)) {
    names = names_.split(',');
  }

  var result = {};
  for (i = 0; i < names.length; i += 1) {
    if ((name = names[i]) in argv)                  { result[name] = sg.smartValue(argv[name]); }
    if ((name = toDashCase(names[i])) in argv)      { result[name] = sg.smartValue(argv[name]); }
    if ((name = toSnakeCase(names[i])) in argv)     { result[name] = sg.smartValue(argv[name]); }
    if ((name = toCamelCase(names[i])) in argv)     { result[name] = sg.smartValue(argv[name]); }
    if ((name = toCapitalCase(names[i])) in argv)   { result[name] = sg.smartValue(argv[name]); }
    if ((name = toDotCase(names[i])) in argv)       { result[name] = sg.smartValue(argv[name]); }
  }

  return result;
};

/**
 *  Gets a sub-sub-key.
 */
var deref = sg.deref = function(x, keys_) {
  if (isnt(x)) { return /* undefined */; }

  var keys    = _.isArray(keys_) ? keys_ : keys_.split('.'), key;
  var result  = x;

  while (keys.length > 0) {
    key = keys.shift();
    if (!(result = result[key])) {
      // We got a falsy result.  If this was the last item, return it (so, for example
      // we would return a 0 (zero) if looked up.
      if (keys.length === 0) { return result; }

      /* otherwise -- return undefined */
      return /* undefined */;
    }
  }

  return result;
};

/**
 *  Sets sub-sub-key of object as an array, and always returns the passed-in value.
 *
 *  setOnn(x, 'foo.bar.baz', 42)
 *
 *  x = {foo:{bar:{baz:[42]}}}
 *
 *  Does not set the sub-object if value is undefined. This allows:
 *
 *      // if abc is not set on  options, x.foo.bar.baz does not get set
 *      setOn(x, 'foo.bar.baz', options.abc);
 */
var setOnna = sg.setOnna = function(x, keys_, value) {
  if (isnt(value)) { return value; }

  var keys  = _.isArray(keys_) ? keys_ : keys_.split('.');
  var owner = x, key;

  while (keys.length > 1) {
    key = keys.shift();
    owner[key] = owner[key] || {};
    owner = owner[key];
  }

  if ((key = keys.shift())) {
    owner[key] = owner[key] || [];
    owner[key].push(value);
  }

  return value;
};

/**
 *  Sets sub-sub-key of object, and always returns the passed-in value.
 *
 *  setOnn(x, 'foo.bar.baz', 42)
 *
 *  x = {foo:{bar:{baz:42}}}
 *
 *  Does not set the sub-object if value is undefined. This allows:
 *
 *      // if abc is not set on  options, x.foo.bar.baz does not get set
 *      setOn(x, 'foo.bar.baz', options.abc);
 */
var setOnn = sg.setOnn = function(x, keys_, value) {
  if (isnt(value)) { return value; }

  var keys  = _.isArray(keys_) ? keys_ : keys_.split('.');
  var owner = x, key;

  while (keys.length > 1) {
    key = keys.shift();
    owner[key] = owner[key] || {};
    owner = owner[key];
  }

  if ((key = keys.shift())) {
    owner[key] = value;
  }

  return value;
};

/**
 *  Sets sub-sub-key of object, returns the value if it was successfuly
 *  set, otherwise returns undefined.
 *
 *  The setOnn... variants always return the passed-in value.
 *
 *  setOn(x, 'foo.bar.baz', 42)
 *
 *  x = {foo:{bar:{baz:42}}}
 *
 *  Does not set the sub-object if value is undefined. This allows:
 *
 *      // if abc is not set on  options, x.foo.bar.baz does not get set
 *      setOn(x, 'foo.bar.baz', options.abc);
 */
var setOn = sg.setOn = function(x, keys_, value) {
  if (isnt(value)) { return; }

  var keys  = _.isArray(keys_) ? keys_ : keys_.split('.');
  var owner = x, key;

  while (keys.length > 1) {
    key = keys.shift();
    owner[key] = owner[key] || {};
    owner = owner[key];
  }

  if ((key = keys.shift())) {
    owner[key] = value;
    return owner[key];
  }

  return;
};

/**
 *  Calls setOn many times
 */
var setOnMulti = sg.setOnMulti = function(obj, keyStart, value, attrNames) {
  _.each(attrNames.split(','), function(name) {
    sg.setOn(obj, [keyStart, name].join('.'), value);
  });
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

sg.shallowCopy = function(x) {
  var result;

  if (_.isArray(x)) {
    return Array.prototype.slice.apply(x);
  } else if (_.isObject(x)) {
    result = {};
    _.each(x, function(value, key) {
      result[key] = value;
    });
    return result;
  }

  return x;
};

/**
 *  Make a clean object (all attrs are POD).
 */
sg.cleanCopy = function(obj) {
  var result = {}, keys = _.keys(obj);

  _.each(keys, function(key) {
    if (isPod(obj[key])) {
      result[key] = obj[key];
    }
  });

  return result;
};

/**
 *    Returns the string ip address into a Number.
 *
 *    For use with subnet masks.
 */
var ipNumber = sg.ipNumber = function(ip_) {
    var ip = ip_.match(/^(\d+)\.(\d+)\.(\d+)\.(\d+)$/);
    if(ip) {
        return (+ip[1]<<24) + (+ip[2]<<16) + (+ip[3]<<8) + (+ip[4]);
    }
    // else ... ?
    return 0;
};

var dottedIp = sg.dottedIp = function(n) {
  return [n >> 24, (n & 0xffffff) >> 16, (n & 0xffff) >> 8, n & 0xff].join('.');
};

var isInCidrBlock = sg.isInCidrBlock = function(ip, cidr) {
  var parts = cidr.split('/');
  return (ipNumber(ip) & ipMask(parts[1])) == ipNumber(parts[0]);
};

var firstIpInCidrBlock = sg.firstIpInCidrBlock = function(cidr) {
  var parts       = cidr.split('/');
  var minNumber   = ipNumber(parts[0]) & ipMask(parts[1]);
  return dottedIp(minNumber);
};

var lastIpInCidrBlock = sg.lastIpInCidrBlock = function(cidr) {
  var parts       = cidr.split('/');
  var maxNumber   = ipNumber(parts[0]) | ~ipMask(parts[1]);
  return dottedIp(maxNumber);
};

var nextIp = sg.nextIp = function(ip) {
  return dottedIp(ipNumber(ip) + 1);
};

/**
 *    Returns the mask size as a Number.
 *
 *    For use with subnet masks.
 */
var ipMask = sg.ipMask = function(maskSize) {
  return -1 << (32 - maskSize);
};

// Ips and Cidrs work
var octet1 = sg.octet1 = function(ip) {
  var parts = (ip || '').split(/[^0-9]/);
  return parts[0];
};

// Ips and Cidrs work
var octet2 = sg.octet2 = function(ip) {
  var parts = (ip || '').split(/[^0-9]/);
  if (parts.length > 1) { return parts[1]; }
  return;
};

// Ips and Cidrs work
var octet3 = sg.octet3 = function(ip) {
  var parts = (ip || '').split(/[^0-9]/);
  if (parts.length > 2) { return parts[2]; }
  return;
};

// Ips and Cidrs work
var octet4 = sg.octet4 = function(ip) {
  var parts = (ip || '').split(/[^0-9]/);
  if (parts.length > 3) { return parts[3]; }
  return;
};

// octet5 is the size of the cidr
var octet5 = sg.octet5 = function(ip) {
  var parts = (ip || '').split(/[^0-9]/);
  if (parts.length > 4) { return parts[4]; }
  return;
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
    var arr = kv.split(sep2), k = arr[0], v = arr[1] || '';
    if (k && v) {
      ret[k.toLowerCase()] = v.toLowerCase();
    }
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

sg.lpad = function(val, len, sep_) {
  var sep = sep_;
  if (!sep) {
    if (_.isNumber(val))  { sep = '0'; }
    else                  { sep = ' '; }
  }

  var str = '' + val;
  while (str.length < len) {
    str = str + sep;
  }

  return str;
};

sg.ltrim = function(s, ch) {
  while (s[0] === ch && s.length > 0) {
    s = s.substr(1);
  }
  return s;
};

sg.rtrim = function(s, ch) {
  while (s[s.length-1] === ch && s.length > 0) {
    s = s.substr(0, s.length-1);
  }
  return s;
};

sg.trim = function(s, ch) {
  return sg.rtrim(sg.ltrim(s, ch), ch);
};

/**
 *  Truncates string to the given length, removing initial chars.
 */
sg.lchop = function(s, len, padLen) {
  len = (len < 0 ? 0 : len);

  while (s.length > len) {
    s = s.substr(1);
  }

  if (_.isUndefined(padLen)) {
    return s;
  }

  /* otherwise */
  return sg.lpad(s, padLen);
};

/**
 *  Truncates string to the given length, removing final chars.
 */
sg.rchop = function(s, len, padLen) {
  len = (len < 0 ? 0 : len);

  while (s.length > len) {
    s = s.substr(0, s.length-1);
  }

  if (_.isUndefined(padLen)) {
    return s;
  }

  /* otherwise */
  return sg.pad(s, padLen);
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

var inspectFlat = sg.inspectFlat = function(x) {
  return sg.inspect(x).replace(/ *\n */g, ' ');
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

sg.mkLogger = function(argv) {

  var vLevel = 0;
  if      (argv.vvvvvvvvverbose)  { vLevel = 9; }
  else if (argv.vvvvvvvverbose)   { vLevel = 8; }
  else if (argv.vvvvvvverbose)    { vLevel = 7; }
  else if (argv.vvvvvverbose)     { vLevel = 6; }
  else if (argv.vvvvverbose)      { vLevel = 5; }
  else if (argv.vvvverbose)       { vLevel = 4; }
  else if (argv.vvverbose)        { vLevel = 3; }
  else if (argv.vverbose)         { vLevel = 2; }
  else if (argv.verbose)          { vLevel = 1; }

  return function() {
    if (vLevel >= 2) {
      _.each(arguments, function(arg, index) {
        process.stderr.write(inspect(arg));
        process.stderr.write(' ');
      });
    }
  };
};

/**
 *
 *  printf("here it %03s1 is", 4) ==> "here it 004 is"
 *
 *  args are 1-based
 *
 *
 */
sg.printf = function(fmt) {
  var params = _.rest(arguments);
  return fmt.replace(/(%([0-9]*)s([0-9]))/g, function(m, p, width, argNum) {
    var repl = params[argNum-1];
    if (width.length > 0) {
      if (width[0] === '0') {
        repl = pad(repl, width, '0');
      } else {
        repl = pad(repl, width);
      }
    }

    return repl;
  });
};

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

/**
 *  Makes x the right type.
 */
var smartValue = sg.smartValue = function(value) {
  if (_.isString(value)) {
    if (/^[0-9]+$/.exec(value)) { return parseInt(value, 10); }
    if (value === 'true')       { return true; }
    if (value === 'false')      { return false; }
  }

  return value;
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

var toError = sg.toError = function(e) {
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

var reportError = sg.reportError = function(e, message) {
  if (!e) { return; }

  var result = toError(e);

  if (message) {
    process.stderr.write(message);
    process.stderr.write(': ');
  }

  console.error(result);

  return result;
};

sg.mimeType = function(name) {
  return sg.extlibs.mime.lookup.apply(sg.extlibs.mime, arguments);
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

  // Ask for the dash-case or snake_case or identifier.case name, get those or camelCase
  self.get = self.argvGet = self.getArg = function(names_, options) {
    var result;

    // If the caller passed in options, those come first
    if (options && (result = argvGet(options, names_)))    { return result; }

    /* otherwise -- get from our args */
    result = argvGet(self, names_);
    return result;
  };

  // Initialize -- scan the arguments
  var curr;
  for (var i = 2; i < process.argv.length; i++) {
    var next = i+1 < process.argv.length ? process.argv[i+1] : null;
    var m, m2;

    curr = process.argv[i];

    // --foo=bar, --foo=
    if ((m = /^--([a-zA-Z_0-9\-]+)=(.+)$/.exec(curr)) && m.length === 3) {
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

var die = sg.die = function(a,b,c) {
  if (arguments.length === 0)       { return die(1, ''); }
  if (arguments.length === 1) {
    if (_.isString(a))              { return die(1, a); }
    if (_.isNumber(a))              { return die(a, ''); }
  }

  if (arguments.length >= 2) {
    if (_.isFunction(b))            { sg.reportError(a, c); return b(a); }
  }

  if (b) {
    process.stderr.write(b);
    process.stderr.write('\n');
  }

  process.exit(a);
};

sg.mkFailFn = function(callback) {
  return function(err) {
    return callback(sg.toError(err));
  };
};

/**
 *  Was the callback called to mean a good result? (Are the results OK?)
 *
 *  When you get a callback: `function(err, result1, result2) {...}` you can call
 *
 *          if (ok(err, result1, result2)) {
 *            // result1 and 2 are valid
 *          }
 *
 *  or:
 *
 *          if (!ok(err, result1, result2)) { return err; }
 */
sg.ok = function(err /*, [argN]*/) {
  if (err)  { console.error(err); return false; }

  var result = true;
  _.each(_.rest(arguments), function(value, index) {
    var is = !isnt(value);

    result = result && is;
    if (!is) {
      console.error("Param "+index+" is "+value);
    }
  });

  return result;
};

sg = _.extend(sg, require('./flow'));

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

// Dynamically load the routes helpers
var __routes;
sg.routes = function() {
  if (!__routes) { __routes = require('./ex-routes'); }

  return __routes;
};

sg.callMain = function(argv, filename) {
  if (process.argv[1] === filename) { return true; }
  if (argv.main)                    { return true; }

  return false;
};

sg.exportify = function(theModule, mod) {
  _.each(mod, function(value, key) {
    theModule.exports[key] = value;
  });
};

sg = require('./sgext').load(sg, _);
sg = require('./sgmore').load(sg, _);

_.each(sg, function(fn, name) {
  exports[name] = sg[name];
});
exports.iAmStillHere = function() { return true; }

if (process.argv[1] === __filename) {
  _.each(tests, function(test) {
    test();
  });
}

