
/**
 *  Flow control stuff.
 */

var _   = require('underscore');
var sg  = {};

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
    sg.reportError(a, b);
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

_.each(sg, function(value, key) {
  exports[key] = value;
});

