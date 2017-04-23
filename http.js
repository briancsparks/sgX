
/**
 *  Interact with HTTP.
 */
var _         = require('underscore');
var sgflow    = require('./flow');
var sg        = {};

/**
 *  Do the middleware thang to the req and res objects.
 */
sg.mwHook = function(options_) {
  return function(req, res, nextMw) {
    var options   = options_      || {};
    var log       = options.log   || console.log;

    res.sg = {
      start   : _.now(),
      errors  : []
    };

    var origEnd   = res.end;
    res.end = function() {
      res.end   = origEnd;

      if (options_.log !== false) {
        res.sg.logMsg[1] = _.now() - res.sg.start;
        log(res.sg.logMsg.join('; '));
      }

      return res.end.apply(res, arguments);
    };

    if (options_.log !== false) {
      // Add a log
      res.sg.logMsg = [];

      res.sg.logMsg.push(urlLib.parse(req.url).pathname);
      res.sg.logMsg.push(0);       // Placeholder for duration
    }

    return sgflow.__runll([function(next) {
      // Tracing headers
      if (req.headers['x-sg-trace']) {
        res.setHeader('X-SG-Trace', req.headers['x-sg-trace']);

      } else if (options_.trace !== false) {
        return crypto.randomBytes(64, function(err, buf) {
          if (err) { return next(); }
          res.setHeader('X-SG-Trace', 'id='+buf.toString('hex'));
          return next();
        });
      }

      return next();

    }, function(next) {
      if (!options.body) { return next(); }
      return sg.body(req, function(err, next));
    }], function() {
      return nextMw();
    });
  };
};

/**
 *  Do the middleware thang to the req and res objects.
 */
sg.mwReqRes = function(req, res) {

  // Add a log
  res.sg = {
    start   : _.now(),
    logMsg  : [],
    errors  : []
  };

  var origEnd   = res.end;
  res.end = function() {
    res.end   = origEnd;

    res.sg.logMsg[1] = _.now() - res.sg.start;

    console.log(res.sg.logMsg.join('; '));
    return res.end.apply(res, arguments);
  };

  res.sg.logMsg.push(urlLib.parse(req.url).pathname);
  res.sg.logMsg.push(0);       // Placeholder for duration
};

/**
 *  Add a message.
 */
sg.resMsg = function(res, msg) {
  if (!res || !msg) { return; }

  res.sg        = res.sg        || {};
  res.sg.logMsg = res.sg.logMsg || [];

  res.sg.logMsg.push(msg);
};

/**
 *  Sets an error on the req/res.
 */
sg.resErr = function(res, err) {
  if (!res || !err) { return; }

  res.sg        = res.sg        || {};
  res.sg.errors = res.sg.errors || [];

  res.sg.errors.push(err);
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


_.each(sg, function(value, key) {
  exports[key] = value;
});


