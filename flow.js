
/**
 *  Flow control stuff.
 */

var _         = require('underscore');
var sg        = {};
var sglite    = require('./lite');

var isnt      = sglite.isnt;
var isObject  = sglite.isObject;

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

/**
 *  Copy-and-pasted from sg.js
 */
function SgError(message) {
  this.name  = 'SgError';
  this.stack = (new Error()).stack;

  if (_.isString(message) && message.startsWith('ENO')) {
    this.name     = _.first(message.split(/[^a-z0-9]/i));
    this.message  = message || 'Default Message';
  } else {
    this.message  = message || 'Default Message';
  }
}
SgError.prototype = Object.create(Error.prototype);
SgError.prototype.constructor = SgError;

/**
 *  Copy-and-pasted from sg.js
 */
var toError = function(e) {
  if (e instanceof Error)     { return e; }
  if (_.isString(e))          { return new SgError(e); }
  if (_.isArray(e))           { return new Error(JSON.stringify(e)); }

  if (_.isObject(e)) {
    if (_.isString(e.error))  { return new SgError(e.error); }
    if (_.isString(e.Error))  { return new SgError(e.Error); }
    if (_.isString(e.err))    { return new SgError(e.err); }
    if (_.isString(e.Err))    { return new SgError(e.Err); }
  }

  if (e === null)             { return e; }
  if (e === undefined)        { return e; }

  return new Error('' + e);
};

/**
 *  Copy-and-pasted from sg.js
 */
var reportError = function(e, message) {
  if (!e) { return; }

  var result = toError(e);
  var msg    = '';

  if (_.isString(e)) {
    msg += e+' at ';
  }

  if (message) {
    msg += message+': ';
  }

  if (msg) {
    process.stderr.write(msg);
  }

  console.error(result);

  return result;
};

/**
 *  When you have a next function, like in an sg.__run(...), you could get an
 *  err response at any time.  If you want to log the error, and skip the rest
 *  of the step, but want to continue on with the next step, use this.
 *
 *  Virtually identical to `return next()` except you can log the msg/err to stderr
 *
 *  Usage:
 *        if (err) { return skip(err, next); }
 *
 */
sg.skip = function(msg_, next) {
  var msg = msg_;
  if (!_.isString(msg)) { msg = sg.inspect(msg_); }

  console.error(msg);
  return next();
};

/**
 *  While in active development, in an sg.__run(...) you can check parameters easily
 *  with reason(), logging why you are not doing something.
 *
 *  * Your code must handle the situation -- validate inputs -- this is an easy way.
 *  * But generally, you go to the next step.
 *  * Then, later, you can change it to reasonX to be less verbose, if you want.
 *
 *  Virtually identical to `return next()` except you can log the msg/err to stdout
 *
 *  Usage:
 *      if (!body.clientId) { return reason('cannot parse query Client --no body.clientId', next); }
 *
 */
sg.reason = function(msg_, next) {
  var msg = msg_;
  if (!_.isString(msg)) { msg = sg.inspect(msg_); }

  console.log(msg);
  return next();
};

sg.reasonX = function(msg, next) {
  return next();
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

/**
 *  Make a die function for things running in parallel.
 */
sg.__mkDiell = function(callback) {

  var die = function(a, b) {

    // Handle overloads
    if (arguments.length === 0)       { return die(1, ''); }
    if (arguments.length === 1) {
      if (_.isString(a))              { return die(1, a); }
      if (_.isNumber(a))              { return die(a, ''); }
    }

    // Only run once
    if (die.dead)         { return; }
    die.dead = true;

    if (_.isNumber(a)) {
      // Not a callback situation.
      if (b) {
        process.stderr.write(b);
        process.stderr.write('\n');
      }

      process.exit(a);
    }

    /* otherwise -- callback with the error */
    reportError(a, b);
    return callback(a);
  };

  die.dead = false;


  return die;
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

var _pushm = function(m, x) {
  m.push(x);
  return m;
};

/**
 *  Runs a list of Node.js-style functions synchronously.
 *
 *  This is a version of __run() that has a couple of extra features for typical handlers.
 *
 *  * Passes a `self` parameter that can be used to share data/state between the functions.
 *    Works great to accumulate the function's result.
 *  * Provides the finalization function to each function, so it can be called at any point.
 *  * Provides two finalization functions, intending one for normal/success results, and one
 *    for errors.
 *  * Very flexible parameter signature. Detects each param by its type. The only constraints
 *    are that `self` must be first, if provided; and that `abort` comes after `last`.
 *
 *  This function was built for two specific use-cases that occur a lot. It allows to provide
 *  a `main` function first in the list, to improve readability; and allows `callback` to be
 *  passed in (usually before the functions), and then calling `last` or `abort` in any function
 *  is really calling `callback`.
 *
 *  If the last function in the Array calls `next()` (which is very typical), then last will
 *  be called as `last(null, self)`. This is obviously to facilitate using `callback` as `last`.
 *  If you do not want `self` to be passed automatically like this, pass your object in double-
 *  wrapped in Arrays: `[[{}]]`. The wrapping Arrays are just decoration, and will be removed
 *  before anything is done with `self`.
 *
 *  @param {Object} self    - An object passed to each function. Makes it easy for the functions
 *                            to share state/data. Must be the first parameter. If it is not supplied
 *                            __run2() will provide `{}`, and pass as the _last_ parameter to each
 *                            of the functions. If provided, it is passed as the first parameter.
 *  @param {function[]} fns - An Array of functions to be run on after the other.
 *  @param {function} last  - The last function to be run. This is a separate function outside the
 *                            Array of functions. It may be provided in any location in the parameter
 *                            list.
 *  @param {function} abort - A separate function to be used as a final function. If not provided, will
 *                            be a copy of `last`. To skip providing a function, but to have `abort` not
 *                            be a copy of `last`, pass `false`. `abort` will always put a truthy
 *                            value in the first parameter (using `'aborted'` as a default.) This
 *                            allows you to just `return abort();` in any function.
 */
sg.__run2 = function(a,b,c,d) {   // self, fns, last, abort
  // Figure out params
  var args = _.toArray(arguments);
  var self,fns,last,abort_,abort,privateSelf,noSelf;

  // self can only be the first param, if not, use a blank Object
  self          = isObject(args[0]) && args.shift();
  privateSelf   = !self;                                  // If self is undefined here, it is potentially a private-self

  self          = self || _.isArray(args[0]) && args[0].length === 1 && _.isArray(args[0][0]) && args[0][0].length === 1 && args[0][0][0];
  privateSelf   = privateSelf && !!self;                  // But if self wasn't set by [[...]], it is not private-self

  noSelf        = !self;
  self          = self || {};

  // Fns is the only Array
  args = _.filter(args, function(arg) { return fns || !(fns = _.isArray(arg) && arg); });

  // last is the first function
  args = _.filter(args, function(arg) { return last || !(last = _.isFunction(arg) && arg); });

  // any remaining arg has to be abort
  abort_ = args.shift();

  // Any of them can be unset
  fns   = fns || [];
  last  = last || function(){};

  if (abort_ === false)  { abort_ = function(){}; }
  else                   { abort_ = abort_ || last; }

  abort = function(err) {
    var args = _.rest(arguments);
    args.unshift(err || 'aborted');
    return abort_.apply(this, args);
  };

  return sg.__each(
    fns,
    function(fn, next, index, coll) {
      if (noSelf) {
        return fn(next, last, abort, self);
      }
      return fn(self, next, last, abort);
    },
    function(a,b) {
      if (privateSelf) {
        return last.apply(this, arguments);
      }

      return last(null, self);
    }
  );
};

/**
 *  Replaces all attributes on result with those on all the rest of the arguments.
 *
 *  When using __run2, the result of the operation is passed into each step, so you can
 *  add attributes to the result. However, using this style you cannot set the whole
 *  result object at once. (You cannot do `result = {ack:'bar'}`) You would have to remove
 *  all existing attributes, and add all new ones -- thats what this function does.
 *
 */
sg.replaceResult = function(result /*, ...replaces*/) {

  var replaces = _.rest(arguments);

  // First, clobber the result
  _.each(result, function(value, key) {
    delete result[key];
  });

  // Then, loop over all the other fn params, and add those to result
  _.each(replaces, function(replace) {
    _.each(replace, function(value, key) {
      result[key] = value;
    });
  });
}


/**
 *  Calls fn until it wants to quit
 */
sg.until = function(/* [options,] fn, callback */) {
  var args      = _.toArray(arguments);
  var callback  = args.pop();
  var fn        = args.pop();
  var options   = args.shift() || {};

  var max       = options.max;
  var timeout   = options.timeout;

  options.interval  = options.interval || options.delay;

  var count = -1, start = _.now();

  var again;
  var once = function() {
    count += 1;

    // Limit the number of executions
    if (options.max) {
      if (count >= max)                 { return callback(toError("Too many executions in until(): "+count)); }
    }

    // Limit the time it can run
    if (options.timeout) {
      if (timeout > (_.now() - start))  { return callback(toError("Timeout in until: ("+(_.now() - start)+" ms.)")); }
    }

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
 *  die() function copy-and-patsted from sg.js
 */
var die = function(a,b,c) {
  if (arguments.length === 0)       { return die(1, ''); }
  if (arguments.length === 1) {
    if (_.isString(a))              { return die(1, a); }
    if (_.isNumber(a))              { return die(a, ''); }
  }

  if (arguments.length >= 2) {
    if (_.isFunction(b))            { reportError(a, c); return b(a); }
  }

  if (b) {
    process.stderr.write(b);
    process.stderr.write('\n');
  }

  process.exit(a);
};

/**
 *  Internally wrap a function so error handling is not so boiler-plateish.
 */
sg.iwrap = function(myname, fncallback /*, abort, body_callback*/) {
  var   args             = _.rest(arguments, 2);
  const body_callback    = args.pop();
  var   abort            = args.shift();

  abort = abort || function(err, msg) {
    if (msg)  { return die(err, fncallback, msg); }
    return fncallback(err);
  };

  var abortCalling;
  var abortParams;

  var eabort = function(callback, abortCalling2) {
    return function(err) {
      if (!err) { return callback.apply(this, arguments); }

      const abortCalling_ = abortCalling || abortCalling2;     abortCalling  = null;
      const abortParams_  = abortParams;                       abortParams   = null;

      var msg = '';

      if (abortCalling_) {
        msg += `${myname}__${abortCalling_}`;
      }

      if (abortParams_) {
        msg += `: ${abortParams}`;
      }

      return abort(err, msg);
    };
  };

  eabort.calling = function(calledName) {
    abortCalling = calledName;
  };

  eabort.p = function(params_) {
    const params = _.isObject(params_) ? params_ : { param: params_};
    abortParams = JSON.stringify(params);
    return params_;
  };

  return body_callback(eabort);
};

/**
 *  Just like __run, but return enext, enag, ewarn -- which is what you really want.
 */
sg.__run3 = function(a, b) {
  var fns, callback;

  if (_.isArray(a)) {
    fns = a; callback = b;
  } else {
    fns = b; callback = a;
  }

  return sg.__each(
    fns,
    function(fn, next, index, coll) {

      // On error, go to the next function, no message
      const enext = function(callback) {
        return function(err) {
          if (err) { return next(); }
          return callback.apply(this, arguments);
        };
      };

      // On error, go to the next function, with warning
      var   warnMsg;
      var   ewarn = function(callback, warnMsg2) {
        return function(err) {
          const warnMsg_ = warnMsg || warnMsg2;       warnMsg = null;
          if (err) {
            console.error('WARNING:'+warnMsg_+'  '+JSON.stringify(err));
            return next();
          }
          return callback.apply(this, arguments);
        };
      };

      ewarn.msg = function(msg) {
        warnMsg = msg;
      };

      // On error, just resume, but with a nag
      var   nagMsg;
      var   enag = function(callback, nagMsg2) {
        return function(err) {
          const nagMsg_ = nagMsg || nagMsg2;       nagMsg = null;
          if (err) {
            console.error('NAG:'+nagMsg_+'  '+JSON.stringify(err));
          }
          return callback.apply(this, arguments);
        };
      };

      enag.msg = function(msg) {
        nagMsg = msg;
      };


      return fn(next, enext, enag, ewarn);
    },
    callback || function() {}
  );
};

_.each(sg, function(value, key) {
  exports[key] = value;
});

