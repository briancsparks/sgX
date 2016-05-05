
/**
 *  sgaws!
 *
 *  AWS driven sane by SG.
 */

exports.load = function(sg, _, options_) {

  var aws             = sg.extlibs.aws      = require('aws-sdk');
  var fs              = sg.extlibs.fs;
  var path            = require('path');
  var deref           = sg.deref;

  var options         = options_        || {};
  var awsAcct         = options.awsAcct || process.env.SG_AWS_ACCT;

  var swf, lambda, cf, ec2;

  var awsCredentialsHaveBeenSet = false;
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

  sg.mkSwf = function(options_) {
    if (swf) { return swf; }

    var options = options_ || {};
    sg.setAwsCredentials(options);

    options.region = options.region || 'us-east-1';
    return swf = new aws.SWF(_.pick(options, 'region'));
  };

  sg.mkLambda = function(options_) {
    if (lambda) { return lambda; }

    var options = options_ || {};
    sg.setAwsCredentials(options);

    options.region = options.region || 'us-east-1';
    return lambda = new aws.Lambda(_.pick(options, 'region'));
  };

  sg.mkCloudFormation = function(options_) {
    if (cf) { return cf; }

    var options = options_ || {};
    sg.setAwsCredentials(options);

    options.region = options.region || 'us-east-1';
    return cf = new aws.CloudFormation(_.pick(options, 'region'));
  };

  sg.mkEc2 = function(options_) {
    if (ec2) { return ec2; }

    var options = options_ || {};
    sg.setAwsCredentials(options);

    options.region = options.region || 'us-east-1';
    return ec2 = new aws.EC2(_.pick(options, 'region'));
  };

  sg.SgLambda = function(options_) {
    var self    = this;
    var options = options_ || {};

    self.lambda = sg.mkLambda(options);

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

        defaultTaskStartToCloseTimeout        : '' + 600,        // 10 minutes
        defaultExecutionStartToCloseTimeout   : '' + 3600        // 1 hour
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

        defaultTaskHeartbeatTimeout       : '' + 60,
        defaultTaskScheduleToStartTimeout : '' + 600,
        defaultTaskScheduleToCloseTimeout : '' + 600,
        defaultTaskStartToCloseTimeout    : '' + 600,        // 10 minutes
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

      return swf.pollForDecisionTask(getDecisionTaskParams, function(err, result) {
        return callback(err, result);
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

      scheduleActivityParams.decisions.push({
        decisionType  : 'ScheduleActivityTask',

        scheduleActivityTaskDecisionAttributes: {
          activityId    : activityPrefix + sg.randomString(10),
          activityType  : {
            name        : type,   // 'create-vpc'
            version     : workflowVersion
          },
          input         : JSON.stringify(input),

          scheduleToCloseTimeout  : '' + (saOptions.scheduleToCloseTimeout || 600),
          scheduleToStartTimeout  : '' + (saOptions.scheduleToStartTimeout || 600),
          startToCloseTimeout     : '' + (saOptions.startToCloseTimeout    || 600),

          taskList      : { name: taskName /* 'yoshi' */ }
        },
      });
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
      if (scheduleActivityParams.decisions.length > 0) {
        return swf.respondDecisionTaskCompleted(scheduleActivityParams, function(err, result) {
          if (err) { console.error(err); }
          return callback(err, result);
        });
      }
    };

    self.activityComplete = function(token, result, callback) {
      var activityCompleteParams = {
        taskToken : token,
        result    : JSON.stringify(result)
      };

      return swf.respondActivityTaskCompleted(activityCompleteParams, function(err, result) {
        if (err) { console.error(err); }
        return callback(err, result);
      });
    };

    self.heartbeat = function(token, details, callback) {
      var params = {
        taskToken : token,
        details   : details
      };

      return swf.recordActivityTaskHeartbeat(params, function(err, result) {
        if (err) { console.error(err); }
        return callback(err, result);
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
          p.reason = sg.safeJSONParse(p.reason, p.reason);
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


  return sg;
};



