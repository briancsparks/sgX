
/**
 *  sgaws!
 *
 *  AWS driven sane by SG.
 */

exports.load = function(sg, _, options_) {

  var aws             = sg.extlibs.aws      = require('aws-sdk');
  var fs              = sg.extlibs.fs;
  var path            = require('path');
  var util            = require('util');
  var chalk           = require('chalk');
  var deref           = sg.deref;
  var request         = sg.extlibs.superagent;
  var format          = util.format;

  var options         = options_        || {};
  var awsAcct         = options.awsAcct || process.env.SG_AWS_ACCT;

  var swf, lambda, cf, ec2;

  var awsCredentialsHaveBeenSet = false;

  //==================================================================================================================================
  //
  //                                AWS -- Various Setup and Helpers
  //
  //==================================================================================================================================

  /**
   *  AWS is overly particular about what you sent the callback. Usually, you can just pass along whatever
   *  you got, but AWS wants ONLY Error() objects in the err parameter, and if you send something in err,
   *  you better not send anything in the other params.
   */
  sg.awsback = function(callback, err /*, ...*/) {

    if (err) {
      // Yikes, an error.  Must only send the error along, and we should go through great lengths to put it into a form that AWS likes.
      return callback(sg.toError(err));
    }

    // No error -- callback normal
    return callback.apply(this, _.rest(arguments));
  };

  sg.awsTag = function(Tags, key) {
    var result;

    _.each(Tags, function(tag) {
      if (tag.Key === key) {
        result = tag.Value;
      }
    });

    return result;
  };

  sg.setAwsCredentials = function(options_) {
    if (awsCredentialsHaveBeenSet) { return; }

    var options     = options_ || {};
    var filename    = path.join(process.env.HOME, '.aws', 'credentials');

    if (!fs.statSync(filename).isFile()) {
      filename = path.join(process.env.HOME, '.aws', 'config');
    }

    // TODO: remove 'pilotdeveast'
    var profile     = options.profile || 'pilotdeveast';

    awsCredentialsHaveBeenSet = true;
    if (options.ec2key && options.ec2value) {
      aws.config.update({accessKeyId: options.ec2key, secretAccessKey: options.ec2value});
    } else if (process.env.ec2key && process.env.ec2value) {
      aws.config.update({accessKeyId: process.env.ec2key, secretAccessKey: process.env.ec2value});
    } else {
      filename = filename || options.filename;
      if (filename) {
        aws.config.credentials = new aws.SharedIniFileCredentials({profile: 'profile ' + profile});
      }
    }
  };

  //==================================================================================================================================
  //
  //                                AWS -- Lambda
  //
  //==================================================================================================================================

  /**
   *  Invoke the lambda function mod[fName](event, context, callback)
   */
  sg.lambdaLocal = function(mod, fName, event_, context, callback) {

    var event = event_ || {};
    var fn    = mod[fName];

    if (!_.isFunction(fn)) { return callback({Error:"NotAFunction"}); }

    if (_.isString(event)) {
      event = sg.safeJSONParse(event);
    }

    if (_.isFunction(event.getParams)) {
      event = event.getParams({skipArgs:true});
    }

    return fn(event, context, callback);
  };

  sg.lambdaCC = function(args, callIt) {
    var callback = args[2];
    var context  = args[1];
    var event_   = args[0];
    var event    = event_ || {};

    // Normalize the event -- Is is JSON?
    if (_.isString(event_)) {
      event = sg.safeJSONParse(event_, {item:event_});
    }

    // Normalize the event -- is it an ARGV object?
    if (_.isFunction(event.getParams)) {
      event = event.getParams({skipArgs:true});
    }

    return callIt(event, context, callback);
  };

  /**
   *  Make an AWS Lambda object.
   */
  sg.mkLambda = function(options_) {
    if (lambda) { return lambda; }

    var options = options_ || {};
    sg.setAwsCredentials(options);

    options.region = options.region || 'us-east-1';
    return lambda = new aws.Lambda(_.pick(options, 'region'));
  };

  /**
   * Make an SG wrapper for AWS Lambda -- SgLambda()
   */
  sg.SgLambda = function(options_) {
    var self    = this;
    var options = options_ || {};

    self.lambda = sg.mkLambda(options);

    /**
     *  Invoke a lambda function
     */
    self.invoke = function(fName, payload, options_, callback) {
      var options = options_ || {};

      return dynamicData(function(err, instance) {
        if (err) { console.error(err); return callback(err); }

        options.region    = instance.region     || 'us-east-1';
        options.accountId = instance.accountId  || '084075158741';

        var lambdaParams = {
          //FunctionName      : ['arn:aws:lambda:', instance.region, instance.accountId, 'function:yoshi-launch'].join(':'),
          FunctionName      : ['arn:aws:lambda', options.region, options.accountId, 'function', fName].join(':'),
          InvocationType    : 'RequestResponse',
          Payload           : JSON.stringify(payload)
        };

        return lambda.invoke(lambdaParams, function(err, response) {
          return callback(err, response);
        });
      });
    };

    self.getPayload = function(err, response, callback) {

      var payload, errResp;

      if (err) { console.error(err); return callback(err); }

      var payload = response.Payload;
      if (!payload)  { return callback('NoPayload'); }

      if (_.isString(payload)) {
        payload = JSON.parse(payload);
      }

      if ((errResp = payload.errorMessage)) { console.error(errResp); }
      return callback(errResp, payload);
    };
  };

  //==================================================================================================================================
  //
  //                                AWS -- Simple Workflow Framework
  //
  //==================================================================================================================================

  /**
   *  Make an AWS SWF object.
   */
  sg.mkSwf = function(options_) {
    if (swf) { return swf; }

    var options = options_ || {};
    sg.setAwsCredentials(options);

    options.region = options.region || 'us-east-1';
    return swf = new aws.SWF(_.pick(options, 'region'));
  };

  /**
   *  sg's JavaScript-ification of AWS's SWF library.
   *
   *  AWS is very Java-style-centric, but SWF goes over-overboard.  SgSwfWorkflow is a very
   *  JavaScript wrapper.
   *
   */
  sg.SgSwfWorkflow = function(domain, workflowName, options_) {
    var self    = this;

    var options = options_ || {};

    var awsAcct         = options.awsAcct         || process.env.SG_AWS_ACCT;
    var workflowVersion = options.workflowVersion || 'x0099';

    self.swf = sg.mkSwf(options);

    self.registerWorkflow = function(params, callback) {
      var workflowParams = _.defaults(params, {
        domain                : domain,
        name                  : workflowName,
        version               : workflowVersion,
        defaultChildPolicy    : 'REQUEST_CANCEL',

        defaultTaskStartToCloseTimeout        : '' + 1200,       // 20 minutes
        defaultExecutionStartToCloseTimeout   : '' + 3600 * 4    // 4 hour
      });

      return self.swf.registerWorkflowType(workflowParams, function(err, result) {
        if (err && err.code !== 'TypeAlreadyExistsFault') { console.error(sg.inspect(err)); }
        return callback.apply(this, arguments);
      });
    };

    self.registerActivity = function(params, callback) {
      var createVpcActivityParams = _.defaults(params, {
        domain      : domain,
        version     : workflowVersion,

        defaultTaskHeartbeatTimeout       : '' + 300,         // 5 minutes
        defaultTaskScheduleToStartTimeout : '' + 600,
        defaultTaskScheduleToCloseTimeout : '' + 600,
        defaultTaskStartToCloseTimeout    : '' + 600,         // 10 minutes
      });

      return swf.registerActivityType(createVpcActivityParams, function(err, result_) {
        if (err && err.code !== 'TypeAlreadyExistsFault') { console.error(sg.inspect(err)); }
        return callback.apply(this, arguments);
      });
    };

    self.startWorkflow = function(params, callback) {
      var startParams = _.defaults(params, {
        input                 : '',
        domain                : domain,
        workflowId            : sg.randomString(),
        workflowType          : {
          name                  : workflowName,
          version               : workflowVersion,
        }
      });

      return self.swf.startWorkflowExecution(startParams, function(err, result) {
        if (err) { console.error(sg.inspect(err)); }
        return callback.apply(this, arguments);
      });
    };

    self.getDecisionTask = function(params, callback) {
      var getDecisionTaskParams = _.defaults(params, {
        domain    : domain,
      });

      //getDecisionTaskParams.maximumPageSize = 3;

      var result;
      return sg.until(function(again, last, count, elapsed) {
        return swf.pollForDecisionTask(getDecisionTaskParams, function(err, result_) {
          if (err) { return callback(err); }

          if (!result) {
            result = result_;
          } else {
            result.events = result.events.concat(result_.events);
          }

          if (result_.nextPageToken) {
            getDecisionTaskParams.nextPageToken = result_.nextPageToken;
            return again();
          }

          /* otherwise */
          return last();
        });
      }, function() {
        return callback(null, result);
      });
    };

    self.getActivityTask = function(params, callback) {
      var getActivityTaskParams = _.defaults(params, {
        domain    : domain,
      });

      return swf.pollForActivityTask(getActivityTaskParams, function(err, result) {
        return callback(err, result);
      });
    };

    self.scheduleActivityParams = function(taskToken, context) {
      return {
        taskToken         : taskToken,
        decisions         : [],
        executionContext  : JSON.stringify(context)
      };
    };

    self.scheduleActivity = function(scheduleActivityParams, type, input, taskName, saOptions_) {
      var saOptions         = saOptions_                || {};
      var activityPrefix    = saOptions.activityPrefix  || 'activityId-';

      var activity = {
        decisionType  : 'ScheduleActivityTask',

        scheduleActivityTaskDecisionAttributes: {
          activityId    : activityPrefix + sg.randomString(10),
          activityType  : {
            name        : type,   // 'create-vpc'
            version     : workflowVersion
          },
          input         : JSON.stringify(input, null, 2),


          taskList      : { name: taskName /* 'yoshi' */ }
        },
      };

      _.extend(activity.scheduleActivityTaskDecisionAttributes, _.pick(saOptions, 'scheduleToCloseTimeout', 'scheduleToStartTimeout', 'startToCloseTimeout', 'heartbeatTimeout'));

      scheduleActivityParams.decisions.push(activity);
    };

    self.scheduleFinish = function(scheduleActivityParams, result) {
      scheduleActivityParams.decisions.push({
        decisionType  : 'CompleteWorkflowExecution',

        completeWorkflowExecutionDecisionAttributes: {
          result : result
        },
      });
    };

    self.scheduleFail = function(scheduleActivityParams, details, reason) {
      var fail = {
        decisionType  : 'FailWorkflowExecution',

        failWorkflowExecutionDecisionAttributes: {
          details : details
        },
      };

      if (reason) {
        fail.failWorkflowExecutionDecisionAttributes.reason = reason;
      }

      scheduleActivityParams.decisions.push(fail);
    };

    self.taskComplete = function(scheduleActivityParams, callback) {
//      if (scheduleActivityParams.decisions.length > 0) {
        return swf.respondDecisionTaskCompleted(scheduleActivityParams, function(err, result) {
          if (err) { console.error(err); }
          return callback(err, result);
        });
//      }
    };

    self.activityComplete = function(token, result, callback) {
      var activityCompleteParams = {
        taskToken : token,
        //result    : JSON.stringify(_.extend({awsTaskToken:token}, result))
        result    : JSON.stringify(result)
      };

      return swf.respondActivityTaskCompleted(activityCompleteParams, function(err, result) {
        if (err) { console.error(err); }
        return callback(err, result);
      });
    };

    self.activityFailed = function(token, details, reason, callback) {
      var activityCompleteParams = {
        taskToken : token,
        //details    : JSON.stringify(_.extend({awsTaskToken:token}, details))
        details    : JSON.stringify(details),
        reason     : reason
      };

      return swf.respondActivityTaskFailed(activityCompleteParams, function(err, result) {
        if (err) { console.error(err); }
        return callback(err, result);
      });
    };

    self.runWithSsh = function(userCommand, userArgs, ip, token, options_, callback) {
      var options       = options_ || {};
      var scriptFinish  = false;
      var command       = [userCommand].concat(userArgs).join(' ');

      var message       = options.msg         || 'run';
      var name          = options.name        || ip;
      var fail          = options.fail        || function() {};
      var delay         = options.delay       || 2500;
      var maxRuns       = options.maxRuns     || 6;

      //console.log( "runWithSsh", command);
      //console.log( "runWithSsh", name, message, delay);

      var start = _.now();
      sg.until(function(again, last, count, elapsed) {
        if (count > maxRuns) { return fail("Script ran too many times"); }

        var waiting = function() {
          return self.heartbeatAgain(token, format("WaitingFor %s-%s: %d", message, name, +elapsed), 2500, again, true);
        };

        var sshArgs = [ip, '-A', '-o', 'StrictHostKeyChecking no', '-o', 'UserKnownHostsFile=/dev/null', '-o', 'ConnectTimeout=1', command];
        //console.log( "runWithSshArgs", sshArgs);
        sgawsSpawn('/usr/bin/ssh', sshArgs, name, message, function(code) {
          //console.log( format("-----------------------------------activity: ssh %s close", message), name, code);

          if (code === 255) { again.uncount(); }

          if (options.firstTooFast) {
            var sinceStart = _.now() - start;
            console.log( format("-----------------------------------activity: ssh %s close", message), name, code, sinceStart, options.firstTooFast);
            if (code !== 0 && (sinceStart < options.firstTooFast)) {
              return waiting();
            }

            /* otherwise */
            return last();
          }

          /* otherwise */
          if (code === 0)  { return last(); }
          return waiting();
        });
      }, function() {
        scriptFinish = true;
        return callback();
      });

      if (options.heartbeat2) {
        var start = _.now();
        sg.until(function(again2, last2) {
          if (scriptFinish) { return last2(); }

          /* otherwise -- heartbeat */
          return self.heartbeatAgain(token, format("WaitingFor2 %s-%s: %d", message, name, +(_.now() - start)), 2500, again2, true, function(err) {
            if (err) { return last2(); }

            /* otherwise */
            return again2();
          });
        }, function() {
        });
      }
    };

    self.heartbeat = function(token, details, callback) {
      var params = {
        taskToken : token,
        details   : details
      };

      return swf.recordActivityTaskHeartbeat(params, function(err, result) {
        if (err) { console.error('heartbeat', err); }
        return callback(err, result);
      });
    };

    self.heartbeatAgain = function(token, details, time, again, verbose, callback_) {
      var callback = callback_ || function(){};

      if (verbose) {
        //console.log( 'heartbeatAgain', details);
      }

      var params = {
        taskToken : token,
        details   : details
      };

      return swf.recordActivityTaskHeartbeat(params, function(err, result) {
        if (!err) { return again(time); }

        /* otherwise */
        console.error('heartbeatAgain', err);
        if (err.code === 'UnknownResourceFault') {
          return callback(err);
        }

        /* otherwise */
        return again(time);
      });
    };

    self.mkFailFn = function(taskToken, callback) {
      var fail = function(reason) {
        var p = {
          taskToken : taskToken,
          details   : 'fail',
          reason    : reason
        };

        if (_.isString(p.reason)) {
          try {
            p.reason = JSON.parse(str);
          } catch(err) {}
//          p.reason = sg.safeJSONParse(p.reason, p.reason);
        }

        console.error('Error: ', p);
        return swf.respondActivityTaskFailed(p, function(err, result) {
          return callback(reason);
        });
      };

      return fail;
    };

    self.commonJsify = function(x) {
      var result = JSON.parse(JSON.stringify(x));

      if (_.isString(result.input)) {
        result.input = JSON.parse(result.input);
      } else if (_.isString(result.executionContext)) {
        result.executionContext = JSON.parse(result.executionContext);
      } else if (_.isString(result.result)) {
        result.result = JSON.parse(result.result);
      }

      return result;
    };

    self.jsifyExeHistory = function(hist) {
      var result = JSON.parse(JSON.stringify(hist));    // Deep copy
      var events = sg.extract(result, 'events');
      var i;

      result.__origAws  = {};
      result.events     = [];

      if (!events) { return result; }

      result.__origAws.events = JSON.parse(JSON.stringify(events));

      _.each(events, function(event_) {
        // Put empty objects in all spots
        for (i = 0; i < event_.eventId; i += 1) {
          result.events[i] = result.events[i] || {};
        }

        var event = result.events[event_.eventId] = event_;

        event.attrs = {};
        if (event.eventType === 'WorkflowExecutionStarted') {
          event.attrs = self.commonJsify(sg.extract(event, 'workflowExecutionStartedEventAttributes'));
          result.input = event.attrs.input;

        } else if (event.eventType === 'DecisionTaskScheduled') {
          event.attrs = self.commonJsify(sg.extract(event, 'decisionTaskScheduledEventAttributes'));
        } else if (event.eventType === 'DecisionTaskStarted') {
          event.attrs = self.commonJsify(sg.extract(event, 'decisionTaskStartedEventAttributes'));
        } else if (event.eventType === 'DecisionTaskCompleted') {
          event.attrs = self.commonJsify(sg.extract(event, 'decisionTaskCompletedEventAttributes'));

        } else if (event.eventType === 'ActivityTaskScheduled') {
          event.attrs = self.commonJsify(sg.extract(event, 'activityTaskScheduledEventAttributes'));
        } else if (event.eventType === 'ActivityTaskStarted') {
          event.attrs = self.commonJsify(sg.extract(event, 'activityTaskStartedEventAttributes'));
        } else if (event.eventType === 'ActivityTaskCompleted') {
          event.attrs = self.commonJsify(sg.extract(event, 'activityTaskCompletedEventAttributes'));

        } else if (event.eventType === 'ActivityTaskFailed') {
          event.attrs = self.commonJsify(sg.extract(event, 'activityTaskFailedEventAttributes'));
        }

        if (_.isNumber(event.attrs.scheduledEventId)) {
          event.attrs.scheduledEvent = result.events[event.attrs.scheduledEventId];
        }

        if (_.isNumber(event.attrs.startedEventId)) {
          event.attrs.startedEvent = result.events[event.attrs.startedEventId];
        }
      });

      return result;
    }
  };

  //==================================================================================================================================
  //
  //                                AWS -- Cloud Formation
  //
  //==================================================================================================================================

  sg.mkCloudFormation = function(options_) {
    if (cf) { return cf; }

    var options = options_ || {};
    sg.setAwsCredentials(options);

    options.region = options.region || 'us-east-1';
    return cf = new aws.CloudFormation(_.pick(options, 'region'));
  };

  //==================================================================================================================================
  //
  //                                AWS -- EC2
  //
  //==================================================================================================================================

  sg.mkEc2 = function(options_) {
    if (ec2) { return ec2; }

    var options = options_ || {};
    sg.setAwsCredentials(options);

    options.region = options.region || 'us-east-1';
    return ec2 = new aws.EC2(_.pick(options, 'region'));
  };

  function dynamicData(callback) {
    return request.get('http://169.254.169.254/latest/dynamic/instance-identity/document') .end(function(err, result) {
      return callback(err, result);
    });
  }

  function sshStdxyz(xyz, displayIp_, displayMsg_, labelColor, contentColor) {
    var displayIp   = sg.pad(displayIp_, 15);
    var displayMsg  = sg.pad(displayMsg_, 12);

    if (sg.verbosity() > 1) {
      return function(line) {
        process[xyz].write(chalk[labelColor](displayIp) +  ' ' + displayMsg + ' - ' + chalk[contentColor](line));
      };
    }

    /* otherwise */
    if (sg.verbosity() === 1) {
      return function(line) {
        process[xyz].write('.');
      };
    }

    /* otherwise */
    return function(){};
  };

  function sshStdout(displayIp, displayMsg) {
    return sshStdxyz('stdout', displayIp, displayMsg, 'cyan', 'reset');
  };

  function sshStderr(displayIp, displayMsg) {
    return sshStdxyz('stderr', displayIp, displayMsg, 'red', 'red');
  };

  function sgawsSpawn(command, args, displayIp, displayMsg, callback) {
    return sg.spawnEz(command, args, {
      newline : true,

      stderr  : sshStderr(displayIp, displayMsg),
      stdout  : sshStdout(displayIp, displayMsg),

      close: function(code) {
        return callback.apply(this, arguments);
      }
    });
  };

  return sg;
};




