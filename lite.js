
/**
 *  The super light weight functionality.
 */

var _   = require('underscore');
var sg  = {};

/**
 *  Returns if the program is running in production.
 *
 *  @alias module:sgsg.isProduction
 */
sg.isProduction = function() {
  return process.env.NODE_ENV === 'production';
};

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

/**
 *  Just like setTimeout, but with the parameters in the right order.
 */
sg.setTimeout = function(ms, cb) {
  return setTimeout(cb, ms);
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
 *  Returns the keys of an object.
 *
 *  Just like _.keys, except it will return null or undefined if given an
 *  input that isnt().
 */
sg.keys = function(x) {
  if (isnt(x))            { return x; }

  return _.keys(x);
};

/**
 *  Makes an object where the key for each item is the same as the value.
 */
sg.keyMirror = function(x, sep) {
  var result = {};

  if (isnt(x))            { return x; }

  if (_.isString(x))      { return sg.keyMirror(x.split(sep || ',')); }
  if (sg.isObject(x))     { return sg.keyMirror(_.keys(x)); }

  if (!_.isArray(x))      { return result; }

  _.each(x, function(item) {
    result[item] = item;
  });

  return result;
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
 *  Gets a sub-sub-key.
 */
var deref = sg.deref = function(x, keys_) {
  if (isnt(x))      { return /* undefined */; }
  if (isnt(keys_))  { return /* undefined */; }

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
  if (isnt(x) || isnt(keys_) || isnt(value)) { return value; }

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
 *  Treats arr as a set (no duplicate entries), and adds the item if
 *  it is not already present.
 */
sg.addToSet = function(item, arr) {
  if (arr.indexOf(item) !== -1) { return arr; }

  arr.push(item);
  return arr;
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

/**
 *  Just like _.each, except adds three params to the callback:
 *
 *  * The numeric index (call invocation number)
 *  * isFirst
 *  * isLast
 */
sg.each = sg._each = function(collection, fn, context) {
  var numericIndex = 0;
  var length = collection.length || sg.numKeys(collection);

  _.each(collection, function(element, index, coll) {
    var args = [element, index, {collection: coll, i:numericIndex, first:(numericIndex === 0), last:(numericIndex+1 === length), length:length}];
    numericIndex += 1;
    return fn.apply(this, args);
  }, context);
};

sg.reduce = sg._reduce = function(collection, initial, fn) {
  return _.reduce(collection, fn, initial);
};

sg.extract = sg._extract = function(collection_, name) {
  var collection  = collection_ || {};
  var value       = collection[name];

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

var safeJSONParse = sg.safeJSONParse = function(str, def) {
  if (str !== '') {
    try {
      return JSON.parse(str);
    } catch(err) {
      console.error("Error parsing JSON", str, err);
    }
  }

  return arguments.length > 1 ? def : {};
};

var safeJSONParseQuiet = sg.safeJSONParseQuiet = function(str, def) {
  if (str !== '') {
    try {
      return JSON.parse(str);
    } catch(err) {
      //console.error("Error parsing JSON", str, err);
    }
  }

  return arguments.length > 1 ? def : {};
};

sg.deepCopy = function(x) {
  if (isnt(x)) { return x; }
  return sg.safeJSONParse(JSON.stringify(x));
};

/**
 *  Just like _.extend, but does not mutate the 1st arg.
 */
sg._extend = function() {
  var args = _.toArray(arguments);
  args.unshift({});
  return _.extend.apply(_, args);
};

/**
 *  A deep version of underscores extend.
 *
 *  It is assumed that the objects have similar layout, and are
 *  plain objects (they should not have functions or prototypes.)
 *
 */
var extend = sg.extend = function(first /*, ...*/) {

  // Handle degenerate case special
  if (_.every(arguments, function(x) { return sg.isnt(x); })) {
    return null;
  }

  var args = _.rest(arguments);
  var second;

  var dest = sg.reduce(first, {}, function(m, value, key) {
    return kv(m, key, value);
  });

  while (args.length > 0) {
    second = args.shift();
    dest = sg.reduce(second, sg.deepCopy(dest), function(m, sValue, sKey) {

      // If seconds value is POD, it will just clobber the dest
      if (!isObject(sValue)) {
        return kv(m, sKey, sValue);
      }

      // If firsts value is POD, it will be clobbered
      if (!isObject(m[sKey])) {
        return kv(m, sKey, sValue);
      }

      // Otherwise -- they are both objects, we must merge
      return kv(m, sKey, extend(m[sKey], sValue));
    });
  }

  return dest;
};

/**
 *  Make sure the item is an array.
 */
sg.toArray = function(x) {
  if (x === null || _.isUndefined(x)) { return []; }
  if (_.isArray(x))                   { return x; }
  return [x];
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

/**
 *  Normalize a URL.
 *
 *  When manipulating URLs, many times you will end up with double slashes. This function
 *  will normalize URLs that have been built this way.
 */
sg.normlz = function(url) {
  var protocol = '';
  var pathname = url;

  var m = /^((http|https):[/][/])(.*)$/.exec(url);

  if (m) {
    protocol = m[1];
    pathname = m[3];
  }

  // '//' ->> '/'
  while (pathname.indexOf('//') !== -1) {
    pathname  = pathname.replace(/[/][/]/g, '/');
  }

  var result = protocol + pathname;
  return result;
};

_.each(sg, function(value, key) {
  exports[key] = value;
});
