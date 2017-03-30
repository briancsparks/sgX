
/**
 *  The super light weight functionality.
 */

var _   = require('underscore');
var sg  = {};

/**
 *  Returns if the program is running in debug mode.
 *
 *  @alias module:sgsg.isDebug
 */
sg.isDebug = function() {
  return process.env.NODE_ENV === 'development';
};

var seconds = sg.seconds = sg.second = 1000,        second = seconds;
var minutes = sg.minutes = sg.minute = 60*seconds,  minute = minutes;
var hours   = sg.hours   = sg.hour   = 60*minutes,  hour   = hours;
var days    = sg.days    = sg.day    = 24*hours,    day    = days;
var weeks   = sg.weeks   = sg.week   = 7*days,      week   = weeks;
var months  = sg.months  = sg.month  = 30*days,     month  = months;
var years   = sg.years   = sg.year   = 365*days,    year   = years;

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

  if (isnt(k))              { return o; }
  if (_.isUndefined(v))     { return o; }

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

/**
 *  Build {k:v}, where the key is a dotted-key
 */
var dottedKv = sg.dottedKv = function(o, k, v) {
  if (arguments.length === 2) {

    if (_.isArray(o)) { return dottedKv(null, o.join('.'), k); }
    return kv(null, o, k);
  }

  if (_.isArray(k)) { return dottedKv(o, k.join('.'), v); }

  o = o || {};
  o[k] = v;
  return o;
};

/**
 *  Is the parameter strictly an Object (and not an Array, or Date, or ...).
 */
var isObject = sg.isObject = function(x) {
  if (!_.isObject(x))                     { return false; }
  if (_.isArray(x)    || _.isDate(x))     { return false; }
  if (_.isFunction(x) || _.isRegExp(x))   { return false; }
  if (_.isError(x))                       { return false; }

  return true;
};

/**
 *
 */
var isPod = sg.isPod = function(x) {
  if (_.isString(x))            { return true; }
  if (_.isNumber(x))            { return true; }
  if (_.isBoolean(x))           { return true; }
  if (_.isDate(x))              { return true; }
  if (_.isRegExp(x))            { return true; }

  return false;
};

var isnt = sg.isnt = function(x) {
  return _.isNull(x) || _.isUndefined(x);
};

/**
 *  Build {k:v}, but do not set the value if k or v are undefined/null.
 *
 *  This allows passing in undefined, and getting the original object
 *  back, without mods.
 */
var kvSmart = sg.kvSmart = function(o, k, v) {
  if (arguments.length === 2) {
    return kvSmart(null, o, k);
  }

  o = o || {};

  if (!isnt(k) && !isnt(v)) {
    o[k] = v;
  }

  return o;
};

/**
 *  Makes a map of true values.
 *
 *    {
 *      foo: true,
 *      bar: true
 *    }
 */
sg.mkSet = function(coll, sep) {
  if (sg.isObject(coll))  { return sg.mkSet(_.keys(coll)); }
  if (_.isString(coll))   { return sg.mkSet(coll.split(sep || ',')); }

  return _.reduce(coll, function(m, key) {
    return sg.kv(m, key, true);
  }, {});
};

/**
 *  Returns if x is within the comma-delimited set of strings.
 */
sg.inSet = function(x, theSet_, sep) {
  var theSet = theSet_;
  if (!sg.isObject(theSet))   { theSet = sg.mkSet(theSet, sep); }
  return x in theSet;
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

/**
 *  Make sure the item is an array.
 */
sg.toArray = function(x) {
  if (x === null || _.isUndefined(x)) { return []; }
  if (_.isArray(x))                   { return x; }
  return [x];
};

_.each(sg, function(value, key) {
  exports[key] = value;
});

