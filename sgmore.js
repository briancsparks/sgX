
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

  var verbose       = sg.verbose;

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
    var content     = content_            || {code: code, msg: stringForHttpCode(code)};
    var headers     = headers_            || {};
    var debugInfo   = null;

    if (process.env.NODE_ENV !== 'production') {
      if (code >= 400) {
        debugInfo = debugInfo_ || {};
      }
    }

    // No debug for any permission denied code
    if (code === 401 || code === 403) {
      debugInfo = null;
    }

    if (_.isString(content)) {
      content = mkResponseObject(code, content);
    }

    // Remember the passed-in content
    var origContent = sg.extend(content);

    if (_.isObject(content)) {
      if (debugInfo) {
        content.debug = debugInfo;
      }

      content = JSON.stringify(content);
    }

    headers['Content-Type']   = headers['Content-Type'] || 'application/json';
    headers['Content-Length'] = content.length;

    if ((code === 301 || code === 302) && origContent.Location) {
      headers.Location = origContent.Location;
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
    var files   = [];

    var eachLineOfOneFile = function(filename, next) {
      return fs.readFile(filename, 'utf8', function(err, contents) {
        if (err) { return next(err); }

        var lines = contents.split('\n');
        if (options.lineFilter) {
          lines = _.filter(lines, options.lineFilter);
        }

        var i = 0, l = lines.length;
        var oneLine = function() {
          total++;

          var result = eachCallback(lines[i], i, filename, total);
          if (result === 'SG.nextFile') {
            return next();
          }

          if (result === 'SG.done') {
            return finalCallback(null, total, files.length);
          }

          i += 1;
          if (i < l) {
            if (result === 'SG.breathe') {
              //console.log('Breathing');
              return setTimeout(oneLine, 500);
            }

            if (i % 200 === 0) {
              return process.nextTick(oneLine);
            }

            return oneLine();
          }

          return next();
        };

        return oneLine();
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

    return glob(pattern, options, function(err, files_) {
      if (err) { return finalCallback(err); }

      files = files_;
      return sg.__each(files, function(filename_, next) {
        var filename = path.join(options.cwd || '', filename_);

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

    //verbose(0, "---------------------------------------- spawnEzing ----------------------------------", command, args, options);
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

  /**
   *  Invoke an external command.
   *
   *  A lot like exec (just have one callback), but with all the goodness
   *  of spawn.  The callback also returns all the info that spawn can.
   *
   *  @alias module:sgsg.exec
   *
   *  @param {string} cmd The external command to run.
   *  @param {array} args Arguments to the command
   *  @param {object} [options] options that will get passed to spawn.
   *  @param {function} callback The callback will be called when the command has completed.
   *
   *  callback(error, exitCode, stdoutChunks, stderrChunks, signal)
   */
  sg.exec = function(cmd, args /*, options, callback*/) {
    var args_    = _.rest(arguments, 2);
    var callback = args_.pop() || lib.noop;
    var options  = args_.pop() || null;

    var encoding = 'utf8';
    if (options && 'encoding' in options) {
      encoding = sg.extract(options, 'encoding');
    }

    var proc, error, exitCode, stdoutChunks = [], stderrChunks = [], signal;

    if (options !== null) {
      proc = spawn(cmd, args, options);
    } else {
      proc = spawn(cmd, args);
    }

    proc.stdout.setEncoding(encoding);
    proc.stdout.on('data', function(chunk) {
      stdoutChunks.push(chunk);
    });

    proc.stderr.setEncoding('utf8');
    proc.stderr.on('data', function(chunk) {
      stderrChunks.push(chunk);
    });

    // We must guard against calling the callback multiple times
    var finalFunctionHasBeenCalled = false, closeTimer = null;
    var finalFunction = function(which) {
      if (finalFunctionHasBeenCalled) { return; }

      if (which === 'close') {
        finalFunctionHasBeenCalled = true;
        if (closeTimer) {
          clearTimeout(closeTimer);
        }
        return callback(error, exitCode, stdoutChunks, stderrChunks, signal);
      }

      // A close may arrive... give it a few moments
      return closeTimer = setTimeout(function() {
        if (finalFunctionHasBeenCalled) { return; }
        finalFunctionHasBeenCalled = true;
        return callback(error, exitCode, stdoutChunks, stderrChunks, signal);
      }, 1000);
    };

    proc.on('close', function(exitCode_, signal_) {
      exitCode  = exitCode_;
      signal    = signal_;
      return finalFunction('close');
    });

    proc.on('error', function(err) {
      error     = err;
      return finalFunction('error');
    });

    proc.on('exit', function(exitCode_, signal_) {
      exitCode  = exitCode_;
      signal    = signal_;
      return finalFunction('exit');
    });

  };

  /**
   *  A wrapper for sg.exec() with a simple callback signature:
   *
   *    * callback(err, stdoutLines)
   *
   *  * If the spawned process had an error of any kind, err will be info
   *    on the error.
   *  * stdoutLines will always be the stdout, split into lines.
   */
  sg.execEz = function(cmd, args /*, options, callback*/) {
    var args_       = _.rest(arguments, 2);
    var callback    = args_.pop() || lib.noop;
    var options     = args_.pop() || null;
    var ezOptions   = options     || {};

    return sg.exec(cmd, args, options, function(error, exitCode, stdoutChunks, stderrChunks, signal) {
      var stdout  = (stdoutChunks || []).join('').split('\n');
      var stderr  = (stderrChunks || []).join('');
      var err     = {};

      if (error)                { err.error     = error; }
      if (signal)               { err.signal    = signal; }
      if (exitCode !== 0)       { err.exitCode  = exitCode; }
      if (stderr.length > 0)    { err.stderr    = stderr; }

      if (sg.numKeys(err) !== 0) {
        if (!ezOptions.quiet) {
          sg.reportOutput(cmd+args.join(" "), error, exitCode, stdoutChunks, stderrChunks, signal);
        }
      } else {
        err = null;
      }

      return callback(err, stdout);
    });
  };

  /**
   *  Makes a nice, usually compact, reporting of what sg.exec() outputs.
   *
   *  This function is intended to be used when you call sg.exec() on a utility / program
   *  that produces a small amount of output. It works great for short bash scripts that
   *  you write and invoke from your Node.js code -- when they are written to output a
   *  short and sweet success message, or to send error info on stderr.
   *
   *    * Gives detailed info on any error information.
   *    * Tries to condense stdout (if it is only one line, combines it.)
   *
   *  Returns a 2-tuple: [err, stdout-as-one-big-string]
   *
   */
  sg.reportOutput = function(msg_, error, exitCode, stdoutChunks, stderrChunks, signal) {

    const stdoutLines = _.compact(stdoutChunks.join('').split('\n'));

    if (msg_ !== null) {
      const msg         = sg.lpad(msg_+':', 50);
      const stderrLines = _.compact(stderrChunks.join('').split('\n'));

      // Write the final status (exitCode, signal) first.
      if (stdoutLines.length === 1) {
        console.log(`${msg} exit: ${exitCode}, SIGNAL: ${signal}: ${stdoutLines[0]}`);
      } else {
        console.log(`${msg} exit: ${exitCode}, SIGNAL: ${signal}`);
      }

      // Then write any error objects
      if (error) {
        console.error(error);
      }

      // Then, write full stdout
      if (stdoutLines.length === 1) {
      } else {
        _.each(stdoutLines, line => {
          console.log(`${msg} ${line}`);
        });
      }

      // Then write full stderr
      const stderr = stderrChunks.join('');
      if (stderr.length > 0) {
        _.each(stderrLines, line => {
          console.error(`${msg} ${line}`);
        });
      }
    }

    var err = (exitCode !== 0 ? `NONZEROEXIT:${exitCode}` : (signal ? `SIG${signal}` : error));
    return [err, stdoutLines];
  };

  /**
   *
   */
  sg.getMacAddress = function(callback) {
    if (sg.macAddress_) { return callback(null, sg.macAddress_); }

    var currInterface, ifaceStats, currIfaceStats = {}, m, value;
    return sg.execEz('ifconfig', [], {}, function(err, lines) {
      _.each(lines, function(line, lineNum) {
        if ((m = line.match(/^([a-z0-9]+):\s*(.*)$/i))) {
          // Are we starting a new section for the interface?
          if (currInterface) {
            // We are on a line that starts an interface, but we are still remembering the previous interface
            analyzeStats();
          }

          currInterface   = m[1];
          currIfaceStats  = {ifaceName: currInterface};
          line            = m[2];
        }

        // Some options are [key: value]; some are [key value]; some are [key=value]
        if ((m = line.match(/([a-z0-9_]+)(:|=)?\s*(.*)$/i))) {
          value = m[3];
          if (m[1] === 'ether') {
            value = value.replace(/\s*/g, '');
          }
          currIfaceStats[m[1]] = value;
        }
      });

      analyzeStats();
      sg.macAddress_ = ifaceStats.ether || sg.macAddress_;

      return callback(null, sg.macAddress_);
    });

    function analyzeStats() {
      if (currIfaceStats.status !== 'active')                                   { return; }
      if (!currIfaceStats.inet)                                                 { return; }
      if (!currIfaceStats.ether.match(/^([a-f0-9]{2}[:]){5}[a-f0-9]{2}$/i))     { return; }

      // Is our new stats better than one we already have?
      if (!ifaceStats) {
        ifaceStats = sg.deepCopy(currIfaceStats);
      } else if (currIfaceStats.ether > ifaceStats.ether) {
        ifaceStats = sg.deepCopy(currIfaceStats);
      }
    }
  };
  sg.macAddress_ = null;

  /**
   *
   */
  sg.getHardwareId = function(callback) {
    return sg.getMacAddress(callback);
  };

  /**
   *  Writes the array of chunks to a file.
   *
   *  @alias module:sgsg.writeChunks
   *
   *  @param {string} path The chunks will be written to the file named by path.
   *  @param {array} chunks The array of chunks to be written.
   */
  sg.writeChunks = function(path, chunks, callback) {

    var stream  = fs.createWriteStream(path);
    var i       = 0;

    // This write function is taken from the Node.js web site.
    write();
    function write() {
      var ok = true;
      do {

        if (i < chunks.length - 1) {
          // see if we should continue, or wait
          // don't pass the callback, because we're not done yet.
          ok = stream.write(chunks[i]);
        } else {
          // last time!
          stream.write(chunks[i], callback);
        }

        i += 1;
      } while (i < chunks.length && ok);

      if (i < chunks.length) {
        // had to stop early!
        // write some more once it drains
        stream.once('drain', write);
      }
    }
  };

  var defAttr = function(obj, key, def_) {
    var defValue = def_ || {};
    obj[key] = obj[key] || defValue;
    return obj[key];
  };

  var incAttr = function(obj, key) {
    obj[key] = (obj[key] || 0) + 1;
    return obj[key];
  };

  sg.DataHouse = function() {
    var self = this;
    self.data = {};

    self.multiKeyCount = function(key, value, mfg) {
      var args = _.toArray(arguments);
      var last = args.pop();
      var obj  = self.data;

      _.each(args, function(arg) {
        obj = defAttr(obj, arg);
      });

      return incAttr(obj, last);
    };
  };



  return sg;
};
